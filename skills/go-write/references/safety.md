# Safety

## Rules

- **Use defer for cleanup.** Open/close, lock/unlock, start/stop — pair with defer immediately after acquisition.
- **Two-value type assertions.** Always use `v, ok := x.(T)` — bare `x.(T)` panics on failure.
- **Don't panic.** Use `error` returns in library code. Use `t.Fatal` in tests. `panic` is for truly unrecoverable states only.
- **Avoid `init()`.** Makes code hard to test and reason about. Prefer explicit initialization in `main()` or constructors.
- **Exit only in `main()`.** Never call `os.Exit` or `log.Fatal` in library code — callers can't run defers or cleanup.
- **Copy slices and maps at boundaries.** When receiving or returning slices/maps, copy to prevent callers from mutating internal state.
- **Avoid mutable globals.** Use dependency injection instead. If unavoidable, protect with a mutex.
- **Always use struct field tags** for JSON/YAML marshaling — untagged fields create fragile APIs.

## Patterns

### Type Assertion — Bad

```go
v := x.(string)  // panics if x is not a string
```

### Type Assertion — Good

```go
v, ok := x.(string)
if !ok {
    return fmt.Errorf("expected string, got %T", x)
}
```

### Defensive Copy — Receiving

```go
func NewStore(items []string) *Store {
    s := &Store{
        items: make([]string, len(items)),
    }
    copy(s.items, items)  // don't hold caller's slice
    return s
}
```

### Defensive Copy — Returning

```go
func (s *Store) Items() []string {
    out := make([]string, len(s.items))
    copy(out, s.items)
    return out  // return copy, not internal slice
}
```

### Defensive Copy — Maps

```go
func (s *Store) Config() map[string]string {
    out := make(map[string]string, len(s.config))
    for k, v := range s.config {
        out[k] = v
    }
    return out
}
```

### Struct Tags

```go
type User struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}
```

### No Mutable Globals — Bad

```go
var db *sql.DB  // mutable global, hard to test
```

### No Mutable Globals — Good

```go
type Server struct {
    db *sql.DB  // injected dependency
}

func NewServer(db *sql.DB) *Server {
    return &Server{db: db}
}
```

## Checklist

- [ ] All type assertions use two-value form
- [ ] `defer` immediately follows resource acquisition
- [ ] No `panic` in library code
- [ ] No `init()` functions (or clearly justified)
- [ ] No `os.Exit`/`log.Fatal` outside `main()`
- [ ] Slices/maps copied at package boundaries
- [ ] No mutable package-level globals
- [ ] All marshaled structs have field tags
