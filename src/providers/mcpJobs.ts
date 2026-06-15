import type { ProviderResult, ProviderSearchQuery, RawJobInput } from "../types.js";
import { normalizeJob } from "../jobs/normalize.js";
import { classifyProviderError } from "./registry.js";

export class McpJobsProvider {
  readonly id = "mcp-jobs";

  constructor(private readonly options: { enabled: boolean; runner?: (query: ProviderSearchQuery) => Promise<RawJobInput[]> }) {}

  async search(query: ProviderSearchQuery): Promise<ProviderResult> {
    if (!this.options.enabled) return { status: "blocked", jobs: [], failureReason: "mcp-jobs requires explicit user opt-in" };
    if (!this.options.runner) return { status: "transient_failure", jobs: [], failureReason: "mcp-jobs runner not configured" };
    try {
      const raws = await this.options.runner(query);
      const jobs = raws.map((raw) => normalizeJob({ ...raw, providerId: "mcp-jobs", platform: "mcp-jobs" }));
      return jobs.length ? { status: "success", jobs } : { status: "empty", jobs: [] };
    } catch (error) {
      return { status: classifyProviderError(error), jobs: [], failureReason: error instanceof Error ? error.message : String(error) };
    }
  }
}
