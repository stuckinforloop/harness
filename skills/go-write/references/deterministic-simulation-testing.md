# Deterministic Simulation Testing (DST)

## Rules

- **Inject non-deterministic sources, don't abstract everything.** Use function types or lightweight structs that embed the source directly. Full interfaces for Clock/FS/Network are overkill in most code — save them for libraries where they're justified.
- **Prefer function types over interfaces for single operations.** `type TimeNow func() time.Time` is simpler than a `Clock` interface with six methods. Add methods on the function type when you need derived behavior.
- **Use a seeded `*rand.Rand`, never the global source.** Pass it explicitly or embed it in a struct. Log the seed on every test run so failures are replayable.
- **Embed the non-deterministic source in the struct that uses it.** A struct field like `now TimeNow` or `rng *rand.Rand` is all you need. Production passes `time.Now`, tests pass a fixed function.
- **Sort map iterations that affect output.** Go map iteration is non-deterministic. Collect keys, sort, then iterate.
- **No global mutable state.** All state flows through function parameters or struct fields. Globals break test isolation and reproducibility.
- **Test invariants, not specific outputs.** Assert system properties (consistency, no data loss) that hold across all seeds, not exact values tied to one seed.
- **Use stdlib interfaces where they exist.** For filesystem access, prefer `fs.FS` and `io.Reader`/`io.Writer` over custom interfaces. Don't reinvent what the standard library already provides.
- **Keep it proportional.** Simple code that calls `time.Now()` once doesn't need injection. Reserve DST patterns for code where non-determinism actually causes test pain or hides bugs.

## Patterns

### Function Type for Time

```go
// TimeNow is a function type that replaces direct time.Now() calls.
type TimeNow func() time.Time

// Tick returns a time offset from now by d.
func (t TimeNow) Tick(d time.Duration) time.Time {
    return t().Add(d)
}
```

### Using TimeNow in a Struct — Bad

```go
type Cache struct {
    ttl   time.Duration
    items map[string]entry
}

func (c *Cache) IsExpired(key string) bool {
    e := c.items[key]
    return time.Now().After(e.createdAt.Add(c.ttl)) // direct call, untestable
}
```

### Using TimeNow in a Struct — Good

```go
type Cache struct {
    ttl   time.Duration
    now   TimeNow
    items map[string]entry
}

func NewCache(ttl time.Duration, now TimeNow) *Cache {
    return &Cache{ttl: ttl, now: now, items: make(map[string]entry)}
}

func (c *Cache) IsExpired(key string) bool {
    e := c.items[key]
    return c.now().After(e.createdAt.Add(c.ttl))
}

// Production: NewCache(5*time.Minute, time.Now)
// Test:       NewCache(5*time.Minute, func() time.Time { return fixedTime })
```

### Seeded Random — Bad

```go
func generateID() string {
    return fmt.Sprintf("%d", rand.Int()) // global source, non-reproducible
}
```

### Seeded Random — Good

```go
type Server struct {
    rng *rand.Rand
}

func NewServer(rng *rand.Rand) *Server {
    return &Server{rng: rng}
}

func (s *Server) generateID() string {
    return fmt.Sprintf("%d", s.rng.Intn(math.MaxInt))
}

// Production: NewServer(rand.New(rand.NewSource(time.Now().UnixNano())))
// Test:       NewServer(rand.New(rand.NewSource(42)))
```

### Filesystem — Use stdlib fs.FS

```go
// Bad — direct os call
func loadConfig() (*Config, error) {
    data, err := os.ReadFile("/etc/app/config.json")
    if err != nil {
        return nil, err
    }
    return parseConfig(data)
}

// Good — accept fs.FS
func loadConfig(fsys fs.FS) (*Config, error) {
    data, err := fs.ReadFile(fsys, "etc/app/config.json")
    if err != nil {
        return nil, err
    }
    return parseConfig(data)
}

// Production: loadConfig(os.DirFS("/"))
// Test:       loadConfig(fstest.MapFS{"etc/app/config.json": &fstest.MapFile{Data: []byte(`{}`)}})
```

### Combining Sources in a Struct

```go
type Server struct {
    now    TimeNow
    rng    *rand.Rand
    logger *slog.Logger
}

func NewServer(now TimeNow, rng *rand.Rand, logger *slog.Logger) *Server {
    return &Server{now: now, rng: rng, logger: logger}
}

func (s *Server) handleRequest(ctx context.Context) {
    start := s.now()
    delay := s.rng.Intn(100)
    // ...
    s.logger.InfoContext(ctx, "request handled",
        slog.Duration("latency", s.now().Sub(start)),
    )
}

// Production
srv := NewServer(time.Now, rand.New(rand.NewSource(time.Now().UnixNano())), slog.Default())

// DST test
srv := NewServer(
    func() time.Time { return fixedTime },
    rand.New(rand.NewSource(seed)),
    slog.New(slog.NewTextHandler(io.Discard, nil)),
)
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

### Map Iteration — Bad

```go
func processItems(items map[string]Item) {
    for k, v := range items { // order varies between runs
        process(k, v)
    }
}
```

### Map Iteration — Good

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

### DST Test Structure

```go
func TestReplication_DST(t *testing.T) {
    seed := int64(42)
    if s := os.Getenv("DST_SEED"); s != "" {
        seed, _ = strconv.ParseInt(s, 10, 64)
    }
    t.Logf("DST seed: %d", seed)

    rng := rand.New(rand.NewSource(seed))
    now := time.Unix(1000000, 0)
    clock := func() time.Time { return now }

    nodes := make([]*Node, 3)
    for i := range nodes {
        nodes[i] = NewNode(clock, rng)
    }

    for step := 0; step < 10000; step++ {
        now = now.Add(time.Millisecond * time.Duration(rng.Intn(100)))

        if rng.Float64() < 0.05 {
            victim := rng.Intn(len(nodes))
            nodes[victim].Restart()
        }

        nodes[rng.Intn(len(nodes))].Put("key", fmt.Sprintf("val-%d", step))
    }

    assertConsistency(t, nodes)
}
```

### Seed Sweep

```go
func TestConsensus_SeedSweep(t *testing.T) {
    for seed := int64(0); seed < 1000; seed++ {
        t.Run(fmt.Sprintf("seed=%d", seed), func(t *testing.T) {
            t.Parallel()
            rng := rand.New(rand.NewSource(seed))
            // ... run scenario, assert invariants ...
        })
    }
}
```

## Checklist

- [ ] Non-deterministic sources (time, rand) injected via function types or struct fields — not called globally
- [ ] `*rand.Rand` created from explicit seed, seed logged in tests
- [ ] Filesystem access uses `fs.FS` / `io.Reader` / `io.Writer` — not direct `os.*` calls
- [ ] No global mutable state — all state in struct fields or function parameters
- [ ] Map iterations that affect output sort keys first
- [ ] DST tests log the seed and accept it via `DST_SEED` environment variable
- [ ] Tests assert invariants (consistency, no data loss) not seed-specific outputs
- [ ] DST patterns used proportionally — only where non-determinism causes real test pain
