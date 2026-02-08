# API Design

## Rules

- **Exported symbols are permanent.** Once a type, function, or variable is exported, removing it breaks callers. Only export what you intend to support forever.
- **Function signatures are fixed.** You cannot add, remove, or reorder parameters or return values without breaking every caller.
- **Interfaces are immutable.** Adding a method to an interface breaks every existing implementation.
- **Use parameter objects for >3 args.** Group related parameters into a dedicated struct. Keep `context.Context` as a separate first argument.
- **Use result objects for >2 returns.** Group related return values into a dedicated struct. Keep `error` as a separate last return value.
- **Design for zero value usability.** Structs used as parameter or result objects should have sensible zero-value defaults.

## Patterns

### Growing Function Parameters — Bad

```go
// v1
func Connect(addr string, timeout time.Duration) (*Conn, error) { ... }

// v2 — breaks all callers
func Connect(addr string, timeout time.Duration, tls bool) (*Conn, error) { ... }
```

### Growing Function Parameters — Good

```go
type ConnectParams struct {
    Addr    string
    Timeout time.Duration
    TLS     bool // added in v2 — zero value preserves old behavior
}

func Connect(ctx context.Context, p ConnectParams) (*Conn, error) { ... }
```

### Growing Return Values — Bad

```go
// v1
func Parse(s string) (int, error) { ... }

// v2 — breaks all callers
func Parse(s string) (int, string, error) { ... }
```

### Growing Return Values — Good

```go
type ParseResult struct {
    Value    int
    Warnings []string // added in v2 — zero value is nil
}

func Parse(s string) (ParseResult, error) { ... }
```

### Interface Growth — Bad

```go
// v1
type Store interface {
    Get(key string) ([]byte, error)
}

// v2 — breaks every implementation
type Store interface {
    Get(key string) ([]byte, error)
    Set(key string, val []byte) error
}
```

### Interface Growth — Good

```go
// Keep the original interface small
type Store interface {
    Get(key string) ([]byte, error)
}

// Extend with a separate interface
type ReadWriteStore interface {
    Store
    Set(key string, val []byte) error
}
```

## Checklist

- [ ] Exported symbols are intentional — no accidental exports
- [ ] Functions with >3 parameters use a parameter struct
- [ ] Functions with >2 return values use a result struct
- [ ] `context.Context` is always a separate first argument, not in a param struct
- [ ] `error` is always a separate last return, not in a result struct
- [ ] Parameter/result structs have safe zero values (adding a field doesn't change existing behavior)
- [ ] Interfaces are small and extended via composition, not modification
