# go-write Eval Suite

Evaluation suite for the `go-write` skill. Tests whether the skill improves agent adherence to Go coding conventions.

## Eval Cases

| # | Name | Convention Tested | Key Checks |
|---|------|-------------------|------------|
| 01 | error-handling | Handle-once, `%w` wrapping, sentinels, structured errors | `errors.New` sentinels, `fmt.Errorf` + `%w`, no log-and-return, lowercase messages, `errors.Is`/`errors.As` |
| 02 | interfaces | Small interfaces, compile-time checks, consumer-side, upcasting | `var _ I = (*T)(nil)`, method count ≤ 3, two-value type assertion, unexported mutex |
| 03 | concurrency | WaitGroup lifecycle, context cancel, channel sizing | `wg.Add` before `go`, `defer wg.Done()`, `select` + `ctx.Done()`, channel buffer ≤ 1, clean exit |
| 04 | safety-patterns | Two-value assertions, defensive copies, no panic in libs | `v, ok :=` assertions, `copy()`/`make()`, no `panic`/`os.Exit` outside main, compile-time checks, JSON tags |
| 05 | functional-options | Option interface, WithX constructors, unexported options | `Option` interface + `apply(*options)`, `WithX` constructors, unexported `options` struct, defaults + range loop |

## Running

```bash
# Dry run — verify discovery
npm run eval:dry

# Single experiment
npm run eval:baseline
npm run eval:with-go-write

# Visual comparison
npm run eval:playground
```

## Experiments

| Config | Description |
|--------|-------------|
| `baseline` | Agent without skill — measures default Go convention adherence |
| `with-go-write` | Agent with `go-write` SKILL.md injected via `editPrompt` |

Both use `model: 'sonnet'`, `runs: 3`, `sandbox: 'docker'`, with Go 1.24 installed in setup.

## Assertion Layers

1. **Deterministic** — `go build ./...` and `go vet ./...` must pass. Zero ambiguity.
2. **Pattern checks** — Regex against generated Go source. Fast, repeatable, no LLM cost.

No LLM rubric is needed — all Go conventions map to mechanically verifiable patterns.

## Pass Rate Tracking

| Eval | Baseline (n=3) | With Skill (n=3) | Lift |
|------|----------------|------------------|------|
| 01-error-handling | — | — | — |
| 02-interfaces | — | — | — |
| 03-concurrency | — | — | — |
| 04-safety-patterns | — | — | — |
| 05-functional-options | — | — | — |
