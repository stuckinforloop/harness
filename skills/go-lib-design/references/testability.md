# Testability and Deterministic Simulation

## Rules

- **Accept time as a function type, not an interface.** `type TimeNow func() time.Time` is enough for most libraries. Add methods on the function type for derived behavior (`Tick`, `Since`). Full `Clock` interfaces are rarely justified.
- **Accept `*rand.Rand` directly.** No need to wrap it in an interface — `*rand.Rand` already has every method you need. Default to a time-seeded source, let callers override with a fixed seed.
- **Accept I/O as stdlib interfaces.** Use `io.Reader`, `io.Writer`, `fs.FS` — not `*os.File`. Provide convenience constructors (`NewFromFile`) as thin wrappers. Don't invent custom FS interfaces when `fs.FS` and `testing/fstest.MapFS` exist.
- **Provide `With*` options for non-deterministic sources.** `WithTimeNow(TimeNow)`, `WithRand(*rand.Rand)` — so callers can inject deterministic implementations when needed.
- **No global state in libraries.** Package-level mutable variables prevent concurrent use and break simulation test isolation. Use struct methods with explicit construction.
- **Make outputs deterministic by default.** If ordering isn't contractual, sort at boundaries. Non-deterministic output becomes a de facto API via Hyrum's Law.
- **Design the zero value to be safe.** If a `TimeNow` field is nil, fall back to `time.Now`. If a logger is nil, fall back to `slog.Default()`. Callers shouldn't need to configure what they don't care about.
- **Keep simulation concerns out of the public API.** Callers who don't need simulation shouldn't see it. Use functional options with sensible defaults — the happy path is zero configuration.
- **Match abstraction to need.** A struct that calls `time.Now()` once needs a `TimeNow` field. A struct that manages timers, tickers, and sleeps might justify a `Clock` interface. Don't over-abstract.

## Patterns

### Hard-Coded Time — Bad

```go
type Cache struct {
    ttl time.Duration
}

func (c *Cache) IsExpired(key string) bool {
    entry := c.get(key)
    return time.Now().After(entry.CreatedAt.Add(c.ttl)) // can't test expiration
}
```

### Injectable Time — Good

```go
type TimeNow func() time.Time

type Cache struct {
    ttl time.Duration
    now TimeNow
}

type Option func(*Cache)

func WithTimeNow(fn TimeNow) Option {
    return func(c *Cache) { c.now = fn }
}

func New(ttl time.Duration, opts ...Option) *Cache {
    c := &Cache{ttl: ttl, now: time.Now}
    for _, o := range opts {
        o(c)
    }
    return c
}

func (c *Cache) IsExpired(key string) bool {
    entry := c.get(key)
    return c.now().After(entry.CreatedAt.Add(c.ttl))
}

// Simple use:  cache.New(5 * time.Minute)
// DST use:     cache.New(5*time.Minute, cache.WithTimeNow(fixedClock))
```

### Hard-Coded Randomness — Bad

```go
func (p *Pool) Pick() *Conn {
    return p.conns[rand.Intn(len(p.conns))] // non-reproducible
}
```

### Injectable Randomness — Good

```go
type Pool struct {
    conns []*Conn
    rng   *rand.Rand
}

func WithRand(rng *rand.Rand) Option {
    return func(p *Pool) { p.rng = rng }
}

func NewPool(conns []*Conn, opts ...Option) *Pool {
    p := &Pool{
        conns: conns,
        rng:   rand.New(rand.NewSource(time.Now().UnixNano())),
    }
    for _, o := range opts {
        o(p)
    }
    return p
}

func (p *Pool) Pick() *Conn {
    return p.conns[p.rng.Intn(len(p.conns))]
}
```

### Non-Deterministic Output — Bad

```go
func (s *Store) Keys() []string {
    keys := make([]string, 0, len(s.data))
    for k := range s.data {
        keys = append(keys, k) // map iteration order is random
    }
    return keys
}
```

### Deterministic Output — Good

```go
func (s *Store) Keys() []string {
    keys := make([]string, 0, len(s.data))
    for k := range s.data {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    return keys
}
```

### Real-World Example — ID Generation with Seeded Random

```go
type Source struct {
    rnd      *rand.Rand
    nowFunc  TimeNow
    mu       sync.Mutex
    modeTest bool
}

func New(rnd *rand.Rand, nowFunc TimeNow, modeTest bool) *Source {
    return &Source{rnd: rnd, nowFunc: nowFunc, modeTest: modeTest}
}

func (s *Source) Generate() (string, error) {
    s.mu.Lock()
    defer s.mu.Unlock()

    if s.modeTest {
        return s.test()
    }

    id, err := uuid.NewV7FromReader(s.rnd)
    if err != nil {
        return "", fmt.Errorf("new uuid: %w", err)
    }
    return id.String(), nil
}
```

### All-or-Nothing Dependencies — Bad

```go
// Callers must provide everything, even for simple use cases
func New(now TimeNow, rng *rand.Rand, fsys fs.FS, logger *slog.Logger) *Client {
    return &Client{now: now, rng: rng, fsys: fsys, logger: logger}
}
```

### Functional Options with Safe Defaults — Good

```go
type Client struct {
    now    TimeNow
    rng    *rand.Rand
    logger *slog.Logger
}

func New(opts ...Option) *Client {
    c := &Client{
        now:    time.Now,
        rng:    rand.New(rand.NewSource(time.Now().UnixNano())),
        logger: slog.Default(),
    }
    for _, o := range opts {
        o(c)
    }
    return c
}

// Simple use: client.New()
// DST use:    client.New(client.WithTimeNow(fixed), client.WithRand(seeded))
```

## Checklist

- [ ] Library never calls `time.Now()` directly — accepts `TimeNow` function type via option with `time.Now` as default
- [ ] Library never uses global `rand.*` — accepts `*rand.Rand` via option with time-seeded default
- [ ] Library accepts `io.Reader`/`io.Writer`/`fs.FS` for I/O — not `*os.File`
- [ ] Every non-deterministic source has a `WithX` functional option
- [ ] No mutable package-level globals — all state in structs with constructors
- [ ] Collection outputs are deterministically ordered (sorted at boundaries)
- [ ] Nil/zero-value dependencies fall back to sensible defaults (`time.Now`, `slog.Default()`)
- [ ] Simulation is opt-in — zero-config path works without any `With*` options
- [ ] Abstraction level matches need — function types for single operations, interfaces only when justified
