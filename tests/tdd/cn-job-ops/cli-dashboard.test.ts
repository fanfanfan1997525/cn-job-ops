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
});
