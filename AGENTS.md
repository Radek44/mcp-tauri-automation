# MCP Tauri Automation

## Mission

This repository provides a stdio MCP server for launching and automating built
Tauri desktop applications through `tauri-driver` and WebDriver. Keep the MCP
protocol surface predictable, failures actionable, and platform behavior
portable across supported desktop environments.

## Layout

- `src/index.ts` — stdio entry point, configuration, and shutdown.
- `src/server.ts` — validated MCP tool schemas, bounded queue, and dispatch.
- `src/tauri-driver.ts` — WebDriver session and Tauri process lifecycle.
- `src/ui-snapshot.ts` — fixed, read-only, bounded DOM diagnostic.
- `test/` — Node tests with local fake WebDriver servers and real MCP transports.
- `src/types.ts` — shared configuration, parameter, state, and response types.
- `dist/` — generated TypeScript output; never edit or commit it.

## Verification

```bash
npm ci
npm run verify
```

The full gate builds, tests, audits runtime dependencies, and dry-runs packaging.
Use targeted tests while iterating and run the full gate on final source before
publication. Native smoke requires a built Tauri test app and either embedded
WebDriver or tauri-driver. Report unavailable native platforms as untested.
Create sessions only on loopback, serialize calls, never automatically replay
mutations, and delete only sessions owned by this server. Embedded app processes
remain owned by their launcher. Keep snapshots bounded and omit form values.

## Model Routing

- Keep the base model and reasoning effort operator-selected; new tasks inherit
  the operator's current Codex selection.
- Use hosted Agent OS role aliases from `~/ai-agent-os/config/model-registry.json`:
  `mechanical`, `implementer`, `evidence`, `verifier`, `architect`, `adversary`,
  and the opt-in `frontier`. Select a role only when its scope and verification
  needs fit.
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
- Hard-won repository gotchas: `.agents/lessons.md`.
- Cross-repository governance: `~/ai-agent-os/docs/`.
