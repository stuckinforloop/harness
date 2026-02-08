# Contributing: Adding a New Skill

Step-by-step guide for adding a new skill to the harness repo. Derived from how the `go-style` skill was built.

## Overview

A skill consists of three deliverables:

1. **Skill content** -- `skills/<skill-name>/` with a `SKILL.md` entry point and `references/` directory
2. **Eval suite** -- `evals/<skill-name>/` with 10+ eval cases, experiment configs, and a README
3. **Index updates** -- Compressed summaries in `AGENTS.md` and a row in `README.md`

---

## Phase 1: Research and Planning

Before writing anything, research the domain.

1. **Identify gaps.** What does the LLM already know well? What does it commonly get wrong? Only the gaps belong in the skill.
2. **Scope the skill.** One skill per concern. Prefer separate skills for progressive disclosure (e.g., `go`, `go-style`, `go-testing`) rather than one monolithic skill.
3. **Plan content.** A skill uses a lean `SKILL.md` (~60-80 lines of body content) as an index, with detailed rules pushed into individual reference files.

### What to exclude

- Basic syntax and fundamental concepts the model already handles correctly.
- Information readily available in standard documentation that the model can recall.

### What to include

- Nuanced conventions the model frequently violates (e.g., `"get user: %w"` not `"failed to get user: %w"`).
- Anti-patterns that look reasonable but are wrong (e.g., logging an error AND returning it).
- Domain-specific naming rules, ordering conventions, and structural patterns.

---

## Phase 2: Skill Content

### Directory structure

```
skills/<skill-name>/
  SKILL.md
  references/
    <topic-a>.md
    <topic-b>.md
    ...
```

### SKILL.md

The entry point. Keep it lean -- principles, a reference index, and a quick-reference cheat sheet.

**Frontmatter** (required):

```yaml
---
name: <skill-name>
description: >
  One to two sentences. Describe the domain and when the skill applies.
---
```

**Body sections** (in order):

| Section | Purpose | Length |
|---------|---------|--------|
| Core Principles | 3-5 bullet points capturing the philosophy | 3-5 lines |
| Reference Index | Table mapping each reference file to its topics | 1 row per file |
| When to Apply | Scoping rules -- when to use and when NOT to use | 4-6 lines |
| Linting (optional) | Tool configs relevant to the skill | as needed |
| Quick Reference | Compressed critical rules for inline recall | 8-12 lines |

**Example** (from `go-style`):

```markdown
---
name: go-style
description: >
  Uber Go Style Guide conventions for Go code. Covers error handling,
  concurrency, interfaces, naming, struct initialization, and code
  organization. Use when writing, reviewing, or refactoring Go code.
---

# Go Style

## Core Principles

- **Consistency over cleverness.** Follow established patterns even when a "smarter" approach exists.
- **Safety by default.** Prefer defensive copies, zero-value safety, and compile-time checks.
- **Handle errors exactly once.** Either log or return -- never both.

## Reference Index

| Reference | Topics |
|-----------|--------|
| [errors](references/errors.md) | Sentinel errors, custom error types, `%w` wrapping, handle-once rule |
| [interfaces](references/interfaces.md) | Compile-time checks, consumer-side definition, no pointer-to-interface |
| ... | ... |

## Quick Reference

**Error handling**: Wrap with `fmt.Errorf("operation: %w", err)`. Lowercase, concise messages.
**Interfaces**: Define at consumer. Verify with `var _ Interface = (*Type)(nil)`.
...
```

### Reference files

One file per concept. Each file is 50-150 lines and follows the global template at [`templates/reference.md`](../templates/reference.md):

```
# <Topic Name>

## Rules
- Concise bullet points. Do/don't format.

## Patterns
### <Pattern Name> -- Bad
(code example of the anti-pattern)

### <Pattern Name> -- Good
(code example of the correct pattern)

## Checklist
- [ ] Verification item 1
- [ ] Verification item 2
```

### Index updates

After creating the skill content, update two files:

**AGENTS.md** -- Add a compressed skill index entry under `## Skill Index`. This is always-available context (research shows compressed always-available summaries outperform on-demand retrieval). Write 1-2 line summaries of the most critical rules per topic.

```markdown
### <skill-name>

One-line skill description. Key rules (always-available context):

- **Topic A**: Compressed critical rule. Another critical rule.
- **Topic B**: Compressed critical rule.
```

**README.md** -- Add a row to the skills table:

```markdown
| `<skill-name>` | One-line description of what the skill covers |
```

---

## Phase 3: Eval Suite

### Directory structure

```
evals/<skill-name>/
  README.md
  01-<eval-name>/
    PROMPT.md
    EVAL.ts
    package.json
    src/
  02-<eval-name>/
    ...
  12-negative-control/
    ...

experiments/            ← repo root, discovered by @vercel/agent-eval
  baseline.ts
  with-skill.ts
```

### Eval case design

Design 10+ eval cases covering key skill areas, plus one negative control.

- Each case tests a specific convention or rule from the skill.
- The negative control presents a task that has no style requirement (e.g., write a Dockerfile). It measures baseline noise -- if the skill causes regressions on unrelated tasks, the negative control catches it.
- Number cases with zero-padded prefixes: `01-`, `02-`, ..., `12-`.

### PROMPT.md

A clear task prompt for the agent. Requirements:

- Describe a concrete coding task (not "follow the style guide").
- State explicit requirements that map to assertions in EVAL.ts.
- End with: `Place all code in the src/ directory.`

**Example** (from `01-error-handling/PROMPT.md`):

```markdown
Write a `UserService` in Go with `Create`, `Get`, `Update`, and `Delete` methods
that call an external API client. Use proper error handling following Uber's Go
style guide.

Requirements:

- Define an `APIClient` interface that the `UserService` depends on.
- Define appropriate sentinel errors (e.g., `ErrNotFound`, `ErrAlreadyExists`)
  as package-level variables using `errors.New`.
- Define custom error types where additional context is needed.
- Wrap errors from the API client using `fmt.Errorf` with the `%w` verb.
- Demonstrate usage of `errors.Is` or `errors.As` to check error types.
- Avoid the double-handling anti-pattern: do not both log and return the same error.
- Include a `main` function that demonstrates constructing the service.

Place all code in the `src/` directory.
```

### EVAL.ts

Vitest assertions organized in three layers, from cheapest to most expressive.

**Layer 1: Deterministic** -- The code must compile and pass static analysis. Zero ambiguity, zero cost.

```typescript
import { test, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const srcDir = join(__dirname, 'src');

test('go build passes', () => {
  execSync('go build ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});

test('go vet passes', () => {
  execSync('go vet ./...', { cwd: srcDir, stdio: 'pipe', timeout: 30_000 });
});
```

**Layer 2: Pattern checks** -- Regex against the generated source. Fast, repeatable, no LLM cost.

```typescript
import { readFileSync, readdirSync } from 'fs';

function readGoFiles(): string {
  return readdirSync(srcDir)
    .filter(f => f.endsWith('.go'))
    .map(f => readFileSync(join(srcDir, f), 'utf-8'))
    .join('\n');
}

test('sentinel errors are defined', () => {
  const code = readGoFiles();
  const sentinelPattern = /var\s+Err\w+\s*=\s*errors\.New\(/g;
  const matches = code.match(sentinelPattern);
  expect(matches, 'expected sentinel errors defined with errors.New').not.toBeNull();
  expect(matches!.length).toBeGreaterThanOrEqual(2);
});
```

**Layer 3: LLM rubric** (optional) -- For conventions that resist mechanical verification. More expensive but necessary for subjective judgments.

Prefer deterministic and pattern checks. Use LLM rubric only as a last resort.

### src/

Minimal starter files -- just enough for the agent to build on. Can be empty if the task starts from scratch.

### Per-eval package.json

Each eval directory must contain a `package.json` with `"type": "module"`. This is required by `@vercel/agent-eval`:

```json
{
  "private": true,
  "type": "module"
}
```

### Negative control

The final eval case (`12-negative-control` or similar) should present a task completely unrelated to the skill's domain. For example, `go-style` uses a Dockerfile task. The negative control verifies the skill does not cause regressions on unrelated work.

### Experiment configs

Create two configs at the repo-root `experiments/` directory using the `ExperimentConfig` type from `@vercel/agent-eval`:

**`experiments/baseline.ts`** -- Agent without the skill (control group):

```typescript
import type { ExperimentConfig } from '@vercel/agent-eval';

const config: ExperimentConfig = {
  agent: 'claude-code',
  model: 'opus',
  runs: 10,
  earlyExit: true,
  timeout: 600,
  evals: '*',
  setup: async (sandbox) => {
    await sandbox.runCommand('bash', ['-c', 'apt-get update && apt-get install -y golang-go']);
  },
};

export default config;
```

**`experiments/with-skill.ts`** -- Agent with the skill (treatment group):

```typescript
import type { ExperimentConfig } from '@vercel/agent-eval';

const config: ExperimentConfig = {
  agent: 'claude-code',
  model: 'opus',
  runs: 10,
  earlyExit: true,
  timeout: 600,
  evals: '*',
  setup: async (sandbox) => {
    await sandbox.runCommand('bash', ['-c', 'apt-get update && apt-get install -y golang-go']);
  },
  editPrompt: (prompt) =>
    `You have the go-style skill installed. Follow Uber Go Style Guide conventions.\n\n${prompt}`,
};

export default config;
```

### Eval README

Create `evals/<skill-name>/README.md` with:

- Overview of what the suite tests
- Table of all eval cases with a one-line description each
- How to run (using Makefile commands)
- Description of the experiment configs
- Explanation of the three assertion layers
- Pass rate tracking template

---

## Phase 4: Validate

1. **Install the skill locally** and verify it loads.

   ```bash
   npx skills add stuckinforloop/harness --skill='<skill-name>'
   ```

2. **Run evals** from the repo root using the Makefile.

   ```bash
   make install
   make eval EVAL=evals/<skill-name>/01-<eval-name>
   make evals
   make agent-eval      # full agent-eval loop
   make agent-eval-dry  # dry run (discovers evals + experiments)
   ```

3. **A/B test** by running both experiment configs (baseline vs with-skill) with 10+ runs each. Record pass rates and compute lift.

   | Eval | Baseline (n=10) | With Skill (n=10) | Lift |
   |------|-----------------|-------------------|------|
   | 01   | 3/10            | 9/10              | +60% |
   | ...  | ...             | ...               | ...  |

4. **Iterate.** If a specific eval consistently fails, examine whether the skill content is unclear, too compressed, or missing a pattern. Refine and re-run.

---

## Checklist

Before submitting, verify:

- [ ] `skills/<skill-name>/SKILL.md` exists with valid YAML frontmatter
- [ ] `skills/<skill-name>/references/` has one file per concept (50-150 lines each)
- [ ] Reference files follow the template at `templates/reference.md` (Rules → Patterns → Checklist)
- [ ] `AGENTS.md` has a compressed skill index entry
- [ ] `README.md` skills table has a new row
- [ ] `evals/<skill-name>/` has 10+ eval cases plus a negative control
- [ ] Each eval case has `PROMPT.md`, `EVAL.ts`, `package.json` (with `"type": "module"`), and `src/`
- [ ] EVAL.ts uses deterministic checks first, pattern checks second, LLM rubric only when necessary
- [ ] `experiments/baseline.ts` and `experiments/with-skill.ts` exist at repo root
- [ ] `evals/<skill-name>/README.md` documents the suite
- [ ] A/B testing shows measurable lift over baseline

---

## Design Principles (Summary)

| Principle | Rationale |
|-----------|-----------|
| Lean SKILL.md with reference index | Keeps the entry point scannable; details live in focused reference files |
| Exclude what LLMs already know | Avoids noise; every line should correct a specific model weakness |
| Focus on anti-patterns and nuance | These are the gaps that produce the most lift |
| Always-available context in AGENTS.md | Compressed summaries outperform on-demand retrieval (per Vercel research) |
| One concept per reference file | Enables targeted retrieval and easier maintenance |
| Global reference template | `templates/reference.md` standardizes the Rules → Patterns → Checklist structure |
| Behavior-based eval assertions | Tests conventions via code output, not style guide knowledge |
| Three assertion layers | Deterministic first (cheapest), pattern second, LLM rubric last (most expensive) |
| Negative control eval | Catches regressions on unrelated tasks |
| 10+ runs per experiment | Reduces variance for meaningful pass rate comparisons |
