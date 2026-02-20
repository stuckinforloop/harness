import { test, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const srcDir = join(__dirname, 'src');

// ── Inlined ast-grep helpers ──────────────────────────────────────────

interface AstGrepMatch {
  text: string;
  range: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  file: string;
  metaVariables: {
    single: Record<string, { text: string; start: { line: number; column: number }; end: { line: number; column: number } }>;
    multi: Record<string, Array<{ text: string; start: { line: number; column: number }; end: { line: number; column: number } }>>;
  };
}

function runAstGrep(
  pattern: string,
  cwd: string,
  lang = 'go',
): AstGrepMatch[] {
  try {
    const out = execSync(
      `sg run --pattern '${pattern}' --lang ${lang} --json`,
      { cwd, stdio: 'pipe', encoding: 'utf-8', timeout: 15_000 },
    );
    return JSON.parse(out);
  } catch {
    return [];
  }
}

function scanAstGrep(
  rule: string,
  cwd: string,
): AstGrepMatch[] {
  try {
    const out = execSync(
      `sg scan --inline-rules '${rule}' --json`,
      { cwd, stdio: 'pipe', encoding: 'utf-8', timeout: 15_000 },
    );
    return JSON.parse(out);
  } catch (e: any) {
    if (e.stdout) {
      try {
        return JSON.parse(e.stdout.toString());
      } catch {
        return [];
      }
    }
    return [];
  }
}

// ── Layer 1: Deterministic — must compile and pass static analysis ────

test('go build passes', () => {
  execSync('go build ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

test('go vet passes', () => {
  execSync('go vet ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

// ── Layer 2: ast-grep pattern checks ──────────────────────────────────

test('no fmt.Println / log.Printf / log.Println calls', () => {
  const fmtPrint = runAstGrep("fmt.Println($$$ARGS)", srcDir);
  const logPrintf = runAstGrep("log.Printf($$$ARGS)", srcDir);
  const logPrintln = runAstGrep("log.Println($$$ARGS)", srcDir);
  expect(
    [...fmtPrint, ...logPrintf, ...logPrintln],
    'use log/slog instead of fmt.Println/log.Printf',
  ).toHaveLength(0);
});

test('slog typed attributes used', () => {
  const typedAttrs = [
    ...runAstGrep("slog.String($$$ARGS)", srcDir),
    ...runAstGrep("slog.Int($$$ARGS)", srcDir),
    ...runAstGrep("slog.Any($$$ARGS)", srcDir),
  ];
  expect(
    typedAttrs.length,
    'expected slog.String, slog.Int, or slog.Any typed attributes',
  ).toBeGreaterThanOrEqual(1);
});

test('no fmt.Sprintf inside slog calls', () => {
  const rule = JSON.stringify({
    id: 'sprintf-in-slog',
    language: 'go',
    rule: {
      pattern: 'fmt.Sprintf($$$ARGS)',
      inside: {
        any: [
          { pattern: 'slog.Info($$$)' },
          { pattern: 'slog.Error($$$)' },
          { pattern: 'slog.Debug($$$)' },
          { pattern: 'slog.Warn($$$)' },
          { pattern: '$LOGGER.Info($$$)' },
          { pattern: '$LOGGER.Error($$$)' },
          { pattern: '$LOGGER.Debug($$$)' },
          { pattern: '$LOGGER.Warn($$$)' },
        ],
        stopBy: 'end',
      },
    },
  });
  const matches = scanAstGrep(rule, srcDir);
  expect(matches, 'use typed slog attributes instead of fmt.Sprintf').toHaveLength(0);
});

test('*slog.Logger accepted as struct field or constructor param', () => {
  const fieldMatches = runAstGrep("logger *slog.Logger", srcDir);
  const paramMatches = runAstGrep("func $NAME($$$BEFORE, logger *slog.Logger, $$$AFTER) $$$RETURNS { $$$BODY }", srcDir);
  const paramMatchesOnly = runAstGrep("func $NAME(logger *slog.Logger) $$$RETURNS { $$$BODY }", srcDir);
  expect(
    fieldMatches.length + paramMatches.length + paramMatchesOnly.length,
    'expected *slog.Logger as struct field or constructor parameter',
  ).toBeGreaterThanOrEqual(1);
});

test('slog.New not called inside handler functions', () => {
  const rule = JSON.stringify({
    id: 'slog-new-in-handler',
    language: 'go',
    rule: {
      pattern: 'slog.New($$$ARGS)',
      inside: {
        kind: 'function_declaration',
        not: {
          has: { kind: 'identifier', regex: '^main$' },
        },
        stopBy: 'end',
      },
    },
  });
  const matches = scanAstGrep(rule, srcDir);
  expect(
    matches,
    'derive child loggers with logger.With(), not slog.New() per request',
  ).toHaveLength(0);
});
