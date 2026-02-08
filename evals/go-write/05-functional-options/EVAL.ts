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

test('Option interface with unexported apply method', () => {
  const code = readGoFiles();
  expect(code).toMatch(/type\s+Option\s+interface\s*\{/);
  expect(code).toMatch(/apply\(\*options\)/);
});

test('unexported options struct', () => {
  const code = readGoFiles();
  expect(code).toMatch(/type\s+options\s+struct\s*\{/);
});

test('WithX constructor functions returning Option', () => {
  const code = readGoFiles();
  const withFuncs = code.match(/func\s+With\w+\([^)]*\)\s+Option/g);
  expect(withFuncs, 'expected at least 2 WithX constructors returning Option').not.toBeNull();
  expect(withFuncs!.length).toBeGreaterThanOrEqual(2);
});

test('defaults set in constructor', () => {
  const code = readGoFiles();
  expect(code).toMatch(/options\s*\{/);
});

test('options applied via range loop', () => {
  const code = readGoFiles();
  expect(code).toMatch(/range\s+opt/);
});

test('context.Context as first parameter in methods', () => {
  const code = readGoFiles();
  expect(code).toMatch(/\(ctx\s+context\.Context/);
});
