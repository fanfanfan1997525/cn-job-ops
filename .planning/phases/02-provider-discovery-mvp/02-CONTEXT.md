# Phase 2: Provider Discovery MVP - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Provide a gated provider registry, manual import, fixture provider, `mcp-jobs` facade, and provider audit/failure taxonomy without enabling unsafe account automation.
</domain>

<decisions>
## Implementation Decisions

### Provider trust
- **D-01:** `mcp-jobs` is `user_opt_in`, default blocked, and executable only through an injected runner.
- **D-02:** `boss-cli` and `liepin-cli` are `unknown` descriptor-only providers in v1.
- **D-03:** `unknown` and `user_opt_in` are separate states; unknown providers cannot become executable by user preference alone.

### Failure taxonomy and audit
- **D-04:** Provider status includes `empty`, `blocked`, `transient_failure`, `parse_changed`, `rate_limited`, `login_required`, `legal_blocked`, and `unsupported`.
- **D-05:** Provider output is normalized before tracker insertion and treated as untrusted.

### Claude decision review
- Claude accepted only after splitting trust states, making boss/liepin descriptor-only, and adding missing failure classes.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 2 success criteria.
- `.planning/REQUIREMENTS.md` — `PROV-01`, `PROV-02`, `PROV-03`, `PROV-05`, `QA-01`.
- `docs/PROVIDER-RISK.md` — provider status and source notes.
- `tests/tdd/cn-job-ops/provider-contract.test.ts` — executable contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/providers/registry.ts` declares providers, capabilities, trust status, and failure taxonomy.
- `src/providers/fixture.ts`, `src/providers/manual.ts`, and `src/providers/mcpJobs.ts` implement executable v1 paths.
- `src/audit.ts` provides redacted append-only audit events.
</code_context>

<deferred>
## Deferred Ideas

- Upgrade any provider to approved only through source-linked official documentation.
</deferred>
