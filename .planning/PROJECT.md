# CN Job Ops

## What This Is

CN Job Ops is a local, CLI-first AI job-search command center for Chinese hiring platforms. It adapts the Career-Ops idea from the reference article to BOSS Zhipin, Liepin, Zhaopin, 51job, Lagou, and similar domestic sources through a provider layer that can use MCP/CLI tools, official APIs if they become available, or user-approved manual URL imports.

The product is not a mass-apply bot. It helps a technical job seeker find fewer but better roles, evaluate fit with explainable scoring, detect scams or stale postings, draft tailored resume/application materials, and keep all sensitive data on the user's machine.

## Core Value

Help the user avoid wasting time on bad or risky roles by turning domestic job listings into local, explainable, privacy-preserving decisions and drafts, with the user always approving any external action.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Initialize a local workspace that stores profile, CV, target roles, job records, evaluations, and generated drafts without uploading them to a SaaS product.
- [ ] Provide a CLI/MCP provider abstraction that can call `mcp-jobs` first, optionally call paid third-party APIs such as Apify Actors, and ingest manually pasted URLs/JDs when platform access is blocked or legally unclear.
- [ ] Normalize BOSS, Liepin, Zhaopin, 51job, Lagou, and manual JD data into one canonical job schema with source, URL, company, title, city, salary, experience, education, tags, description, and fetched-at metadata.
- [ ] Score each role with a Career-Ops-like evaluation: role summary, CV match, gap analysis, level/strategy fit, compensation sanity, interview prep, and domestic fraud/ghost-posting risk.
- [ ] Generate human-reviewed resume variants, cover letters, and platform-specific greeting drafts without submitting, chatting, or applying automatically.
- [ ] Track the pipeline locally with deduplication, status transitions, audit trail, and weekly scan/report commands.
- [ ] Enforce compliance guardrails: no CAPTCHA bypass, no proxy/ban evasion, no credential sharing, no unauthorized bulk scraping, and no automatic platform action.

### Out of Scope

- Automated application submission, automated recruiter chat, or automatic "打招呼" sending - high account and legal risk; drafts only until a later explicit approval workflow exists.
- Bypassing CAPTCHA, reverse engineering private APIs, proxy rotation to evade bans, or disabling robots/terms checks - violates the compliance boundary and creates project-ending risk.
- Selling, sharing, or building a public dataset from scraped job data - this project is a personal local tool, not a data brokerage system.
- Cloud-hosted multi-user SaaS - conflicts with the privacy-first value and adds security/compliance burden before the local workflow is proven.
- Recruiter-side automation - the project is for a job seeker, not HR sourcing.

## Context

- The reference WeChat article describes Career-Ops as an open-source AI job-search CLI that evaluates listings, generates tailored resumes, scans portals, keeps data local, and recommends applying selectively rather than broadly.
- The upstream Career-Ops repository currently describes a local AI CLI workflow with structured evaluation, tailored PDFs, portal scanning, batch processing, tracker integrity, Playwright liveness checks, and human-in-the-loop decisions.
- The domestic integration reality is different from Ashby/Greenhouse/Lever. Major Chinese platforms are platform apps with anti-automation and restrictive terms. Liepin now has a public official MCP server page for AI job-search clients; direct browsing can still hit platform safety controls. Public official job-seeker CLI/MCP entries for BOSS, Zhaopin, 51job, and Lagou were not found during the latest search.
- A third-party MCP package, `mcp-jobs`, exists and advertises zero-config aggregation across mainstream Chinese job sites including BOSS, Liepin, Zhaopin, and 51job. It is useful as the first discovery provider but must be treated as a capability, not as compliance proof.
- Apify provides CLI/API Actors for Lagou and other Chinese job boards, but these are paid third-party scrapers and should be optional providers with explicit user opt-in.
- BOSS HI, Liepin, and Zhaopin terms/legal pages contain restrictions against unauthorized programmatic extraction or crawler-style access. This project therefore needs hard compliance gates and conservative defaults.

## Constraints

- **Compliance**: Provider code must be capability-gated. Search/listing discovery can use approved tools; logged-in actions and data extraction beyond user-visible content require explicit user approval and platform-specific review.
- **Privacy**: CV, career story, target roles, evaluations, generated resumes, and tracker state stay local by default. No cloud sync in v1.
- **Human in loop**: The system may recommend, draft, and prepare. The user decides whether to apply, send a greeting, or contact a recruiter.
- **Platform volatility**: Domestic pages, risk controls, and terms can change. Providers need health checks, failure classification, and manual fallback instead of brittle hidden scraping.
- **CLI first**: Primary interface is a local command/MCP server, comparable in usage style to Feishu/Lark CLI workflows. Dashboard is a later local companion, not the initial surface.
- **Windows support**: The current workspace is Windows/PowerShell, Node v24.16.0, npm 11.16.0. Scripts must avoid POSIX-only assumptions unless guarded.
- **Testing**: Provider adapters require mocked fixtures and contract tests before any live probe. Live tests must be opt-in and rate-limited.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a new local project rather than forking Career-Ops immediately | The domestic platform/compliance problem is different enough to define requirements first | - Pending |
| Use `mcp-jobs` as the first v1 discovery provider | It is the closest CLI/MCP-style domestic job aggregation tool found during research | - Pending |
| Enable `liepin-official-mcp` as user-opt-in search-only execution | Liepin publishes an official MCP server page and credential flow for AI clients, but the schema has not been verified with a real credential; high-risk apply/resume/chat actions remain blocked | - Accepted 2026-06-15 after Claude review fixes |
| Treat `mcp-jobs` and Apify as third-party providers, not official platform APIs | Their existence does not override BOSS/Liepin/Zhaopin terms or user account risk | - Pending |
| Keep applications and chat actions human-approved | Domestic platforms are chat/account centric and automated action has high blast radius | - Pending |
| Store canonical data locally in SQLite plus Markdown exports | SQLite supports dedup/query/status; Markdown keeps artifacts inspectable and portable | - Pending |
| Use TypeScript/Node with Playwright and MCP SDK | Aligns with Career-Ops, mcp-jobs, Codex/Claude/Gemini CLI ecosystems, and Windows availability | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-15 after initialization*
