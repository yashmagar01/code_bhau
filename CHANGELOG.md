# Changelog

All notable changes to Code Bhau will be documented here.

## [1.0.0] — Initial Public Release

**The first public release of Code Bhau.**

### Added
- Offline error classification engine covering 20 common beginner error families across TypeScript, JavaScript, React, Node, Python, Go, and Java
- 600 hand-written responses (10 per error family, in each of Marathi, Hindi, and English)
- Hover UI — inline explanation on any red squiggle diagnostic
- Sidebar panel (activity bar) with full explanation, meaning, and one-click copy-to-clipboard fixes
- Anti-repetition response selector so explanations don't feel robotic on repeat errors
- `Code Bhau: Demo With a Sample Error` command for trying it out without writing broken code first
- Language switcher (`codeBhau.language`) between Marathi, Hindi, and English

### Fixed (pre-release hardening)
- Corrected classifier matching so TypeScript diagnostic codes (e.g. `TS2322`, `TS2305`, `TS7006`) are reliably recognized alongside plain-text messages
- Resolved a pattern-priority issue where broader "undefined/null reference" matching was silently overriding more specific array-bounds and promise-rejection detections
- Added coverage for several previously-unmatched, high-frequency beginner errors: implicit-`any` parameters, `Property 'X' does not exist on type`, `'X' is possibly 'undefined'`, `Module has no exported member`, and unterminated string literals

---

_Have a suggestion or found an error Code Bhau doesn't catch yet? [Open an issue](https://github.com/yashmagar01/code_bhau/issues) — this project grows from real reports._
