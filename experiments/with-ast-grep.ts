/**
 * @vercel/agent-eval experiment: ast-grep skill injected via editPrompt.
 *
 * Usage:
 *   npm run eval:with-ast-grep
 */

import type { ExperimentConfig } from '@vercel/agent-eval';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillContent = readFileSync(
  join(__dirname, '..', 'skills', 'ast-grep', 'SKILL.md'),
  'utf-8',
);

const config: ExperimentConfig = {
  agent: 'claude-code',
  model: 'sonnet',
  runs: 3,
  earlyExit: false,
  timeout: 300,
  sandbox: 'docker',
  evals: (name) => name.startsWith('ast-grep/'),
  setup: async (sandbox) => {
    await sandbox.runCommand('bash', ['-c', [
      'apt-get update -qq',
      'apt-get install -y -qq wget ca-certificates > /dev/null 2>&1',
      // Install Go
      'wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz',
      'tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz',
      'rm go1.24.0.linux-amd64.tar.gz',
      'ln -sf /usr/local/go/bin/go /usr/bin/go',
      'ln -sf /usr/local/go/bin/gofmt /usr/bin/gofmt',
      // Install ast-grep
      'wget -q https://github.com/ast-grep/ast-grep/releases/latest/download/sg-x86_64-unknown-linux-gnu.zip -O /tmp/sg.zip',
      'apt-get install -y -qq unzip > /dev/null 2>&1',
      'unzip -q /tmp/sg.zip -d /usr/local/bin/',
      'chmod +x /usr/local/bin/sg',
      'rm /tmp/sg.zip',
    ].join(' && ')]);
  },
  editPrompt: (prompt) =>
    `You have the following ast-grep skill installed. Use ast-grep patterns (not regex) for structural code assertions.\n\n${skillContent}\n\n---\n\n${prompt}`,
};

export default config;
