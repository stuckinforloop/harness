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

test('WaitGroup.Add called before goroutine launch', () => {
  const code = readGoFiles();
  expect(code).toMatch(/\.Add\(/);
  expect(code).toMatch(/\bgo\s+func/);
});

test('defer wg.Done() in goroutines', () => {
  const code = readGoFiles();
  expect(code).toMatch(/defer\s+wg\.Done\(\)/);
});

test('select with ctx.Done() for cancellation', () => {
  const code = readGoFiles();
  expect(code).toMatch(/select\s*\{/);
  expect(code).toMatch(/<-ctx\.Done\(\)/);
});

test('channel buffers are 0 or 1', () => {
  const code = readGoFiles();
  const bufferedChans = [...code.matchAll(/make\(chan\s+[^,)]+,\s*(\d+)\)/g)];
  for (const [fullMatch, size] of bufferedChans) {
    expect(
      parseInt(size),
      `channel buffer size ${size} > 1: ${fullMatch}`,
    ).toBeLessThanOrEqual(1);
  }
});

test('program completes without hanging', () => {
  execSync('go run .', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});
