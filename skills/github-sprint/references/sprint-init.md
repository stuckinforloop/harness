# Sprint Initialization

## Rules

- **Bootstrap once per repository.** Run `init` on first sprint setup only.
- **Create standard labels.** Priority, type, status, role, carryover labels with consistent colors.
- **Project board required.** Create Projects V2 board with Board layout for sprint visualization.
- **First milestone.** Create "Sprint 1" milestone with start/end dates.
- **Custom fields.** Add Story Points (number), Iteration (text) fields to project.
- **Idempotent operations.** Skip if labels/project already exist. Never error on duplicates.

## Patterns

### Label Creation

```bash
#!/bin/bash
# Create priority labels
gh label create "priority:critical" --color "B60205" --description "Must fix immediately" --force
gh label create "priority:high" --color "D93F0B" --description "Important for sprint" --force
gh label create "priority:medium" --color "FBCA04" --description "Should do this sprint" --force
gh label create "priority:low" --color "0E8A16" --description "Nice to have" --force

# Create type labels
gh label create "type:story" --color "1D76DB" --description "User story" --force
gh label create "type:task" --color "BFDADC" --description "Technical task" --force
gh label create "type:bug" --color "E99695" --description "Bug fix" --force
gh label create "type:spike" --color "D4C5F9" --description "Research spike" --force
gh label create "type:epic" --color "6F42C1" --description "Epic container" --force

# Create status labels
gh label create "status:blocked" --color "B60205" --description "Cannot proceed" --force
gh label create "status:ready" --color "0E8A16" --description "Ready to start" --force
gh label create "status:in-progress" --color "FBCA04" --description "Active work" --force
gh label create "status:in-review" --color "1D76DB" --description "Under review" --force

# Create management labels
gh label create "carryover" --color "CCCCCC" --description "Moved from previous sprint" --force

# Create agent assignment labels
gh label create "agents:solo" --color "0E8A16" --description "1 agent - independent work" --force
gh label create "agents:pair" --color "FBCA04" --description "2 agents - collaboration" --force
gh label create "agents:swarm" --color "B60205" --description "3 agents - all hands" --force
```

### Project Board Creation

```bash
# Create project
PROJECT_ID=$(gh project create \
  --title "Sprint Board" \
  --format json | jq -r '.id')

# Get project node ID for GraphQL
PROJECT_NODE_ID=$(gh api graphql -f query='
  query($owner: String!, $number: Int!) {
    repository(owner: $owner, name: $number) {
      projectV2(number: $number) {
        id
      }
    }
  }
' -f owner="$(gh repo view --json owner -q .owner.login)" \
  -F number="$PROJECT_ID" \
  --jq '.data.repository.projectV2.id')

# Add Story Points field
gh api graphql -f query='
  mutation($projectId: ID!, $name: String!) {
    createProjectV2Field(input: {
      projectId: $projectId
      dataType: NUMBER
      name: $name
    }) {
      projectV2Field {
        id
      }
    }
  }
' -f projectId="$PROJECT_NODE_ID" -f name="Story Points"

# Add Iteration field
gh api graphql -f query='
  mutation($projectId: ID!, $name: String!) {
    createProjectV2Field(input: {
      projectId: $projectId
      dataType: TEXT
      name: $name
    }) {
      projectV2Field {
        id
      }
    }
  }
' -f projectId="$PROJECT_NODE_ID" -f name="Iteration"
```

### Milestone Creation

```bash
# Create first milestone via API (gh milestone create not in all versions)
MILESTONE_TITLE="Sprint 1"
START_DATE="2026-02-10"
DUE_DATE="2026-02-24"

gh api repos/{owner}/{repo}/milestones \
  -f title="$MILESTONE_TITLE" \
  -f state="open" \
  -f description="First sprint: foundation work" \
  -f due_on="${DUE_DATE}T23:59:59Z"
```

### Complete Init Script

```bash
#!/bin/bash
set -e

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Initializing GitHub Sprint workflow for $REPO"

# 1. Create labels
echo "Creating labels..."
gh label create "priority:critical" --color "B60205" --force 2>/dev/null || true
gh label create "priority:high" --color "D93F0B" --force 2>/dev/null || true
gh label create "priority:medium" --color "FBCA04" --force 2>/dev/null || true
gh label create "priority:low" --color "0E8A16" --force 2>/dev/null || true
gh label create "type:story" --color "1D76DB" --force 2>/dev/null || true
gh label create "type:task" --color "BFDADC" --force 2>/dev/null || true
gh label create "type:bug" --color "E99695" --force 2>/dev/null || true
gh label create "type:spike" --color "D4C5F9" --force 2>/dev/null || true
gh label create "type:epic" --color "6F42C1" --force 2>/dev/null || true
gh label create "status:blocked" --color "B60205" --force 2>/dev/null || true
gh label create "status:ready" --color "0E8A16" --force 2>/dev/null || true
gh label create "status:in-progress" --color "FBCA04" --force 2>/dev/null || true
gh label create "status:in-review" --color "1D76DB" --force 2>/dev/null || true
gh label create "carryover" --color "CCCCCC" --force 2>/dev/null || true
gh label create "agents:solo" --color "0E8A16" --force 2>/dev/null || true
gh label create "agents:pair" --color "FBCA04" --force 2>/dev/null || true
gh label create "agents:swarm" --color "B60205" --force 2>/dev/null || true

# 2. Create project board (skip if exists)
if ! gh project list --format json | jq -e '.projects[] | select(.title == "Sprint Board")' >/dev/null 2>&1; then
  echo "Creating Sprint Board project..."
  gh project create --title "Sprint Board"
fi

# 3. Create first milestone (3 days for AI sprints)
if ! gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title == "Sprint 1")' >/dev/null 2>&1; then
  echo "Creating Sprint 1 milestone (3-day AI sprint)..."
  gh api repos/{owner}/{repo}/milestones \
    -f title="Sprint 1" \
    -f state="open" \
    -f description="AI Sprint 1 - 3 days (14 human-day equivalent)" \
    -f due_on="$(date -v+3d -u +%Y-%m-%dT23:59:59Z)"
fi

echo "✓ Initialization complete"
```

## Checklist

- [ ] All priority labels created (critical, high, medium, low)
- [ ] All type labels created (story, task, bug, spike, epic)
- [ ] All status labels created (blocked, ready, in-progress, in-review)
- [ ] Management labels created (carryover)
- [ ] Agent assignment labels created (agents:solo, agents:pair, agents:swarm)
- [ ] Sprint Board project exists
- [ ] Story Points field added to project
- [ ] Iteration field added to project
- [ ] Sprint 1 milestone created with 3-day due date (AI sprint)
- [ ] Init script is idempotent (safe to re-run)
