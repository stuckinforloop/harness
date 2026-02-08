# Harness — Agent Skills Generation Guidelines

This file provides instructions for AI agents generating or maintaining skills in this repository.

## Repository Organization

- `skills/` — Output directory for all installable skills
- `sources/` — Git submodules of upstream documentation repos (for generated skills)
- `vendor/` — Git submodules of projects that maintain their own skills (for synced skills)
- `instructions/` — Per-skill opinionated preferences that guide generation
- `agents/` — Custom subagent definitions
- `hooks/` — Claude Code hook definitions
- `commands/` — Custom slash commands
- `evals/` — Agent evaluation test cases
- `scripts/` — CLI tooling for init, sync, check, cleanup
- `meta.ts` — Central registry of submodules, vendors, and manual skills

## Skill Types

### Generated Skills

Created from upstream OSS documentation in `sources/`. Each generated skill must include:

- `SKILL.md` — Entry point with YAML frontmatter and reference table
- `GENERATION.md` — Tracks source path, git SHA, and generation date
- `references/` — Individual markdown files, one concept per file

### Synced Skills

Pulled from projects in `vendor/` that maintain their own skills. Each synced skill must include:

- `SKILL.md` — Entry point (copied from source)
- `SYNC.md` — Tracks vendor source path, git SHA, and sync date
- `references/` — Copied from source as-is

### Hand-Written Skills

Manually authored and maintained in `skills/`. Must include:

- `SKILL.md` — Entry point with YAML frontmatter
- `references/` — Individual reference files

## SKILL.md Format

```yaml
---
name: skill-name
description: One or two sentences describing what the skill covers and when to use it.
metadata:
  author: stuckinforloop
  version: "YYYY.MM.DD"
  source: Generated from <url>  # only for generated skills
---
```

## Content Principles

- Write for agents, not humans. Be concise and practical.
- Exclude introductions, tutorials, and content LLMs already know well.
- Focus on usage patterns, working code examples, and gotchas.
- One concept per reference file — agents load only what they need.
- Use `category-topic.md` naming for reference files (e.g., `core-concurrency.md`, `best-practices-error-handling.md`).

## Reference File Categories

| Prefix | Use For |
|--------|---------|
| `core-` | Fundamental concepts and APIs |
| `features-` | Specific feature guides |
| `advanced-` | Advanced patterns and internals |
| `best-practices-` | Opinionated recommendations |
| `patterns-` | Common design patterns |
| `tools-` | CLI tools and utilities |
| `integrations-` | Integration with other tools/services |

## GENERATION.md Format

```markdown
**Source:** `sources/<name>`
**Git SHA:** `<40-char-hex>`
**Generated:** <YYYY-MM-DD>
```

## SYNC.md Format

```markdown
**Source:** `vendor/<name>/skills/<skill-name>`
**Git SHA:** `<40-char-hex>`
**Synced:** <YYYY-MM-DD>
```
