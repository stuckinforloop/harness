# Research: Claude Code Headless Mode vs Claude Agent SDK

> Date: 2026-02-09
> Author: Researcher Agent
> Status: Complete

## Executive Summary

There are **two main approaches** for programmatically invoking Claude Code to run evals:

1. **Claude Code CLI headless mode** (`claude -p`) — The original way to run Claude Code non-interactively from scripts. Still works, but Anthropic now points users to the Agent SDK for programmatic use.
2. **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) — A full TypeScript/Python SDK that gives you the same tools, agent loop, and context management as Claude Code, but as a library with structured APIs.

**Recommendation:** The **Claude Agent SDK** is the best path forward for our eval framework. It provides native TypeScript integration, structured outputs, programmatic system prompt control, and sandbox configuration — all things we need for running evals. It can either **replace** `@vercel/agent-eval` entirely or **complement** it as the agent backend.

---

## 1. Claude Code CLI Headless Mode (`claude -p`)

### Overview

The CLI headless mode is invoked by passing `-p` (or `--print`) to the `claude` command. It runs non-interactively and returns results to stdout.

> **Note from Anthropic:** "The CLI was previously called 'headless mode.' The `-p` flag and all CLI options work the same way."

### Basic Usage

```bash
# Simple prompt
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"

# JSON output with session metadata
claude -p "Summarize this project" --output-format json

# Structured output with JSON Schema
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}}}'

# Streaming JSON (newline-delimited)
claude -p "Explain recursion" --output-format stream-json --verbose

# Custom system prompt (append)
gh pr diff "$1" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json

# Full system prompt replacement
claude -p "Write Go code" --system-prompt "You are a Go expert. Follow these conventions..."

# Continue/resume conversations
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')
claude -p "Continue that review" --resume "$session_id"
```

### Key CLI Flags

| Flag | Description |
|------|-------------|
| `-p` / `--print` | Run non-interactively |
| `--output-format` | `text` (default), `json`, `stream-json` |
| `--json-schema` | JSON Schema for structured output |
| `--allowedTools` | Auto-approve specific tools |
| `--append-system-prompt` | Add to default system prompt |
| `--system-prompt` | Replace default system prompt entirely |
| `--continue` | Continue most recent conversation |
| `--resume <id>` | Resume specific session by ID |

### Invoking from Node.js/TypeScript

```typescript
import { execSync, spawn } from 'child_process';

// Simple synchronous invocation
const result = execSync(
  `claude -p "Write a Go UserService" --output-format json --allowedTools "Read,Write,Edit,Bash"`,
  { cwd: '/path/to/sandbox', encoding: 'utf-8', timeout: 300_000 }
);
const parsed = JSON.parse(result);
console.log(parsed.result);       // Text result
console.log(parsed.session_id);   // Session ID for resume

// With system prompt injection (skill content)
const skillContent = readFileSync('skills/go-write/SKILL.md', 'utf-8');
const result2 = execSync(
  `claude -p "Write Go code" --append-system-prompt ${JSON.stringify(skillContent)} --output-format json`,
  { cwd: '/path/to/sandbox', encoding: 'utf-8' }
);
```

### Pros

- Simple CLI interface, easy to wrap in shell scripts
- No additional dependencies beyond `claude` CLI
- All Claude Code tools available (Read, Write, Edit, Bash, Glob, Grep)
- JSON output with session metadata
- Structured output via `--json-schema`
- System prompt customization via `--append-system-prompt` or `--system-prompt`

### Cons

- **Process-based** — spawns a new process per invocation, harder to manage lifecycle
- **No native TypeScript API** — must shell out via `execSync`/`spawn`
- **Limited error handling** — errors come back as exit codes and stderr
- **No programmatic hooks** — can't intercept tool calls or add custom logic
- **No sandbox configuration API** — must handle containerization externally
- **No streaming callbacks** — must parse NDJSON manually for streaming
- **String-based prompt injection** — system prompts passed as CLI args (escaping issues)

---

## 2. Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)

### Overview

The Agent SDK is a full TypeScript (and Python) library that provides the same capabilities as Claude Code but as a programmable API. It was renamed from "Claude Code SDK" and is now the officially recommended approach for programmatic use.

### Installation

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### Basic Usage (TypeScript)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits"
  }
})) {
  if ("result" in message) {
    console.log(message.result);
  }
}
```

### Core API: `query()` Function

```typescript
function query({
  prompt: string | AsyncIterable<SDKUserMessage>,
  options?: Options
}): Query  // AsyncGenerator<SDKMessage, void>
```

### Key Options

| Option | Type | Description |
|--------|------|-------------|
| `prompt` | `string` | The task prompt |
| `allowedTools` | `string[]` | Tools Claude can use |
| `permissionMode` | `'default' \| 'acceptEdits' \| 'bypassPermissions' \| 'plan'` | Permission level |
| `systemPrompt` | `string \| { type: 'preset', preset: 'claude_code', append?: string }` | System prompt config |
| `cwd` | `string` | Working directory |
| `model` | `string` | Model to use |
| `maxTurns` | `number` | Max conversation turns |
| `maxBudgetUsd` | `number` | Max budget in USD |
| `outputFormat` | `{ type: 'json_schema', schema: JSONSchema }` | Structured output schema |
| `settingSources` | `('user' \| 'project' \| 'local')[]` | Which filesystem settings to load |
| `hooks` | `Record<HookEvent, HookCallbackMatcher[]>` | Lifecycle hooks |
| `agents` | `Record<string, AgentDefinition>` | Custom subagents |
| `mcpServers` | `Record<string, McpServerConfig>` | MCP server configs |
| `sandbox` | `SandboxSettings` | Sandbox configuration |
| `env` | `Record<string, string>` | Environment variables |
| `canUseTool` | `(tool, input, opts) => Promise<PermissionResult>` | Custom permission function |

### System Prompt Control

Four ways to configure system prompts:

```typescript
// 1. Claude Code preset (full system prompt)
systemPrompt: { type: 'preset', preset: 'claude_code' }

// 2. Claude Code preset + append custom instructions
systemPrompt: {
  type: 'preset',
  preset: 'claude_code',
  append: 'Follow Go conventions. Use error wrapping with %w.'
}

// 3. Fully custom system prompt (replaces everything)
systemPrompt: 'You are a Go coding expert. Follow these conventions strictly...'

// 4. CLAUDE.md files (loaded from filesystem)
settingSources: ['project']  // Loads CLAUDE.md from project dir
```

### Skills Support

Skills are loaded from `.claude/skills/` when `settingSources` includes `'project'`:

```typescript
for await (const message of query({
  prompt: "Write Go code following project conventions",
  options: {
    cwd: "/path/to/project",       // Project with .claude/skills/
    settingSources: ["project"],    // Load skills from filesystem
    allowedTools: ["Skill", "Read", "Write", "Bash"]
  }
})) { /* ... */ }
```

Alternatively, skill content can be injected directly via `systemPrompt`:

```typescript
const skillContent = readFileSync('skills/go-write/SKILL.md', 'utf-8');

for await (const message of query({
  prompt: "Write a Go UserService with proper error handling",
  options: {
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: `Follow these Go coding conventions strictly:\n\n${skillContent}`
    },
    allowedTools: ["Read", "Write", "Edit", "Bash"],
    permissionMode: "bypassPermissions"
  }
})) { /* ... */ }
```

### Structured Outputs

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const schema = {
  type: 'object',
  properties: {
    files_created: { type: 'array', items: { type: 'string' } },
    build_passed: { type: 'boolean' },
    summary: { type: 'string' }
  },
  required: ['files_created', 'build_passed', 'summary']
};

for await (const message of query({
  prompt: "Write Go code and verify it compiles",
  options: {
    outputFormat: { type: 'json_schema', schema },
    allowedTools: ["Read", "Write", "Edit", "Bash"]
  }
})) {
  if (message.type === 'result' && message.structured_output) {
    console.log(message.structured_output);
    // { files_created: ["main.go", "service.go"], build_passed: true, summary: "..." }
  }
}
```

### Hooks (Lifecycle Callbacks)

```typescript
const logEdits = async (input) => {
  const filePath = input.tool_input?.file_path ?? "unknown";
  console.log(`File modified: ${filePath}`);
  return {};
};

for await (const message of query({
  prompt: "Write Go code",
  options: {
    hooks: {
      PostToolUse: [{ matcher: "Edit|Write", hooks: [logEdits] }]
    }
  }
})) { /* ... */ }
```

### Sandbox Configuration

```typescript
for await (const message of query({
  prompt: "Build and test my project",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      network: { allowLocalBinding: true }
    },
    permissionMode: "bypassPermissions"
  }
})) { /* ... */ }
```

### Result Message Structure

```typescript
// SDKResultMessage on success
{
  type: 'result',
  subtype: 'success',
  session_id: string,
  duration_ms: number,
  duration_api_ms: number,
  is_error: boolean,
  num_turns: number,
  result: string,            // Text result
  total_cost_usd: number,
  usage: { input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens },
  modelUsage: { [modelName]: { inputTokens, outputTokens, costUSD, ... } },
  structured_output?: unknown  // If outputFormat was specified
}
```

### Pros

- **Native TypeScript API** — first-class async generator with full type safety
- **Structured outputs** — JSON Schema-validated output via `outputFormat`
- **System prompt control** — preset, append, or fully custom
- **Skills integration** — load from filesystem or inject via system prompt
- **Hooks** — intercept tool calls for logging, auditing, validation
- **Sandbox settings** — programmatic sandbox configuration
- **Custom permissions** — `canUseTool` callback for fine-grained control
- **Session management** — resume, fork, capture session IDs
- **Cost tracking** — per-query cost in USD and token usage
- **Subagents** — define custom specialized agents
- **MCP integration** — connect to external tools via MCP servers
- **Streaming** — async generator pattern with partial messages
- **Error handling** — typed error subtypes (`error_max_turns`, `error_during_execution`, etc.)

### Cons

- **Requires Node.js Claude Code runtime** — SDK depends on Claude Code CLI being available
- **Newer API** — less battle-tested than the CLI approach
- **SDK overhead** — slightly more setup than a simple CLI call
- **Container isolation** — sandbox settings control command execution but Docker/container isolation must still be managed externally

---

## 3. Comparison Table

| Feature | CLI Headless (`claude -p`) | Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Current (`@vercel/agent-eval`) |
|---------|---------------------------|----------------------------------------------|-------------------------------|
| **Language** | Shell/CLI | TypeScript / Python | TypeScript |
| **Invocation** | `execSync('claude -p ...')` | `query({ prompt, options })` | `ExperimentConfig` object |
| **System prompt** | `--append-system-prompt` / `--system-prompt` | `systemPrompt` option (preset, append, custom) | `editPrompt` callback |
| **Skill injection** | CLI arg (string escaping) | `settingSources: ['project']` or `systemPrompt.append` | Manual via `editPrompt` |
| **Structured output** | `--json-schema` flag | `outputFormat: { type: 'json_schema', schema }` | N/A (text result) |
| **Sandbox/Docker** | External (run CLI in Docker) | `sandbox` option + external Docker | Built-in `sandbox: 'docker'` |
| **Hooks/callbacks** | None | `hooks` option (Pre/PostToolUse, etc.) | `setup` callback |
| **Permission control** | `--allowedTools` flag | `permissionMode`, `canUseTool` callback | Managed by framework |
| **Cost tracking** | Parse JSON output | `total_cost_usd` in result message | Via framework |
| **Session resume** | `--resume <session_id>` | `resume` option | N/A |
| **Error handling** | Exit codes + stderr | Typed `subtype` on result messages | Vitest test failures |
| **Streaming** | `--output-format stream-json` | Async generator with partial messages | N/A |
| **Model selection** | `--model` flag | `model` option | `model` in config |
| **Multiple runs** | Loop externally | Loop in TypeScript | `runs: N` in config |
| **Setup/teardown** | External scripts | Via hooks or wrapping code | `setup` callback |
| **Eval assertions** | External (parse output) | External (parse output) | Vitest (EVAL.ts) |
| **Docker sandbox mgmt** | Manual | Manual (or external provider) | Built-in |
| **Maturity** | Stable (original approach) | Newer but officially recommended | Third-party framework |

---

## 4. How This Maps to Our Current Setup

### Current Architecture (`@vercel/agent-eval`)

```
experiments/baseline.ts
  → agent: 'claude-code'
  → model: 'sonnet'
  → sandbox: 'docker'
  → setup: install Go in Docker
  → editPrompt: prepend skill content to prompt

evals/go-write/01-error-handling/
  → PROMPT.md: task description
  → EVAL.ts: vitest assertions (go build, go vet, regex patterns)
  → src/go.mod: initial Go module
```

The framework handles: Docker lifecycle, running the agent, capturing output, running vitest assertions, collecting results across N runs.

### What the Agent SDK Would Replace/Complement

The Agent SDK can replace the **agent invocation** part but NOT the **eval orchestration** (Docker lifecycle, multiple runs, result aggregation). We'd need to either:

**Option A: Replace `@vercel/agent-eval` entirely**
- Write our own runner that uses `query()` to invoke Claude
- Manage Docker containers ourselves (or use a sandbox provider)
- Run vitest assertions ourselves
- Track results across runs

**Option B: Use Agent SDK as the agent backend within `@vercel/agent-eval`**
- If `@vercel/agent-eval` supports custom agent implementations, swap in the Agent SDK
- Keep the Docker sandbox, setup, eval assertions from the existing framework

**Option C: Hybrid approach**
- Use `@vercel/agent-eval` for orchestration (Docker, runs, assertions)
- Use CLI headless mode (`claude -p`) with `--append-system-prompt` for skill injection
- This is the simplest migration — just change `editPrompt` to use system prompt flags

---

## 5. Concrete Code Examples

### Example 1: Agent SDK — Write Go Code with Skill Injection

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync } from "fs";

const skillContent = readFileSync("skills/go-write/SKILL.md", "utf-8");
const promptContent = readFileSync("evals/go-write/01-error-handling/PROMPT.md", "utf-8");

async function runEval() {
  let result: string | undefined;
  let cost: number | undefined;
  let sessionId: string | undefined;

  for await (const message of query({
    prompt: promptContent,
    options: {
      cwd: "/path/to/sandbox/src",
      model: "sonnet",
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: `Follow these Go coding conventions strictly:\n\n${skillContent}`
      },
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      permissionMode: "bypassPermissions",
      maxTurns: 30,
      maxBudgetUsd: 1.0,
    }
  })) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    if (message.type === "result") {
      result = message.subtype === "success" ? message.result : undefined;
      cost = message.total_cost_usd;
    }
  }

  return { result, cost, sessionId };
}
```

### Example 2: Agent SDK — With Structured Output

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const evalSchema = {
  type: "object",
  properties: {
    files_created: {
      type: "array",
      items: { type: "string" },
      description: "List of Go files created"
    },
    compilation_status: {
      type: "string",
      enum: ["success", "failure"],
      description: "Whether go build passed"
    },
    summary: {
      type: "string",
      description: "Brief description of what was implemented"
    }
  },
  required: ["files_created", "compilation_status", "summary"]
};

for await (const message of query({
  prompt: `${promptContent}\n\nAfter writing the code, run 'go build ./...' to verify it compiles.`,
  options: {
    outputFormat: { type: "json_schema", schema: evalSchema },
    allowedTools: ["Read", "Write", "Edit", "Bash"],
    permissionMode: "bypassPermissions"
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const output = message.structured_output as {
      files_created: string[];
      compilation_status: string;
      summary: string;
    };
    console.log("Files:", output.files_created);
    console.log("Build:", output.compilation_status);
  }
}
```

### Example 3: CLI Headless — Simple Shell Invocation

```typescript
import { execSync } from "child_process";
import { readFileSync } from "fs";

const skillContent = readFileSync("skills/go-write/SKILL.md", "utf-8");
const prompt = readFileSync("evals/go-write/01-error-handling/PROMPT.md", "utf-8");

const result = execSync(
  `claude -p ${JSON.stringify(prompt)} \
    --append-system-prompt ${JSON.stringify(skillContent)} \
    --output-format json \
    --allowedTools "Read,Write,Edit,Bash,Glob,Grep"`,
  {
    cwd: "/path/to/sandbox",
    encoding: "utf-8",
    timeout: 300_000,
    env: { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
  }
);

const parsed = JSON.parse(result);
console.log("Result:", parsed.result);
console.log("Session:", parsed.session_id);
```

### Example 4: Full Eval Runner with Agent SDK

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

interface EvalResult {
  evalName: string;
  run: number;
  passed: boolean;
  cost: number;
  durationMs: number;
  testResults: { name: string; passed: boolean; error?: string }[];
}

async function runSingleEval(
  evalDir: string,
  skillContent: string,
  run: number
): Promise<EvalResult> {
  const prompt = readFileSync(join(evalDir, "PROMPT.md"), "utf-8");
  const evalName = evalDir.split("/").slice(-2).join("/");
  const srcDir = join(evalDir, "src");

  // Step 1: Run the agent to generate code
  let cost = 0;
  let durationMs = 0;

  for await (const message of query({
    prompt,
    options: {
      cwd: srcDir,
      model: "sonnet",
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: `Follow these Go coding conventions:\n\n${skillContent}`
      },
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob"],
      permissionMode: "bypassPermissions",
      maxTurns: 30,
    }
  })) {
    if (message.type === "result") {
      cost = message.total_cost_usd;
      durationMs = message.duration_ms;
    }
  }

  // Step 2: Run vitest assertions (EVAL.ts)
  let testResults: { name: string; passed: boolean; error?: string }[] = [];
  try {
    const vitestOutput = execSync(
      `npx vitest run --reporter=json ${join(evalDir, "EVAL.ts")}`,
      { encoding: "utf-8", timeout: 60_000 }
    );
    const parsed = JSON.parse(vitestOutput);
    testResults = parsed.testResults[0].assertionResults.map((t: any) => ({
      name: t.title,
      passed: t.status === "passed",
      error: t.failureMessages?.[0],
    }));
  } catch (e: any) {
    // vitest returns non-zero on test failure
    try {
      const parsed = JSON.parse(e.stdout);
      testResults = parsed.testResults[0].assertionResults.map((t: any) => ({
        name: t.title,
        passed: t.status === "passed",
        error: t.failureMessages?.[0],
      }));
    } catch {
      testResults = [{ name: "vitest", passed: false, error: String(e) }];
    }
  }

  return {
    evalName,
    run,
    passed: testResults.every((t) => t.passed),
    cost,
    durationMs,
    testResults,
  };
}
```

---

## 6. Recommendation

### Primary Recommendation: Claude Agent SDK

For our eval framework, the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) is the best approach because:

1. **Native TypeScript** — No shell escaping, proper types, async/await
2. **System prompt control** — `systemPrompt.append` is perfect for injecting skill content
3. **Structured outputs** — Can get JSON-validated results for richer eval metadata
4. **Cost tracking** — Built-in `total_cost_usd` for cost comparison across experiments
5. **Hooks** — Can log/audit every tool call for debugging eval failures
6. **Session management** — Can resume sessions for multi-step evals
7. **Officially recommended** — Anthropic's preferred approach for programmatic use

### Migration Strategy

**Phase 1 (Minimal change):** Keep `@vercel/agent-eval` for orchestration but explore if it supports custom agent backends. If yes, swap in Agent SDK as the agent.

**Phase 2 (Full migration):** Build a thin custom eval runner that:
- Uses Agent SDK `query()` to invoke Claude per eval
- Manages Docker containers (or uses a sandbox provider like E2B/Modal/Vercel Sandbox)
- Runs vitest EVAL.ts assertions against the generated files
- Collects results across N runs
- Outputs comparison tables (baseline vs. with-skill)

This gives us full control over the agent invocation while keeping our existing eval/assertion model (EVAL.ts with vitest, PROMPT.md, two-layer assertions).

### What We Keep

- **EVAL.ts format** — vitest assertions (Layer 1: deterministic, Layer 2: pattern checks)
- **PROMPT.md format** — task descriptions
- **Skills as SKILL.md** — either loaded via `settingSources` or injected via `systemPrompt.append`
- **Docker sandbox** — for Go build/vet isolation

### What We Gain

- Direct control over system prompt (no `editPrompt` workaround)
- Structured output for richer eval metadata
- Per-run cost tracking
- Hook-based debugging and auditing
- Type-safe API throughout
