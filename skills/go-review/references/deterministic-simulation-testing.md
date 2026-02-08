# Deterministic Simulation Testing Review

## Rules

- **Flag direct `time.Now()` in business logic.** Time should come from an injected function type (`type TimeNow func() time.Time`) or struct field. Direct calls make code non-deterministic and untestable.
- **Flag global `rand.*` calls.** Randomness should come from an injected `*rand.Rand` created from an explicit seed. Global sources are non-reproducible.
- **Flag direct `os.*` file operations in business logic.** File access should go through `fs.FS`, `io.Reader`, or `io.Writer`. Direct syscalls prevent in-memory testing.
- **Flag map iteration that affects output ordering.** Go maps iterate non-deterministically. If order matters, keys must be sorted.
- **Flag mutable package-level globals.** Global state breaks test isolation and makes simulation impossible. Suggest struct fields with constructors.
- **Flag missing seed logging in DST tests.** Every simulation test must log its seed and accept replay via environment variable.
- **Flag `crypto/rand` where deterministic randomness is needed.** `crypto/rand` cannot be seeded. Use `math/rand` with an explicit seed for DST-compatible code. Reserve `crypto/rand` for security-sensitive operations only.
- **Flag over-abstracted DST patterns.** A full `Clock` interface with six methods is overkill for code that only needs `Now()`. Suggest function types or `*rand.Rand` directly — match abstraction to actual need.

## Patterns

### Direct time.Now — Flag

```go
func (s *Server) isExpired(token Token) bool {
    return time.Now().After(token.ExpiresAt)
}
```

### Direct time.Now — Suggest

```go
type TimeNow func() time.Time

type Server struct {
    now TimeNow
}

func (s *Server) isExpired(token Token) bool {
    return s.now().After(token.ExpiresAt)
}
```

### Global Random — Flag

```go
func generateID() string {
    return fmt.Sprintf("%d", rand.Int())
}
```

### Global Random — Suggest

```go
type IDGen struct {
    rng *rand.Rand
}

func (g *IDGen) Generate() string {
    return fmt.Sprintf("%d", g.rng.Intn(math.MaxInt))
}
```

### Direct File I/O — Flag

```go
func loadConfig() (*Config, error) {
    data, err := os.ReadFile("/etc/app/config.json")
    if err != nil {
        return nil, err
    }
    return parseConfig(data)
}
```

### Direct File I/O — Suggest

```go
func loadConfig(fsys fs.FS) (*Config, error) {
    data, err := fs.ReadFile(fsys, "etc/app/config.json")
    if err != nil {
        return nil, err
    }
    return parseConfig(data)
}
```

### Non-Deterministic Map Iteration — Flag

```go
func processItems(items map[string]Item) {
    for k, v := range items { // order varies between runs
        process(k, v)
    }
}
```

### Non-Deterministic Map Iteration — Suggest

```go
func processItems(items map[string]Item) {
    keys := make([]string, 0, len(items))
    for k := range items {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    for _, k := range keys {
        process(k, items[k])
    }
}
```

### Mutable Global State — Flag

```go
var defaultTimeout = 30 * time.Second

func (c *Client) Fetch(ctx context.Context) (*Response, error) {
    ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
    defer cancel()
    // ...
}
```

### Mutable Global State — Suggest

```go
type Client struct {
    timeout time.Duration
}

func NewClient(timeout time.Duration) *Client {
    return &Client{timeout: timeout}
}

func (c *Client) Fetch(ctx context.Context) (*Response, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()
    // ...
}
```

### Missing Seed Logging — Flag

```go
func TestReplication_DST(t *testing.T) {
    rng := rand.New(rand.NewSource(time.Now().UnixNano())) // seed not logged, not replayable
    // ...
}
```

### Missing Seed Logging — Suggest

```go
func TestReplication_DST(t *testing.T) {
    seed := int64(42)
    if s := os.Getenv("DST_SEED"); s != "" {
        seed, _ = strconv.ParseInt(s, 10, 64)
    }
    t.Logf("DST seed: %d", seed)
    rng := rand.New(rand.NewSource(seed))
    // ...
}
```

### Over-Abstracted Clock — Flag

```go
// Overkill for code that only needs Now()
type Clock interface {
    Now() time.Time
    Since(t time.Time) time.Duration
    Sleep(d time.Duration)
    After(d time.Duration) <-chan time.Time
    NewTimer(d time.Duration) Timer
    NewTicker(d time.Duration) Ticker
}
```

### Over-Abstracted Clock — Suggest

```go
// Match abstraction to need
type TimeNow func() time.Time

func (t TimeNow) Tick(d time.Duration) time.Time {
    return t().Add(d)
}
```

## Checklist

- [ ] No direct `time.Now()` in business logic — uses `TimeNow` function type or struct field
- [ ] No global `rand.*` calls — uses injected `*rand.Rand` from explicit seed
- [ ] No direct `os.ReadFile`, `os.Create`, `os.Open` — uses `fs.FS` / `io.Reader` / `io.Writer`
- [ ] No mutable package-level globals — state lives in struct fields
- [ ] Map iterations that affect output sort keys for determinism
- [ ] DST tests log seed and accept replay via `DST_SEED` environment variable
- [ ] Tests assert invariants, not seed-specific exact outputs
- [ ] Abstractions match actual need — no over-engineered interfaces for single-method use
