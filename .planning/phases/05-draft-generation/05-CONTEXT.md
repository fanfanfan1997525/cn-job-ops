# Phase 5: Draft Generation - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Generate local resume, cover note, and greeting drafts for reviewed jobs without sending, uploading, chatting, or applying externally.
</domain>

<decisions>
## Implementation Decisions

### Draft-only boundary
- **D-01:** Draft generation writes local Markdown artifacts only.
- **D-02:** Draft content must contain `DRAFT - REVIEW REQUIRED`.
- **D-03:** The generator uses a closed-world fact set: profile CV facts plus evaluation evidence.
- **D-04:** The module has no provider action path; tests prove external action probes are not called.

### Claude decision review
- Claude accepted conditionally and required fact provenance plus anti-fabrication tests, not only no-side-effect tests.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 5 success criteria.
- `.planning/REQUIREMENTS.md` — `DRFT-01`..`DRFT-05`.
- `tests/tdd/cn-job-ops/drafts.test.ts` — draft-only and provenance contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/drafts.ts` generates drafts and writes local artifacts.
</code_context>

<deferred>
## Deferred Ideas

- Browser extension copy-assist remains v2.
</deferred>
