/**
 * Shared helpers for EVAL.ts files.
 *
 * Import in EVAL.ts:
 *   import { readGoFiles, goFilesIn } from '../lib/helpers.js';
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Read and concatenate all .go files in a directory.
 */
export function readGoFiles(srcDir: string): string {
  return readdirSync(srcDir)
    .filter((f) => f.endsWith('.go'))
    .map((f) => readFileSync(join(srcDir, f), 'utf-8'))
    .join('\n');
}

/**
 * Get the list of .go file paths in a directory.
 */
export function goFilesIn(srcDir: string): string[] {
  return readdirSync(srcDir)
    .filter((f) => f.endsWith('.go'))
    .map((f) => join(srcDir, f));
}

/**
 * Read a single Go file's content.
 */
export function readGoFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}
