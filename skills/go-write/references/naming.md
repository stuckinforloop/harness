# Naming

## Rules

- **Package names**: lowercase, short, singular, no underscores, no generic names (`util`, `common`, `base`, `helpers`).
- **Unexported global prefix**: Prefix unexported package-level variables with `_` to distinguish from local variables.
- **Import aliases**: Only use to resolve ambiguity between packages with the same name. No vanity aliases.
- **Printf-style suffix**: Functions that accept format strings end in `f` — `Errorf`, `Logf`, `Warnf`.
- **Receiver names**: Short (1-2 letters), consistent across methods. Not `this` or `self`.

## Patterns

### Package Names — Bad

```go
package string_utils    // underscore
package httpHelpers     // camelCase
package models          // plural
package common          // generic
```

### Package Names — Good

```go
package stringutil
package http
package model
package auth
```

### Unexported Global Prefix — Bad

```go
var (
    pool    = newPool()    // looks like a local variable
    timeout = 30 * time.Second
)
```

### Unexported Global Prefix — Good

```go
var (
    _pool    = newPool()
    _timeout = 30 * time.Second
)
```

### Import Aliases — Bad

```go
import (
    logger "github.com/sirupsen/logrus"  // vanity alias
)
```

### Import Aliases — Good

```go
import (
    "github.com/sirupsen/logrus"  // use package name directly
)

// Only alias when names collide
import (
    nurl "net/url"
    "github.com/example/url"
)
```

### Receiver Names

```go
// Bad
func (this *Client) Do() { ... }
func (self *Client) Do() { ... }

// Good
func (c *Client) Do() { ... }
```

## Checklist

- [ ] Package names are lowercase, singular, no underscores, not generic
- [ ] Unexported package-level vars prefixed with `_`
- [ ] Import aliases only for disambiguation
- [ ] Format-string functions end in `f`
- [ ] Receiver names are 1-2 letters, consistent across methods
