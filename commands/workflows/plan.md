---
name: workflows:plan
description: Research the codebase, gather best practices, and create an OpenSpec change with proposal, specs, design, and tasks.
arguments:
  - name: feature
    description: Description of the feature to plan
    required: true
---

# Plan Phase

You are executing the Plan phase of the compound engineering workflow. This phase does deep research BEFORE creating any plan artifacts. Research is ~80% of planning.

## Input

Feature description: `$ARGUMENTS`

## Phase 0: Idea Refinement

Before starting research, have a brief conversation with the user:

1. Use `AskUserQuestion` to clarify:
   - What problem does this solve?
   - Are there constraints or preferences?
   - What's the risk level? (security, payments, external APIs = high risk)
   - How familiar are you with this area of the codebase?

2. Assess:
   - **Topic risk**: High (security, payments, external APIs), Medium (new feature, refactor), Low (fix, improvement)
   - **User familiarity**: High (knows exactly what they want), Medium (general idea), Low (exploring)
   - **Uncertainty**: High (novel problem), Medium (done before differently), Low (straightforward)

## Phase 1: Parallel Local Research (always runs)

Launch two research agents in parallel:

1. **Task** `repo-research-analyst` with the feature description
   - Searches codebase for existing patterns
   - Reads CLAUDE.md, AGENTS.md, go.mod
   - Analyzes package structure
   - Identifies conventions

2. **Task** `learnings-researcher` with the feature description
   - Searches `docs/solutions/` for past issues
   - Surfaces known gotchas related to the feature's packages/patterns

Wait for both to complete and collect their findings.

## Phase 1.5: Research Decision

Based on Phase 0 signals + Phase 1 findings, decide if external research is needed:

**Run external research if ANY of these are true:**
- Topic risk is HIGH (security, payments, external APIs)
- User familiarity is LOW
- Uncertainty is HIGH
- Local research found no relevant patterns or learnings
- Feature involves unfamiliar Go packages or libraries

**Skip external research if ALL of these are true:**
- Codebase has strong existing patterns for this type of work
- User knows exactly what they want
- Feature is straightforward extension of existing code

## Phase 1.5b: External Research (conditional, parallel)

If external research is triggered, launch two more research agents in parallel:

3. **Task** `best-practices-researcher` with the feature description
   - Web search for Go best practices and pitfalls for this feature type

4. **Task** `framework-docs-researcher` with the feature description and relevant packages
   - Go stdlib and library documentation research

Wait for both to complete.

## Phase 2: Consolidate Research

Merge all research findings into a structured summary:

```markdown
## Research Summary: [Feature Name]

### Codebase Context
<From repo-research-analyst: relevant files, conventions, package structure>

### Institutional Learnings
<From learnings-researcher: past issues, gotchas, prevention rules>

### Best Practices (if researched)
<From best-practices-researcher: patterns, pitfalls, recommendations>

### Documentation (if researched)
<From framework-docs-researcher: API contracts, usage patterns>

### Go-Specific Considerations
- Concurrency impact: <does this feature need goroutines?>
- API surface: <what gets exported?>
- Error strategy: <what error types/wrapping?>
- Testing approach: <table-driven, mocks, integration?>
```

## Phase 3: Create OpenSpec Change

With the research summary as context:

1. **Create the change directory**: Run `Skill opsx new <change-name>` where `<change-name>` is derived from the feature description (kebab-case, concise).

2. **Fast-forward artifacts**: Run `Skill opsx ff` to generate proposal, specs, design, and tasks. Provide the research summary as context so that:
   - The **proposal** includes research findings in "Context" and "References" sections
   - The **design** includes architecture decisions informed by codebase patterns
   - The **specs** include requirements informed by best practices
   - The **tasks** reference specific files discovered during research

3. **Offer GitHub integration**: Ask the user if they want to create a GitHub issue for this feature using the `github-sprint` skill.

## Output

When complete, print:
- Summary of research findings (key points only)
- Path to the OpenSpec change directory
- List of generated artifacts
- Suggested next step: `/workflows:work`
