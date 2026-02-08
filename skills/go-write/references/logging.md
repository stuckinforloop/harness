# Structured Logging (log/slog)

## Rules

- **Use `log/slog` for all new code.** It is the stdlib structured logger since Go 1.21. Do not use `log` or `fmt.Println` for application logging.
- **Choose handler by environment.** `slog.NewTextHandler` for local development, `slog.NewJSONHandler` for production. Select at the composition root (`main`), not inside libraries.
- **Use strongly-typed attributes.** Prefer `slog.String`, `slog.Int`, `slog.Bool`, `slog.Duration` over alternating `key, value` pairs. Use `slog.LogAttrs` for the most type-safe and allocation-efficient path.
- **Use `logger.With` for shared context.** Attach attributes common to a scope (request ID, user ID, trace ID) once via `With` — they are pre-formatted, not repeated per call.
- **Group related attributes.** Use `slog.Group` to namespace related fields (e.g., `"http"` group for method, path, status).
- **Implement `slog.LogValuer` for custom types.** Controls how structs appear in logs. Use it to redact sensitive fields, flatten nested types, or produce consistent representations.
- **Accept `*slog.Logger` as a dependency.** Libraries should accept a logger parameter, not call the global `slog.Default()`. Use `slog.Default()` only as a fallback when nil is passed.
- **Log errors at the handling site only.** Same rule as error handling — log once where you handle the error, not where you propagate it.
- **Use appropriate log levels.** `Debug` for development diagnostics, `Info` for normal operations, `Warn` for recoverable anomalies, `Error` for failures that need attention.
- **Keep messages static.** Log messages should be grep-able string literals. Put variable data in attributes, not interpolated into the message.
- **Use `slog.LevelVar` for dynamic level control.** Allows runtime level changes without restarting.

## Patterns

### Handler Setup — Bad

```go
// Hard-coded handler, no configuration
func main() {
    slog.Info("starting") // uses default text handler to stderr
}
```

### Handler Setup — Good

```go
func main() {
    var handler slog.Handler
    if os.Getenv("ENV") == "production" {
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: slog.LevelInfo,
        })
    } else {
        handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
            Level:     slog.LevelDebug,
            AddSource: true,
        })
    }
    slog.SetDefault(slog.New(handler))
}
```

### Alternating Keys — Bad

```go
slog.Info("request",
    "method", r.Method,    // untyped — vet catches mismatches but no compile-time safety
    "path", r.URL.Path,
    "status", status,
)
```

### Typed Attributes — Good

```go
slog.LogAttrs(ctx, slog.LevelInfo, "request",
    slog.String("method", r.Method),
    slog.String("path", r.URL.Path),
    slog.Int("status", status),
    slog.Duration("latency", elapsed),
)
```

### Logger as Dependency — Bad

```go
func (s *Server) handleRequest(r *http.Request) {
    slog.Info("handling request") // global logger — hard to test, can't silence
}
```

### Logger as Dependency — Good

```go
type Server struct {
    logger *slog.Logger
}

func NewServer(logger *slog.Logger) *Server {
    if logger == nil {
        logger = slog.Default()
    }
    return &Server{logger: logger}
}

func (s *Server) handleRequest(r *http.Request) {
    s.logger.InfoContext(r.Context(), "handling request",
        slog.String("method", r.Method),
    )
}
```

### Shared Context with With

```go
func (s *Server) handleRequest(w http.ResponseWriter, r *http.Request) {
    logger := s.logger.With(
        slog.String("request_id", r.Header.Get("X-Request-ID")),
        slog.String("method", r.Method),
        slog.String("path", r.URL.Path),
    )
    logger.InfoContext(r.Context(), "request started")
    // ... all subsequent logs include request_id, method, path
    logger.InfoContext(r.Context(), "request completed",
        slog.Int("status", status),
    )
}
```

### Grouping Attributes

```go
slog.LogAttrs(ctx, slog.LevelInfo, "request completed",
    slog.Group("http",
        slog.String("method", r.Method),
        slog.String("path", r.URL.Path),
        slog.Int("status", status),
    ),
    slog.Duration("latency", elapsed),
)
// JSON: {"http":{"method":"GET","path":"/api","status":200},"latency":"12ms"}
```

### LogValuer for Sensitive Data — Bad

```go
type User struct {
    ID       string
    Email    string
    Password string
}

slog.Info("user login", "user", user) // password appears in logs
```

### LogValuer for Sensitive Data — Good

```go
type User struct {
    ID       string
    Email    string
    Password string
}

func (u User) LogValue() slog.Value {
    return slog.GroupValue(
        slog.String("id", u.ID),
        slog.String("email", u.Email),
        // Password intentionally omitted
    )
}

slog.Info("user login", "user", user) // safe — only id and email
```

### Static Messages — Bad

```go
slog.Info(fmt.Sprintf("user %s logged in from %s", userID, ip))
```

### Static Messages — Good

```go
slog.Info("user logged in",
    slog.String("user_id", userID),
    slog.String("ip", ip),
)
```

### Dynamic Log Level

```go
var logLevel slog.LevelVar // defaults to Info

handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: &logLevel,
})

// Change at runtime (e.g., via HTTP endpoint or signal)
logLevel.Set(slog.LevelDebug)
```

### Error Logging — Bad

```go
if err != nil {
    slog.Error(err.Error()) // no context, not structured
}
```

### Error Logging — Good

```go
if err != nil {
    slog.ErrorContext(ctx, "process job",
        slog.String("job_id", job.ID),
        slog.Any("error", err),
    )
}
```

## Checklist

- [ ] Application uses `slog.NewJSONHandler` in production, `slog.NewTextHandler` in development
- [ ] Handler is configured in `main()` and passed as dependency — not hard-coded in libraries
- [ ] Attributes use typed constructors (`slog.String`, `slog.Int`, etc.) not alternating key/value
- [ ] Shared context (request ID, trace ID) attached via `logger.With`
- [ ] Related attributes grouped with `slog.Group`
- [ ] Custom types implement `slog.LogValuer` — sensitive fields omitted or redacted
- [ ] Log messages are static string literals — variable data in attributes only
- [ ] `*slog.Logger` accepted as a dependency, `slog.Default()` used only as nil fallback
- [ ] Error logs include structured context (operation, IDs) alongside the error
- [ ] Log levels follow convention: Debug (diagnostics), Info (operations), Warn (anomalies), Error (failures)
