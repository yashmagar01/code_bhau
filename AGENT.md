# AGENT.md — Engineering Standards for Coding Agents

This file exists because Z.ai's own guidance for GLM-5.2 recommends giving any coding agent a short, explicit standards file (lint rules, build/test commands, commit conventions, prohibited actions) rather than relying on it to infer conventions. Keep this file open/pasted alongside `ARCHITECTURE.md` for every build session.

## Stack

- Language: TypeScript (strict mode on)
- Runtime: Node.js (VS Code extension host)
- UI: React (webview), Tailwind not used — match VS Code's native theme variables instead
- Package manager: npm, workspaces at repo root

## Commands (verified working as of Task 0.1 — keep this section current)

Repo root is an npm workspaces monorepo. Run all commands from the root unless noted.

- Install (all workspaces): `npm install`
- Build everything that builds clean (stub + gui + vscode esbuild bundle): `npm run build`
- Build everything including core (will exit non-zero on upstream type drift; `core/dist/` is still emitted because `noEmitOnError: false`): `npm run build:all`
- Build a single workspace:
  - terminal-security stub: `npm run build --workspace @continuedev/terminal-security`
  - core (tsc emit, may exit non-zero on type drift): `npm run build --workspace core`
  - gui (vite, clean): `npm run build --workspace gui`
  - vscode extension (esbuild bundle, clean): `npm run esbuild --workspace code-bhau`
- Type-check (no emit) across all workspaces: `npm run tsc:check`
- Lint across all workspaces: `npm run lint`
- Test across all workspaces: `npm run test`
- Package extension as `.vsix` (Task 0.4 — not yet verified end-to-end): `npm run package:vscode`

## Commit conventions

- Conventional Commits style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- One phase-task = one logical commit, proposed as a diff for human review — **never auto-committed**

## Prohibited actions (hard rules)

- Do not introduce new runtime dependencies without calling it out explicitly in your output summary.
- Do not modify the public shape of any interface in `core/types/` without also updating `ARCHITECTURE.md` in the same change.
- Do not commit, push, or open pull requests proactively.
- Do not touch files outside the scope named in the current task/plan step — if you believe you need to, stop and report it instead of expanding scope silently.
- Do not fabricate test results. If you didn't actually run the build/lint/tests, say so.
- Do not log, print, or write API keys anywhere — not in code, not in commit messages, not in generated docs.

## Required verification loop

After completing any modification:
1. Run the build.
2. Run lint.
3. Run tests (if present for the touched area).
4. Report the verification results and any uncovered risks in your response — even if everything passed.

## Recommended way to invoke this repo's agent tasks

> Please strictly follow the engineering standards in `AGENT.md` and the contracts in `ARCHITECTURE.md`. Do not introduce new dependencies, do not modify the interfaces in `core/types/`, and do not commit changes proactively. After completing the task, run the build, lint, and tests, then report the verification results and any uncovered risks.
