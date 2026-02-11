import { test, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const srcDir = join(__dirname, 'src');
const assertionsPath = join(srcDir, 'assertions.ts');

// Layer 1: Deterministic — Go code must compile

test('go build passes', () => {
  execSync('go build ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

test('go vet passes', () => {
  execSync('go vet ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

// Layer 2: Verify the agent wrote an assertions file

test('assertions.ts file exists', () => {
  expect(existsSync(assertionsPath), 'expected src/assertions.ts to be created').toBe(true);
});

// Layer 3: Verify the assertions file uses ast-grep relational rules

test('assertions use sg scan --inline-rules (not sg run)', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('sg scan');
  expect(code).toContain('--inline-rules');
  expect(code).toContain('--json');
});

test('assertions define rules with id and language fields', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toMatch(/['"]id['"]\s*:/);
  expect(code).toMatch(/['"]language['"]\s*:/);
});

test('assertions use relational rule operators', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  // Must use at least inside and not for context-aware checks
  expect(code, 'expected "inside" relational operator').toContain('inside');
  expect(code, 'expected "not" relational operator').toContain('not');
});

test('assertions include stopBy: end', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('stopBy');
  expect(code).toContain('end');
});

test('assertions check no-panic-outside-main', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('panic');
  expect(code).toContain('function_declaration');
  expect(code).toMatch(/main/);
});

test('assertions check no-os-exit-outside-main', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('os.Exit');
});

test('assertions check unexported mutex in struct', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('sync.');
  expect(code).toMatch(/struct_type|field_declaration/);
});

test('assertions use execSync to invoke sg', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('execSync');
});

test('assertions export runChecks function', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toMatch(/export\s+(function|const)\s+runChecks/);
});
