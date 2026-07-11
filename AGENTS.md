# MCP Tauri Automation

## Mission

This repository provides a stdio MCP server for launching and automating built
Tauri desktop applications through `tauri-driver` and WebDriver. Keep the MCP
protocol surface predictable, failures actionable, and platform behavior
portable across supported desktop environments.

## Layout

- `src/index.ts` — MCP server setup, tool schemas, dispatch, and shutdown.
- `src/tauri-driver.ts` — WebDriver session and Tauri process lifecycle.
- `src/tools/` — bounded tool handlers for launch, interaction, screenshots,
  state, and cleanup.
- `src/types.ts` — shared configuration, parameter, state, and response types.
- `dist/` — generated TypeScript output; never edit or commit it.

## Verification

```bash
npm ci
npm run build
```

The strict TypeScript build is the only repository-provided automated gate.
There is currently no test or lint command; do not invent passing coverage.
Use targeted compilation while iterating and run `npm run build` once from the
final source before committing. A live automation smoke additionally requires
`tauri-driver` and a built Tauri application, so report it as unrun when those
external prerequisites are unavailable.

## Model Routing

- Use hosted subscription roles only: `opus` for architecture or MCP contract
  changes, `sonnet` for ordinary implementation, and `haiku` for bounded
  mechanical work.
- Do not use local LLMs for repository work. Do not delegate generic work to
  DGX Spark; Spark is not a cheap or default agent lane.
- Native subagents inherit the current model unless a delegation receipt proves
  a different hosted profile. Never claim a lower-tier route from prose alone.

## Boundaries

- Preserve stdio for MCP protocol messages; diagnostics must not corrupt the
  protocol stream.
- Validate untrusted tool inputs and return structured errors. Do not expose
  credentials, environment values, arbitrary local files, or auth state.
- Keep process and WebDriver cleanup reliable on normal exit and signals.
- Do not edit generated `dist/`, dependency contents, or lockfile data by hand.
- Screenshots and other runtime output remain local and ignored.
- Changes to tool names, schemas, response shapes, environment variables, or
  process lifecycle are public-contract changes and require explicit review.

## Pointers

- Setup, supported tools, environment variables, and external prerequisites:
  `README.md`.
- Hard-won repository gotchas: `.claude/lessons.md`.
- Cross-repository governance: `~/ai-agent-os/docs/`.
