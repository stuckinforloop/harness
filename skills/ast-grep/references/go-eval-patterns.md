# Go Eval Patterns

Ready-to-use ast-grep patterns for Go convention checks in EVAL.ts files. Organized by `go-review` skill categories. Each pattern shows the regex it replaces (when applicable) and the ast-grep equivalent.

## Patterns

### Errors

#### Sentinel errors defined with errors.New

```typescript
// Regex: /var\s+Err\w+\s*=\s*errors\.New\(/g
const matches = runAstGrep("var $ERR = errors.New($MSG)", srcDir);
const sentinels = matches.filter((m) =>
  m.metaVariables.single.ERR.text.startsWith('Err'),
);
expect(sentinels.length).toBeGreaterThanOrEqual(2);
```

#### Flag fmt.Errorf sentinels (non-comparable)

```typescript
// Detect: var ErrX = fmt.Errorf("...") — sentinels must use errors.New
const matches = runAstGrep("var $ERR = fmt.Errorf($$$ARGS)", srcDir);
const badSentinels = matches.filter((m) =>
  m.metaVariables.single.ERR.text.startsWith('Err'),
);
expect(badSentinels, 'sentinels must use errors.New, not fmt.Errorf').toHaveLength(0);
```

#### Error wrapping with %w

```typescript
// Regex: /fmt\.Errorf\([^)]*%w/g
const matches = runAstGrep("fmt.Errorf($$$ARGS)", srcDir);
const wrapping = matches.filter((m) => m.text.includes('%w'));
expect(wrapping.length).toBeGreaterThanOrEqual(2);
```

#### Flag log-and-return anti-pattern

```typescript
// Detect log.Printf/log.Println calls — library code should return errors, not log them
const logCalls = runAstGrep("log.Printf($$$ARGS)", srcDir);
const logLn = runAstGrep("log.Println($$$ARGS)", srcDir);
expect(
  [...logCalls, ...logLn],
  'service code should not log errors — return them instead',
).toHaveLength(0);
```

#### Flag direct error comparison (should use errors.Is/errors.As)

```typescript
// Detect: err == ErrX (breaks with wrapping)
const rule = JSON.stringify({
  id: 'direct-error-comparison',
  language: 'go',
  rule: {
    pattern: '$ERR == $TARGET',
    inside: { kind: 'if_statement', stopBy: 'end' },
  },
});
const matches = scanAstGrep(rule, srcDir);
const errComparisons = matches.filter((m) =>
  m.metaVariables.single.TARGET.text.startsWith('Err') ||
  m.metaVariables.single.ERR.text === 'err',
);
expect(errComparisons, 'use errors.Is instead of == for error checks').toHaveLength(0);
```

#### errors.Is / errors.As usage present

```typescript
const isUsage = runAstGrep("errors.Is($$$ARGS)", srcDir);
const asUsage = runAstGrep("errors.As($$$ARGS)", srcDir);
expect(
  isUsage.length + asUsage.length,
  'expected errors.Is or errors.As usage',
).toBeGreaterThanOrEqual(1);
```

### Interfaces

#### Compile-time interface check

```typescript
// Regex: /var\s+_\s+\w+\s*=\s*\(\*\w+\)\(nil\)/
const matches = runAstGrep("var _ $IFACE = (*$IMPL)(nil)", srcDir);
expect(matches.length, 'expected var _ I = (*T)(nil)').toBeGreaterThanOrEqual(1);
```

#### Interface method count (≤3 methods)

```typescript
// Regex: /type\s+\w+\s+interface\s*\{([^}]*)\}/g + line split
const rule = JSON.stringify({
  id: 'find-interfaces',
  language: 'go',
  rule: { kind: 'interface_type' },
});
const ifaces = scanAstGrep(rule, srcDir);
for (const iface of ifaces) {
  const methods = scanAstGrep(JSON.stringify({
    id: 'methods-in-interface',
    language: 'go',
    rule: {
      kind: 'method_spec',
      inside: { kind: 'interface_type', stopBy: 'end' },
    },
  }), srcDir).filter((m) =>
    m.range.start.line >= iface.range.start.line &&
    m.range.end.line <= iface.range.end.line,
  );
  expect(methods.length, `interface has ${methods.length} methods, expected ≤ 3`).toBeLessThanOrEqual(3);
}
```

#### Flag pointer-to-interface parameters

```typescript
// Detect: func Foo(r *io.Reader) — interface values already hold a pointer
const rule = JSON.stringify({
  id: 'pointer-to-interface',
  language: 'go',
  rule: {
    kind: 'pointer_type',
    has: { kind: 'qualified_type', stopBy: 'end' },
    inside: { kind: 'parameter_declaration', stopBy: 'end' },
  },
});
// Note: requires manual filtering — not all *pkg.Type are interfaces
// Use as a signal, combine with known interface names from the codebase
```

#### Two-value type assertion

```typescript
// Regex: /\w+,\s*ok\s*:=\s*\w+\.\([^)]+\)/
const matches = runAstGrep("$VAL, ok := $EXPR.($TYPE)", srcDir);
expect(matches.length).toBeGreaterThanOrEqual(1);
```

### Concurrency

#### Unexported mutex in struct (not embedded)

```typescript
// Regex: /mu\s+sync\.(Mutex|RWMutex)/ + not embedded check
const rule = JSON.stringify({
  id: 'unexported-mutex',
  language: 'go',
  rule: {
    kind: 'field_declaration',
    pattern: 'mu sync.$MUTEX_TYPE',
    inside: { kind: 'struct_type', stopBy: 'end' },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches.length, 'expected unexported mutex field in struct').toBeGreaterThanOrEqual(1);
```

#### Flag embedded mutex

```typescript
// Detect: sync.Mutex as embedded field (no field name)
const rule = JSON.stringify({
  id: 'embedded-mutex',
  language: 'go',
  rule: {
    kind: 'field_declaration',
    any: [
      { pattern: 'sync.Mutex' },
      { pattern: 'sync.RWMutex' },
    ],
    not: { has: { kind: 'field_identifier', stopBy: 'end' } },
    inside: { kind: 'struct_type', stopBy: 'end' },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches, 'mutex must be unexported field, not embedded').toHaveLength(0);
```

#### Flag fire-and-forget goroutines (go statement without WaitGroup/errgroup)

```typescript
// Detect: go func() { ... } or go someFunc() — flag for review
const goStmts = runAstGrep("go $EXPR", srcDir);
// Combine with WaitGroup presence check
const wgUsage = runAstGrep("$WG.Add($N)", srcDir);
const errgroupUsage = runAstGrep("$G.Go($$$ARGS)", srcDir);
expect(
  wgUsage.length + errgroupUsage.length,
  'goroutines need WaitGroup or errgroup for lifecycle management',
).toBeGreaterThanOrEqual(goStmts.length > 0 ? 1 : 0);
```

#### Flag wg.Add inside goroutine

```typescript
const rule = JSON.stringify({
  id: 'wg-add-in-goroutine',
  language: 'go',
  rule: {
    pattern: '$WG.Add($N)',
    inside: { kind: 'go_statement', stopBy: 'end' },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches, 'wg.Add must be before go statement, not inside').toHaveLength(0);
```

### Safety

#### No panic outside main

```typescript
// Regex: content.includes('func main()') heuristic
const rule = JSON.stringify({
  id: 'no-panic-outside-main',
  language: 'go',
  rule: {
    pattern: 'panic($$$)',
    not: {
      inside: {
        kind: 'function_declaration',
        has: { kind: 'identifier', regex: '^main$' },
        stopBy: 'end',
      },
    },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches, 'panic() found outside main').toHaveLength(0);
```

#### No os.Exit outside main

```typescript
const rule = JSON.stringify({
  id: 'no-exit-outside-main',
  language: 'go',
  rule: {
    pattern: 'os.Exit($CODE)',
    not: {
      inside: {
        kind: 'function_declaration',
        has: { kind: 'identifier', regex: '^main$' },
        stopBy: 'end',
      },
    },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches, 'os.Exit found outside main').toHaveLength(0);
```

#### No log.Fatal outside main

```typescript
const rule = JSON.stringify({
  id: 'no-fatal-outside-main',
  language: 'go',
  rule: {
    any: [
      { pattern: 'log.Fatal($$$ARGS)' },
      { pattern: 'log.Fatalf($$$ARGS)' },
    ],
    not: {
      inside: {
        kind: 'function_declaration',
        has: { kind: 'identifier', regex: '^main$' },
        stopBy: 'end',
      },
    },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches, 'log.Fatal found outside main').toHaveLength(0);
```

#### Defer used for resource cleanup

```typescript
// Regex: /defer\s+/
const matches = runAstGrep("defer $EXPR", srcDir);
expect(matches.length, 'expected defer for resource cleanup').toBeGreaterThanOrEqual(1);
```

#### Struct JSON tags

```typescript
// Regex: /`json:"[^"]+"`/
const rule = JSON.stringify({
  id: 'json-tags',
  language: 'go',
  rule: {
    kind: 'field_declaration',
    has: { kind: 'raw_string_literal', regex: 'json:', stopBy: 'end' },
    inside: { kind: 'struct_type', stopBy: 'end' },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches.length, 'expected struct fields with json tags').toBeGreaterThanOrEqual(1);
```

### Performance

#### Flag fmt.Sprint for primitive conversions

```typescript
const sprintCalls = runAstGrep("fmt.Sprint($ARG)", srcDir);
const sprintfNum = runAstGrep('fmt.Sprintf("%d", $ARG)', srcDir);
expect(
  [...sprintCalls, ...sprintfNum],
  'use strconv.Itoa/FormatFloat instead of fmt.Sprint for conversions',
).toHaveLength(0);
```

#### Flag + concatenation in loops

```typescript
// Detect string concatenation assignment inside for loops
const rule = JSON.stringify({
  id: 'concat-in-loop',
  language: 'go',
  rule: {
    pattern: '$S += $VAL',
    inside: { kind: 'for_statement', stopBy: 'end' },
  },
});
const matches = scanAstGrep(rule, srcDir);
// Filter for string concatenation (heuristic: += with string-typed var)
// Flag for review — suggest strings.Builder
```

#### strings.Builder used for multi-step concatenation

```typescript
const matches = runAstGrep("$B.WriteString($$$ARGS)", srcDir);
// Presence check when multiple string building is expected
```

### Functional Options

#### Unexported options struct

```typescript
// Verify options struct is unexported (lowercase)
const rule = JSON.stringify({
  id: 'options-struct',
  language: 'go',
  rule: {
    kind: 'type_declaration',
    has: { kind: 'type_spec', has: { kind: 'struct_type', stopBy: 'end' }, stopBy: 'end' },
    regex: 'options',
  },
});
const matches = scanAstGrep(rule, srcDir);
for (const m of matches) {
  expect(m.text).not.toMatch(/^type Options\b/);  // must be unexported
}
```

#### WithX option constructors present

```typescript
const matches = runAstGrep("func With$NAME($$$PARAMS) Option { $$$BODY }", srcDir);
expect(matches.length, 'expected WithX option constructors').toBeGreaterThanOrEqual(1);
```

#### Variadic Option parameter

```typescript
// Verify options passed as ...Option, not []Option
const matches = runAstGrep("func $NAME($$$PARAMS) $$$RETURNS { $$$BODY }", srcDir);
// Check that Option-accepting functions use variadic syntax
// Combine with text check for ...Option
```

### Logging

#### Flag fmt.Println / log.Printf in application code

```typescript
const fmtPrint = runAstGrep("fmt.Println($$$ARGS)", srcDir);
const logPrintf = runAstGrep("log.Printf($$$ARGS)", srcDir);
const logPrintln = runAstGrep("log.Println($$$ARGS)", srcDir);
expect(
  [...fmtPrint, ...logPrintf, ...logPrintln],
  'use log/slog instead of fmt.Println/log.Printf',
).toHaveLength(0);
```

#### Flag fmt.Sprintf in slog arguments

```typescript
const rule = JSON.stringify({
  id: 'sprintf-in-slog',
  language: 'go',
  rule: {
    pattern: 'fmt.Sprintf($$$ARGS)',
    inside: {
      any: [
        { pattern: 'slog.Info($$$)' },
        { pattern: 'slog.Error($$$)' },
        { pattern: 'slog.Debug($$$)' },
        { pattern: 'slog.Warn($$$)' },
        { pattern: '$LOGGER.Info($$$)' },
        { pattern: '$LOGGER.Error($$$)' },
        { pattern: '$LOGGER.Debug($$$)' },
        { pattern: '$LOGGER.Warn($$$)' },
      ],
      stopBy: 'end',
    },
  },
});
const matches = scanAstGrep(rule, srcDir);
expect(matches, 'use typed slog attributes instead of fmt.Sprintf').toHaveLength(0);
```

#### slog typed attributes used

```typescript
const typedAttrs = [
  ...runAstGrep("slog.String($$$ARGS)", srcDir),
  ...runAstGrep("slog.Int($$$ARGS)", srcDir),
  ...runAstGrep("slog.Any($$$ARGS)", srcDir),
];
// Presence check when slog is used
```

## Checklist

- [ ] Patterns organized by `go-review` category (errors, interfaces, concurrency, safety, performance, options, logging)
- [ ] `runAstGrep` and `scanAstGrep` helpers defined at top of EVAL.ts
- [ ] Anti-pattern checks (flag rules) assert `.toHaveLength(0)`
- [ ] Presence checks assert `.toBeGreaterThanOrEqual(1)`
- [ ] `metaVariables` filtering used when pattern is broader than the check requires
- [ ] `scanAstGrep` used for any check involving `inside`, `has`, or `not`
- [ ] `stopBy: end` included in all `has` and `inside` rules
- [ ] Regex-based checks preserved only for trivial text presence (e.g., `code.includes`)
