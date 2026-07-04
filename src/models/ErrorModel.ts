/**
 * Code Bhau — Error Model
 * -----------------------
 * Core type definitions for the diagnostic taxonomy, classifier output and
 * provider contracts. These types are the single source of truth shared by the
 * classifier, response selector, hover provider and sidebar provider.
 *
 * The taxonomy follows the 8 top-level ErrorCategory values defined in the
 * MVP spec, but each ErrorEntry also carries optional scoring metadata
 * (Beginner Confusion / Frequency / Fix Complexity) drawn from the broader
 * Code Bhau Error Taxonomy research so future versions can adapt their tone
 * of voice without breaking the schema.
 */

/** MVP-supported top-level error families. */
export type ErrorCategory =
  | 'Syntax'
  | 'UndefinedVariable'
  | 'NullReference'
  | 'MissingModule'
  | 'ReactHooks'
  | 'TypeError'
  | 'BuildFailure'
  | 'LintError';

/** Languages Bhau speaks. */
export type LanguageMode = 'marathi' | 'hindi' | 'english';

/** Compactness of the hover card. */
export type HoverFormat = 'compact' | 'full';

/**
 * A single error family in the local database. One entry can match many
 * raw diagnostic messages because `patterns` is a list of regular
 * expressions (string form, case-insensitive).
 */
export interface ErrorEntry {
  /** Stable identifier like `missing_module`. */
  id: string;

  /**
   * Regular-expression fragments (case-insensitive). The classifier builds
   * one RegExp per pattern and returns the first entry that matches.
   * Patterns should be specific enough to avoid false positives but loose
   * enough to catch common phrasings — e.g. `Cannot find module ['"]?([\w/@.-]+)['"]?`
   * matches both single-quoted and double-quoted variants.
   */
  patterns: string[];

  /** Short human-readable title shown in the hover card and sidebar. */
  title: string;

  /** Emoji used alongside the title — keeps the tone friendly. */
  emoji: string;

  /** MVP category for routing. */
  category: ErrorCategory;

  /** Plain-English explanation a first-year student can understand. */
  beginnerExplanation: string;

  /**
   * Concrete fix steps. Displayed as a bullet list. Keep each step short
   * (one line) — these are intended to be copy-pastable commands or short
   * instructions.
   */
  likelyFixes: string[];

  /** Localised witty responses — 10 per language per family. */
  responses: {
    marathi: string[];
    hindi: string[];
    english: string[];
  };

  // --- Optional taxonomy metadata (Phase 3 hooks) ---------------------

  /** 1 = obvious typo, 10 = deep architectural misunderstanding. */
  confusionScore?: number;

  /** 1 = rare edge case, 10 = encountered daily by beginners. */
  frequencyScore?: number;

  /** 1 = add a character, 10 = rewrite the architectural flow. */
  fixComplexityScore?: number;

  /** Languages / tools this family commonly affects (TypeScript, npm, …). */
  relatedTechnologies?: string[];
}

/** A successful classification result. */
export interface ErrorMatch {
  /** The matched database entry. */
  entry: ErrorEntry;
  /** The regex pattern that matched the raw message. */
  matchedPattern: string;
  /** Captured groups from the matched regex, if any. */
  captures: string[];
  /** The raw diagnostic message that was classified. */
  originalMessage: string;
}

/**
 * Lightweight normalised view of a VS Code `Diagnostic`. We use this
 * instead of importing `vscode` inside the classifier so the classifier
 * stays unit-testable in plain Node (no VS Code runtime required).
 */
export interface DiagnosticContext {
  message: string;
  /** Diagnostic code (e.g. `TS2307`, `no-undef`, `EADDRINUSE`). */
  code?: string | number;
  /** Diagnostic source (e.g. `ts`, `eslint`, `npm`). */
  source?: string;
  /** Language id of the file the diagnostic came from. */
  languageId?: string;
  /** Severity as a plain string — keeps us vscode-free. */
  severity?: 'error' | 'warning' | 'info' | 'hint';
  /** File name (basename only). */
  fileName?: string;
  /** 1-indexed line number. */
  line?: number;
  /** 1-indexed column. */
  column?: number;
}

/** Payload sent from extension host → sidebar webview. */
export interface SidebarUpdateMessage {
  type: 'error';
  entry: ErrorEntry;
  response: string;
  language: LanguageMode;
  originalMessage: string;
  fileName?: string;
  line?: number;
  column?: number;
  /** ISO timestamp string for "Last seen" footer. */
  timestamp: string;
}

/** Payload sent when no entry in the database matches. */
export interface SidebarNoMatchMessage {
  type: 'no-match';
  originalMessage: string;
  fileName?: string;
  line?: number;
  column?: number;
  timestamp: string;
}

/** Payload sent when there is no diagnostic at all (clean editor). */
export interface SidebarIdleMessage {
  type: 'idle';
  timestamp: string;
}

/** Payload sent when the user toggles language via the command. */
export interface SidebarLanguageChangedMessage {
  type: 'language-changed';
  language: LanguageMode;
  timestamp: string;
}

export type SidebarMessage =
  | SidebarUpdateMessage
  | SidebarNoMatchMessage
  | SidebarIdleMessage
  | SidebarLanguageChangedMessage;

/** Messages the webview sends back to the extension host. */
export type WebviewInboundMessage =
  | { type: 'refresh' }
  | { type: 'copy'; text: string }
  | { type: 'switch-language' }
  | { type: 'demo' };
