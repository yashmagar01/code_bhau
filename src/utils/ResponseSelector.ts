/**
 * Code Bhau — Response Selector
 * -----------------------------
 * Picks one witty response for a given error family in the requested
 * language. The selector remembers the last N choices per family to
 * avoid showing the same joke twice in a row — Code Bhau should feel
 * like a real senior dev, not a broken record.
 *
 * The selector is intentionally pure-ish (state lives inside the
 * instance, not in module scope) so it can be unit-tested and so the
 * extension can spin up multiple selectors if needed (e.g. one per
 * workspace).
 */

import { ErrorEntry, LanguageMode } from '../models/ErrorModel';

export interface ResponseSelectorOptions {
  /**
   * Maximum number of recently-picked indices to remember per error
   * family, to avoid repetition. Defaults to 5. Set to 0 to disable
   * de-duplication entirely.
   */
  maxHistoryPerError?: number;

  /** Optional custom random function — useful for deterministic tests. */
  random?: () => number;
}

export class ResponseSelector {
  /** Recently-picked indices, keyed by error id. */
  private readonly history: Map<string, number[]> = new Map();

  private readonly maxHistory: number;
  private readonly random: () => number;

  constructor(opts: ResponseSelectorOptions = {}) {
    this.maxHistory = Math.max(0, opts.maxHistoryPerError ?? 5);
    this.random = opts.random ?? Math.random;
  }

  /**
   * Pick a witty response for the given entry in the requested language.
   *
   * Falls back to English if the entry doesn't have the requested
   * language, then to a hard-coded apology string if the entry has no
   * responses at all (shouldn't happen with the bundled data, but we
   * guard anyway).
   */
  select(entry: ErrorEntry, language: LanguageMode): string {
    const pool = this.getPool(entry, language);
    if (pool.length === 0) {
      return 'Bhau, hi error Bhau ne pahilehi nahi pahile. Pan tu fix karu shaka.';
    }
    if (pool.length === 1) {
      return pool[0];
    }

    const recent = this.history.get(entry.id) ?? [];
    let idx = Math.floor(this.random() * pool.length);

    // Try to avoid the most recent N picks. We don't strictly forbid
    // them (the random seed might keep landing on them) — we just walk
    // forward until we find one that isn't recent.
    let attempts = 0;
    while (recent.includes(idx) && attempts < pool.length) {
      idx = (idx + 1) % pool.length;
      attempts++;
    }

    // Update history. Cap at `maxHistory` (and never exceed pool.length - 1
    // so at least one option is always "fresh").
    const cap = Math.min(this.maxHistory, Math.max(0, pool.length - 1));
    const nextRecent = [...recent, idx];
    while (nextRecent.length > cap) nextRecent.shift();
    if (cap > 0) this.history.set(entry.id, nextRecent);

    return pool[idx];
  }

  /** Reset all history — useful when the user explicitly cycles a joke. */
  reset(entryId?: string): void {
    if (entryId) this.history.delete(entryId);
    else this.history.clear();
  }

  /**
   * Return the response pool for the requested language, falling back
   * to English if the language is missing or empty.
   */
  private getPool(entry: ErrorEntry, language: LanguageMode): string[] {
    const pool = entry.responses[language];
    if (pool && pool.length > 0) return pool;
    const fallback = entry.responses.english;
    if (fallback && fallback.length > 0) return fallback;
    return [];
  }
}
