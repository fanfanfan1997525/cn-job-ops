# Feature Research

**Domain:** Domestic AI job-search CLI/MCP
**Researched:** 2026-06-15
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Conversational onboarding | Career-Ops-style tools need the user's CV, career story, target roles, salary/location preferences, and red lines | MEDIUM | Store locally; support iterative profile refinement |
| Provider search/import | The product has no value without domestic listings | HIGH | Start with `mcp-jobs` plus manual JD/URL import; optional Apify |
| Canonical job schema | Multi-platform data is inconsistent | MEDIUM | Normalize salary, city, experience, education, company, tags, description, source |
| Deduplication | Same job appears across platforms and reposts | MEDIUM | Use URL, company-title-city, content hash, and fuzzy matching |
| Fit evaluation | Core Career-Ops function is reasoning-based selection | HIGH | Score explainably, not by keyword match alone |
| Fraud/ghost-posting risk | Domestic platforms contain stale, agency, training-loan, and off-platform lure patterns | HIGH | Dedicated Block G with evidence and confidence |
| Tailored resume/application drafts | Users expect output that helps them act | HIGH | Draft only; no automatic submission |
| Local tracker | A job search needs status history | MEDIUM | SQLite for state, Markdown/TSV export for review |
| Audit and compliance gate | Platform restrictions are a first-order product constraint | HIGH | Block risky operations before providers run |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Domestic platform risk model | Better than simply porting overseas ATS scanners | HIGH | BOSS chat model, Liepin headhunters, Zhaopin/51job forms, Lagou tech focus |
| Provider capability matrix | Makes unstable/third-party integrations explicit | MEDIUM | Each provider declares search/detail/live/apply/greeting capabilities and legal status |
| "少投" strategy | Avoids spam and improves user focus | MEDIUM | Default threshold: recommend "do not apply" below 4.0/5 unless user overrides |
| Platform-specific greeting draft | BOSS/Liepin often need short opening messages | MEDIUM | Draft, rationale, tone variants; user sends manually |
| Weekly job intelligence report | Helps the user see market changes | MEDIUM | Summarize new roles, salary bands, skill trends, duplicates, risk flags |
| Local dashboard companion | Faster scanning than raw Markdown | MEDIUM | Later phase: terminal/HTML dashboard over SQLite |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-apply everywhere | Feels like leverage | Creates spam, wrong applications, account risk, and recruiter harm | Human-approved shortlist and drafts |
| Auto-chat with recruiters | BOSS is chat-centric | High risk of misrepresentation and account restrictions | Greeting draft with copy/manual-send |
| Hidden private API crawler | Easy to prototype | Brittle, potentially violates terms, hard to test safely | Provider interface with legal classification and manual fallback |
| Bypass anti-bot/CAPTCHA | Increases data volume | Compliance boundary breach | Mark provider blocked; ask user for manual import |
| Cloud sync of CV and tracker | Convenience | Sensitive data exposure | Local-only v1 with optional encrypted export later |

## Feature Dependencies

```text
Profile onboarding
    -> Evaluation rubric
        -> Resume/greeting drafts

Provider adapter contract
    -> Job normalization
        -> Deduplication
            -> Tracker and weekly report

Compliance policy
    -> Provider execution gate
        -> Live provider checks

Canonical job schema
    -> Scoring
    -> Dashboard
    -> Exports
```

### Dependency Notes

- **Provider adapter contract requires compliance policy:** the system must know which operations are allowed before it calls a provider.
- **Scoring requires profile onboarding:** without user's background and preferences, role-fit scores are generic and misleading.
- **Resume/greeting drafts require scoring:** drafts should reflect the evidence that made a role worth pursuing.
- **Dashboard requires tracker:** the UI should read normalized local state, not scrape directly.

## MVP Definition

### Launch With (v1)

- [ ] Local workspace and profile onboarding - needed before any evaluation can be personal.
- [ ] Provider contract plus `mcp-jobs` discovery adapter - validates domestic source integration.
- [ ] Manual URL/JD import - keeps the tool usable when providers are blocked.
- [ ] Canonical job schema, dedup, local tracker - keeps data coherent and auditable.
- [ ] Seven-block evaluation including fraud/ghost risk - delivers the core value.
- [ ] Resume, cover letter, and greeting drafts - lets the user act on good roles.
- [ ] Compliance guardrails and audit log - prevents the project from becoming an unsafe crawler.

### Add After Validation (v1.x)

- [ ] Apify provider integration - useful when user accepts token/cost and legal tradeoffs.
- [ ] Local dashboard/TUI - faster pipeline browsing after the core data is stable.
- [ ] Weekly market report - valuable once scans are repeated.
- [ ] Liveness verification through Playwright - reduce stale jobs after initial discovery works.

### Future Consideration (v2+)

- [ ] Official partner APIs if BOSS/Liepin/Zhaopin/51job provide approved access.
- [ ] Encrypted sync between user machines.
- [ ] Browser extension handoff for copying drafts into platform UI.
- [ ] Company/recruiter reputation knowledge base based only on the user's local observations.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Local onboarding/profile | HIGH | MEDIUM | P1 |
| Provider safety gate | HIGH | MEDIUM | P1 |
| `mcp-jobs` adapter | HIGH | MEDIUM | P1 |
| Manual import | HIGH | LOW | P1 |
| Canonical schema/dedup | HIGH | MEDIUM | P1 |
| Evaluation engine | HIGH | HIGH | P1 |
| Fraud/ghost detector | HIGH | HIGH | P1 |
| Resume/greeting drafts | HIGH | HIGH | P1 |
| Tracker/export | HIGH | MEDIUM | P1 |
| Apify adapter | MEDIUM | MEDIUM | P2 |
| Dashboard | MEDIUM | MEDIUM | P2 |
| Auto-submit/apply | LOW/negative | HIGH | Never in v1 |

## Competitor Feature Analysis

| Feature | Career-Ops | mcp-jobs | CN Job Ops Approach |
|---------|------------|----------|---------------------|
| AI fit evaluation | Strong structured evaluation and CV tailoring | Not the main purpose | Reuse the structured reasoning idea, local to Chinese roles |
| Portal scanning | Overseas ATS/company pages | Domestic multi-platform MCP search | Provider abstraction with compliance gates |
| Local data | Local Markdown/tracker | MCP search output | SQLite + Markdown, all local |
| Resume generation | ATS PDF and cover letters | Not primary | Resume/cover/greeting drafts, platform-specific |
| Compliance stance | Human-in-the-loop; does not submit automatically | README says obey platform rules | Hard provider policy, audit log, no bypass |

## Sources

- Career-Ops README/package metadata
- WeChat article summarizing Career-Ops and domestic adaptation need
- `mcp-jobs` README/package metadata
- Apify Lagou CLI/API page and related Actor listing
- BOSS HI protocol, Liepin service agreement PDF, Zhaopin legal statement

---
*Feature research for: CN Job Ops*
*Researched: 2026-06-15*
