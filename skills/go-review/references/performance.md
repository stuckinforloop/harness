# Performance Review

## Rules

- **Flag `fmt.Sprint` for primitive conversions.** Suggest `strconv.Itoa`, `strconv.FormatFloat`, etc. `fmt` uses reflection.
- **Flag `[]byte` → `string` conversions in loops.** Each conversion allocates. Suggest hoisting outside the loop.
- **Flag missing slice pre-allocation.** When the length is known or estimable, suggest `make([]T, 0, n)`.
- **Flag missing map pre-allocation.** When the size is known, suggest `make(map[K]V, n)` to avoid rehashing.
- **Flag `+` string concatenation in loops.** O(n²) — copies the entire string each iteration. Suggest `strings.Builder`.

## Patterns

### fmt.Sprint — Flag

```go
s := fmt.Sprint(42)          // reflection overhead
s := fmt.Sprintf("%d", 42)   // format parsing overhead
```

### fmt.Sprint — Suggest

```go
s := strconv.Itoa(42)
s := strconv.FormatFloat(f, 'f', -1, 64)
```

### Repeated Allocation — Flag

```go
for i := 0; i < b.N; i++ {
    s := string(data) // allocates every iteration
    process(s)
}
```

### Repeated Allocation — Suggest

```go
s := string(data) // convert once
for i := 0; i < b.N; i++ {
    process(s)
}
```

### Missing Pre-allocation — Flag

```go
var items []Item
for _, v := range input {
    items = append(items, transform(v)) // grows backing array multiple times
}
```

### Missing Pre-allocation — Suggest

```go
items := make([]Item, 0, len(input))
for _, v := range input {
    items = append(items, transform(v))
}
```

### String Concatenation — Flag

```go
s := ""
for _, v := range items {
    s += v.String() // O(n²)
}
```

### String Concatenation — Suggest

```go
var b strings.Builder
for _, v := range items {
    b.WriteString(v.String())
}
s := b.String()
```

## Checklist

- [ ] No `fmt.Sprint` / `fmt.Sprintf` for number/bool conversions — use `strconv`
- [ ] No `[]byte` → `string` conversions inside loops
- [ ] Slices pre-allocated with `make([]T, 0, n)` when size known
- [ ] Maps pre-allocated with `make(map[K]V, n)` when size known
- [ ] Multi-step string building uses `strings.Builder`, not `+`
