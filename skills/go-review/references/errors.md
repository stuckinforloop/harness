# Error Handling Review

## Rules

- **Flag log-and-return.** If an error is both logged and returned, suggest removing the log. Handle once.
- **Flag missing `%w` wrapping.** Every error return should add context. Bare `return err` loses the call chain.
- **Flag "failed to" prefix.** Suggest `"get user: %w"` not `"failed to get user: %w"`.
- **Flag capitalized error messages.** Errors chain with `:` separators. Mid-chain capitals look wrong.
- **Flag `%s` for user-provided strings.** Suggest `%q` to distinguish empty/whitespace values.
- **Flag wrong error naming.** Sentinels: `ErrFoo` / `errFoo`. Types: `FooError`.
- **Flag mixed strategies.** Each error condition should be sentinel, structured, or opaque — not a mix.
- **Flag `fmt.Errorf` sentinels.** Sentinels must use `errors.New` (comparable). `fmt.Errorf` creates non-comparable values.
- **Flag missing `Unwrap`.** Structured errors wrapping a cause must implement `Unwrap() error`.
- **Flag `==` and type assertions for error checks.** Suggest `errors.Is` / `errors.As`.

## Patterns

### Log-and-Return — Flag

```go
if err != nil {
    log.Printf("failed to get user: %v", err)
    return nil, err // double handling
}
```

### Log-and-Return — Suggest

```go
if err != nil {
    return nil, fmt.Errorf("get user %q: %w", id, err)
}
```

### Dynamic Sentinel — Flag

```go
var ErrTimeout = fmt.Errorf("operation timed out") // not comparable
```

### Dynamic Sentinel — Suggest

```go
var ErrTimeout = errors.New("operation timed out")
```

### Missing Unwrap — Flag

```go
type QueryError struct {
    Table string
    Err   error
}

func (e *QueryError) Error() string {
    return fmt.Sprintf("query %s: %v", e.Table, e.Err)
}
// Missing Unwrap — errors.Is won't find underlying cause
```

### Direct Comparison — Flag

```go
if err == ErrNotFound { ... }        // breaks with wrapping
if _, ok := err.(*QueryError); ok {} // breaks with wrapping
```

### Direct Comparison — Suggest

```go
if errors.Is(err, ErrNotFound) { ... }

var qe *QueryError
if errors.As(err, &qe) { ... }
```

## Checklist

- [ ] No log-and-return on the same error
- [ ] Every error return wraps with `fmt.Errorf("context: %w", err)`
- [ ] No "failed to" prefix in error messages
- [ ] Error messages are lowercase
- [ ] User-provided strings use `%q`
- [ ] One strategy per error condition (sentinel, structured, or opaque)
- [ ] Sentinels use `errors.New`, not `fmt.Errorf`
- [ ] Sentinels named `ErrX` / `errX`, types named `XError`
- [ ] Structured errors implement `Unwrap() error` when wrapping a cause
- [ ] All error checks use `errors.Is` / `errors.As`
