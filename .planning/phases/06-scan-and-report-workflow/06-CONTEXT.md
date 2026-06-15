# Phase 6: Scan and Report Workflow - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Save search profiles, run repeated scans, record provider health, evaluate only new/changed/version-stale jobs, and generate weekly reports.
</domain>

<decisions>
## Implementation Decisions

### Incremental scan
- **D-01:** Search profiles are local JSON files with keywords, cities, salary, providers, and exclusions.
- **D-02:** Scan imports through provider abstraction and tracker upsert.
- **D-03:** Evaluation is skipped only when job content hash, profile version, and eval version already match.
- **D-04:** Provider failures remain distinct from empty results.

### Claude decision review
- Claude accepted conditionally and required precise change detection, per-provider health, eval-version invalidation, and reports that distinguish empty weeks from provider failures.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 6 success criteria.
- `.planning/REQUIREMENTS.md` — `SCAN-01`..`SCAN-03`.
- `tests/tdd/cn-job-ops/scan-report.test.ts` — scan/report contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/scan.ts` saves search profiles and orchestrates scans.
- `src/reports.ts` generates weekly reports.
</code_context>

<deferred>
## Deferred Ideas

- Delisting after N consecutive misses is deferred until live provider completeness can be measured.
</deferred>
