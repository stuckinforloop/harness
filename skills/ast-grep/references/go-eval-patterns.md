# Go Eval Patterns

Ready-to-use ast-grep patterns for Go convention checks in EVAL.ts files. Each pattern shows the regex it replaces and the ast-grep equivalent.

## Patterns

### Compile-time interface check

**Regex (current)**:
```typescript
expect(code).toMatch(/var\s+_\s+\w+\s*=\s*\(\*\w+\)\(nil\)/);
```

**ast-grep**:
```typescript
const matches = runAstGrep("var _ $IFACE = (*$IMPL)(nil)", srcDir);
expect(matches.length, 'expected var _ I = (*T)(nil)').toBeGreaterThanOrEqual(1);
```

### Sentinel errors

**Regex (current)**:
```typescript
const matches = code.match(/var\s+Err\w+\s*=\s*errors\.New\(/g);
```

**ast-grep**:
```typescript
const matches = runAstGrep("var $ERR = errors.New($MSG)", srcDir);
const sentinels = matches.filter((m) =>
  m.metaVariables.single.ERR.text.startsWith('Err'),
);
expect(sentinels.length).toBeGreaterThanOrEqual(2);
```

### Error wrapping with %w

**Regex (current)**:
```typescript
const matches = code.match(/fmt\.Errorf\([^)]*%w/g);
```

**ast-grep**:
```typescript
const matches = runAstGrep("fmt.Errorf($$$ARGS)", srcDir);
const wrapping = matches.filter((m) => m.text.includes('%w'));
expect(wrapping.length).toBeGreaterThanOrEqual(2);
```

### Two-value type assertion

**Regex (current)**:
```typescript
expect(code).toMatch(/\w+,\s*ok\s*:=\s*\w+\.\([^)]+\)/);
```

**ast-grep**:
```typescript
const matches = runAstGrep("$VAL, ok := $EXPR.($TYPE)", srcDir);
expect(matches.length).toBeGreaterThanOrEqual(1);
```

### No panic outside main

**Regex (current)**:
```typescript
const isMainFile = content.includes('func main()');
if (!isMainFile) {
  expect(content).not.toMatch(/\bpanic\(/);
}
```

**ast-grep**:
```typescript
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

### Interface method count

**Regex (current)**:
```typescript
const interfaceRegex = /type\s+\w+\s+interface\s*\{([^}]*)\}/g;
const methods = body.split('\n').filter((line) => line.trim() && line.includes('('));
```

**ast-grep**:
```typescript
const rule = JSON.stringify({
  id: 'find-interfaces',
  language: 'go',
  rule: { kind: 'interface_type' },
});
const matches = scanAstGrep(rule, srcDir);
for (const m of matches) {
  // Count method_spec children in the interface body
  const methodRule = JSON.stringify({
    id: 'interface-methods',
    language: 'go',
    rule: {
      kind: 'method_spec',
      inside: { kind: 'interface_type', stopBy: 'end' },
    },
  });
  // Alternative: parse the match text and count method_spec nodes
  const methodCount = runAstGrep("$NAME($$$PARAMS) $$$RETURNS", srcDir)
    .filter((method) =>
      method.range.start.line >= m.range.start.line &&
      method.range.end.line <= m.range.end.line,
    ).length;
  expect(methodCount).toBeLessThanOrEqual(3);
}
```

### Unexported mutex in struct

**Regex (current)**:
```typescript
expect(code).toMatch(/mu\s+sync\.(Mutex|RWMutex)/);
expect(code).not.toMatch(/^\s+sync\.(Mutex|RWMutex)\s*$/m);
```

**ast-grep**:
```typescript
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

### Defer usage

**Regex (current)**:
```typescript
expect(code).toMatch(/defer\s+/);
```

**ast-grep**:
```typescript
const matches = runAstGrep("defer $EXPR", srcDir);
expect(matches.length, 'expected defer for resource cleanup').toBeGreaterThanOrEqual(1);
```

### Struct JSON tags

**Regex (current)**:
```typescript
expect(code).toMatch(/`json:"[^"]+"`/);
```

**ast-grep**:
```typescript
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

## Checklist

- [ ] `runAstGrep` and `scanAstGrep` helpers defined at top of EVAL.ts
- [ ] Pattern matches verified against sample Go code before committing
- [ ] `metaVariables` filtering used when pattern is broader than the check requires
- [ ] `scanAstGrep` used for any check involving `inside`, `has`, or `not`
- [ ] `stopBy: end` included in all `has` and `inside` rules
- [ ] Regex-based checks preserved only for trivial text presence (e.g., `code.includes`)
