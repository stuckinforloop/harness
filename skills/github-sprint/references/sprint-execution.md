# Sprint Execution

## Rules

- **`ready` shows actionable work.** Issues in current milestone, no `status:blocked`, unassigned or assigned to self.
- **Update status labels.** Move from `ready` → `in-progress` → `in-review` → closed.
- **Check dependencies daily.** Unblock issues by removing `status:blocked` when blockers close.
- **Assign work.** Self-assign with `gh issue edit --add-assignee @me`.
- **Track on board.** Project board reflects current state via labels and milestone.
- **Blockers are visible.** Issues with `status:blocked` label appear in `status` query.

## Patterns

### Ready Command -- Show Actionable Work

```bash
#!/bin/bash
# Get current milestone
CURRENT_MILESTONE=$(gh api repos/{owner}/{repo}/milestones \
  --jq '.[] | select(.state == "open") | select(.due_on != null) | .title' \
  | head -n1)

if [ -z "$CURRENT_MILESTONE" ]; then
  echo "No active milestone found"
  exit 1
fi

echo "Ready work for $CURRENT_MILESTONE:"
echo

# Show unblocked, unassigned issues
gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --state open \
  --json number,title,labels,assignees \
  --jq '.[] |
    select([.labels[].name] | inside(["status:blocked"]) | not) |
    select(.assignees | length == 0) |
    "\(.number): \(.title)"'
```

### Ready Command -- Include Assigned to Self

```bash
# Show work ready for current user
CURRENT_USER=$(gh api user --jq .login)

gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --state open \
  --json number,title,labels,assignees \
  --jq --arg user "$CURRENT_USER" '.[] |
    select([.labels[].name] | inside(["status:blocked"]) | not) |
    select(.assignees | length == 0 or (.assignees[].login == $user)) |
    "\(.number): \(.title)"'
```

### Start Work on Issue

```bash
# Assign to self and update status
ISSUE=45

gh issue edit $ISSUE \
  --add-assignee @me \
  --remove-label "status:ready" \
  --add-label "status:in-progress"

# Optional: add comment
gh issue comment $ISSUE --body "Starting work on this"
```

### Move to Review

```bash
# Update status when PR is ready
ISSUE=45
PR=123

gh issue edit $ISSUE \
  --remove-label "status:in-progress" \
  --add-label "status:in-review"

# Link PR to issue
gh issue comment $ISSUE --body "PR: #$PR"
```

### Close Issue

```bash
# Close when work is complete
ISSUE=45

gh issue close $ISSUE --comment "Completed in PR #123"
```

### Check Dependency Status

```bash
#!/bin/bash
# Parse "Blocked by: #X, #Y" from issue body and check if blockers are closed
ISSUE=45

BLOCKERS=$(gh issue view $ISSUE --json body --jq '.body' \
  | grep -o 'Blocked by: #[0-9, ]*' \
  | grep -o '#[0-9]*' \
  | tr -d '#')

if [ -z "$BLOCKERS" ]; then
  echo "No blockers for #$ISSUE"
  exit 0
fi

ALL_CLOSED=true
for blocker in $BLOCKERS; do
  STATE=$(gh issue view $blocker --json state --jq .state)
  if [ "$STATE" != "CLOSED" ]; then
    echo "#$blocker still open"
    ALL_CLOSED=false
  fi
done

if [ "$ALL_CLOSED" = true ]; then
  echo "All blockers resolved! Removing blocked label from #$ISSUE"
  gh issue edit $ISSUE --remove-label "status:blocked" --add-label "status:ready"
fi
```

### Daily Standup Report

```bash
#!/bin/bash
CURRENT_MILESTONE=$(gh api repos/{owner}/{repo}/milestones \
  --jq '.[] | select(.state == "open") | .title' | head -n1)

echo "Sprint Status: $CURRENT_MILESTONE"
echo

echo "In Progress:"
gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --label "status:in-progress" \
  --json number,title,assignees \
  --template '{{range .}}#{{.number}}: {{.title}} (@{{range .assignees}}{{.login}}{{end}}){{"\n"}}{{end}}'

echo
echo "Blocked:"
gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --label "status:blocked" \
  --json number,title \
  --template '{{range .}}#{{.number}}: {{.title}}{{"\n"}}{{end}}'

echo
echo "Ready to Start:"
gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --label "status:ready" \
  --json number,title \
  --template '{{range .}}#{{.number}}: {{.title}}{{"\n"}}{{end}}' \
  | head -n5
```

## Checklist

- [ ] `ready` command shows only unblocked issues in current milestone
- [ ] Issues move through status labels: ready → in-progress → in-review → closed
- [ ] Blocked issues have `status:blocked` label
- [ ] Dependencies checked daily and `status:blocked` removed when blockers close
- [ ] Work items assigned to team members via `--add-assignee`
- [ ] Project board updated automatically via label changes
- [ ] Daily standup report generated from issue states
