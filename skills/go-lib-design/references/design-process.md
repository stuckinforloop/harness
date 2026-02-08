# Design Process

## Rules

- **Optimize for four axes.** Every API decision should improve usability, readability, flexibility, and testability. When axes conflict, prefer usability.
- **Work backwards from usage.** Write pseudo-code showing how callers will use the API before writing any implementation. This reveals naming issues, misuse risks, and missing convenience.
- **Minimize surface area.** Smaller public API = more freedom to refactor internals. Every export is a permanent commitment after v1.0.
- **When in doubt, leave it out.** You can always export a symbol later. You can never unexport it without a breaking change.
- **Make common tasks easy, uncommon tasks possible.** Provide convenience helpers for the 90% case. Don't force every caller through the advanced path.

## Patterns

### Design by Implementation — Bad

```go
// Started with internals, then exposed whatever was convenient
type Parser struct {
    tokenizer *tokenizer
    ast       *node
}

func (p *Parser) Tokenize(input []byte) []*Token { ... }  // leaks internal concept
func (p *Parser) BuildAST(tokens []*Token) *node { ... }   // leaks internal type
func (p *Parser) Evaluate(n *node) (Result, error) { ... } // forces multi-step usage
```

### Design by Usage — Good

```go
// Started with: "what should callers write?"
//   result, err := parser.Parse(input)
//   result, err := parser.ParseFile("config.yaml")

type Parser struct { /* internal */ }

func (p *Parser) Parse(r io.Reader) (*Result, error) { ... }

// Convenience wrapper for common case
func (p *Parser) ParseFile(name string) (*Result, error) {
    f, err := os.Open(name)
    if err != nil {
        return nil, err
    }
    defer f.Close()
    return p.Parse(f)
}
```

### Excessive Surface Area — Bad

```go
// Pre-1.0: exported everything "just in case"
type Value struct{ /* ... */ }

func (*Value) AsBool() bool
func (*Value) AsFloat64() float64
func (*Value) AsInt() int
func (*Value) AsString() string
func (*Value) Populate(target interface{}) error
func (*Value) TryAsBool() (_ bool, ok bool)
func (*Value) TryAsFloat64() (_ float64, ok bool)
func (*Value) TryAsInt() (_ int, ok bool)
func (*Value) TryAsString() (_ string, ok bool)
```

### Minimal Surface Area — Good

```go
// Post-1.0: found that Populate covered all use cases
type Value struct{ /* ... */ }

func (*Value) Populate(target interface{}) error
```

### Convenience Layering — Good

```go
// Core: flexible, works with any source
var client http.Client
res, err := client.Get("http://example.com")

// Convenience: for applications (not libraries) that want quick one-offs
res, err := http.Get("http://example.com")
```

## Checklist

- [ ] API was designed from usage pseudo-code, not from implementation structure
- [ ] Every export is intentional and justified — no "might need later" exports
- [ ] Common operations have convenience helpers (1-2 lines for callers)
- [ ] Advanced operations are possible but don't clutter the simple path
- [ ] Usability was considered: clear naming, hard to misuse, discoverable
- [ ] Testability was considered: components are swappable, no hidden dependencies
