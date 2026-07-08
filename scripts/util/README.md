# `scripts/util/` — root-level build helpers (stub)

**Status:** STUB. Not the upstream Continue implementation.

The forked `extensions/vscode/scripts/*.js` files all `require("../../../scripts/util")`
for shared build helpers (`execCmdSync`, `validateFilesPresent`, `autodetectPlatformAndArch`).
The original implementations live in `continuedev/continue/scripts/util/` and were
not included in the snapshot we forked from.

This directory provides a minimal CommonJS stub that satisfies the named
exports consumed by the vscode build scripts. It is **not** a feature-complete
port of the upstream util module — only the three functions actually imported
by the build scripts are implemented, and only as simply as possible.

## Why a stub

Same reasoning as `packages/terminal-security/`: the cleanest way to keep
`npm run esbuild` / `npm run package` working without pulling in the entire
upstream `scripts/` tree. The full upstream util module is large and has its
own dependency graph that isn't needed for Code Bhau's build path.

## When to replace this stub

When (a) the upstream `scripts/util/` is vendored in, or (b) Code Bhau
replaces the vscode build scripts entirely (likely in Phase 7's packaging
pass, Task 7.5), this stub can be deleted.

## Public API

- `execCmdSync(cmd, opts?)` — synchronous shell runner, inherits stdio
- `validateFilesPresent(files[])` — existence checker, throws on missing
- `autodetectPlatformAndArch()` — returns `${process.platform}-${process.arch}`
