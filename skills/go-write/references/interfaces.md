# Interfaces

## Rules

- **Keep interfaces small.** 1-3 methods maximum. Extract helpers into package-level functions that accept the interface.
- **Compile-time compliance check.** Verify implementations with `var _ Interface = (*Type)(nil)`.
- **Define interfaces at the consumer**, not the implementor, unless multiple packages need the same interface.
- **Accept interfaces, return structs.** Functions should accept interface parameters and return concrete types.
- **No pointer to interface.** Interface values already hold a pointer. `*io.Reader` is almost always a bug.
- **Avoid embedding interfaces in public structs.** It leaks implementation details. Use an unexported field.
- **Upcast to upgrade.** Define optional extension interfaces. Check at runtime with a two-value type assertion.
- **Use the driver pattern for extensibility.** Minimal interface (driver) + rich concrete struct wrapper with convenience methods.

## Patterns

### Compile-Time Check — Required

```go
var _ Storage = (*FileStorage)(nil)
```

Place immediately after the type declaration.

### Consumer-Side Definition

```go
// In the consumer package — define only what you need
type UserGetter interface {
    GetUser(ctx context.Context, id string) (*User, error)
}

func NewHandler(users UserGetter) *Handler { ... }
```

### Helper as Function, Not Method

```go
type Writer interface {
    Write(p []byte) (int, error)
}

// Package-level helper — works with any Writer, no extra burden on implementors
func WriteString(w Writer, s string) (int, error) {
    if sw, ok := w.(interface{ WriteString(string) (int, error) }); ok {
        return sw.WriteString(s) // optimized path via upcast
    }
    return w.Write([]byte(s))
}
```

### Upcasting — Optional Interface Extension

```go
type FS interface {
    Open(name string) (File, error)
}

type StatFS interface {
    FS
    Stat(name string) (FileInfo, error)
}

func statFile(fsys FS, name string) (FileInfo, error) {
    if sfs, ok := fsys.(StatFS); ok {
        return sfs.Stat(name) // optimized path
    }
    f, err := fsys.Open(name) // fallback
    if err != nil {
        return nil, err
    }
    defer f.Close()
    return f.Stat()
}
```

### Driver Pattern

```go
// Minimal interface — implementors only need this
type Core interface {
    Enabled(Level) bool
    Write(Entry, []Field) error
    Sync() error
}

// Rich wrapper — convenience, buffering, caller info
type Logger struct{ core Core }

func (l *Logger) Info(msg string, fields ...Field) {
    if !l.core.Enabled(InfoLevel) {
        return
    }
    l.core.Write(Entry{Level: InfoLevel, Message: msg, Time: time.Now()}, fields)
}

// stdlib parallels: http.RoundTripper → http.Client, database/sql/driver.Driver → sql.DB
```

### Embedding — Bad

```go
type Client struct {
    http.Handler  // leaks ServeHTTP to callers
}
```

### Embedding — Good

```go
type Client struct {
    handler http.Handler  // unexported field
}
```

## Checklist

- [ ] Interfaces have 1-3 methods — helpers are package-level functions
- [ ] Every implementation has `var _ Interface = (*Type)(nil)`
- [ ] Interfaces defined at consumer when possible
- [ ] No `*Interface` in function signatures
- [ ] Public structs don't embed interfaces
- [ ] Optional capabilities use upcasting with two-value type assertions
- [ ] Extensible systems use driver pattern: minimal interface + rich wrapper
