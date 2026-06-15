# Requirements: CN Job Ops

**Defined:** 2026-06-15
**Core Value:** Help the user avoid wasting time on bad or risky roles by turning domestic job listings into local, explainable, privacy-preserving decisions and drafts, with the user always approving any external action.

## v1 Requirements

### Workspace and Profile

- [ ] **PROF-01**: User can initialize a local CN Job Ops workspace from the CLI without uploading profile or CV data.
- [ ] **PROF-02**: User can enter or update CV, career story, target roles, locations, salary expectations, red lines, and platform preferences through files or guided prompts.
- [ ] **PROF-03**: User profile data is stored in a gitignored local data area and redacted from logs by default.
- [ ] **PROF-04**: Evaluation commands refuse to run until the minimum profile fields required by the scoring rubric are present.

### Provider Access and Compliance

- [ ] **PROV-01**: System exposes a provider interface with declared capabilities, approval status, rate limits, and failure types for each provider.
- [ ] **PROV-02**: User can search domestic jobs through an `mcp-jobs` provider adapter when that provider is enabled.
- [ ] **PROV-03**: User can manually import a job from pasted JD text, saved page text, or URL metadata when live provider access is unavailable or not approved.
- [ ] **PROV-04**: System blocks CAPTCHA bypass, proxy/ban evasion, credential harvesting, automated login, automated chat, and automated application submission.
- [ ] **PROV-05**: System writes an audit event for every provider operation, including provider id, operation, query, status, failure reason, and timestamp.

### Job Data and Tracker

- [ ] **DATA-01**: System normalizes provider/manual input into a canonical job schema with source, URL, company, title, city, salary, experience, education, tags, description, fetched-at, and raw-snapshot reference.
- [ ] **DATA-02**: System deduplicates repeated jobs across providers using URL identity, normalized company/title/city, and content hashes.
- [ ] **DATA-03**: User can view and update pipeline statuses: discovered, shortlisted, rejected, drafted, applied manually, interviewing, offer, closed.
- [ ] **DATA-04**: System can export tracker state to Markdown or TSV without exposing raw sensitive profile data.

### Evaluation and Risk

- [ ] **EVAL-01**: User can evaluate a job against the local profile using a seven-block rubric: role summary, CV match, gaps, level strategy, compensation sanity, personalization, interview prep, and posting-legitimacy risk.
- [ ] **EVAL-02**: Each evaluation produces a 0.0-5.0 recommendation score, final recommendation, confidence level, and evidence for each block.
- [ ] **EVAL-03**: Jobs scoring below 4.0/5 default to "do not apply" unless the user explicitly overrides.
- [ ] **EVAL-04**: System flags domestic fraud or low-quality patterns such as training-loan bait, upfront fees, off-platform payment/contact lure, unrealistic high salary with no experience, stale/ghost posting signals, agency ambiguity, and mismatched company identity.
- [ ] **EVAL-05**: System caches evaluations by job content hash and profile version so repeated scans do not spend tokens on unchanged jobs.

### Drafts and Human Approval

- [ ] **DRFT-01**: User can generate a tailored resume draft for a shortlisted job using evaluation evidence and local CV facts.
- [ ] **DRFT-02**: User can generate a cover letter or short application note for a shortlisted job.
- [ ] **DRFT-03**: User can generate a BOSS/Liepin-style greeting draft with tone variants and rationale.
- [ ] **DRFT-04**: Generated drafts are saved locally and clearly labeled as drafts requiring user review.
- [ ] **DRFT-05**: System never sends, uploads, chats, or applies on behalf of the user in v1.

### Scan and Report Workflow

- [ ] **SCAN-01**: User can save named search profiles such as role keywords, cities, salary range, platform/provider, and exclusion rules.
- [ ] **SCAN-02**: User can run a scan that fetches/imports jobs, deduplicates them, records provider health, and evaluates only new or changed shortlisted candidates according to config.
- [ ] **SCAN-03**: User can generate a weekly report summarizing new high-score jobs, rejected-risk jobs, salary/skill trends, provider failures, and recommended next actions.

### Local Inspection and Release Readiness

- [ ] **UX-01**: User can inspect job records, scores, evidence, drafts, and status history from the CLI.
- [ ] **UX-02**: User can open a local dashboard or TUI over the tracker after core CLI workflows are stable.
- [ ] **QA-01**: Provider adapters have fixture-based contract tests for success, empty, blocked, parse-change, and rate-limited outcomes.
- [ ] **QA-02**: Policy gate, redaction, dedup, scoring threshold, and draft-only behavior are covered by automated tests.
- [ ] **QA-03**: Release documentation explains setup, provider risk, local data locations, and what the tool will not automate.

## v2 Requirements

### Official Integrations

- **OFFI-01**: User can connect official platform APIs if BOSS, Liepin, Zhaopin, 51job, or Lagou publish approved job-seeker access.
- **OFFI-02**: System can migrate provider approval status from "unknown/user_opt_in" to "approved" only with source-linked official documentation.

### Advanced UX

- **UX2-01**: User can use a browser extension or copy-assist workflow to paste approved drafts into platform UIs without automated sending.
- **UX2-02**: User can encrypt and sync local data between their own machines.
- **UX2-03**: User can maintain a local company/recruiter reputation notebook from personal experience.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automatic apply/send/chat | High account, legal, and reputation risk; contradicts human-in-the-loop core value |
| CAPTCHA solving, proxy evasion, private API reverse engineering | Explicitly outside compliance boundary |
| Public job dataset or resale | The project is a personal local assistant, not a data extraction business |
| Recruiter-side sourcing automation | Different product with different compliance and ethics risks |
| Cloud multi-user SaaS | Adds authentication, tenant isolation, security, and legal burden before local value is proven |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| PROF-03 | Phase 1 | Complete |
| PROF-04 | Phase 1 | Complete |
| PROV-01 | Phase 2 | Complete |
| PROV-02 | Phase 2 | Complete |
| PROV-03 | Phase 2 | Complete |
| PROV-04 | Phase 1 | Complete |
| PROV-05 | Phase 2 | Complete |
| DATA-01 | Phase 3 | Complete |
| DATA-02 | Phase 3 | Complete |
| DATA-03 | Phase 3 | Complete |
| DATA-04 | Phase 3 | Complete |
| EVAL-01 | Phase 4 | Complete |
| EVAL-02 | Phase 4 | Complete |
| EVAL-03 | Phase 4 | Complete |
| EVAL-04 | Phase 4 | Complete |
| EVAL-05 | Phase 4 | Complete |
| DRFT-01 | Phase 5 | Complete |
| DRFT-02 | Phase 5 | Complete |
| DRFT-03 | Phase 5 | Complete |
| DRFT-04 | Phase 5 | Complete |
| DRFT-05 | Phase 5 | Complete |
| SCAN-01 | Phase 6 | Complete |
| SCAN-02 | Phase 6 | Complete |
| SCAN-03 | Phase 6 | Complete |
| UX-01 | Phase 7 | Complete |
| UX-02 | Phase 7 | Complete |
| QA-01 | Phase 7 | Complete |
| QA-02 | Phase 7 | Complete |
| QA-03 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-06-15*
*Last updated: 2026-06-15 after initial definition*
