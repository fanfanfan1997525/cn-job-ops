import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { UserProfile } from "./types.js";
import { resolveRuntimeDir } from "./workspace.js";

export function writeProfile(rootOrWorkspace: string, profile: UserProfile) {
  const runtimeDir = resolveRuntimeDir(rootOrWorkspace);
  const path = join(runtimeDir, "profile.json");
  writeFileSync(path, JSON.stringify(profile, null, 2), "utf8");
  return path;
}

export function readProfile(rootOrWorkspace: string): UserProfile {
  const runtimeDir = resolveRuntimeDir(rootOrWorkspace);
  const path = join(runtimeDir, "profile.json");
  if (!existsSync(path)) throw new Error(`profile not found: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as UserProfile;
}

export function validateProfile(profile: Partial<UserProfile>) {
  const missing: string[] = [];
  if (!profile.basics?.currentTitle) missing.push("basics.currentTitle");
  if (typeof profile.basics?.yearsExperience !== "number") missing.push("basics.yearsExperience");
  if (!profile.targets?.roles?.length) missing.push("targets.roles");
  if (!profile.targets?.cities?.length) missing.push("targets.cities");
  if (!profile.cvFacts?.length) missing.push("cvFacts");
  return { ok: missing.length === 0, missing };
}

export function redactText(input: string, profile?: Partial<UserProfile>) {
  let output = input;
  const tokens = new Set<string>();
  if (profile?.basics) {
    for (const key of ["name", "email", "phone"] as const) {
      const value = profile.basics[key];
      if (typeof value === "string" && value.trim()) tokens.add(value.trim());
    }
  }
  for (const fact of profile?.cvFacts ?? []) {
    if (fact.trim()) tokens.add(fact.trim());
  }
  for (const token of tokens) {
    output = output.replaceAll(token, "[REDACTED:profile]");
  }
  output = output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED:email]");
  output = output.replace(/(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/g, "[REDACTED:phone]");
  return output;
}

export function redactValue(value: unknown, profile?: Partial<UserProfile>) {
  return redactText(typeof value === "string" ? value : JSON.stringify(value), profile);
}
