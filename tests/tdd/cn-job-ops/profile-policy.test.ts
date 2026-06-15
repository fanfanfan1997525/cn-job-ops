import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { completeProfile, tempWorkspace } from "./helpers.js";
import { buildRedactedPrompt } from "../../../src/aiBoundary.js";
import { initializeWorkspace } from "../../../src/workspace.js";
import { readProfile, redactText, validateProfile, writeProfile } from "../../../src/profile.js";
import { PolicyGate, unsafeOperations } from "../../../src/policy.js";

describe("local safety foundation", () => {
  it("initializes a gitignored local workspace without committing personal data", () => {
    const ws = tempWorkspace();
    try {
      const result = initializeWorkspace({ projectRoot: ws.dir, runtimeDirName: ".cn-job-ops" });
      expect(existsSync(result.runtimeDir)).toBe(true);
      expect(existsSync(join(result.runtimeDir, "profile.json"))).toBe(true);
      expect(readFileSync(join(ws.dir, ".gitignore"), "utf8")).toContain(".cn-job-ops/");
      expect(result.createdDirectories).toEqual(expect.arrayContaining(["drafts", "reports", "exports"]));
    } finally {
      ws.cleanup();
    }
  });

  it("stores profile data locally and validates minimum scoring fields", () => {
    const ws = tempWorkspace();
    try {
      initializeWorkspace({ projectRoot: ws.dir });
      const profilePath = writeProfile(ws.dir, completeProfile);
      const loaded = readProfile(ws.dir);
      expect(profilePath.endsWith(".cn-job-ops\\profile.json") || profilePath.endsWith(".cn-job-ops/profile.json")).toBe(true);
      expect(validateProfile(loaded).ok).toBe(true);
      expect(validateProfile({ ...completeProfile, targets: { ...completeProfile.targets, roles: [] } }).ok).toBe(false);
    } finally {
      ws.cleanup();
    }
  });

  it("redacts profile PII and CV facts from logs", () => {
    const raw = `Candidate Alice Zhang alice@example.test 13800138000 Led AI platform roadmap for enterprise customers`;
    const redacted = redactText(raw, completeProfile);
    expect(redacted).not.toContain("Alice Zhang");
    expect(redacted).not.toContain("alice@example.test");
    expect(redacted).not.toContain("13800138000");
    expect(redacted).not.toContain("Led AI platform roadmap");
    expect(redacted).toContain("[REDACTED");
  });

  it("blocks unsafe automation and allows local-only operations", () => {
    const gate = new PolicyGate();
    for (const operation of unsafeOperations) {
      const decision = gate.decide({ providerId: "boss-cli", operation, approvalStatus: "unknown" });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toMatch(/blocked|forbidden|unsafe/i);
    }
    expect(gate.decide({ providerId: "manual", operation: "manual_import", approvalStatus: "approved" }).allowed).toBe(true);
    expect(gate.decide({ providerId: "fixture", operation: "search", approvalStatus: "fixture" }).allowed).toBe(true);
    expect(gate.decide({ providerId: "fixture", operation: "unknown_action", approvalStatus: "fixture" }).allowed).toBe(false);
    expect(new PolicyGate({ rulesLoaded: false }).decide({ providerId: "manual", operation: "manual_import", approvalStatus: "approved" }).allowed).toBe(false);
  });

  it("uses a single redacted AI boundary with allowlisted profile fields", () => {
    const prompt = buildRedactedPrompt({
      purpose: "evaluate",
      profile: { ...completeProfile, privateNickname: "Secret Nickname" },
      jobSummary: "AI Platform Product Manager in Shanghai"
    });
    expect(prompt.text).toContain("AI Platform Product Manager in Shanghai");
    expect(prompt.text).not.toContain("Alice Zhang");
    expect(prompt.text).not.toContain("alice@example.test");
    expect(prompt.text).not.toContain("Secret Nickname");
    expect(prompt.redactedFields).toEqual(expect.arrayContaining(["basics.name", "basics.email", "basics.phone", "privateNickname"]));
    expect(prompt.safeFields).toEqual(expect.arrayContaining(["targets.roles", "targets.cities", "redLines"]));
  });
});
