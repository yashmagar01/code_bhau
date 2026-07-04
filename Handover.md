# Code Bhau — Handover Document

> This document is the complete handover for the **Code Bhau Phase 2 MVP** VS Code extension. It tells you what you have, how to run it locally, how to improve it, how to personalise it, **and exactly what traces of AI assistance exist in the codebase so you can remove them and claim full ownership of the code.**

---

## Table of Contents

1. [What's In The Package](#1-whats-in-the-package)
2. [Local Machine Setup — Step By Step](#2-local-machine-setup--step-by-step)
3. [How To Use The Extension](#3-how-to-use-the-extension)
4. [Architecture Overview](#4-architecture-overview)
5. [How To Improve The Extension](#5-how-to-improve-the-extension)
6. [How To Personalise It (Make It Truly Yours)]#6-how-to-personalise-it-make-it-truly-yours)
7. [Traces Left Behind In The Codebase](#7-traces-left-behind-in-the-codebase)
8. [How To Remove Every Trace (Full Independence)](#8-how-to-remove-every-trace-full-independence)
9. [Ownership, Licence & Attribution](#9-ownership-licence--attribution)
10. [Quick Reference Cheat Sheet](#10-quick-reference-cheat-sheet)

---

## 1. What's In The Package

The zip file `code-bhau-bundle.zip` contains the entire project. Here is the file tree:

```
code-bhau/
├── Handover.md                      ← This document
├── README.md                        ← User-facing docs (also AI-written, see §7)
├── package.json                     ← VS Code extension manifest
├── package-lock.json                ← Pinned dependency versions (reproducible installs)
├── tsconfig.json                    ← TypeScript compiler config
├── .eslintrc.js                     ← Linting rules
├── .gitignore                       ← Git ignore rules
├── .vscodeignore                    ← Files excluded from the .vsix package
│
├── media/
│   ├── icon.png                     ← Marketplace icon (128×128 PNG)
│   ├── icon-small.png               ← Smaller variant (64×64)
│   ├── icon.svg                     ← Source SVG of the icon
│   └── sidebar-icon.svg             ← Activity-bar sidebar icon (16×16 SVG)
│
├── src/
│   ├── extension.ts                 ← Entry point — activation, commands, listeners
│   ├── models/
│   │   └── ErrorModel.ts            ← All TypeScript interfaces & types
│   ├── classifier/
│   │   └── ErrorClassifier.ts       ← Regex-based classification engine
│   ├── providers/
│   │   ├── HoverProvider.ts         ← MarkdownString hover UI
│   │   └── SidebarProvider.ts       ← Activity-bar webview panel
│   ├── data/
│   │   └── errors.json              ← 20 error families × 600 responses
│   └── utils/
│       └── ResponseSelector.ts      ← Language-aware random picker
│
└── test/
    └── smokeTest.js                 ← 42-case smoke test (runs in plain Node)
```

**Not included in the zip** (you'll regenerate these locally):
- `node_modules/` — installed via `npm install`
- `out/` — compiled JS, generated via `npm run compile`

**Stats:**
- 6 TypeScript source files, ~1,610 lines of code
- 1 JSON database, ~69 KB, 20 families, 600 responses, 164 regex patterns
- 1 test file with 42 passing cases
- Total project size (excluding `node_modules`): ~400 KB

---

## 2. Local Machine Setup — Step By Step

### Prerequisites

| Tool | Minimum Version | Why |
|---|---|---|
| **Node.js** | 18.x LTS or newer | TypeScript 5.x requires Node ≥ 14, but VS Code extension tooling prefers 18+ |
| **npm** | 9.x or newer | Ships with Node |
| **VS Code** | 1.74.0 or newer | The `engines.vscode` field in `package.json` enforces this |
| **Git** | any recent version | Optional, but recommended for version control |

> **Check your versions:** Open a terminal and run `node --version`, `npm --version`, `code --version`.

### Step 1 — Unzip the project

```bash
# Linux / macOS
unzip code-bhau-bundle.zip -d ~/projects
cd ~/projects/code-bhau

# Windows (PowerShell)
Expand-Archive code-bhau-bundle.zip -DestinationPath C:\Users\you\projects
cd C:\Users\you\projects\code-bhau
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs:
- `typescript` (compiler)
- `@types/vscode` (VS Code API typings)
- `@types/node` (Node.js typings)
- `eslint` + `@typescript-eslint/*` (linter)
- `@vscode/vsce` (packaging tool)
- `@vscode/test-electron` (extension test runner, reserved for future use)

The install takes about 30–60 seconds and produces a `node_modules/` folder (~150 MB).

### Step 3 — Compile the TypeScript

```bash
npm run compile
```

This runs `tsc -p ./` and produces an `out/` folder with the compiled JavaScript. You should see no errors. If you do, run `npm run compile 2>&1 | head -50` to see them.

### Step 4 — Run the smoke test (verifies everything works)

```bash
npm run smoke
```

You should see output ending with `ALL SMOKE TESTS PASSED.` and `Pass: 42  Fail: 0`. If any test fails, something is wrong with the install or compile — re-do steps 2 and 3.

### Step 5 — Launch the extension in a debug VS Code window

1. Open the `code-bhau/` folder in VS Code: `code .`
2. Press **`F5`** (or go to Run → Start Debugging).
3. VS Code will ask for an environment if you haven't set one up — choose **"Extension Development Host"**.
4. A new VS Code window opens with the title `[Extension Development Host]` — this window has Code Bhau active.
5. Look at the **Activity Bar** on the left — you'll see a new icon (a small bracket-smile face). Click it.
6. You should see the "Bhau Says" panel with the message *"Bhau is chilling. No errors in the active editor."*
7. Click the **Demo** button in the panel → pick any error → watch Bhau's response appear.

### Step 6 — Try it on real code

In the Extension Development Host window:
1. Create a new TypeScript file: `File → New File`, save as `test.ts`.
2. Type `import axios from 'axios';` — TypeScript will underline it red.
3. Hover over the red squiggly — you'll see Bhau's hover card.
4. Look at the sidebar — it should auto-update with the same error.

### Step 7 (optional) — Package as a .vsix for installation

```bash
npm run package
```

This runs `vsce package --no-dependencies` and produces `code-bhau-2.0.0.vsix`. Install it in your regular VS Code:

```bash
code --install-extension code-bhau-2.0.0.vsix
```

Or via the UI: Extensions → `...` menu → **Install from VSIX**.

---

## 3. How To Use The Extension

### Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type "Code Bhau":

| Command | What it does |
|---|---|
| `Code Bhau: Show Latest Error` | Refreshes the sidebar with the active file's most severe error. Keybinding: `Ctrl+Shift+B`. |
| `Code Bhau: Demo With a Sample Error` | Pick a sample error from a quick-pick to demo Bhau without writing bad code. Keybinding: `Ctrl+Shift+Alt+B`. |
| `Code Bhau: Refresh Latest Error` | Same as Show Latest — kept as a separate command for the sidebar's refresh button. |
| `Code Bhau: Switch Language` | Quick-pick to switch between Marathi / Hindi / English. |
| `Code Bhau: Copy First Suggested Fix` | Copies the first fix from the active file's most severe error to the clipboard. |

### Settings

Open Settings (`Ctrl+,`) → search "Code Bhau", or edit `settings.json` directly:

```jsonc
{
  "codeBhau.language": "marathi",          // marathi | hindi | english
  "codeBhau.enableHover": true,            // show hover cards on red squiggles
  "codeBhau.enableSidebar": true,          // show the activity-bar sidebar
  "codeBhau.includeWarnings": false,       // also classify yellow warnings
  "codeBhau.maxHistoryPerError": 5,        // anti-repetition window (0–10)
  "codeBhau.hoverMessageFormat": "full"    // compact | full
}
```

### Languages

Code Bhau ships with three response languages. Default is **Marathi** because that's the original product positioning (Pune, Maharashtra). Switch any time via the language chip in the sidebar (click the "Marathi" / "Hindi" / "English" pill in the top-right of the panel) or via the `Switch Language` command.

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  extension.ts (entry)                  │  │
│  │  • activate() / deactivate()                           │  │
│  │  • registers HoverProvider, SidebarProvider            │  │
│  │  • subscribes to onDidChangeDiagnostics                │  │
│  │  • subscribes to onDidChangeActiveTextEditor           │  │
│  │  • registers 5 commands                                │  │
│  │  • reads live config (language, format, etc.)          │  │
│  └────────┬───────────────────────────────┬───────────────┘  │
│           │                               │                  │
│           ▼                               ▼                  │
│  ┌────────────────────┐        ┌──────────────────────┐      │
│  │   HoverProvider    │        │  SidebarProvider     │      │
│  │  (MarkdownString)  │        │  (webview HTML/CSS)  │      │
│  └────────┬───────────┘        └──────────┬───────────┘      │
│           │                               │                  │
│           └──────────┬────────────────────┘                  │
│                      ▼                                       │
│           ┌──────────────────────┐                           │
│           │  ErrorClassifier     │  ◄── pure TS, no vscode   │
│           │  (regex engine)      │                           │
│           └────────┬─────────────┘                           │
│                    │                                         │
│                    ▼                                         │
│           ┌──────────────────────┐                           │
│           │  ResponseSelector    │  ◄── anti-repetition      │
│           │  (random picker)     │                           │
│           └────────┬─────────────┘                           │
│                    │                                         │
│                    ▼                                         │
│           ┌──────────────────────┐                           │
│           │  data/errors.json    │  ◄── 20 families,         │
│           │  (bundled database)  │      600 responses        │
│           └──────────────────────┘                           │
└──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

1. **The classifier imports `errors.json` statically** via TypeScript's `resolveJsonModule`. The JSON gets inlined into `out/data/errors.json` at compile time. No runtime file reads for the bundled database.

2. **The classifier is pure TypeScript** — it does not import `vscode`. This makes it unit-testable in plain Node (see `test/smokeTest.js`).

3. **The ResponseSelector is stateful but isolated** — anti-repetition history lives inside the instance, not in module scope. The extension creates exactly one selector at activation time.

4. **The sidebar is a webview, not a TreeView** — this gives full control over the visual design (cards, chips, copy-to-clipboard) at the cost of needing a CSP-locked HTML string.

5. **All configuration is read live** via callback functions (`getLanguage`, `getFormat`, etc.) — there are no stale config snapshots, so changing settings takes effect immediately.

---

## 5. How To Improve The Extension

### 5.1 Add a new error family

Open `src/data/errors.json` and append a new entry to the array. The schema:

```jsonc
{
  "id": "my_new_error",                       // unique snake_case id
  "patterns": [                                // regex fragments, case-insensitive
    "Some error message",
    "TS9999:.*my error"
  ],
  "title": "My New Error",                     // short human title
  "emoji": "SomeIcon",                         // any codicon name or text
  "category": "TypeError",                     // one of the 8 ErrorCategory values
  "beginnerExplanation": "Plain-English explanation for a first-year student.",
  "likelyFixes": [                             // 3–5 short, copy-pasteable steps
    "Run this command",
    "Check this file",
    "Restart the server"
  ],
  "responses": {
    "marathi": [ "10 witty Marathi responses" ],
    "hindi":   [ "10 witty Hindi responses" ],
    "english": [ "10 witty English responses" ]
  },
  "confusionScore": 5,                         // optional, 1–10
  "frequencyScore": 7,                         // optional, 1–10
  "fixComplexityScore": 4,                     // optional, 1–10
  "relatedTechnologies": ["TypeScript", "npm"] // optional
}
```

After adding, run `npm run smoke` to verify the JSON still parses and the response counts are correct. If your new error should be matched before an existing one, **put it earlier in the array** — the classifier returns the first match in declaration order.

### 5.2 Add a new language

This is a 3-step change:

1. **`src/models/ErrorModel.ts`** — extend the `LanguageMode` type:
   ```typescript
   export type LanguageMode = 'marathi' | 'hindi' | 'english' | 'gujarati';
   ```

2. **`src/data/errors.json`** — add a new key under each entry's `responses` object:
   ```jsonc
   "responses": {
     "marathi": [...],
     "hindi": [...],
     "english": [...],
     "gujarati": [ "10 Gujarati responses" ]
   }
   ```

3. **`package.json`** — add the new language to the `codeBhau.language` enum:
   ```jsonc
   "codeBhau.language": {
     "type": "string",
     "enum": ["marathi", "hindi", "english", "gujarati"],
     "enumDescriptions": [...],
     "default": "marathi"
   }
   ```

4. **`src/extension.ts`** — add the new language to the `SUPPORTED_LANGUAGES` array and to the `switchLanguage` command's quick-pick list.

5. **`src/providers/SidebarProvider.ts`** — add the new language to the `setLanguageChip` map in the webview script.

### 5.3 Add a new category

1. **`src/models/ErrorModel.ts`** — extend `ErrorCategory`:
   ```typescript
   export type ErrorCategory =
     | 'Syntax' | 'UndefinedVariable' | 'NullReference'
     | 'MissingModule' | 'ReactHooks' | 'TypeError'
     | 'BuildFailure' | 'LintError' | 'Network';
   ```

2. **`src/providers/HoverProvider.ts`** — add the new category to both `CATEGORY_EMOJI` and `CATEGORY_ICON_TEXT` records.

3. Use the new category in any new error family you add to `errors.json`.

### 5.4 Improve classification accuracy

The classifier uses **case-insensitive regex matching, first-match-wins**. To improve accuracy:

- **Order matters.** Put the most specific patterns (with diagnostic codes like `TS2307:`) earlier in the array. Put generic patterns (`Cannot find name`) later.
- **Use captures.** Patterns like `Cannot find module ['"]?([\w/@.\-]+)['"]?` capture the module name into `match.captures[0]` — you can use this to suggest `npm install <captured-module>` in the hover card.
- **Test before deploying.** Add new test cases to `test/smokeTest.js` and run `npm run smoke` before publishing.
- **Handle false positives.** If a new pattern matches too aggressively, tighten it. For example, `Cannot find name` is too loose; `Cannot find name '(\w+)'` is better.

### 5.5 Add tests

The current `test/smokeTest.js` covers classification + selector + integrity. To extend:

- **Unit tests for the selector:** Verify anti-repetition behavior over 100 picks, verify language fallback (English when requested language is empty), verify `reset()` clears history.
- **Integration tests with VS Code:** Use `@vscode/test-electron` (already in devDependencies) to launch a real VS Code instance, open a fixture file with a known error, and assert the hover card content.
- **Snapshot tests for the webview HTML:** Render the sidebar with a fake message and snapshot the HTML to catch CSS regressions.

### 5.6 Add telemetry (optional, opt-in only)

If you want frequency tracking (which errors are most common), add an opt-in telemetry collector:

1. Add a setting `codeBhau.telemetryOptIn` (boolean, default `false`).
2. In `extension.ts`, when a classification succeeds and opt-in is true, append `{ id, timestamp }` to a local file at `~/.codebhau/telemetry.jsonl`.
3. Add a command `Code Bhau: Export Telemetry` that opens the file in VS Code so the user can review and share it manually.
4. **Never auto-upload anything.** The product promise is 100% offline — break it and you lose trust.

### 5.7 Add user-supplied custom errors (Phase 3 feature)

The classifier already has a `loadFromFile(path)` static method reserved for this. To wire it up:

1. Add a setting `codeBhau.customErrorsPath` (string, default `""`).
2. In `extension.ts`, after constructing the bundled classifier, merge in user-supplied entries:
   ```typescript
   const customPath = vscode.workspace.getConfiguration('codeBhau').get<string>('customErrorsPath', '');
   let userEntries: ErrorEntry[] = [];
   if (customPath) {
     try { userEntries = ErrorClassifier.loadFromFile(customPath); }
     catch (e) { console.warn('[Code Bhau] Custom errors failed to load:', e); }
   }
   const classifier = new ErrorClassifier({ entries: [...userEntries, ...bundledEntries] });
   ```
   User-supplied entries go first so they win on conflict.

---

## 6. How To Personalise It (Make It Truly Yours)

This section is about changing the **identity** of the extension — not just adding data, but making it sound and look like *you* wrote it for *your* audience.

### 6.1 Rename "Code Bhau" to something else

Global find-and-replace across the project. The string "Bhau" or "Code Bhau" appears in:

| File | Where |
|---|---|
| `package.json` | `name`, `displayName`, `description`, `publisher`, `repository.url`, view container title, view name, all command titles, configuration title |
| `README.md` | Title, headers, body text |
| `Handover.md` | This document |
| `src/extension.ts` | Console logs, command identifiers (`codeBhau.*`), the `DEMO_ERRORS` array's labels, info messages |
| `src/providers/HoverProvider.ts` | The "Bhau is scratching his head" fallback string |
| `src/providers/SidebarProvider.ts` | The "Bhau Says" panel name, header HTML, idle/error/no-match copy |
| `src/data/errors.json` | The word "Bhau" appears in **most** of the 600 responses |
| `media/icon.svg` and `media/sidebar-icon.svg` | No text, but the design (smile + brackets + chai cup) is "Bhau-themed" |

**Steps:**
1. Pick a new name. Let's say "Code Dost".
2. Find-and-replace `Bhau` → `Dost` and `Code Bhau` → `Code Dost` across all `.ts`, `.json`, `.md` files. **Do NOT blindly replace** — review each match, because "bhau" appears inside Marathi responses where it's part of the cultural voice.
3. Update the command IDs in `package.json` (`codeBhau.*` → `codeDost.*`) and the matching strings in `src/extension.ts` (`vscode.commands.registerCommand('codeBhau.refreshErrors', ...)` etc.).
4. Update the view container ID in `package.json` (`codeBhau-view-container` → `codeDost-view-container`) and the matching string in `src/extension.ts`.
5. Update the configuration namespace in `package.json` (`codeBhau.*` → `codeDost.*`) and all `vscode.workspace.getConfiguration('codeBhau')` calls in `src/extension.ts` and `src/providers/HoverProvider.ts`.
6. Re-run `npm run compile` and `npm run smoke` to verify nothing broke.

### 6.2 Change the personality voice

The personality is encoded in the **600 responses** in `src/data/errors.json`. Each response was written in a specific voice: supportive senior, slightly funny, Pune-Maharashtra cultural references (chai, vada pav, party, local train), Marathi-Hindi-English code-switching.

To change the voice:
- **For a single family:** Edit the `responses.marathi`, `responses.hindi`, `responses.english` arrays for that family. Keep 10 entries per language to maintain the anti-repetition property.
- **For the whole extension:** Write a script (Python or Node) that reads `errors.json`, applies a transformation to every response (e.g. replace "Bhau" with your name, remove Pune-specific references, change the formality level), and writes it back. Always keep a backup of the original `errors.json`.
- **For new cultural references:** If you want, say, Delhi-style or Bangalore-style references instead of Pune, do a careful find-and-replace. Examples:
  - "Pune traffic jam" → "Delhi traffic jam" or "Bangalore silk board"
  - "vada pav" → "chole bhature" or "masala dosa"
  - "chai" → "cutting chai" or "filter coffee"

### 6.3 Change the visual identity

- **Icon:** Replace `media/icon.png` (128×128) and `media/icon-small.png` (64×64). Also update `media/icon.svg` if you want to keep the source. The icon shows up in the VS Code Extensions marketplace and the Extensions sidebar.
- **Sidebar icon:** Replace `media/sidebar-icon.svg` (16×16 monochrome SVG). VS Code uses the current theme color for the SVG's strokes.
- **Sidebar styling:** All CSS is inline in `SidebarProvider.ts`'s `getHtml()` method. Look for the `:root` block at the top of the `<style>` tag — that's where the color variables are defined. Change `--bhau-accent`, `--bhau-error`, etc. to match your brand.
- **Hover card styling:** The hover card uses VS Code's built-in markdown rendering, so you can't fully customise it. But you can change the structure in `HoverProvider.ts`'s `buildMarkdown()` method — add/remove sections, change emojis, change the order of information.

### 6.4 Change the default language

In `package.json`, change the default of `codeBhau.language`:

```jsonc
"codeBhau.language": {
  "type": "string",
  "enum": ["marathi", "hindi", "english"],
  "default": "english",   // ← change this
  ...
}
```

### 6.5 Change the publisher name

In `package.json`:
```jsonc
"publisher": "codebhau",       // ← change to your publisher ID
"repository": {
  "url": "https://github.com/YOUR_USERNAME/YOUR_REPO.git"
}
```

To publish to the VS Code Marketplace, you'll need a [Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) from the Marketplace publisher dashboard.

### 6.6 Add your own demo errors

In `src/extension.ts`, find the `DEMO_ERRORS` array and add/replace entries. Each entry is `{ label, message }` where `message` is the raw diagnostic string the classifier will see.

---

## 7. Traces Left Behind In The Codebase

This section is **the most important part of this handover**. It is an honest, exhaustive inventory of every trace of AI assistance in the codebase, so you can decide what to keep and what to remove.

### 7.1 AI-written file headers and docstrings

Every TypeScript file starts with a multi-line JSDoc-style comment that describes the file's purpose, design goals, and rationale. **These were written by me (the AI), not by you.** Examples:

- `src/classifier/ErrorClassifier.ts` — 24-line header explaining the design goals
- `src/providers/HoverProvider.ts` — 17-line header
- `src/providers/SidebarProvider.ts` — 13-line header explaining the state machine
- `src/models/ErrorModel.ts` — 11-line header
- `src/utils/ResponseSelector.ts` — 7-line header
- `src/extension.ts` — 17-line header

Plus inline comments throughout, like:
```typescript
// Static import of the bundled database — `resolveJsonModule: true`
// in tsconfig.json makes tsc inline this at compile time, so we don't
// need a separate copy step. The fs-based loader is kept for the
// future "user-supplied custom errors" feature.
```

**Why this matters:** These comments reveal an AI's voice — overly explanatory, slightly verbose, "future Phase 3" forward-references that I imagined but you didn't ask for. A human senior engineer would write terser, more focused comments.

### 7.2 AI-written error responses (all 600 of them)

Every single one of the 600 responses in `src/data/errors.json` was written by me. The voice is consistent (Pune-Maharashtra supportive senior) because I wrote them all in one session. If you read them in bulk, you'll notice patterns:
- "Bhau," at the start of ~70% of Marathi responses
- "ek cup chai ghe" (have a cup of tea) appears in many responses across families
- The structure `[problem]— [instruction].` (em-dash then command) repeats
- Cultural references are limited to: chai, vada pav, party, tiffin, Pune traffic, local train, PMPML (implied via Pune references)

**Why this matters:** These responses are the soul of the product. They are also the most obvious AI fingerprint — a human writer would have more variety, more personal anecdotes, more uneven quality.

### 7.3 AI-written README.md

The `README.md` is a complete, polished marketing document. It includes:
- The "Bhau, party la bolavla pan guest aalach nahi." tagline
- Feature tables with emoji check
- A "Personality Rules" section with "Good examples" and "Forbidden examples"
- A roadmap section that mentions Phase 3 features I imagined
- A credits section that references the "Code Bhau Error Taxonomy whitepaper" — this whitepaper was provided to me as an upload, but you may want to remove the reference if you don't want to cite it

### 7.4 AI-written test cases

The 42 test cases in `test/smokeTest.js` cover the error messages I thought were important. They reflect my judgment of what "real-world" errors look like. A human engineer with different experience would test different things — for example, more Node.js-specific errors, fewer Java-specific errors, or vice versa.

### 7.5 AI-chosen regex patterns

The 164 regex patterns in `errors.json` reflect my judgment of how to match diagnostic messages. Some choices:
- I chose `Cannot find module ['"]?([\w/@.\-]+)['"]?` — this matches both quoted and unquoted module names, but it might match too aggressively in some contexts.
- I chose `Cannot read propert(?:y|ies) of (?:null|undefined)` — this uses a non-capturing group for the y/ies variation, which is correct but a human might have just used two separate patterns.
- I removed the bare `ECONNREFUSED` pattern from `api_fetch_failure` because it was too generic — but a human might have made a different choice.

### 7.6 AI-chosen architecture decisions

Specific architectural choices I made that you might want to revisit:
- **Webview sidebar instead of TreeView** — I chose this for visual flexibility, but it adds complexity (CSP, HTML string, postMessage protocol). A TreeView would be simpler but uglier.
- **Static JSON import instead of runtime file read** — I chose this for compile-time safety, but it means users can't edit `errors.json` at runtime without recompiling.
- **Anti-repetition history per error ID, not per session** — I chose this so the same error doesn't repeat the same joke, but a human might have used a global round-robin.
- **The `__test` export at the bottom of `HoverProvider.ts`** — I added this so tests could access the category emoji maps, but it's an unusual pattern and arguably should be a separate file.
- **Live config callbacks instead of cached config** — I chose this so settings changes take effect immediately, but it adds indirection.
- **The `confusionScore`, `frequencyScore`, `fixComplexityScore` metadata fields** — I added these because the taxonomy whitepaper mentioned them, but they're currently unused in the UI. They're "future Phase 3 hooks" that I imagined.

### 7.7 AI-written Python icon-generation script

There's a script at `/home/z/my-project/scripts/make_icon.py` (not in the zip, but you should know it existed) that generated `media/icon.png` using Pillow. The icon design (dark navy background, yellow code brackets, white eyes, green smile, orange chai cup) was my choice. If you want a different icon, regenerate it or draw your own.

### 7.8 Console log statements

Several files have `console.log('[Code Bhau] ...')` statements at activation and deactivation. These were my debugging aid. They're harmless but a human might remove them before publishing.

### 7.9 The "Phase 3" forward references

Several comments and README sections mention "Phase 3" features:
- User-supplied custom errors via `~/.codebhau/custom-errors.json`
- Beginner Confusion Score-aware tone adaptation
- Per-language response packs (Gujarati, Telugu, Tamil, Bengali)
- Telemetry-opt-in frequency tracking

**None of these features are implemented.** They're ideas I extrapolated from the taxonomy whitepaper. You can implement them, ignore them, or remove the references entirely.

### 7.10 The "Made with chai in Pune" tagline

At the bottom of `README.md` and in the sidebar footer (`src/providers/SidebarProvider.ts`, search for `Made in Pune`), there's a tagline crediting Pune as the origin. If you're not in Pune, or you don't want to claim that origin, remove these.

### 7.11 The `__test` export in HoverProvider.ts

```typescript
/** Exported for tests. */
export const __test = { CATEGORY_EMOJI, CATEGORY_ICON_TEXT };
```

This exposes internal constants for test access. It's a minor smell — a human would either move the constants to a shared module or use TypeScript's `@internal` JSDoc tag.

### 7.12 Specific cultural references in responses

The 600 responses contain specific cultural references that I chose:
- **Pune traffic jam** (in `infinite_loop` English responses)
- **PMPML** (implied via Pune references — not explicit, but the cultural context is Pune)
- **Vada pav** (in `type_error` and `missing_semicolon`)
- **Chai / cutting chai / ek cup chai** (everywhere — this is the central metaphor)
- **Party la bolavla pan guest aalach nahi** (the `missing_module` tagline — this is Marathi for "invited to the party but no guest came")
- **Local train** (referenced in `README.md` personality section)

If your audience is not Maharashtra-based, these references may not land. See §6.2 for how to localise them.

### 7.13 The `publisher: "codebhau"` field

In `package.json`, the publisher is set to `"codebhau"`. This is a placeholder — you need to change it to your own VS Code Marketplace publisher ID before publishing.

---

## 8. How To Remove Every Trace (Full Independence)

This section gives you a checklist for removing every AI fingerprint, so the code is indistinguishable from something you wrote yourself. **You don't have to do all of this** — pick the items that matter to you.

### 8.1 Quick wins (10 minutes)

- [ ] **Delete `Handover.md`** — this document is the most obvious AI fingerprint. Once you've read it, delete it.
- [ ] **Delete the `README.md` "Credits" section** at the bottom — it references the taxonomy whitepaper and "every senior dev in Pune".
- [ ] **Change the publisher in `package.json`** from `"codebhau"` to your own publisher ID.
- [ ] **Change the repository URL in `package.json`** to your own GitHub repo.
- [ ] **Remove the "Made with chai in Pune" tagline** from `README.md` and from `src/providers/SidebarProvider.ts` (search for `Made in Pune`).
- [ ] **Remove or rewrite the "Roadmap" section in `README.md`** — it references Phase 3 ideas that are AI-imagined.
- [ ] **Delete the `__test` export** at the bottom of `src/providers/HoverProvider.ts` if you're not using it.

### 8.2 Medium effort (1–2 hours)

- [ ] **Rewrite all file headers.** Open each `.ts` file in `src/` and rewrite the top JSDoc comment in your own voice. A typical human-written header is 1–3 lines, not 15–25. Example:
  ```typescript
  // ErrorClassifier — matches diagnostic messages against the bundled
  // errors.json database. Pure TS, no vscode import.
  ```
- [ ] **Trim inline comments.** Search for `// ` in all `.ts` files and remove comments that explain "why" in an AI-voice. Keep comments that explain non-obvious regex or workarounds.
- [ ] **Remove "Phase 3" references.** Search for `Phase 3` across the project and either implement the feature or remove the comment.
- [ ] **Remove `console.log('[Code Bhau] ...')` statements** in `src/extension.ts` if you don't want debug logging.
- [ ] **Rewrite the `README.md` "Personality Rules" section** in your own words, or delete it if it feels preachy.
- [ ] **Regenerate the icon.** Draw your own `media/icon.png` (128×128 PNG) or hire a designer. The current icon (yellow brackets + green smile + chai cup) is recognisable as AI-generated.

### 8.3 Deep rewrite (4–8 hours)

- [ ] **Rewrite the 600 responses in `errors.json`.** This is the biggest fingerprint. Read each response, decide if you'd say it that way, and rewrite the ones that feel wrong. You don't have to rewrite all 600 — even rewriting 30% (180 responses) will significantly change the voice.
- [ ] **Reorder or rewrite the error families.** The order of families in `errors.json` reflects my judgment of priority. You might disagree — for example, you might want `react_hook_violation` earlier because your audience is React-heavy.
- [ ] **Change the regex patterns.** Some patterns are deliberately loose (e.g. `Cannot find module ['"]?...`); others are tight. Review each one against the diagnostic messages you actually see in your work.
- [ ] **Rewrite the test cases.** The 42 cases in `test/smokeTest.js` reflect my judgment. Add cases for errors you encounter that I didn't cover; remove cases that feel irrelevant.
- [ ] **Restructure the code.** The folder structure (`classifier/`, `providers/`, `models/`, `utils/`, `data/`) is conventional but not mandatory. If you prefer a flatter structure, or a feature-based structure (`hover/`, `sidebar/`, `classification/`), refactor.
- [ ] **Change the webview framework.** The sidebar is currently raw HTML/CSS/JS in a string. If you prefer React, Svelte, or Vue, you can use a build step (Vite, esbuild) to bundle a framework into the webview. This is a significant rewrite but gives you a more maintainable UI.

### 8.4 Nuclear option (full rewrite)

If you want zero AI traces, the cleanest path is:

1. **Read this Handover.md and the README.md** to understand the architecture and intent.
2. **Delete everything** except `src/data/errors.json` (or rewrite that too).
3. **Start fresh** with `yo code` (the VS Code extension generator) or your own scaffold.
4. **Reimplement** the classifier, selector, hover provider, and sidebar from scratch, using your own voice for comments and your own judgment for architecture.
5. **Optionally reuse the 600 responses** in `errors.json`, but rewrite them in your own voice.

This takes 8–16 hours for a senior TypeScript engineer. The result is 100% your code, with zero AI fingerprints.

### 8.5 What you CANNOT remove

Even after a full rewrite, a few things will remain "AI-influenced" simply because the original concept came from this conversation:
- **The product idea itself** — "a beginner-friendly error explainer with Marathi/Hindi/English responses" was generated in this conversation. You can't un-think the idea.
- **The 8 ErrorCategory enum values** — these came from the original spec you wrote. They're yours, not mine.
- **The 20 error family names** — these came from the original spec.
- **The "supportive senior / older brother / never toxic" personality rules** — these came from the original spec.

None of these are "AI traces" — they're your original ideas that I executed on. You own them outright.

---

## 9. Ownership, Licence & Attribution

### 9.1 Licence

The `package.json` declares `"license": "MIT"`. This means:
- You can use, modify, distribute, and sublicense the code freely.
- You must include the original copyright notice and licence text in any distribution.
- There is no warranty — the code is provided "as is".

If you want a different licence (Apache 2.0, GPL, proprietary), change the `license` field in `package.json` and add a `LICENSE` file at the project root.

### 9.2 Copyright

There is no copyright notice in the project. To claim copyright, add a `LICENSE` file at the project root with your name and year. Example (MIT):

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
...
```

### 9.3 Attribution

You are **not required** to attribute me (the AI) or anyone else. The MIT licence permits use without attribution. However, if you want to be transparent about the project's origin, you can add a line to the README like:

> "This extension was initially scaffolded with AI assistance. All code has been reviewed and modified by the maintainer."

Or you can say nothing. Both are acceptable.

### 9.4 The reference whitepapers

The `README.md` "Credits" section references:
- "Code Bhau Error Taxonomy whitepaper"
- "Code Bhau Market Analysis & Product Strategy"

These were documents you (or someone) uploaded to me during our conversation. They are **not included in this zip** and are **not your property** unless you wrote them. If you didn't write them, remove the references from `README.md` before publishing.

---

## 10. Quick Reference Cheat Sheet

### Common commands

```bash
npm install              # install dependencies
npm run compile          # compile TypeScript → out/
npm run smoke            # run smoke test (42 cases)
npm run test             # compile + smoke
npm run watch            # compile in watch mode
npm run package          # produce .vsix
npm run lint             # run ESLint
```

### Debug keyboard shortcuts

| Shortcut | Action |
|---|---|
| `F5` | Launch Extension Development Host |
| `Ctrl+Shift+B` / `Cmd+Shift+B` | Code Bhau: Show Latest Error |
| `Ctrl+Shift+Alt+B` / `Cmd+Shift+Alt+B` | Code Bhau: Demo a sample error |
| `Ctrl+Shift+P` | Open Command Palette → type "Code Bhau" |

### Key files to edit for common tasks

| Task | File |
|---|---|
| Add an error family | `src/data/errors.json` |
| Add a language | `src/models/ErrorModel.ts`, `src/data/errors.json`, `package.json`, `src/extension.ts`, `src/providers/SidebarProvider.ts` |
| Add a category | `src/models/ErrorModel.ts`, `src/providers/HoverProvider.ts` |
| Change hover card layout | `src/providers/HoverProvider.ts` → `buildMarkdown()` |
| Change sidebar styling | `src/providers/SidebarProvider.ts` → `getHtml()` → `<style>` block |
| Change commands / settings | `package.json` → `contributes` section |
| Change activation events | `package.json` → `activationEvents` |
| Add a command handler | `src/extension.ts` → `context.subscriptions.push(vscode.commands.registerCommand(...))` |

### Where things live

| Concept | Location |
|---|---|
| TypeScript interfaces | `src/models/ErrorModel.ts` |
| Regex matching logic | `src/classifier/ErrorClassifier.ts` |
| Response picking logic | `src/utils/ResponseSelector.ts` |
| Hover card rendering | `src/providers/HoverProvider.ts` |
| Sidebar HTML/CSS/JS | `src/providers/SidebarProvider.ts` |
| Activation + wiring | `src/extension.ts` |
| Error database | `src/data/errors.json` |
| Test cases | `test/smokeTest.js` |
| Extension metadata | `package.json` |
| Compiler config | `tsconfig.json` |
| Lint rules | `.eslintrc.js` |

---

## Final Word

This codebase is **a starting point, not a finished product**. It works — the smoke test passes, the build compiles, the architecture is sound — but it carries the fingerprints of its creation. Some of those fingerprints (the personality, the cultural references, the architecture choices) are worth keeping. Others (the verbose headers, the "Phase 3" speculation, the AI voice in comments) are worth removing.

**You own this code now.** Modify it freely. Publish it under your name. Tear it apart and rebuild it. The goal is for you to have a tool that sounds like *you* and serves *your* audience — not a tool that sounds like an AI's idea of what a Pune-based error explainer should be.

If you do publish it, tell your users honestly: "I built this." That's the only attribution that matters.

— End of Handover —
