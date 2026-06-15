# MCP Boundary

CN Job Ops v1 does not start its own MCP server and does not depend on an MCP SDK.

The package can call external MCP/CLI-style providers through explicit commands. The first official-discovered live provider is `liepin-official-mcp`, backed by Liepin's public MCP server page and a user-generated credential. It remains `user_opt_in` until the official tool schema is verified with a real user credential. The executable project surface is still the `cn-job-ops` CLI:

```powershell
cn-job-ops liepin-search --workspace .cn-job-ops --keyword AI产品经理 --city 上海 --token-env LIEPIN_USER_TOKEN --command C:\Path\From\Liepin\MCP\Json\liepin-mcp.exe
```

The `--command` value must be an absolute path copied from the generated Liepin MCP JSON. Naked command names and `.cmd`/`.bat` shims are rejected to avoid PATH hijacking, shell argument issues, and accidental execution of third-party wrappers.

This command imports search results only. It does not apply, upload resumes, improve resumes, chat, or contact recruiters.
