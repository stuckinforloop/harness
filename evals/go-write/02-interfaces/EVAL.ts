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

test('compile-time interface check exists', () => {
  const code = readGoFiles();
  expect(code).toMatch(/var\s+_\s+\w+\s*=\s*\(\*\w+\)\(nil\)/);
});

test('interfaces have 3 or fewer methods', () => {
  const code = readGoFiles();
  const interfaceRegex = /type\s+\w+\s+interface\s*\{([^}]*)\}/g;
  let match;
  let found = false;
  while ((match = interfaceRegex.exec(code)) !== null) {
    found = true;
    const body = match[1];
    const methods = body.split('\n').filter((line) => line.trim() && line.includes('('));
    expect(
      methods.length,
      `interface has ${methods.length} methods, expected ≤ 3`,
    ).toBeLessThanOrEqual(3);
  }
  expect(found, 'expected at least one interface declaration').toBe(true);
});

test('two-value type assertion for upcasting', () => {
  const code = readGoFiles();
  expect(code).toMatch(/\w+,\s*ok\s*:=\s*\w+\.\(\w+\)/);
});

test('unexported mutex field (not embedded)', () => {
  const code = readGoFiles();
  expect(code).toMatch(/mu\s+sync\.(Mutex|RWMutex)/);
  expect(code).not.toMatch(/^\s+sync\.(Mutex|RWMutex)\s*$/m);
});
