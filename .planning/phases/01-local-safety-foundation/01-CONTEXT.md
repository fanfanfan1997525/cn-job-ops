# Phase 1: Local Safety Foundation - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Initialize a gitignored local workspace, store profile data locally, validate scoring prerequisites, redact profile data, and block unsafe external operations by default.
</domain>

<decisions>
## Implementation Decisions

### Safety boundary
- **D-01:** Policy decisions use a closed operation enum and fail closed for unknown operations or unloaded rules.
- **D-02:** The unsafe v1 operation set is `apply`, `chat`, `automated_login`, `captcha_bypass`, `proxy_evasion`, `credential_harvest`, `upload`, and `send`.
- **D-03:** AI prompt-like text must pass through `buildRedactedPrompt()` and expose safe/redacted field metadata.

### Local data
- **D-04:** Runtime state lives in `.cn-job-ops/` or an explicit workspace path and is enforced in `.gitignore`.
- **D-05:** Profile completeness is required before evaluation.

### Claude decision review
- Claude accepted with conditions: capability-level PolicyGate, fail-closed defaults, single redaction chokepoint, gitignore not treated as sole protection, and no live provider in Phase 1.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 1 goal and success criteria.
- `.planning/REQUIREMENTS.md` — `PROF-01`..`PROF-04`, `PROV-04`.
- `tests/tdd/cn-job-ops/profile-policy.test.ts` — executable RED/GREEN contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/workspace.ts` creates workspace directories and gitignore entries.
- `src/profile.ts` reads, writes, validates, and redacts profile data.
- `src/policy.ts` implements fail-closed operation gating.
- `src/aiBoundary.ts` implements the single redacted prompt boundary.
</code_context>

<deferred>
## Deferred Ideas

- Encryption and multi-machine sync remain v2.
</deferred>
