# Safety Review

## Rules

- **Flag bare type assertions.** `x.(T)` panics on failure. Suggest two-value form `v, ok := x.(T)`.
- **Flag missing defer after acquire.** Open/close, lock/unlock, start/stop must be paired with `defer` immediately after acquisition.
- **Flag panic in library code.** Libraries must return `error`, not panic. `panic` is for truly unrecoverable states only.
- **Flag `os.Exit` / `log.Fatal` outside main.** Callers can't run defers or cleanup. Suggest returning an error.
- **Flag `init()` functions.** They make code hard to test and reason about. Suggest explicit initialization in `main()` or constructors.
- **Flag uncopied slices/maps at boundaries.** When receiving or returning slices/maps, the code must copy to prevent callers from mutating internal state.
- **Flag mutable package-level globals.** Suggest dependency injection. If unavoidable, require mutex protection.
- **Flag missing struct field tags.** JSON/YAML marshaled structs without tags create fragile APIs — field renaming breaks serialization.

## Patterns

### Bare Type Assertion — Flag

```go
v := x.(string) // panics if x is not a string
```

### Bare Type Assertion — Suggest

```go
v, ok := x.(string)
if !ok {
    return fmt.Errorf("expected string, got %T", x)
}
```

### Missing Boundary Copy — Flag

```go
func (s *Store) Items() []string {
    return s.items // caller can mutate internal state
}
```

### Missing Boundary Copy — Suggest

```go
func (s *Store) Items() []string {
    out := make([]string, len(s.items))
    copy(out, s.items)
    return out
}
```

### Mutable Global — Flag

```go
var db *sql.DB // mutable global, untestable
```

### Mutable Global — Suggest

```go
type Server struct {
    db *sql.DB // injected dependency
}

func NewServer(db *sql.DB) *Server {
    return &Server{db: db}
}
```

### Missing Struct Tags — Flag

```go
type User struct {
    ID    string
    Name  string // renaming this field breaks JSON consumers
}
```

### Missing Struct Tags — Suggest

```go
type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}
```

## Checklist

- [ ] All type assertions use two-value form `v, ok := x.(T)`
- [ ] `defer` immediately follows every resource acquisition
- [ ] No `panic` in library code
- [ ] No `init()` functions (or clearly justified)
- [ ] No `os.Exit` / `log.Fatal` outside `main()`
- [ ] Slices/maps copied at package boundaries (both receiving and returning)
- [ ] No mutable package-level globals
- [ ] All marshaled structs have explicit field tags
