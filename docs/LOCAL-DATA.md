# Local Data

## Runtime Paths

By default, runtime state is under `.cn-job-ops/`:

- `.cn-job-ops/profile.json`
- `.cn-job-ops/tracker.sqlite`
- `.cn-job-ops/drafts/`
- `.cn-job-ops/reports/`
- `.cn-job-ops/exports/`
- `.cn-job-ops/searches/`

The repository `.gitignore` excludes `.cn-job-ops/`, `.cn-job-ops-*/`, `.env*`, SQLite sidecar files, `dist/`, `node_modules/`, and `artifacts/`.

## Deletion and Backup

To wipe local state, close any running command and delete the workspace directory:

```powershell
Remove-Item -LiteralPath .cn-job-ops -Recurse -Force
```

To back up, copy the same directory while no scan is running.

## Data Boundary

- Profile data is used locally for scoring and draft generation.
- Redaction is centralized through the AI boundary helper before prompt-like text leaves the local module boundary.
- Exports use allowlisted tracker fields and do not include raw profile fields.
- Generated drafts are local files labelled `DRAFT - REVIEW REQUIRED`; they are not sent or uploaded.
