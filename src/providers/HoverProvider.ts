/**
 * Code Bhau — Hover Provider
 * --------------------------
 * When the user hovers over a red squiggly line, VS Code calls this
 * provider. We look up the active diagnostics at the cursor position,
 * classify the first one we find, pick a witty response in the user's
 * chosen language, and render a MarkdownString with:
 *
 *   📦 Title
 *   > Bhau's witty one-liner
 *   Meaning: beginner-friendly explanation
 *   Likely Fixes:
 *     • fix 1
 *     • fix 2
 *   Category metadata footer
 *
 * The provider depends on a `getLanguage` callback (rather than reading
 * the configuration directly) so it always reacts to live setting
 * changes without holding a stale snapshot.
 */

import * as vscode from 'vscode';
import { ErrorClassifier } from '../classifier/ErrorClassifier';
import { ResponseSelector } from '../utils/ResponseSelector';
import {
  DiagnosticContext,
  ErrorCategory,
  ErrorEntry,
  HoverFormat,
  LanguageMode,
} from '../models/ErrorModel';

/** Emoji prefix per category — keeps the hover card friendly at a glance. */
const CATEGORY_EMOJI: Record<ErrorCategory, string> = {
  Syntax: 'GrammarlyBlink',
  UndefinedVariable: 'NameTag',
  NullReference: 'EmptyBox',
  MissingModule: 'MissingBox',
  ReactHooks: 'HookTangle',
  TypeError: 'Mismatch',
  BuildFailure: 'CraneDown',
  LintError: 'Broom',
};

/** A friendly icon (textual emoji shown in markdown) per category. */
const CATEGORY_ICON_TEXT: Record<ErrorCategory, string> = {
  Syntax: 'SyntaxErrorBlink',
  UndefinedVariable: 'MissingName',
  NullReference: 'EmptyBox',
  MissingModule: 'MissingPackage',
  ReactHooks: 'HookTangle',
  TypeError: 'TypeMismatch',
  BuildFailure: 'BuildDown',
  LintError: 'Broom',
};

export interface HoverProviderDeps {
  classifier: ErrorClassifier;
  selector: ResponseSelector;
  /** Returns the currently-selected language (live). */
  getLanguage: () => LanguageMode;
  /** Returns the currently-selected hover format (compact | full). */
  getFormat: () => HoverFormat;
  /** Whether warnings should also be classified. */
  getIncludeWarnings: () => boolean;
}

export class HoverProvider implements vscode.HoverProvider {
  constructor(private readonly deps: HoverProviderDeps) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    if (diagnostics.length === 0) return null;

    const includeWarnings = this.deps.getIncludeWarnings();
    const relevant = diagnostics.filter(
      (d) =>
        d.range.contains(position) &&
        (includeWarnings
          ? d.severity === vscode.DiagnosticSeverity.Error ||
            d.severity === vscode.DiagnosticSeverity.Warning
          : d.severity === vscode.DiagnosticSeverity.Error)
    );
    if (relevant.length === 0) return null;

    // Pick the most severe diagnostic at this position.
    const diag = relevant.sort((a, b) => a.severity - b.severity)[0];

    const ctx: DiagnosticContext = {
      message: diag.message,
      code: typeof diag.code === 'object' ? diag.code.value : diag.code,
      source: diag.source,
      languageId: document.languageId,
      severity: this.severityToString(diag.severity),
      fileName: this.basename(document.fileName),
      line: position.line + 1,
      column: position.character + 1,
    };

    const match = this.deps.classifier.classifyDiagnostic(ctx);
    if (!match) {
      // No matching family — return a soft hover that still tells the
      // user Bhau saw the error but doesn't have a joke ready.
      return new vscode.Hover(
        this.buildNoMatchMarkdown(diag.message),
        diag.range
      );
    }

    const language = this.deps.getLanguage();
    const response = this.deps.selector.select(match.entry, language);
    const format = this.deps.getFormat();

    const md = this.buildMarkdown(match.entry, response, language, format);
    return new vscode.Hover(md, diag.range);
  }

  /** Build the main hover markdown string. */
  private buildMarkdown(
    entry: ErrorEntry,
    response: string,
    language: LanguageMode,
    format: HoverFormat
  ): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = false; // we never embed user content as HTML
    md.supportThemeIcons = true;
    md.supportHtml = false;

    const icon = CATEGORY_ICON_TEXT[entry.category] ?? 'Bug';

    // Header — title with emoji and language chip.
    md.appendMarkdown(`### $(${icon}) ${this.escapeMd(entry.title)}\n\n`);
    md.appendMarkdown(
      `Language: \`${language}\` &nbsp;•&nbsp; Category: \`${this.escapeMd(
        entry.category
      )}\`\n\n`
    );

    // The witty response as a blockquote.
    md.appendMarkdown(`> ${this.escapeMd(response)}\n\n`);

    if (format === 'full') {
      md.appendMarkdown(`**Meaning:** ${this.escapeMd(entry.beginnerExplanation)}\n\n`);

      md.appendMarkdown(`**Likely Fixes:**\n`);
      for (const fix of entry.likelyFixes) {
        md.appendMarkdown(`- ${this.escapeMd(fix)}\n`);
      }
      md.appendMarkdown('\n');

      // Optional taxonomy metadata footer.
      if (
        entry.confusionScore !== undefined ||
        entry.frequencyScore !== undefined ||
        entry.fixComplexityScore !== undefined
      ) {
        const parts: string[] = [];
        if (entry.confusionScore !== undefined)
          parts.push(`confusion ${entry.confusionScore}/10`);
        if (entry.frequencyScore !== undefined)
          parts.push(`frequency ${entry.frequencyScore}/10`);
        if (entry.fixComplexityScore !== undefined)
          parts.push(`fix-complexity ${entry.fixComplexityScore}/10`);
        md.appendMarkdown(
          `<sub>_Taxonomy: ${parts.join(' • ')}${
            entry.relatedTechnologies && entry.relatedTechnologies.length
              ? ' • ' + entry.relatedTechnologies.map((t) => `\`${t}\``).join(' ')
              : ''
          }_</sub>\n\n`
        );
      }
    } else {
      // Compact format — just the top fix.
      md.appendMarkdown(`**Quick Fix:** ${this.escapeMd(entry.likelyFixes[0] ?? '—')}\n\n`);
    }

    return md;
  }

  /** Soft fallback when no entry in the database matches. */
  private buildNoMatchMarkdown(rawMessage: string): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = false;
    md.supportThemeIcons = true;
    md.appendMarkdown(`### $(Question) Bhau is scratching his head\n\n`);
    md.appendMarkdown(
      `> Bhau, hi error Bhau ne pahilehi nahi pahile. Pan tu thev, bhau ahe tar ek cup chai ghe, punha vichar.\n\n`
    );
    md.appendMarkdown(`**Raw message:**\n\n`);
    md.appendMarkdown('```\n' + rawMessage.slice(0, 500) + '\n```\n');
    md.appendMarkdown(
      `\n<sub>_Bhau chi database madhye hi error nahi. Slack var screenshot pathv, bhau add karu._</sub>\n`
    );
    return md;
  }

  private severityToString(s: vscode.DiagnosticSeverity): DiagnosticContext['severity'] {
    switch (s) {
      case vscode.DiagnosticSeverity.Error:
        return 'error';
      case vscode.DiagnosticSeverity.Warning:
        return 'warning';
      case vscode.DiagnosticSeverity.Information:
        return 'info';
      case vscode.DiagnosticSeverity.Hint:
        return 'hint';
    }
  }

  private basename(p: string): string {
    const parts = p.split(/[/\\]/);
    return parts[parts.length - 1] ?? p;
  }

  /**
   * Escape characters that have special meaning in VS Code Markdown:
   * backslash, backtick, pipe, less-than, greater-than.
   * Code blocks (triple backtick) are intentionally not used for fixes
   * because they render as separate scrollable regions — inline code
   * is friendlier for short shell commands.
   */
  private escapeMd(s: string): string {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\|/g, '\\|');
  }
}

/** Exported for tests. */
export const __test = { CATEGORY_EMOJI, CATEGORY_ICON_TEXT };
