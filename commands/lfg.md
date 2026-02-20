---
name: lfg
description: Full compound engineering pipeline. Plan -> Work -> Review -> Compound.
arguments:
  - name: feature
    description: Description of the feature to build
    required: true
---

# LFG -- Full Compound Engineering Pipeline

You are executing the full compound engineering loop: Plan -> Work -> Review -> Compound.

Feature: `$ARGUMENTS`

## Pipeline

### Phase 1: Plan

Run `/workflows:plan $ARGUMENTS`

This will:
- Refine the idea with the user
- Run parallel research agents (codebase + learnings)
- Conditionally run external research (best practices + docs)
- Create an OpenSpec change with proposal, specs, design, tasks

**Gate**: Confirm with the user before proceeding to Work. Show them the plan summary and ask if they want to adjust anything.

### Phase 2: Work

Run `/workflows:work`

This will:
- Execute OpenSpec tasks with Go quality gates
- Run continuous linting
- Create a PR

**Gate**: Confirm the PR was created successfully before proceeding to Review.

### Phase 3: Review

Run `/workflows:review latest`

This will:
- Run 6 parallel Go review agents
- Synthesize findings into a prioritized review
- Provide an overall verdict

**Gate**: If the verdict is REQUEST CHANGES:
1. Fix the critical and warning findings
2. Re-run `/workflows:review latest`
3. Repeat until the verdict is APPROVE or COMMENT

### Phase 4: Compound

Run `/workflows:compound`

This will:
- Document learnings in `docs/solutions/`
- Verify implementation matches specs
- Archive the OpenSpec change into the living specification

## Completion

When all four phases are complete, print a summary:

```
## LFG Complete: [Feature Name]

### Pipeline Results
- Plan: OpenSpec change created at openspec/changes/<name>/
- Work: PR #<number> created
- Review: <verdict> (X critical, Y warning, Z info)
- Compound: <N> learnings documented, specs archived

### Artifacts Created
- OpenSpec change: openspec/changes/<name>/
- PR: <URL>
- Solution docs: docs/solutions/<files>
- Spec updates: openspec/specs/<files>

### What Compounded
- <N> new spec entries in openspec/specs/
- <N> solution documents in docs/solutions/
- These will inform future /workflows:plan research
```
