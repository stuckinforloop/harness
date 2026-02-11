The `src/` directory contains a Go file (`main.go`) with interface-related code patterns.
Write a file `src/assertions.ts` that uses **ast-grep** to structurally verify
the following interface conventions:

1. **Compile-time interface check** — At least one `var _ $IFACE = (*$IMPL)(nil)`
   declaration exists. Use `sg run --pattern` to match this pattern.

2. **Interface method count ≤ 3** — All interfaces have at most 3 methods. Use
   `sg scan --inline-rules` with `kind: interface_type` to find interfaces, then
   `kind: method_spec` with `inside: { kind: interface_type }` to count methods
   per interface.

3. **Two-value type assertion** — At least one two-value type assertion
   (`$VAL, ok := $EXPR.($TYPE)`) exists. Use `sg run --pattern` to match this.

Requirements:
- Use `sg run --pattern '...' --lang go --json` for simple pattern checks.
- Use `sg scan --inline-rules '...' --json` for structural/relational checks.
- Parse JSON output to count and validate matches.
- Export a `runChecks()` function that returns `{ passed: boolean; results: string[] }`.
- Do NOT use regex to match Go code patterns — use ast-grep structural matching.
