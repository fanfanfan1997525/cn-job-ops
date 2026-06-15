# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-15)

**Core value:** Help the user avoid wasting time on bad or risky roles by turning domestic job listings into local, explainable, privacy-preserving decisions and drafts, with the user always approving any external action.
**Current focus:** v1 implementation complete; ready for user trial with local fixture/manual workflows plus explicit Liepin official MCP search import.

## Current Position

Phase: 7 of 7 (Dashboard and Release Hardening)
Plan: all roadmap plans complete
Status: Complete
Last activity: 2026-06-15 - Added search-only Liepin official MCP provider after public source refresh; Claude CLI review initially hit session limit, then rejected unsafe defaults, and the implementation was corrected to require user opt-in plus an absolute official command path.

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

- `npm test` passed: 7 files, 29 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm audit --json` returned 0 vulnerabilities.
- `npm run smoke` passed.
- `npm pack --dry-run` passed with 25 packaged files.

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
- CN Job Ops still does not run its own MCP server; MCP integrations are external provider adapters behind explicit CLI commands.
- Liepin official MCP is user-opt-in for explicit search import only; resume improvement, application submission, upload, chat, or recruiter-contact actions remain blocked pending credential-backed schema review.
- Third-party `liepin-cli` and `boss-cli` stay non-executable descriptors unless separately reviewed.

### Pending Todos

None for v1. User trial should use fixture/manual workflows first.

### Blockers/Concerns

- Live provider execution remains intentionally blocked except explicit `liepin-official-mcp` search import with user credential and an absolute official command path from generated MCP JSON.
- `node:sqlite` requires the Node runtime to expose `node:sqlite`; current machine verified this before implementation.
- Claude CLI decision review succeeded after the 2026-06-15 17:30 Asia/Singapore reset and required removal of default third-party command execution, absolute path enforcement, failure redaction, and approval-status downgrade.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Integration | Official BOSS/Liepin/Zhaopin/51job APIs | Revisit only with official documentation or partner access | Initialization |
| Integration | Official BOSS/Zhaopin/51job/Lagou CLI/MCP | Revisit only with official documentation or partner access | 2026-06-15 provider refresh |
| UX | Browser extension copy-assist | Deferred to v2 after local CLI is proven | Initialization |
| Cloud | Encrypted sync / SaaS | Deferred until local privacy model is validated | Initialization |

## Session Continuity

Last session: 2026-06-15
Stopped at: v1 complete and verified.
Resume file: None
