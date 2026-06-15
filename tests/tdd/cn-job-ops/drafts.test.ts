import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { completeProfile, loadCases, tempWorkspace } from "./helpers.js";
import { generateDraftArtifacts, generateDraftSet } from "../../../src/drafts.js";
import { evaluateJob } from "../../../src/evaluation.js";
import { normalizeJob } from "../../../src/jobs/normalize.js";

describe("draft generation with human approval boundary", () => {
  it("generates resume, cover note, and BOSS/Liepin greeting drafts from grounded facts", () => {
    const job = normalizeJob(loadCases()[0].raw);
    const evaluation = evaluateJob(job, completeProfile);
    const drafts = generateDraftSet(job, completeProfile, evaluation);
    expect(drafts.resumeMarkdown).toContain("DRAFT - REVIEW REQUIRED");
    expect(drafts.coverNoteMarkdown).toContain("DRAFT - REVIEW REQUIRED");
    expect(drafts.greetingVariants).toHaveLength(3);
    for (const fact of completeProfile.cvFacts) {
      expect(drafts.resumeMarkdown).toContain(fact);
    }
    expect(drafts.coverNoteMarkdown).toContain(evaluation.blocks[1].evidence[0]);
    expect(drafts.provenance.every((entry) => entry.sourceField.length > 0 && entry.claim.length > 0)).toBe(true);
    expect(drafts.unsupportedClaims).toEqual([]);
  });

  it("does not fabricate missing credentials, employers, dates, or metrics", () => {
    const profile = { ...completeProfile, cvFacts: ["Coordinated product delivery for enterprise customers"] };
    const job = normalizeJob(loadCases()[0].raw);
    const drafts = generateDraftSet(job, profile, evaluateJob(job, profile));
    expect(drafts.resumeMarkdown).not.toContain("PhD");
    expect(drafts.resumeMarkdown).not.toContain("10x");
    expect(drafts.resumeMarkdown).not.toContain("Google");
    expect(drafts.resumeMarkdown).not.toContain("2019");
    expect(drafts.unsupportedClaims).toEqual([]);
  });

  it("saves draft files locally and never triggers provider side effects", () => {
    const ws = tempWorkspace();
    let providerSideEffects = 0;
    try {
      const job = normalizeJob(loadCases()[0].raw);
      const evaluation = evaluateJob(job, completeProfile);
      const result = generateDraftArtifacts({
        outputDir: ws.dir,
        job,
        profile: completeProfile,
        evaluation,
        externalActionProbe: () => {
          providerSideEffects += 1;
        }
      });
      expect(result.files.length).toBeGreaterThanOrEqual(3);
      expect(result.files.every((file) => existsSync(file))).toBe(true);
      expect(readFileSync(result.files[0], "utf8")).toContain("DRAFT - REVIEW REQUIRED");
      expect(providerSideEffects).toBe(0);
    } finally {
      ws.cleanup();
    }
  });
});
