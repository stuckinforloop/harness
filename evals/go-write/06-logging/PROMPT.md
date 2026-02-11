Write a Go HTTP server with proper structured logging using `log/slog`. Requirements:

- Use `log/slog` with `JSONHandler` for all logging (not `fmt.Println` or `log.Printf`)
- Use typed attributes (`slog.String`, `slog.Int`, `slog.Any`) — no `fmt.Sprintf` in log args
- Accept `*slog.Logger` as a dependency in struct constructors (not global logger)
- Use static log messages with variable data in attributes
- Use `ErrorContext`/`InfoContext` when `context.Context` is available
- Derive child loggers with `logger.With()`, not `slog.New()` per request
- Include a `main` function that starts the server

Place all code in the `src/` directory.
