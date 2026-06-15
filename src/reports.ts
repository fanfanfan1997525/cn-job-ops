import type { UserProfile } from "./types.js";
import type { ScanRun } from "./scan.js";
import type { JobTracker } from "./tracker.js";

export function generateWeeklyReport(input: { tracker: JobTracker; scanRuns: ScanRun[]; profile: UserProfile }) {
  const jobs = input.tracker.listJobs();
  const highScore = jobs.filter((job) => (input.tracker.latestEvaluation(job.id)?.score ?? 0) >= 4);
  const rejectedRisk = jobs.filter((job) => input.tracker.latestEvaluation(job.id)?.risk.flags.length);
  const failures = input.scanRuns.flatMap((run) => run.providerHealth.filter((health) => health.status !== "success" && health.status !== "empty"));
  const skills = count(jobs.flatMap((job) => job.tags));
  const salaries = jobs.map((job) => job.salary.minK).filter((value): value is number => typeof value === "number");
  const salaryLine = salaries.length ? `${Math.min(...salaries)}K-${Math.max(...salaries)}K from ${salaries.length} postings` : "insufficient salary sample";
  return [
    "# Weekly CN Job Ops Report",
    "",
    "## High-score jobs",
    highScore.length ? highScore.map((job) => `- ${job.company} / ${job.title} (${input.tracker.latestEvaluation(job.id)?.score.toFixed(1)})`).join("\n") : "- None in this window",
    "",
    "## Rejected-risk jobs",
    rejectedRisk.length ? rejectedRisk.map((job) => `- ${job.company} / ${job.title}: ${input.tracker.latestEvaluation(job.id)?.risk.flags.join(", ")}`).join("\n") : "- None",
    "",
    "## Salary and skill trends",
    `- Salary: ${salaryLine}`,
    `- Skills: ${Object.entries(skills).slice(0, 5).map(([skill, n]) => `${skill}(${n})`).join(", ") || "insufficient sample"}`,
    "",
    "## Provider failures",
    failures.length ? failures.map((f) => `- ${f.providerId}: ${f.status}${f.failureReason ? ` (${f.failureReason})` : ""}`).join("\n") : "- None",
    "",
    "## Next actions",
    failures.length ? "- Fix or disable degraded providers before trusting trend data." : "- Review shortlisted drafts and decide manual next steps."
  ].join("\n");
}

function count(values: string[]) {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}
