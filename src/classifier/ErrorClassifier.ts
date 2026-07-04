/**
 * Code Bhau — Error Classifier
 * -----------------------------
 * The classifier is the brain of Code Bhau. It takes a raw diagnostic
 * message (e.g. "Cannot find module 'axios'") and returns the matching
 * {@link ErrorEntry} from the local database, plus the regex pattern that
 * matched and any capture groups.
 *
 * Design goals:
 *   1. Pure TypeScript, no `vscode` import — so the classifier is fully
 *      unit-testable in plain Node.
 *   2. Case-insensitive regex matching. Patterns in errors.json are
 *      written case-insensitively on purpose (e.g. `Cannot find module`
 *      matches `cannot find module`).
 *   3. Resilient to bad patterns — a single malformed regex in the JSON
 *      must never crash the extension. Bad patterns are skipped with a
 *      console warning.
 *   4. Order-preserving — the first entry whose pattern matches wins.
 *      This means high-confidence families should be listed first in
 *      errors.json.
 *   5. Source/code aware — TypeScript diagnostic codes (`TS2307`) and
 *      ESLint rule names (`no-undef`) are tried as a second pass when
 *      the message-body regex pass returns nothing.
 */

import * as fs from 'fs';
import {
  DiagnosticContext,
  ErrorCategory,
  ErrorEntry,
  ErrorMatch,
} from '../models/ErrorModel';

// Static import of the bundled database — `resolveJsonModule: true`
// in tsconfig.json makes tsc inline this at compile time, so we don't
// need a separate copy step. The fs-based loader is kept for the
// future "user-supplied custom errors" feature.
import bundledErrors from '../data/errors.json';

/** One compiled pattern + the entry it belongs to. */
interface CompiledPattern {
  entry: ErrorEntry;
  pattern: string;
  regex: RegExp;
}

export interface ErrorClassifierOptions {
  /**
   * Override the bundled `errors.json`. Useful for tests and for the
   * upcoming "custom errors" feature. When omitted, the classifier
   * loads `../data/errors.json` lazily.
   */
  entries?: ErrorEntry[];
}

export class ErrorClassifier {
  /** All loaded entries, in declaration order. */
  public readonly entries: ErrorEntry[];

  /** Pre-compiled patterns flattened across all entries, in order. */
  private readonly compiled: CompiledPattern[];

  /** Quick lookup by entry id. */
  private readonly byId: Map<string, ErrorEntry>;

  constructor(opts: ErrorClassifierOptions = {}) {
    this.entries = opts.entries ?? ErrorClassifier.loadBundled();
    this.compiled = [];
    this.byId = new Map();

    for (const entry of this.entries) {
      if (this.byId.has(entry.id)) {
        // Skip duplicates — log so extension authors notice during dev.
        console.warn(
          `[Code Bhau] Duplicate error id "${entry.id}" — ignoring later definition.`
        );
        continue;
      }
      this.byId.set(entry.id, entry);

      for (const pattern of entry.patterns) {
        try {
          // All patterns are case-insensitive by design.
          const regex = new RegExp(pattern, 'i');
          this.compiled.push({ entry, pattern, regex });
        } catch (err) {
          console.warn(
            `[Code Bhau] Invalid regex in entry "${entry.id}" pattern "${pattern}": ${
              (err as Error).message
            }`
          );
        }
      }
    }
  }

  /**
   * Classify a raw diagnostic message.
   *
   * Returns the first matching entry (in declaration order), or `null`
   * if nothing matches. The matched pattern and any capture groups are
   * included in the result so providers can show context like the
   * offending module name.
   */
  classify(message: string): ErrorMatch | null {
    if (!message || !message.trim()) return null;

    for (const cp of this.compiled) {
      const m = cp.regex.exec(message);
      if (m) {
        return {
          entry: cp.entry,
          matchedPattern: cp.pattern,
          captures: m.slice(1).filter((x): x is string => typeof x === 'string'),
          originalMessage: message,
        };
      }
    }
    return null;
  }

  /**
   * Classify a structured diagnostic. Useful when the caller has access
   * to the diagnostic code (e.g. `TS2307`) or source (`eslint`) — those
   * are tried as additional matching signals.
   */
  classifyDiagnostic(ctx: DiagnosticContext): ErrorMatch | null {
    // First pass: classify on the message — usually the richest signal.
    const messageMatch = this.classify(ctx.message);
    if (messageMatch) return messageMatch;

    // Second pass: try a synthetic message that includes the diagnostic
    // code. Many TypeScript / ESLint messages arrive truncated by VS
    // Code, but the code is preserved (e.g. `TS2307`). Building a
    // synthetic message lets patterns like `TS2307: Cannot find module`
    // match even when only the code is present.
    if (ctx.code !== undefined && ctx.code !== null && ctx.code !== '') {
      const synthetic = `${ctx.source ?? ''} ${ctx.code} ${ctx.message ?? ''}`.trim();
      const codeMatch = this.classify(synthetic);
      if (codeMatch) return codeMatch;
    }

    return null;
  }

  /** Look up an entry by its stable id (e.g. `missing_module`). */
  getById(id: string): ErrorEntry | undefined {
    return this.byId.get(id);
  }

  /** Return all entries belonging to a given category. */
  getByCategory(category: ErrorCategory): ErrorEntry[] {
    return this.entries.filter((e) => e.category === category);
  }

  /** Total number of compiled patterns (useful for telemetry / debug). */
  get patternCount(): number {
    return this.compiled.length;
  }

  /**
   * Return the bundled error database.
   *
   * The bundled data is loaded via a static `import` (inlined by tsc at
   * compile time thanks to `resolveJsonModule: true`), so this method
   * simply casts and returns it. We keep the `fs`-based path as a
   * fallback for the future "user-supplied custom errors" feature —
   * `loadFromFile(path)` will be the public API for that.
   */
  private static loadBundled(): ErrorEntry[] {
    if (!Array.isArray(bundledErrors)) {
      throw new Error(
        `[Code Bhau] errors.json must be an array — got ${typeof bundledErrors}`
      );
    }
    return bundledErrors as ErrorEntry[];
  }

  /**
   * Load an error database from a custom file path. Reserved for the
   * future "user-supplied custom errors" feature (Phase 3).
   */
  static loadFromFile(filePath: string): ErrorEntry[] {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(
        `[Code Bhau] Custom errors file must be an array — got ${typeof parsed}`
      );
    }
    return parsed as ErrorEntry[];
  }
}
