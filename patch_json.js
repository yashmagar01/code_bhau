const fs = require('fs');
const path = './src/data/errors.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Reorder: move array_out_of_bounds and promise_rejection before null_reference
let arrayIdx = data.findIndex(e => e.id === 'array_out_of_bounds');
const arrayEntry = data.splice(arrayIdx, 1)[0];

let promiseIdx = data.findIndex(e => e.id === 'promise_rejection');
const promiseEntry = data.splice(promiseIdx, 1)[0];

// Fix array_out_of_bounds patterns to not overlap with 'reading API_KEY'
arrayEntry.patterns = arrayEntry.patterns.map(p => p.replace("([\\w]+)", "(\\d+)"));

let nullRefIdx = data.findIndex(e => e.id === 'null_reference');
data.splice(nullRefIdx, 0, arrayEntry, promiseEntry);

// 2. Add content gaps
const typeError = data.find(e => e.id === 'type_error');
typeError.patterns.push("Property .* does not exist on type", "TS2339", "TS7006", "TS7031", "implicitly has an 'any' type");

const nullRef = data.find(e => e.id === 'null_reference');
nullRef.patterns.push("is possibly 'undefined'", "TS18048");

const importError = data.find(e => e.id === 'import_error');
importError.patterns.push("has no exported member", "TS2305");

const syntaxError = data.find(e => e.id === 'syntax_error');
syntaxError.patterns.push("Unterminated string literal");

const buildFailure = data.find(e => e.id === 'build_failure');
buildFailure.patterns.push("CrashLoopBackOff", "ENOTFOUND");

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('errors.json patched successfully');
