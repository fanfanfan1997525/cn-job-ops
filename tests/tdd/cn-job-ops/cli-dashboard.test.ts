import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { completeProfile, loadCases, tempWorkspace, writeJson } from "./helpers.js";
import { runCli } from "../../../src/cli.js";

describe("CLI, dashboard, docs, and release smoke", () => {
  it("runs a fresh local smoke workflow without leaking secrets into git-visible paths", async () => {
    const ws = tempWorkspace();
    try {
      const workspace = join(ws.dir, ".cn-job-ops");
      const fixturePath = join(ws.dir, "fixture.json");
      writeJson(fixturePath, loadCases().map((c) => c.raw));
      await expect(runCli(["init", "--workspace", workspace], { cwd: ws.dir })).resolves.toMatchObject({ code: 0 });
      writeJson(join(workspace, "profile.json"), completeProfile);

      await expect(runCli(["fixture-search", "--workspace", workspace, "--fixture", fixturePath, "--keyword", "AI"], { cwd: ws.dir })).resolves.toMatchObject({ code: 0 });
      await expect(runCli(["evaluate", "--workspace", workspace, "--all"], { cwd: ws.dir })).resolves.toMatchObject({ code: 0 });
      await expect(runCli(["draft", "--workspace", workspace, "--first-shortlisted"], { cwd: ws.dir })).resolves.toMatchObject({ code: 0 });
      const exportResult = await runCli(["export", "--workspace", workspace, "--format", "markdown"], { cwd: ws.dir });
      const dashboard = await runCli(["dashboard", "--workspace", workspace], { cwd: ws.dir });

      expect(exportResult.stdout).toContain("Job Tracker Export");
      expect(dashboard.stdout).toContain("CN Job Ops Dashboard");
      expect(dashboard.stdout).toContain("Evidence");
      expect(existsSync(join(workspace, "drafts"))).toBe(true);
      expect(readFileSync(join(ws.dir, ".gitignore"), "utf8")).toContain(".cn-job-ops/");
      expect(exportResult.stdout).not.toContain("alice@example.test");
      expect(dashboard.stdout).not.toContain("13800138000");
    } finally {
      ws.cleanup();
    }
  });

  it("requires an explicit Liepin credential before live search execution", async () => {
    const ws = tempWorkspace();
    try {
      const workspace = join(ws.dir, ".cn-job-ops");
      const result = await runCli(["liepin-search", "--workspace", workspace, "--keyword", "AI", "--token-env", "CN_JOB_OPS_TEST_MISSING_LIEPIN_TOKEN"], { cwd: ws.dir });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("liepin-search login_required");
      expect(result.stderr).toContain("CN_JOB_OPS_TEST_MISSING_LIEPIN_TOKEN");
    } finally {
      ws.cleanup();
    }
  });

  it("requires an explicit absolute Liepin MCP command before live search execution", async () => {
    const ws = tempWorkspace();
    const tokenEnv = "CN_JOB_OPS_TEST_LIEPIN_TOKEN";
    const previous = process.env[tokenEnv];
    process.env[tokenEnv] = "liepin_user_token_test";
    try {
      const workspace = join(ws.dir, ".cn-job-ops");
      const missingCommand = await runCli(["liepin-search", "--workspace", workspace, "--keyword", "AI", "--token-env", tokenEnv], { cwd: ws.dir });
      expect(missingCommand.code).toBe(1);
      expect(missingCommand.stderr).toContain("liepin-search unsupported");
      expect(existsSync(join(workspace, "tracker.sqlite"))).toBe(false);

      const nakedCommand = await runCli(["liepin-search", "--workspace", workspace, "--keyword", "AI", "--token-env", tokenEnv, "--command", "liepin-cli"], { cwd: ws.dir });
      expect(nakedCommand.code).toBe(1);
      expect(nakedCommand.stderr).toContain("liepin-search unsupported");
      expect(existsSync(join(workspace, "tracker.sqlite"))).toBe(false);
    } finally {
      if (previous === undefined) delete process.env[tokenEnv];
      else process.env[tokenEnv] = previous;
      ws.cleanup();
    }
  });
});
