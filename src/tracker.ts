import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { CanonicalJob, EvaluationReport, PipelineStatus, StoredJob, UserProfile } from "./types.js";
import { redactText } from "./profile.js";

interface JobRow {
  id: string;
  title: string;
  raw_title: string;
  company: string;
  raw_company: string;
  city: string;
  cities_json: string;
  salary_json: string;
  experience: string;
  education: string;
  tags_json: string;
  description: string;
  content_hash: string;
  identity_fingerprint: string;
  dedup_key: string;
  current_status: PipelineStatus;
  first_seen: string;
  last_seen: string;
}

export interface JobSource {
  jobId: string;
  providerId: string;
  platform: string;
  url: string | null;
  canonicalUrl: string | null;
  firstSeen: string;
  lastSeen: string;
}

export class JobTracker {
  private readonly db: DatabaseSync;

  constructor(private readonly dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
  }

  init() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA user_version = 1;
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        raw_title TEXT NOT NULL,
        company TEXT NOT NULL,
        raw_company TEXT NOT NULL,
        city TEXT NOT NULL,
        cities_json TEXT NOT NULL,
        salary_json TEXT NOT NULL,
        experience TEXT NOT NULL,
        education TEXT NOT NULL,
        tags_json TEXT NOT NULL,
        description TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        identity_fingerprint TEXT NOT NULL UNIQUE,
        dedup_key TEXT NOT NULL,
        current_status TEXT NOT NULL,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS job_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        url TEXT,
        canonical_url TEXT,
        raw_ref TEXT,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        UNIQUE(job_id, provider_id, canonical_url)
      );
      CREATE INDEX IF NOT EXISTS idx_job_sources_canonical_url ON job_sources(canonical_url);
      CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON jobs(content_hash);
      CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        from_status TEXT,
        to_status TEXT NOT NULL,
        changed_at TEXT NOT NULL,
        actor TEXT NOT NULL,
        reason TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        eval_version TEXT NOT NULL,
        profile_version TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        report_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(job_id, eval_version, profile_version, content_hash)
      );
    `);
  }

  upsertJob(job: CanonicalJob): StoredJob {
    const now = job.source.fetchedAt;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existingId = this.findExistingJobId(job);
      const id = existingId ?? `job_${job.identityFingerprint}`;
      if (!existingId) {
        this.db.prepare(`
          INSERT INTO jobs (
            id, title, raw_title, company, raw_company, city, cities_json, salary_json,
            experience, education, tags_json, description, content_hash, identity_fingerprint,
            dedup_key, current_status, first_seen, last_seen
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'discovered', ?, ?)
        `).run(
          id,
          job.title,
          job.rawTitle,
          job.company,
          job.rawCompany,
          job.city,
          JSON.stringify(job.cities),
          JSON.stringify(job.salary),
          job.experience,
          job.education,
          JSON.stringify(job.tags),
          job.description,
          job.contentHash,
          job.identityFingerprint,
          job.dedupKey,
          now,
          now
        );
        this.insertStatusHistory(id, null, "discovered", "tracker", "job discovered", now);
      } else {
        this.db.prepare(`
          UPDATE jobs SET
            title=?, raw_title=?, company=?, raw_company=?, city=?, cities_json=?, salary_json=?,
            experience=?, education=?, tags_json=?, description=?, content_hash=?, last_seen=?
          WHERE id=?
        `).run(
          job.title,
          job.rawTitle,
          job.company,
          job.rawCompany,
          job.city,
          JSON.stringify(job.cities),
          JSON.stringify(job.salary),
          job.experience,
          job.education,
          JSON.stringify(job.tags),
          job.description,
          job.contentHash,
          now,
          id
        );
      }
      this.upsertSource(id, job, now);
      this.db.exec("COMMIT");
      return this.getJob(id);
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  listJobs(): StoredJob[] {
    return this.db.prepare("SELECT * FROM jobs ORDER BY first_seen ASC, id ASC").all().map((row) => mapJobRow(row as JobRow));
  }

  getJob(id: string): StoredJob {
    const row = this.db.prepare("SELECT * FROM jobs WHERE id=?").get(id) as JobRow | undefined;
    if (!row) throw new Error(`job not found: ${id}`);
    return mapJobRow(row);
  }

  listSources(jobId: string): JobSource[] {
    return this.db
      .prepare("SELECT job_id, provider_id, platform, url, canonical_url, first_seen, last_seen FROM job_sources WHERE job_id=? ORDER BY provider_id, canonical_url")
      .all(jobId)
      .map((row: any) => ({
        jobId: row.job_id,
        providerId: row.provider_id,
        platform: row.platform,
        url: row.url ?? null,
        canonicalUrl: row.canonical_url ?? null,
        firstSeen: row.first_seen,
        lastSeen: row.last_seen
      }));
  }

  updateStatus(jobId: string, status: PipelineStatus, reason: string, actor = "user") {
    const current = this.getJob(jobId).currentStatus;
    if (current === status) return;
    const now = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("UPDATE jobs SET current_status=?, last_seen=? WHERE id=?").run(status, now, jobId);
      this.insertStatusHistory(jobId, current, status, actor, reason, now);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  getStatusHistory(jobId: string): Array<{ status: PipelineStatus; changedAt: string; reason: string }> {
    return this.db
      .prepare("SELECT to_status, changed_at, reason FROM status_history WHERE job_id=? ORDER BY id ASC")
      .all(jobId)
      .map((row: any) => ({ status: row.to_status, changedAt: row.changed_at, reason: row.reason }));
  }

  recordEvaluation(jobId: string, report: EvaluationReport) {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO evaluations (job_id, eval_version, profile_version, content_hash, report_json, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(jobId, report.rubricVersion, report.profileVersion, this.getJob(jobId).contentHash, JSON.stringify(report), new Date().toISOString());
  }

  hasEvaluation(jobId: string, evalVersion: string, profileVersion: string, contentHash: string) {
    return Boolean(
      this.db
        .prepare("SELECT id FROM evaluations WHERE job_id=? AND eval_version=? AND profile_version=? AND content_hash=?")
        .get(jobId, evalVersion, profileVersion, contentHash)
    );
  }

  latestEvaluation(jobId: string): EvaluationReport | null {
    const row = this.db.prepare("SELECT report_json FROM evaluations WHERE job_id=? ORDER BY id DESC LIMIT 1").get(jobId) as { report_json: string } | undefined;
    return row ? (JSON.parse(row.report_json) as EvaluationReport) : null;
  }

  exportMarkdown(options: { profile?: UserProfile } = {}) {
    const lines = ["# Job Tracker Export", "", "| Status | Company | Title | City | Salary | Score |", "|---|---|---|---|---|---|"];
    for (const job of this.listJobs()) {
      const score = this.latestEvaluation(job.id)?.score.toFixed(1) ?? "-";
      lines.push(
        `| ${escapeMarkdown(job.currentStatus)} | ${escapeMarkdown(job.company)} | ${escapeMarkdown(job.title)} | ${escapeMarkdown(job.city)} | ${escapeMarkdown(formatSalary(job))} | ${score} |`
      );
    }
    return redactText(lines.join("\n"), options.profile);
  }

  exportTsv(options: { profile?: UserProfile } = {}) {
    const rows = [["status", "company", "title", "city", "salary", "score"]];
    for (const job of this.listJobs()) rows.push([job.currentStatus, job.company, job.title, job.city, formatSalary(job), this.latestEvaluation(job.id)?.score.toFixed(1) ?? ""]);
    const output = rows.map((row) => row.map(tsvCell).join("\t")).join("\n");
    return redactText(output, options.profile);
  }

  close() {
    this.db.close();
  }

  private findExistingJobId(job: CanonicalJob) {
    if (job.source.canonicalUrl) {
      const byUrl = this.db.prepare("SELECT job_id FROM job_sources WHERE canonical_url=?").get(job.source.canonicalUrl) as { job_id: string } | undefined;
      if (byUrl?.job_id) return byUrl.job_id;
    }
    const byFingerprint = this.db.prepare("SELECT id FROM jobs WHERE identity_fingerprint=?").get(job.identityFingerprint) as { id: string } | undefined;
    return byFingerprint?.id ?? null;
  }

  private upsertSource(jobId: string, job: CanonicalJob, now: string) {
    const existing = this.db
      .prepare("SELECT id FROM job_sources WHERE job_id=? AND provider_id=? AND COALESCE(canonical_url, '')=COALESCE(?, '')")
      .get(jobId, job.source.providerId, job.source.canonicalUrl ?? "") as { id: number } | undefined;
    if (existing) {
      this.db.prepare("UPDATE job_sources SET last_seen=?, url=?, raw_ref=? WHERE id=?").run(now, job.source.url, job.source.rawRef, existing.id);
    } else {
      this.db
        .prepare("INSERT INTO job_sources (job_id, provider_id, platform, url, canonical_url, raw_ref, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(jobId, job.source.providerId, job.source.platform, job.source.url, job.source.canonicalUrl, job.source.rawRef, now, now);
    }
  }

  private insertStatusHistory(jobId: string, from: PipelineStatus | null, to: PipelineStatus, actor: string, reason: string, changedAt: string) {
    this.db.prepare("INSERT INTO status_history (job_id, from_status, to_status, changed_at, actor, reason) VALUES (?, ?, ?, ?, ?, ?)").run(jobId, from, to, changedAt, actor, reason);
  }
}

function mapJobRow(row: JobRow): StoredJob {
  return {
    id: row.id,
    source: { providerId: "tracker", platform: "tracker", url: null, canonicalUrl: null, rawRef: null, fetchedAt: row.last_seen },
    title: row.title,
    rawTitle: row.raw_title,
    company: row.company,
    rawCompany: row.raw_company,
    city: row.city,
    cities: JSON.parse(row.cities_json),
    salary: JSON.parse(row.salary_json),
    experience: row.experience,
    education: row.education,
    tags: JSON.parse(row.tags_json),
    description: row.description,
    contentHash: row.content_hash,
    identityFingerprint: row.identity_fingerprint,
    dedupKey: row.dedup_key,
    currentStatus: row.current_status,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen
  };
}

function formatSalary(job: StoredJob | CanonicalJob) {
  if (job.salary.isNegotiable) return "negotiable";
  if (job.salary.minK !== null && job.salary.maxK !== null && job.salary.minK !== job.salary.maxK) return `${job.salary.minK}-${job.salary.maxK}K`;
  if (job.salary.minK !== null && job.salary.maxK === null) return `${job.salary.minK}K+`;
  if (job.salary.minK !== null) return `${job.salary.minK}K`;
  return job.salary.raw || "-";
}

function escapeMarkdown(value: string) {
  return value.replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/javascript:/gi, "");
}

function tsvCell(value: string) {
  const clean = value.replace(/[\t\r\n]+/g, " ");
  return /^[=+\-@]/.test(clean) ? `'${clean}` : clean;
}
