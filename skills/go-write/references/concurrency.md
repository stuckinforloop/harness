# Concurrency

## Rules

- **Mutex as unexported struct field.** Place `mu sync.Mutex` as an unexported field directly above the fields it guards. Never embed the mutex.
- **Channel size: 0 or 1.** Any other size requires rigorous justification with measured benchmarks.
- **Every goroutine needs lifecycle management.** An owner that starts it, a signal to stop it, and a way to wait for completion.
- **No goroutines in `init()`.** Background work must be explicitly started and stoppable.
- **Use `go.uber.org/atomic`** for atomic operations on primitive types — clearer intent than `sync/atomic`.

## Patterns

### Mutex Placement — Bad

```go
type Cache struct {
    sync.Mutex  // embedded — leaks Lock/Unlock to callers
    items map[string]string
}
```

### Mutex Placement — Good

```go
type Cache struct {
    mu    sync.Mutex  // unexported, guards items
    items map[string]string
}
```

### Goroutine Lifecycle — Bad

```go
go func() {
    for {
        process()  // runs forever, no way to stop or wait
    }
}()
```

### Goroutine Lifecycle — Good

```go
type Worker struct {
    stop chan struct{}
    done chan struct{}
}

func NewWorker() *Worker {
    w := &Worker{
        stop: make(chan struct{}),
        done: make(chan struct{}),
    }
    go w.run()
    return w
}

func (w *Worker) run() {
    defer close(w.done)
    for {
        select {
        case <-w.stop:
            return
        default:
            process()
        }
    }
}

func (w *Worker) Stop() {
    close(w.stop)
    <-w.done // wait for completion
}
```

### Goroutine Lifecycle — Good (context variant)

```go
func (w *Worker) Run(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case job := <-w.jobs:
            if err := w.process(job); err != nil {
                return fmt.Errorf("process job: %w", err)
            }
        }
    }
}
```

### Context-Based Cancellation — Good

```go
func (s *Server) Serve(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case conn := <-s.conns:
            go s.handle(ctx, conn)
        }
    }
}

// Caller controls lifecycle with cancel
ctx, cancel := context.WithCancel(context.Background())
go srv.Serve(ctx)
// ...
cancel()  // triggers shutdown
```

### Worker Pool — Good

```go
func processAll(ctx context.Context, items []Item) error {
    jobs := make(chan Item)
    var wg sync.WaitGroup
    for range runtime.NumCPU() {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for item := range jobs {
                process(ctx, item)
            }
        }()
    }
    for _, item := range items {
        select {
        case <-ctx.Done():
            break
        case jobs <- item:
        }
    }
    close(jobs)
    wg.Wait()
    return ctx.Err()
}
```

### Channel Sizing

```go
ch := make(chan Event)     // unbuffered — synchronous handoff (preferred)
ch := make(chan Event, 1)  // single buffer — acceptable
// ch := make(chan Event, 100)  // needs benchmarks to justify
```

## Checklist

- [ ] Mutexes are unexported struct fields, not embedded
- [ ] `mu` is directly above guarded fields
- [ ] Channel buffers are 0 or 1
- [ ] Every goroutine has a stop signal and wait mechanism
- [ ] No goroutines started in `init()`
- [ ] Atomic operations use `go.uber.org/atomic`
- [ ] Context cancellation is preferred for goroutine stop signals
- [ ] Worker pools use channel + context + WaitGroup together
