# Code Organization

## Rules

- **Import groups**: standard library → blank line → external packages. Use `goimports` to enforce.
- **Function ordering**: sort by call order (callee below caller). Exported functions above unexported helpers.
- **Reduce nesting**: use early returns and `continue` to avoid deep indentation.
- **No unnecessary else**: if both branches set a variable, use early return or assign default before `if`.
- **Line length**: ~99 characters. Break long function signatures and chains.

## Patterns

### Import Ordering — Bad

```go
import (
    "github.com/pkg/errors"
    "fmt"
    "go.uber.org/zap"
    "net/http"
)
```

### Import Ordering — Good

```go
import (
    "fmt"
    "net/http"

    "github.com/pkg/errors"
    "go.uber.org/zap"
)
```

### Function Ordering

```go
// Exported function first
func (s *Server) HandleRequest(w http.ResponseWriter, r *http.Request) {
    data := s.parseBody(r)
    s.writeResponse(w, data)
}

// Then helpers in call order
func (s *Server) parseBody(r *http.Request) []byte { ... }
func (s *Server) writeResponse(w http.ResponseWriter, data []byte) { ... }
```

### Reduce Nesting — Bad

```go
func process(items []Item) error {
    if len(items) > 0 {
        for _, item := range items {
            if item.Valid {
                if err := handle(item); err != nil {
                    return err
                }
            }
        }
    }
    return nil
}
```

### Reduce Nesting — Good

```go
func process(items []Item) error {
    if len(items) == 0 {
        return nil
    }
    for _, item := range items {
        if !item.Valid {
            continue
        }
        if err := handle(item); err != nil {
            return err
        }
    }
    return nil
}
```

### Unnecessary Else — Bad

```go
var status string
if isActive {
    status = "active"
} else {
    status = "inactive"
}
```

### Unnecessary Else — Good

```go
status := "inactive"
if isActive {
    status = "active"
}
```

### Line Length

```go
// Bad — too long
func NewServer(host string, port int, db *sql.DB, logger *zap.Logger, cache *redis.Client, timeout time.Duration) *Server {

// Good — break parameters
func NewServer(
    host string,
    port int,
    db *sql.DB,
    logger *zap.Logger,
    cache *redis.Client,
    timeout time.Duration,
) *Server {
```

## Checklist

- [ ] Imports: stdlib → blank line → external
- [ ] Functions ordered by call chain
- [ ] Exported functions above unexported
- [ ] Early returns used to reduce nesting
- [ ] No unnecessary `else` blocks
- [ ] Lines ≤ ~99 characters
