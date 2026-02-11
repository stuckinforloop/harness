# ast-grep Eval Suite

Evaluation suite for the `ast-grep` skill. Tests whether the skill enables agents to write structural code assertions using ast-grep instead of regex.

## Eval Cases

| # | Name | Convention Tested | Key Checks |
|---|------|-------------------|------------|
| 01 | pattern-matching | Simple `sg run --pattern` usage | `errors.New` sentinels, `fmt.Errorf` + `%w` wrapping, `errors.Is`/`errors.As` via ast-grep patterns |
| 02 | relational-rules | `sg scan --inline-rules` with `inside`/`has`/`not` | No `panic` outside main, no `os.Exit` outside main, unexported mutex in struct |
| 03 | go-conventions | Interface convention checks via ast-grep | `var _ I = (*T)(nil)`, interface method count ≤ 3, two-value type assertions |

## Running

```bash
# Dry run — verify discovery
npm run eval:dry

# Single experiment
npm run eval:baseline
npm run eval:with-ast-grep

# Visual comparison
npm run eval:playground
```

## Experiments

| Config | Description |
|--------|-------------|
| `baseline` | Agent without skill — measures default ast-grep usage |
| `with-ast-grep` | Agent with `ast-grep` SKILL.md injected via `editPrompt` |

Both use `model: 'sonnet'`, `runs: 3`, `sandbox: 'docker'`, with Go 1.24 and ast-grep installed in setup.

## Assertion Layers

1. **Deterministic** — `go build ./...` and `go vet ./...` must pass on the sample Go code.
2. **File existence** — Agent must create `src/assertions.ts`.
3. **Pattern checks** — Verify the agent's assertions file uses ast-grep CLI (`sg run`/`sg scan`) instead of regex for structural Go code checks.

No LLM rubric is needed — all checks are mechanically verifiable by inspecting the generated assertions file.

## Pass Rate Tracking

| Eval | Baseline (n=3) | With Skill (n=3) | Lift |
|------|----------------|------------------|------|
| 01-pattern-matching | — | — | — |
| 02-relational-rules | — | — | — |
| 03-go-conventions | — | — | — |
