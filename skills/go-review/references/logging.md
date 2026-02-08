# Logging Review

## Rules

- **Flag `fmt.Println` / `log.Printf` for application logging.** All application logging should use `log/slog`.
- **Flag `fmt.Sprintf` in log arguments.** Allocates even when the log level is disabled. Use typed attributes instead.
- **Flag untyped alternating key-value pairs on hot paths.** Prefer `slog.LogAttrs` with `slog.String`, `slog.Int`, etc.
- **Flag unbalanced key-value pairs.** Missing values produce `!BADKEY` in output. Typed attributes prevent this at compile time.
- **Flag `slog.Info` / `slog.Error` on the global logger inside libraries.** Libraries should accept `*slog.Logger` as a dependency.
- **Flag error message as log message.** `slog.Error(err.Error())` loses structure. The message should describe the operation; the error goes in an attribute.
- **Flag wrong log level.** Errors at Info, routine events at Warn. Match level to severity.
- **Flag raw structs with sensitive fields in log attributes.** Types with passwords, tokens, or keys must implement `slog.LogValuer`.
- **Flag dynamic/interpolated log messages.** Messages should be static string literals. Variable data belongs in attributes.
- **Flag missing `Context` variant.** When `context.Context` is available, use `InfoContext`, `ErrorContext`, etc.
- **Flag new handler creation per request.** Derive child loggers with `logger.With()`, not `slog.New()` per call.
- **Flag logger smuggled into context.** `context.WithValue(ctx, loggerKey, logger)` creates implicit dependencies. Pass `*slog.Logger` explicitly.
- **Flag missing `Enabled` guard for expensive attributes.** Check `logger.Enabled(ctx, level)` before costly serialization.

## Patterns

### fmt.Sprintf in Log Args — Flag

```go
slog.Info(fmt.Sprintf("user %s logged in from %s", userID, ip))
slog.Debug("request", "body", fmt.Sprintf("%+v", req))
```

### fmt.Sprintf in Log Args — Suggest

```go
slog.Info("user logged in",
    slog.String("user_id", userID),
    slog.String("ip", ip),
)
```

### Error as Message — Flag

```go
slog.Error(err.Error())
```

### Error as Message — Suggest

```go
slog.ErrorContext(ctx, "database query failed",
    slog.String("query", query),
    slog.Any("error", err),
)
```

### Raw Struct with Sensitive Data — Flag

```go
type User struct {
    ID       string
    Email    string
    Password string
}

slog.Info("user created", "user", user) // password in logs
```

### Raw Struct with Sensitive Data — Suggest

```go
func (u User) LogValue() slog.Value {
    return slog.GroupValue(
        slog.String("id", u.ID),
        slog.String("email", u.Email),
        // Password intentionally omitted
    )
}
```

### Global Logger in Library — Flag

```go
func (s *Store) Save(item Item) error {
    slog.Info("saving item", "id", item.ID) // hard-coded global
    // ...
}
```

### Global Logger in Library — Suggest

```go
type Store struct {
    logger *slog.Logger
}

func NewStore(logger *slog.Logger) *Store {
    if logger == nil {
        logger = slog.Default()
    }
    return &Store{logger: logger}
}

func (s *Store) Save(item Item) error {
    s.logger.Info("saving item", slog.String("id", item.ID))
    // ...
}
```

### Wrong Log Level — Flag

```go
slog.Info("failed to connect to database", slog.Any("error", err))
slog.Warn("request received", slog.String("path", r.URL.Path))
```

### Wrong Log Level — Suggest

```go
slog.Error("connect to database", slog.Any("error", err))
slog.Info("request received", slog.String("path", r.URL.Path))
```

### New Handler Per Request — Flag

```go
func handle(w http.ResponseWriter, r *http.Request) {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
    logger.Info("request")
}
```

### New Handler Per Request — Suggest

```go
func handle(w http.ResponseWriter, r *http.Request) {
    logger := slog.Default().With(
        slog.String("request_id", r.Header.Get("X-Request-ID")),
    )
    logger.Info("request")
}
```

### Missing Enabled Guard — Flag

```go
logger.Debug("full state", slog.Any("state", expensiveSerialize(state)))
```

### Missing Enabled Guard — Suggest

```go
if logger.Enabled(ctx, slog.LevelDebug) {
    logger.Debug("full state", slog.Any("state", expensiveSerialize(state)))
}
```

## Checklist

- [ ] No `fmt.Println` / `log.Printf` for application logging — use `log/slog`
- [ ] No `fmt.Sprintf` in log messages or attribute values
- [ ] Typed attributes (`slog.String`, `slog.Int`) on hot paths, not alternating key-value
- [ ] Error messages describe the operation — error value goes in `slog.Any("error", err)`
- [ ] Log level matches severity: Debug, Info, Warn, Error
- [ ] Types with sensitive fields implement `slog.LogValuer`
- [ ] Log messages are static string literals — variable data in attributes
- [ ] Libraries accept `*slog.Logger` as dependency, not global `slog.Default()`
- [ ] `*Context` variants used when `context.Context` is available
- [ ] Expensive attribute construction guarded by `logger.Enabled()` check
- [ ] Child loggers derived with `With()`, not new `slog.New()` per call
