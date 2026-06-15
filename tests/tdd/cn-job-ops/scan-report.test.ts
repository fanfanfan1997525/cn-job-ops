import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { completeProfile, loadCases, tempWorkspace } from "./helpers.js";
import { evaluateJob } from "../../../src/evaluation.js";
import { FixtureProvider } from "../../../src/providers/fixture.js";
import { generateWeeklyReport } from "../../../src/reports.js";
import { runScan, saveSearchProfile } from "../../../src/scan.js";
import { JobTracker } from "../../../src/tracker.js";

describe("scan and report workflow", () => {
  it("runs saved searches, records provider health, and evaluates only new or changed jobs", async () => {
    const ws = tempWorkspace();
    try {
      const tracker = new JobTracker(join(ws.dir, "tracker.sqlite"));
      tracker.init();
      const searchPath = saveSearchProfile(ws.dir, {
        name: "ai-pm-shanghai",
        keywords: ["AI"],
        cities: ["上海"],
        salaryMinK: 30,
        providers: ["fixture"],
        exclusions: ["培训贷"]
      });
      let evaluations = 0;
      const provider = new FixtureProvider(loadCases().map((c) => c.raw));
      const first = await runScan({
        tracker,
        profile: completeProfile,
        searchProfilePath: searchPath,
        evalVersion: "rubric-v1",
        providers: [provider],
        evaluate: (job, profile) => {
          evaluations += 1;
          return evaluateJob(job, profile);
        }
      });
      const second = await runScan({
        tracker,
        profile: completeProfile,
        searchProfilePath: searchPath,
        evalVersion: "rubric-v1",
        providers: [provider],
        evaluate: (job, profile) => {
          evaluations += 1;
          return evaluateJob(job, profile);
        }
      });
      const third = await runScan({
        tracker,
        profile: completeProfile,
        searchProfilePath: searchPath,
        evalVersion: "rubric-v2",
        providers: [provider],
        evaluate: (job, profile) => {
          evaluations += 1;
          return evaluateJob(job, profile, { rubricVersion: "rubric-v2" });
        }
      });

      expect(first.providerHealth[0].status).toBe("success");
      expect(second.evaluatedJobIds).toHaveLength(0);
      expect(third.evaluatedJobIds.length).toBe(first.evaluatedJobIds.length);
      expect(evaluations).toBe(first.evaluatedJobIds.length + third.evaluatedJobIds.length);
      tracker.close();
    } finally {
      ws.cleanup();
    }
  });

  it("keeps provider failures distinct from empty results and writes a weekly report", async () => {
    const ws = tempWorkspace();
    try {
      const tracker = new JobTracker(join(ws.dir, "tracker.sqlite"));
      tracker.init();
      const provider = new FixtureProvider(loadCases().map((c) => c.raw));
      const searchPath = saveSearchProfile(ws.dir, {
        name: "rate-limit",
        keywords: ["rate-limit"],
        cities: ["上海"],
        providers: ["fixture"],
        exclusions: []
      });
      const scan = await runScan({ tracker, profile: completeProfile, searchProfilePath: searchPath, providers: [provider] });
      expect(scan.providerHealth[0]).toMatchObject({ status: "rate_limited" });
      expect(scan.importedJobIds).toHaveLength(0);

      const report = generateWeeklyReport({ tracker, scanRuns: [scan], profile: completeProfile });
      expect(report).toContain("High-score jobs");
      expect(report).toContain("Rejected-risk jobs");
      expect(report).toContain("Provider failures");
      expect(report).toContain("rate_limited");
      tracker.close();
    } finally {
      ws.cleanup();
    }
  });
});
