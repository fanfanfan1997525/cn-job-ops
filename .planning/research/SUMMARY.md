# Project Research Summary

**Project:** CN Job Ops
**Domain:** Local AI job-search CLI/MCP for Chinese hiring platforms
**Researched:** 2026-06-15
**Confidence:** MEDIUM-HIGH

## Executive Summary

The right product is not a domestic mass-apply bot. The reference Career-Ops system is valuable because it behaves like a local AI recruiter: it scans sources, reasons about fit, creates tailored materials, tracks the pipeline, and keeps the final decision with the user. For China, the hard part is not only technology; it is platform access and compliance.

The best v1 path is a local TypeScript/Node CLI plus MCP server with a provider abstraction. Use `mcp-jobs` as the first domestic discovery provider because it is already a CLI/MCP-style package for mainstream Chinese job sites. Keep manual JD/URL import as a first-class fallback. Add Apify or other paid providers only after explicit user opt-in.

The main risk is unauthorized automation. BOSS, Liepin, and Zhaopin sources reviewed during initialization contain restrictions around crawler/robot-style extraction or unauthorized use. The architecture must therefore put a policy gate before provider execution, block CAPTCHA/proxy/anti-bot bypass, and keep apply/chat/send actions draft-only in v1.

## Key Findings

### Recommended Stack

Use TypeScript/Node, MCP SDK, Playwright for opt-in checks, SQLite for local canonical state, Markdown for readable artifacts, and Vitest for adapter/scoring tests.

**Core technologies:**
- Node/TypeScript: local CLI and provider runtime.
- MCP SDK: AI-client callable job tools.
- SQLite + Markdown: local queryable state and inspectable artifacts.
- Playwright: optional liveness/detail verification, not a default crawler.
- `mcp-jobs`: first domestic provider candidate.

### Expected Features

**Must have (table stakes):**
- Local onboarding/profile/CV/preference setup.
- Domestic provider search/import with compliance gate.
- Canonical job schema and dedup.
- Career-Ops-like fit evaluation.
- Domestic fraud/ghost-posting risk block.
- Tailored resume/cover/greeting drafts.
- Local tracker and audit log.

**Should have (competitive):**
- Weekly scan/report.
- Local dashboard/TUI.
- Apify/third-party provider plug-in after opt-in.
- Playwright liveness verification for shortlisted jobs.

**Defer (v2+):**
- Official partner APIs if available.
- Browser extension handoff.
- Encrypted sync.
- Any external send/apply automation.

### Architecture Approach

The system should be layered: CLI/MCP surface -> application services -> provider policy gate -> provider adapters -> normalization/dedup -> scoring/drafts -> local tracker. Provider-specific details must not leak into scoring or drafts.

**Major components:**
1. CLI/MCP surface - user-facing commands/tools.
2. Provider policy gate - legal/capability guardrails.
3. Provider adapters - manual, `mcp-jobs`, optional Apify, future official APIs.
4. Normalizer/deduper - canonical job records.
5. Evaluation/draft engine - fit score and local artifacts.
6. Tracker/reporting - local pipeline state.

### Critical Pitfalls

1. **Treating working scrapers as legal approval** - prevent with provider approval states and hard blocks.
2. **Optimizing for volume** - keep "少投" threshold and evidence-based recommendations.
3. **Scoring without user context** - require profile completeness before evaluation.
4. **Auto-sending messages** - draft-only v1.
5. **Leaking CV/tracker data** - gitignore runtime data and test redaction.

## Implications for Roadmap

### Phase 1: Local Workspace and Safety Foundation
**Rationale:** Privacy and compliance are load-bearing; build them before providers.
**Delivers:** Project scaffold, local data layout, profile onboarding, policy gate skeleton.
**Addresses:** profile, privacy, compliance.
**Avoids:** user data leak and unsafe providers.

### Phase 2: Provider Contract and Discovery MVP
**Rationale:** Domestic integration must be isolated and testable.
**Delivers:** provider interface, `mcp-jobs` adapter, manual import, fixture contract tests.
**Uses:** MCP/CLI provider pattern.
**Implements:** provider layer and normalization input.

### Phase 3: Canonical Data, Dedup, and Tracker
**Rationale:** Evaluation needs stable, deduplicated job state.
**Delivers:** SQLite schema, canonical job records, dedup, status history, exports.

### Phase 4: Evaluation and Risk Engine
**Rationale:** This is the core product value.
**Delivers:** seven-block scoring, fraud/ghost detection, recommendations.

### Phase 5: Draft Generation and Human Approval
**Rationale:** Good roles need actionable materials, but external actions stay manual.
**Delivers:** resume variants, cover letters, BOSS/Liepin greeting drafts, approval checklist.

### Phase 6: Scan Workflow and Reports
**Rationale:** Repeated use makes the tool valuable.
**Delivers:** saved searches, weekly scan, provider health, market/report summaries.

### Phase 7: Local Dashboard and Hardening
**Rationale:** After the data model stabilizes, add better inspection and production hardening.
**Delivers:** local dashboard/TUI, e2e checks, packaging docs, release readiness.

### Phase Ordering Rationale

- Safety/profile comes first because scoring and providers are unsafe or useless without them.
- Provider and normalization precede scoring to prevent platform-specific scoring hacks.
- Drafting follows scoring so materials are evidence-based.
- Dashboard comes after tracker/reporting so it does not become a separate source of truth.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** exact `mcp-jobs` runtime protocol, outputs, and supported platforms need live fixture exploration.
- **Phase 4:** domestic fraud/ghost risk rubric needs representative examples and counterexamples.
- **Phase 6:** provider liveness checks need strict rate limits and failure taxonomy.

Phases with standard patterns:
- **Phase 1:** Node CLI, config, local profile, redaction.
- **Phase 3:** SQLite schema, dedup, exports.
- **Phase 7:** local dashboard over existing data.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm metadata and local Node/npm verified |
| Features | MEDIUM-HIGH | Strong reference from Career-Ops; domestic-specific features inferred from platform model |
| Architecture | MEDIUM-HIGH | Standard adapter/local-state architecture fits risk profile |
| Pitfalls | HIGH | Platform legal/terms sources make compliance risks explicit |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Official BOSS/Liepin/Zhaopin/51job APIs:** no public official job-seeker CLI/API found during initialization; revisit only through official documentation or partner channels.
- **`mcp-jobs` behavior:** package exists, but actual live outputs and failure modes must be tested with fixtures/controlled queries in Phase 2.
- **Legal review:** this plan is an engineering compliance posture, not legal advice; any live crawling beyond personal/manual use needs separate review.

## Sources

### Primary (HIGH confidence)
- https://github.com/santifer/career-ops - reference feature set and local CLI approach
- https://github.com/mergedao/mcp-jobs - domestic MCP provider candidate
- https://hi.zhipin.com/protocol/ - BOSS HI platform restrictions
- https://special.zhaopin.com/sh/2009/aboutus/law.html - Zhaopin legal statement
- https://image0.lietou-static.com/img/66a85a9cb1f15833544b120f07u.pdf - Liepin user service agreement

### Secondary (MEDIUM confidence)
- https://mp.weixin.qq.com/s/p3z0ZoaKI9z0qA-_sGk3Jw - user-provided article summary/inspiration
- https://apify.com/getascraper/lagou-tech-jobs-scraper/api/cli - optional third-party CLI/API actor pattern
- npm metadata for `@santifer/career-ops`, `mcp-jobs`, TypeScript, Playwright, MCP SDK, Zod, Vitest, better-sqlite3

---
*Research completed: 2026-06-15*
*Ready for roadmap: yes*
