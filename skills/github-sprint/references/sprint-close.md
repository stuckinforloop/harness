# Sprint Close

## Rules

- **Close milestone only when complete.** All issues closed or moved to next sprint.
- **Carryover workflow.** Move incomplete issues to next milestone with `carryover` label.
- **Generate sprint report.** Summary of completed work, velocity, blockers, retrospective notes.
- **"Land the Plane" protocol.** Final 20% of sprint: stop new work, focus on completion.
- **Retrospective.** Create retro issue in backlog to track learnings.
- **Archive milestone.** Close milestone after carryover complete.

## Patterns

### Identify Incomplete Work

```bash
#!/bin/bash
CURRENT_MILESTONE="Sprint 3"

echo "Incomplete issues in $CURRENT_MILESTONE:"
gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --state open \
  --json number,title,labels \
  --template '{{range .}}#{{.number}}: {{.title}}{{"\n"}}{{end}}'
```

### Carryover to Next Sprint

```bash
#!/bin/bash
CURRENT_MILESTONE="Sprint 3"
NEXT_MILESTONE="Sprint 4"

# List open issues in current sprint
OPEN_ISSUES=$(gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --state open \
  --json number \
  --jq '.[].number')

# Move to next sprint with carryover label
for issue in $OPEN_ISSUES; do
  gh issue edit $issue \
    --milestone "$NEXT_MILESTONE" \
    --add-label "carryover"

  gh issue comment $issue --body "Carried over from $CURRENT_MILESTONE"
done

echo "Moved $(echo $OPEN_ISSUES | wc -w) issues to $NEXT_MILESTONE"
```

### Generate Sprint Report

```bash
#!/bin/bash
MILESTONE="Sprint 3"

# Closed issues
CLOSED=$(gh issue list \
  --milestone "$MILESTONE" \
  --state closed \
  --json number,title,closedAt,labels \
  --jq 'length')

# Completed story points
COMPLETED_SP=$(gh issue list \
  --milestone "$MILESTONE" \
  --state closed \
  --json title \
  --jq '[.[] | .title | scan("\\[SP:([0-9]+)\\]") | .[0] | tonumber] | add // 0')

# Carried over
CARRYOVER=$(gh issue list \
  --milestone "$MILESTONE" \
  --state open \
  --json number \
  --jq 'length')

# Blockers encountered
BLOCKED=$(gh issue list \
  --milestone "$MILESTONE" \
  --label "status:blocked" \
  --state all \
  --json number \
  --jq 'length')

cat <<EOF
# Sprint Report: $MILESTONE

## Summary
- **Completed**: $CLOSED issues
- **Velocity**: $COMPLETED_SP story points
- **Carried over**: $CARRYOVER issues
- **Blockers encountered**: $BLOCKED

## Completed Work
$(gh issue list \
  --milestone "$MILESTONE" \
  --state closed \
  --json number,title \
  --template '{{range .}}- #{{.number}}: {{.title}}{{"\n"}}{{end}}')

## Carried Over
$(gh issue list \
  --milestone "$MILESTONE" \
  --state open \
  --json number,title \
  --template '{{range .}}- #{{.number}}: {{.title}}{{"\n"}}{{end}}')

## Blockers
$(gh issue list \
  --milestone "$MILESTONE" \
  --label "status:blocked" \
  --state all \
  --json number,title \
  --template '{{range .}}- #{{.number}}: {{.title}}{{"\n"}}{{end}}')

## Retrospective
See #$(gh issue create \
  --title "Retrospective: $MILESTONE" \
  --label "type:spike" \
  --body "Retrospective notes for $MILESTONE" \
  --json number \
  --jq .number)
EOF
```

### Close Milestone

```bash
#!/bin/bash
MILESTONE_TITLE="Sprint 3"

# Verify no open issues
OPEN_COUNT=$(gh issue list \
  --milestone "$MILESTONE_TITLE" \
  --state open \
  --json number \
  --jq 'length')

if [ "$OPEN_COUNT" -gt 0 ]; then
  echo "Cannot close milestone: $OPEN_COUNT open issues remain"
  exit 1
fi

# Close via API (gh milestone edit not in all versions)
MILESTONE_NUMBER=$(gh api repos/{owner}/{repo}/milestones \
  --jq ".[] | select(.title == \"$MILESTONE_TITLE\") | .number")

gh api repos/{owner}/{repo}/milestones/$MILESTONE_NUMBER \
  -X PATCH \
  -f state="closed"

echo "✓ Milestone $MILESTONE_TITLE closed"
```

### Land the Plane Protocol

```bash
#!/bin/bash
# Run in final 20% of sprint (e.g., last 2 days of 2-week sprint)
CURRENT_MILESTONE="Sprint 3"

echo "🛬 Land the Plane: Focus on completion"
echo

# Show all open work
echo "Open issues (must close or carry over):"
gh issue list \
  --milestone "$CURRENT_MILESTONE" \
  --state open \
  --json number,title,labels,assignees \
  --template '{{range .}}#{{.number}}: {{.title}} [@{{range .assignees}}{{.login}}{{end}}]{{"\n"}}{{end}}'

echo
echo "Action items:"
echo "1. Close in-review issues: merge PRs"
echo "2. Move blockers to next sprint"
echo "3. Finish in-progress work or mark for carryover"
echo "4. Stop starting, start finishing"
```

### Create Next Milestone

```bash
#!/bin/bash
# Create next sprint milestone
NEXT_SPRINT="Sprint 4"
START_DATE="2026-02-24"
DUE_DATE="2026-03-10"

gh api repos/{owner}/{repo}/milestones \
  -f title="$NEXT_SPRINT" \
  -f state="open" \
  -f description="Sprint 4: Feature X and bug fixes" \
  -f due_on="${DUE_DATE}T23:59:59Z"

echo "✓ Created $NEXT_SPRINT (due $DUE_DATE)"
```

## Checklist

- [ ] All open issues in milestone reviewed
- [ ] Incomplete work moved to next milestone with `carryover` label
- [ ] Sprint report generated with velocity and blockers
- [ ] Retrospective issue created
- [ ] Milestone closed (no open issues)
- [ ] Next sprint milestone created
- [ ] "Land the Plane" protocol followed in final 20% of sprint
