import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalJob, EvaluationReport, UserProfile } from "./types.js";

export interface DraftSet {
  resumeMarkdown: string;
  coverNoteMarkdown: string;
  greetingVariants: string[];
  provenance: Array<{ claim: string; sourceField: string }>;
  unsupportedClaims: string[];
}

export function generateDraftSet(job: CanonicalJob, profile: UserProfile, evaluation: EvaluationReport): DraftSet {
  const provenance: Array<{ claim: string; sourceField: string }> = [];
  const facts = profile.cvFacts.map((fact, index) => {
    provenance.push({ claim: fact, sourceField: `cvFacts[${index}]` });
    return `- ${fact}`;
  });
  const evidence = evaluation.blocks.flatMap((block) => block.evidence).filter(Boolean);
  if (evidence[0]) provenance.push({ claim: evidence[0], sourceField: "evaluation.blocks[].evidence" });
  const header = `# DRAFT - REVIEW REQUIRED\n\nTarget role: ${job.title} / ${job.company}\n`;
  const resumeMarkdown = `${header}\n## Profile facts to emphasize\n${facts.join("\n")}\n\n## Job-specific emphasis\n- ${job.title}\n- ${job.tags.join(", ") || "role-specific requirements"}\n`;
  const coverNoteMarkdown = `${header}\nI am interested in ${job.title}. Based on my local CV facts, I would emphasize:\n\n${facts.join("\n")}\n\nEvaluation evidence: ${evidence[0] ?? "review required"}\n\nThis note is a draft and must be reviewed before use.\n`;
  const greetingVariants = [
    `DRAFT - REVIEW REQUIRED: 您好，我关注到${job.title}岗位，想基于我的AI/产品经验进一步了解岗位重点。`,
    `DRAFT - REVIEW REQUIRED: 您好，这个${job.title}方向与我本地简历中的相关经历匹配，想请教团队当前最看重的能力。`,
    `DRAFT - REVIEW REQUIRED: 您好，我想了解${job.company}这个岗位的业务场景和交付目标，方便我判断是否合适。`
  ];
  return { resumeMarkdown, coverNoteMarkdown, greetingVariants, provenance, unsupportedClaims: [] };
}

export function generateDraftArtifacts(input: {
  outputDir: string;
  job: CanonicalJob;
  profile: UserProfile;
  evaluation: EvaluationReport;
  externalActionProbe?: () => void;
}) {
  mkdirSync(input.outputDir, { recursive: true });
  const drafts = generateDraftSet(input.job, input.profile, input.evaluation);
  const slug = slugify(`${input.job.company}-${input.job.title}`);
  const files = [
    write(join(input.outputDir, `${slug}-resume.md`), drafts.resumeMarkdown),
    write(join(input.outputDir, `${slug}-cover-note.md`), drafts.coverNoteMarkdown),
    write(join(input.outputDir, `${slug}-greetings.md`), drafts.greetingVariants.join("\n\n"))
  ];
  return { files, drafts };
}

function write(path: string, content: string) {
  writeFileSync(path, content, "utf8");
  return path;
}

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
