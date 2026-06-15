# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-15)

**Core value:** Help the user avoid wasting time on bad or risky roles by turning domestic job listings into local, explainable, privacy-preserving decisions and drafts, with the user always approving any external action.
**Current focus:** v1 implementation complete; ready for user trial with local fixture/manual workflows.

## Current Position

Phase: 7 of 7 (Dashboard and Release Hardening)
Plan: all roadmap plans complete
Status: Complete
Last activity: 2026-06-15 - Implemented v1 vertical CLI with TDD, Claude decision review, docs, release checks, and GSD phase verification artifacts.

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total roadmap plans completed: 23
- Phase execution mode: autonomous TDD vertical slice
- Total execution time: current session

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Local Safety Foundation | 3 | 3 | current session |
| 2. Provider Discovery MVP | 3 | 3 | current session |
| 3. Canonical Data and Tracker | 3 | 3 | current session |
| 4. Evaluation and Risk Engine | 4 | 4 | current session |
| 5. Draft Generation | 3 | 3 | current session |
| 6. Scan and Report Workflow | 3 | 3 | current session |
| 7. Dashboard and Release Hardening | 4 | 4 | current session |

## Verification Snapshot

- `npm test` passed: 7 files, 25 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm audit --json` returned 0 vulnerabilities.
- `npm run smoke` passed.
- `npm pack --dry-run` passed with 24 allowlisted files.

## Accumulated Context

### Decisions

- Keep v1 local-first and CLI-first.
- Keep runtime data under gitignored `.cn-job-ops/`.
- Treat `mcp-jobs` as `user_opt_in`, not compliance proof.
- Keep `boss-cli` and `liepin-cli` as descriptor-only `unknown` providers in v1.
- Split job entities from source observations in SQLite.
- Use risk veto separate from fit score; hard veto for training-loan/upfront-fee patterns.
- Drafts are local review artifacts only and never send/upload/chat/apply.
- Dashboard is read-only, non-interactive terminal output in v1.
- MCP is a dependency-free placeholder only.

### Pending Todos

None for v1. User trial should use fixture/manual workflows first.

### Blockers/Concerns

- Live provider execution remains intentionally blocked pending official source-linked approvals.
- `node:sqlite` requires the Node runtime to expose `node:sqlite`; current machine verified this before implementation.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Integration | Official BOSS/Liepin/Zhaopin/51job APIs | Revisit only with official documentation or partner access | Initialization |
| UX | Browser extension copy-assist | Deferred to v2 after local CLI is proven | Initialization |
| Cloud | Encrypted sync / SaaS | Deferred until local privacy model is validated | Initialization |

## Session Continuity

Last session: 2026-06-15
Stopped at: v1 complete and verified.
Resume file: None
