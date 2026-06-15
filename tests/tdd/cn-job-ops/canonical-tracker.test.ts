import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { completeProfile, loadCases, tempWorkspace } from "./helpers.js";
import { normalizeJob, stableJobFingerprint } from "../../../src/jobs/normalize.js";
import { JobTracker } from "../../../src/tracker.js";

describe("canonical data and tracker", () => {
  it("normalizes all synthetic provider inputs into canonical jobs", () => {
    for (const testCase of loadCases()) {
      const job = normalizeJob(testCase.raw);
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.company.length).toBeGreaterThan(0);
      expect(job.source.fetchedAt).toMatch(/T/);
      expect(job.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(job.salary.minK).toBe(testCase.expected.salaryMinK);
      expect(job.salary.maxK).toBe(testCase.expected.salaryMaxK);
      expect(job.salary.raw).toBe(testCase.raw.salary);
      expect(Array.isArray(job.cities)).toBe(true);
      expect(job.dedupKey.length).toBeGreaterThan(8);
    }
    expect(normalizeJob(loadCases()[0].raw).salary.monthsPerYear).toBe(14);
    expect(normalizeJob(loadCases().find((c) => c.id === "missing-salary").raw).salary.isNegotiable).toBe(true);
    expect(normalizeJob(loadCases().find((c) => c.id === "multi-city-parse-change").raw).cities).toEqual(["上海", "杭州"]);
  });

  it("keeps canonical fingerprints stable under whitespace and tag-order changes", () => {
    const raw = loadCases()[0].raw;
    const a = normalizeJob(raw);
    const b = normalizeJob({
      ...raw,
      tags: [...raw.tags].reverse(),
      description: `  ${raw.description.replaceAll("、", " 、 ")}  `
    });
    expect(stableJobFingerprint(a)).toBe(stableJobFingerprint(b));
    expect(a.dedupKey).toBe(b.dedupKey);
  });

  it("deduplicates by URL, tracks status history, and exports without profile secrets", () => {
    const ws = tempWorkspace();
    try {
      const tracker = new JobTracker(join(ws.dir, "tracker.sqlite"));
      tracker.init();
      const first = tracker.upsertJob(normalizeJob(loadCases()[0].raw));
      const duplicate = tracker.upsertJob(normalizeJob(loadCases().find((c) => c.id === "duplicate-url").raw));
      expect(duplicate.id).toBe(first.id);
      expect(tracker.listJobs()).toHaveLength(1);
      expect(tracker.listSources(first.id).length).toBeGreaterThanOrEqual(1);

      const alternateSource = normalizeJob({
        ...loadCases()[0].raw,
        providerId: "mcp-jobs",
        platform: "mcp-jobs",
        url: "https://another.example/jobs/north-star-ai-platform"
      });
      tracker.upsertJob(alternateSource);
      expect(tracker.listJobs()).toHaveLength(1);
      expect(tracker.listSources(first.id).map((s) => s.providerId)).toEqual(expect.arrayContaining(["fixture", "mcp-jobs"]));

      tracker.updateStatus(first.id, "shortlisted", "score >= 4.0");
      tracker.updateStatus(first.id, "drafted", "draft generated");
      expect(tracker.getStatusHistory(first.id).map((h) => h.status)).toEqual(["discovered", "shortlisted", "drafted"]);

      const markdown = tracker.exportMarkdown({ profile: completeProfile });
      const tsv = tracker.exportTsv({ profile: completeProfile });
      expect(markdown).toContain("North Star AI");
      expect(tsv).toContain("AI Platform Product Manager");
      expect(markdown).not.toContain("alice@example.test");
      expect(tsv).not.toContain("13800138000");
      expect(tsv).not.toMatch(/\t.*\n.*\t\t/);
      tracker.close();
    } finally {
      ws.cleanup();
    }
  });

  it("keeps dedup idempotent and commutative across ingestion order", () => {
    const ws = tempWorkspace();
    try {
      const a = normalizeJob(loadCases()[0].raw);
      const b = normalizeJob(loadCases().find((c) => c.id === "duplicate-url").raw);
      const first = new JobTracker(join(ws.dir, "a.sqlite"));
      const second = new JobTracker(join(ws.dir, "b.sqlite"));
      first.init();
      second.init();
      first.upsertJob(a);
      first.upsertJob(b);
      second.upsertJob(b);
      second.upsertJob(a);
      expect(first.listJobs().map((j) => j.dedupKey)).toEqual(second.listJobs().map((j) => j.dedupKey));
      first.close();
      second.close();
    } finally {
      ws.cleanup();
    }
  });
});
