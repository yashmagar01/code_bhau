# Code Bhau Agent — Implementation Plan

**Companion documents:** `ARCHITECTURE.md` (full system spec), `AGENT.md` (engineering standards)

---

## How to use this document with GLM-5.2

1. **Paste `ARCHITECTURE.md` in full, first.** GLM-5.2 holds architectural context (module boundaries, interfaces, constraints) reliably across a long session once it's front-loaded — don't make it re-derive the design each task.
2. **Then paste `AGENT.md`.**
3. **Then give it exactly one task block below** (not a whole phase at once — one subtask). Each block is already structured as Goal / Context / Constraints / Inputs / Output format / Success criteria, which is the format GLM-5.2 responds most reliably to; don't paraphrase it into prose.
4. **Set effort mode per the recommendation on each task.** `High` for mechanical/well-scoped edits, `Max` for anything touching multiple modules, architecture-shaping decisions, or the agent loop itself.
5. **After each task, require the verification loop from `AGENT.md`** (build, lint, test, report risks) before you review the diff.
6. **You (Yash/Aryan) review and refine before moving to the next task.** Treat GLM's output as a strong first draft, not a merge-ready patch — this is explicitly the workflow you described: superfast drafts, human refinement.
7. One task per commit-sized diff. Don't let a session sprawl across multiple tasks without a review checkpoint in between — long-horizon capability is strong but not a substitute for you actually reading the diff.

---

## Phase 0 — Foundation & Fork Setup

**Definition of done:** repo builds and packages as a `.vsix` with Code Bhau branding, v1 files preserved and relocated, `AGENT.md` commands section filled in with real, working commands.

### Task 0.1 — Fork and strip Continue down to a working base

- **Goal:** Produce a buildable monorepo at `code-bhau-agent/` containing only Continue's `core` and `extensions/vscode`, renamed/rebranded, with license/attribution preserved.
- **Context:** Starting from a clean clone of `continuedev/continue` (Apache-2.0). Nothing in this repo exists yet beyond the two companion docs.
- **Constraints:** Keep the Apache-2.0 `LICENSE` and add a `NOTICE` file crediting Continue Dev, Inc. per Apache-2.0 §4. Do not remove attribution. Do not yet touch `gui/` — that's a later task.
- **Inputs:** `ARCHITECTURE.md` §B.1 (target repo layout).
- **Output format:** A directory tree matching `ARCHITECTURE.md` §B.1's `core/` and `extensions/vscode/` sections (empty stub files where implementation comes in later phases is fine), root `package.json` with npm workspaces configured, `LICENSE`, `NOTICE`.
- **Success criteria:** `npm install` succeeds at root with no errors; a placeholder `npm run build` script exists (even if it just type-checks empty stubs).
- **Effort mode:** High.

### Task 0.2 — Migrate v1 Code Bhau into `core/legacy-classifier/`

- **Goal:** Move the existing v1 extension's classifier code into the new repo unmodified, ready to be wired into the new `TaskClassifier` later.
- **Context:** v1 files: `src/classifier/ErrorClassifier.ts`, `src/models/ErrorModel.ts`, `src/utils/ResponseSelector.ts`, `src/data/errors.json`, `src/providers/HoverProvider.ts`, `src/providers/SidebarProvider.ts`.
- **Constraints:** Do not rewrite logic in this task — pure relocation plus import-path fixes only. Preserve the two bug fixes already made (synthetic string format matching for TS diagnostic codes; specific-before-catch-all pattern ordering for `null_reference` vs `array_out_of_bounds`/`promise_rejection`).
- **Inputs:** `ARCHITECTURE.md` §B.1, §B.7.
- **Output format:** Files present under `core/legacy-classifier/` and `extensions/vscode/src/HoverProvider.ts`, `SidebarProvider.ts`, with all imports resolving.
- **Success criteria:** Existing v1 unit/smoke tests (`test/smokeTest.js` equivalent) still pass unmodified.
- **Effort mode:** High.

### Task 0.3 — Fill in real build/lint/test commands in `AGENT.md`

- **Goal:** Replace the placeholder commands section in `AGENT.md` with the actual working npm scripts from this repo.
- **Context:** Depends on Task 0.1's `package.json` scaffolding.
- **Constraints:** Don't invent commands that don't exist — verify each one actually runs before recording it.
- **Output format:** Updated `AGENT.md` commands section only.
- **Success criteria:** Every command listed actually executes without an unrecognized-script error.
- **Effort mode:** High.

### Task 0.4 — Baseline packaging check

- **Goal:** Confirm the stripped-down fork still packages into a `.vsix` via `vsce package`.
- **Constraints:** Inspect the resulting `.vsix` contents (per the v1 pre-publish lesson) to confirm no scratch/internal files are bundled.
- **Success criteria:** A `.vsix` is produced; `vsce ls` output contains only intended files.
- **Effort mode:** High.

---

## Phase 1 — Model & Provider Layer

**Definition of done:** the extension can list local models from Ollama/LM Studio and send a chat request to OpenRouter/NVIDIA NIM using a student-registered key, with quota-based failover across that student's own keys.

### Task 1.1 — Implement `core/types/provider.ts`

- **Goal:** Implement the exact interfaces from `ARCHITECTURE.md` §B.3 (`ModelInfo`, `ChatMessage`, `ToolDefinition`, `ChatRequest`, `ChatChunk`, `ModelProvider`).
- **Constraints:** Interface shapes must match §B.3 exactly — this is the contract every provider and the router depend on.
- **Output format:** `core/types/provider.ts`.
- **Success criteria:** Compiles under strict TypeScript with no `any` leaking into the public exports.
- **Effort mode:** High.

### Task 1.2 — `OllamaProvider`

- **Goal:** Implement `ModelProvider` against Ollama's local HTTP API (`GET /api/tags` for `listModels()`, `POST /api/chat` streamed for `chat()`).
- **Constraints:** Must handle "Ollama not running" gracefully (return empty model list, not throw) — this feeds the onboarding flow in Phase 6.
- **Inputs:** `ARCHITECTURE.md` §B.4 Flow 2.
- **Output format:** `core/providers/local/OllamaProvider.ts`.
- **Success criteria:** Against a locally running Ollama with at least one model pulled, `listModels()` and `chat()` both work end-to-end in a manual test.
- **Effort mode:** High.

### Task 1.3 — `LMStudioProvider`

- **Goal:** Implement `ModelProvider` against LM Studio's OpenAI-compatible local server.
- **Constraints:** Same graceful-absence handling as Task 1.2.
- **Output format:** `core/providers/local/LMStudioProvider.ts`.
- **Success criteria:** Manual test against a running LM Studio instance succeeds.
- **Effort mode:** High.

### Task 1.4 — `OpenRouterProvider`

- **Goal:** Implement `ModelProvider` against OpenRouter's OpenAI-compatible API, accepting a per-call API key (not stored inside the provider).
- **Constraints:** Must surface rate-limit responses (HTTP 429) as a distinguishable error type the `KeyManager` can react to, not a generic throw.
- **Output format:** `core/providers/cloud/OpenRouterProvider.ts`.
- **Success criteria:** A manual call with a valid test key streams a response; a call with an invalid key produces a distinguishable "invalid key" error.
- **Effort mode:** High.

### Task 1.5 — `NvidiaNimProvider`

- **Goal:** Same as 1.4, targeting NVIDIA NIM's OpenAI-compatible endpoint.
- **Output format:** `core/providers/cloud/NvidiaNimProvider.ts`.
- **Success criteria:** Same as 1.4.
- **Effort mode:** High.

### Task 1.6 — `ProviderRegistry`

- **Goal:** A single registry that holds all four providers and exposes a uniform lookup by `providerId`.
- **Output format:** `core/providers/ProviderRegistry.ts`.
- **Success criteria:** `ModelRouter` (Phase 2) can resolve any provider by id without knowing its concrete class.
- **Effort mode:** High.

### Task 1.7 — `KeyVault`

- **Goal:** Thin wrapper around VS Code's `SecretStorage` API for storing/retrieving raw key values by a generated `secretRef`, never returning raw values except at the moment of an actual provider call.
- **Constraints:** This is a security-sensitive module — no raw key value may appear in any log statement, thrown error message, or return value used outside the immediate call site. Re-read `ARCHITECTURE.md` §B.5 rule 1 before implementing.
- **Output format:** `core/keys/KeyVault.ts`.
- **Success criteria:** A manual test confirms a stored key round-trips correctly and does not appear in any console output during normal operation.
- **Effort mode:** Max (security-sensitive — worth the extra reasoning budget).

### Task 1.8 — `KeyManager`

- **Goal:** Implement the `KeyManager` interface from `ARCHITECTURE.md` §B.3: register/list keys per provider, track daily usage, mark exhausted/invalid, return the next active key on request.
- **Constraints:** Must only ever operate over keys registered by the current user — no cross-user pooling logic of any kind (§B.5 rule 2). Daily quota resets must be based on wall-clock date, not a rolling window, to keep the mental model simple for students.
- **Inputs:** `ARCHITECTURE.md` §B.4 Flow 1 (sequence diagram).
- **Output format:** `core/keys/KeyManager.ts`.
- **Success criteria:** Unit tests: registering 3 keys, exhausting key 1, confirms `getNextActiveKey` returns key 2; exhausting all 3 returns `null` with a clear "all keys exhausted" state exposed for the UI.
- **Effort mode:** Max.

### Task 1.9 — Key management settings UI (stub)

- **Goal:** A minimal webview panel where a student can add a key (provider dropdown, label, key paste field), see key status (active/exhausted/invalid), and remove a key.
- **Constraints:** Never render a raw key value back to the UI once saved — show only the label and status.
- **Output format:** `gui/src/components/KeyManagerSettings.tsx`.
- **Success criteria:** Manual test: add two fake keys, see them listed with correct status, remove one, list updates.
- **Effort mode:** High.

---

## Phase 2 — Task Understanding + Model Routing

**Definition of done:** given a raw student request, the system produces a `TaskClassification` and routes it to a concrete provider+model without the student choosing either manually.

### Task 2.1 — `TaskClassifier`

- **Goal:** Implement classification per `ARCHITECTURE.md` §B.3's `TaskClassification` shape, using a lightweight prompt against whichever model is currently active (or a small local model if available) — this must be cheap and fast, not the same model that will do the actual work.
- **Constraints:** Must always return a `rationale` string suitable for display to the student (builds trust in auto-routing — don't skip this field).
- **Output format:** `core/classifier/TaskClassifier.ts`.
- **Success criteria:** Given 10 hand-written example requests spanning all 5 `TaskCategory` values, classification matches expected category in at least 8/10 cases (log the 2 misses for human review, don't silently accept them).
- **Effort mode:** Max (this module's accuracy determines the whole beginner-friendliness of the product).

### Task 2.2 — Task→model tier default mapping

- **Goal:** A configuration table mapping `TaskCategory` × `complexity` → `ModelTier`, with sane defaults that require zero setup from a beginner, but are overridable in settings.
- **Output format:** A config file (e.g. `core/router/modelTierDefaults.ts`) plus a settings UI section for overrides.
- **Success criteria:** Defaults documented inline with a one-line rationale per mapping (e.g. "explain/low → fast-small: no need for a heavy model to explain a single line").
- **Effort mode:** High.

### Task 2.3 — `ModelRouter`

- **Goal:** Resolve `TaskClassification` + the tier mapping + `ProviderRegistry` + `KeyManager` into a concrete provider/model/key for the current request, implementing the failover behavior from `ARCHITECTURE.md` §B.4 Flow 1.
- **Constraints:** Must emit `AgentEvent.key-switched` whenever it fails over, per §B.5 — this is a transparency requirement, not optional telemetry.
- **Output format:** `core/router/ModelRouter.ts`.
- **Success criteria:** Integration test simulating a 429 from the first key confirms automatic retry on the next key and the correct event is emitted.
- **Effort mode:** Max.

### Task 2.4 — `ModeRouter`

- **Goal:** Decide `plan-then-build` vs `direct-build` vs `chat-only` from a `TaskClassification`.
- **Output format:** `core/router/ModeRouter.ts`.
- **Success criteria:** `bug-fix`/`explain`/`question` at `low` complexity → `direct-build` or `chat-only`; `new-feature`/`refactor` or anything at `high` complexity → `plan-then-build`.
- **Effort mode:** High.

---

## Phase 3 — Plan Mode

**Definition of done:** a student can see a numbered plan, comment on one step, get just that step regenerated, and approve the whole plan to hand off to Build Mode.

### Task 3.1 — `PlanGenerator`

- **Goal:** Given an approved task, produce an `ImplementationPlan` (per `ARCHITECTURE.md` §B.3) as structured step data — not a markdown blob the UI has to parse.
- **Constraints:** Each step must declare its own `filesTouched` — this list becomes the scope boundary `AgentLoop` enforces in Phase 4, so it must be accurate and specific, not vague.
- **Output format:** `core/planning/PlanGenerator.ts`.
- **Success criteria:** For a sample multi-file feature request, generates 3-6 steps, each with concrete filenames (not "various files").
- **Effort mode:** Max.

### Task 3.2 — `PlanStore` + targeted step regeneration

- **Goal:** Persist the current plan's state; when a student comments on a single step, regenerate only that step (not the whole plan) while keeping the other steps' `status` untouched.
- **Output format:** `core/planning/PlanStore.ts`.
- **Success criteria:** Test: comment on step 2 of a 4-step plan, confirm steps 1/3/4 are byte-identical after regeneration and only step 2 changed.
- **Effort mode:** High.

### Task 3.3 — `PlanView.tsx`

- **Goal:** Render the plan as commentable step cards in the sidebar webview, with per-step comment input and an overall "Approve & Build" action.
- **Output format:** `gui/src/components/PlanView.tsx`.
- **Success criteria:** Manual test: comment flow and approval flow both work against a mocked `PlanStore`.
- **Effort mode:** High.

---

## Phase 4 — Build Mode + Real-Time Progress

**Definition of done:** an approved plan executes end-to-end with live progress streamed to the sidebar, strictly scoped to the plan's declared files.

### Task 4.1 — Adapt Continue's `AgentLoop`

- **Goal:** Fork Continue's core agent execution loop into `core/agent/AgentLoop.ts`, adapted to consume an `ImplementationPlan` step-by-step and emit `AgentEvent`s per `ARCHITECTURE.md` §B.3/§B.4 Flow 3.
- **Constraints:** Enforce §B.5 rule 3 (scope guard): if a step's execution needs a file outside its declared `filesTouched`, emit an `error` event requesting re-approval rather than silently touching it.
- **Inputs:** Continue's original agent loop as reference implementation; do not reinvent tool-calling/diff-apply mechanics that already work well there.
- **Output format:** `core/agent/AgentLoop.ts`.
- **Success criteria:** Given a 2-step mocked plan, executes both steps in order, emits `step-started`/`step-completed` for each, and refuses (with an `error` event) an attempt to touch an undeclared file.
- **Effort mode:** Max — this is the highest-risk task in the whole plan; budget the most review time here too.

### Task 4.2 — Tools: `FileEditTool`, `TerminalTool`, `CodebaseSearchTool`

- **Goal:** Implement the three core tools the agent loop calls, forked from Continue's equivalents where possible.
- **Constraints:** `TerminalTool` must not execute destructive commands (`rm -rf`, force-push, etc.) without an explicit human confirmation step — flag this as a review item even if Continue's original didn't guard it, since this product's audience is beginners who may not catch a dangerous command.
- **Output format:** `core/agent/tools/FileEditTool.ts`, `TerminalTool.ts`, `CodebaseSearchTool.ts`.
- **Success criteria:** Each tool has at least one manual test against a scratch repo.
- **Effort mode:** Max.

### Task 4.3 — `DiffApplier`

- **Goal:** Apply model-proposed edits to files as reviewable diffs.
- **Output format:** `core/agent/DiffApplier.ts`.
- **Success criteria:** Round-trip test: propose an edit, apply it, confirm the resulting file matches expected content exactly.
- **Effort mode:** High.

### Task 4.4 — `BuildProgressView.tsx`

- **Goal:** Render the live `AgentEvent` stream in the sidebar — current step, files being touched, tool calls, and any `key-switched`/`error` notices.
- **Output format:** `gui/src/components/BuildProgressView.tsx`.
- **Success criteria:** Manual test against a mocked event stream shows steps updating live, not just a final state.
- **Effort mode:** High.

---

## Phase 5 — Reviewer + Walkthrough

**Definition of done:** every completed build produces a `WALKTHROUGH.md` reviewed by a model different from the one that wrote the code.

### Task 5.1 — `ReviewerAgent`

- **Goal:** Implement per `ARCHITECTURE.md` §B.5 rule 4 — re-reads the final diff with a distinct, smaller/cheaper model, producing review notes and a risk list.
- **Constraints:** Must explicitly select a different model than the writer's; if only one model/provider is configured (e.g., a student with a single local model), degrade gracefully with a visible note that self-review has reduced blind-spot coverage, rather than silently skipping the step.
- **Output format:** `core/review/ReviewerAgent.ts`.
- **Success criteria:** Test with a deliberately-introduced bug in a mock diff confirms the reviewer flags it.
- **Effort mode:** Max.

### Task 5.2 — `WalkthroughGenerator`

- **Goal:** Produce a `WalkthroughDoc` (per `ARCHITECTURE.md` §B.3) from the diff + review notes, written to `WALKTHROUGH.md` in the workspace root.
- **Constraints:** §B.5 rule 5 — never claim tests passed unless a tool result shows them actually running.
- **Output format:** `core/review/WalkthroughGenerator.ts`.
- **Success criteria:** Generated doc includes accurate `filesChanged`, a testable `howToTest` list, and `reviewedByModel` correctly populated.
- **Effort mode:** High.

### Task 5.3 — `WalkthroughView.tsx`

- **Goal:** Display the walkthrough in the sidebar after a build completes.
- **Output format:** `gui/src/components/WalkthroughView.tsx`.
- **Success criteria:** Renders all `WalkthroughDoc` fields; Marathi/Hindi summary shown if present, hidden cleanly if not.
- **Effort mode:** High.

### Task 5.4 — Hook the humor dataset into Marathi/Hindi summaries

- **Goal:** Have `WalkthroughGenerator` optionally produce `summaryMarathi`/`summaryHindi` in the same tone as the existing humor dataset (chai-shop/hostel-life references, "भाऊ"/"मित्रा").
- **Constraints:** Per `ARCHITECTURE.md` §B.7 — this is an enhancement layer; must not block walkthrough generation if the dataset doesn't cover the relevant category.
- **Output format:** Extension to `core/review/WalkthroughGenerator.ts`, reading from `core/legacy-classifier/errors.json`'s tone patterns as few-shot examples.
- **Success criteria:** Manual review by Yash/Aryan for tone authenticity — this one genuinely needs a human native-speaker check, not just automated tests.
- **Effort mode:** High.

---

## Phase 6 — Maharashtrian/Beginner UX Layer

**Definition of done:** a first-time student can go from installing the extension to a working local or cloud model with minimal friction, and the v1 error-explanation feature still works as a fast path.

### Task 6.1 — Onboarding flow

- **Goal:** On first activation, detect Ollama/LM Studio automatically; if neither found and no cloud key registered, show a simple two-choice onboarding ("Install a free local model" vs "Add a cloud API key") with a one-click recommended-model pull for local.
- **Output format:** New onboarding component + activation-time detection logic in `extension.ts`.
- **Success criteria:** Manual test on a machine with nothing installed walks through to a working state in under 5 clicks.
- **Effort mode:** High.

### Task 6.2 — BYOK key-add flow with signup links

- **Goal:** Extend Task 1.9's settings UI with direct links to each provider's free-tier signup page and a short "how to get a free key" note per provider.
- **Output format:** Extension to `gui/src/components/KeyManagerSettings.tsx`.
- **Success criteria:** Manual review confirms links are current and instructions are beginner-accurate.
- **Effort mode:** High.

### Task 6.3 — Wire `legacy-classifier` into `TaskClassifier`'s "explain" fast path

- **Goal:** When `TaskClassification.category === "explain"` and the request looks like a raw error message, route directly to the existing v1 `ErrorClassifier`/`ResponseSelector` instead of calling any model — instant, free, and offline.
- **Constraints:** Per §B.7, do not modify the v1 classifier's pattern ordering while wiring it in.
- **Output format:** Routing logic in `ModeRouter`/`TaskClassifier`.
- **Success criteria:** A pasted TypeScript compiler error resolves via the v1 path with zero model calls, confirmed by checking no `ChatRequest` was issued.
- **Effort mode:** High.

### Task 6.4 — `SidebarProvider.ts` logo webview patch

- **Goal:** Carry over the outstanding v1 backlog item — wire the logo image into the webview panel using `webview.asWebviewUri` (currently only text renders).
- **Output format:** Patch to `extensions/vscode/src/SidebarProvider.ts`.
- **Success criteria:** Logo renders correctly in the sidebar webview.
- **Effort mode:** High.

---

## Phase 7 — Testing, Docs, Release

**Definition of done:** marketplace-ready package with docs matching the v1 quality bar already established.

### Task 7.1 — End-to-end smoke tests

- **Goal:** Automated smoke tests covering: local-mode happy path, cloud-mode happy path with simulated key failover, plan-comment-approve flow, and the legacy-classifier fast path.
- **Output format:** `test/` directory, extending the existing `smokeTest.js` pattern.
- **Success criteria:** All four flows pass in CI or local run.
- **Effort mode:** Max.

### Task 7.2 — `TestingGuide.md` update

- **Goal:** Extend the existing v1 `TestingGuide.md` to cover the new agent flows for manual QA.
- **Effort mode:** High.

### Task 7.3 — README overhaul

- **Goal:** Update `README.md` to describe v3's dual-mode agent, BYOK philosophy, and updated screenshots/GIFs (see Task 7.4).
- **Constraints:** Keep the existing personal/Marathi-first branding voice already established in v1's README — this is a rewrite of scope, not tone.
- **Effort mode:** High.

### Task 7.4 — Demo assets

- **Goal:** Storyboard and produce a GIF or short screen-recording showing: onboarding → plan mode comment → build → walkthrough, plus a launch-post-ready SVG/graphic.
- **Effort mode:** High. (This one benefits from human creative direction — good candidate to do with Claude or another tool interactively rather than a single GLM prompt.)

### Task 7.5 — Marketplace packaging & publish checklist

- **Goal:** Repeat the v1 pre-publish audit: inspect the built `.vsix` for stray internal/scratch files, confirm `package.json` publisher/author/repo fields, confirm `LICENSE`/`NOTICE` present.
- **Effort mode:** High.

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Provider ToS violation from key-rotation patterns | Strictly BYOK — never pool/ship Code Bhau's own accounts (see `ARCHITECTURE.md` §B.5 rule 2) |
| API keys leaked via logs/telemetry/generated docs | `KeyVault` security constraints (§B.5 rule 1), Task 1.7 flagged as Max-effort for extra review |
| Agent silently expands scope beyond the approved plan | Hard scope-guard in `AgentLoop` (§B.5 rule 3, Task 4.1) |
| Reviewer sharing writer's blind spots | Distinct-model requirement (§B.5 rule 4, Task 5.1) |
| Fabricated test-pass claims in Walkthrough | Explicit constraint (§B.5 rule 5, Task 5.2) |
| Local models too heavy for student laptops | Default to 3B–8B recommendations (§B.6), one-click pull, graceful "not found" handling |
| GLM-5.2 output quality varies with vague prompts | This entire document's task structure exists specifically to counter that — don't skip the structured fields even when a task looks simple |
| Marathi/Hindi tone feels like direct translation rather than authentic | Human native-speaker review required on Task 5.4, not automated-only |

---

## Optional idea for later consideration

Since GLM-5.2 is available via OpenRouter at meaningfully lower cost than most closed frontier models, it's worth considering as one of the **default suggested cloud models** inside Code Bhau itself (not just as your build tool) once Phase 1's `OpenRouterProvider` exists — cheap, capable, and a natural fit for cost-conscious students. Worth a deliberate decision in Phase 2's tier-mapping defaults rather than an afterthought.
