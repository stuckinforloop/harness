# Rule Syntax

## Rules

- **Three rule categories.** Atomic (`pattern`, `kind`, `regex`), relational (`inside`, `has`, `precedes`, `follows`), composite (`all`, `any`, `not`, `matches`).
- **At least one positive rule required.** Every rule object must contain at least one atomic or relational rule. `not` alone is invalid.
- **`kind` matches tree-sitter node types.** Use `sg run --debug-query=ast -p '$_' --lang go file.go` to discover node kinds for Go.
- **Always use `stopBy: end` with `has` and `inside`.** Without it, matching stops at the first nesting level and misses deeply nested nodes.
- **`pattern` matches code structure.** Same syntax as `sg run --pattern` but embedded in YAML.
- **`regex` matches the text content of a node.** Applied to the node's source text, not the whole file.
- **`inside` checks ancestor nodes.** "This node must be inside a node matching rule X."
- **`has` checks descendant nodes.** "This node must have a descendant matching rule X."
- **`not` negates a rule.** Must be combined with a positive rule via `all`. Example: `all: [{ pattern: X }, { not: { inside: Y } }]`.
- **`all` requires every sub-rule to match.** `any` requires at least one.
- **`matches` references a named utility rule** defined in the `utils` section. Use for reusable sub-rules.

## Patterns

### Match only inside a specific function

```yaml
rule:
  pattern: panic($$$)
  inside:
    kind: function_declaration
    has:
      kind: identifier
      regex: ^handleRequest$
    stopBy: end
```

### Match outside a specific function (using not + inside)

```yaml
rule:
  pattern: panic($$$)
  not:
    inside:
      kind: function_declaration
      has:
        kind: identifier
        regex: ^main$
      stopBy: end
```

### Match struct with specific field

```yaml
rule:
  kind: struct_type
  has:
    pattern: mu sync.$MUTEX_TYPE
    stopBy: end
```

### Match any of several patterns

```yaml
rule:
  any:
    - pattern: errors.New($MSG)
    - pattern: fmt.Errorf($$$ARGS)
```

### Composite: match X but not Y

```yaml
rule:
  all:
    - pattern: os.Exit($CODE)
    - not:
        inside:
          kind: function_declaration
          has:
            kind: identifier
            regex: ^main$
          stopBy: end
```

### Common Go tree-sitter node kinds

```
function_declaration    — func name(...) { ... }
method_declaration      — func (r T) name(...) { ... }
interface_type          — interface { ... }
struct_type             — struct { ... }
field_declaration       — field in struct/interface
identifier              — names (func name, var name, etc.)
call_expression         — function/method calls
type_assertion_expression — x.(T)
defer_statement         — defer expr
raw_string_literal      — `backtick strings`
```

## Checklist

- [ ] Every `has` and `inside` rule includes `stopBy: end`
- [ ] Every rule object has at least one positive rule (not `not`-only)
- [ ] `kind` values verified against tree-sitter grammar (use `--debug-query=ast`)
- [ ] `regex` patterns anchored with `^`/`$` where appropriate
- [ ] Composite rules (`all`, `any`) contain arrays of sub-rules
- [ ] `not` combined with a positive rule via `all`, never standalone
