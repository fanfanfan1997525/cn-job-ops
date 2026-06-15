import type { ProviderResult, RawJobInput } from "../types.js";
import { normalizeJob } from "../jobs/normalize.js";

export class ManualImportProvider {
  readonly id = "manual";

  async importJob(input: RawJobInput): Promise<ProviderResult> {
    return {
      status: "success",
      jobs: [
        normalizeJob({
          ...input,
          providerId: "manual",
          platform: "manual",
          fetchedAt: input.fetchedAt ?? new Date().toISOString()
        })
      ]
    };
  }
}
