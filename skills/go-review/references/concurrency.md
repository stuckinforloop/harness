# Concurrency Review

## Rules

- **Flag embedded mutexes.** `sync.Mutex` must be an unexported field. Embedding leaks `Lock`/`Unlock`.
- **Flag mutex placement.** `mu` must be directly above guarded fields.
- **Flag channel size >1.** Buffer sizes other than 0 or 1 need benchmark justification.
- **Flag fire-and-forget goroutines.** Every `go` statement needs a stop signal and wait mechanism.
- **Flag goroutines in `init()`.** Background work must be explicitly started and stoppable.
- **Flag missing context check.** Goroutines with `select` must check `<-ctx.Done()`.
- **Flag WaitGroup Add inside goroutine.** `wg.Add` must come before `go`, `wg.Done` in `defer` inside goroutine.
- **Flag unbounded goroutine creation.** Loops spawning goroutines without bounds need a pool or `errgroup.SetLimit`.
- **Flag early channel close.** Only senders close channels. Results channels must close after `wg.Wait()`.
- **Flag `sync/atomic` for primitives.** Suggest `go.uber.org/atomic` for clearer intent.

## Patterns

### Embedded Mutex — Flag

```go
type Cache struct {
    sync.Mutex // leaks Lock/Unlock
    items map[string]string
}
```

### Embedded Mutex — Suggest

```go
type Cache struct {
    mu    sync.Mutex
    items map[string]string
}
```

### Fire-and-Forget — Flag

```go
go func() {
    for {
        process() // no stop, no wait
    }
}()
```

### Missing Context Check — Flag

```go
go func() {
    for job := range jobs {
        process(job) // leaks if context cancelled
    }
}()
```

### Missing Context Check — Suggest

```go
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        case job, ok := <-jobs:
            if !ok {
                return
            }
            process(ctx, job)
        }
    }
}()
```

### WaitGroup Race — Flag

```go
go func() {
    wg.Add(1) // race: Wait() may return before Add()
    defer wg.Done()
    process(item)
}()
```

### WaitGroup Race — Suggest

```go
wg.Add(1) // before go
go func() {
    defer wg.Done()
    process(item)
}()
```

### Unbounded Goroutines — Flag

```go
for _, url := range urls {
    go fetch(ctx, url) // 10k URLs = 10k goroutines
}
```

### Unbounded Goroutines — Suggest

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)
for _, url := range urls {
    g.Go(func() error {
        return fetch(ctx, url)
    })
}
if err := g.Wait(); err != nil { ... }
```

## Checklist

- [ ] No embedded mutexes — `mu sync.Mutex` as unexported field
- [ ] `mu` directly above guarded fields
- [ ] No channel buffers >1 without benchmarks
- [ ] Every `go` has a stop signal and wait mechanism
- [ ] No goroutines in `init()`
- [ ] All select loops check `<-ctx.Done()`
- [ ] `wg.Add` before `go`, `wg.Done` in defer
- [ ] No unbounded goroutine creation — use pool or `errgroup.SetLimit`
- [ ] Channels closed only by sender, after all sends complete
- [ ] Atomic operations use `go.uber.org/atomic`
