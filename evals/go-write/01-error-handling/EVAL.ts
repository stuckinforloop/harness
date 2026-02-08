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

// Layer 1: Deterministic — must compile and pass static analysis

test('go build passes', () => {
  execSync('go build ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

test('go vet passes', () => {
  execSync('go vet ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

// Layer 2: Pattern checks

test('sentinel errors defined with errors.New', () => {
  const code = readGoFiles();
  const matches = code.match(/var\s+Err\w+\s*=\s*errors\.New\(/g);
  expect(matches, 'expected at least 2 sentinel errors defined with errors.New').not.toBeNull();
  expect(matches!.length).toBeGreaterThanOrEqual(2);
});

test('errors wrapped with %w verb', () => {
  const code = readGoFiles();
  const matches = code.match(/fmt\.Errorf\([^)]*%w/g);
  expect(matches, 'expected fmt.Errorf with %w wrapping').not.toBeNull();
  expect(matches!.length).toBeGreaterThanOrEqual(2);
});

test('no log-and-return anti-pattern', () => {
  const code = readGoFiles();
  const logCalls = code.match(/\blog\.(Print|Printf|Println|Fatal|Fatalf)\b/g);
  expect(logCalls, 'service code should not log errors — return them instead').toBeNull();
});

test('error messages are lowercase', () => {
  const code = readGoFiles();
  const sentinels = [...code.matchAll(/errors\.New\("([^"]+)"\)/g)];
  expect(sentinels.length).toBeGreaterThan(0);
  for (const [, msg] of sentinels) {
    expect(msg[0], `error message "${msg}" should start lowercase`).toMatch(/[a-z]/);
  }
});

test('uses errors.Is or errors.As for error checking', () => {
  const code = readGoFiles();
  const hasIs = /errors\.Is\(/.test(code);
  const hasAs = /errors\.As\(/.test(code);
  expect(hasIs || hasAs, 'expected errors.Is or errors.As usage').toBe(true);
});
