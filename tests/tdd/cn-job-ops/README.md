# CN Job Ops TDD Matrix

This matrix is the RED contract for the v1 autonomous implementation.

## Synthetic Case Coverage

- `cases.json` contains 10 synthetic job inputs covering high-fit, low-fit, scam-risk, stale/ghost, agency ambiguity, duplicate URL, duplicate content, missing salary, multi-city, and parse-change cases.
- Each case must assert at least two properties: canonical normalization and evaluation/risk behavior.
- Property test: canonical normalization and dedup keys are stable under whitespace and tag ordering changes.
- Metamorphic test: repeated scan of an unchanged job must not trigger a second evaluation, while changed content must.

## Requirement Mapping

- `profile-policy.test.ts`: `PROF-01`..`PROF-04`, `PROV-04`
- `provider-contract.test.ts`: `PROV-01`..`PROV-03`, `PROV-05`, `QA-01`
- `canonical-tracker.test.ts`: `DATA-01`..`DATA-04`
- `evaluation-risk.test.ts`: `EVAL-01`..`EVAL-05`
- `drafts.test.ts`: `DRFT-01`..`DRFT-05`
- `scan-report.test.ts`: `SCAN-01`..`SCAN-03`
- `cli-dashboard.test.ts`: `UX-01`, `UX-02`, `QA-02`, `QA-03`

## Sanitizer Guidance

High-risk logic is privacy and policy logic rather than memory-unsafe code. The equivalent sanitizer checks are:

- Run the full test suite with temp workspaces.
- Run `npm run typecheck`.
- Search committed files for runtime PII fixtures and local workspace leaks.
- Keep live providers opt-in, policy-gated, and excluded from default tests.
