Write a concurrent task processor in Go that processes a batch of work items using
a worker pool pattern.

Requirements:

- Accept a `context.Context` as the first parameter for cancellation support.
- Use `sync.WaitGroup` to track goroutine completion. Call `wg.Add(1)` before
  launching each goroutine, not inside it.
- Use `defer wg.Done()` as the first statement inside each worker goroutine.
- Include a `select` statement with a `case <-ctx.Done():` branch for cancellation.
- Use channels with buffer size 0 or 1 only (no large buffers).
- The program must complete and exit cleanly — no hanging goroutines.
- Include a `main` function that creates a `context.WithTimeout`, sends work items
  to the pool, and waits for completion.

Place all code in the `src/` directory.
