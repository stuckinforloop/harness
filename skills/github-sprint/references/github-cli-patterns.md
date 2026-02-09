# GitHub CLI Patterns

## Rules

- **Use `--json` for scripting.** Parse output with `jq` for reliability.
- **Batch operations via loops.** Process multiple issues/PRs with `for` loops.
- **Milestone CRUD via API.** Use `gh api repos/{owner}/{repo}/milestones` for create/update/delete.
- **Project fields via GraphQL.** Custom fields require `gh api graphql`.
- **Idempotent label creation.** Use `--force` flag to skip errors on existing labels.
- **Issue search with `--search`.** Advanced queries: `milestone:X label:Y state:open`.

## Patterns

### JSON Output and jq Parsing

```bash
# Get issue numbers and titles
gh issue list \
  --json number,title \
  --jq '.[] | "\(.number): \(.title)"'

# Filter by label
gh issue list \
  --json number,title,labels \
  --jq '.[] | select(.labels[].name == "priority:high") | .number'

# Count by state
gh issue list \
  --state all \
  --json state \
  --jq 'group_by(.state) | map({state: .[0].state, count: length})'
```

### Batch Label Updates

```bash
# Add label to multiple issues
for issue in 45 46 47; do
  gh issue edit $issue --add-label "priority:high"
done

# Remove label from issues matching criteria
gh issue list \
  --label "status:blocked" \
  --json number \
  --jq '.[].number' \
| while read issue; do
  gh issue edit $issue --remove-label "status:blocked" --add-label "status:ready"
done
```

### Milestone Operations

```bash
# Create milestone
gh api repos/{owner}/{repo}/milestones \
  -f title="Sprint 5" \
  -f state="open" \
  -f description="Fifth sprint" \
  -f due_on="2026-03-24T23:59:59Z"

# Update milestone
MILESTONE_NUMBER=$(gh api repos/{owner}/{repo}/milestones \
  --jq '.[] | select(.title == "Sprint 5") | .number')

gh api repos/{owner}/{repo}/milestones/$MILESTONE_NUMBER \
  -X PATCH \
  -f due_on="2026-03-31T23:59:59Z"

# Close milestone
gh api repos/{owner}/{repo}/milestones/$MILESTONE_NUMBER \
  -X PATCH \
  -f state="closed"

# Get milestone progress
gh api repos/{owner}/{repo}/milestones/$MILESTONE_NUMBER \
  --jq '{title, open_issues, closed_issues, due_on}'
```

### Advanced Issue Search

```bash
# Issues in milestone with specific label
gh issue list \
  --search "milestone:\"Sprint 3\" label:priority:high state:open"

# Issues without milestone (backlog)
gh issue list \
  --search "no:milestone state:open"

# Issues assigned to user
gh issue list \
  --search "assignee:@me state:open"

# Issues updated in last week
gh issue list \
  --search "updated:>=$(date -v-7d -u +%Y-%m-%d)"
```

### Project Field Management (GraphQL)

```bash
# Get project node ID
PROJECT_NUMBER=1
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)

PROJECT_ID=$(gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      projectV2(number: $number) {
        id
      }
    }
  }
' -f owner="$OWNER" -f repo="$REPO" -F number=$PROJECT_NUMBER \
  --jq '.data.repository.projectV2.id')

# Create custom field
gh api graphql -f query='
  mutation($projectId: ID!, $name: String!, $dataType: ProjectV2CustomFieldType!) {
    createProjectV2Field(input: {
      projectId: $projectId
      dataType: $dataType
      name: $name
    }) {
      projectV2Field {
        id
        name
      }
    }
  }
' -f projectId="$PROJECT_ID" \
  -f name="Story Points" \
  -f dataType="NUMBER"
```

### ID Lookups

```bash
# Get issue ID from number
gh issue view 45 --json id --jq .id

# Get milestone number from title
gh api repos/{owner}/{repo}/milestones \
  --jq '.[] | select(.title == "Sprint 3") | .number'

# Get label color
gh label list --json name,color \
  --jq '.[] | select(.name == "priority:high") | .color'

# Get current user login
gh api user --jq .login
```

### Bulk Issue Creation

```bash
# From CSV: title,body,labels,milestone
while IFS=, read -r title body labels milestone; do
  gh issue create \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "$milestone"
done < issues.csv

# From JSON array
echo '[
  {"title": "Task 1", "labels": ["type:task"]},
  {"title": "Task 2", "labels": ["type:task"]}
]' | jq -r '.[] | @json' | while read item; do
  TITLE=$(echo $item | jq -r .title)
  LABELS=$(echo $item | jq -r '.labels | join(",")')
  gh issue create --title "$TITLE" --label "$LABELS"
done
```

### Issue Comment Templates

```bash
# Add standardized comment
ISSUE=45
TEMPLATE="Daily update: work in progress, ETA 2 days"

gh issue comment $ISSUE --body "$TEMPLATE"

# Bulk comment on milestone issues
gh issue list \
  --milestone "Sprint 3" \
  --state open \
  --json number \
  --jq '.[].number' \
| while read issue; do
  gh issue comment $issue --body "Sprint closing soon - please update status"
done
```

### Repository Variables for Script

```bash
# Get owner and repo for API calls
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)
REPO_FULL="$OWNER/$REPO"

# Use in API calls
gh api repos/$REPO_FULL/milestones
```

## Checklist

- [ ] Use `--json` and `jq` for scripting, not text parsing
- [ ] Batch operations use loops, not individual commands
- [ ] Milestone CRUD uses `gh api` endpoints
- [ ] Custom project fields use GraphQL mutations
- [ ] Label creation uses `--force` for idempotency
- [ ] Advanced searches use `--search` with query syntax
- [ ] ID lookups cached in variables for reuse
- [ ] Error handling with `|| true` or `2>/dev/null` for idempotent scripts
