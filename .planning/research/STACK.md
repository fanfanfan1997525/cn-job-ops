# Stack Research

**Domain:** Local AI job-search CLI/MCP for Chinese hiring platforms
**Researched:** 2026-06-15
**Confidence:** MEDIUM-HIGH

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

```bash
# Candidate Phase 1 package set; pin after scaffold and lockfile creation.
npm install @modelcontextprotocol/sdk zod better-sqlite3 playwright
npm install -D typescript vitest @types/node tsx eslint prettier

# Optional provider, enabled by config rather than hard dependency if possible.
npm install mcp-jobs
```

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

**If using `mcp-jobs` only:**
- Run it as an MCP subprocess or wrap it through a provider command adapter.
- Persist normalized results with provider metadata and confidence.
- Do not assume its output is comprehensive or legally approved.

**If using Apify Actors:**
- Require explicit token/cost configuration.
- Store actor run id, query, timestamp, and dataset id for audit.
- Mark results as third-party scraped data and avoid automatic redistribution.

**If using manual imports:**
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

---
*Stack research for: CN Job Ops*
*Researched: 2026-06-15*
