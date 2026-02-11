/**
 * ast-grep helpers for EVAL.ts files.
 *
 * Import in EVAL.ts:
 *   import { runAstGrep, scanAstGrep } from '../lib/ast-grep.js';
 */

import { execSync } from 'child_process';

export interface AstGrepMatch {
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

/**
 * Run a simple ast-grep pattern match. Returns an array of matches.
 *
 * @example
 * const matches = runAstGrep("var _ $IFACE = (*$IMPL)(nil)", srcDir);
 */
export function runAstGrep(
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

/**
 * Run ast-grep scan with an inline YAML rule. Returns an array of matches.
 *
 * `sg scan` exits 1 when matches are found (like grep), so we handle that.
 *
 * @example
 * const rule = JSON.stringify({
 *   id: 'no-panic-outside-main',
 *   language: 'go',
 *   rule: {
 *     pattern: 'panic($$$)',
 *     not: { inside: { kind: 'function_declaration', has: { kind: 'identifier', regex: '^main$' }, stopBy: 'end' } },
 *   },
 * });
 * const matches = scanAstGrep(rule, srcDir);
 */
export function scanAstGrep(
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
    // sg scan exits 1 when matches are found
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
