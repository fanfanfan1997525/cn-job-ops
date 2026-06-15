# Phase 3: Canonical Data and Tracker - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Normalize job records, deduplicate them, persist local tracker state, track status history, and export safe Markdown/TSV summaries.
</domain>

<decisions>
## Implementation Decisions

### Data model
- **D-01:** Split job entity from observations with a `job_sources` table.
- **D-02:** Use a stable surrogate job id and keep source URLs as observations.
- **D-03:** Store structured salary with raw text, min/max, months/year, and negotiable flag.
- **D-04:** Store city as normalized multi-value data, not a single scalar.
- **D-05:** Content hash is a change detector, not the sole dedup identity.

### Claude decision review
- Claude rejected the scalar URL/salary/city model and required source splitting, structured salary/city, URL canonicalization, prepared SQL, FK enforcement, transactions, and allowlisted exports.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 3 success criteria.
- `.planning/REQUIREMENTS.md` — `DATA-01`..`DATA-04`.
- `tests/tdd/cn-job-ops/canonical-tracker.test.ts` — normalization/tracker/export contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/jobs/normalize.ts` normalizes inputs and computes hashes/fingerprints.
- `src/tracker.ts` owns SQLite schema, upsert, source merging, status history, evaluation records, and exports.
</code_context>

<deferred>
## Deferred Ideas

- Provider-specific stable job id extraction can be added when official provider schemas are approved.
</deferred>
