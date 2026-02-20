---
name: workflows:work
description: Execute OpenSpec tasks with Go quality gates, run linting, and create a PR.
---

# Work Phase

You are executing the Work phase of the compound engineering workflow. This phase wraps OpenSpec's task execution with Go-specific quality gates.

## Step 1: Load Current Change

Read the current OpenSpec change context:
- `openspec/changes/*/tasks.md` -- find the active change and its tasks
- `openspec/changes/*/design.md` -- understand the architecture decisions
- `compound-engineering.local.md` -- load project configuration

If no active change exists, tell the user to run `/workflows:plan` first.

## Step 2: Execute Tasks with Quality Gates

For each task in the OpenSpec tasks file:

1. **Execute the task**: Run `Skill opsx apply` to let OpenSpec handle the task execution.

2. **After each task, run Go quality gates:**

   **Concurrency check**: If the task introduced a goroutine:
   - Does it have a stop signal (context cancellation or done channel)?
   - Does something wait for it to finish (WaitGroup or channel)?
   - Is `wg.Add` called before `go`?

   **Export check**: If the task added an exported symbol:
   - Should it live in `internal/` instead?
   - Is the zero value safe?
   - Is the API surface minimal?

   **Error handling check**: If the task handles errors:
   - Is the handle-once rule followed (log OR return, not both)?
   - Are errors wrapped with `%w`?
   - Are error messages lowercase?

   **Interface check**: If the task defines an interface:
   - Is it 1-3 methods?
   - Is it defined at the consumer?
   - Is there a `var _ I = (*T)(nil)` check?

3. **Fix any quality gate failures** before moving to the next task.

## Step 3: Continuous Quality Checks

After all tasks are complete, run the lint agent:

**Task** `lint` -- runs `go test`, `go vet`, `golangci-lint`

If the lint agent reports failures:
- Fix the issues
- Re-run the lint agent
- Repeat until clean

## Step 4: Create Pull Request

Once all tasks pass quality gates and linting:

1. **Create a branch** (if not already on one):
   ```
   git checkout -b feat/<change-name>
   ```

2. **Stage and commit** with conventional commit format:
   ```
   feat(<scope>): <description>
   ```

3. **Create PR** using `gh pr create`:
   - Title: conventional commit message
   - Body: summary of changes, link to OpenSpec change directory, quality gate results
   - Labels: add relevant labels

## Step 5: Summary

Print:
- Tasks completed
- Quality gate results (all passed / issues fixed)
- Lint report summary
- PR URL
- Suggested next step: `/workflows:review`
