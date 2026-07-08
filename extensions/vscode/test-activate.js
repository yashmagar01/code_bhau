const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;

const mockVscode = {
  workspace: {
    getConfiguration: () => ({ get: () => undefined, update: () => {} }),
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
    onDidOpenTextDocument: () => ({ dispose: () => {} }),
    onDidChangeTextDocument: () => ({ dispose: () => {} }),
    onDidSaveTextDocument: () => ({ dispose: () => {} }),
    onDidDeleteFiles: () => ({ dispose: () => {} }),
    onDidCloseTextDocument: () => ({ dispose: () => {} }),
    onDidCreateFiles: () => ({ dispose: () => {} }),
    onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
    registerTextDocumentContentProvider: () => ({ dispose: () => {} }),
    textDocuments: [],
    fs: { stat: async () => ({}), readDirectory: async () => [] }
  },
  window: {
    tabGroups: { all: [] },
    showInformationMessage: async () => {},
    showWarningMessage: async () => {},
    showErrorMessage: async () => {},
    createWebviewPanel: () => ({ webview: {}, onDidChangeViewState: () => ({ dispose: () => {} }), onDidDispose: () => ({ dispose: () => {} }) }),
    registerWebviewViewProvider: () => ({ dispose: () => {} }),
    onDidChangeVisibleTextEditors: () => ({ dispose: () => {} }),
    onDidChangeTextEditorSelection: () => ({ dispose: () => {} }),
    createStatusBarItem: () => ({ show: () => {}, hide: () => {}, text: "", command: "" }),
    createTextEditorDecorationType: () => ({ dispose: () => {} }),
    onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
    activeColorTheme: { kind: 2 },
  },
  commands: {
    registerCommand: (name) => {
      // console.log("Registered command:", name);
      return { dispose: () => {} };
    },
    executeCommand: async () => {}
  },
  languages: {
    registerInlineCompletionItemProvider: () => ({ dispose: () => {} }),
    registerDocumentLinkProvider: () => ({ dispose: () => {} }),
    registerCodeLensProvider: () => ({ dispose: () => {} }),
  },
  authentication: {
    onDidChangeSessions: () => ({ dispose: () => {} }),
  },
  ExtensionContext: class {},
  Uri: {
    parse: (s) => ({ toString: () => s, query: '', fsPath: s }),
    joinPath: (uri, p) => ({ toString: () => uri + "/" + p }),
    file: (f) => ({ toString: () => "file://" + f, fsPath: f })
  },
  EventEmitter: class { event = () => ({ dispose: () => {} }) },
  StatusBarAlignment: { Right: 1 },
  ThemeColor: class {},
  FileType: { Directory: 2 },
  DecorationRangeBehavior: { ClosedClosed: 1, ClosedOpen: 2, OpenClosed: 3, OpenOpen: 4 },
  extensions: { all: [] },
  env: { appName: "VS Code", appRoot: "", uriScheme: "vscode" }
};

Module.prototype.require = function (id) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

(async () => {
  try {
    const ext = require('./out/extension.js');
    console.log("Loaded extension.js");
    
    const context = {
      subscriptions: [],
      globalState: { get: () => false, update: () => {} },
      extension: { extensionUri: mockVscode.Uri.parse("mock://ext") },
      extensionUri: mockVscode.Uri.parse("mock://ext"),
      globalStorageUri: mockVscode.Uri.file(path.join(__dirname, "mock-global-dir")),
      workspaceState: { get: () => undefined, update: () => {} },
      secrets: { get: async () => undefined, store: async () => {}, delete: async () => {} }
    };
    
    await ext.activate(context);
    console.log("Activation completed!");
  } catch (e) {
    console.error("Error during activation:", e);
  }
})();
