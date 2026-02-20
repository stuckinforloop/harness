The `src/` directory contains a Go file (`main.go`) with safety-critical code patterns.
Write a file `src/assertions.ts` that uses **ast-grep** relational rules
(`sg scan --inline-rules`) to verify the following safety conventions:

1. **No panic outside main** — Verify that `panic()` calls only appear inside the
   `main` function. Use `sg scan --inline-rules` with a YAML rule combining `pattern`,
   `not`, and `inside` with `kind: function_declaration`. Include `stopBy: end`.

2. **No os.Exit outside main** — Same approach as above but for `os.Exit($CODE)`.

3. **Unexported mutex in struct** — Verify that mutex fields in structs use an
   unexported name (e.g., `mu sync.Mutex`). Use `sg scan --inline-rules` with a
   rule matching `kind: field_declaration` with pattern `mu sync.$MUTEX_TYPE`
   `inside` a `kind: struct_type`.

Requirements:
- Use `sg scan --inline-rules '...' --json` for all checks (not `sg run`).
- Each rule must be a JSON-stringified YAML rule object with `id`, `language`, and `rule`.
- Handle `sg scan` exit code 1 (it exits 1 when matches are found).
- Export a `runChecks()` function that returns `{ passed: boolean; results: string[] }`.
- Do NOT use regex to match Go code patterns — use ast-grep's relational rules.
