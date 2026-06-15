import type { CanonicalJob, EvaluationBlock, EvaluationReport, RiskEvidence, UserProfile } from "./types.js";

export const DEFAULT_RUBRIC_VERSION = "rubric-v1";
export const DEFAULT_THRESHOLD = 4.0;

export class EvaluationCache {
  private readonly records = new Map<string, EvaluationReport>();
  private hits = 0;
  private misses = 0;

  get(key: string) {
    const value = this.records.get(key);
    if (value) this.hits += 1;
    else this.misses += 1;
    return value ? { ...value, blocks: value.blocks.map((b) => ({ ...b, evidence: [...b.evidence] })), risk: { ...value.risk, flags: [...value.risk.flags], evidence: value.risk.evidence.map((e) => ({ ...e })) } } : null;
  }

  set(key: string, report: EvaluationReport) {
    this.records.set(key, { ...report, cacheHit: false });
  }

  stats() {
    return { hits: this.hits, misses: this.misses, size: this.records.size };
  }
}

export function evaluateJob(
  job: CanonicalJob,
  profile: UserProfile,
  options: { cache?: EvaluationCache; rubricVersion?: string; overrideBelowThreshold?: boolean; now?: Date } = {}
): EvaluationReport {
  const rubricVersion = options.rubricVersion ?? DEFAULT_RUBRIC_VERSION;
  const key = `${job.contentHash}:${profile.version}:${rubricVersion}`;
  const cached = options.cache?.get(key);
  if (cached) return { ...cached, cacheHit: true };

  const riskEvidence = detectRisk(job, options.now ?? new Date());
  const riskFlags = riskEvidence.map((e) => e.flag);
  const riskVeto = riskEvidence.some((e) => e.severity === "hard_veto") || riskEvidence.filter((e) => e.severity === "strong").length >= 2;
  const fitScore = computeFitScore(job, profile);
  const riskPenalty = riskEvidence.reduce((sum, evidence) => sum + (evidence.severity === "hard_veto" ? 1.3 : evidence.severity === "strong" ? 0.8 : 0.25), 0);
  const score = clamp(round1(Math.min(fitScore, fitScore - riskPenalty)), 0, 5);
  const recommendation = riskVeto
    ? options.overrideBelowThreshold
      ? "manual_override_review"
      : "do_not_apply"
    : score < DEFAULT_THRESHOLD
      ? options.overrideBelowThreshold
        ? "manual_override_review"
        : "do_not_apply"
      : "apply";
  const blocks = buildBlocks(job, profile, fitScore, score, riskEvidence);
  const report: EvaluationReport = {
    rubricVersion,
    profileVersion: profile.version,
    score,
    fitScore,
    recommendation,
    confidence: riskEvidence.length ? "medium" : fitScore >= 4.2 ? "high" : "medium",
    threshold: DEFAULT_THRESHOLD,
    blocks,
    risk: { flags: riskFlags, veto: riskVeto, evidence: riskEvidence },
    cacheHit: false
  };
  options.cache?.set(key, report);
  return report;
}

function computeFitScore(job: CanonicalJob, profile: UserProfile) {
  const text = `${job.title} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
  const roleMatch = profile.targets.roles.some((role) => roleMatchScore(role, text));
  const industryMatch = (profile.targets.industries ?? []).some((industry) => text.includes(industry.toLowerCase()));
  const cityMatch = job.cities.some((city) => profile.targets.cities.some((target) => city.includes(target) || target.includes(city)));
  let score = 3.0;
  score += roleMatch ? 1.25 : -1.2;
  score += industryMatch ? 0.45 : 0;
  score += cityMatch ? 0.4 : -0.15;
  if (job.salary.isNegotiable || job.salary.minK === null) score -= 1.35;
  else if (profile.targets.salaryMinK && job.salary.minK >= profile.targets.salaryMinK) score += 0.35;
  if (/不限|经验不限/i.test(job.experience)) score -= 0.35;
  if (/外包|代招|保密|猎头/.test(job.company + job.description)) score -= 1.0;
  if (daysSince(job.source.fetchedAt, new Date("2026-06-15T00:00:00.000Z")) > 60) score -= 1.1;
  return clamp(round1(score), 0, 5);
}

function roleMatchScore(role: string, text: string) {
  const normalized = role.toLowerCase();
  if (text.includes(normalized)) return true;
  if (/产品经理/.test(role) && /产品经理|product manager/.test(text)) return true;
  if (/ai/i.test(role) && /\bai\b|人工智能|平台/.test(text)) return true;
  if (/增长/.test(role) && /增长|growth/.test(text)) return true;
  if (/数据/.test(role) && /数据|metric|dashboard/.test(text)) return true;
  return false;
}

function buildBlocks(job: CanonicalJob, profile: UserProfile, fitScore: number, score: number, risk: RiskEvidence[]): EvaluationBlock[] {
  return [
    { id: "role_summary", score: fitScore, evidence: [`${job.title} at ${job.company}`] },
    { id: "cv_match", score: fitScore, evidence: [profile.cvFacts[0] ?? profile.basics.currentTitle ?? "profile fact unavailable"] },
    { id: "gaps", score: score, evidence: [job.salary.isNegotiable ? "salary is negotiable or missing" : `salary ${job.salary.raw}`] },
    { id: "level_strategy", score: fitScore, evidence: [`experience requirement: ${job.experience || "unspecified"}`] },
    { id: "compensation_sanity", score: job.salary.minK === null ? 2.6 : 4.0, evidence: [job.salary.raw || "salary not provided"] },
    { id: "personalization", score: fitScore, evidence: [job.tags[0] ?? job.title] },
    { id: "interview_prep", score: 4.0, evidence: [job.description.slice(0, 80)] },
    { id: "posting_legitimacy_risk", score: risk.length ? 2.0 : 4.5, evidence: risk.length ? risk.map((r) => `${r.flag}: ${r.matchedText}`) : ["no configured risk pattern matched"] }
  ];
}

function detectRisk(job: CanonicalJob, now: Date): RiskEvidence[] {
  const text = `${job.title} ${job.company} ${job.description} ${job.experience} ${job.education}`;
  const risks: RiskEvidence[] = [];
  pushIf(risks, text, "training_loan", "hard_veto", /(培训贷|岗前培训|包上岗|零基础高薪就业)/);
  pushIf(risks, text, "upfront_fee", "hard_veto", /(押金|保证金|资料费|体检费|转账|收费)/);
  pushIf(risks, text, "off_platform_lure", "strong", /(加微信|微信详聊|不在平台|私下沟通)/);
  if (job.salary.minK !== null && job.salary.minK >= 30 && /不限|经验不限|零基础/.test(text)) {
    risks.push({ flag: "unrealistic_salary", severity: "advisory", matchedText: job.salary.raw });
  }
  if (daysSince(job.source.fetchedAt, now) > 60 || /长期招聘|长期有效|发布日期很早/.test(text)) {
    risks.push({ flag: "stale_or_ghost", severity: "strong", matchedText: job.source.fetchedAt });
  }
  pushIf(risks, text, "agency_ambiguity", "advisory", /(代招|外包|猎头|客户信息.*保密|外包合同)/);
  pushIf(risks, text, "company_mismatch", "strong", /(公司不一致|主体不一致|冒用)/);
  return risks;
}

function pushIf(out: RiskEvidence[], text: string, flag: string, severity: RiskEvidence["severity"], regex: RegExp) {
  const match = text.match(regex);
  if (match) out.push({ flag, severity, matchedText: match[0] });
}

function daysSince(iso: string, now: Date) {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
