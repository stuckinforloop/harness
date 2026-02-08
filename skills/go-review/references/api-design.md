# API Design Review

## Rules

- **Audit every export.** Ask: "will we support this forever?" Accidental exports are the #1 source of API debt.
- **Flag functions with >3 parameters.** They should use a parameter struct. Exception: `context.Context` stays as a separate first arg.
- **Flag functions with >2 return values.** They should use a result struct. Exception: `error` stays as a separate last return.
- **Check zero-value safety on param/result structs.** Adding a new field must not change behavior for existing callers who don't set it.
- **Block interface modifications.** Adding methods to an existing interface is a breaking change. Extend via composition or a new interface.
- **Check that signatures can evolve.** A function taking 3 individual args today will need a param struct tomorrow. Catch this early.

## Patterns

### Accidental Export — Flag

```go
// Is this intentionally public? If only used internally, make it unexported.
func ParseInternalConfig(data []byte) (*Config, error) { ... }
```

### Param Struct Missing — Flag

```go
// 4 params + context — should use a param struct
func Send(ctx context.Context, to, from, subject, body string) error { ... }
```

### Param Struct Missing — Suggested Fix

```go
type SendParams struct {
    To      string
    From    string
    Subject string
    Body    string
}

func Send(ctx context.Context, p SendParams) error { ... }
```

### Unsafe Zero Value — Flag

```go
type RetryParams struct {
    MaxRetries int // zero value means 0 retries — is that intended or a bug?
}
```

### Unsafe Zero Value — Suggested Fix

```go
type RetryParams struct {
    MaxRetries int // 0 means use default (3)
}

func (p RetryParams) maxRetries() int {
    if p.MaxRetries == 0 {
        return 3
    }
    return p.MaxRetries
}
```

### Interface Modification — Block

```go
// BREAKING: adding Delete to existing Store interface
type Store interface {
    Get(key string) ([]byte, error)
    Delete(key string) error // breaks all implementations
}
```

### Interface Modification — Suggest

```go
type Store interface {
    Get(key string) ([]byte, error)
}

type DeletableStore interface {
    Store
    Delete(key string) error
}
```

## Checklist

- [ ] Every exported symbol is intentionally public
- [ ] Functions with >3 params use a parameter struct
- [ ] Functions with >2 returns use a result struct
- [ ] `context.Context` is first arg, never in a param struct
- [ ] `error` is last return, never in a result struct
- [ ] Zero-value of param/result structs preserves existing behavior
- [ ] No methods added to existing interfaces — only new interfaces via composition
- [ ] New public functions can grow (signature won't need breaking changes soon)
