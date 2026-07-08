# @continuedev/terminal-security (Code Bhau stub)

**Status:** STUB. Not the upstream package.

This directory is a Code Bhau-authored stub for the upstream
`@continuedev/terminal-security` package, which is referenced by the forked
Continue code in `core/`, `gui/`, and `extensions/vscode/` but is **not**
published to the npm registry.

## Why a stub

The original `continuedev/continue` monorepo has internal `packages/*` folders
(`config-yaml`, `fetch`, `llm-info`, `openai-adapters`, `terminal-security`)
that the workspaces depend on via `file:../packages/<name>`. Of those, all
except `terminal-security` are also published to npm — so we just point at the
published versions and move on. `terminal-security` is not published, so a
minimal local stub is the cleanest way to keep `npm install` working without
either (a) pulling the entire upstream `packages/` tree into this fork, or
(b) editing every consumer file.

## Public API

- `ToolPolicy` — union: `"disabled" | "allowedWithPermission" | "allowedWithoutPermission"`
- `evaluateTerminalCommandSecurity(basePolicy, command)` — returns `basePolicy` unchanged in the stub

## Security posture of the stub

Permissive — the stub does **not** implement command injection / shell
metacharacter detection. This is acceptable for Code Bhau's threat model
because:

1. `AgentLoop` enforces its own scope guard
   (`ARCHITECTURE.md` §B.5 rule 3) — files outside the approved plan cannot
   be touched.
2. `TerminalTool` (to be implemented in Task 4.2) is required to gate
   destructive commands (`rm -rf`, force-push, etc.) behind an explicit
   human confirmation step, per `IMPLEMENTATION_PLAN.md`.
3. Code Bhau is BYOK and single-user — there is no multi-tenant surface
   to protect.

## When to replace this stub

When the upstream `@continuedev/terminal-security` becomes available
(published to npm, or vendored in from `continuedev/continue/packages/terminal-security`),
delete this directory and update `core/package.json` and `gui/package.json`
to reference the real package.
