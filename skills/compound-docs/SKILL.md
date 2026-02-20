---
name: compound-docs
description: >
  Document solved Go problems as reusable solution files in docs/solutions/.
  7-step process: identify problem, classify root cause, document solution
  with Go-specific context. Builds institutional memory that research agents
  query during planning.
---

# Compound Documentation

## Core Principles

- **Compound over disposable.** Every solved problem becomes a reusable asset. Future agents search `docs/solutions/` before planning.
- **Problem-first, not solution-first.** Start with what went wrong and why. The fix is secondary to understanding the root cause.
- **Go-specific context.** Tag solutions with Go concepts (concurrency, error handling, interfaces) so research agents find them.

## Reference Index

| Reference | Topics |
|-----------|--------|
| [yaml-schema](references/yaml-schema.md) | Solution file YAML frontmatter schema, field descriptions, valid values |

## Process

### Step 1: Identify the Problem

What broke, failed, or was suboptimal? Be specific:
- Error messages, stack traces, or test failures
- Performance regression metrics
- Design flaw description

### Step 2: Classify the Root Cause

Use one of the standard problem types from the schema:
`concurrency-bug`, `error-handling`, `interface-design`, `performance`, `api-design`, `dependency`, `testing`, `security`

### Step 3: Identify Affected Components

List the Go packages, files, and functions involved. Use full paths:
- `internal/auth/middleware.go:42`
- `pkg/worker/pool.go`

### Step 4: Document the Bad Pattern

Show the actual code that caused the problem. Use Go code blocks.

### Step 5: Document the Fix

Show the corrected code. Explain WHY it works, not just WHAT changed.

### Step 6: Extract the Rule

Write a concise, reusable rule that prevents recurrence:
- "Always check `ctx.Done()` in select loops inside goroutines"
- "Never embed a mutex in an exported struct"

### Step 7: Write the Solution File

Create a YAML-frontmatter markdown file in `docs/solutions/<category>/`:

```
docs/solutions/<problem-type>/<slug>.md
```

Use the schema defined in `references/yaml-schema.md` for the frontmatter.

## When to Apply

Apply when:
- A bug was fixed and the root cause is worth documenting
- A design decision was made after evaluating alternatives
- A performance issue was identified and resolved
- A security vulnerability was found and patched

Do NOT apply when:
- The fix is trivial (typo, missing import)
- The problem is project-specific with no reusable lesson

## Quick Reference

**File path**: `docs/solutions/<problem-type>/<slug>.md`
**Frontmatter**: title, problem_type, components, root_cause, severity, tags
**Body**: Problem → Bad Pattern → Fix → Rule → References
