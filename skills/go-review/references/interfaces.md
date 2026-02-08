# Interface Review

## Rules

- **Flag missing compile-time checks.** Every implementation needs `var _ Interface = (*Type)(nil)`.
- **Flag `*Interface` in signatures.** Interface values already hold a pointer. `*io.Reader` is almost always a bug.
- **Flag provider-side definitions.** Interfaces should be defined at the consumer, not alongside the implementation.
- **Flag embedded interfaces in public structs.** Embedding leaks interface methods. Suggest unexported field.
- **Flag interfaces with >3 methods.** Suggest extracting helpers to package-level functions.
- **Flag convenience methods in interfaces.** If a method can be built from other interface methods, it should be a function.
- **Flag missing driver pattern.** When a struct wraps an interface and adds behavior, verify the interface is minimal (driver) and the struct handles convenience.
- **Verify upcasting uses two-value assertion.** Single-value `x.(T)` panics on failure.
- **Check implementability.** Can a third party implement this interface without importing internal types?

## Patterns

### Missing Compile-Time Check — Flag

```go
type FileStorage struct{ ... }
func (f *FileStorage) Save(data []byte) error { ... }
// No var _ Storage = (*FileStorage)(nil)
```

### Pointer to Interface — Flag

```go
func Process(r *io.Reader) error { ... } // wrong
```

### Provider-Side Definition — Flag

```go
// In the database package — defines interface AND implementation
type UserStore interface {
    GetUser(id string) (*User, error)
}
```

### Provider-Side Definition — Suggest

```go
// In the consumer package — defines only what it needs
type UserGetter interface {
    GetUser(ctx context.Context, id string) (*User, error)
}
```

### Bloated Interface — Flag

```go
type Cache interface {
    Get(key string) ([]byte, error)
    Set(key string, val []byte) error
    Delete(key string) error
    GetMulti(keys []string) (map[string][]byte, error) // buildable from Get
    Exists(key string) bool                              // buildable from Get
}
```

### Bloated Interface — Suggest

```go
type Cache interface {
    Get(key string) ([]byte, error)
    Set(key string, val []byte) error
    Delete(key string) error
}

func GetMulti(c Cache, keys []string) (map[string][]byte, error) { ... }
func Exists(c Cache, key string) bool { ... }
```

### Unsafe Upcast — Flag

```go
sw := w.(io.StringWriter) // panics on failure
```

### Unsafe Upcast — Suggest

```go
if sw, ok := w.(io.StringWriter); ok {
    sw.WriteString(s)
} else {
    w.Write([]byte(s))
}
```

## Checklist

- [ ] Every implementation has `var _ Interface = (*Type)(nil)`
- [ ] No `*Interface` in function signatures
- [ ] Interfaces defined at consumer when possible
- [ ] No embedded interfaces in public structs
- [ ] Interfaces have 1-3 methods maximum
- [ ] Convenience methods are package-level functions, not interface methods
- [ ] Upcasting uses two-value type assertions
- [ ] Driver interfaces contain only low-level primitives
- [ ] Third parties can implement the interface without internal dependencies
