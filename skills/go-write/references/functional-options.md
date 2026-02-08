# Functional Options

## Rules

- **Define an `Option` interface** with an unexported `apply(*options)` method. This prevents external packages from creating arbitrary options.
- **Use `WithX` constructors** that return `Option` for each configurable parameter.
- **Concrete option types** implement the interface. Each option is its own type.
- **Sensible defaults** in the constructor. Options override defaults, not the other way around.

## Patterns

### Option Interface

```go
type Option interface {
    apply(*options)
}

// unexported options struct holds all configurable values
type options struct {
    timeout    time.Duration
    retries    int
    baseURL    string
}
```

### Concrete Option Types

```go
type timeoutOption struct {
    timeout time.Duration
}

func (o timeoutOption) apply(opts *options) {
    opts.timeout = o.timeout
}

func WithTimeout(d time.Duration) Option {
    return timeoutOption{timeout: d}
}
```

### Alternative: Function-Based Options

```go
type optionFunc func(*options)

func (f optionFunc) apply(opts *options) {
    f(opts)
}

func WithRetries(n int) Option {
    return optionFunc(func(o *options) {
        o.retries = n
    })
}
```

### Constructor with Defaults

```go
func NewClient(opts ...Option) *Client {
    // sensible defaults
    o := options{
        timeout: 30 * time.Second,
        retries: 3,
        baseURL: "https://api.example.com",
    }

    for _, opt := range opts {
        opt.apply(&o)
    }

    return &Client{
        timeout: o.timeout,
        retries: o.retries,
        baseURL: o.baseURL,
    }
}
```

### Usage

```go
client := NewClient(
    WithTimeout(10 * time.Second),
    WithRetries(5),
)
```

## Checklist

- [ ] `Option` interface with unexported `apply(*options)` method
- [ ] Each option has a `WithX` constructor returning `Option`
- [ ] Constructor uses variadic `...Option` parameter
- [ ] Defaults set before applying options
- [ ] Options don't expose internal `options` struct
