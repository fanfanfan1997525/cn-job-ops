# Roadmap: CN Job Ops

## Overview

Build the project as a vertical MVP: first a safe local workspace and profile, then a gated domestic provider MVP, then stable local data/tracking, then evaluation, drafts, repeated scan/reporting, and finally dashboard/release hardening. The sequence protects privacy and compliance before any live platform integration becomes load-bearing.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions marked with INSERTED

- [ ] **Phase 1: Local Safety Foundation** - Scaffold the local CLI workspace, profile storage, and policy guardrails.
- [ ] **Phase 2: Provider Discovery MVP** - Add provider contracts, `mcp-jobs`, manual import, and audit events.
- [ ] **Phase 3: Canonical Data and Tracker** - Normalize, deduplicate, persist, and export job pipeline state.
- [ ] **Phase 4: Evaluation and Risk Engine** - Score roles, explain recommendations, and detect domestic fraud/ghost risks.
- [ ] **Phase 5: Draft Generation** - Generate resume, cover note, and greeting drafts with manual approval.
- [ ] **Phase 6: Scan and Report Workflow** - Add saved searches, repeated scans, provider health, and weekly reports.
- [ ] **Phase 7: Dashboard and Release Hardening** - Add local inspection UI, test coverage, packaging docs, and release readiness.

## Phase Details

### Phase 1: Local Safety Foundation
**Goal:** User can initialize a local CN Job Ops workspace with profile/CV preferences stored privately and unsafe external actions blocked by default.
**Mode:** mvp
**UI hint:** no
**Depends on:** Nothing (first phase)
**Requirements:** [PROF-01, PROF-02, PROF-03, PROF-04, PROV-04]
**Canonical refs:** .planning/PROJECT.md, .planning/research/SUMMARY.md, .planning/research/PITFALLS.md
**Success Criteria** (what must be TRUE):
  1. User can run an init command that creates local config/data directories without committing personal data.
  2. User can create or update minimum profile/CV/preference inputs.
  3. Evaluation refuses to run when required profile fields are missing.
  4. Policy gate blocks CAPTCHA bypass, proxy evasion, automated login, chat, and apply operations.
  5. Secret/redaction checks prove user profile data is not printed or committed.
**Plans:** 3 plans

Plans:
- [ ] 01-01: Scaffold CLI/config/data layout and gitignored runtime paths.
- [ ] 01-02: Implement profile onboarding, schema validation, and completeness checks.
- [ ] 01-03: Implement policy gate skeleton, unsafe-operation blocks, and redaction tests.

### Phase 2: Provider Discovery MVP
**Goal:** User can discover/import domestic job listings through gated providers, starting with `mcp-jobs` and manual import, with auditable failure handling.
**Mode:** mvp
**UI hint:** no
**Depends on:** Phase 1
**Requirements:** [PROV-01, PROV-02, PROV-03, PROV-05]
**Canonical refs:** .planning/research/STACK.md, .planning/research/ARCHITECTURE.md
**Success Criteria** (what must be TRUE):
  1. Each provider declares capabilities, approval status, rate limits, and failure taxonomy.
  2. User can enable and run `mcp-jobs` search through the provider abstraction.
  3. User can import a manual JD/text/URL record without live platform scraping.
  4. Provider operations write audit events with status and failure reason.
  5. Fixture contract tests cover success, empty, blocked, parse-change, and transient failure outcomes.
**Plans:** 3 plans

Plans:
- [ ] 02-01: Define provider interface, descriptors, config, and policy integration.
- [ ] 02-02: Implement `mcp-jobs` adapter and manual import adapter with fixtures.
- [ ] 02-03: Implement provider audit log and failure classification tests.

### Phase 3: Canonical Data and Tracker
**Goal:** User can store, deduplicate, inspect, and export a local job pipeline independent of provider quirks.
**Mode:** mvp
**UI hint:** no
**Depends on:** Phase 2
**Requirements:** [DATA-01, DATA-02, DATA-03, DATA-04]
**Canonical refs:** .planning/research/ARCHITECTURE.md, .planning/REQUIREMENTS.md
**Success Criteria** (what must be TRUE):
  1. Provider/manual inputs normalize into a validated canonical job schema.
  2. Duplicate jobs across repeated scans/providers merge into one tracker record.
  3. User can update and view pipeline status history from the CLI.
  4. Markdown/TSV exports contain useful summaries without raw sensitive profile data.
**Plans:** 3 plans

Plans:
- [ ] 03-01: Implement canonical job schema, salary/city parsers, and raw snapshot references.
- [ ] 03-02: Implement SQLite tracker, dedup keys, and status history.
- [ ] 03-03: Implement CLI inspection and Markdown/TSV exports.

### Phase 4: Evaluation and Risk Engine
**Goal:** User can evaluate any tracked job with explainable fit scoring, recommendation threshold, and domestic fraud/ghost-posting risk analysis.
**Mode:** mvp
**UI hint:** no
**Depends on:** Phase 3
**Requirements:** [EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05]
**Canonical refs:** .planning/research/FEATURES.md, .planning/research/PITFALLS.md
**Success Criteria** (what must be TRUE):
  1. Evaluation report includes all required score blocks with evidence and confidence.
  2. Jobs below 4.0/5 default to "do not apply" with override path.
  3. Domestic risk block flags training-loan, upfront-fee, off-platform lure, stale/ghost, agency ambiguity, and company mismatch patterns.
  4. Re-running evaluation on unchanged job/profile uses cache instead of spending tokens again.
  5. Fixture tests include high-fit, low-fit, scam-risk, stale, and ambiguous cases.
**Plans:** 4 plans

Plans:
- [ ] 04-01: Design scoring rubric, profile/job evidence model, and report format.
- [ ] 04-02: Implement evaluation engine and score threshold behavior.
- [ ] 04-03: Implement domestic fraud/ghost risk detector with fixtures.
- [ ] 04-04: Implement evaluation cache keyed by job hash and profile version.

### Phase 5: Draft Generation
**Goal:** User can generate locally saved resume, cover note, and BOSS/Liepin greeting drafts for shortlisted jobs, with clear manual review boundaries.
**Mode:** mvp
**UI hint:** no
**Depends on:** Phase 4
**Requirements:** [DRFT-01, DRFT-02, DRFT-03, DRFT-04, DRFT-05]
**Canonical refs:** .planning/PROJECT.md, .planning/research/PITFALLS.md
**Success Criteria** (what must be TRUE):
  1. Resume draft uses only facts from the local profile/CV plus job-specific emphasis.
  2. Cover note and greeting drafts cite evaluation evidence and avoid unsupported claims.
  3. Draft files are labeled as drafts requiring user review.
  4. No command sends, uploads, chats, or applies externally.
  5. Tests prove draft-only behavior cannot trigger provider side effects.
**Plans:** 3 plans

Plans:
- [ ] 05-01: Implement resume variant generation and fact-grounding checks.
- [ ] 05-02: Implement cover note and BOSS/Liepin greeting draft generation.
- [ ] 05-03: Implement draft artifact storage, labels, and no-external-side-effect tests.

### Phase 6: Scan and Report Workflow
**Goal:** User can save search profiles, run repeated scans safely, evaluate changed/new opportunities, and receive a weekly market/report summary.
**Mode:** mvp
**UI hint:** no
**Depends on:** Phase 5
**Requirements:** [SCAN-01, SCAN-02, SCAN-03]
**Canonical refs:** .planning/research/SUMMARY.md
**Success Criteria** (what must be TRUE):
  1. User can create and run named search profiles with role, city, salary, provider, and exclusion settings.
  2. Scan workflow records provider health and classifies failures without collapsing them to "no jobs."
  3. Scan workflow evaluates only new or changed jobs according to profile/config.
  4. Weekly report summarizes high-score jobs, rejected-risk jobs, salary/skill trends, provider failures, and next actions.
**Plans:** 3 plans

Plans:
- [ ] 06-01: Implement saved search profiles and scan orchestration.
- [ ] 06-02: Implement provider health and incremental evaluation flow.
- [ ] 06-03: Implement weekly report generation and regression fixtures.

### Phase 7: Dashboard and Release Hardening
**Goal:** User can inspect the pipeline through a local UI/TUI and the project has enough tests, docs, and packaging to be safely used.
**Mode:** mvp
**UI hint:** yes
**Depends on:** Phase 6
**Requirements:** [UX-01, UX-02, QA-01, QA-02, QA-03]
**Canonical refs:** .planning/research/STACK.md, .planning/research/ARCHITECTURE.md
**Success Criteria** (what must be TRUE):
  1. User can browse jobs, scores, evidence, drafts, and status history from CLI and local dashboard/TUI.
  2. Provider, policy, redaction, dedup, scoring, draft-only, and report tests run in one command.
  3. Setup docs explain local data paths, provider risks, optional dependencies, and forbidden automation.
  4. Packaging exposes a clear `cn-job-ops` CLI and optional MCP server entrypoint.
  5. Final smoke test initializes a fresh workspace, imports a fixture JD, evaluates it, generates drafts, exports tracker, and shows no secrets in git status.
**Plans:** 4 plans

Plans:
- [ ] 07-01: Implement local dashboard/TUI over tracker state.
- [ ] 07-02: Consolidate automated tests and smoke workflow.
- [ ] 07-03: Write setup, provider-risk, and user-data documentation.
- [ ] 07-04: Package CLI/MCP entrypoints and run release readiness checks.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Safety Foundation | 0/3 | Not started | - |
| 2. Provider Discovery MVP | 0/3 | Not started | - |
| 3. Canonical Data and Tracker | 0/3 | Not started | - |
| 4. Evaluation and Risk Engine | 0/4 | Not started | - |
| 5. Draft Generation | 0/3 | Not started | - |
| 6. Scan and Report Workflow | 0/3 | Not started | - |
| 7. Dashboard and Release Hardening | 0/4 | Not started | - |
