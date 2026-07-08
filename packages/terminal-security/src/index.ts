/**
 * @continuedev/terminal-security — STUB implementation
 *
 * This file is a Code Bhau stub for the upstream @continuedev/terminal-security
 * package, which is referenced by the forked Continue code but not published to
 * the npm registry.
 *
 * Public API surface kept identical to what the consumers in `core/`, `gui/`,
 * and `extensions/vscode/` expect:
 *   - `ToolPolicy` (type) — union of allowed policy states
 *   - `evaluateTerminalCommandSecurity(basePolicy, command)` — policy resolver
 *
 * Implementation choice (Code Bhau):
 *   This stub is intentionally PERMISSIVE. It does not implement command
 *   injection / argument escaping / shell metachar detection. Code Bhau's
 *   `AgentLoop` enforces its own scope guard (ARCHITECTURE.md §B.5 rule 3)
 *   and `TerminalTool` is required to gate destructive commands behind an
 *   explicit human confirmation step (IMPLEMENTATION_PLAN.md Task 4.2),
 *   so the permissive stub here does not widen the product's actual security
 *   posture — the upstream package's deeper checks are layered on top later.
 *
 *   When the upstream package becomes available (published to npm, or vendored
 *   from continuedev/continue/packages/terminal-security), delete this stub
 *   directory and switch the `file:` reference in `core/package.json` and
 *   `gui/package.json` back to the upstream source.
 */

/**
 * A tool's permission state, as evaluated against the active security policy.
 *
 * - `"disabled"`                 — tool is not available
 * - `"allowedWithPermission"`    — tool may run, but the human must approve first
 * - `"allowedWithoutPermission"` — tool may run without explicit per-call approval
 */
export type ToolPolicy =
  | "disabled"
  | "allowedWithPermission"
  | "allowedWithoutPermission";

/**
 * Evaluate the effective security policy for a terminal command.
 *
 * STUB BEHAVIOUR: returns `basePolicy` unchanged. Does NOT inspect the command
 * string. See file header for why this is acceptable for Code Bhau's threat
 * model in the stub phase, and what replaces it later.
 *
 * @param basePolicy  The tool's default policy (typically `defaultToolPolicy`).
 * @param _command    The shell command the agent wants to run. Unused in stub.
 * @returns           The resolved `ToolPolicy` to apply for this call.
 */
export function evaluateTerminalCommandSecurity(
  basePolicy: ToolPolicy,
  _command: string,
): ToolPolicy {
  return basePolicy;
}
