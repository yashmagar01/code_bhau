/**
 * Code Bhau — Smoke Test Runner (plain JS, runs against compiled out/)
 *
 * Usage:
 *   npm run compile
 *   node test/smokeTest.js
 */

const path = require('path');
const { ErrorClassifier } = require('../out/classifier/ErrorClassifier');
const { ResponseSelector } = require('../out/utils/ResponseSelector');

const CASES = [
  { message: "Cannot find module 'axios'", expectedId: 'missing_module' },
  { message: "Module not found: Error: Can't resolve 'react'", expectedId: 'missing_module' },
  { message: "TS2307: Cannot find module './components/Header'", expectedId: 'missing_module' },
  { message: "'useState' is not defined  no-undef", expectedId: 'undefined_variable' },
  { message: "ReferenceError: process is not defined", expectedId: 'undefined_variable' },
  { message: "NameError: name 'foo' is not defined", expectedId: 'undefined_variable' },
  { message: "TypeError: Cannot read properties of undefined (reading 'map')", expectedId: 'null_reference' },
  { message: "NullPointerException at com.foo.Bar.run(Bar.java:42)", expectedId: 'null_reference' },
  { message: "Cannot read property 'name' of null", expectedId: 'null_reference' },
  { message: "Expected ';' (Line 12, Col 5)", expectedId: 'missing_semicolon' },
  { message: "Parsing error: Unexpected token, expected ;", expectedId: 'missing_semicolon' },
  { message: "SyntaxError: Unexpected token } in JSON at position 0", expectedId: 'syntax_error' },
  { message: "SyntaxError: Unexpected end of input", expectedId: 'syntax_error' },
  { message: "Rendered more hooks than during the previous render.", expectedId: 'react_hook_violation' },
  { message: "Minified React error #321", expectedId: 'react_hook_violation' },
  { message: "Maximum update depth exceeded. This can happen when a component calls setState inside componentWillUpdate.", expectedId: 'infinite_loop' },
  { message: "RangeError: Maximum call stack size exceeded", expectedId: 'infinite_loop' },
  { message: "npm ERR! code ERESOLVE unable to resolve dependency tree", expectedId: 'missing_dependency' },
  { message: "Failed to fetch", expectedId: 'api_fetch_failure' },
  { message: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource.", expectedId: 'api_fetch_failure' },
  { message: "Unexpected token < in JSON at position 0", expectedId: 'json_parse_error' },
  { message: "Unexpected end of JSON input", expectedId: 'json_parse_error' },
  { message: "IndexError: list index out of range", expectedId: 'array_out_of_bounds' },
  { message: "ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 3", expectedId: 'array_out_of_bounds' },
  { message: "UnhandledPromiseRejectionWarning: Error: something failed", expectedId: 'promise_rejection' },
  { message: "CONFLICT (content): Merge conflict in src/index.ts", expectedId: 'git_merge_conflict' },
  { message: "error: failed to push some refs to 'origin'", expectedId: 'git_merge_conflict' },
  { message: "Error: listen EADDRINUSE: address already in use 0.0.0.0:3000", expectedId: 'port_in_use' },
  { message: "Cannot read properties of undefined (reading 'API_KEY')", expectedId: 'null_reference' },
  { message: "Missing required environment variable: API_KEY", expectedId: 'env_var_missing' },
  { message: "Error: NEXT_PUBLIC_API_URL environment variable is not set", expectedId: 'env_var_missing' },
  { message: "connect ECONNREFUSED 127.0.0.1:5432", expectedId: 'db_connection_failure' },
  { message: "password authentication failed for user 'postgres'", expectedId: 'db_connection_failure' },
  { message: "TS2322: Type 'string' is not assignable to type 'number'.", expectedId: 'type_error' },
  { message: "TypeError: foo is not a function", expectedId: 'type_error' },
  { message: "Build failed with errors. See log for details.", expectedId: 'build_failure' },
  { message: "npm ERR! code ELIFECYCLE", expectedId: 'build_failure' },
  { message: "Cannot find name 'foo'.", expectedId: 'undefined_variable' },
  { message: "Duplicate declaration 'foo'", expectedId: 'export_error' },
  { message: "Only one default export allowed per module.", expectedId: 'export_error' },
  { message: "SyntaxError: Cannot use import statement outside a module", expectedId: 'import_error' },
  { message: "TS1192: Module \"./foo\" has no exported member 'Bar'.", expectedId: 'import_error' },
];

function main() {
  const classifier = new ErrorClassifier();
  const selector = new ResponseSelector({ maxHistoryPerError: 5 });

  console.log('============================================================');
  console.log('  Code Bhau — Smoke Test');
  console.log('============================================================');
  console.log('  Loaded families:    ' + classifier.entries.length);
  console.log('  Compiled patterns:  ' + classifier.patternCount);
  console.log('  Test cases:         ' + CASES.length);
  console.log('------------------------------------------------------------\n');

  let pass = 0;
  let fail = 0;
  const failures = [];

  for (const c of CASES) {
    const match = classifier.classifyDiagnostic({ message: c.message });
    if (!match) {
      fail++;
      failures.push('  [NO MATCH]  "' + c.message + '"  (expected ' + c.expectedId + ')');
      continue;
    }
    if (match.entry.id !== c.expectedId) {
      fail++;
      failures.push('  [WRONG]     "' + c.message + '"\n              got ' + match.entry.id + ', expected ' + c.expectedId);
      continue;
    }
    pass++;
    const response = selector.select(match.entry, 'marathi');
    const msgShort = c.message.length > 60 ? c.message.slice(0, 57) + '...' : c.message;
    const respShort = response.length > 50 ? response.slice(0, 47) + '...' : response;
    console.log('  OK  ' + msgShort.padEnd(60) + '  ->  ' + match.entry.id.padEnd(28) + '  "' + respShort + '"');
  }

  console.log('\n------------------------------------------------------------');
  console.log('  Pass: ' + pass + '    Fail: ' + fail);
  console.log('------------------------------------------------------------\n');

  // Anti-repetition test
  console.log('  Anti-repetition test (10 picks on missing_module, Marathi):');
  const entry = classifier.getById('missing_module');
  const picks = [];
  for (let i = 0; i < 10; i++) picks.push(selector.select(entry, 'marathi'));
  const unique = new Set(picks).size;
  console.log('    unique picks: ' + unique + ' / 10');
  for (let i = 1; i < picks.length; i++) {
    if (picks[i] === picks[i - 1]) {
      fail++;
      failures.push('  [REPEAT]    consecutive picks [' + (i - 1) + ',' + i + '] are identical');
    }
  }

  // Database integrity test
  console.log('\n  Database integrity check:');
  let integrityFail = 0;
  for (const e of classifier.entries) {
    const m = e.responses.marathi.length;
    const h = e.responses.hindi.length;
    const en = e.responses.english.length;
    if (m !== 10 || h !== 10 || en !== 10) {
      integrityFail++;
      console.log('    X  ' + e.id + '  marathi=' + m + ' hindi=' + h + ' english=' + en);
    }
  }
  if (integrityFail === 0) {
    console.log('    OK  All ' + classifier.entries.length + ' families have 10/10/10 responses.');
  } else {
    fail += integrityFail;
  }

  // Language coverage test
  console.log('\n  Language coverage test (one pick per family per language):');
  const langs = ['marathi', 'hindi', 'english'];
  let langFail = 0;
  for (const e of classifier.entries) {
    for (const lang of langs) {
      const r = selector.select(e, lang);
      if (!r || r.length === 0) {
        langFail++;
        console.log('    X  ' + e.id + ' [' + lang + '] returned empty');
      }
    }
  }
  if (langFail === 0) {
    console.log('    OK  All ' + classifier.entries.length + ' families x 3 languages returned a response.');
  }

  // Personality safety test
  const FORBIDDEN = ['idiot', 'stupid', 'garbage', 'trash code', 'you suck', 'moron', 'dumb'];
  console.log('\n  Personality safety test (forbidden phrases):');
  let safetyFail = 0;
  for (const e of classifier.entries) {
    const all = [].concat(e.responses.marathi, e.responses.hindi, e.responses.english);
    for (const phrase of FORBIDDEN) {
      for (const r of all) {
        if (r.toLowerCase().indexOf(phrase) !== -1) {
          safetyFail++;
          console.log('    X  ' + e.id + ' contains "' + phrase + '": "' + r + '"');
        }
      }
    }
  }
  if (safetyFail === 0) {
    console.log('    OK  No forbidden phrases across ' + classifier.entries.length + ' families.');
  }

  console.log('\n------------------------------------------------------------');
  if (failures.length > 0) {
    console.log('  FAILURES:');
    for (const f of failures) console.log(f);
    console.log('\n  SMOKE TEST FAILED.');
    process.exit(1);
  } else {
    console.log('  ALL SMOKE TESTS PASSED.');
  }
  console.log('============================================================');
}

main();
