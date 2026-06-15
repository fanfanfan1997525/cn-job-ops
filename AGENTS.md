<!-- GSD:project-start source:PROJECT.md -->
## Project

**CN Job Ops**

CN Job Ops is a local, CLI-first AI job-search command center for Chinese hiring platforms. It adapts the Career-Ops idea from the reference article to BOSS Zhipin, Liepin, Zhaopin, 51job, Lagou, and similar domestic sources through a provider layer that can use MCP/CLI tools, official APIs if they become available, or user-approved manual URL imports.

The product is not a mass-apply bot. It helps a technical job seeker find fewer but better roles, evaluate fit with explainable scoring, detect scams or stale postings, draft tailored resume/application materials, and keep all sensitive data on the user's machine.

**Core Value:** Help the user avoid wasting time on bad or risky roles by turning domestic job listings into local, explainable, privacy-preserving decisions and drafts, with the user always approving any external action.

### Constraints

- **Compliance**: Provider code must be capability-gated. Search/listing discovery can use approved tools; logged-in actions and data extraction beyond user-visible content require explicit user approval and platform-specific review.
- **Privacy**: CV, career story, target roles, evaluations, generated resumes, and tracker state stay local by default. No cloud sync in v1.
- **Human in loop**: The system may recommend, draft, and prepare. The user decides whether to apply, send a greeting, or contact a recruiter.
- **Platform volatility**: Domestic pages, risk controls, and terms can change. Providers need health checks, failure classification, and manual fallback instead of brittle hidden scraping.
- **CLI first**: Primary interface is a local command/MCP server, comparable in usage style to Feishu/Lark CLI workflows. Dashboard is a later local companion, not the initial surface.
- **Windows support**: The current workspace is Windows/PowerShell, Node v24.16.0, npm 11.16.0. Scripts must avoid POSIX-only assumptions unless guarded.
- **Testing**: Provider adapters require mocked fixtures and contract tests before any live probe. Live tests must be opt-in and rate-limited.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >=20 recommended; current machine v24.16.0 | Runtime for CLI, MCP server, provider adapters, Playwright automation | Matches Career-Ops and mcp-jobs ecosystems; already present locally |
| TypeScript | 6.0.3 observed in npm registry | Main implementation language | Strong contracts are important for provider normalization and safety gates |
| `@modelcontextprotocol/sdk` | 1.29.0 observed | MCP server/tool interface | Lets Codex/Claude/Cursor-like clients call job search tools in the same style as MCP integrations |
| Playwright | 1.60.0 observed | Optional browser liveness checks and user-approved page capture | Career-Ops uses Playwright for scanner verification/PDF flow; domestic pages often need browser observation |
| SQLite | library choice during Phase 1; `better-sqlite3` 12.10.1 observed | Local canonical database | Queryable, portable, works offline, avoids cloud lock-in |
| Markdown | n/a | Human-readable evaluations, resumes, reports, audit notes | Keeps artifacts inspectable and easy for AI coding CLIs to edit |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `mcp-jobs` | 1.4.0 observed | First domestic job discovery provider | Use for BOSS/Liepin/Zhaopin/51job-style search when the user enables it |
| `@santifer/career-ops` | 1.10.0 observed | Reference implementation and possible upstream compatibility target | Use as a design reference; do not blindly fork before domestic adapter contracts are proven |
| Zod | 4.4.3 observed | Runtime schema validation | Validate provider outputs and config files before persisting |
| Cheerio | mcp-jobs uses `^1.0.0-rc.12` | HTML parsing for user-provided/static pages | Use only when content is user-approved and terms allow it |
| Vitest | 4.1.9 observed | Unit/contract tests | Adapter fixtures, scoring logic, redaction, dedup, CLI behavior |
| Apify CLI/API | Current page verified; install via Apify docs | Optional paid third-party actors for Lagou/Liepin/51job/Zhaopin-like scraping | Use only with explicit user opt-in, token, cost notice, and compliance warning |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| npm | package management | Local npm version is 11.16.0 |
| `tsx` or `node --import tsx` | development execution | Decide during Phase 1 scaffold |
| ESLint + Prettier | static hygiene | Add after scaffold; keep generated Markdown out of formatter churn |
| Playwright test | browser checks | Live platform checks must be opt-in and tagged |
| GitHub Actions or local CI | regression verification | Initial project is local; add CI only after code exists |
## Installation
# Candidate Phase 1 package set; pin after scaffold and lockfile creation.
# Optional provider, enabled by config rather than hard dependency if possible.
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| TypeScript/Node | Python | Use Python only for data science notebooks; the CLI/MCP ecosystem here is stronger in Node |
| SQLite + Markdown | Markdown only | Markdown-only is simpler but makes dedup, filtering, and status integrity brittle |
| MCP provider wrapper | Direct hidden web scraping | Use direct scraping only for user-provided pages after terms review; never as the default |
| Playwright opt-in checks | Always-on browser automation | Always-on browser automation is more fragile and riskier for domestic platforms |
| Local CLI | Web SaaS | SaaS only after privacy/security model is redesigned |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| CAPTCHA bypass services | Crosses a hard compliance boundary | Manual user handoff and "blocked" status |
| Proxy rotation to evade bans | Strong signal of unauthorized extraction | Rate limits, official/approved API, or manual import |
| Reverse-engineered private APIs as stable providers | Breaks often and raises legal/account risk | Provider abstraction with explicit "unapproved/private" classification |
| Auto-apply/chat bots in v1 | Can spam recruiters, violate terms, and harm the user's account | Draft-only output plus human confirmation |
| Cloud storage for CV/profile by default | High sensitivity and conflicts with core value | Local encrypted/ignored data directory |
## Stack Patterns by Variant
- Run it as an MCP subprocess or wrap it through a provider command adapter.
- Persist normalized results with provider metadata and confidence.
- Do not assume its output is comprehensive or legally approved.
- Require explicit token/cost configuration.
- Store actor run id, query, timestamp, and dataset id for audit.
- Mark results as third-party scraped data and avoid automatic redistribution.
- Accept pasted JD text, platform URL, screenshot-derived text, or saved HTML.
- Record user as source authority.
- Skip live provider scraping entirely.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@santifer/career-ops@1.10.0` | Node >=18 | Reference package says one-command installer |
| `mcp-jobs@1.4.0` | Node >=16 | Package uses MCP SDK, Cheerio, Playwright, TypeScript |
| Local machine | Node v24.16.0, npm 11.16.0 | Good enough for current npm package requirements |
| Playwright 1.60.0 | Browser install required for live checks | Use `npx playwright install chromium` when code phase starts |
## Sources
- WeChat reference article: https://mp.weixin.qq.com/s/p3z0ZoaKI9z0qA-_sGk3Jw - product inspiration and domestic adaptation prompt
- Career-Ops repository: https://github.com/santifer/career-ops - local AI job-search CLI design reference
- `@santifer/career-ops` npm metadata - version, engine, license
- `mcp-jobs` GitHub/npm metadata: https://github.com/mergedao/mcp-jobs - domestic MCP job aggregation candidate
- Apify Lagou CLI/API page: https://apify.com/getascraper/lagou-tech-jobs-scraper/api/cli - optional third-party CLI/API provider
- BOSS HI protocol, Liepin service agreement PDF, Zhaopin legal statement - compliance constraints
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Primary flow: CLI/MCP surface -> application services -> provider policy gate -> provider adapters -> normalization/dedup -> scoring/drafts -> local tracker.

Provider integrations must declare capabilities and approval status before they can run. Never let BOSS/Liepin/Zhaopin/51job/Lagou-specific parsing leak directly into scoring or draft generation; normalize first.
<!-- GSD:architecture-end -->

## Project Safety Rules

- V1 is draft-only for external actions: do not implement automatic apply, send, chat, greeting, upload, CAPTCHA bypass, proxy evasion, or hidden-login behavior.
- Runtime user data such as CVs, profile files, provider raw payloads, generated resumes, and tracker databases must live in gitignored local data/artifact paths.
- Treat `mcp-jobs`, Apify Actors, and any scraper-like provider as third-party capabilities, not as platform authorization. Upgrade a provider to approved only with source-linked official documentation.
- Live platform probes must be opt-in, rate-limited, and fixture-backed. Default tests should use redacted fixtures.

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `$gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `$gsd-debug` for investigation and bug fixing
- `$gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
