# Sprint Planning

## Rules

- **Use ticket templates.** All issues follow format from `ticket-templates.md`.
- **Assign to milestone.** Every sprint item must have milestone set.
- **Set priority labels.** Every issue needs one priority label (critical/high/medium/low).
- **Set type labels.** Every issue needs one type label (story/task/bug/spike/epic).
- **Declare dependencies.** Use `Blocked by: #X` and `Blocks: #Y` in description.
- **Story point estimation.** Add `[SP:X]` to title or use Story Points project field.
- **Backlog is milestone-less.** Issues without milestone are in product backlog.

## Patterns

### Create Story with Template

```bash
# Read template from ticket-templates.md, fill in details
TITLE="Implement user profile page [SP:5]"
BODY=$(cat <<'EOF'
Users need a profile page to view and edit their account details. Currently no UI exists for profile management. This story implements the frontend page with form validation and API integration.

**Acceptance Criteria**:
- [ ] Profile page displays user name, email, avatar
- [ ] Edit mode allows updating name and email
- [ ] Form validation prevents invalid email formats
- [ ] Save button calls PUT /api/user/:id endpoint
- [ ] Success message shown on save

**Dependencies**:
Blocked by: #42 (User API endpoint)
Blocks: #58 (Avatar upload feature)
EOF
)

gh issue create \
  --title "$TITLE" \
  --body "$BODY" \
  --label "type:story,priority:high,status:ready" \
  --milestone "Sprint 3" \
  --assignee "alice"
```

### Batch Create Issues

```bash
#!/bin/bash
# issues.csv format: title,type,priority,sp,description,blockedBy,milestone

while IFS=, read -r title type priority sp description blockedBy milestone; do
  FULL_TITLE="$title [SP:$sp]"
  BODY="$description"

  if [ -n "$blockedBy" ]; then
    BODY="$BODY\n\n**Dependencies**:\nBlocked by: $blockedBy"
    STATUS="status:blocked"
  else
    STATUS="status:ready"
  fi

  gh issue create \
    --title "$FULL_TITLE" \
    --body "$BODY" \
    --label "type:$type,priority:$priority,$STATUS" \
    --milestone "$milestone"
done < issues.csv
```

### Assign Backlog Items to Sprint

```bash
# List backlog items (no milestone)
gh issue list \
  --state open \
  --json number,title,labels \
  --jq '.[] | select(.milestone == null) | "\(.number): \(.title)"'

# Assign to current sprint
CURRENT_MILESTONE="Sprint 3"

# Interactive: show candidate issues
gh issue list \
  --label "status:ready" \
  --json number,title \
  --template '{{range .}}{{.number}}: {{.title}}{{"\n"}}{{end}}'

# Batch assign
for issue in 45 46 47; do
  gh issue edit $issue --milestone "$CURRENT_MILESTONE"
done
```

### Set Story Points via Project Field

```bash
# Get project ID and field ID
PROJECT_ID=$(gh project list --format json | jq -r '.projects[] | select(.title == "Sprint Board") | .number')

# Add issue to project
gh project item-add $PROJECT_ID --owner @me --url "https://github.com/owner/repo/issues/45"

# Set story points (requires GraphQL)
# Note: gh project item-edit doesn't support custom fields yet
# Use API directly for now
```

### Priority Triage

```bash
# List unprioritized issues
gh issue list \
  --state open \
  --json number,title,labels \
  --jq '.[] | select([.labels[].name] | inside(["priority:critical", "priority:high", "priority:medium", "priority:low"]) | not) | "\(.number): \(.title)"'

# Bulk add priority
gh issue edit 45 --add-label "priority:high"
gh issue edit 46 --add-label "priority:medium"
```

## Checklist

- [ ] All sprint issues follow ticket template format
- [ ] Every issue has milestone assigned
- [ ] Every issue has priority label (critical/high/medium/low)
- [ ] Every issue has type label (story/task/bug/spike/epic)
- [ ] Dependencies declared in issue body with `Blocked by:` / `Blocks:`
- [ ] Blocked issues have `status:blocked` label
- [ ] Story points in title `[SP:X]` or project field
- [ ] Sprint capacity matches team velocity
- [ ] Backlog items (no milestone) exist for future planning
