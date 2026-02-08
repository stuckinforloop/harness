# Surface Area Management

## Rules

- **Use `internal/` packages for non-public code.** Code under `internal/` cannot be imported by external modules. Use this to organize without committing to a public API.
- **Never leak internal types through exports.** An exported function returning an `internal/` type effectively makes that type public. The compiler allows it but it breaks the contract.
- **No global state.** Global variables and `init()` prevent multiple instances, break test isolation, and hide dependencies. Use struct methods with explicit construction.
- **Return zero values with errors.** On error, return the zero value — not partial results. Partial results become Hyrum's Law traps (callers depend on undefined behavior).
- **Guard against mutation at boundaries.** Clone slices and maps before returning them if they reference internal state. Callers will mutate what you give them.
- **Make outputs deterministic.** If ordering isn't part of the contract, sort at the boundary. Non-deterministic output becomes a de facto API that's hard to change.

## Patterns

### Leaking Internal Types — Bad

```go
// package mylib (public)
import "mylib/internal/helper"

func Export() *helper.Internal { // exposes internal type
    return &helper.Internal{}
}
```

### Internal Package Usage — Good

```go
// mylib/internal/parser/ — implementation details
// mylib/ — public API wrapping internals

// package mylib
type Result struct { /* public fields only */ }

func Parse(r io.Reader) (*Result, error) {
    // uses internal/parser internally
    // returns public types only
}
```

### Global State — Bad

```go
var cache = make(map[string]*Value)

func Lookup(name string) (*Value, error) {
    if v, ok := cache[name]; ok {
        return v, nil
    }
    // ...
}
// Cannot create two independent caches. Tests share state.
```

### Global State — Good

```go
type Store struct {
    cache map[string]*Value
}

func NewStore() *Store {
    return &Store{cache: make(map[string]*Value)}
}

func (s *Store) Lookup(name string) (*Value, error) {
    if v, ok := s.cache[name]; ok {
        return v, nil
    }
    // ...
}
```

### Mutation at Boundary — Bad

```go
func (c *Cache) Keys() []string {
    return c.keys // caller can mutate internal slice
}
```

### Mutation at Boundary — Good

```go
func (c *Cache) Keys() []string {
    out := make([]string, len(c.keys))
    copy(out, c.keys)
    sort.Strings(out) // deterministic ordering
    return out
}
```

### Partial Results on Error — Bad

```go
func (c *Client) Fetch() (*Response, error) {
    resp := &Response{Headers: headers}
    body, err := readBody()
    if err != nil {
        return resp, err // partial: has headers but no body
    }
    resp.Body = body
    return resp, nil
}
```

### Zero Value on Error — Good

```go
func (c *Client) Fetch() (*Response, error) {
    // ...
    if err != nil {
        return nil, fmt.Errorf("fetch: %w", err)
    }
    return resp, nil
}
```

## Checklist

- [ ] Non-public helpers are under `internal/`
- [ ] No exported function returns or accepts an `internal/` type
- [ ] No package-level mutable state (no `var cache`, no `init()` with side effects)
- [ ] Constructor functions create independent instances with their own state
- [ ] Slices and maps returned at boundaries are clones, not internal references
- [ ] Functions return zero values (not partial results) on error
- [ ] Collection ordering is deterministic or explicitly documented as undefined
