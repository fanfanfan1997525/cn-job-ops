# Phase 7: Dashboard and Release Hardening - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Expose read-only local inspection through CLI/TUI snapshot, consolidate tests, document setup/provider/local-data risk, configure packaging, and verify release readiness.
</domain>

<decisions>
## Implementation Decisions

### Dashboard and packaging
- **D-01:** Dashboard is a read-only non-interactive terminal snapshot in v1.
- **D-02:** Package exposes one `cn-job-ops` bin.
- **D-03:** `files` allowlist controls npm tarball contents.
- **D-04:** MCP is a dependency-free placeholder only.

### Claude decision review
- Claude accepted conditionally and required read-only dashboard, non-TTY behavior, one-command tests, docs, secret-safe package allowlist, and MCP placeholder with no runtime weight.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 7 success criteria.
- `.planning/REQUIREMENTS.md` — `UX-01`, `UX-02`, `QA-01`..`QA-03`.
- `README.md`, `docs/PROVIDER-RISK.md`, `docs/LOCAL-DATA.md`, `docs/MCP.md` — release docs.
- `tests/tdd/cn-job-ops/cli-dashboard.test.ts` — smoke contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/cli.ts` provides all commands and dashboard snapshot.
- `package.json` defines bin, files allowlist, scripts, and prepublish gate.
- `.gitattributes` enforces LF line endings for package scripts.
</code_context>

<deferred>
## Deferred Ideas

- Interactive TUI mutations are out of scope for v1.
</deferred>
