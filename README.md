# Code Bhau <img src="media/logo.png" alt="Code Bhau logo" width="64" height="64" align="right" />

![Version](https://img.shields.io/visual-studio-marketplace/v/yashmagar.code-bhau?color=blue)
![Installs](https://img.shields.io/visual-studio-marketplace/i/yashmagar.code-bhau)
![Rating](https://img.shields.io/visual-studio-marketplace/r/yashmagar.code-bhau)
![License](https://img.shields.io/github/license/yashmagar01/code_bhau)

> **Bhau, party la bolavla pan guest aalach nahi.**
> A supportive senior dev bhau who explains your errors in Marathi, Hindi & English — 100% offline, no APIs, no AI code generation.

**Code Bhau** is a beginner-friendly programming companion for diploma students, engineering students, self-taught developers, hackathon participants, and anyone writing their first lines of code. It is **NOT** an AI coding assistant. It does **NOT** generate code. It does **NOT** replace Copilot. It exists for one job: turning a wall of red compiler text into something you actually understand — in your own language, with a joke that makes you laugh instead of a message that makes you want to quit.

---

## Why we built this

Most first-time programmers don't quit because coding is too hard. They quit because the *error messages* are written for people who already know what they mean. A first-year diploma student in Maharashtra staring at:

```
TS2307: Cannot find module 'axios' or its corresponding type declarations.
```

isn't confused because the concept is hard — they're confused because nobody translated it for them yet. So we built the translator.

Code Bhau intercepts that exact message and turns it into:

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

Same information a senior dev would give you — just delivered like a senior dev would actually say it to you, in your mother tongue, without making you feel dumb for asking.

---

## Who this is for

1. **First-time programmers** — literally anyone who just wrote their first `for` loop
2. **Diploma & engineering students** across Maharashtra and India, learning in a mix of English coursework and a Marathi/Hindi-speaking classroom reality
3. **Self-taught developers and hackathon participants** who need a fast, judgment-free explanation at 2 AM with no internet-search detour required

Built broadly for beginner programmers across India — with Marathi as the default voice, because that's who we built it for first.

---

## Features

| Feature | Status |
|---|---|
| **Error Detection** — captures TypeScript, JavaScript, React, Node, Python, Go, Java, JSON diagnostics via `vscode.languages.onDidChangeDiagnostics` | ✅ |
| **Error Classification Engine** — pure-TypeScript regex classifier, no `vscode` dependency, fully unit-testable | ✅ |
| **Local Error Database** — 20 error families, 600 hand-written responses (10 per language × 3 languages), bundled in `src/data/errors.json` | ✅ |
| **Language Modes** — Marathi (default), Hindi, English via `codeBhau.language` setting | ✅ |
| **Anti-Repetition Engine** — remembers your last several responses per error family so the same joke doesn't repeat back-to-back | ✅ |
| **Hover UI** — inline explanation the moment you hover a red squiggle | ✅ |
| **Sidebar Panel** — activity-bar webview with the full breakdown and one-click copy of the fix | ✅ |
| **Demo Command** — try Code Bhau on sample errors without writing broken code first | ✅ |

### Error Families (20)

`missing_semicolon`, `missing_module`, `undefined_variable`, `null_reference`, `type_error`, `syntax_error`, `react_hook_violation`, `infinite_loop`, `build_failure`, `import_error`, `export_error`, `missing_dependency`, `api_fetch_failure`, `json_parse_error`, `array_out_of_bounds`, `promise_rejection`, `git_merge_conflict`, `port_in_use`, `env_var_missing`, `db_connection_failure`.

---

## Installation

**From the Marketplace** (once published):

1. Open VS Code → Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search **"Code Bhau"**
3. Click Install

**From source:**

```bash
git clone https://github.com/yashmagar01/code_bhau.git
cd code_bhau
npm install
npm run compile
```

Press `F5` in VS Code to launch an Extension Development Host with Code Bhau active.

**As a `.vsix` file:**

```bash
npm run package     # produces code-bhau-1.0.0.vsix
code --install-extension code-bhau-1.0.0.vsix
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
| `Code Bhau: Demo With a Sample Error` | `Ctrl+Shift+Alt+B` | Pick a sample error to demo Code Bhau without writing broken code. |
| `Code Bhau: Refresh Latest Error` | — | Same as Show Latest. |
| `Code Bhau: Switch Language` | — | Quick-pick to switch response language. |
| `Code Bhau: Copy First Suggested Fix` | — | Copy the top fix from the active file's most severe error. |

---

## Personality Rules

Code Bhau is always:

- ✅ **Supportive** — never makes you feel dumb for not knowing
- ✅ **Witty, not corny** — Marathi-Hindi-English code-switching, Pune/Maharashtra cultural references (chai, vada pav, local train, party analogies)
- ✅ **A friendly senior, not a lecture** — the tone of the classmate who's one year ahead and actually explains things

Code Bhau is never:

- ❌ Toxic, insulting, or abusive
- ❌ Writing code for you — it explains, it doesn't generate
- ❌ A Copilot replacement — different job entirely

**In the spirit of what we mean:**
> "Bhau, semicolon suttivar gelay ka? ; tak na."
> "Variable cha nav ghetla pan introduce nahi kela."
> "Compiler la pan confusion zala."

Every one of the 600 responses is hand-written to stay inside these rules — no AI-generated jokes, so the voice stays consistent and consistently kind.

---

## Roadmap

**Now (v1.0.0):** 20 error families, 600 responses, hover + sidebar, three languages, offline-first.

**Next:**
- Expand error family coverage toward the most common real-world TypeScript/JavaScript/Python errors beginners actually hit
- More Indian language packs — Aryan is actively working on localized response sets beyond Marathi/Hindi/English
- Community-contributed error patterns via GitHub Issues/PRs (see below)

We're deliberately keeping this list short and honest — everything on it is something we're actually committing to, not a wishlist.

---

## Contributing

This is an early, actively-growing project, and we'd genuinely like help. If you've hit a confusing compiler error that Code Bhau didn't catch, or you speak a language we haven't covered yet and want to help write response packs, **open an issue or a PR** — this is exactly the kind of project that gets better with more contributors from the community it's built for.

👉 [github.com/yashmagar01/code_bhau](https://github.com/yashmagar01/code_bhau)

---

## License

MIT © 2026 Yash Magar. See [LICENSE](LICENSE).

---

## Credits

- **Yash Magar** — creator, extension architecture & error classification engine — [LinkedIn](https://www.linkedin.com/in/yash-magar/) · [GitHub](https://github.com/yashmagar01) · [magar.xyz](https://magar.xyz)
- **Aryan Pohakar** — co-founder & supporter, localized response packs across languages — [LinkedIn](https://www.linkedin.com/in/aryan-pohakar/) · [GitHub](https://github.com/AryanPohakar20)
- Made with chai in Maharashtra, for every beginner programmer who almost gave up on a Tuesday night because of a missing semicolon.

**Questions, bugs, or a joke idea that's too good not to include?** Open an issue on GitHub, or reach out at yashajaymagar10@gmail.com.
