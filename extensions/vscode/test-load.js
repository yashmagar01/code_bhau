const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'vscode') {
    return {
      workspace: {},
      window: {},
      commands: {},
      ExtensionContext: class {}
    };
  }
  return originalRequire.apply(this, arguments);
};

try {
  require('./out/extension.js');
  console.log("Successfully loaded extension.js");
} catch (e) {
  console.error("Failed to load extension.js:", e);
}
