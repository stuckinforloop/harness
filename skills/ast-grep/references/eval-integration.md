# Eval Integration

## Rules

- **Use `execSync` with `sg run`** for simple pattern matches. Pass `--pattern`, `--lang go`, and `--json`. Set `cwd: srcDir` and `stdio: 'pipe'` to match existing eval conventions.
- **Use `execSync` with `sg scan --inline-rules`** for relational/composite rules that need `has`, `inside`, `not`, or `all`/`any`.
- **Parse JSON output.** `sg run --json` returns an array of match objects. Each has `text`, `range`, `file`, and `metaVariables`. Count matches with `.length`.
- **Handle no-match as empty array.** `sg run --json` exits 0 with `[]` when no matches found. `sg scan --json` exits 1 when no matches — wrap in try/catch.
- **Assert with vitest `expect`.** Use `.length` for counts, filter `metaVariables` for value checks.
- **Set `encoding: 'utf-8'`** on `execSync` to get string output directly.

## Patterns

### Raw regex for structural checks — Bad

```typescript
test('no panic outside main', () => {
  const content = readFileSync(join(srcDir, f), 'utf-8');
  const isMainFile = content.includes('func main()');
  if (!isMainFile) {
    expect(content).not.toMatch(/\bpanic\(/);
  }
});
```

### ast-grep with parsed results — Good

```typescript
function runAstGrep(pattern: string, cwd: string): any[] {
  const out = execSync(
    `sg run --pattern '${pattern}' --lang go --json`,
    { cwd, stdio: 'pipe', encoding: 'utf-8', timeout: 15_000 },
  );
  return JSON.parse(out);
}

function scanAstGrep(rule: string, cwd: string): any[] {
  try {
    const out = execSync(
      `sg scan --inline-rules '${rule}' --json`,
      { cwd, stdio: 'pipe', encoding: 'utf-8', timeout: 15_000 },
    );
    return JSON.parse(out);
  } catch (e: any) {
    if (e.stdout) {
      const parsed = JSON.parse(e.stdout.toString());
      return parsed;
    }
    return [];
  }
}
```

### Using helpers in tests — Good

```typescript
test('compile-time interface check', () => {
  const matches = runAstGrep("var _ $IFACE = (*$IMPL)(nil)", srcDir);
  expect(matches.length, 'expected var _ I = (*T)(nil)').toBeGreaterThanOrEqual(1);
});

test('no panic outside main', () => {
  const rule = JSON.stringify({
    id: 'no-panic-outside-main',
    language: 'go',
    rule: {
      pattern: 'panic($$$)',
      not: { inside: { kind: 'function_declaration', has: { kind: 'identifier', regex: '^main$' }, stopBy: 'end' } },
    },
  });
  const matches = scanAstGrep(rule, srcDir);
  expect(matches, 'panic() found outside main function').toHaveLength(0);
});
```

## Checklist

- [ ] `cwd` set to `srcDir` in all `execSync` calls
- [ ] `stdio: 'pipe'` and `encoding: 'utf-8'` set
- [ ] JSON output parsed before assertions
- [ ] `sg scan` wrapped in try/catch (exits 1 on matches)
- [ ] Timeout set on `execSync` to prevent hangs
- [ ] Helper functions placed at top of EVAL.ts, outside test blocks
