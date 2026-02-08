# Code Style Review

## Rules

### Naming
- **Flag generic package names.** `util`, `common`, `base`, `helpers` — suggest specific names.
- **Flag wrong package name format.** Must be lowercase, singular, no underscores, no camelCase.
- **Flag vanity import aliases.** Aliases only for disambiguation between same-named packages.
- **Flag `this`/`self` receivers.** Use 1-2 letter names, consistent across methods.
- **Flag unexported globals without `_` prefix.** `_timeout` not `timeout` for package-level vars.

### Declarations
- **Flag `var x T = val` inside functions.** Suggest `:=` for local variables.
- **Flag `s == nil` for emptiness.** Suggest `len(s) == 0`.
- **Flag `Config{}` for zero value.** Suggest `var cfg Config`.
- **Flag positional struct fields.** Always use field names.
- **Flag explicit zero-value fields.** Omit fields that match zero value.

### Organization
- **Flag wrong import ordering.** Must be stdlib → blank line → external.
- **Flag deep nesting.** Suggest early returns and `continue` to flatten.
- **Flag unnecessary `else`.** If both branches set a variable, suggest default + `if`.
- **Flag long lines.** Suggest breaking at ~99 characters.

## Patterns

### Package Name — Flag

```go
package string_utils // underscore
package httpHelpers   // camelCase
package common       // generic
```

### Package Name — Suggest

```go
package stringutil
package auth
```

### Nesting — Flag

```go
if len(items) > 0 {
    for _, item := range items {
        if item.Valid {
            if err := handle(item); err != nil {
                return err
            }
        }
    }
}
```

### Nesting — Suggest

```go
if len(items) == 0 {
    return nil
}
for _, item := range items {
    if !item.Valid {
        continue
    }
    if err := handle(item); err != nil {
        return err
    }
}
```

### Unnecessary Else — Flag

```go
var status string
if isActive {
    status = "active"
} else {
    status = "inactive"
}
```

### Unnecessary Else — Suggest

```go
status := "inactive"
if isActive {
    status = "active"
}
```

## Checklist

- [ ] Package names are lowercase, singular, not generic
- [ ] Import order: stdlib → blank → external
- [ ] `:=` for local variables, not `var x T = val`
- [ ] Empty checks use `len(s) == 0`, not `s == nil`
- [ ] Struct init uses field names, omits zero values
- [ ] No deep nesting — early returns and `continue` used
- [ ] No unnecessary `else` blocks
- [ ] Lines ≤ ~99 characters
- [ ] Receiver names are 1-2 letters, consistent
- [ ] Unexported package-level vars prefixed with `_`
