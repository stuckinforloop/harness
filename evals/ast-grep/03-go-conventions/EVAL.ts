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

// Layer 3: Verify the assertions file uses ast-grep patterns

test('assertions use ast-grep CLI (sg run or sg scan)', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  const usesSgRun = code.includes('sg run');
  const usesSgScan = code.includes('sg scan');
  expect(usesSgRun || usesSgScan, 'expected sg run or sg scan usage').toBe(true);
  expect(code).toContain('--json');
});

test('assertions check compile-time interface check pattern', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  // Must reference the var _ I = (*T)(nil) pattern
  expect(code).toContain('var _');
  expect(code).toContain('nil');
  expect(code).toContain('--pattern');
});

test('assertions check interface method count', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  // Must use structural matching for interface methods
  const checksInterface = code.includes('interface_type') || code.includes('method_spec');
  expect(checksInterface, 'expected interface_type or method_spec node kinds').toBe(true);
});

test('assertions check two-value type assertion', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  // Must reference the type assertion pattern with ok
  expect(code).toMatch(/ok/);
  // Should use ast-grep pattern, not regex
  const usesPattern = code.includes('--pattern') || code.includes('--inline-rules');
  expect(usesPattern, 'expected ast-grep pattern for type assertion check').toBe(true);
});

test('assertions use execSync to invoke sg', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('execSync');
});

test('assertions export runChecks function', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toMatch(/export\s+(function|const)\s+runChecks/);
});

test('assertions use JSON parsing for ast-grep output', () => {
  const code = readFileSync(assertionsPath, 'utf-8');
  expect(code).toContain('JSON.parse');
});
