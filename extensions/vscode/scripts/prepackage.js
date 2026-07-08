const fs = require("fs");
const path = require("path");

const ncp = require("ncp").ncp;
const { rimrafSync } = require("rimraf");

const {
  validateFilesPresent,
  execCmdSync,
  autodetectPlatformAndArch,
} = require("../../../scripts/util/index");

const { copySqlite } = require("./download-copy-sqlite");
const { generateAndCopyConfigYamlSchema } = require("./generate-copy-config");
const { installAndCopyNodeModules } = require("./install-copy-nodemodule");
const { npmInstall } = require("./npm-install");
const { writeBuildTimestamp, continueDir } = require("./utils");

// Clear folders that will be packaged to ensure clean slate
rimrafSync(path.join(__dirname, "..", "bin"));
rimrafSync(path.join(__dirname, "..", "out"));
fs.mkdirSync(path.join(__dirname, "..", "out", "node_modules"), {
  recursive: true,
});
const guiDist = path.join(__dirname, "..", "..", "..", "gui", "dist");
if (!fs.existsSync(guiDist)) {
  fs.mkdirSync(guiDist, { recursive: true });
}

const skipInstalls = process.env.SKIP_INSTALLS === "true";

// Get the target to package for
let target = undefined;
const args = process.argv;
if (args[2] === "--target") {
  target = args[3];
}
if (!target) {
  const envTarget =
    process.env.CONTINUE_VSCODE_TARGET ||
    process.env.CONTINUE_BUILD_TARGET ||
    process.env.VSCODE_TARGET;
  if (envTarget && typeof envTarget === "string") {
    target = envTarget.trim();
  }
}

let os;
let arch;
if (target) {
  [os, arch] = target.split("-");
} else {
  [os, arch] = autodetectPlatformAndArch();
}

if (os === "alpine") {
  os = "linux";
}
if (arch === "armhf") {
  arch = "arm64";
}
target = `${os}-${arch}`;
console.log("[info] Using target: ", target);

const exe = os === "win32" ? ".exe" : "";

const isWinTarget = target?.startsWith("win");
const isLinuxTarget = target?.startsWith("linux");
const isMacTarget = target?.startsWith("darwin");

void (async () => {
  const startTime = Date.now();
  console.log(
    `[info] Packaging extension for target ${target} - started at ${new Date().toISOString()}`,
  );

  // Make sure we have an initial timestamp file
  writeBuildTimestamp();

  if (!skipInstalls) {
    const installStart = Date.now();
    console.log(`[timer] Starting npm installs at ${new Date().toISOString()}`);
    await Promise.all([generateAndCopyConfigYamlSchema(), npmInstall()]);
    console.log(
      `[timer] npm installs completed in ${Date.now() - installStart}ms`,
    );
  }

  process.chdir(path.join(continueDir, "gui"));

  // Skip JetBrains/IntelliJ copy — that extension is not part of this fork.

  // Then copy over the dist folder to the VSCode extension //
  const vscodeGuiPath = path.join("../extensions/vscode/gui");
  rimrafSync(vscodeGuiPath);
  fs.mkdirSync(vscodeGuiPath, { recursive: true });
  const vscodeCopyStart = Date.now();
  console.log(`[timer] Starting VSCode copy at ${new Date().toISOString()}`);
  await new Promise((resolve, reject) => {
    ncp("dist", vscodeGuiPath, (error) => {
      if (error) {
        console.log(
          "Error copying React app build to VSCode extension: ",
          error,
        );
        reject(error);
      } else {
        console.log("Copied gui build to VSCode extension");
        resolve();
      }
    });
  });
  console.log(
    `[timer] VSCode copy completed in ${Date.now() - vscodeCopyStart}ms`,
  );

  if (!fs.existsSync(path.join("dist", "assets", "index.js"))) {
    throw new Error("gui build did not produce index.js");
  }
  if (!fs.existsSync(path.join("dist", "assets", "index.css"))) {
    throw new Error("gui build did not produce index.css");
  }

  // Copy over native / wasm modules //
  process.chdir("../extensions/vscode");

  fs.mkdirSync("bin", { recursive: true });

  // onnxruntime-node
  let onnxSrc = path.join(__dirname, "../../../core/node_modules/onnxruntime-node/bin");
  if (!fs.existsSync(onnxSrc)) {
    onnxSrc = path.join(__dirname, "../../../node_modules/onnxruntime-node/bin");
  }
  if (fs.existsSync(onnxSrc)) {
    const onnxCopyStart = Date.now();
    console.log(`[timer] Starting onnxruntime copy at ${new Date().toISOString()}`);
    await new Promise((resolve, reject) => {
      ncp(onnxSrc, path.join(__dirname, "../bin"), { dereference: true }, (error) => {
        if (error) {
          console.warn("[info] Error copying onnxruntime-node files", error);
        }
        resolve();
      });
    });
    console.log(`[timer] onnxruntime copy completed in ${Date.now() - onnxCopyStart}ms`);
    if (target) {
      try {
        if (!target.startsWith("darwin")) rimrafSync(path.join(__dirname, "../bin/napi-v3/darwin"));
        if (!target.startsWith("linux")) rimrafSync(path.join(__dirname, "../bin/napi-v3/linux"));
        if (!target.startsWith("win")) rimrafSync(path.join(__dirname, "../bin/napi-v3/win32"));
        if (target.startsWith("linux")) {
          ["libonnxruntime_providers_cuda.so","libonnxruntime_providers_shared.so","libonnxruntime_providers_tensorrt.so"].forEach((file) => {
            const filepath = path.join(__dirname, "../bin/napi-v3/linux/x64", file);
            if (fs.existsSync(filepath)) fs.rmSync(filepath);
          });
        }
      } catch (e) { console.warn("[info] Error removing unused binaries", e); }
    }
    console.log("[info] Copied onnxruntime-node");
  } else {
    console.warn("[warn] onnxruntime-node/bin not found in core/node_modules, skipping. Extension will use bundled bindings.");
  }

  // tree-sitter-wasm
  fs.mkdirSync("out", { recursive: true });

  let treeSitterWasmsSrc = path.join(__dirname, "../../../core/node_modules/tree-sitter-wasms/out");
  if (!fs.existsSync(treeSitterWasmsSrc)) {
    treeSitterWasmsSrc = path.join(__dirname, "../../../node_modules/tree-sitter-wasms/out");
  }
  if (fs.existsSync(treeSitterWasmsSrc)) {
    await new Promise((resolve, reject) => {
      ncp(treeSitterWasmsSrc, path.join(__dirname, "../out/tree-sitter-wasms"), { dereference: true }, (error) => {
        if (error) { console.warn("[error] Error copying tree-sitter-wasm files", error); }
        resolve();
      });
    });
  } else {
    console.warn("[warn] tree-sitter-wasms not found, skipping.");
  }

  const filesToCopy = [
    "../../../core/vendor/tree-sitter.wasm",
    "../../../core/llm/llamaTokenizerWorkerPool.mjs",
    "../../../core/llm/llamaTokenizer.mjs",
    "../../../core/llm/tiktokenWorkerPool.mjs",
    "../../../core/util/start_ollama.sh",
  ];

  for (const f of filesToCopy) {
    const src = path.join(__dirname, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(__dirname, "..", "out", path.basename(f)));
      console.log(`[info] Copied ${path.basename(f)}`);
    } else {
      console.warn(`[warn] Skipping missing file: ${path.basename(f)}`);
    }
  }

  // tree-sitter tag query files
  // ncp(
  //   path.join(
  //     __dirname,
  //     "../../../core/node_modules/llm-code-highlighter/dist/tag-qry",
  //   ),
  //   path.join(__dirname, "../out/tag-qry"),
  //   (error) => {
  //     if (error)
  //       console.warn("Error copying code-highlighter tag-qry files", error);
  //   },
  // );

  // textmate-syntaxes
  await new Promise((resolve, reject) => {
    ncp(
      path.join(__dirname, "../textmate-syntaxes"),
      path.join(__dirname, "../gui/textmate-syntaxes"),
      (error) => {
        if (error) {
          console.warn("[error] Error copying textmate-syntaxes", error);
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });

  const lancedbPackagesByTarget = {
    "darwin-arm64": "@lancedb/vectordb-darwin-arm64",
    "darwin-x64": "@lancedb/vectordb-darwin-x64",
    "linux-arm64": "@lancedb/vectordb-linux-arm64-gnu",
    "linux-x64": "@lancedb/vectordb-linux-x64-gnu",
    "win32-x64": "@lancedb/vectordb-win32-x64-msvc",
    "win32-arm64": "@lancedb/vectordb-win32-arm64-msvc",
  };

  const packageToInstall = lancedbPackagesByTarget[target];
  let packageDirName;
  let expectedPackagePath;
  if (packageToInstall) {
    packageDirName = packageToInstall.split("/").pop();
    expectedPackagePath = path.join(
      __dirname,
      "..",
      "node_modules",
      "@lancedb",
      packageDirName,
    );
    if (!fs.existsSync(expectedPackagePath)) {
      expectedPackagePath = path.join(
        __dirname,
        "../../..",
        "node_modules",
        "@lancedb",
        packageDirName,
      );
    }

    if (!fs.existsSync(expectedPackagePath)) {
      console.warn(
        `[warn] LanceDB binary not found for ${target} at ${expectedPackagePath}. Skipping (codebase indexing may be limited).`,
      );
      // Reset so the copy step below is also skipped
      packageDirName = undefined;
      expectedPackagePath = undefined;
    } else {
      console.log(
        `[info] LanceDB binary already present for ${target} at ${expectedPackagePath}`,
      );
    }
  } else {
    console.warn(
      `[warn] No LanceDB package mapping found for target ${target}`,
    );
  }

  if (!skipInstalls) {
    await copySqlite(target);
  } else {
    console.log("[info] Skipping sqlite download because SKIP_INSTALLS=true");
  }

  let sqliteBuildSrc = path.join(__dirname, "../../../core/node_modules/sqlite3/build");
  if (!fs.existsSync(sqliteBuildSrc)) {
    sqliteBuildSrc = path.join(__dirname, "../../../node_modules/sqlite3/build");
  }
  if (fs.existsSync(sqliteBuildSrc)) {
    console.log("[info] Copying sqlite node binding from core");
    await new Promise((resolve) => {
      ncp(sqliteBuildSrc, path.join(__dirname, "../out/build"), { dereference: true }, (error) => {
        if (error) console.warn("[error] Error copying sqlite3 files", error);
        resolve();
      });
    });
    await new Promise((resolve) => {
      ncp(sqliteBuildSrc, path.join(__dirname, "../out"), { dereference: true }, (error) => {
        if (error) console.warn("[error] Error copying sqlite3 files", error);
        resolve();
      });
    });
  } else {
    console.warn("[warn] sqlite3/build not found in core/node_modules, skipping.");
  }

  // Copy node_modules for pre-built binaries
  const NODE_MODULES_TO_COPY = ["@lancedb", "@vscode/ripgrep", "workerpool"];

  fs.mkdirSync("out/node_modules", { recursive: true });

  await Promise.all(
    NODE_MODULES_TO_COPY.map(
      (mod) =>
        new Promise((resolve) => {
          let srcPath = `node_modules/${mod}`;
          if (!fs.existsSync(srcPath)) {
            srcPath = path.join(__dirname, "../../..", "node_modules", mod);
          }
          if (!fs.existsSync(srcPath)) {
            console.warn(`[warn] Skipping missing node_module: ${mod}`);
            return resolve();
          }
          fs.mkdirSync(`out/node_modules/${mod}`, { recursive: true });
          ncp(srcPath, `out/node_modules/${mod}`, { dereference: true }, function (error) {
            if (error) console.error(`[error] Error copying ${mod}`, error);
            else console.log(`[info] Copied ${mod}`);
            resolve();
          });
        }),
    ),
  );

  console.log(`[info] Processed ${NODE_MODULES_TO_COPY.join(", ")}`);

  if (packageDirName && expectedPackagePath) {
    const expectedOutPackagePath = path.join(
      __dirname,
      "..",
      "out",
      "node_modules",
      "@lancedb",
      packageDirName,
    );
    const expectedOutIndexPath = path.join(
      expectedOutPackagePath,
      "index.node",
    );
    if (!fs.existsSync(expectedOutIndexPath)) {
      rimrafSync(expectedOutPackagePath);
      fs.mkdirSync(expectedOutPackagePath, { recursive: true });
      fs.cpSync(expectedPackagePath, expectedOutPackagePath, {
        recursive: true,
        dereference: true,
      });
      console.log(`[info] Copied LanceDB binary to ${expectedOutPackagePath}`);
    } else {
      console.log(
        `[info] LanceDB binary already copied at ${expectedOutIndexPath}`,
      );
    }
  }

  // Copy over any worker files
  let xhrWorkerSrc = "node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js";
  if (!fs.existsSync(xhrWorkerSrc)) {
    xhrWorkerSrc = path.join(__dirname, "../../..", "node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js");
  }
  if (fs.existsSync(xhrWorkerSrc)) {
    fs.cpSync(xhrWorkerSrc, "out/xhr-sync-worker.js");
    console.log("[info] Copied xhr-sync-worker.js");
  } else {
    console.warn("[warn] jsdom xhr-sync-worker not found, skipping.");
  }

  // Check for critical files — these must exist or the extension won't work at all
  const vscodeExt = path.join(__dirname, "..");
  const criticalFiles = [
    "gui/assets/index.js",
    "gui/assets/index.css",
    "config_schema.json",
  ];
  const missingCritical = criticalFiles.filter(
    (f) => !fs.existsSync(path.join(vscodeExt, f)),
  );
  if (missingCritical.length > 0) {
    throw new Error(
      `Missing critical files:\n  - ${missingCritical.join("\n  - ")}`,
    );
  }

  // Warn about optional files that may be missing in this fork
  const optionalFiles = [
    "out/tree-sitter.wasm",
    "out/xhr-sync-worker.js",
    "out/build/Release/node_sqlite3.node",
    `bin/napi-v3/${os}/${arch}/onnxruntime_binding.node`,
  ];
  for (const f of optionalFiles) {
    if (!fs.existsSync(path.join(vscodeExt, f))) {
      console.warn(`[warn] Optional file missing (may affect some features): ${f}`);
    }
  }

  console.log(
    `[timer] Prepackage completed in ${Date.now() - startTime}ms - finished at ${new Date().toISOString()}`,
  );
  process.exit(0);
})();
