# Harness

Agent skills for Go/Backend development.

## Install

All skills:

```bash
npx skills add stuckinforloop/harness --skill='*' -g
```

A specific skill:

```bash
npx skills add stuckinforloop/harness --skill='go'
```

## Skills

| Skill | Description |
|-------|-------------|
| `stuckinforloop` | Personal preferences, workflows, and conventions |
| `go` | Writing, testing, debugging, and reviewing Go code |
| `go-style` | Uber Go Style Guide conventions for error handling, concurrency, interfaces, naming, and code organization |
| `github-sprint` | AI Scrum Master for GitHub-based sprint workflows with dependency tracking, ticket templates, and velocity reporting |
| `compound-docs` | Document solved Go problems as reusable solution files with YAML schema for institutional memory |
| `openspec-go` | Go-specific conventions for writing OpenSpec specifications (concurrency, errors, API design) |

## Compound Engineering Plugin

The `compound-engineering` plugin provides a Plan -> Work -> Review -> Compound workflow for Go projects, backed by OpenSpec.

### Commands

| Command | Description |
|---------|-------------|
| `/lfg <feature>` | Full pipeline: plan -> work -> review -> compound |
| `/workflows:plan <feature>` | Research agents + OpenSpec change creation |
| `/workflows:work` | Execute tasks with Go quality gates, create PR |
| `/workflows:review [target]` | Parallel Go review with 6 specialized agents |
| `/workflows:compound` | Document learnings + archive specs |
| `/setup` | Configure compound engineering for a Go project |

### Agents

**Review**: `concurrency-sentinel`, `error-handling-auditor`, `interface-auditor`, `security-sentinel`, `performance-oracle`, `architecture-strategist`

**Research**: `repo-research-analyst`, `learnings-researcher`, `best-practices-researcher`, `framework-docs-researcher`

**Workflow**: `lint`, `pr-comment-resolver`

## License

[MIT](./LICENSE)
