---
name: github-sprint
description: AI Scrum Master skill translating Beads philosophy (AI-native task tracking, dependency graphs, multi-phase sprints) to GitHub native features (Issues, Projects V2, Milestones, Labels) using gh CLI.
---

# GitHub Sprint Master

## Core Principles

- **Issues are work items.** GitHub Issues replace Beads. Use sub-issues for epic.task.subtask hierarchy.
- **Dependencies drive workflow.** `blocked:` / `blocks:` labels + issue references create dependency graph. `ready` shows unblocked work.
- **AI-native sprints.** 14 human-days → 3 AI-days. Milestones fixed at 3 days. Epics scoped to demo deliverables.
- **3-agent parallelization.** Tasks assigned as solo (1 agent), pair (2 agents), or swarm (3 agents) based on dependencies.
- **Demo-driven breakdown.** Critical path to demo first. Day 1: parallel work. Day 2: integration. Day 3: demo prep.
- **Labels encode metadata.** Priority, type, status, agent assignment (`agents:solo`, `agents:pair`, `agents:swarm`).

## Reference Index

| Reference | Topics |
|-----------|--------|
| [sprint-init](references/sprint-init.md) | Bootstrap workflow, label creation, project setup, milestone creation |
| [sprint-planning](references/sprint-planning.md) | Creating issues, milestone assignment, priorities, story points, backlog |
| [sprint-execution](references/sprint-execution.md) | `ready` command, status updates, board movement, dependencies, blockers |
| [sprint-close](references/sprint-close.md) | Milestone close, carryover workflow, sprint reports, "Land the Plane" |
| [github-cli-patterns](references/github-cli-patterns.md) | Batch operations, JSON output, milestone CRUD, project fields, ID lookups |
| [ticket-templates](references/ticket-templates.md) | Standard issue formats, dependency declaration, acceptance criteria |
| [ai-sprint-planning](references/ai-sprint-planning.md) | 3-day AI sprints, dependency analysis, agent assignments, parallel work |
| [demo-driven-breakdown](references/demo-driven-breakdown.md) | Demo-first epics, critical path, vertical slices, Day 3 integration |

## Subcommands

| Subcommand | Action |
|-----------|--------|
| `init` | Bootstrap repo: create labels, project board, first milestone (3 days) |
| `plan` | Sprint planning: create/assign issues to current milestone, set priorities |
| `decompose` | Break down epic into 3-day sprint with agent assignments and demo goal |
| `ready` | Show unblocked, actionable work for current sprint |
| `status` | Sprint dashboard: milestone progress, board state, blocked items, agent utilization |
| `close` | Close current sprint: move incomplete items, close milestone, generate report |
| `create` | Create a new issue with proper labels and milestone assignment |
| `next` | Create next sprint milestone (3 days) and project iteration |
| `backlog` | Show/manage product backlog (unassigned to any sprint) |

## When to Apply

Apply when:
- Initializing GitHub-based sprint workflow on a repository
- Planning or managing sprints using GitHub Issues and Projects
- Creating work items with standardized templates and dependencies
- Generating sprint reports and tracking velocity

Do NOT apply when:
- Working in repositories without GitHub integration
- Managing ad-hoc issues outside sprint context
- Using other project management tools (Jira, Linear, etc.)

## Quick Reference

**Init**: `gh label create` for priorities/types/status/agents → `gh project create` → `gh api` milestone (3 days).

**Decompose**: Define demo goal → analyze dependencies → assign Day 1 (parallel), Day 2 (integration), Day 3 (demo) → label `agents:solo/pair/swarm`.

**Create**: Use ticket template → add `[Day X]` to title → assign labels → link dependencies → milestone.

**Ready**: Filter by milestone, no `status:blocked`, group by agent assignment (solo/pair/swarm).

**Status**: Milestone progress → agent utilization → blockers → critical path to demo.

**Close**: Move incomplete with `carryover` → close milestone → velocity report → create next 3-day sprint.

**Dependencies**: `Blocked by: #X` in body → analyze for parallelization → suggest agent assignments.
