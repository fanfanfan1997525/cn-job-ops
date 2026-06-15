import type { ProviderDescriptor, ProviderFailure } from "../types.js";

export const providerFailureTypes: ProviderFailure[] = [
  "blocked",
  "transient_failure",
  "parse_changed",
  "rate_limited",
  "login_required",
  "legal_blocked",
  "unsupported"
];

export function getProviderDescriptors(): ProviderDescriptor[] {
  return [
    {
      id: "manual",
      label: "Manual import",
      platforms: ["manual"],
      approvalStatus: "manual",
      capabilities: ["manual_import"],
      rateLimit: "local-only",
      failureTypes: providerFailureTypes,
      executable: true
    },
    {
      id: "fixture",
      label: "Synthetic fixture provider",
      platforms: ["fixture"],
      approvalStatus: "fixture",
      capabilities: ["search", "detail"],
      rateLimit: "local-only",
      failureTypes: providerFailureTypes,
      executable: true
    },
    {
      id: "mcp-jobs",
      label: "mcp-jobs multi-platform facade",
      platforms: ["liepin", "boss", "zhilian", "51job"],
      approvalStatus: "user_opt_in",
      capabilities: ["search", "detail"],
      rateLimit: "user configured; default disabled",
      failureTypes: providerFailureTypes,
      executable: true
    },
    {
      id: "liepin-official-mcp",
      label: "Liepin official MCP",
      platforms: ["liepin"],
      approvalStatus: "user_opt_in",
      capabilities: ["search", "detail"],
      rateLimit: "official credential and explicit absolute command path required; default disabled",
      failureTypes: providerFailureTypes,
      executable: true
    },
    {
      id: "liepin-cli",
      label: "Third-party Liepin CLI/MCP descriptor",
      platforms: ["liepin"],
      approvalStatus: "user_opt_in",
      capabilities: ["search", "detail"],
      rateLimit: "third-party token wrapper; descriptor only unless explicitly injected",
      failureTypes: providerFailureTypes,
      executable: false
    },
    {
      id: "boss-cli",
      label: "BOSS Zhipin CLI descriptor",
      platforms: ["boss"],
      approvalStatus: "unknown",
      capabilities: ["search", "detail"],
      rateLimit: "unknown; descriptor only in v1",
      failureTypes: providerFailureTypes,
      executable: false
    }
  ];
}

export function classifyProviderError(error: unknown): ProviderFailure {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (/429|rate|throttle|too many/.test(message)) return "rate_limited";
  if (/\b401\b|login|auth|cookie|credential|token|unauthorized/.test(message)) return "login_required";
  if (/legal|robots|tos|terms/.test(message)) return "legal_blocked";
  if (/unsupported|not implemented|capability|enoent|not found|not recognized/.test(message)) return "unsupported";
  if (/selector|parse|schema|layout|missing card/.test(message)) return "parse_changed";
  if (/blocked|captcha|ban|forbidden/.test(message)) return "blocked";
  return "transient_failure";
}
