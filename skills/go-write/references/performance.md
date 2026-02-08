# Performance

## Rules

- **`strconv` over `fmt`** for primitive conversions. `strconv.Itoa(n)` is faster than `fmt.Sprint(n)`.
- **Cache `[]byte` conversions** outside loops. `string(bytes)` allocates — don't repeat in hot paths.
- **Pre-allocate slices** with `make([]T, 0, n)` when length is known or estimable.
- **Pre-allocate maps** with `make(map[K]V, n)` when size is known.
- **Prefer `strings.Builder`** for multi-step string construction over `+` concatenation.

## Patterns

### String Conversion — Bad

```go
s := fmt.Sprint(42)           // slow — uses reflection
s := fmt.Sprintf("%d", 42)   // slow — format parsing
```

### String Conversion — Good

```go
s := strconv.Itoa(42)        // direct conversion, no reflection
s := strconv.FormatFloat(f, 'f', -1, 64)
```

### Byte Conversion in Loop — Bad

```go
for i := 0; i < b.N; i++ {
    s := string(data)  // allocates every iteration
    _ = s
}
```

### Byte Conversion in Loop — Good

```go
s := string(data)  // convert once
for i := 0; i < b.N; i++ {
    _ = s
}
```

### Slice Pre-allocation — Bad

```go
var items []Item
for _, v := range input {
    items = append(items, transform(v))  // grows backing array multiple times
}
```

### Slice Pre-allocation — Good

```go
items := make([]Item, 0, len(input))
for _, v := range input {
    items = append(items, transform(v))  // no reallocation
}
```

### Map Pre-allocation

```go
m := make(map[string]Item, len(input))  // avoids rehashing
for _, v := range input {
    m[v.Key] = v
}
```

### String Building — Bad

```go
s := ""
for _, v := range items {
    s += v.String()  // O(n²) — copies entire string each iteration
}
```

### String Building — Good

```go
var b strings.Builder
for _, v := range items {
    b.WriteString(v.String())
}
s := b.String()
```

## Checklist

- [ ] `strconv` used instead of `fmt.Sprint` for numbers/bools
- [ ] `[]byte` → `string` conversions hoisted out of loops
- [ ] Slices pre-allocated with `make([]T, 0, n)` when size known
- [ ] Maps pre-allocated with `make(map[K]V, n)` when size known
- [ ] Multi-step string building uses `strings.Builder`
