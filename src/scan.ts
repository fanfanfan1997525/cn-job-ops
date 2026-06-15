import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalJob, EvaluationReport, ProviderResult, ProviderSearchQuery, UserProfile } from "./types.js";
import { DEFAULT_RUBRIC_VERSION, evaluateJob } from "./evaluation.js";
import type { JobTracker } from "./tracker.js";

export interface SearchProfile {
  name: string;
  keywords: string[];
  cities: string[];
  salaryMinK?: number;
  salaryMaxK?: number;
  providers: string[];
  exclusions: string[];
}

export interface SearchProvider {
  id: string;
  search(query: ProviderSearchQuery): Promise<ProviderResult>;
}

export interface ScanRun {
  id: string;
  searchName: string;
  startedAt: string;
  providerHealth: Array<{ providerId: string; status: string; failureReason?: string; jobsReturned: number }>;
  importedJobIds: string[];
  evaluatedJobIds: string[];
}

export function saveSearchProfile(workspaceDir: string, profile: SearchProfile) {
  const dir = join(workspaceDir, "searches");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${profile.name}.json`);
  writeFileSync(path, JSON.stringify(profile, null, 2), "utf8");
  return path;
}

export async function runScan(input: {
  tracker: JobTracker;
  profile: UserProfile;
  searchProfilePath: string;
  providers: SearchProvider[];
  evalVersion?: string;
  evaluate?: (job: CanonicalJob, profile: UserProfile) => EvaluationReport;
}): Promise<ScanRun> {
  const search = JSON.parse(readFileSync(input.searchProfilePath, "utf8")) as SearchProfile;
  const run: ScanRun = {
    id: `scan_${Date.now()}`,
    searchName: search.name,
    startedAt: new Date().toISOString(),
    providerHealth: [],
    importedJobIds: [],
    evaluatedJobIds: []
  };
  const evalVersion = input.evalVersion ?? DEFAULT_RUBRIC_VERSION;
  for (const provider of input.providers) {
    if (!search.providers.includes(provider.id)) continue;
    for (const keyword of search.keywords) {
      const result = await provider.search({ keyword, cities: search.cities, salaryMinK: search.salaryMinK, salaryMaxK: search.salaryMaxK });
      run.providerHealth.push({ providerId: provider.id, status: result.status, failureReason: result.failureReason, jobsReturned: result.jobs.length });
      if (result.status !== "success") continue;
      for (const job of result.jobs) {
        if (search.exclusions.some((exclusion) => `${job.title} ${job.description}`.includes(exclusion))) continue;
        const stored = input.tracker.upsertJob(job);
        if (!run.importedJobIds.includes(stored.id)) run.importedJobIds.push(stored.id);
        if (!input.tracker.hasEvaluation(stored.id, evalVersion, input.profile.version, stored.contentHash)) {
          const report = input.evaluate ? input.evaluate(stored, input.profile) : evaluateJob(stored, input.profile, { rubricVersion: evalVersion });
          input.tracker.recordEvaluation(stored.id, { ...report, jobId: stored.id, rubricVersion: evalVersion });
          run.evaluatedJobIds.push(stored.id);
          if (report.recommendation === "apply") input.tracker.updateStatus(stored.id, "shortlisted", "score >= threshold", "scan");
          if (report.recommendation === "do_not_apply") input.tracker.updateStatus(stored.id, "rejected", "score/risk below threshold", "scan");
        }
      }
    }
  }
  return run;
}
