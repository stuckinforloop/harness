# Error Handling

## Rules

- **Handle errors exactly once.** Either log or return — never both. Double-handling creates noise.
- **Choose strategy by caller need.** Sentinel when callers match by identity. Structured type when callers need fields. Opaque `%w` wrapping when callers just propagate.
- **One strategy per error.** Don't define a sentinel AND a structured type for the same condition.
- **Wrap with context** using `fmt.Errorf("operation: %w", err)`. Keep messages lowercase and concise.
- **No "failed to" prefix.** The call stack already implies failure. Write `"get user: %w"` not `"failed to get user: %w"`.
- **Don't capitalize error messages.** Errors chain with `:` separators. A capitalized segment looks wrong mid-chain.
- **Use `%q` to quote strings.** Distinguishes empty strings and special characters: `fmt.Errorf("user %q not found: %w", name, err)`.
- **Sentinel errors are immutable constants.** Define with `errors.New` at package level. Name exported `ErrFoo`, unexported `errFoo`.
- **Structured errors implement `Unwrap`.** Any type wrapping a cause must implement `Unwrap() error` for `errors.Is`/`errors.As` traversal.
- **Name structured error types `FooError`.** Implement `Error() string`. Include only fields callers actually need.

## Patterns

### Wrapping — Bad

```go
if err != nil {
    log.Printf("Failed to get user: %v", err)  // logged
    return nil, err                              // AND returned — double handling
}
```

### Wrapping — Good

```go
if err != nil {
    return nil, fmt.Errorf("get user %q: %w", id, err)
}
```

### Sentinel Errors — Callers Branch on Identity

```go
var (
    ErrNotFound   = errors.New("not found")
    errPoolClosed = errors.New("pool closed") // unexported
)

// Caller
if errors.Is(err, store.ErrNotFound) {
    // handle missing item
}
```

### Structured Errors — Callers Need Fields

```go
type QueryError struct {
    Query string
    Table string
    Err   error
}

func (e *QueryError) Error() string {
    return fmt.Sprintf("query table %q: %v", e.Table, e.Err)
}

func (e *QueryError) Unwrap() error { return e.Err }

// Caller extracts structured data
var qe *QueryError
if errors.As(err, &qe) {
    log.Printf("failed on table %s", qe.Table)
}
```

### Decision Tree

```
Does the caller need to check for this specific condition?
├── No  → opaque wrapping: fmt.Errorf("context: %w", err)
├── Yes, but only identity → sentinel: var ErrX = errors.New("x")
└── Yes, and needs data   → structured: type XError struct { ... }
```

## Checklist

- [ ] Every error return wraps with context using `%w`
- [ ] Error messages are lowercase, no "failed to" prefix
- [ ] No log-and-return on the same error
- [ ] String values use `%q` in error messages
- [ ] Each error has one strategy — sentinel, structured, or opaque
- [ ] Sentinels use `errors.New`, named `ErrX` / `errX`
- [ ] Structured errors implement `Error()` and `Unwrap()`, named `XError`
- [ ] Callers use `errors.Is` / `errors.As`, not `==` or type assertion
