import { test, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const srcDir = join(__dirname, 'src');

function readGoFiles(): string {
  return readdirSync(srcDir)
    .filter((f) => f.endsWith('.go'))
    .map((f) => readFileSync(join(srcDir, f), 'utf-8'))
    .join('\n');
}

// Layer 1: Deterministic

test('go build passes', () => {
  execSync('go build ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

test('go vet passes', () => {
  execSync('go vet ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

// Layer 2: Pattern checks

test('two-value type assertions used', () => {
  const code = readGoFiles();
  const twoValue = code.match(/\w+,\s*ok\s*:=\s*\w+\.\([^)]+\)/g);
  expect(twoValue, 'expected two-value type assertions (v, ok := x.(T))').not.toBeNull();
  expect(twoValue!.length).toBeGreaterThanOrEqual(1);
});

test('defensive copies at boundaries', () => {
  const code = readGoFiles();
  const hasCopy = /\bcopy\(/.test(code);
  const hasMakeSlice = /make\(\[\]\w+/.test(code);
  const hasMakeMap = /make\(map\[/.test(code);
  expect(
    hasCopy || hasMakeSlice || hasMakeMap,
    'expected defensive copy with copy() or make()',
  ).toBe(true);
});

test('no panic outside main function', () => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.go'));
  for (const f of files) {
    const content = readFileSync(join(srcDir, f), 'utf-8');
    const isMainFile = content.includes('func main()');
    if (!isMainFile) {
      expect(content).not.toMatch(/\bpanic\(/);
    }
  }
});

test('no os.Exit outside main function', () => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.go'));
  for (const f of files) {
    const content = readFileSync(join(srcDir, f), 'utf-8');
    const isMainFile = content.includes('func main()');
    if (!isMainFile) {
      expect(content).not.toMatch(/\bos\.Exit\(/);
    }
  }
});

test('compile-time interface check', () => {
  const code = readGoFiles();
  expect(code).toMatch(/var\s+_\s+\w+\s*=\s*\(\*\w+\)\(nil\)/);
});

test('struct tags for JSON marshaling', () => {
  const code = readGoFiles();
  expect(code).toMatch(/`json:"[^"]+"`/);
});

test('defer used for resource cleanup', () => {
  const code = readGoFiles();
  expect(code).toMatch(/defer\s+/);
});
