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

// Layer 3: Verify the assertions file uses ast-grep (not regex)

test('assertions use sg run --pattern (not regex)', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('sg run');
  expect(code).toContain('--pattern');
  expect(code).toContain('--json');
});

test('assertions use --lang go', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('--lang go');
});

test('assertions check sentinel errors with ast-grep pattern', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  // Must use ast-grep pattern for errors.New, not regex
  expect(code).toContain('errors.New');
  expect(code).toContain('--pattern');
  // Should not use regex for structural matching
  const regexForSentinels = /new RegExp\(.*Err\w.*errors\.New/;
  expect(code).not.toMatch(regexForSentinels);
});

test('assertions check error wrapping with fmt.Errorf', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('fmt.Errorf');
  expect(code).toContain('%w');
});

test('assertions check errors.Is or errors.As', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  const hasIs = code.includes('errors.Is');
  const hasAs = code.includes('errors.As');
  expect(hasIs || hasAs, 'assertions should check for errors.Is or errors.As').toBe(true);
});

test('assertions use execSync to invoke sg', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('execSync');
});

test('assertions export runChecks function', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toMatch(/export\s+(function|const)\s+runChecks/);
});
