/**
 * Root-level build utilities — minimal stub.
 *
 * The forked Continue monorepo's `extensions/vscode/scripts/*.js` files all
 * `require("../../../scripts/util/index")` for build helpers. The original
 * implementations live in `continuedev/continue/scripts/util/` and were not
 * included in the snapshot we forked from. This file provides minimal
 * implementations of the named exports actually consumed by the vscode
 * build scripts:
 *
 *   - execCmdSync(cmd, opts?)         — synchronous shell runner
 *   - validateFilesPresent(files[])   — existence checker (used by prepackage)
 *   - autodetectPlatformAndArch()     — `${process.platform}-${arch}` string
 *
 * Behaviour is intentionally simple — these are only invoked from `npm run
 * esbuild` / `npm run package` style scripts, which are themselves only run
 * during a full packaging pass (Task 0.4 and later). Day-to-day type-checking
 * and per-workspace builds do not go through here.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Run a shell command synchronously, inheriting stdio.
 *
 * Mirrors the call sites in extensions/vscode/scripts: each invocation either
 * passes a bare command string or a command string plus a cwd option.
 *
 * @param {string} cmd     Shell command to execute.
 * @param {{ cwd?: string, stdio?: import("child_process").StdioOptions }} [opts]
 * @returns {string} Trimmed stdout. Throws on non-zero exit.
 */
function execCmdSync(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd || process.cwd(),
    stdio: opts.stdio || "inherit",
  })
    .toString()
    .trim();
}

/**
 * Verify that every path in `files` exists relative to the repo root.
 * Used by `prepackage.js` to fail fast if expected build outputs are missing
 * before `vsce package` bundles them.
 *
 * @param {string[]} files Paths relative to repo root.
 * @throws {Error} if any file is missing, with the missing paths listed.
 */
function validateFilesPresent(files) {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const missing = files.filter((f) => !fs.existsSync(path.join(repoRoot, f)));
  if (missing.length > 0) {
    throw new Error(
      `validateFilesPresent: missing expected files:\n  - ${missing.join("\n  - ")}`,
    );
  }
}

/**
 * Detect `${platform}-${arch}` for the current process. Mirrors the upstream
 * naming used by `prepackage-cross-platform.js` to pick which native binaries
 * (sqlite3, ripgrep) to ship in the .vsix per-platform package.
 *
 * @returns {string} e.g. "darwin-arm64", "linux-x64", "win32-x64".
 */
function autodetectPlatformAndArch() {
  return `${process.platform}-${process.arch}`;
}

module.exports = {
  execCmdSync,
  validateFilesPresent,
  autodetectPlatformAndArch,
};
