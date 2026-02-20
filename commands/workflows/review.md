---
name: workflows:review
description: Run parallel Go review agents on the current PR or diff.
arguments:
  - name: target
    description: "PR number, branch name, or 'latest' for the most recent PR"
    required: false
---

# Review Phase

You are executing the Review phase of the compound engineering workflow. This phase runs specialized Go review agents in parallel on a PR or diff.

## Step 1: Identify Review Target

Determine what to review:

- If `$ARGUMENTS` is a PR number: use that PR
- If `$ARGUMENTS` is "latest": find the most recent PR on the current branch
- If `$ARGUMENTS` is empty: use the current branch's diff against the base branch
- If `$ARGUMENTS` is a branch name: diff that branch against main/master

Get the diff:
```bash
gh pr diff <number>
```
Or for branch comparison:
```bash
git diff main...HEAD
```

## Step 2: Load Review Configuration

Read `compound-engineering.local.md` to check which review agents are enabled. Default is all six:
- `concurrency-sentinel`
- `error-handling-auditor`
- `interface-auditor`
- `security-sentinel`
- `performance-oracle`
- `architecture-strategist`

## Step 3: Run Review Agents in Parallel

Launch all enabled review agents in parallel, passing each the diff:

1. **Task** `concurrency-sentinel` -- goroutine leaks, mutex misuse, races
2. **Task** `error-handling-auditor` -- handle-once, wrapping, naming
3. **Task** `interface-auditor` -- size, placement, compile-time checks
4. **Task** `security-sentinel` -- OWASP, injection, secrets
5. **Task** `performance-oracle` -- allocations, prealloc, hot paths
6. **Task** `architecture-strategist` -- package layout, exports, deps

Each agent receives:
- The full diff
- The feature context (from OpenSpec change if available)

Wait for all agents to complete.

## Step 4: Synthesize Reviews

Collect all findings and produce a unified review:

### Prioritized Findings

Group by severity across all agents:

**CRITICAL** (must fix before merge):
- List all critical findings from all agents

**WARNING** (should fix):
- List all warning findings from all agents

**INFO** (consider):
- List all info findings from all agents

### Review Summary Table

| Agent | Critical | Warning | Info | Status |
|-------|----------|---------|------|--------|
| Concurrency Sentinel | 0 | 1 | 0 | PASS |
| Error Handling Auditor | 0 | 0 | 2 | PASS |
| ... | ... | ... | ... | ... |

### Overall Verdict

- **APPROVE**: No critical findings, few warnings
- **REQUEST CHANGES**: Any critical findings
- **COMMENT**: No critical, several warnings worth discussing

## Step 5: Post Review (optional)

Ask the user if they want to:
1. **Post as PR comment**: Post the synthesized review as a GitHub PR comment
2. **Create tasks**: Create resolution tasks for each finding
3. **Auto-resolve**: Launch `pr-comment-resolver` to fix findings automatically
4. **Skip**: Just display the review locally

## Output

- Full synthesized review
- Verdict (APPROVE / REQUEST CHANGES / COMMENT)
- Suggested next step: fix issues and re-review, or proceed to `/workflows:compound`
