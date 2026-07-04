/**
 * Code Bhau — Sidebar Provider
 * ----------------------------
 * Renders the "Bhau Says" webview in the VS Code activity bar. The
 * sidebar shows the latest classified error in the active editor,
 * along with the witty response, meaning, fixes, and a footer with
 * taxonomy metadata.
 *
 * The webview is intentionally lightweight — no React, no framework,
 * just a single HTML string with inline CSS and a tiny script that
 * listens for `postMessage` from the extension host. This keeps the
 * extension 100% offline and bundle-free.
 *
 * State machine:
 *   idle       → no diagnostics in the active editor
 *   no-match   → there's a diagnostic, but the classifier didn't find a family
 *   error      → classified, response picked, ready to display
 */

import * as vscode from 'vscode';
import {
  ErrorEntry,
  LanguageMode,
  SidebarIdleMessage,
  SidebarLanguageChangedMessage,
  SidebarMessage,
  SidebarNoMatchMessage,
  SidebarUpdateMessage,
  WebviewInboundMessage,
} from '../models/ErrorModel';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeBhau.sidebar';

  private view?: vscode.WebviewView;
  private lastMessage?: SidebarMessage;
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  /** Called by VS Code when the user first opens the sidebar view. */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
      enableForms: false,
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    // Replay the last message if we have one — handles the case where
    // the user closes and re-opens the sidebar.
    if (this.lastMessage) {
      webviewView.webview.postMessage(this.lastMessage);
    } else {
      const idle: SidebarIdleMessage = {
        type: 'idle',
        timestamp: new Date().toISOString(),
      };
      webviewView.webview.postMessage(idle);
    }

    webviewView.webview.onDidReceiveMessage((msg: WebviewInboundMessage) =>
      this.handleInbound(msg)
    );
  }

  /** Push an "error classified" update to the sidebar. */
  updateError(update: SidebarUpdateMessage): void {
    this.lastMessage = update;
    this.view?.webview.postMessage(update);
  }

  /** Push a "diagnostic present but no match" update. */
  showUnmatched(noMatch: SidebarNoMatchMessage): void {
    this.lastMessage = noMatch;
    this.view?.webview.postMessage(noMatch);
  }

  /** Push an "all clear" update. */
  showIdle(idle: SidebarIdleMessage): void {
    this.lastMessage = idle;
    this.view?.webview.postMessage(idle);
  }

  /** Push a "language just changed" notification. */
  notifyLanguageChanged(msg: SidebarLanguageChangedMessage): void {
    this.view?.webview.postMessage(msg);
  }

  /** Whether the sidebar is currently visible (resolved & shown). */
  isVisible(): boolean {
    return !!this.view?.visible;
  }

  private handleInbound(msg: WebviewInboundMessage): void {
    switch (msg.type) {
      case 'refresh':
        vscode.commands.executeCommand('codeBhau.refreshErrors');
        break;
      case 'copy':
        vscode.env.clipboard.writeText(msg.text);
        vscode.window.showInformationMessage('Bhau: fix copied to clipboard.');
        break;
      case 'switch-language':
        vscode.commands.executeCommand('codeBhau.switchLanguage');
        break;
      case 'demo':
        vscode.commands.executeCommand('codeBhau.testError');
        break;
    }
  }

  // ------------------------------------------------------------------
  //  HTML / CSS for the webview
  // ------------------------------------------------------------------

  private getHtml(webview: vscode.Webview): string {
    const logoUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'logo.png'));
    const nonce = this.getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code Bhau</title>
  <style nonce="${nonce}">
    :root {
      --bhau-bg: var(--vscode-sideBar-background, #1e1e2e);
      --bhau-fg: var(--vscode-sideBar-foreground, #cdd6f4);
      --bhau-muted: var(--vscode-descriptionForeground, #888c9b);
      --bhau-accent: var(--vscode-button-background, #4c4f69);
      --bhau-accent-fg: var(--vscode-button-foreground, #ffffff);
      --bhau-error: var(--vscode-errorForeground, #f38ba8);
      --bhau-warning: var(--vscode-editorWarning-foreground, #f9e2af);
      --bhau-border: var(--vscode-panel-border, #313244);
      --bhau-quote-bg: var(--vscode-textBlockQuote-background, #181825);
      --bhau-code-bg: var(--vscode-textCodeBlock-background, #181825);
      --bhau-card: var(--vscode-editorWidget-background, #181825);
    }

    * { box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family, -apple-system, "Segoe UI", sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--bhau-fg);
      background: var(--bhau-bg);
      margin: 0;
      padding: 12px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--bhau-border);
    }
    .header .logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
    .header h1 {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }
    .header .lang-chip {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 8px;
      background: var(--bhau-accent);
      color: var(--bhau-accent-fg);
      cursor: pointer;
      user-select: none;
    }

    .card {
      background: var(--bhau-card);
      border: 1px solid var(--bhau-border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .card .title-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 8px;
    }
    .card .emoji {
      font-size: 16px;
    }
    .card h2 {
      font-size: 14px;
      margin: 0;
      font-weight: 600;
      flex: 1;
    }
    .card .category {
      font-size: 10px;
      color: var(--bhau-muted);
      padding: 2px 6px;
      border: 1px solid var(--bhau-border);
      border-radius: 8px;
    }

    .quote {
      background: var(--bhau-quote-bg);
      border-left: 3px solid var(--bhau-accent);
      padding: 8px 10px;
      margin: 8px 0;
      font-style: italic;
      font-size: 12.5px;
      line-height: 1.45;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--bhau-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 12px 0 4px 0;
    }

    .explanation {
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--bhau-fg);
    }

    .fixes {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .fixes li {
      padding: 6px 8px;
      margin-bottom: 4px;
      background: var(--bhau-code-bg);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family, "Menlo", "Consolas", monospace);
      font-size: 11.5px;
      display: flex;
      align-items: flex-start;
      gap: 6px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .fixes li:hover {
      background: var(--bhau-accent);
      color: var(--bhau-accent-fg);
    }
    .fixes li .copy-hint {
      margin-left: auto;
      opacity: 0;
      font-size: 10px;
      transition: opacity 0.15s ease;
    }
    .fixes li:hover .copy-hint { opacity: 0.8; }

    .meta {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed var(--bhau-border);
      font-size: 10.5px;
      color: var(--bhau-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
    }
    .meta .chip {
      background: var(--bhau-quote-bg);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .footer {
      font-size: 10.5px;
      color: var(--bhau-muted);
      text-align: center;
      padding: 8px 0;
    }

    .idle {
      text-align: center;
      padding: 40px 12px;
      color: var(--bhau-muted);
    }
    .idle .emoji {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .idle h2 {
      font-size: 14px;
      margin: 4px 0 8px 0;
      color: var(--bhau-fg);
    }

    .no-match {
      padding: 12px;
    }
    .no-match .raw {
      background: var(--bhau-code-bg);
      padding: 8px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family, "Menlo", "Consolas", monospace);
      font-size: 11.5px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }

    .actions {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
    }
    .actions button {
      flex: 1;
      padding: 6px 8px;
      background: var(--bhau-accent);
      color: var(--bhau-accent-fg);
      border: none;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      font-family: inherit;
    }
    .actions button:hover { opacity: 0.9; }
    .actions button.secondary {
      background: transparent;
      color: var(--bhau-fg);
      border: 1px solid var(--bhau-border);
    }

    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="${logoUri}" alt="Code Bhau Logo" />
    <h1>Code Bhau</h1>
    <span class="lang-chip" id="lang-chip" title="Click to switch language">—</span>
  </div>

  <div class="actions">
    <button id="btn-refresh">Refresh</button>
    <button id="btn-demo" class="secondary">Demo</button>
  </div>

  <!-- Idle state -->
  <div id="idle" class="idle">
    <div class="emoji">Ek cup chai</div>
    <h2>Bhau is chilling.</h2>
    <p>No errors in the active editor. Click <strong>Demo</strong> to see a sample.</p>
  </div>

  <!-- No-match state -->
  <div id="no-match" class="card hidden">
    <div class="title-row">
      <span class="emoji">?</span>
      <h2>Bhau is scratching his head</h2>
    </div>
    <div class="quote">
      Bhau, hi error Bhau ne pahilehi nahi pahile. Pan tu thev, ek cup chai ghe, punha vichar.
    </div>
    <div class="section-label">Raw message</div>
    <div class="raw" id="no-match-raw"></div>
    <div class="meta" id="no-match-meta"></div>
  </div>

  <!-- Error state -->
  <div id="error" class="card hidden">
    <div class="title-row">
      <span class="emoji" id="err-emoji">Bug</span>
      <h2 id="err-title">—</h2>
      <span class="category" id="err-category">—</span>
    </div>
    <div class="quote" id="err-quote">—</div>
    <div class="section-label">Meaning</div>
    <div class="explanation" id="err-explanation">—</div>
    <div class="section-label">Likely Fixes</div>
    <ul class="fixes" id="err-fixes"></ul>
    <div class="meta" id="err-meta"></div>
  </div>

  <div class="footer">
    Code Bhau • Phase 2 MVP • 100% offline • Made in Pune
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const $ = (id) => document.getElementById(id);

    // ---- State -----------------------------------------------------------------
    let currentLang = 'marathi';

    // ---- Helpers ---------------------------------------------------------------
    function showOnly(id) {
      ['idle', 'no-match', 'error'].forEach((s) => {
        $(s).classList.toggle('hidden', s !== id);
      });
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatTime(iso) {
      try {
        const d = new Date(iso);
        return d.toLocaleTimeString();
      } catch (_) {
        return '';
      }
    }

    function renderError(msg) {
      const e = msg.entry;
      $('err-emoji').textContent = e.emoji || 'Bug';
      $('err-title').textContent = e.title;
      $('err-category').textContent = e.category;
      $('err-quote').textContent = msg.response;
      $('err-explanation').textContent = e.beginnerExplanation;

      const fixesEl = $('err-fixes');
      fixesEl.innerHTML = '';
      (e.likelyFixes || []).forEach((fix, i) => {
        const li = document.createElement('li');
        const txt = document.createElement('span');
        txt.textContent = fix;
        li.appendChild(txt);
        const hint = document.createElement('span');
        hint.className = 'copy-hint';
        hint.textContent = 'click to copy';
        li.appendChild(hint);
        li.title = 'Click to copy this fix to the clipboard';
        li.addEventListener('click', () => {
          vscode.postMessage({ type: 'copy', text: fix });
        });
        fixesEl.appendChild(li);
      });

      const metaEl = $('err-meta');
      metaEl.innerHTML = '';
      const chips = [];
      if (e.confusionScore !== undefined) chips.push('confusion ' + e.confusionScore + '/10');
      if (e.frequencyScore !== undefined) chips.push('freq ' + e.frequencyScore + '/10');
      if (e.fixComplexityScore !== undefined) chips.push('fix ' + e.fixComplexityScore + '/10');
      if (e.relatedTechnologies && e.relatedTechnologies.length) {
        e.relatedTechnologies.forEach((t) => chips.push(t));
      }
      if (msg.fileName) chips.push('@ ' + msg.fileName + (msg.line ? ':' + msg.line : ''));
      chips.push('seen ' + formatTime(msg.timestamp));
      chips.forEach((c) => {
        const span = document.createElement('span');
        span.className = 'chip';
        span.textContent = c;
        metaEl.appendChild(span);
      });

      showOnly('error');
    }

    function renderNoMatch(msg) {
      $('no-match-raw').textContent = msg.originalMessage || '';
      const metaEl = $('no-match-meta');
      metaEl.innerHTML = '';
      const chips = [];
      if (msg.fileName) chips.push('@ ' + msg.fileName + (msg.line ? ':' + msg.line : ''));
      chips.push('seen ' + formatTime(msg.timestamp));
      chips.forEach((c) => {
        const span = document.createElement('span');
        span.className = 'chip';
        span.textContent = c;
        metaEl.appendChild(span);
      });
      showOnly('no-match');
    }

    function renderIdle(msg) {
      showOnly('idle');
    }

    function setLanguageChip(lang) {
      currentLang = lang;
      const map = { marathi: 'Marathi', hindi: 'Hindi', english: 'English' };
      $('lang-chip').textContent = map[lang] || String(lang).toUpperCase();
    }

    // ---- Inbound messages ------------------------------------------------------
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case 'error':
          setLanguageChip(msg.language || currentLang);
          renderError(msg);
          break;
        case 'no-match':
          renderNoMatch(msg);
          break;
        case 'idle':
          renderIdle(msg);
          break;
        case 'language-changed':
          setLanguageChip(msg.language);
          break;
      }
    });

    // ---- Button wiring ---------------------------------------------------------
    $('btn-refresh').addEventListener('click', () => {
      vscode.postMessage({ type: 'refresh' });
    });
    $('btn-demo').addEventListener('click', () => {
      vscode.postMessage({ type: 'demo' });
    });
    $('lang-chip').addEventListener('click', () => {
      vscode.postMessage({ type: 'switch-language' });
    });

    // Initial paint — show idle until the host sends something.
    showOnly('idle');
  </script>
</body>
</html>`;
  }

  private getNonce(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < 32; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }
}
