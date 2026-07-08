# ASSEMBLY.md — Customising Outputs & Assembling the Repo

**Audience:** the coding agent (GLM-5.2 or otherwise) that is about to take the
contents of this zip, push it to the Code Bhau Agent GitHub repo, and start
customising Continue's forked code into Code Bhau's own flavour.

**Status:** Operational guide. Read this BEFORE you do anything else — before
opening `ARCHITECTURE.md`, before running any build, before touching any file.

---

## 0. The four-document stack

This repo ships with four companion docs. They have distinct roles. Do not
confuse them.

| Document | What it is | When you read it |
|---|---|---|
| `ARCHITECTURE.md` | The system spec. Part A is human-readable; Part B is the dense build contract (directory layout, TypeScript interfaces, data flows, 8 hard engineering constraints). | Once per session, front-loaded. Paste in full before any task. |
| `IMPLEMENTATION_PLAN.md` | The 8-phase, ~30-task build plan. Each task is already in Goal/Context/Constraints/Inputs/Output-format/Success-criteria form. | To pick the next task. One task per session — never a whole phase. |
| `AGENT.md` | Short engineering standards file. Lint rules, build commands, commit conventions, prohibited actions, required verification loop. | Open alongside `ARCHITECTURE.md` for every session. Keep current. |
| `ASSEMBLY.md` (this file) | How to actually deliver work into the repo: initial GitHub assembly, per-task workflow, customisation rules, stubs handling, file map. | Once, when setting up the repo. Then §B as a checklist every session. |

**Golden rule:** if you find yourself about to write code, build an outline, or
delegate a subtask without having read `ARCHITECTURE.md` Part B and `AGENT.md`
in full this session, STOP and read them first. They are short on purpose.

---

## A. Initial Assembly — do this once

These steps take the contents of this zip and turn them into the live
`github.com/code-bhau/code-bhau-agent` repository. Do them exactly once. Do
not mix them with any per-task work.

### A.1 Unzip and inspect

```bash
unzip code-bhau-agent.zip
cd code-bhau-agent
ls -la
```

You should see at the repo root:
- `AGENT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `ASSEMBLY.md` (this file)
- `README.md`, `LICENSE` (Apache-2.0 verbatim from Continue), `NOTICE` (crediting Continue Dev, Inc)
- `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md` (carried over from Continue — review later)
- `package.json` (root, npm workspaces), `package-lock.json`, `.gitignore`
- `core/`, `gui/`, `extensions/vscode/` (forked from Continue)
- `packages/terminal-security/` (Code Bhau stub — see §D)
- `scripts/util/` (Code Bhau stub — see §D)

### A.2 Initialise git and make the foundational commit

```bash
git init -b main
git add .
git status                    # inspect — confirm no node_modules/dist/out/build leaked in
git commit -m "chore: initial fork from continuedev/continue (Apache-2.0)

Code Bhau Agent v0.1.0 — Phase 0 Task 0.1.
Forked and stripped from continuedev/continue under Apache-2.0.
Preserves LICENSE and adds NOTICE crediting Continue Dev, Inc.
Two stubs introduced: packages/terminal-security/ and scripts/util/.
See ASSEMBLY.md for the operational guide going forward."
```

### A.3 Push to GitHub

```bash
git remote add origin git@github.com:code-bhau/code-bhau-agent.git
git push -u origin main
```

If the GitHub repo doesn't exist yet, create it first (empty, no README, no
LICENSE — the zip already has both). The repo should be public so the
Apache-2.0 attribution is visible; private is fine during Phase 0 if you
prefer, but flip to public before marketplace publishing (Task 7.5).

### A.4 Verify the build works from a clean clone

```bash
cd ..
git clone git@github.com:code-bhau/code-bhau-agent.git code-bhau-agent-verify
cd code-bhau-agent-verify
npm install
npm run build
```

Expected: `npm install` succeeds with no errors; `npm run build` exits 0 and
produces `packages/terminal-security/dist/`, `gui/dist/`,
`extensions/vscode/out/`. See `AGENT.md` "Commands" section for the full
verification loop.

If the build fails on a fresh clone, **stop and fix it before any further
work**. Phase 0 Task 0.1's Definition of Done is "repo builds and packages as
a `.vsix` with Code Bhau branding" — that bar must hold for every subsequent
task to make sense.

### A.5 Update worklog

Append to `worklog.md` (root of repo — create if missing):

```markdown
---
Task ID: 0.1-assembly
Agent: <your name/model>
Task: Initial GitHub assembly per ASSEMBLY.md §A.

Work Log:
- Unzipped code-bhau-agent.zip to <path>
- git init -b main, foundational commit
- Pushed to git@github.com:code-bhau/code-bhau-agent.git
- Verified clean-clone build: <PASS|FAIL + details>

Stage Summary:
- Repo is now live at <github url>
- Next task: <Task 0.2 / 0.4 / first Phase 1 task>
```

The worklog is the shared memory across sessions and across agents. Always
read it first; always append to it; never overwrite.

---

## B. Per-Task Workflow — do this every session

One task per session. Not one phase, not "a couple of related tasks" — one
task, one reviewable diff, one verification report. This is non-negotiable
per `IMPLEMENTATION_PLAN.md` §"How to use this document with GLM-5.2".

### B.1 Pre-task (before any code changes)

1. **Read `worklog.md`** — know what previous agents did, what's done, what's
   blocked, what risks were flagged.
2. **Read `ARCHITECTURE.md` Part B in full** — front-load the contract.
3. **Read `AGENT.md` in full** — know the standards, the prohibited actions,
   the verification loop you'll need to run.
4. **Pick exactly one task** from `IMPLEMENTATION_PLAN.md`. Announce which
   one in your first response to the human.
5. **Set effort mode** per the task's recommendation (`High` for mechanical
   edits, `Max` for anything touching multiple modules, architecture-shaping
   decisions, or the agent loop itself).

### B.2 During the task

- Stay strictly inside the task's stated scope. If you discover the task
  requires touching a file outside its declared scope, STOP and report it
  instead of expanding scope silently. This is `AGENT.md` prohibited action
  #4.
- If you need to introduce a new runtime dependency, flag it explicitly in
  your output summary. This is `AGENT.md` prohibited action #1.
- If you need to modify the public shape of any interface in `core/types/`,
  you must also update `ARCHITECTURE.md` §B.3 in the same change. This is
  `AGENT.md` prohibited action #2.
- **Never log, print, or write API keys anywhere** — not in code, not in
  commit messages, not in generated docs. This is `AGENT.md` prohibited
  action #6 and `ARCHITECTURE.md` §B.5 rule 1.

### B.3 Post-task verification loop (mandatory)

Per `AGENT.md` "Required verification loop":

1. Run the build: `npm run build`
2. Run lint: `npm run lint`
3. Run tests (if any exist for the touched area): `npm test`
4. Type-check (especially if you touched interfaces): `npm run tsc:check`
5. Report the verification results in your response to the human — even if
   everything passed. If you did NOT actually run a step, say so explicitly.
   This is `AGENT.md` prohibited action #5: "Do not fabricate test results."

### B.4 Post-task worklog entry

Append to `worklog.md`:

```markdown
---
Task ID: <X.Y>
Agent: <name/model>
Task: <one-line summary of the task from IMPLEMENTATION_PLAN.md>

Work Log:
- <concrete step 1>
- <concrete step 2>
- ...

Stage Summary:
- Artifacts produced: <paths>
- Verification results: build=<PASS|FAIL>, lint=<PASS|FAIL>, test=<PASS|FAIL|N/A>, tsc=<PASS|FAIL>
- Risks uncovered: <list, or "none">
- Hard constraints respected: <list the §B.5 rules relevant to this task>
```

### B.5 Produce the diff for human review

- Do NOT auto-commit. This is `AGENT.md` prohibited action #3.
- Do NOT push. Do NOT open a pull request.
- Produce a clean `git diff` (staged but uncommitted) and present it for
  human review.
- The human (Yash / Aryan / etc.) reviews and either approves the commit,
  asks for changes, or rejects. Only after their explicit approval does a
  commit happen.

---

## C. Customising the Outputs — where Code Bhau flavour goes

The forked Continue code is the scaffolding. Code Bhau's product identity
gets layered on top. This section tells you where to put the flavour and
— equally important — where to leave Continue's code alone.

### C.1 Brand the marketplace-facing identity (continue → code-bhau)

Already done in Task 0.1, but verify and extend as needed:

| File | What to customise | What to leave alone |
|---|---|---|
| `extensions/vscode/package.json` | `name`, `publisher`, `displayName`, `description`, `repository`, `bugs`, `homepage`, `qna`, `categories`, `keywords`, `icon` | `license` (Apache-2.0), `author` (must retain "Continue Dev, Inc (original)" attribution per Apache-2.0 §4) |
| `extensions/vscode/media/icon.png` | Replace with Code Bhau logo | — |
| `extensions/vscode/media/sidebar-icon.svg` | Replace with Code Bhau icon | — |
| `gui/public/` | Logo, favicon, any placeholder art | — |
| `README.md` | Tone, screenshots, GIFs, branding voice | Apache-2.0 attribution section |

### C.2 Voice and tone layer (the Marathi/Hindi beginner-friendly flavour)

Code Bhau's voice is "भाऊ / मित्रा" — chai-shop references, hostel-life
analogies, culturally-Marathi humour, plain-English explanations for
beginners. This voice goes in specific places, NOT everywhere:

| Where the voice goes | Where it does NOT go |
|---|---|
| `WALKTHROUGH.md` summaries (`WalkthroughGenerator`'s `summaryMarathi`/`summaryHindi` fields, Task 5.4) | Code comments — keep those professional |
| Sidebar UI microcopy (error states, empty states, onboarding prompts) | TypeScript interface names — keep those generic |
| README, marketplace listing, onboarding tutorial text | Log messages — keep those structured and parseable |
| Plan step titles in `PlanView.tsx` (when shown to the student) | `AgentEvent` payloads — keep those machine-readable |
| The humour dataset at `core/legacy-classifier/errors.json` (extended from v1's ~10 entries toward a 100-entry target) | API request/response shapes |

### C.3 What stays Continue's (do NOT rebrand these)

- `LICENSE` — Apache-2.0 verbatim. Never modify.
- `NOTICE` — credits Continue Dev, Inc. Update only to add Code Bhau
  copyright lines if needed; never remove the Continue attribution.
- Author attribution lines in every `package.json` (`"author": "Continue
  Dev, Inc (original); Code Bhau contributors (fork)"`) — keep the
  "Continue Dev, Inc (original)" half intact.
- `CODE_OF_CONDUCT.md` and `CONTRIBUTING.md` — carried over from Continue.
  Review and adapt in a later task if needed, but do not delete.
- The "Code Bhau fork note" / "Code Bhau fork patch" comments scattered
  through Continue-derived files — they document where you diverged from
  upstream. Leave them in place so future contributors can audit.

### C.4 Per-task output format

When the human asks you to do a task, your response should have these
sections in this order:

1. **What I understood** — restate the task in your own words, name the
   specific files you'll touch, name the §B.5 hard constraints that apply.
2. **What I did** — concrete numbered steps with file paths.
3. **Verification results** — build / lint / test / tsc, each with PASS or
   FAIL or N/A. If you skipped a step, say so.
4. **Risks uncovered** — even if none, write "none" explicitly.
5. **Diff for review** — the `git diff` output, or a clear pointer to where
   it is.
6. **Suggested next task** — one task from `IMPLEMENTATION_PLAN.md`,
   matching the dependency order.

This is the format `IMPLEMENTATION_PLAN.md` means when it says
"superfast drafts, human refinement." Make the draft easy to refine.

---

## D. Handling the two stubs

Task 0.1 introduced two Code Bhau-authored stub packages that replace
upstream Continue internals which were not available (unpublished to npm,
or not included in the source zip). Both are documented in their own
README files. Both have explicit "when to replace" criteria.

### D.1 `packages/terminal-security/`

- **What it stubs:** `@continuedev/terminal-security` — referenced by
  `core/`, `gui/`, and `extensions/vscode/` but not published to npm.
- **What it provides:** `ToolPolicy` type + permissive
  `evaluateTerminalCommandSecurity(basePolicy, command)` that returns
  `basePolicy` unchanged.
- **Why permissive is OK for now:** Code Bhau's threat model relies on
  `AgentLoop`'s scope guard (§B.5 rule 3, Task 4.1) and `TerminalTool`'s
  destructive-command confirmation gate (Task 4.2) as the actual security
  layer, not on shell metacharacter detection.
- **When to replace:** When (a) upstream publishes
  `@continuedev/terminal-security` to npm, OR (b) Code Bhau vendors the
  upstream `packages/terminal-security/` directory in. At that point,
  delete this stub dir and update the `file:../packages/terminal-security`
  refs in `core/package.json` and `gui/package.json` to the upstream
  source.
- **Risk if you forget:** A beginner could in principle be tricked by a
  prompt-injected model output into running a shell command that the
  upstream package would have flagged. Mitigation until replacement:
  ensure `TerminalTool`'s human-confirmation gate (Task 4.2) covers
  destructive commands explicitly.

### D.2 `scripts/util/`

- **What it stubs:** The root-level `scripts/util/` directory from the
  upstream Continue monorepo, which `extensions/vscode/scripts/*.js`
  requires for build helpers.
- **What it provides:** `execCmdSync`, `validateFilesPresent`,
  `autodetectPlatformAndArch` — minimal CommonJS implementations.
- **When to replace:** When (a) the upstream `scripts/util/` is vendored
  in, OR (b) Code Bhau rewrites the `extensions/vscode/scripts/*.js` build
  pipeline (likely during Task 7.5's marketplace packaging pass).
- **Risk if you forget:** None at runtime — this dir is only invoked by
  build scripts. If a future build step fails because a helper is missing,
  extend this stub rather than reaching for the upstream implementation.

### D.3 General stub discipline

- Stubs are documented. Read their READMEs before touching them.
- Stubs are minimal. Don't gold-plate them — they're meant to be replaced,
  not maintained indefinitely.
- Stubs have explicit "when to replace" criteria. Track these in
  `worklog.md`'s risk section so they don't get forgotten.
- If a stub's API surface needs to grow (because a later task starts
  consuming a new export from it), extend the stub AND update its README
  to reflect the new surface. Do not silently expand a stub's
  responsibilities.

---

## E. Hard rules (recap — these are non-negotiable)

From `ARCHITECTURE.md` §B.5 and `AGENT.md`:

1. **BYOK only.** `KeyManager` only ever rotates across keys a single user
   registered themselves. No pooling, no shared accounts, no
   Code-Bhau-supplied keys. This is a hard product boundary, not a coding
   style preference.
2. **No key leakage.** Keys never appear in logs, `AgentEvent`s, generated
   docs, commit messages, or anywhere except the moment of an actual
   provider call from `KeyVault`.
3. **Scope guard.** `AgentLoop` may only touch files listed in the
   approved plan's `filesTouched`. Out-of-scope touch → `error` event
   requesting re-approval, never silent scope expansion.
4. **Distinct reviewer model.** `ReviewerAgent` must use a different
   model than the writer. If only one model is configured, degrade
   gracefully with a visible note.
5. **No fabricated test claims.** `WalkthroughGenerator` may only claim
   tests were run if a tool result actually shows them running.
6. **No new runtime deps without flagging.** Call it out in the task's
   output summary.
7. **No interface shape changes without updating `ARCHITECTURE.md`.**
8. **No auto-commit.** Every task ends with a diff for human review.

---

## F. File map — quick reference

Where things live and where new things should go.

```
code-bhau-agent/
├── ARCHITECTURE.md              # READ — system spec, Part B is the contract
├── IMPLEMENTATION_PLAN.md       # READ — pick one task per session
├── AGENT.md                     # READ — engineering standards
├── ASSEMBLY.md                  # READ — this file
├── README.md                    # Public face of the repo
├── LICENSE                      # Apache-2.0, do not modify
├── NOTICE                       # Attribution to Continue Dev, Inc
├── CODE_OF_CONDUCT.md           # Carried over from Continue
├── CONTRIBUTING.md              # Carried over from Continue
├── worklog.md                   # APPEND — every session, every task
├── package.json                 # npm workspaces root
├── package-lock.json            # Reproducibility
├── .gitignore
│
├── core/                        # Forked from Continue — Code Bhau modules go IN HERE
│   ├── providers/               # → Phase 1: OllamaProvider, LMStudioProvider, OpenRouterProvider, NvidiaNimProvider, ProviderRegistry
│   ├── keys/                    # → Phase 1: KeyVault (Task 1.7), KeyManager (Task 1.8) — security-sensitive, Max effort
│   ├── classifier/              # → Phase 2: TaskClassifier
│   ├── router/                  # → Phase 2: ModeRouter, ModelRouter, modelTierDefaults
│   ├── planning/                # → Phase 3: PlanGenerator, PlanStore
│   ├── agent/                   # → Phase 4: AgentLoop (Task 4.1, Max effort), tools/, DiffApplier — highest technical risk
│   ├── review/                  # → Phase 5: ReviewerAgent, WalkthroughGenerator
│   ├── legacy-classifier/       # → Phase 0 Task 0.2: v1 ErrorClassifier/ResponseSelector/errors.json land here unmodified
│   ├── types/                   # → Phase 1+: provider.ts, task.ts, plan.ts, agentEvent.ts, walkthrough.ts — interface contracts, update ARCHITECTURE.md when changed
│   └── ... (other upstream dirs — leave alone unless task says otherwise)
│
├── extensions/vscode/           # Forked from Continue — rebranded in Task 0.1
│   ├── src/
│   │   ├── extension.ts         # → Phase 6 Task 6.1: onboarding flow activation logic
│   │   ├── SidebarProvider.ts   # → Phase 6 Task 6.4: logo webview patch
│   │   └── HoverProvider.ts     # → Phase 0 Task 0.2: relocated from v1
│   ├── package.json             # Already rebranded (name=code-bhau, publisher=code-bhau)
│   └── ...
│
├── gui/                         # Forked from Continue — sidebar webview UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlanView.tsx              # → Phase 3 Task 3.3
│   │   │   ├── BuildProgressView.tsx     # → Phase 4 Task 4.4
│   │   │   ├── KeyManagerSettings.tsx    # → Phase 1 Task 1.9, extended in Phase 6 Task 6.2
│   │   │   └── WalkthroughView.tsx       # → Phase 5 Task 5.3
│   │   └── App.tsx
│   └── ...
│
├── packages/
│   └── terminal-security/       # STUB — see §D.1
│       ├── src/index.ts
│       ├── dist/                # Generated by build
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md            # Read before touching
│
└── scripts/
    └── util/                    # STUB — see §D.2
        ├── index.js
        ├── package.json         # Scoped CommonJS to override root ESM
        └── README.md            # Read before touching
```

---

## G. When in doubt

- **About what to build:** read `ARCHITECTURE.md` Part B again.
- **About which task is next:** read `IMPLEMENTATION_PLAN.md`, find the
  lowest-numbered task whose dependencies are all marked done in
  `worklog.md`.
- **About engineering standards:** read `AGENT.md`.
- **About what previous agents did or flagged:** read `worklog.md`.
- **About whether to expand scope:** don't. Stop and report instead. This
  is `AGENT.md` prohibited action #4 and the single most common way a
  coding agent wrecks a multi-session build plan.
- **About whether to auto-commit:** don't. Ever. Produce a diff. Wait for
  human review.
- **About whether to log an API key:** don't. Ever. Anywhere. For any
  reason.

If none of those answer it, ask the human. One good question is cheaper
than one wrong task.
