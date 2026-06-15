import type { UserProfile } from "./types.js";
import { redactText } from "./profile.js";

export interface RedactedPrompt {
  text: string;
  safeFields: string[];
  redactedFields: string[];
}

const safeFieldPaths = new Set([
  "targets.roles",
  "targets.cities",
  "targets.salaryMinK",
  "targets.salaryMaxK",
  "targets.industries",
  "redLines"
]);

export function buildRedactedPrompt(input: { purpose: string; profile: UserProfile & Record<string, unknown>; jobSummary: string }): RedactedPrompt {
  const safeFields: string[] = [];
  const redactedFields: string[] = [];
  const lines = [`Purpose: ${input.purpose}`, `Job: ${redactText(input.jobSummary, input.profile)}`];

  for (const path of safeFieldPaths) {
    const value = getPath(input.profile, path);
    if (value !== undefined) {
      safeFields.push(path);
      lines.push(`${path}: ${redactText(JSON.stringify(value), input.profile)}`);
    }
  }
  collectRedactedFields(input.profile, "", redactedFields);
  const text = redactText(lines.join("\n"), input.profile);
  return { text, safeFields, redactedFields: Array.from(new Set(redactedFields)).sort() };
}

function getPath(value: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) return (current as Record<string, unknown>)[part];
    return undefined;
  }, value);
}

function collectRedactedFields(value: unknown, prefix: string, out: string[]) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!safeFieldPaths.has(path) && (typeof child !== "object" || child === null || Array.isArray(child))) out.push(path);
    if (child && typeof child === "object" && !Array.isArray(child)) collectRedactedFields(child, path, out);
  }
}
