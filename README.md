# Code Bhau <img src="media/icon.png" alt="Code Bhau logo" width="64" height="64" align="right" />

> **Bhau, party la bolavla pan guest aalach nahi.**
> A supportive senior dev bhau who explains your errors in Marathi, Hindi & English — 100% offline, no APIs, no AI code generation.

**Code Bhau** is a beginner-friendly programming companion VS Code extension built for diploma students, engineering students, self-taught developers, hackathon participants and first-year programmers. It is **NOT** an AI coding assistant. It does **NOT** generate code. It does **NOT** replace Copilot. It helps students **understand errors** in the same way a senior friend would — with a slightly funny, culturally grounded one-liner, a plain-English explanation, and concrete fixes.

---

## Why Code Bhau?

Traditional compiler messages prioritize machine-state accuracy over human cognitive processing. When a first-year student sees:

```
TS2307: Cannot find module 'axios' or its corresponding type declarations.
```

…they see a wall of noise. Code Bhau intercepts that message and turns it into:

> **Missing Package**
>
> *Bhau, party la bolavla pan guest aalach nahi.*
>
> **Meaning:** Your code is trying to use a package that is not installed.
>
> **Likely Fixes:**
> - Run `npm install <package>`
> - Check `package.json` — is the package listed under `dependencies`?
> - Restart your dev server / TS language server after installing.

That's it. Friendly. Beginner-first. Always supportive, never toxic.

---

## Features

### Phase 2 MVP

| Feature | Status |
|---|---|
| **Error Detection** — captures TypeScript, JavaScript, React, Node, ESLint, JSON diagnostics via `vscode.languages.onDidChangeDiagnostics` | ✅ |
| **Error Classification Engine** — `ErrorClassifier` class with regex matching | ✅ |
| **Local Error Database** — 20 error families, 600 responses (10 per language × 3 languages), `src/data/errors.json` | ✅ |
| **Language Modes** — Marathi (default), Hindi, English via `codeBhau.language` setting | ✅ |
| **Random Contextual Responses** — anti-repetition selector remembers last N picks per family | ✅ |
| **Hover UI** — `MarkdownString` hover with title, response, meaning, fixes, taxonomy footer | ✅ |
| **Side Panel** — activity-bar webview with live error display, copy-to-clipboard fixes | ✅ |
| **Demo command** — sample error picker for testing without writing bad code | ✅ |

### Categories (MVP)

1. `Syntax` — missing semicolons, syntax errors, JSON parse errors, export errors
2. `UndefinedVariable` — `ReferenceError`, `TS2304`, ESLint `no-undef`
3. `NullReference` — `TypeError: Cannot read properties of null/undefined`, NPE
4. `MissingModule` — `Cannot find module`, import errors, dependency conflicts
5. `ReactHooks` — `Rendered fewer/more hooks`, Minified React #321
6. `TypeError` — type mismatches, array bounds, promise rejections
7. `BuildFailure` — npm errors, build failures, infinite loops, fetch failures, port conflicts, env var missing, DB connection failures, git conflicts
8. `LintError` — reserved for future ESLint-only families

### Error Families (20)

`missing_semicolon`, `missing_module`, `undefined_variable`, `null_reference`, `type_error`, `syntax_error`, `react_hook_violation`, `infinite_loop`, `build_failure`, `import_error`, `export_error`, `missing_dependency`, `api_fetch_failure`, `json_parse_error`, `array_out_of_bounds`, `promise_rejection`, `git_merge_conflict`, `port_in_use`, `env_var_missing`, `db_connection_failure`.

Each family ships with **10 witty responses in each of Marathi, Hindi and English** (600 total) — no response repeats until at least 5 others have been shown.

---

## Architecture

```
src/
 ├── extension.ts                  ← activation, diagnostics listener, commands
 ├── classifier/
 │    └── ErrorClassifier.ts       ← regex engine, pure TS (no vscode import)
 ├── providers/
 │    ├── HoverProvider.ts         ← MarkdownString hover UI
 │    └── SidebarProvider.ts       ← webview activity-bar panel
 ├── data/
 │    └── errors.json              ← 20 families × 30 responses + metadata
 ├── models/
 │    └── ErrorModel.ts            ← ErrorEntry, ErrorMatch, DiagnosticContext, etc.
 └── utils/
      └── ResponseSelector.ts      ← language-aware random picker
```

### Design Principles

1. **100% offline.** No HTTP calls, no telemetry, no AI APIs. The errors database is bundled into the .vsix.
2. **Classifier is pure TypeScript.** `ErrorClassifier` does not import `vscode`, so it is fully unit-testable in plain Node.
3. **Resilient to bad data.** A single malformed regex in `errors.json` is skipped with a console warning — the extension never crashes.
4. **Order-preserving matches.** The first matching entry wins. High-confidence families should be listed first.
5. **Personality rules enforced at content level.** Every response in `errors.json` has been written to be supportive, friendly, and culturally grounded — never toxic, insulting, or abusive.

---

## Installation

### From source (development)

```bash
git clone https://github.com/codebhau/code-bhau.git
cd code-bhau
npm install
npm run compile
```

Then press `F5` in VS Code to launch an Extension Development Host with Code Bhau active.

### Package as .vsix

```bash
npm install
npm run compile
npm run package     # produces code-bhau-2.0.0.vsix
```

Install locally:

```bash
code --install-extension code-bhau-2.0.0.vsix
```

---

## Configuration

Open VS Code Settings → Extensions → Code Bhau, or edit `settings.json`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `codeBhau.language` | `marathi` \| `hindi` \| `english` | `marathi` | Language Bhau uses for responses. |
| `codeBhau.enableHover` | boolean | `true` | Show hover explanations on red squiggles. |
| `codeBhau.enableSidebar` | boolean | `true` | Show the activity-bar sidebar panel. |
| `codeBhau.includeWarnings` | boolean | `false` | Also classify yellow warnings, not just red errors. |
| `codeBhau.maxHistoryPerError` | 0–10 | `5` | Anti-repetition window per error family. |
| `codeBhau.hoverMessageFormat` | `compact` \| `full` | `full` | Compactness of the hover card. |

---

## Commands

| Command | Keybinding | Description |
|---|---|---|
| `Code Bhau: Show Latest Error` | `Ctrl+Shift+B` / `Cmd+Shift+B` | Refresh the sidebar with the active editor's most severe error. |
| `Code Bhau: Demo With a Sample Error` | `Ctrl+Shift+Alt+B` | Pick a sample error from a quick-pick to demo Code Bhau. |
| `Code Bhau: Refresh Latest Error` | — | Same as Show Latest. |
| `Code Bhau: Switch Language` | — | Quick-pick to switch response language. |
| `Code Bhau: Copy First Suggested Fix` | — | Copy the first fix from the active file's most severe error to the clipboard. |

---

## Personality Rules

Code Bhau is always:

- ✅ **Supportive** — never makes the student feel dumb
- ✅ **Slightly funny** — uses Marathi-Hindi-English code-switching and Pune cultural references (chai, vada pav, local train, party)
- ✅ **Friendly mentor / older brother** — like a senior dev friend sitting next to you

Code Bhau is never:

- ❌ **Toxic, insulting, abusive, or swearing**
- ❌ **AI code generation** — it explains, never writes code for you
- ❌ **A Copilot replacement** — different purpose entirely

**Good examples:**
> "Bhau, semicolon suttivar gelay ka? ; tak na."
> "Variable cha nav ghetla pan introduce nahi kela."
> "Compiler la pan confusion zala."

**Forbidden examples:**
> ~~"Tu idiot ahes."~~
> ~~"This code is garbage."~~

Every one of the 600 responses in `errors.json` has been hand-written to respect these rules.

---

## Roadmap

### Phase 2 (this release)
- 20 error families, 600 responses, hover + sidebar, three languages.

### Phase 3 (planned)
- Expand to 100+ error families (targeting the 1,000-pattern goal from the Code Bhau Error Taxonomy research).
- Beginner Confusion Score-aware tone adaptation — high-confusion errors (CORS, Kubernetes CrashLoopBackOff, Postgres deadlocks) get longer, deeper explanations.
- User-supplied custom errors via `~/.codebhau/custom-errors.json`.
- Per-language response packs (Gujarati, Telugu, Tamil, Bengali).
- Telemetry-opt-in frequency tracking (anonymous, local-only) so the most-encountered errors rise to the top of the database.

---

## License

MIT © Code Bhau contributors. Made with chai in Pune, Maharashtra.

---

## Credits

- Error taxonomy research: Code Bhau Error Taxonomy whitepaper (11-category matrix, Beginner Confusion / Frequency / Fix Complexity scores).
- Market positioning: Code Bhau Market Analysis & Product Strategy.
- Personality inspiration: every senior dev in Pune who ever said *"Bhau, ek cup chai ghe, punha bagh."*
