import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { completeProfile, loadCases, tempWorkspace } from "./helpers.js";
import { AuditLog } from "../../../src/audit.js";
import { classifyProviderError, getProviderDescriptors } from "../../../src/providers/registry.js";
import { FixtureProvider } from "../../../src/providers/fixture.js";
import { ManualImportProvider } from "../../../src/providers/manual.js";
import { McpJobsProvider } from "../../../src/providers/mcpJobs.js";

describe("provider discovery contract", () => {
  it("declares capabilities, approval status, rate limits, and failure types", () => {
    const descriptors = getProviderDescriptors();
    expect(descriptors.map((d) => d.id)).toEqual(expect.arrayContaining(["manual", "fixture", "mcp-jobs", "liepin-cli", "boss-cli"]));
    for (const descriptor of descriptors) {
      expect(descriptor.capabilities.length).toBeGreaterThan(0);
      expect(descriptor.failureTypes).toEqual(expect.arrayContaining(["blocked", "transient_failure", "parse_changed", "login_required", "legal_blocked", "unsupported"]));
      expect(descriptor.rateLimit).toBeTruthy();
      expect(["approved", "fixture", "manual", "unknown", "user_opt_in"]).toContain(descriptor.approvalStatus);
    }
    expect(descriptors.find((d) => d.id === "mcp-jobs")?.approvalStatus).toBe("user_opt_in");
    expect(descriptors.find((d) => d.id === "liepin-cli")?.approvalStatus).toBe("unknown");
    expect(descriptors.find((d) => d.id === "boss-cli")?.approvalStatus).toBe("unknown");
  });

  it("covers all provider fixture outcomes without collapsing failures into empty", async () => {
    const cases = loadCases();
    const provider = new FixtureProvider(cases.map((c) => c.raw));
    await expect(provider.search({ keyword: "AI", cities: ["上海"] })).resolves.toMatchObject({ status: "success" });
    await expect(provider.search({ keyword: "NoSuchRole", cities: ["漠河"] })).resolves.toMatchObject({ status: "empty", jobs: [] });
    await expect(provider.search({ keyword: "blocked" })).resolves.toMatchObject({ status: "blocked" });
    await expect(provider.search({ keyword: "parse-change" })).resolves.toMatchObject({ status: "parse_changed" });
    await expect(provider.search({ keyword: "transient" })).resolves.toMatchObject({ status: "transient_failure" });
    await expect(provider.search({ keyword: "rate-limit" })).resolves.toMatchObject({ status: "rate_limited" });
    await expect(provider.search({ keyword: "login-required" })).resolves.toMatchObject({ status: "login_required" });
    await expect(provider.search({ keyword: "legal-blocked" })).resolves.toMatchObject({ status: "legal_blocked" });
    await expect(provider.search({ keyword: "unsupported" })).resolves.toMatchObject({ status: "unsupported" });
  });

  it("imports manual JD text without live platform scraping", async () => {
    const provider = new ManualImportProvider();
    const result = await provider.importJob({
      title: "AI平台产品经理",
      company: "Manual Co",
      city: "上海",
      description: "负责AI平台产品规划和B端客户需求分析",
      url: "https://example.test/manual/1"
    });
    expect(result.status).toBe("success");
    expect(result.jobs[0].source.providerId).toBe("manual");
  });

  it("keeps mcp-jobs opt-in and policy-gated while allowing injected enabled searches", async () => {
    const blocked = new McpJobsProvider({ enabled: false });
    await expect(blocked.search({ keyword: "AI" })).resolves.toMatchObject({ status: "blocked" });

    const enabled = new McpJobsProvider({
      enabled: true,
      runner: async () => [loadCases()[0].raw]
    });
    const result = await enabled.search({ keyword: "AI", cities: ["上海"] });
    expect(result.status).toBe("success");
    expect(result.jobs[0].source.providerId).toBe("mcp-jobs");
  });

  it("does not expose executable adapters for unknown boss-cli or liepin-cli providers", () => {
    const descriptors = getProviderDescriptors();
    for (const id of ["boss-cli", "liepin-cli"]) {
      const descriptor = descriptors.find((d) => d.id === id);
      expect(descriptor?.approvalStatus).toBe("unknown");
      expect(descriptor?.executable).toBe(false);
      expect(descriptor?.capabilities).not.toContain("apply");
      expect(descriptor?.capabilities).not.toContain("chat");
    }
  });

  it("classifies provider errors and writes redacted audit events", async () => {
    expect(classifyProviderError(new Error("429 too many requests"))).toBe("rate_limited");
    expect(classifyProviderError(new Error("selector missing card title"))).toBe("parse_changed");
    expect(classifyProviderError(new Error("ECONNRESET"))).toBe("transient_failure");

    const ws = tempWorkspace();
    try {
      const audit = new AuditLog(join(ws.dir, "audit.log"), completeProfile);
      audit.write({ providerId: "manual", operation: "manual_import", query: "Alice Zhang 13800138000", status: "success" });
      const lines = audit.readAll();
      expect(lines).toHaveLength(1);
      expect(JSON.stringify(lines[0])).not.toContain("13800138000");
      expect(lines[0].providerId).toBe("manual");
    } finally {
      ws.cleanup();
    }
  });
});
