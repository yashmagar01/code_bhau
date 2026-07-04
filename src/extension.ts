/**
 * Code Bhau — Extension Entry Point
 * ---------------------------------
 * Activates on first language open or on startup. Wires together:
 *
 *   • ErrorClassifier         — turns raw messages into ErrorEntry matches
 *   • ResponseSelector        — picks a witty line per error per language
 *   • HoverProvider           — shows Bhau's response on hover
 *   • SidebarProvider         — shows the latest error in the activity bar
 *
 * It also subscribes to:
 *
 *   • vscode.languages.onDidChangeDiagnostics  — refresh the sidebar
 *   • vscode.window.onDidChangeActiveTextEditor — refresh the sidebar
 *   • vscode.workspace.onDidChangeConfiguration — re-read language prefs
 *
 * The whole extension is 100% offline. No HTTP calls, no telemetry, no
 * external services. The errors database lives in `src/data/errors.json`
 * and is bundled into the .vsix at publish time.
 */

import * as vscode from 'vscode';
import { ErrorClassifier } from './classifier/ErrorClassifier';
import { ResponseSelector } from './utils/ResponseSelector';
import { HoverProvider } from './providers/HoverProvider';
import { SidebarProvider } from './providers/SidebarProvider';
import {
  HoverFormat,
  LanguageMode,
  SidebarIdleMessage,
  SidebarNoMatchMessage,
  SidebarUpdateMessage,
} from './models/ErrorModel';

/** All languages we support — used for validation. */
const SUPPORTED_LANGUAGES: readonly LanguageMode[] = ['marathi', 'hindi', 'english'];

/** Sample error messages for the demo command. */
const DEMO_ERRORS: { label: string; message: string }[] = [
  { label: 'Missing Module — axios', message: "Cannot find module 'axios'" },
  { label: 'Null Reference — user.name', message: "TypeError: Cannot read properties of undefined (reading 'name')" },
  { label: 'Missing Semicolon', message: "Parsing error: Unexpected token, expected ;" },
  { label: 'Undefined Variable — useState', message: "'useState' is not defined  no-undef" },
  { label: 'React Hook Violation', message: 'Rendered more hooks than during the previous render.' },
  { label: 'Infinite Loop', message: 'Maximum update depth exceeded. This can happen when a component calls setState inside componentWillUpdate or componentDidUpdate.' },
  { label: 'Build Failure (TS)', message: "TS2307: Cannot find module './components/Header' or its corresponding type declarations." },
  { label: 'Port Already In Use', message: 'Error: listen EADDRINUSE: address already in use 0.0.0.0:3000' },
  { label: 'JSON Parse Error', message: "Unexpected token < in JSON at position 0" },
  { label: 'Git Merge Conflict', message: 'CONFLICT (content): Merge conflict in src/index.ts' },
];

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Code Bhau] Activating Code Bhau Phase 2 MVP...');

  // ----- Singletons --------------------------------------------------------
  const classifier = new ErrorClassifier();
  const selector = new ResponseSelector({
    maxHistoryPerError: readNumberConfig('maxHistoryPerError', 5, 0, 10),
  });

  console.log(
    `[Code Bhau] Loaded ${classifier.entries.length} error families (${classifier.patternCount} patterns).`
  );

  const sidebar = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // ----- Live config readers (so we always react to settings changes) ------
  const getLanguage = (): LanguageMode => {
    const raw = vscode.workspace
      .getConfiguration('codeBhau')
      .get<string>('language', 'marathi');
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)
      ? (raw as LanguageMode)
      : 'marathi';
  };
  const getFormat = (): HoverFormat =>
    vscode.workspace.getConfiguration('codeBhau').get<HoverFormat>('hoverMessageFormat', 'full');
  const getIncludeWarnings = (): boolean =>
    vscode.workspace.getConfiguration('codeBhau').get<boolean>('includeWarnings', false);
  const isHoverEnabled = (): boolean =>
    vscode.workspace.getConfiguration('codeBhau').get<boolean>('enableHover', true);
  const isSidebarEnabled = (): boolean =>
    vscode.workspace.getConfiguration('codeBhau').get<boolean>('enableSidebar', true);

  // ----- Hover provider ----------------------------------------------------
  const hoverProvider = new HoverProvider({
    classifier,
    selector,
    getLanguage,
    getFormat,
    getIncludeWarnings,
  });
  const hoverDisposable = vscode.languages.registerHoverProvider(
    [
      'typescript',
      'javascript',
      'typescriptreact',
      'javascriptreact',
      'json',
      'jsonc',
      'markdown',
      'python',
      'go',
      'java',
    ],
    hoverProvider
  );
  context.subscriptions.push(hoverDisposable);

  // ----- Diagnostics listener ---------------------------------------------
  const refreshSidebar = () => {
    if (!isSidebarEnabled()) return;
    if (!sidebar.isVisible()) return; // no point pushing to a hidden view

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      const idle: SidebarIdleMessage = {
        type: 'idle',
        timestamp: new Date().toISOString(),
      };
      sidebar.showIdle(idle);
      return;
    }

    const diags = vscode.languages.getDiagnostics(editor.document.uri);
    if (diags.length === 0) {
      const idle: SidebarIdleMessage = {
        type: 'idle',
        timestamp: new Date().toISOString(),
      };
      sidebar.showIdle(idle);
      return;
    }

    // Pick the most-severe diagnostic on the current line (or first error).
    const includeWarnings = getIncludeWarnings();
    const candidate =
      diags.find(
        (d) => d.severity === vscode.DiagnosticSeverity.Error
      ) ??
      (includeWarnings
        ? diags.find((d) => d.severity === vscode.DiagnosticSeverity.Warning)
        : undefined);

    if (!candidate) {
      const idle: SidebarIdleMessage = {
        type: 'idle',
        timestamp: new Date().toISOString(),
      };
      sidebar.showIdle(idle);
      return;
    }

    const match = classifier.classify(candidate.message);
    if (!match) {
      const noMatch: SidebarNoMatchMessage = {
        type: 'no-match',
        originalMessage: candidate.message,
        fileName: basename(editor.document.fileName),
        line: candidate.range.start.line + 1,
        column: candidate.range.start.character + 1,
        timestamp: new Date().toISOString(),
      };
      sidebar.showUnmatched(noMatch);
      return;
    }

    const language = getLanguage();
    const response = selector.select(match.entry, language);
    const update: SidebarUpdateMessage = {
      type: 'error',
      entry: match.entry,
      response,
      language,
      originalMessage: candidate.message,
      fileName: basename(editor.document.fileName),
      line: candidate.range.start.line + 1,
      column: candidate.range.start.character + 1,
      timestamp: new Date().toISOString(),
    };
    sidebar.updateError(update);
  };

  // Only refresh when the active document's diagnostics change — avoids
  // spamming the sidebar every time ANY file in the workspace gets a
  // diagnostic.
  const diagDisposable = vscode.languages.onDidChangeDiagnostics((e) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const activeUri = editor.document.uri.toString();
    if (e.uris.some((u) => u.toString() === activeUri)) {
      refreshSidebar();
    }
  });
  context.subscriptions.push(diagDisposable);

  const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
    refreshSidebar();
  });
  context.subscriptions.push(activeEditorDisposable);

  const visibleEditorDisposable = vscode.window.onDidChangeTextEditorSelection(() => {
    // Selection change is a good trigger — when the user clicks a
    // different error, the sidebar should follow.
    refreshSidebar();
  });
  context.subscriptions.push(visibleEditorDisposable);

  // ----- Commands ----------------------------------------------------------
  context.subscriptions.push(
    vscode.commands.registerCommand('codeBhau.refreshErrors', refreshSidebar),

    vscode.commands.registerCommand('codeBhau.showLatestError', refreshSidebar),

    vscode.commands.registerCommand('codeBhau.switchLanguage', async () => {
      const pick = await vscode.window.showQuickPick(
        [
          { label: 'Marathi', value: 'marathi' as LanguageMode },
          { label: 'Hindi', value: 'hindi' as LanguageMode },
          { label: 'English', value: 'english' as LanguageMode },
        ],
        { placeHolder: 'Bhau kaunsi bhasha bole?' }
      );
      if (!pick) return;
      await vscode.workspace
        .getConfiguration('codeBhau')
        .update('language', pick.value, vscode.ConfigurationTarget.Global);
      sidebar.notifyLanguageChanged({
        type: 'language-changed',
        language: pick.value,
        timestamp: new Date().toISOString(),
      });
      refreshSidebar();
      vscode.window.showInformationMessage(`Code Bhau now speaks ${pick.label}.`);
    }),

    vscode.commands.registerCommand('codeBhau.testError', async () => {
      const pick = await vscode.window.showQuickPick(
        DEMO_ERRORS.map((d) => ({ label: d.label, description: d.message })),
        { placeHolder: 'Pick a sample error to demo Code Bhau' }
      );
      if (!pick) return;
      const msg = pick.description!;
      const match = classifier.classify(msg);
      if (!match) {
        const noMatch: SidebarNoMatchMessage = {
          type: 'no-match',
          originalMessage: msg,
          fileName: 'demo.ts',
          timestamp: new Date().toISOString(),
        };
        sidebar.showUnmatched(noMatch);
        vscode.commands.executeCommand('workbench.view.extension.codeBhau-view-container');
        return;
      }
      const language = getLanguage();
      const response = selector.select(match.entry, language);
      const update: SidebarUpdateMessage = {
        type: 'error',
        entry: match.entry,
        response,
        language,
        originalMessage: msg,
        fileName: 'demo.ts',
        timestamp: new Date().toISOString(),
      };
      sidebar.updateError(update);
      // Reveal the sidebar so the user sees the demo.
      vscode.commands.executeCommand('workbench.view.extension.codeBhau-view-container');
    }),

    vscode.commands.registerCommand('codeBhau.copyFix', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const diags = vscode.languages.getDiagnostics(editor.document.uri);
      if (diags.length === 0) {
        vscode.window.showInformationMessage('Bhau: no diagnostics in the active file.');
        return;
      }
      const candidate =
        diags.find((d) => d.severity === vscode.DiagnosticSeverity.Error) ?? diags[0];
      const match = classifier.classify(candidate.message);
      if (!match || match.entry.likelyFixes.length === 0) {
        vscode.window.showInformationMessage(
          'Bhau: no quick fix available for this one, sorry bhau.'
        );
        return;
      }
      const fix = match.entry.likelyFixes[0];
      vscode.env.clipboard.writeText(fix);
      vscode.window.showInformationMessage(`Bhau: copied — ${fix}`);
    })
  );

  // ----- Config change listener -------------------------------------------
  const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (!e.affectsConfiguration('codeBhau')) return;
    // Re-read maxHistory in case it changed.
    selector.reset(); // simplest correct behaviour: forget history on change.
    if (e.affectsConfiguration('codeBhau.language')) {
      sidebar.notifyLanguageChanged({
        type: 'language-changed',
        language: getLanguage(),
        timestamp: new Date().toISOString(),
      });
    }
    refreshSidebar();
  });
  context.subscriptions.push(configDisposable);

  // ----- Initial render ----------------------------------------------------
  // Wait a tick so the sidebar view has had a chance to resolve.
  setTimeout(refreshSidebar, 500);

  console.log('[Code Bhau] Activation complete. Bhau is ready.');
}

export function deactivate(): void {
  console.log('[Code Bhau] Deactivating.');
}

// ---------------------------------------------------------------------------
//  Local helpers
// ---------------------------------------------------------------------------

function basename(p: string): string {
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1] ?? p;
}

function readNumberConfig(
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = vscode.workspace.getConfiguration('codeBhau').get<number>(key, fallback);
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, raw));
}
