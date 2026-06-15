export type ApprovalStatus = "approved" | "fixture" | "manual" | "unknown" | "user_opt_in";

export type ProviderOperation =
  | "init"
  | "search"
  | "detail"
  | "manual_import"
  | "evaluate"
  | "draft"
  | "export"
  | "report"
  | "dashboard"
  | "apply"
  | "chat"
  | "automated_login"
  | "captcha_bypass"
  | "proxy_evasion"
  | "credential_harvest"
  | "upload"
  | "send"
  | "unknown_action";

export type ProviderFailure =
  | "empty"
  | "blocked"
  | "transient_failure"
  | "parse_changed"
  | "rate_limited"
  | "login_required"
  | "legal_blocked"
  | "unsupported";

export type ProviderStatus = "success" | ProviderFailure;

export type PipelineStatus =
  | "discovered"
  | "shortlisted"
  | "rejected"
  | "drafted"
  | "applied_manually"
  | "interviewing"
  | "offer"
  | "closed"
  | "stale";

export interface UserProfile {
  version: string;
  updatedAt: string;
  basics: {
    name?: string;
    currentTitle?: string;
    yearsExperience?: number;
    city?: string;
    email?: string;
    phone?: string;
  };
  targets: {
    roles: string[];
    cities: string[];
    salaryMinK?: number;
    salaryMaxK?: number;
    industries?: string[];
  };
  cvFacts: string[];
  redLines: string[];
  platformPreferences: {
    enabledProviders: string[];
    forbiddenActions: string[];
    allowThirdPartyMcpJobs?: boolean;
    aiPromptMode?: "redacted" | "local-only";
  };
  [key: string]: unknown;
}

export interface RawJobInput {
  providerId?: string;
  platform?: string;
  url?: string;
  rawRef?: string;
  title: string;
  company: string;
  city?: string;
  salary?: string;
  experience?: string;
  education?: string;
  tags?: string[];
  description: string;
  fetchedAt?: string;
}

export interface SalaryInfo {
  raw: string;
  minK: number | null;
  maxK: number | null;
  currency: "CNY";
  period: "month";
  monthsPerYear: number | null;
  isNegotiable: boolean;
  equityFlag: boolean;
}

export interface CanonicalJob {
  source: {
    providerId: string;
    platform: string;
    url: string | null;
    canonicalUrl: string | null;
    rawRef: string | null;
    fetchedAt: string;
  };
  title: string;
  rawTitle: string;
  company: string;
  rawCompany: string;
  city: string;
  cities: string[];
  salary: SalaryInfo;
  experience: string;
  education: string;
  tags: string[];
  description: string;
  contentHash: string;
  identityFingerprint: string;
  dedupKey: string;
}

export interface StoredJob extends CanonicalJob {
  id: string;
  currentStatus: PipelineStatus;
  firstSeen: string;
  lastSeen: string;
}

export interface ProviderDescriptor {
  id: string;
  label: string;
  platforms: string[];
  approvalStatus: ApprovalStatus;
  capabilities: ProviderOperation[];
  rateLimit: string;
  failureTypes: ProviderFailure[];
  executable: boolean;
}

export interface ProviderSearchQuery {
  keyword: string;
  cities?: string[];
  salaryMinK?: number;
  salaryMaxK?: number;
}

export interface ProviderResult {
  status: ProviderStatus;
  jobs: CanonicalJob[];
  failureReason?: string;
}

export interface EvaluationBlock {
  id:
    | "role_summary"
    | "cv_match"
    | "gaps"
    | "level_strategy"
    | "compensation_sanity"
    | "personalization"
    | "interview_prep"
    | "posting_legitimacy_risk";
  score: number;
  evidence: string[];
}

export interface RiskEvidence {
  flag: string;
  severity: "hard_veto" | "strong" | "advisory";
  matchedText: string;
}

export interface EvaluationReport {
  jobId?: string;
  rubricVersion: string;
  profileVersion: string;
  score: number;
  fitScore: number;
  recommendation: "apply" | "do_not_apply" | "manual_override_review";
  confidence: "high" | "medium" | "low";
  threshold: number;
  blocks: EvaluationBlock[];
  risk: {
    flags: string[];
    veto: boolean;
    evidence: RiskEvidence[];
  };
  cacheHit: boolean;
}
