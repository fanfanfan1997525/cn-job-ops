import type { CanonicalJob, ProviderResult, ProviderSearchQuery, RawJobInput } from "../types.js";
import { normalizeJob } from "../jobs/normalize.js";

export class FixtureProvider {
  readonly id = "fixture";

  constructor(private readonly raws: RawJobInput[]) {}

  async search(query: ProviderSearchQuery): Promise<ProviderResult> {
    const keyword = query.keyword.toLowerCase();
    const outcome = outcomeForKeyword(keyword);
    if (outcome) return { status: outcome, jobs: [], failureReason: outcome };
    const jobs = this.raws
      .filter((raw) => matches(raw, query))
      .map((raw) => normalizeJob({ ...raw, providerId: "fixture", platform: raw.platform ?? "fixture" }));
    return jobs.length ? { status: "success", jobs } : { status: "empty", jobs: [] };
  }
}

function outcomeForKeyword(keyword: string) {
  if (keyword.includes("login-required")) return "login_required" as const;
  if (keyword.includes("legal-blocked")) return "legal_blocked" as const;
  if (keyword.includes("unsupported")) return "unsupported" as const;
  if (keyword.includes("rate-limit")) return "rate_limited" as const;
  if (keyword.includes("parse-change")) return "parse_changed" as const;
  if (keyword.includes("transient")) return "transient_failure" as const;
  if (keyword.includes("blocked")) return "blocked" as const;
  return null;
}

function matches(raw: RawJobInput, query: ProviderSearchQuery) {
  const haystack = `${raw.title} ${raw.company} ${raw.city ?? ""} ${raw.tags?.join(" ") ?? ""} ${raw.description}`.toLowerCase();
  if (!haystack.includes(query.keyword.toLowerCase())) return false;
  if (query.cities?.length) {
    const city = raw.city ?? "";
    if (!query.cities.some((wanted) => city.includes(wanted))) return false;
  }
  return true;
}
