# Provider Risk

## v1 Provider Status

| Provider | Status | Executable in v1 | Notes |
|---|---:|---:|---|
| `manual` | `manual` | yes | Pasted JD/text/URL metadata only. |
| `fixture` | `fixture` | yes | Synthetic local fixtures for contract tests and smoke workflows. |
| `mcp-jobs` | `user_opt_in` | only with injected runner | Third-party multi-platform facade. Still policy-gated and treated as untrusted output. |
| `liepin-cli` | `unknown` | no | Descriptor only until official, source-linked docs justify approval. |
| `boss-cli` | `unknown` | no | Descriptor only; no chat/apply/login automation path in v1. |

## Source Notes

- `mcp-jobs` publicly documents an `npx -y mcp-jobs` MCP service and claims support for multiple Chinese job boards including Liepin, BOSS, Zhaopin, and 51job: <https://github.com/mergedao/mcp-jobs>
- Liepin has a public MCP server page, but direct browsing may hit platform safety/CAPTCHA controls: <https://www.liepin.com/mcp/server>
- A third-party Liepin skill page describes a `liepin-cli` wrapper and token-based auth. This project does not treat that page as sufficient v1 approval: <https://claudemarketplaces.com/mcp/io.github.xllinbupt/liepin-jobs>
- A third-party BOSS CLI skill describes search and account actions. This project registers it only as a non-executable risk descriptor in v1: <https://github.com/jackwener/boss-cli/blob/main/SKILL.md>

## Hard Rules

- Unknown providers cannot be made executable by user preference alone.
- Provider failures stay structured: `empty`, `blocked`, `transient_failure`, `parse_changed`, `rate_limited`, `login_required`, `legal_blocked`, and `unsupported`.
- `empty` is never used as a fallback for blocked, parse-changed, login-required, or legal-blocked states.
- All provider output is untrusted input and must go through canonical normalization before tracking.
- No secrets, cookies, tokens, profile PII, or raw CV content should be written into git-visible paths.
