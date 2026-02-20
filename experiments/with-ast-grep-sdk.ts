/**
 * Agent SDK experiment: ast-grep skill injected via systemPrompt.
 *
 * Usage:
 *   npx tsx evals/lib/runner.ts --experiment with-ast-grep-sdk
 */

import type { SdkExperimentConfig } from '../evals/lib/runner.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillContent = readFileSync(
  join(__dirname, '..', 'skills', 'ast-grep', 'SKILL.md'),
  'utf-8',
);

const config: SdkExperimentConfig = {
  model: 'sonnet',
  runs: 3,
  timeout: 300,
  evalFilter: (name) => name.startsWith('ast-grep/'),
  systemPrompt: {
    type: 'preset',
    preset: 'claude_code',
    append: `You have the following ast-grep skill installed. Use ast-grep patterns (not regex) for structural code assertions.\n\n${skillContent}`,
  },
  allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Skill'],
  settingSources: ['project'],
};

export default config;
