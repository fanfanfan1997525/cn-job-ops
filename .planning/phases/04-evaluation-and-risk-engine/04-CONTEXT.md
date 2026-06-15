# Phase 4: Evaluation and Risk Engine - Context

**Gathered:** 2026-06-15
**Status:** Implemented

<domain>
## Phase Boundary

Evaluate tracked jobs against local profile data with explainable scoring, threshold recommendations, risk detection, and cacheable deterministic output.
</domain>

<decisions>
## Implementation Decisions

### Scoring
- **D-01:** Keep the v1 requirement threshold at 4.0/5.0.
- **D-02:** Separate fit score from risk-adjusted recommendation score.
- **D-03:** Hard-risk flags veto apply recommendations regardless of fit.
- **D-04:** Cache key includes job content hash, profile version, and rubric version.

### Risk taxonomy
- **D-05:** Hard veto: `training_loan`, `upfront_fee`.
- **D-06:** Strong/advisory risks remain visible with matched evidence.

### Claude decision review
- Claude accepted conditionally: risk must be a gate, not just a weighted score; cache must include rubric version; explanations must include evidence.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 4 success criteria.
- `.planning/REQUIREMENTS.md` — `EVAL-01`..`EVAL-05`.
- `tests/tdd/cn-job-ops/evaluation-risk.test.ts` — scoring/risk/cache contract.
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/evaluation.ts` implements deterministic scoring, risk evidence, recommendations, and in-memory evaluation cache.
</code_context>

<deferred>
## Deferred Ideas

- LLM-backed scoring can be added later behind the same redacted prompt boundary.
</deferred>
