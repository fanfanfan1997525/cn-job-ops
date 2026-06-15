# CN Job Ops

CN Job Ops is a local-first CLI for domestic job-search operations: importing/searching job listings, normalizing them into a tracker, scoring fit and risk, generating review-only drafts, and producing reports.

## Safety Boundary

- v1 does not automatically apply, send, upload, log in, chat, solve CAPTCHA, evade bans, or harvest credentials.
- Live domestic providers are not enabled by default; commands that call them must be explicit.
- `manual`, `fixture`, and user-opt-in `liepin-official-mcp` search import are executable. `mcp-jobs` is opt-in and runner-injected. `boss-cli` remains descriptor-only; third-party `liepin-cli` remains a non-executable descriptor unless a later review approves it.
- Runtime data lives under `.cn-job-ops/` and is gitignored.

## Setup

```powershell
npm install
npm run build
node .\dist\src\cli.js init --workspace .cn-job-ops
```

For development:

```powershell
npm test
npm run typecheck
npm run build
```

## Core Commands

```powershell
cn-job-ops init --workspace .cn-job-ops
cn-job-ops providers
cn-job-ops fixture-search --workspace .cn-job-ops --fixture jobs.json --keyword AI
cn-job-ops liepin-search --workspace .cn-job-ops --keyword AI产品经理 --city 上海 --token-env LIEPIN_USER_TOKEN --command C:\Path\From\Liepin\MCP\Json\liepin-mcp.exe
cn-job-ops evaluate --workspace .cn-job-ops --all
cn-job-ops draft --workspace .cn-job-ops --first-shortlisted
cn-job-ops export --workspace .cn-job-ops --format markdown
cn-job-ops dashboard --workspace .cn-job-ops
```

The dashboard is a read-only terminal snapshot and has a non-interactive output path for CI and pipes.

## More

- [Provider risk](docs/PROVIDER-RISK.md)
- [Local data](docs/LOCAL-DATA.md)
- [MCP placeholder](docs/MCP.md)
