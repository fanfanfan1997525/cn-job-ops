import { execFile } from "node:child_process";
import { extname, isAbsolute } from "node:path";
import type { ProviderResult, ProviderSearchQuery, RawJobInput } from "../types.js";
import { normalizeJob } from "../jobs/normalize.js";
import { classifyProviderError } from "./registry.js";

export interface LiepinOfficialRunnerResult {
  stdout: string;
  stderr?: string;
}

export interface LiepinOfficialProviderOptions {
  enabled: boolean;
  command?: string;
  token?: string;
  tokenEnv?: string;
  timeoutMs?: number;
  runner?: (command: string, args: string[], env: NodeJS.ProcessEnv) => Promise<LiepinOfficialRunnerResult>;
}

export class LiepinOfficialProvider {
  readonly id = "liepin-official-mcp";

  constructor(private readonly options: LiepinOfficialProviderOptions) {}

  async search(query: ProviderSearchQuery): Promise<ProviderResult> {
    if (!this.options.enabled) return { status: "blocked", jobs: [], failureReason: "Liepin official MCP requires explicit user opt-in" };

    const command = this.options.command;
    if (!command) return { status: "unsupported", jobs: [], failureReason: "Liepin official MCP command must be provided explicitly from the generated MCP JSON" };
    if (!isAbsolute(command)) return { status: "unsupported", jobs: [], failureReason: "Liepin official MCP command must be an absolute path to avoid PATH hijacking" };
    if ([".bat", ".cmd"].includes(extname(command).toLowerCase())) {
      return { status: "unsupported", jobs: [], failureReason: "Liepin official MCP command must not be a shell command shim" };
    }

    const tokenEnv = this.options.tokenEnv ?? "LIEPIN_USER_TOKEN";
    const env = { ...process.env };
    if (this.options.token) env[tokenEnv] = this.options.token;
    const secretValues = [this.options.token, env[tokenEnv]].filter((value): value is string => Boolean(value));
    const runner = this.options.runner ?? defaultRunner(this.options.timeoutMs);
    const args = buildSearchArgs(query);

    try {
      const result = await runner(command, args, env);
      const raws = parseLiepinSearchOutput(result.stdout);
      const jobs = raws.map((raw) => normalizeJob({ ...raw, providerId: this.id, platform: "liepin" }));
      return jobs.length ? { status: "success", jobs } : { status: "empty", jobs: [] };
    } catch (error) {
      const failureReason = redactProviderFailure(error instanceof Error ? error.message : String(error), secretValues);
      return { status: classifyProviderError(error), jobs: [], failureReason };
    }
  }
}

function buildSearchArgs(query: ProviderSearchQuery) {
  const args = ["search-job", "--jobName", query.keyword];
  if (query.cities?.length) args.push("--address", query.cities[0]);
  if (query.salaryMinK || query.salaryMaxK) args.push("--salary", `${query.salaryMinK ?? ""}-${query.salaryMaxK ?? ""}k`);
  args.push("--json");
  return args;
}

function parseLiepinSearchOutput(stdout: string): RawJobInput[] {
  let payload: unknown;
  try {
    payload = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`parse changed: Liepin official MCP returned invalid JSON (${error instanceof Error ? error.message : String(error)})`);
  }

  const records = extractList(payload);
  if (!records) throw new Error("parse changed: Liepin official MCP output did not contain a job list");
  return records.map(toRawJobInput);
}

function extractList(payload: unknown): Record<string, unknown>[] | null {
  const root = asRecord(payload);
  if (!root) return null;
  const candidates = [
    root.list,
    root.jobs,
    asRecord(root.data)?.list,
    asRecord(root.data)?.jobs,
    asRecord(root.result)?.list,
    asRecord(root.result)?.jobs,
    asRecord(asRecord(root.data)?.data)?.list
  ];
  const list = candidates.find(Array.isArray);
  return list && list.every((item) => Boolean(asRecord(item))) ? (list as Record<string, unknown>[]) : null;
}

function toRawJobInput(record: Record<string, unknown>): RawJobInput {
  const title = firstString(record, ["jobName", "title", "name", "positionName"]);
  const company = firstString(record, ["companyName", "company", "companyShortName"]);
  const description = firstString(record, ["jobDescription", "description", "desc", "requirement"]);
  if (!title || !company || !description) throw new Error("parse changed: Liepin official MCP job record missed title, company, or description");
  return {
    rawRef: firstString(record, ["jobId", "id", "positionId"]),
    title,
    company,
    city: firstString(record, ["address", "city", "workPlace", "dq"]),
    salary: firstString(record, ["salary", "salaryDesc", "compensation"]),
    experience: firstString(record, ["experience", "experienceDesc", "workYear"]),
    education: firstString(record, ["education", "educationDesc", "degree"]),
    tags: firstStringArray(record, ["jobLabels", "labels", "tags", "skillLabels"]),
    description,
    url: firstString(record, ["jobUrl", "url", "link"]),
    fetchedAt: firstString(record, ["refreshTime", "updatedAt", "fetchedAt", "updateTime"])
  };
}

function defaultRunner(timeoutMs = 30_000) {
  return (command: string, args: string[], env: NodeJS.ProcessEnv) =>
    new Promise<LiepinOfficialRunnerResult>((resolve, reject) => {
      execFile(command, args, { env, timeout: timeoutMs, windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          const message = [error.message, stderr].filter(Boolean).join("\n");
          reject(new Error(message));
          return;
        }
        resolve({ stdout, stderr });
      });
    });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function firstStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.map((item) => (typeof item === "string" ? item.trim() : String(item))).filter(Boolean);
  }
  return undefined;
}

function redactProviderFailure(message: string, secretValues: string[]) {
  let output = message;
  for (const secret of secretValues) {
    // Avoid turning very short common substrings into noisy redaction matches.
    if (secret.length < 6) continue;
    output = output.replaceAll(secret, "[REDACTED:provider-secret]");
  }
  return output.replace(/(authorization|cookie|token)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED:provider-secret]");
}
