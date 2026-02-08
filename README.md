# Harness

A curated collection of Agent Skills, Hooks, Commands, and Subagents for the Go/Backend ecosystem.

## Install

Install all skills globally:

```bash
pnpx skills add stuckinforloop/harness --skill='*' -g
```

Install a specific skill:

```bash
pnpx skills add stuckinforloop/harness --skill='stuckinforloop'
```

Install into current project:

```bash
pnpx skills add stuckinforloop/harness --skill='*'
```

## What's Inside

### Skills

Skills are portable knowledge packages that agents load on-demand. Each skill has a `SKILL.md` entry point and `references/` directory with one concept per file.

| Skill | Type | Description |
|-------|------|-------------|
| `stuckinforloop` | Hand-maintained | Personal Go/Backend preferences, conventions, and best practices |

### Agents

Custom subagent definitions for specialized tasks. Copy to `~/.claude/agents/` to use.

### Hooks

Claude Code hooks for automating workflows. Configure in `~/.claude/settings.json`.

### Commands

Custom slash commands for common operations.

### Evals

Evaluation test cases using the [agent-eval](https://github.com/vercel-labs/agent-eval) framework to verify skills work as expected.

## Skill Types

This repository contains three types of skills:

- **Hand-maintained** — Manually authored skills with personal preferences and conventions
- **Generated** — AI-generated from upstream OSS documentation (via git submodules in `sources/`)
- **Vendored** — Synced from projects that maintain their own skills (via git submodules in `vendor/`)

## Customization

Fork this repository to create your own collection:

1. Edit `meta.ts` to define your sources, vendors, and manual skills
2. Add your preferences to `instructions/`
3. Run `pnpm start` to sync and generate skills
4. Push and install with `pnpx skills add <your-username>/harness`

## Development

```bash
pnpm install
pnpm start        # Run CLI (init, sync, check, cleanup)
pnpm lint          # Lint scripts and config
```

## License

[MIT](./LICENSE)
