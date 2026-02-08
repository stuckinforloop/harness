# Testing

## Rules

- **Table-driven tests.** Use `[]struct{...}` with named fields for test cases. Never positional field initialization.
- **`t.Run` for subtests.** Every table entry runs as a named subtest for clear failure output.
- **Name field in test table.** Always include a `name string` field as the first field in the test struct.
- **Split complex tables.** If a test table grows beyond ~10 cases or needs divergent setup, split into separate test functions.
- **`testify` for assertions.** Use `assert` for non-fatal checks and `require` for fatal preconditions.
- **`go.uber.org/goleak`** to detect goroutine leaks in test suites.

## Patterns

### Table-Driven Test

```go
func TestParseURL(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    *URL
        wantErr bool
    }{
        {
            name:  "valid http url",
            input: "http://example.com/path",
            want:  &URL{Scheme: "http", Host: "example.com", Path: "/path"},
        },
        {
            name:    "empty input",
            input:   "",
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseURL(tt.input)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

### Testify Assert vs Require

```go
func TestUser(t *testing.T) {
    user, err := GetUser("123")
    require.NoError(t, err)     // fatal — stop if no user
    require.NotNil(t, user)     // fatal — can't check fields of nil

    assert.Equal(t, "Alice", user.Name)   // non-fatal — check all fields
    assert.Equal(t, "alice@x.com", user.Email)
}
```

### Goroutine Leak Detection

```go
func TestMain(m *testing.M) {
    goleak.VerifyTestMain(m)
}
```

### Split Complex Tables — Bad

```go
// 30+ cases mixing success, errors, edge cases, auth failures
func TestHandler(t *testing.T) {
    tests := []struct{ ... }{ /* too many cases */ }
}
```

### Split Complex Tables — Good

```go
func TestHandler_Success(t *testing.T) { ... }
func TestHandler_ValidationErrors(t *testing.T) { ... }
func TestHandler_AuthFailures(t *testing.T) { ... }
```

## Checklist

- [ ] Test cases use `[]struct` with named fields
- [ ] Every table entry has a `name` field
- [ ] `t.Run(tt.name, ...)` used for subtests
- [ ] `require` for preconditions, `assert` for checks
- [ ] Complex test tables split into focused test functions
- [ ] `goleak.VerifyTestMain` in packages with goroutines
