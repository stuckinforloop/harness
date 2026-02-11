/**
 * Agent SDK experiment: go-write skill injected via systemPrompt.
 *
 * Usage:
 *   npx tsx evals/lib/runner.ts --experiment with-go-write-sdk
 */

import type { SdkExperimentConfig } from '../evals/lib/runner.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillContent = readFileSync(
  join(__dirname, '..', 'skills', 'go-write', 'SKILL.md'),
  'utf-8',
);

const config: SdkExperimentConfig = {
  model: 'sonnet',
  runs: 3,
  timeout: 300,
  evalFilter: (name) => name.startsWith('go-write/'),
  systemPrompt: {
    type: 'preset',
    preset: 'claude_code',
    append: `You have the following Go coding conventions skill installed. Follow these patterns strictly.\n\n${skillContent}`,
  },
  allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
  settingSources: ['project'],
};

export default config;
