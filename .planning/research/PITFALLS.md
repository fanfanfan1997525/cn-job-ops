# Pitfalls Research

**Domain:** Domestic AI job-search CLI/MCP
**Researched:** 2026-06-15
**Confidence:** HIGH for compliance risks; MEDIUM for provider reliability

## Critical Pitfalls

### Pitfall 1: Treating Third-Party Scrapers as Legal Approval

**What goes wrong:**
The project finds a working package or Actor and assumes it is safe to scrape or automate every domestic platform.

**Why it happens:**
Developer convenience hides the difference between "technically possible" and "authorized by platform rules."

**How to avoid:**
Every provider must declare approval status, operation capabilities, and required user opt-in. Block auto-apply/chat and bypass behavior at the policy layer.

**Warning signs:**
Provider code includes proxy rotation, CAPTCHA solving, private endpoint reverse engineering, or hidden login flows.

**Phase to address:**
Phase 1 and Phase 2.

---

### Pitfall 2: Optimizing for Job Volume Instead of Decision Quality

**What goes wrong:**
The tool turns into a noisy crawler and produces hundreds of low-value listings.

**Why it happens:**
Search is easier to demo than ranking, evidence, and user-specific fit.

**How to avoid:**
Keep the "少投" threshold as a product rule. Score below 4.0/5 defaults to "do not apply" unless the user overrides.

**Warning signs:**
Reports emphasize count of jobs found more than shortlist quality or explanations.

**Phase to address:**
Phase 4.

---

### Pitfall 3: Scoring Without User Context

**What goes wrong:**
The system gives generic advice that looks polished but does not match the user's career story.

**Why it happens:**
Onboarding is skipped to get to platform integration.

**How to avoid:**
Build profile/CV/preferences first; scoring cannot run without a minimum profile completeness check.

**Warning signs:**
Scores rely only on JD keywords or generic market advice.

**Phase to address:**
Phase 1 and Phase 4.

---

### Pitfall 4: Auto-Sending Incorrect or Misleading Messages

**What goes wrong:**
An AI greeting, resume, or application is sent without user review, possibly misrepresenting experience or spamming recruiters.

**Why it happens:**
Automation pressure treats "send" as the final step of a pipeline.

**How to avoid:**
Draft-only v1. Generated artifacts must be labeled drafts and require manual copy/send outside the tool.

**Warning signs:**
Commands named `apply`, `send`, or `chat` perform external side effects.

**Phase to address:**
Phase 5.

---

### Pitfall 5: Leaking CV or Tracker Data

**What goes wrong:**
Sensitive profile, salary expectations, job history, or application status enters logs, commits, or third-party APIs.

**Why it happens:**
Local-first tools often start with simple files and debug logging.

**How to avoid:**
Gitignore user data/artifacts, redact logs, separate planning docs from runtime data, and require explicit AI-provider boundaries for prompts.

**Warning signs:**
`cv.md`, `.env`, generated resumes, or raw provider payloads appear in `git status`.

**Phase to address:**
Phase 1, then continuously.

---

### Pitfall 6: Provider Fragility Masquerading as Product Failure

**What goes wrong:**
A platform changes HTML/risk control and the whole product appears broken.

**Why it happens:**
Provider failures are not classified separately from business logic.

**How to avoid:**
Adapters return structured failure reasons: blocked, unsupported, rate-limited, parse changed, login required, legal blocked, or transient network.

**Warning signs:**
All provider failures collapse to "no jobs found."

**Phase to address:**
Phase 2 and Phase 6.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only Markdown tracker | Fast to start | Poor dedup/query/status integrity | Never for v1 core; use Markdown exports |
| Single provider hardcoded | Quick demo | No fallback when provider breaks | Only as a throwaway spike, not committed architecture |
| Prompt-only scoring | Easy implementation | Non-deterministic, untestable regressions | Use with rubric fixtures and snapshot tests |
| Live tests as default | Looks realistic | Slow, flaky, risky for accounts | Only opt-in smoke tests |
| Commit user data | Easy backup | Privacy breach | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `mcp-jobs` | Treat README claims as exhaustive platform contract | Wrap, test, and record exactly what fields it returns |
| BOSS | Automate chat or greet directly | Generate greeting draft only |
| Liepin | Ignore headhunter/intermediary semantics | Represent recruiter/headhunter metadata and risk separately |
| Zhaopin/51job | Copy restricted content into public artifacts | Store local-only raw snapshots; export summaries |
| Apify | Hide cost/token/API dependency | Require explicit token/cost/provider enablement |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-evaluate every job every scan | Token cost spikes | Cache evaluation by job content hash and profile version | Weekly scans over hundreds of jobs |
| No dedup before scoring | Duplicate reports | Dedup before evaluation | Multi-platform search |
| Store large raw HTML in SQLite rows | Slow queries and huge DB | Store raw snapshots in files with references | Thousands of detail pages |
| Browser liveness for all jobs | Scan too slow | Verify only shortlisted/new jobs | More than tens of listings |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging CV/profile text | PII leakage | Redaction utility and log tests |
| Storing platform cookies | Account compromise | Do not collect credentials/cookies in v1 |
| Running untrusted provider output through shell | Command injection | Treat provider output as data; never shell-interpolate |
| Uploading generated resumes to cloud by default | Sensitive career data exposure | Local artifacts only |
| Ignoring platform ToS changes | Legal/account risk | Provider health/legal checklist before live use |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Too many scores | User cannot decide | One final recommendation plus evidence blocks |
| No confidence level | False certainty | Show confidence and missing evidence |
| "Apply" language for drafts | User may think it was submitted | Use "draft generated" and "manual send required" |
| No reasons for rejecting jobs | User distrusts filter | Explain top rejection reasons and override path |

## "Looks Done But Isn't" Checklist

- [ ] **Provider search:** Must handle blocked/empty/error states separately.
- [ ] **Evaluation:** Must include evidence from both JD and user profile.
- [ ] **Fraud detection:** Must flag domestic-specific patterns, not only generic scams.
- [ ] **Draft generation:** Must mark drafts and avoid external side effects.
- [ ] **Tracker:** Must survive duplicate scans and repeated evaluation.
- [ ] **Privacy:** `git status` must not show runtime user data.
- [ ] **Compliance:** Policy gate must be tested before live providers run.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Unsafe provider merged | HIGH | Disable provider, add policy test, audit commits, remove any stored sensitive data |
| Bad scoring shipped | MEDIUM | Add fixture cases, compare old/new scoring, require evidence blocks |
| User data committed | HIGH | Stop, rotate/remove sensitive data, rewrite history only with explicit approval |
| Platform blocks access | LOW-MEDIUM | Mark provider degraded, switch to manual import, open provider issue |
| Draft misrepresents user | MEDIUM | Add profile grounding checks and user approval checklist |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Third-party scraper treated as approval | Phase 1/2 | Provider descriptors and policy tests exist |
| Volume over quality | Phase 4 | Evaluation default rejects low-score roles |
| Scoring without context | Phase 1/4 | Profile completeness gate blocks evaluation |
| Auto-sending messages | Phase 5 | No command has external send/apply side effects |
| Data leakage | Phase 1 | `.gitignore`, redaction tests, secret scan |
| Provider fragility | Phase 2/6 | Failure taxonomy and fixture contract tests |

## Sources

- BOSS HI protocol restrictions on unauthorized spider/crawler-like extraction
- Liepin user service agreement PDF restrictions on illegal platform data grabbing
- Zhaopin legal statement restrictions on crawler/robot copying without consent
- Career-Ops README human-in-the-loop and no spray-and-pray positioning
- `mcp-jobs` README usage notice to obey recruitment platform rules

---
*Pitfalls research for: CN Job Ops*
*Researched: 2026-06-15*
