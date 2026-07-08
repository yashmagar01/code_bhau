# Code Bhau Agent

> Beginner-friendly AI coding agent — BYOK cloud models + free local models.
> Forked from [`continuedev/continue`](https://github.com/continuedev/continue) under Apache-2.0.

**Status:** Phase 0 — fork-and-strip complete (Task 0.1). Not yet usable as a product.

---

## What this is

Code Bhau Agent is a VS Code extension that helps a beginner write code without
two specific fears:

1. **"I'll run out of credits."** → Plug in up to 10 of your own API keys
   (OpenRouter free tier, a NVIDIA NIM trial, a friend's key they let you use).
   Code Bhau fails over between *your* keys automatically, plus a fully
   offline local-model mode (Ollama / LM Studio) with zero cost.
2. **"I don't know which model to use for which task."** → A task classifier
   picks the right model tier automatically — small/fast for "explain this
   line", deep-reasoning for "refactor this module". You never have to choose.

Cloud mode is strictly **BYOK (Bring Your Own Key)**. Code Bhau never pools or
ships its own provider accounts — that would risk a ToS-triggered ban hitting
every user at once. See `ARCHITECTURE.md` §B.5 rule 2 for the hard constraint.

## Repo layout

```
code-bhau-agent/
├── ARCHITECTURE.md           # Full system spec (Part A: human, Part B: GLM-5.2 build spec)
├── IMPLEMENTATION_PLAN.md    # 8-phase, one-task-per-session build plan
├── AGENT.md                  # Engineering standards for any coding agent working in this repo
├── LICENSE                   # Apache-2.0 (preserved from upstream)
├── NOTICE                    # Attribution to Continue Dev, Inc per Apache-2.0 §4(d)
├── package.json              # npm workspaces root
├── core/                     # forked + trimmed from continuedev/continue
├── gui/                      # forked + trimmed from continuedev/continue
├── extensions/vscode/        # forked + trimmed from continuedev/continue (rebranded)
├── packages/
│   └── terminal-security/    # Code Bhau stub (see packages/terminal-security/README.md)
└── scripts/
    └── util/                 # Code Bhau stub (see scripts/util/README.md)
```

The `core/`, `gui/`, and `extensions/vscode/` directories are forked from
Continue and remain under their original Apache-2.0 license. The Code Bhau
flavor — task classifier, BYOK key manager, plan-then-build mode, reviewer
pass, walkthrough generator, Maharashtrian-tone UX layer — gets layered on
top in subsequent phases per `IMPLEMENTATION_PLAN.md`.

## Quick start (developer)

Requires Node.js ≥ 20.20.1.

```bash
npm install          # ~1 min, 2713 packages
npm run build        # stub + gui + vscode esbuild bundle, all clean
```

See `AGENT.md` for the full command list including single-workspace builds,
type-check, lint, test, and `.vsix` packaging.

## License

Apache-2.0. See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).

This product includes software developed at Continue Dev, Inc.
(https://github.com/continuedev/continue).
