# Quick Summary: Liepin Official MCP Search Integration

## Outcome

Implemented an explicit, search-only Liepin official MCP integration path:

- `liepin-official-mcp` provider descriptor is user-opt-in and executable for discovery metadata.
- `LiepinOfficialProvider` runs an explicit absolute MCP/CLI command path with a user credential environment variable, parses JSON search output, normalizes jobs, redacts provider secrets from failures, and classifies provider failures.
- `cn-job-ops liepin-search` imports search results into the local tracker only after `LIEPIN_USER_TOKEN` or a user-selected token env var is present and an absolute official command path is supplied.
- Third-party `liepin-cli`, `boss-agent-cli`, `boss-cli`, and `mcp-jobs` remain separate from official provider approval.

## Safety Boundary

- No application submission.
- No resume upload or resume improvement command.
- No recruiter chat or greeting send.
- No CAPTCHA bypass, proxy evasion, or automated login.
- Missing credential returns `login_required`.
- Missing or naked external command returns `unsupported`.
- `.cmd` and `.bat` command shims return `unsupported`.
- Failure output redacts the provider token value before surfacing `failureReason`.
- Provider failure paths return before opening the SQLite tracker, so parallel failed probes do not lock the database.

## Verification

- RED: `npm test` initially failed because `src/providers/liepinOfficial.js` was missing.
- GREEN: `npm test` passed after implementation, latest observed result: 7 files, 29 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm audit --json` passed with 0 vulnerabilities.
- `npm run smoke` passed.
- `npm pack --dry-run` passed and included the built provider file.
- `node .\dist\src\cli.js providers` showed `liepin-official-mcp user_opt_in executable`.
- `node .\dist\src\cli.js liepin-search --workspace .cn-job-ops-smoke --keyword AI` returned `login_required: missing LIEPIN_USER_TOKEN`, as intended.
- `node .\dist\src\cli.js liepin-search --workspace .cn-job-ops-smoke --keyword AI --token-env CN_JOB_OPS_TEST_LIEPIN_TOKEN` returned `unsupported: Liepin official MCP command must be provided explicitly from the generated MCP JSON`, as intended.
- `node .\dist\src\cli.js liepin-search --workspace .cn-job-ops-smoke --keyword AI --token-env CN_JOB_OPS_TEST_LIEPIN_TOKEN --command liepin-cli` returned `unsupported: Liepin official MCP command must be an absolute path to avoid PATH hijacking`, as intended.

## Review Note

Claude CLI decision review was requested for the provider approval decision. It initially failed due account session limit, then succeeded after reset and returned `REJECT` for the first implementation. Required fixes were applied: remove third-party default command, require absolute command paths, redact provider secrets in failures, and downgrade status from `approved` to `user_opt_in` until credential-backed schema verification exists.
