# Testing Review

## Rules

- **Flag non-table-driven tests.** Multiple similar test cases should use `[]struct{...}` with named fields.
- **Flag missing `t.Run`.** Every table entry must run as a named subtest.
- **Flag missing `name` field.** Test tables must have a `name string` field as the first field.
- **Flag `assert` for preconditions.** Use `require` (fatal) for preconditions, `assert` (non-fatal) for checks.
- **Flag bloated test tables.** >10 cases or divergent setup needs should be split into separate test functions.
- **Flag missing goroutine leak detection.** Packages with goroutines should use `goleak.VerifyTestMain`.
- **Flag positional test struct fields.** Same rule as production code — always use field names.

## Patterns

### Non-Table Test — Flag

```go
func TestParse(t *testing.T) {
    got1, _ := Parse("http://example.com")
    assert.Equal(t, "http", got1.Scheme)

    got2, _ := Parse("https://example.com")
    assert.Equal(t, "https", got2.Scheme)
}
```

### Non-Table Test — Suggest

```go
func TestParse(t *testing.T) {
    tests := []struct {
        name       string
        input      string
        wantScheme string
    }{
        {name: "http", input: "http://example.com", wantScheme: "http"},
        {name: "https", input: "https://example.com", wantScheme: "https"},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Parse(tt.input)
            require.NoError(t, err)
            assert.Equal(t, tt.wantScheme, got.Scheme)
        })
    }
}
```

### Assert vs Require — Flag

```go
user, err := GetUser("123")
assert.NoError(t, err)  // non-fatal — continues with nil user
assert.Equal(t, "Alice", user.Name) // nil dereference panic
```

### Assert vs Require — Suggest

```go
user, err := GetUser("123")
require.NoError(t, err)     // fatal — stops if error
require.NotNil(t, user)     // fatal — stops if nil
assert.Equal(t, "Alice", user.Name)
```

### Bloated Table — Flag

```go
// 30+ cases mixing success, errors, auth
func TestHandler(t *testing.T) {
    tests := []struct{ ... }{ /* too many */ }
}
```

### Bloated Table — Suggest

```go
func TestHandler_Success(t *testing.T) { ... }
func TestHandler_ValidationErrors(t *testing.T) { ... }
func TestHandler_AuthFailures(t *testing.T) { ... }
```

## Checklist

- [ ] Similar test cases use table-driven pattern with `[]struct`
- [ ] Every table entry has a `name` field and uses `t.Run`
- [ ] `require` for preconditions, `assert` for verification
- [ ] No bloated tables — split at ~10 cases or divergent setup
- [ ] `goleak.VerifyTestMain` in packages with goroutines
- [ ] Test struct fields use names, not positional values
