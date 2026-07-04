# Code Bhau Testing Guide: How to Intentionally Break Things

Welcome to the Code Bhau Testing Guide! As an intermediate programmer, you know that the best way to test an error-handling tool is to intentionally write bad code. 

Code Bhau currently supports **20 specific "Error Families"**. This guide will explain what those families are, the exact code you need to write to trigger them, and how to verify that the extension is working correctly.

---

## 🛠️ General Verification: How to Test

Whenever you trigger an error from the list below, here is how you verify Code Bhau is working:

1. **Trigger the Error:** Write the "Bad Code" in your VS Code editor.
2. **Watch the Squiggly:** Wait for VS Code to draw a red squiggly line under the error.
3. **Hover Test:** Hover your mouse over the red squiggly line. 
   * **Expected:** You should see a Code Bhau markdown popup with a witty title, an explanation, and likely fixes.
4. **Sidebar Test:** Look at the "Bhau Says" panel in the VS Code Activity Bar (the sidebar).
   * **Expected:** The sidebar should instantly update to match the error you clicked on, showing the exact same localized explanation and copy-able fixes.
5. **Language Test:** Run the command `Code Bhau: Switch Language` (Ctrl+Shift+P) and change the language.
   * **Expected:** The sidebar should instantly update to the new language (Marathi, Hindi, or English).

---

## 🔥 The 20 Error Families & How to Trigger Them

Here is the exact code you need to write to summon Bhau.

### 1. `missing_module` & `import_error` (Missing Package)
**What it is:** You're trying to import a package that isn't installed in `node_modules`.
**How to trigger (TypeScript/JavaScript):**
```typescript
import axios from 'axios'; // Make sure axios is NOT installed in package.json
```

### 2. `missing_semicolon` & `syntax_error` (Syntax Typos)
**What it is:** Basic syntax errors where the compiler expected one character but got another.
**How to trigger (JavaScript/TypeScript):**
```typescript
const myVar = "hello"
const anotherVar = "world" // Sometimes requires strict linting to flag missing semicolons
// Better Syntax Error trigger:
const name = "John
```

### 3. `undefined_variable` (Ghost Variables)
**What it is:** Using a variable or function that hasn't been declared.
**How to trigger (JavaScript/TypeScript):**
```typescript
console.log(magicNumber); // magicNumber is never defined
```

### 4. `null_reference` (The Billion Dollar Mistake)
**What it is:** Trying to read a property of an object that is `null` or `undefined`.
**How to trigger (JavaScript/TypeScript):**
```typescript
const user = undefined;
console.log(user.name); // TypeError: Cannot read properties of undefined (reading 'name')
```

### 5. `type_error` (Type Mismatch)
**What it is:** Trying to assign the wrong type of data to a strongly typed variable.
**How to trigger (TypeScript):**
```typescript
let age: number = "twenty"; // Type 'string' is not assignable to type 'number'
```

### 6. `react_hook_violation` (Rules of Hooks)
**What it is:** Calling a React hook inside a loop, condition, or nested function.
**How to trigger (React/JSX):**
```jsx
import { useState } from 'react';

function MyComponent({ condition }) {
    if (condition) {
        const [state, setState] = useState(false); // React Hook "useState" is called conditionally
    }
    return <div>Hello</div>;
}
```

### 7. `json_parse_error` (Broken JSON)
**What it is:** A `.json` file has trailing commas or missing quotes.
**How to trigger (JSON):**
Create a `data.json` file:
```json
{
    "name": "Bhau",
    "age": 30, // Trailing comma will cause a JSON parse error
}
```

### 8. `promise_rejection` (Unhandled Promises)
**What it is:** Failing to handle a rejected promise.
**How to trigger (TypeScript/JavaScript):**
```typescript
// Often caught by ESLint or TS checkers
async function fetchData() {
    await fetch("https://broken-api.com").then(res => res.json())
    // Missing catch block
}
```

### 9. `port_in_use` (EADDRINUSE)
**What it is:** Trying to start a server on a port that is already taken.
**How to trigger (Node.js Terminal output simulation):**
Since Code Bhau intercepts diagnostics, you can simulate this by putting this text in a dummy error file or using the Demo Command:
> *Error: listen EADDRINUSE: address already in use 0.0.0.0:3000*

### 10. `git_merge_conflict` (Git Conflicts)
**What it is:** Git conflict markers left in the code.
**How to trigger (Any file):**
```text
<<<<<<< HEAD
const greeting = "Hello Bhau";
=======
const greeting = "Namaste Bhau";
>>>>>>> feature-branch
```

### 11. `infinite_loop` (React Render Loops)
**What it is:** Updating state during a React render phase.
**How to trigger (React):**
```jsx
function BadComponent() {
    const [count, setCount] = useState(0);
    setCount(count + 1); // Causes infinite re-renders
    return <div>{count}</div>;
}
```

### 12. `array_out_of_bounds` (Tuple/Array limits)
**What it is:** Accessing an index that TypeScript knows doesn't exist.
**How to trigger (TypeScript):**
```typescript
const tuple: [string, number] = ["Bhau", 1];
console.log(tuple[2]); // Tuple type has no element at index '2'
```

### 13. `export_error` (Missing Exports)
**What it is:** Trying to import something that the target file doesn't actually export.
**How to trigger (TypeScript):**
```typescript
import { nonexistentFunction } from 'fs'; // fs has no exported member 'nonexistentFunction'
```

### 14. `build_failure` & `missing_dependency`
**What it is:** Generic build errors or missing peer dependencies.
**How to trigger:**
Usually triggered when running a build command, or simulated via Demo Mode:
> *TS2307: Cannot find module './components/Header' or its corresponding type declarations.*

### 15. `env_var_missing` (Missing Environment Variables)
**What it is:** Type errors related to missing `process.env` configurations.
**How to trigger (TypeScript):**
```typescript
// Requires strict null checks in tsconfig
const apiKey: string = process.env.API_KEY; // Type 'string | undefined' is not assignable to type 'string'
```

### 16. `db_connection_failure` & `api_fetch_failure`
**What it is:** Simulated network or database errors.
**How to trigger:**
Use the **Demo Command** (`Code Bhau: Demo With a Sample Error` in the Command Palette) to simulate these backend/network errors, as they are typically runtime errors rather than editor diagnostics.

---

## 🎯 The "Demo Mode" Shortcut

If you don't want to write bad code manually, Code Bhau has a built-in testing tool!

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Search for: **`Code Bhau: Demo With a Sample Error`**.
3. Select an error from the dropdown list.
4. Bhau will instantly load a fake error into the sidebar so you can see exactly how the response, meaning, and fixes are rendered!

Happy breaking! 🛠️
