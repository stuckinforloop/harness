# Solution File Schema

## Rules

- Every solution file lives under `docs/solutions/<problem-type>/`.
- File name is a kebab-case slug: `goroutine-leak-in-middleware.md`.
- YAML frontmatter is required. Body is markdown.
- `title`, `problem_type`, `severity`, `components`, and `root_cause` are required.
- `tags` should include Go-specific concepts for agent searchability.

## Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `title` | Yes | string | Short, descriptive title |
| `problem_type` | Yes | enum | One of: `concurrency-bug`, `error-handling`, `interface-design`, `performance`, `api-design`, `dependency`, `testing`, `security` |
| `severity` | Yes | enum | One of: `critical`, `high`, `medium`, `low` |
| `components` | Yes | list[string] | Go packages/files affected |
| `root_cause` | Yes | string | One-line root cause |
| `tags` | No | list[string] | Go concepts for search |
| `date` | No | string | YYYY-MM-DD format |
| `related` | No | list[string] | Paths to related solutions |
| `pr` | No | string | GitHub PR URL |

## Body Structure

```markdown
## Problem

What happened. Include error messages, test failures, or symptoms.

## Bad Pattern

\```go
// The code that caused the problem
\```

## Fix

\```go
// The corrected code
\```

## Why

Explanation of why the fix works and the bad pattern fails.

## Rule

Concise, reusable rule to prevent recurrence.

## References

- Links to Go documentation, blog posts, or related solutions
```

## Patterns

### Solution File -- Good

```yaml
---
title: "Goroutine leak in HTTP handler middleware"
problem_type: concurrency-bug
severity: high
components:
  - "internal/auth/middleware.go"
root_cause: "Fire-and-forget goroutine without context cancellation"
tags:
  - goroutine
  - context
  - middleware
  - leak
date: "2025-01-15"
---
```

### Missing Required Fields -- Bad

```yaml
---
title: "Some bug fix"
tags:
  - bug
---
```

Missing `problem_type`, `severity`, `components`, and `root_cause`.

## Checklist

- [ ] File is under `docs/solutions/<problem-type>/`
- [ ] File name is kebab-case
- [ ] All required frontmatter fields present
- [ ] `problem_type` matches one of the enum values
- [ ] `components` lists actual Go file paths
- [ ] `root_cause` is a single concise line
- [ ] Body has Problem, Bad Pattern, Fix, Why, Rule sections
- [ ] `tags` include Go-specific searchable concepts
