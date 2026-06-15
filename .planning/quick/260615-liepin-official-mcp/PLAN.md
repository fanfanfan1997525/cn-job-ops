# Quick Plan: Liepin Official MCP Search Integration

## Trigger

User asked to search whether mainstream domestic recruitment sites publish CLI/MCP-style integrations comparable to Feishu CLI, and to directly integrate any suitable provider.

## Findings

- Liepin publishes an official MCP server page for AI job-search clients. Search-result text observed on 2026-06-15 says logged-in users can generate credentials and copy MCP JSON into Cursor, Trae, Codex, Claude, or Cline.
- Direct browsing of the Liepin MCP page redirected to Liepin safety/CAPTCHA controls, so credential and platform-control failures must stay first-class.
- `mcp-jobs` remains a public third-party multi-platform MCP facade for Liepin, BOSS, Zhaopin, and 51job.
- Third-party `liepin-cli`, `boss-agent-cli`, and `boss-cli` projects exist, but they are not official platform approval.
- No official BOSS, Zhaopin, 51job, or Lagou CLI/MCP entry was found in this pass.

## Claude Review

Claude CLI decision review was attempted before approving the provider change. The command failed with account session limit:

```text
You've hit your session limit · resets 5:30pm (Asia/Singapore)
```

Fallback decision before reset: approve only the official Liepin MCP search import surface, keep all apply/resume/upload/chat/recruiter-contact actions blocked, and leave third-party wrappers non-executable.

After the 17:30 reset, Claude CLI reviewed the implementation and rejected the initial version because it defaulted to the third-party `liepin-cli`, allowed naked PATH command resolution, could leak token text through failure messages, and marked the provider `approved` before credential-backed schema verification. The corrected plan is user-opt-in only, requires an absolute command path from generated official MCP JSON, and redacts provider secrets from failure output.

## Implementation Plan

1. Add RED provider contract tests for official Liepin MCP descriptor, search-only adapter args, token env passing, normalization, and structured auth failure.
2. Implement `LiepinOfficialProvider` as a small external command adapter with injected runner support for tests.
3. Register `liepin-official-mcp` as user-opt-in/executable for `search` and `detail` metadata; keep actual code path search-only.
4. Add explicit `cn-job-ops liepin-search` command that imports search results into the local tracker.
5. Update provider risk, MCP docs, README, and project state.
6. Run tests, typecheck, build, audit, package dry run, and review diff before commit.
