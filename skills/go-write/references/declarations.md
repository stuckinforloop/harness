# Declarations

## Rules

- **`:=` for local variables.** Use short variable declarations inside functions. Reserve `var` for package-level and explicit zero values.
- **Nil is a valid empty slice.** Use `len(s) == 0` to check emptiness, not `s == nil`. Don't return `[]T{}` when `nil` works.
- **`var s Struct` for zero value.** When you want the zero value of a struct, use `var` — not `Struct{}` or `&Struct{}`.
- **`&T{}` with fields for pointer creation.** When initializing a struct pointer with field values, use `&T{Field: val}`.
- **`make(map[K]V)` for populate-later maps.** Use `make` when you'll add entries. Use a literal for known contents.
- **Always use field names** in struct initialization. Never use positional fields.
- **Omit zero-value fields** in struct initialization. Only set fields that differ from zero.
- **Format strings as `const`.** Extract repeated format strings to package-level constants.

## Patterns

### Short Declarations — Bad

```go
var count int = 0        // unnecessary type and value
var name string = "foo"  // use := inside functions
```

### Short Declarations — Good

```go
count := 0
name := "foo"
```

### Nil Slice

```go
// Bad — unnecessary allocation
return []string{}

// Good — nil is a valid empty slice
return nil

// Bad — checking for nil instead of emptiness
if s == nil { ... }

// Good
if len(s) == 0 { ... }
```

### Zero-Value Structs

```go
// Bad
cfg := Config{}

// Good — clear intent: zero value
var cfg Config
```

### Struct with Fields

```go
// Bad — positional fields
u := User{"123", "Alice", "alice@example.com"}

// Good — named fields, zero values omitted
u := User{
    ID:    "123",
    Name:  "Alice",
    Email: "alice@example.com",
}
```

### Pointer Initialization

```go
// Bad
cfg := new(Config)
cfg.Port = 8080

// Good
cfg := &Config{
    Port: 8080,
}
```

### Map Initialization

```go
// Populate later — use make
m := make(map[string]int)

// Known contents — use literal
m := map[string]int{
    "a": 1,
    "b": 2,
}
```

### Format String Constants

```go
// Bad — repeated format string
fmt.Sprintf("user %s not found in %s", id, store)
fmt.Sprintf("user %s not found in %s", id, cache)

// Good
const userNotFoundFmt = "user %s not found in %s"
fmt.Sprintf(userNotFoundFmt, id, store)
```

## Checklist

- [ ] `:=` used for local variables inside functions
- [ ] Empty slice checks use `len(s) == 0`, not `s == nil`
- [ ] `var s Struct` for zero-value structs
- [ ] Struct init always uses field names
- [ ] Zero-value fields omitted in struct init
- [ ] `make(map)` for maps that will be populated
- [ ] Repeated format strings extracted to `const`
