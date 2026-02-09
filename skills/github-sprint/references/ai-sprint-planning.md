# AI Sprint Planning

## Rules

- **Epic scope is fixed.** Every epic represents 14 human-days of work (conventional 2-week sprint).
- **AI sprint duration is fixed.** AI agents complete the same work in 3 days (5x human velocity).
- **Dependency graph drives parallelization.** Analyze `Blocked by:` relationships to identify parallel work streams.
- **3-agent team optimization.** Assign tasks as: solo (1 agent), pair (2 agents), swarm (3 agents).
- **Demo-driven ordering.** Critical path tasks that enable demo go first. Nice-to-have features last.
- **Day 3 is integration day.** Final day reserved for integration, testing, and demo preparation.

## Agent Assignment Strategies

### Solo Work (1 Agent)
- Independent tasks with no dependencies
- Clear acceptance criteria
- Can be completed in isolation
- Examples: Database schema, API client, unit tests

### Pair Programming (2 Agents)
- Complex tasks requiring collaboration
- Tasks with multiple concerns (frontend + backend)
- High-risk changes needing review
- Examples: Login flow, payment integration, security features

### Swarm (3 Agents - All Hands)
- Critical blockers affecting entire epic
- Integration work requiring full context
- Demo preparation and testing
- Examples: End-to-end tests, deployment, demo script

## Patterns

### Epic Decomposition Template

```markdown
**Epic**: User Authentication System [14 human-days]
**AI Sprint**: 3 days (Sprint X)
**Demo Goal**: Working login with Google OAuth and password reset

**Dependency Graph**:
```
Day 1 (Parallel):
├─ #101: Auth DB schema [SOLO - Agent 1] [2h]
├─ #102: JWT token service [SOLO - Agent 2] [3h]
└─ #103: Google OAuth client [SOLO - Agent 3] [2h]

Day 2 (Mixed):
├─ #104: Login UI + API [PAIR - Agent 1+2] [4h]
│   Blocked by: #101, #102
├─ #105: Password reset flow [SOLO - Agent 3] [3h]
│   Blocked by: #102
└─ #106: User profile page [SOLO - Agent 1] [2h]
    Blocked by: #104

Day 3 (Integration):
└─ #107: Integration tests + demo [SWARM - All] [3h]
    Blocked by: #104, #105, #106
```

**Demo Deliverable**: User can sign up, log in via Google, reset password, view profile.
```

### Dependency Analysis Script

```bash
#!/bin/bash
# Analyze epic dependencies and suggest agent assignments

EPIC_NUMBER=$1

# Get all sub-issues
SUB_ISSUES=$(gh issue view $EPIC_NUMBER --json body --jq '.body' \
  | grep -o '#[0-9]*' \
  | tr -d '#')

echo "Dependency Analysis for Epic #$EPIC_NUMBER"
echo "==========================================="
echo

# Find tasks with no dependencies (Day 1 candidates)
echo "Day 1 - Parallel Work (No Blockers):"
for issue in $SUB_ISSUES; do
  BODY=$(gh issue view $issue --json body --jq '.body')
  if ! echo "$BODY" | grep -q "Blocked by:"; then
    TITLE=$(gh issue view $issue --json title --jq '.title')
    echo "  #$issue: $TITLE [SOLO]"
  fi
done

echo
echo "Day 2 - Dependent Work:"
# Tasks blocked by Day 1 work
for issue in $SUB_ISSUES; do
  BODY=$(gh issue view $issue --json body --jq '.body')
  if echo "$BODY" | grep -q "Blocked by:"; then
    BLOCKERS=$(echo "$BODY" | grep -o 'Blocked by: #[0-9, ]*' | grep -o '#[0-9]*' | tr -d '#')
    TITLE=$(gh issue view $issue --json title --jq '.title')

    # Suggest PAIR if multiple blockers (complex integration)
    BLOCKER_COUNT=$(echo $BLOCKERS | wc -w)
    if [ $BLOCKER_COUNT -gt 1 ]; then
      echo "  #$issue: $TITLE [PAIR - complex] (blocked by: $BLOCKERS)"
    else
      echo "  #$issue: $TITLE [SOLO] (blocked by: $BLOCKERS)"
    fi
  fi
done

echo
echo "Day 3 - Integration:"
# Find integration/test tasks (usually block nothing, blocked by many)
for issue in $SUB_ISSUES; do
  TITLE=$(gh issue view $issue --json title --jq '.title')
  if echo "$TITLE" | grep -qiE '(integration|test|demo|e2e|end-to-end)'; then
    echo "  #$issue: $TITLE [SWARM - all agents]"
  fi
done
```

### Agent Assignment Labels

```bash
# Create agent assignment labels
gh label create "agents:solo" --color "0E8A16" --description "1 agent - independent work" --force
gh label create "agents:pair" --color "FBCA04" --description "2 agents - collaboration" --force
gh label create "agents:swarm" --color "B60205" --description "3 agents - all hands" --force

# Assign based on complexity
gh issue edit 101 --add-label "agents:solo"
gh issue edit 104 --add-label "agents:pair"
gh issue edit 107 --add-label "agents:swarm"
```

### Demo-Driven Task Ordering

```markdown
**Epic**: E-commerce Checkout [14 human-days → 3 AI-days]

**Demo Goal**: User can add items to cart and complete purchase

**Critical Path (Must-Have for Demo)**:
1. #201: Product catalog API [Day 1, SOLO]
2. #202: Shopping cart service [Day 1, SOLO]
3. #203: Checkout UI [Day 2, PAIR] (blocks: #201, #202)
4. #204: Payment integration [Day 2, PAIR] (blocks: #202)
5. #205: Order confirmation [Day 2, SOLO] (blocks: #204)
6. #206: E2E checkout test [Day 3, SWARM] (blocks: all)

**Nice-to-Have (Post-Demo)**:
- #207: Discount codes [Backlog]
- #208: Email receipts [Backlog]
- #209: Order history [Backlog]

**Task Assignment**:
- Day 1: Agent 1 → #201, Agent 2 → #202, Agent 3 → Setup/infra
- Day 2: Agent 1+2 → #203, Agent 2+3 → #204, Agent 1 → #205
- Day 3: All agents → #206 (integration + demo prep)
```

### 3-Day Milestone Creation

```bash
#!/bin/bash
# Create 3-day AI sprint milestone

SPRINT_NUMBER=$1
START_DATE=$(date -u +%Y-%m-%d)
DUE_DATE=$(date -v+3d -u +%Y-%m-%dT23:59:59Z)

gh api repos/{owner}/{repo}/milestones \
  -f title="Sprint $SPRINT_NUMBER" \
  -f state="open" \
  -f description="AI Sprint $SPRINT_NUMBER - 3 days (14 human-day equivalent)" \
  -f due_on="$DUE_DATE"

echo "✓ Created Sprint $SPRINT_NUMBER: $START_DATE to $(date -v+3d -u +%Y-%m-%d)"
```

### Parallel Work Visualization

```bash
#!/bin/bash
# Visualize parallel work capacity by day

MILESTONE="Sprint 5"

echo "Day 1 - Parallel Capacity:"
gh issue list \
  --milestone "$MILESTONE" \
  --label "agents:solo" \
  --json number,title \
  --jq '.[] | select(.title | contains("[Day 1]")) | "  Agent: #\(.number) - \(.title)"'

echo
echo "Day 2 - Mixed Work:"
gh issue list \
  --milestone "$MILESTONE" \
  --json number,title,labels \
  --jq '.[] | select(.title | contains("[Day 2]")) |
    "  \(if [.labels[].name] | inside(["agents:pair"]) then "PAIR" else "SOLO" end): #\(.number) - \(.title)"'

echo
echo "Day 3 - Integration:"
gh issue list \
  --milestone "$MILESTONE" \
  --label "agents:swarm" \
  --json number,title \
  --template '  SWARM: {{range .}}#{{.number}} - {{.title}}{{"\n"}}{{end}}'
```

### Epic Creation with Decomposition

```bash
#!/bin/bash
# Create epic and auto-decompose into AI sprint structure

EPIC_TITLE="$1"
DEMO_GOAL="$2"
SPRINT_NUMBER="$3"

# Create epic issue
EPIC_NUMBER=$(gh issue create \
  --title "$EPIC_TITLE [14 human-days]" \
  --label "type:epic" \
  --body "**Demo Goal**: $DEMO_GOAL

**AI Sprint Duration**: 3 days
**Sprint**: $SPRINT_NUMBER

## Sub-Issues
<!-- Will be populated with tasks -->

## Demo Deliverable
$DEMO_GOAL
" \
  --json number \
  --jq .number)

echo "✓ Created Epic #$EPIC_NUMBER"
echo
echo "Next steps:"
echo "1. Break down into tasks (Day 1 parallel, Day 2 dependent, Day 3 integration)"
echo "2. Add 'Blocked by:' dependencies"
echo "3. Label tasks: agents:solo, agents:pair, or agents:swarm"
echo "4. Assign to Sprint $SPRINT_NUMBER milestone"
echo
echo "Example task structure:"
echo "  gh issue create --title 'Task name [Day 1]' --body 'Blocks: #$EPIC_NUMBER' --label 'type:task,agents:solo'"
```

## Checklist

- [ ] Epic scoped to 14 human-days
- [ ] AI sprint milestone set to 3 days
- [ ] Dependency graph analyzed for parallel work
- [ ] Day 1 tasks have no blockers (parallel execution)
- [ ] Day 2 tasks depend on Day 1 completion
- [ ] Day 3 reserved for integration and demo prep
- [ ] Agent assignments labeled: solo/pair/swarm
- [ ] Solo tasks assigned to independent agents
- [ ] Pair tasks assigned to 2-agent teams
- [ ] Swarm tasks (integration/demo) assigned to all 3 agents
- [ ] Critical path to demo identified
- [ ] Nice-to-have features moved to backlog
- [ ] Demo deliverable clearly defined in epic
