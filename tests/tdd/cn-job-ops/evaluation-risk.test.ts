import { describe, expect, it } from "vitest";
import { completeProfile, loadCases } from "./helpers.js";
import { evaluateJob, EvaluationCache } from "../../../src/evaluation.js";
import { normalizeJob } from "../../../src/jobs/normalize.js";

describe("evaluation and domestic risk engine", () => {
  it("produces seven rubric blocks, evidence, confidence, and threshold recommendations", () => {
    for (const testCase of loadCases()) {
      const report = evaluateJob(normalizeJob(testCase.raw), completeProfile, { now: new Date("2026-06-15T00:00:00.000Z") });
      expect(report.blocks.map((b) => b.id)).toEqual([
        "role_summary",
        "cv_match",
        "gaps",
        "level_strategy",
        "compensation_sanity",
        "personalization",
        "interview_prep",
        "posting_legitimacy_risk"
      ]);
      expect(report.blocks.every((b) => b.evidence.length >= 1)).toBe(true);
      expect(report.confidence).toMatch(/high|medium|low/);
      if (testCase.expected.scoreAtLeast !== undefined) expect(report.score).toBeGreaterThanOrEqual(testCase.expected.scoreAtLeast);
      if (testCase.expected.scoreBelow !== undefined) expect(report.score).toBeLessThan(testCase.expected.scoreBelow);
      expect(report.recommendation).toBe(testCase.expected.recommendation);
      expect(report.risk.flags).toEqual(expect.arrayContaining(testCase.expected.riskFlags));
      for (const risk of report.risk.evidence) expect(risk.matchedText.length).toBeGreaterThan(0);
    }
  });

  it("defaults jobs below 4.0 to do-not-apply unless explicit override is requested", () => {
    const lowFit = normalizeJob(loadCases().find((c) => c.id === "low-fit-embedded").raw);
    expect(evaluateJob(lowFit, completeProfile).recommendation).toBe("do_not_apply");
    expect(evaluateJob(lowFit, completeProfile, { overrideBelowThreshold: true }).recommendation).toBe("manual_override_review");
  });

  it("uses hard risk veto even when the fit score is high", () => {
    const highFitScam = normalizeJob({
      ...loadCases()[0].raw,
      url: "https://example.test/jobs/high-fit-scam",
      description: `${loadCases()[0].raw.description} 入职前需要缴纳培训贷和保证金。`
    });
    const report = evaluateJob(highFitScam, completeProfile, { overrideBelowThreshold: true });
    expect(report.fitScore).toBeGreaterThanOrEqual(4);
    expect(report.risk.veto).toBe(true);
    expect(report.recommendation).toBe("manual_override_review");
    expect(report.risk.flags).toEqual(expect.arrayContaining(["training_loan", "upfront_fee"]));
  });

  it("caches evaluations by job content hash and profile version", () => {
    const cache = new EvaluationCache();
    const job = normalizeJob(loadCases()[0].raw);
    const first = evaluateJob(job, completeProfile, { cache });
    const second = evaluateJob(job, completeProfile, { cache });
    const newRubric = evaluateJob(job, completeProfile, { cache, rubricVersion: "rubric-v-next" });
    expect(second.cacheHit).toBe(true);
    expect(second.score).toBe(first.score);
    expect(newRubric.cacheHit).toBe(false);
    expect(cache.stats()).toEqual({ hits: 1, misses: 2, size: 2 });
  });
});
