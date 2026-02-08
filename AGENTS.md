# Harness

A collection of agent skills for Go/Backend development.

## Repository Layout

- `skills/` — Installable skills (each has `SKILL.md` + `references/`)
- `agents/` — Custom subagent definitions
- `hooks/` — Claude Code hooks
- `commands/` — Custom slash commands
- `evals/` — Evaluation test cases

## Skill Structure

Every skill is a directory under `skills/` containing:

- `SKILL.md` — Entry point with YAML frontmatter (`name`, `description`)
- `references/` — One markdown file per concept, named `category-topic.md`

## Writing Guidelines

- Write for agents, not humans. Be concise.
- Exclude content LLMs already know well.
- Focus on practical patterns, working code, and gotchas.
- One concept per reference file.
