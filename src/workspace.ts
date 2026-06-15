import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const runtimeDirs = ["drafts", "reports", "exports", "searches"];

export interface InitializeWorkspaceOptions {
  projectRoot?: string;
  workspaceDir?: string;
  runtimeDirName?: string;
}

export function resolveRuntimeDir(rootOrWorkspace: string, runtimeDirName = ".cn-job-ops") {
  const absolute = resolve(rootOrWorkspace);
  if (basename(absolute).startsWith(".cn-job-ops") || existsSync(join(absolute, "profile.json"))) {
    return absolute;
  }
  return join(absolute, runtimeDirName);
}

export function initializeWorkspace(options: InitializeWorkspaceOptions = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const runtimeDir = resolve(options.workspaceDir ?? join(projectRoot, options.runtimeDirName ?? ".cn-job-ops"));
  mkdirSync(runtimeDir, { recursive: true });
  for (const dir of runtimeDirs) mkdirSync(join(runtimeDir, dir), { recursive: true });

  const profilePath = join(runtimeDir, "profile.json");
  if (!existsSync(profilePath)) {
    writeFileSync(profilePath, JSON.stringify(createProfileTemplate(), null, 2), "utf8");
  }
  const configPath = join(runtimeDir, "config.json");
  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify({ schemaVersion: 1, createdAt: new Date().toISOString() }, null, 2), "utf8");
  }
  ensureGitignore(projectRoot, basename(runtimeDir));
  return {
    projectRoot,
    runtimeDir,
    profilePath,
    createdDirectories: runtimeDirs
  };
}

export function ensureGitignore(projectRoot: string, runtimeBasename = ".cn-job-ops") {
  const gitignorePath = join(projectRoot, ".gitignore");
  const line = `${runtimeBasename}/`;
  const existing = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf8") : "";
  const lines = new Set(existing.split(/\r?\n/).filter(Boolean));
  lines.add(line);
  if (runtimeBasename !== ".cn-job-ops") lines.add(".cn-job-ops/");
  writeFileSync(gitignorePath, `${Array.from(lines).join("\n")}\n`, "utf8");
}

function createProfileTemplate() {
  return {
    version: "profile-v1",
    updatedAt: new Date().toISOString(),
    basics: {
      currentTitle: "",
      yearsExperience: 0,
      city: ""
    },
    targets: {
      roles: [],
      cities: [],
      industries: []
    },
    cvFacts: [],
    redLines: [],
    platformPreferences: {
      enabledProviders: ["manual", "fixture"],
      forbiddenActions: ["apply", "chat", "automated_login", "captcha_bypass", "proxy_evasion"],
      allowThirdPartyMcpJobs: false,
      aiPromptMode: "redacted"
    }
  };
}
