The `src/` directory contains a Go file (`main.go`) with error handling patterns.
Write a file `src/assertions.ts` that uses **ast-grep** (`sg` CLI) to structurally
verify the following conventions in the Go code:

1. **Sentinel errors** — At least 2 package-level sentinel errors defined with
   `errors.New` (variables starting with `Err`). Use `sg run --pattern` to match
   `var $ERR = errors.New($MSG)` and filter for names starting with `Err`.

2. **Error wrapping** — At least 2 uses of `fmt.Errorf` with the `%w` verb for
   error wrapping. Use `sg run --pattern` to find `fmt.Errorf($$$ARGS)` calls
   and filter for `%w` presence in the matched text.

3. **errors.Is / errors.As usage** — At least one call to `errors.Is` or
   `errors.As`. Use `sg run --pattern` for each.

Requirements:
- Use `sg run --pattern '...' --lang go --json` for all checks.
- Parse the JSON output to count and filter matches.
- Use `execSync` from `child_process` to invoke `sg`.
- Export a `runChecks()` function that returns `{ passed: boolean; results: string[] }`.
- Do NOT use regex to match Go code patterns — use ast-grep's structural matching.
