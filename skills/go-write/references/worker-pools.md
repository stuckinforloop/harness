# Worker Pools

## Rules

- **Use channels for job distribution.** A shared channel naturally load-balances work across goroutines — busy workers don't pull new jobs.
- **Use context for cancellation.** Pass `context.Context` to signal shutdown rather than a custom stop channel. Context integrates with the standard library and propagates through call chains.
- **Use WaitGroup for clean shutdown.** `sync.WaitGroup` ensures all workers finish before the pool returns. Drain the job channel, then wait.
- **Close the jobs channel to signal completion.** Workers range over the channel and exit naturally when it closes.

## Patterns

### Basic Worker Pool

```go
func pool(jobs <-chan Job, results chan<- Result) {
    var wg sync.WaitGroup
    for range runtime.NumCPU() {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- process(job)
            }
        }()
    }
    wg.Wait()
    close(results)
}
```

### Worker Pool with Context Cancellation

```go
func pool(ctx context.Context, jobs <-chan Job, results chan<- Result) error {
    var wg sync.WaitGroup
    errc := make(chan error, 1)

    for range runtime.NumCPU() {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for {
                select {
                case <-ctx.Done():
                    return
                case job, ok := <-jobs:
                    if !ok {
                        return
                    }
                    res, err := process(ctx, job)
                    if err != nil {
                        select {
                        case errc <- err:
                        default:
                        }
                        return
                    }
                    results <- res
                }
            }
        }()
    }

    wg.Wait()
    close(results)

    select {
    case err := <-errc:
        return err
    default:
        return nil
    }
}
```

### Submitting Jobs

```go
func run(ctx context.Context, items []Item) ([]Result, error) {
    jobs := make(chan Job)
    results := make(chan Result, len(items))

    // Start pool
    var poolErr error
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        poolErr = pool(ctx, jobs, results)
    }()

    // Submit jobs — stops early if context is cancelled
    for _, item := range items {
        select {
        case <-ctx.Done():
            break
        case jobs <- Job{Item: item}:
        }
    }
    close(jobs)

    wg.Wait()
    if poolErr != nil {
        return nil, poolErr
    }

    // Collect results
    var out []Result
    for r := range results {
        out = append(out, r)
    }
    return out, nil
}
```

## Checklist

- [ ] Jobs are distributed via a shared channel (not per-worker assignment)
- [ ] Workers exit when the jobs channel is closed (`range` or `ok` check)
- [ ] Context cancellation is checked in the worker select loop
- [ ] `sync.WaitGroup` ensures all workers complete before returning
- [ ] Error channel is buffered to avoid goroutine leaks on first error
- [ ] Results channel is closed only after all workers finish (via WaitGroup)
