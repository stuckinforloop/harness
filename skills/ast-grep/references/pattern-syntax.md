# Pattern Syntax

## Rules

- **`$VAR` matches any single AST node** (a named node in the tree-sitter grammar). The name must be `UPPER_SNAKE_CASE`.
- **`$$$` matches zero or more nodes.** Use for variadic arguments or bodies. Example: `fmt.Errorf($$$ARGS)` matches any number of arguments.
- **`$_` is a non-capturing wildcard.** Matches any single node without binding a name. Use when you don't need the matched value.
- **Same `$VAR` = equality constraint.** Two occurrences of `$VAR` in one pattern must match identical text. Example: `$X == $X` matches `a == a` but not `a == b`.
- **Patterns are code snippets.** Write the pattern as if writing real code, replacing variable parts with metavariables.
- **Patterns match at expression or statement level.** A pattern like `panic($$$)` matches `panic` calls anywhere in the file — inside functions, in `init()`, etc.
- **Literal syntax must match exactly.** Operators, keywords, and punctuation must appear as-is. Only metavariable positions are flexible.

## Patterns

### Regex for sentinel errors — Bad

```typescript
const matches = code.match(/var\s+Err\w+\s*=\s*errors\.New\(/g);
```

### ast-grep for sentinel errors — Good

```typescript
const matches = runAstGrep("var $ERR = errors.New($MSG)", srcDir);
// Filter for exported sentinel naming convention
const sentinels = matches.filter((m) =>
  m.metaVariables.single.ERR.text.startsWith('Err'),
);
```

### Common Go patterns

```
// Compile-time interface check
var _ $IFACE = (*$IMPL)(nil)

// Error wrapping with fmt.Errorf
fmt.Errorf($$$ARGS)

// errors.New
errors.New($MSG)

// Two-value type assertion
$VAL, ok := $EXPR.($TYPE)

// Defer usage
defer $EXPR

// Function declaration
func $NAME($$$PARAMS) $$$RETURNS { $$$BODY }
```

### Metavariable access in JSON output

```typescript
// sg run --json returns objects with metaVariables
const match = matches[0];
// Single metavariable
match.metaVariables.single.VAR.text;   // the matched text
match.metaVariables.single.VAR.start;  // { line, column }
// Multi-match metavariable
match.metaVariables.multi.ARGS;        // array of nodes
```

## Checklist

- [ ] Metavariable names are `UPPER_SNAKE_CASE`
- [ ] `$$$` used for variadic/multi-node positions, `$VAR` for single nodes
- [ ] Pattern written as valid code with metavariable substitutions
- [ ] Same-name metavariables intentionally constrain equality
- [ ] `$_` used instead of `$VAR` when captured value is not needed
