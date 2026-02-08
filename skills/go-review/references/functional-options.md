# Functional Options Review

## Rules

- **Flag exported `options` struct.** The options struct must be unexported — only `Option` interface and `WithX` constructors should be public.
- **Flag exported `apply` method.** The `apply` method on `Option` must be unexported to prevent third-party option implementations.
- **Flag missing defaults.** Constructor must set sensible defaults before applying options. Suggest explicit default values.
- **Flag non-variadic option parameter.** Options must be `...Option`, not `[]Option` or a single `Option`.
- **Flag missing `WithX` constructor.** Every configurable field needs a corresponding `WithX` function returning `Option`.
- **Flag mixed patterns.** Never mix functional options and parameter objects in the same function.

## Patterns

### Exposed Options — Flag

```go
type Options struct { // exported — anyone can construct directly
    Timeout time.Duration
    Retries int
}

func NewClient(opts Options) *Client { ... }
```

### Exposed Options — Suggest

```go
type options struct { // unexported
    timeout time.Duration
    retries int
}

type Option interface {
    apply(*options) // unexported method
}

func NewClient(opts ...Option) *Client {
    o := options{timeout: 30 * time.Second, retries: 3} // defaults
    for _, opt := range opts {
        opt.apply(&o)
    }
    // ...
}
```

### Missing Defaults — Flag

```go
func NewClient(opts ...Option) *Client {
    var o options // zero values — 0 timeout, 0 retries
    for _, opt := range opts {
        opt.apply(&o)
    }
    // ...
}
```

### Missing Defaults — Suggest

```go
func NewClient(opts ...Option) *Client {
    o := options{
        timeout: 30 * time.Second,
        retries: 3,
    }
    for _, opt := range opts {
        opt.apply(&o)
    }
    // ...
}
```

### WithX Pattern — Good

```go
type timeoutOption struct{ d time.Duration }

func (o timeoutOption) apply(opts *options) { opts.timeout = o.d }

func WithTimeout(d time.Duration) Option { return timeoutOption{d: d} }
```

## Checklist

- [ ] `options` struct is unexported
- [ ] `Option` interface has unexported `apply(*options)` method
- [ ] Constructor sets sensible defaults before applying options
- [ ] Options parameter is variadic `...Option`
- [ ] Every configurable field has a `WithX` constructor
- [ ] Functional options and parameter objects are not mixed in the same function
