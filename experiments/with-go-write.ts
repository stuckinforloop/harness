import type { ExperimentConfig } from '@vercel/agent-eval';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillContent = readFileSync(
  join(__dirname, '..', 'skills', 'go-write', 'SKILL.md'),
  'utf-8',
);

const config: ExperimentConfig = {
  agent: 'claude-code',
  model: 'sonnet',
  runs: 3,
  earlyExit: false,
  timeout: 300,
  sandbox: 'docker',
  evals: (name) => name.startsWith('go-write/'),
  setup: async (sandbox) => {
    await sandbox.runCommand('bash', ['-c', [
      'apt-get update -qq',
      'apt-get install -y -qq wget ca-certificates > /dev/null 2>&1',
      'wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz',
      'tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz',
      'rm go1.24.0.linux-amd64.tar.gz',
      'ln -sf /usr/local/go/bin/go /usr/bin/go',
      'ln -sf /usr/local/go/bin/gofmt /usr/bin/gofmt',
    ].join(' && ')]);
  },
  editPrompt: (prompt) =>
    `You have the following Go coding conventions skill installed. Follow these patterns strictly.\n\n${skillContent}\n\n---\n\n${prompt}`,
};

export default config;
