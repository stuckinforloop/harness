---
name: workflows:compound
description: Document learnings from the completed work, verify specs, and archive the OpenSpec change.
---

# Compound Phase

You are executing the Compound phase of the compound engineering workflow. This phase captures institutional knowledge and archives the spec change. This is what makes the engineering "compound" -- every completed feature enriches the knowledge base for future work.

## Step 1: Identify What Was Done

Read the current OpenSpec change:
- `openspec/changes/*/proposal.md` -- what was planned
- `openspec/changes/*/design.md` -- how it was designed
- `openspec/changes/*/tasks.md` -- what tasks were executed

Also look at the recent git history to understand what code was written:
```bash
git log --oneline -20
git diff main...HEAD --stat
```

## Step 2: Document Learnings

For each significant problem that was solved during the work phase, create a solution document using the `compound-docs` skill.

Ask the user:
1. Were there any bugs, gotchas, or surprises during implementation?
2. Were there any design decisions that required research or trade-off analysis?
3. Were there any performance or concurrency issues discovered?

For each identified learning:

1. Create a solution file in `docs/solutions/<problem-type>/<slug>.md`
2. Follow the `compound-docs` skill's 7-step process
3. Use the YAML schema from `skills/compound-docs/schema.yaml`

If the user reports no significant learnings, check the git diff for:
- Error handling patterns introduced (document if novel)
- Concurrency patterns introduced (document if non-trivial)
- Interface designs (document if they establish a new pattern)
- Performance optimizations (document if significant)

## Step 3: Verify Specs

Run OpenSpec verification to ensure the implementation matches the specs:

```
Skill opsx verify
```

This checks that:
- All tasks in tasks.md are completed
- The implementation satisfies the requirements in specs/
- The design decisions in design.md were followed

If verification fails, report the gaps and ask the user how to proceed:
- Fix the implementation to match specs
- Update the specs to match implementation
- Skip verification (document why)

## Step 4: Archive the Change

Once verified (or verification skipped with reason), archive the OpenSpec change:

```
Skill opsx archive
```

This:
- Merges delta specs from `openspec/changes/<change>/specs/` into the main `openspec/specs/`
- Moves the change to `openspec/changes/archive/`
- Updates the living specification

## Step 5: Summary

Print:
- Learnings documented (list of solution files created)
- Verification status (passed / gaps found)
- Archive status (archived / skipped)
- Impact: How many spec entries were added/modified
- Suggested next step: Start next feature with `/workflows:plan` or run `/lfg`
