# API Evolution

## Rules

- **Know what breaks.** Removing exports, changing signatures, and adding interface methods are all breaking changes. Plan for all three before v1.0.
- **Use parameter objects when there are required fields or many options.** Struct fields can be added freely. New fields with zero-value defaults don't change existing behavior.
- **Use functional options when all params are optional and there are few.** Good for clean call sites with 0-2 options. Poor when there are required fields or many options.
- **Never mix param objects and functional options in the same function.** Pick one pattern per function.
- **Use result objects for growing returns.** You cannot add return values to a function. Wrap returns in a struct from the start if growth is likely.
- **Extend interfaces via upcasting, not modification.** Define a new interface embedding the old one. Check at runtime with a type assertion and provide a fallback.
- **Prepare variadic options early.** Adding `...Option` to an existing function is breaking. If you might need options later, add the variadic parameter from the start with an empty `Option` type.

## Patterns

### Parameter Object — Growing Inputs

```go
type ConnectConfig struct {
    Addr    string
    Timeout time.Duration
    TLS     bool          // added in v2 — zero value = false = old behavior
    Logger  *slog.Logger  // added in v3 — zero value = nil = no logging
}

func Connect(ctx context.Context, cfg ConnectConfig) (*Conn, error) {
    if cfg.Logger == nil {
        cfg.Logger = slog.New(slog.NewTextHandler(io.Discard, nil))
    }
    // ...
}
```

### Functional Options — Optional-Only Params

```go
type options struct {
    timeout time.Duration
    cache   bool
}

type Option interface {
    apply(*options)
}

type timeoutOption struct{ d time.Duration }
func (o timeoutOption) apply(opts *options) { opts.timeout = o.d }
func WithTimeout(d time.Duration) Option    { return timeoutOption{d: d} }

type cacheOption struct{}
func (cacheOption) apply(opts *options)  { opts.cache = true }
func WithCache() Option                  { return cacheOption{} }

func Connect(addr string, opts ...Option) (*Conn, error) {
    o := options{timeout: time.Second} // defaults
    for _, opt := range opts {
        opt.apply(&o)
    }
    // ...
}

// Usage:
// Connect(addr)
// Connect(addr, WithTimeout(5*time.Second))
// Connect(addr, WithTimeout(5*time.Second), WithCache())
```

### When to Use Which

| Criteria | Parameter Object | Functional Options |
|----------|------------------|--------------------|
| Required fields exist | Yes | No — all must be optional |
| No options at call site | Requires empty struct `Foo(Config{})` | Clean: `Foo(addr)` |
| Many options at call site | Named fields, no package prefix | `pkg.WithX` repeated |
| Testing options | Plain struct literal | Need helper to inspect |
| Namespace cost | One struct type | One `WithX` per option — permanent |

### Result Object — Growing Outputs

```go
type UpsertResult struct {
    Entries  []*Entry
    Created  int // added in v2
    Modified int // added in v3
}

func (c *Client) Upsert(ctx context.Context, req UpsertRequest) (UpsertResult, error) {
    // ...
}
```

### Interface Extension via Upcasting

```go
// v1: base interface
type Source interface {
    io.Reader
    Name() string
}

// v2: optional extension — existing implementations still work
type OffsetSource interface {
    Source
    Offset() int64
}

func New(src Source) *Parser {
    osrc, ok := src.(OffsetSource)
    if !ok {
        osrc = &nopOffsetSource{src} // fallback wrapper
    }
    return &Parser{src: osrc}
}

type nopOffsetSource struct{ Source }
func (*nopOffsetSource) Offset() int64 { return 0 }
```

### Pre-Planning Variadic Options

```go
// v1: no options yet, but variadic is in place
type Option interface{ unimplemented() }

func Connect(addr string, opts ...Option) (*Conn, error) {
    // ignore opts for now
}

// v2: add options without breaking callers
type Option interface{ apply(*options) }
```

## Checklist

- [ ] Functions likely to grow use parameter objects or functional options from the start
- [ ] Parameter objects are used when there are required fields
- [ ] Functional options are used when all params are optional and few
- [ ] No function mixes both patterns
- [ ] Result objects are used when return values may grow
- [ ] Interfaces grow via upcasting + fallback, not method addition
- [ ] Variadic option parameters are added preemptively if growth is expected
- [ ] New struct fields default to zero-value behavior matching the previous version
