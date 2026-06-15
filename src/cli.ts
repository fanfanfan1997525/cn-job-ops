#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateDraftArtifacts } from "./drafts.js";
import { evaluateJob } from "./evaluation.js";
import { FixtureProvider } from "./providers/fixture.js";
import { LiepinOfficialProvider } from "./providers/liepinOfficial.js";
import { ManualImportProvider } from "./providers/manual.js";
import { getProviderDescriptors } from "./providers/registry.js";
import { readProfile, validateProfile } from "./profile.js";
import { generateWeeklyReport } from "./reports.js";
import { runScan, saveSearchProfile } from "./scan.js";
import { JobTracker } from "./tracker.js";
import type { RawJobInput, StoredJob } from "./types.js";
import { initializeWorkspace } from "./workspace.js";

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

export async function runCli(args: string[], options: { cwd?: string } = {}): Promise<CliResult> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const command = args[0] ?? "help";
  try {
    switch (command) {
      case "init": {
        const workspace = argValue(args, "--workspace") ?? join(cwd, ".cn-job-ops");
        const result = initializeWorkspace({ projectRoot: cwd, workspaceDir: resolve(cwd, workspace) });
        return ok(`Initialized CN Job Ops workspace at ${result.runtimeDir}\n`);
      }
      case "providers": {
        return ok(`${getProviderDescriptors().map((d) => `${d.id}\t${d.approvalStatus}\t${d.executable ? "executable" : "descriptor-only"}`).join("\n")}\n`);
      }
      case "fixture-search": {
        const workspace = workspaceArg(args, cwd);
        const fixture = requiredArg(args, "--fixture");
        const keyword = argValue(args, "--keyword") ?? "AI";
        const raws = JSON.parse(readFileSync(resolve(cwd, fixture), "utf8")) as RawJobInput[];
        const provider = new FixtureProvider(raws);
        const result = await provider.search({ keyword });
        const tracker = openTracker(workspace);
        let imported = 0;
        for (const job of result.jobs) {
          tracker.upsertJob(job);
          imported += 1;
        }
        tracker.close();
        return ok(`fixture-search ${result.status}: imported ${imported}\n`);
      }
      case "liepin-search": {
        const workspace = workspaceArg(args, cwd);
        const keyword = requiredArg(args, "--keyword");
        const tokenEnv = argValue(args, "--token-env") ?? "LIEPIN_USER_TOKEN";
        if (!process.env[tokenEnv]) return fail(`liepin-search login_required: missing ${tokenEnv}\n`);
        const provider = new LiepinOfficialProvider({
          enabled: true,
          command: argValue(args, "--command"),
          tokenEnv
        });
        const result = await provider.search({
          keyword,
          cities: argValue(args, "--city") ? [argValue(args, "--city") as string] : undefined,
          salaryMinK: numberArg(args, "--salary-min-k"),
          salaryMaxK: numberArg(args, "--salary-max-k")
        });
        if (result.status !== "success" && result.status !== "empty") {
          return fail(`liepin-search ${result.status}: ${result.failureReason ?? result.status}\n`);
        }
        if (result.status === "empty") return ok("liepin-search empty: imported 0\n");
        const tracker = openTracker(workspace);
        let imported = 0;
        for (const job of result.jobs) {
          tracker.upsertJob(job);
          imported += 1;
        }
        tracker.close();
        return ok(`liepin-search ${result.status}: imported ${imported}\n`);
      }
      case "manual-import": {
        const workspace = workspaceArg(args, cwd);
        const file = requiredArg(args, "--file");
        const raw = JSON.parse(readFileSync(resolve(cwd, file), "utf8")) as RawJobInput;
        const provider = new ManualImportProvider();
        const result = await provider.importJob(raw);
        const tracker = openTracker(workspace);
        for (const job of result.jobs) tracker.upsertJob(job);
        tracker.close();
        return ok(`manual-import ${result.status}: imported ${result.jobs.length}\n`);
      }
      case "evaluate": {
        const workspace = workspaceArg(args, cwd);
        const profile = readProfile(workspace);
        const validation = validateProfile(profile);
        if (!validation.ok) return fail(`Profile incomplete: ${validation.missing.join(", ")}\n`);
        const tracker = openTracker(workspace);
        const jobs = args.includes("--all") ? tracker.listJobs() : [tracker.getJob(requiredArg(args, "--job"))];
        const lines: string[] = [];
        for (const job of jobs) {
          const report = evaluateJob(job, profile);
          tracker.recordEvaluation(job.id, { ...report, jobId: job.id });
          if (report.recommendation === "apply") tracker.updateStatus(job.id, "shortlisted", "score >= threshold", "cli");
          if (report.recommendation === "do_not_apply") tracker.updateStatus(job.id, "rejected", "score/risk below threshold", "cli");
          lines.push(`${job.id}\t${report.score.toFixed(1)}\t${report.recommendation}`);
        }
        tracker.close();
        return ok(`${lines.join("\n")}\n`);
      }
      case "draft": {
        const workspace = workspaceArg(args, cwd);
        const profile = readProfile(workspace);
        const tracker = openTracker(workspace);
        const job = args.includes("--first-shortlisted") ? firstShortlisted(tracker.listJobs()) : tracker.getJob(requiredArg(args, "--job"));
        if (!job) return fail("No shortlisted job found\n");
        const report = tracker.latestEvaluation(job.id) ?? evaluateJob(job, profile);
        const artifacts = generateDraftArtifacts({ outputDir: join(workspace, "drafts"), job, profile, evaluation: report });
        tracker.updateStatus(job.id, "drafted", "draft artifacts generated", "cli");
        tracker.close();
        return ok(`drafted ${job.id}\n${artifacts.files.join("\n")}\n`);
      }
      case "export": {
        const workspace = workspaceArg(args, cwd);
        const format = argValue(args, "--format") ?? "markdown";
        const profile = existsSync(join(workspace, "profile.json")) ? readProfile(workspace) : undefined;
        const tracker = openTracker(workspace);
        const output = format === "tsv" ? tracker.exportTsv({ profile }) : tracker.exportMarkdown({ profile });
        tracker.close();
        return ok(`${output}\n`);
      }
      case "dashboard": {
        const workspace = workspaceArg(args, cwd);
        const tracker = openTracker(workspace);
        const output = renderDashboard(tracker);
        tracker.close();
        return ok(output);
      }
      case "scan": {
        const workspace = workspaceArg(args, cwd);
        const fixture = requiredArg(args, "--fixture");
        const keyword = argValue(args, "--keyword") ?? "AI";
        const raws = JSON.parse(readFileSync(resolve(cwd, fixture), "utf8")) as RawJobInput[];
        const profile = readProfile(workspace);
        const tracker = openTracker(workspace);
        const searchPath = saveSearchProfile(workspace, { name: "cli-scan", keywords: [keyword], cities: profile.targets.cities, providers: ["fixture"], exclusions: profile.redLines });
        const run = await runScan({ tracker, profile, searchProfilePath: searchPath, providers: [new FixtureProvider(raws)] });
        tracker.close();
        return ok(`scan ${run.id}: imported ${run.importedJobIds.length}, evaluated ${run.evaluatedJobIds.length}\n`);
      }
      case "report": {
        const workspace = workspaceArg(args, cwd);
        const tracker = openTracker(workspace);
        const profile = readProfile(workspace);
        const output = generateWeeklyReport({ tracker, scanRuns: [], profile });
        tracker.close();
        return ok(`${output}\n`);
      }
      case "smoke": {
        const workspace = workspaceArg(args, cwd);
        initializeWorkspace({ projectRoot: cwd, workspaceDir: workspace });
        return ok(`smoke workspace initialized at ${workspace}\n`);
      }
      default:
        return ok(help());
    }
  } catch (error) {
    return fail(`${error instanceof Error ? error.message : String(error)}\n`);
  }
}

function renderDashboard(tracker: JobTracker) {
  const jobs = tracker.listJobs();
  const lines = ["CN Job Ops Dashboard", "====================", jobs.length ? "" : "No jobs yet.", ""];
  for (const job of jobs.slice(0, 100)) {
    const evaluation = tracker.latestEvaluation(job.id);
    lines.push(`${job.currentStatus.toUpperCase()} | ${job.company} | ${job.title} | ${job.city}`);
    lines.push(`Score: ${evaluation?.score.toFixed(1) ?? "-"} | Recommendation: ${evaluation?.recommendation ?? "-"}`);
    lines.push(`Evidence: ${evaluation?.blocks[1]?.evidence[0] ?? "not evaluated"}`);
    lines.push(`Risks: ${evaluation?.risk.flags.join(", ") || "none"}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function openTracker(workspace: string) {
  const tracker = new JobTracker(join(workspace, "tracker.sqlite"));
  tracker.init();
  return tracker;
}

function firstShortlisted(jobs: StoredJob[]) {
  return jobs.find((job) => job.currentStatus === "shortlisted") ?? jobs[0] ?? null;
}

function workspaceArg(args: string[], cwd: string) {
  return resolve(cwd, argValue(args, "--workspace") ?? ".cn-job-ops");
}

function argValue(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function numberArg(args: string[], name: string) {
  const value = argValue(args, name);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`invalid numeric argument ${name}`);
  return parsed;
}

function requiredArg(args: string[], name: string) {
  const value = argValue(args, name);
  if (!value) throw new Error(`missing required argument ${name}`);
  return value;
}

function ok(stdout: string): CliResult {
  return { code: 0, stdout, stderr: "" };
}

function fail(stderr: string): CliResult {
  return { code: 1, stdout: "", stderr };
}

function help() {
  return `cn-job-ops commands:
  init --workspace <dir>
  providers
  fixture-search --workspace <dir> --fixture <json> --keyword <term>
  liepin-search --workspace <dir> --keyword <term> --command <absolute official MCP command path> [--city <city>] [--salary-min-k <n>] [--salary-max-k <n>] [--token-env LIEPIN_USER_TOKEN]
  manual-import --workspace <dir> --file <json>
  evaluate --workspace <dir> --all
  draft --workspace <dir> --first-shortlisted
  export --workspace <dir> --format markdown|tsv
  dashboard --workspace <dir>
  scan --workspace <dir> --fixture <json> --keyword <term>
  report --workspace <dir>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runCli(process.argv.slice(2));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
