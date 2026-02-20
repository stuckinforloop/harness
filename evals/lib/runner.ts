/**
 * Standalone eval runner using the Claude Agent SDK.
 *
 * Usage:
 *   npx tsx evals/lib/runner.ts --experiment with-go-write-sdk
 *   npx tsx evals/lib/runner.ts --experiment with-ast-grep-sdk --eval ast-grep/01-pattern-matching
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { basename, dirname, join, resolve } from 'path';
import { parseArgs } from 'util';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SdkExperimentConfig {
  /** Model to use. @default 'sonnet' */
  model?: string;
  /** How many times to run each eval. @default 1 */
  runs?: number;
  /** Timeout in seconds. @default 300 */
  timeout?: number;
  /** Filter evals by prefix. @default all */
  evalFilter?: (name: string) => boolean;
  /** System prompt configuration */
  systemPrompt?:
    | string
    | { type: 'preset'; preset: 'claude_code'; append?: string };
  /** Extra allowed tools beyond defaults */
  allowedTools?: string[];
  /** Setting sources to load. @default ['project'] */
  settingSources?: Array<'user' | 'project' | 'local'>;
  /** Working directory for the project (to find .claude/skills/) */
  projectDir?: string;
  /** Setup function to run before the agent. Receives the temp src dir. */
  setup?: (srcDir: string) => Promise<void> | void;
}

interface EvalFixture {
  name: string;
  path: string;
  prompt: string;
}

interface RunResult {
  eval: string;
  run: number;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

const EVALS_DIR = resolve(dirname(new URL(import.meta.url).pathname), '..');

function discoverFixtures(filter?: (name: string) => boolean): EvalFixture[] {
  const fixtures: EvalFixture[] = [];

  function walk(dir: string, prefix: string) {
    const promptPath = join(dir, 'PROMPT.md');
    const evalPath = join(dir, 'EVAL.ts');
    if (existsSync(promptPath) && existsSync(evalPath)) {
      const name = prefix;
      if (!filter || filter(name)) {
        fixtures.push({
          name,
          path: dir,
          prompt: readFileSync(promptPath, 'utf-8'),
        });
      }
      return;
    }
    // Recurse into subdirectories
    const { readdirSync } = await_import_fs();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'lib') {
        walk(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      }
    }
  }

  walk(EVALS_DIR, '');
  return fixtures.sort((a, b) => a.name.localeCompare(b.name));
}

function await_import_fs() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('fs') as typeof import('fs');
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function runSingleEval(
  fixture: EvalFixture,
  config: SdkExperimentConfig,
): Promise<RunResult> {
  const start = Date.now();

  // Create temporary working directory
  const tmpDir = mkdtempSync(join(tmpdir(), 'harness-eval-'));
  const srcDir = join(tmpDir, 'src');
  mkdirSync(srcDir, { recursive: true });

  // Copy fixture files (except EVAL.ts, PROMPT.md) to src/
  const fixtureSrcDir = join(fixture.path, 'src');
  if (existsSync(fixtureSrcDir)) {
    cpSync(fixtureSrcDir, srcDir, { recursive: true });
  }

  // Run setup if provided
  if (config.setup) {
    await config.setup(srcDir);
  }

  try {
    // Run the agent
    let result = '';
    const timeoutMs = (config.timeout ?? 300) * 1000;

    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      for await (const message of query({
        prompt: fixture.prompt,
        options: {
          model: config.model ?? 'sonnet',
          cwd: srcDir,
          systemPrompt: config.systemPrompt ?? {
            type: 'preset',
            preset: 'claude_code',
          },
          settingSources: config.settingSources ?? ['project'],
          allowedTools: config.allowedTools ?? [
            'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Skill',
          ],
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          abortController,
          maxTurns: 50,
        },
      })) {
        if ('result' in message && message.type === 'result') {
          result = 'result' in message ? (message as any).result ?? '' : '';
        }
      }
    } finally {
      clearTimeout(timer);
    }

    // Copy EVAL.ts to tmp dir and run vitest
    const evalSrc = join(fixture.path, 'EVAL.ts');
    const evalDst = join(tmpDir, 'EVAL.ts');
    cpSync(evalSrc, evalDst);

    // Copy package.json if exists
    const pkgSrc = join(fixture.path, 'package.json');
    if (existsSync(pkgSrc)) {
      cpSync(pkgSrc, join(tmpDir, 'package.json'));
    }

    // Run the eval
    try {
      execSync(
        `npx vitest run --reporter=verbose "${evalDst}"`,
        {
          cwd: tmpDir,
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 60_000,
          env: { ...process.env, NODE_OPTIONS: '--experimental-vm-modules' },
        },
      );
      return {
        eval: fixture.name,
        run: 0,
        status: 'passed',
        duration: (Date.now() - start) / 1000,
      };
    } catch (e: any) {
      return {
        eval: fixture.name,
        run: 0,
        status: 'failed',
        duration: (Date.now() - start) / 1000,
        error: e.stdout?.toString() ?? e.message,
      };
    }
  } finally {
    // Cleanup
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Experiment configs
// ---------------------------------------------------------------------------

async function loadExperiment(name: string): Promise<SdkExperimentConfig> {
  const configPath = resolve(EVALS_DIR, '..', 'experiments', `${name}.ts`);
  if (!existsSync(configPath)) {
    throw new Error(`Experiment config not found: ${configPath}`);
  }
  const mod = await import(configPath);
  return mod.default as SdkExperimentConfig;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      experiment: { type: 'string', short: 'e' },
      eval: { type: 'string' },
      runs: { type: 'string', short: 'n', default: '1' },
    },
  });

  if (!values.experiment) {
    console.error('Usage: npx tsx evals/lib/runner.ts --experiment <name> [--eval <filter>] [--runs <n>]');
    process.exit(1);
  }

  const config = await loadExperiment(values.experiment);
  const runs = parseInt(values.runs ?? '1', 10) || config.runs || 1;

  const filter = values.eval
    ? (name: string) => name.includes(values.eval!)
    : config.evalFilter;

  const fixtures = discoverFixtures(filter);

  if (fixtures.length === 0) {
    console.error('No eval fixtures found.');
    process.exit(1);
  }

  console.log(`\nRunning ${fixtures.length} eval(s) × ${runs} run(s) with experiment "${values.experiment}"\n`);

  const allResults: RunResult[] = [];

  for (const fixture of fixtures) {
    console.log(`--- ${fixture.name} ---`);
    for (let i = 0; i < runs; i++) {
      const result = await runSingleEval(fixture, config);
      result.run = i + 1;
      allResults.push(result);

      const icon = result.status === 'passed' ? 'PASS' : 'FAIL';
      console.log(`  Run ${i + 1}: ${icon} (${result.duration.toFixed(1)}s)`);
      if (result.error) {
        console.log(`    Error: ${result.error.split('\n')[0]}`);
      }
    }
  }

  // Summary
  console.log('\n=== Summary ===\n');
  const byEval = new Map<string, RunResult[]>();
  for (const r of allResults) {
    const arr = byEval.get(r.eval) ?? [];
    arr.push(r);
    byEval.set(r.eval, arr);
  }

  for (const [name, results] of byEval) {
    const passed = results.filter((r) => r.status === 'passed').length;
    const total = results.length;
    const rate = ((passed / total) * 100).toFixed(0);
    console.log(`${name}: ${passed}/${total} (${rate}%)`);
  }

  const totalPassed = allResults.filter((r) => r.status === 'passed').length;
  const total = allResults.length;
  console.log(`\nOverall: ${totalPassed}/${total} (${((totalPassed / total) * 100).toFixed(0)}%)`);

  process.exit(totalPassed === total ? 0 : 1);
}

// Run if invoked directly
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
