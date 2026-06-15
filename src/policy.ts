import type { ApprovalStatus, ProviderOperation } from "./types.js";

export const unsafeOperations: ProviderOperation[] = [
  "apply",
  "chat",
  "automated_login",
  "captcha_bypass",
  "proxy_evasion",
  "credential_harvest",
  "upload",
  "send"
];

const knownSafeOperations = new Set<ProviderOperation>([
  "init",
  "search",
  "detail",
  "manual_import",
  "evaluate",
  "draft",
  "export",
  "report",
  "dashboard"
]);

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export class PolicyGate {
  private readonly rulesLoaded: boolean;

  constructor(options: { rulesLoaded?: boolean } = {}) {
    this.rulesLoaded = options.rulesLoaded ?? true;
  }

  decide(input: { providerId: string; operation: ProviderOperation | string; approvalStatus: ApprovalStatus; userOptIn?: boolean }): PolicyDecision {
    if (!this.rulesLoaded) return { allowed: false, reason: "blocked: policy rules not loaded" };
    if (unsafeOperations.includes(input.operation as ProviderOperation)) return { allowed: false, reason: `blocked unsafe operation: ${input.operation}` };
    if (!knownSafeOperations.has(input.operation as ProviderOperation)) return { allowed: false, reason: `unsupported or unknown operation: ${input.operation}` };
    if (input.approvalStatus === "unknown") return { allowed: false, reason: `blocked unknown provider: ${input.providerId}` };
    if (input.approvalStatus === "user_opt_in" && !input.userOptIn) return { allowed: false, reason: `blocked until explicit opt-in: ${input.providerId}` };
    return { allowed: true, reason: "allowed" };
  }
}
