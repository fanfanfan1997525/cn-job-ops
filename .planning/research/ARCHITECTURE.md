# Architecture Research

**Domain:** Local AI job-search CLI/MCP for Chinese platforms
**Researched:** 2026-06-15
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```text
+-------------------------------------------------------------+
| CLI / MCP Surface                                            |
| cn-job-ops init | search | evaluate | draft | tracker | scan |
+--------------------------+----------------------------------+
                           |
+--------------------------v----------------------------------+
| Application Services                                         |
| onboarding | provider gate | normalization | scoring | drafts |
+--------------------------+----------------------------------+
                           |
+--------------------------v----------------------------------+
| Provider Layer                                                |
| manual import | mcp-jobs | Apify optional | future official APIs |
+--------------------------+----------------------------------+
                           |
+--------------------------v----------------------------------+
| Local Data                                                    |
| SQLite canonical store | Markdown artifacts | redacted logs      |
+-------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CLI commands | User workflow entrypoints | TypeScript command dispatcher, subcommands, help text |
| MCP server | Expose search/evaluate tools to AI clients | `@modelcontextprotocol/sdk` server with typed tool schemas |
| Profile service | Manage CV, career story, preferences, red lines | Local Markdown/YAML with schema validation and redaction |
| Provider policy gate | Decide if an operation is allowed | Capability matrix, terms status, user opt-in, rate limits |
| Provider adapters | Fetch or accept job listings | `mcp-jobs` subprocess/provider, manual import, Apify optional |
| Normalizer | Convert raw provider output to canonical job records | Zod schemas, salary/city parsers, raw snapshot references |
| Deduper | Merge repeated listings | URL identity, normalized company/title/city, hashes |
| Evaluation engine | Score and explain role fit | Prompt templates plus deterministic rubrics and evidence sections |
| Draft generator | Produce resume/cover/greeting drafts | Markdown/HTML templates; Playwright only for PDFs later |
| Tracker | Status and audit state | SQLite tables plus Markdown/TSV export |

## Recommended Project Structure

```text
src/
  cli/                 # command parsing and user workflow orchestration
  mcp/                 # MCP server and tool schemas
  config/              # config loading, profile paths, redaction
  providers/           # provider interface and concrete adapters
    manual/
    mcp-jobs/
    apify/
  policy/              # compliance gates, capability matrix, rate limits
  normalize/           # canonical job schema, parsers, dedup
  scoring/             # evaluation rubric, fraud/ghost detector
  drafts/              # resume, cover letter, greeting templates
  tracker/             # SQLite repository and exports
  reports/             # weekly scan and market summaries
  shared/              # logging, errors, utilities
tests/
  fixtures/            # redacted provider outputs and JD samples
  contract/            # adapter contract tests
  unit/                # pure logic tests
data/                  # local user data, gitignored in implementation phase
artifacts/             # generated resumes/reports, gitignored in implementation phase
```

### Structure Rationale

- **providers/** is separate from **normalize/** so each provider can fail independently without polluting the canonical schema.
- **policy/** sits before providers to prevent unsafe operations from being implemented as accidental convenience.
- **scoring/** is isolated so prompt/rubric changes can be tested without live platform calls.
- **tracker/** owns persistence; UI/CLI/reporting read through it instead of parsing random Markdown.

## Architectural Patterns

### Pattern 1: Capability-Gated Provider

**What:** Every provider declares what it can do and what is approved.
**When to use:** All platform integrations.
**Trade-offs:** Adds boilerplate, but prevents accidental auto-apply/chat behavior.

```typescript
type ProviderCapability = "search" | "detail" | "liveness" | "draftOnly" | "apply" | "chat";

interface ProviderDescriptor {
  id: string;
  displayName: string;
  capabilities: ProviderCapability[];
  approval: "approved" | "user_opt_in" | "blocked" | "unknown";
  notes: string[];
}
```

### Pattern 2: Raw Snapshot plus Normalized Record

**What:** Store raw provider payload separately from normalized job fields.
**When to use:** Any external job result.
**Trade-offs:** Slightly more storage; huge debugging and audit value.

### Pattern 3: Draft-Only External Action

**What:** The system generates text for platform actions but never clicks submit/send in v1.
**When to use:** BOSS greeting, Liepin message, cover letter, resume upload preparation.
**Trade-offs:** Less automation; much safer account and compliance posture.

## Data Flow

### Search and Evaluate Flow

```text
User query
  -> CLI/MCP tool
  -> policy gate checks provider and operation
  -> provider returns raw listings or manual import supplies JD
  -> normalizer validates canonical job records
  -> deduper merges known jobs
  -> tracker stores job/status/source metadata
  -> evaluation engine reads profile + job
  -> Markdown report and tracker score are written locally
```

### Draft Flow

```text
Shortlisted job
  -> evaluation evidence
  -> resume/cover/greeting templates
  -> user review gate
  -> local artifact export
  -> manual copy/send outside the tool
```

### Compliance Flow

```text
Requested operation
  -> provider descriptor
  -> terms/robots status and user opt-in
  -> rate-limit and credential policy
  -> allow, warn, or block
  -> audit log entry
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user, <10k jobs | SQLite + Markdown is enough |
| 1 user, 10k-100k jobs | Add indexes, background scans, report caching |
| Multi-user or cloud | Out of scope; would require auth, encryption, tenant isolation, and legal review |

### Scaling Priorities

1. **First bottleneck:** duplicate/noisy data. Fix with canonical schema, dedup keys, and filtering before UI.
2. **Second bottleneck:** provider fragility. Fix with adapter health checks and manual fallback.
3. **Third bottleneck:** prompt cost. Fix with caching evaluations and incremental weekly scans.

## Anti-Patterns

### Anti-Pattern 1: Provider Code Owns Business Semantics

**What people do:** Parse BOSS/Liepin fields directly inside scoring logic.
**Why it's wrong:** Every platform change breaks scoring.
**Do this instead:** Normalize into canonical schema before evaluation.

### Anti-Pattern 2: "Works Once" Browser Automation

**What people do:** Write a Playwright script that clicks through a live platform without policy checks.
**Why it's wrong:** Brittle, risky, and hard to test.
**Do this instead:** Use live browser only for opt-in liveness/detail checks; fixture-test the rest.

### Anti-Pattern 3: Scoring Without Evidence

**What people do:** Return a single match number.
**Why it's wrong:** The user cannot trust or improve it.
**Do this instead:** Each score block cites job evidence, user evidence, gaps, and confidence.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `mcp-jobs` | MCP subprocess/provider adapter | First discovery provider; third-party, not official compliance proof |
| Apify Actors | CLI/API adapter | Optional paid provider; requires token/cost warning |
| BOSS/Liepin/Zhaopin/51job/Lagou pages | Manual URL/JD import and opt-in liveness | Avoid unauthorized extraction or automated login/actions |
| AI coding CLI | Reads local project files and calls MCP tools | Keep artifacts Markdown-readable |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI/MCP -> application services | typed command/tool schemas | No provider-specific fields in command handlers |
| provider -> normalizer | raw payload plus descriptor | Raw data retained with source metadata |
| normalizer -> tracker | canonical job record | Zod validation before persistence |
| scoring -> drafts | evaluation report id | Drafts should be based on scored, shortlisted jobs |

## Sources

- Career-Ops README and repository structure
- `mcp-jobs` package metadata and README
- Apify Lagou CLI/API page
- BOSS HI, Liepin, Zhaopin legal/terms sources
- Local environment probes: Node v24.16.0, npm 11.16.0

---
*Architecture research for: CN Job Ops*
*Researched: 2026-06-15*
