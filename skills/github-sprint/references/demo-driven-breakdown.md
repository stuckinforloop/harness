# Demo-Driven Breakdown

## Rules

- **Every epic must produce a demo.** Define demo deliverable before creating tasks.
- **Critical path first.** Tasks required for demo go into the sprint. Nice-to-haves go to backlog.
- **Integration on Day 3.** Reserve final day for making components work together.
- **Demo = working software.** Not slides, not mockups. Functional feature users can interact with.
- **Vertical slices over horizontal layers.** Complete one user flow end-to-end before adding features.
- **Acceptance criteria = demo script.** Each task's AC should contribute to final demo.

## Patterns

### Define Demo Goal First

```markdown
**Epic**: User Authentication System

**Demo Goal**:
Show a user signing up with email, logging in with Google OAuth, resetting their password, and viewing their profile page.

**Demo Script**:
1. Navigate to /signup
2. Create account with email/password
3. Log out
4. Click "Sign in with Google" → redirects to Google → back to app (logged in)
5. Log out
6. Click "Forgot password" → receive email → reset password → log in
7. View profile page with user info

**Must-Have Tasks (for demo)**:
- Signup form + API
- Login form + API
- Google OAuth integration
- Password reset flow
- Profile page
- Integration tests

**Nice-to-Have (backlog)**:
- Email verification
- 2FA
- Social login (Twitter, GitHub)
- Account deletion
```

### Vertical Slice Decomposition

```markdown
**Epic**: E-commerce Checkout [14 human-days → 3 AI-days]

**Demo Goal**: User completes a purchase end-to-end

**Vertical Slice** (Critical Path):
```
[User Journey: Browse → Add to Cart → Checkout → Confirm]

Day 1 (Parallel Foundation):
├─ #301: Product catalog API [SOLO]
│   AC: GET /products returns list with price
├─ #302: Cart service API [SOLO]
│   AC: POST /cart/items adds product, GET /cart returns items
└─ #303: Payment service stub [SOLO]
    AC: POST /payment/process returns success/failure

Day 2 (Integration):
├─ #304: Product list UI [PAIR]
│   AC: Display products, "Add to Cart" button works
│   Blocked by: #301, #302
├─ #305: Cart UI + checkout flow [PAIR]
│   AC: Show cart items, total, "Checkout" starts payment
│   Blocked by: #302
└─ #306: Payment UI [SOLO]
    AC: Enter card info, submit, show confirmation
    Blocked by: #303, #305

Day 3 (Demo Ready):
└─ #307: E2E test + demo data [SWARM]
    AC: Script runs full purchase flow, demo DB seeded
    Blocked by: #304, #305, #306
```

**Horizontal Layers** (Deferred to Backlog):
- Admin dashboard
- Analytics tracking
- Discount codes
- Inventory management
```

### Critical Path Identification

```bash
#!/bin/bash
# Identify critical path for demo

EPIC=$1

echo "Critical Path Analysis for Epic #$EPIC"
echo "======================================="

# Get demo goal from epic body
DEMO_GOAL=$(gh issue view $EPIC --json body --jq '.body' \
  | grep -A5 "Demo Goal:" \
  | tail -n+2 \
  | head -n1)

echo "Demo Goal: $DEMO_GOAL"
echo

# Find all sub-issues
SUB_ISSUES=$(gh issue view $EPIC --json body --jq '.body' \
  | grep -o '#[0-9]*' \
  | tr -d '#' \
  | sort -u)

echo "Task Classification:"
echo

# Critical = directly enables demo
echo "CRITICAL (include in sprint):"
for issue in $SUB_ISSUES; do
  TITLE=$(gh issue view $issue --json title --jq '.title')
  LABELS=$(gh issue view $issue --json labels --jq '.labels[].name' | tr '\n' ',')

  # Critical if labeled priority:high/critical OR mentioned in demo script
  if echo "$LABELS" | grep -qE '(priority:critical|priority:high)'; then
    echo "  ✓ #$issue: $TITLE"
  fi
done

echo
echo "NICE-TO-HAVE (move to backlog):"
for issue in $SUB_ISSUES; do
  TITLE=$(gh issue view $issue --json title --jq '.title')
  LABELS=$(gh issue view $issue --json labels --jq '.labels[].name' | tr '\n' ',')

  if echo "$LABELS" | grep -qE '(priority:medium|priority:low)'; then
    echo "  ○ #$issue: $TITLE [BACKLOG]"
  fi
done
```

### Demo-First Task Template

```markdown
**Title**: Checkout payment flow [Day 2]

**Labels**: type:story, priority:high, agents:pair

**Description**:
User needs to complete payment during checkout. This task implements the UI and API integration for credit card processing. Required for demo: user can enter card details and see confirmation.

**Acceptance Criteria** (= Demo Script Steps):
- [ ] User clicks "Checkout" from cart page
- [ ] Payment form displays (card number, expiry, CVV fields)
- [ ] Form validation prevents invalid card formats
- [ ] "Pay Now" button calls POST /payment/process
- [ ] Success: Show order confirmation with order ID
- [ ] Failure: Show error message, allow retry

**Demo Value**: Completes critical user journey from browse to purchase

**Dependencies**:
Blocked by: #302 (Cart API), #303 (Payment service)
Blocks: #307 (E2E test)

**Assignee**: Agent 1 + Agent 2 (pair)
**Milestone**: Sprint 5
```

### Day 3 Integration Checklist

```markdown
**Title**: E2E checkout integration and demo prep [Day 3]

**Labels**: type:task, priority:critical, agents:swarm

**Description**:
Final integration day: connect all components, run end-to-end tests, prepare demo environment and script. All 3 agents collaborate to ensure demo is smooth.

**Acceptance Criteria**:
- [ ] All services running locally via docker-compose
- [ ] Database seeded with demo products
- [ ] E2E test script passes: browse → add to cart → checkout → confirm
- [ ] Demo script documented in demo/SCRIPT.md
- [ ] Screenshots/recording of working flow
- [ ] Known issues documented (if any)

**Integration Tasks**:
- [ ] Agent 1: Setup demo environment + data seeding
- [ ] Agent 2: Run E2E tests, fix integration bugs
- [ ] Agent 3: Document demo script, record walkthrough

**Dependencies**:
Blocked by: #304 (Product UI), #305 (Cart UI), #306 (Payment UI)

**Assignee**: All agents (swarm)
**Milestone**: Sprint 5
```

### Backlog Deferral Pattern

```bash
#!/bin/bash
# Move nice-to-have tasks to backlog

EPIC=$1
MILESTONE=$2

# Get sub-issues from epic
SUB_ISSUES=$(gh issue view $EPIC --json body --jq '.body' \
  | grep -o '#[0-9]*' \
  | tr -d '#')

echo "Reviewing Epic #$EPIC tasks for backlog deferral"

for issue in $SUB_ISSUES; do
  LABELS=$(gh issue view $issue --json labels --jq '.labels[].name' | tr '\n' ',')
  TITLE=$(gh issue view $issue --json title --jq '.title')

  # Defer if priority:low or priority:medium AND not blocking anything
  if echo "$LABELS" | grep -qE '(priority:low|priority:medium)'; then
    BLOCKS=$(gh issue view $issue --json body --jq '.body' | grep -c "Blocks:")

    if [ $BLOCKS -eq 0 ]; then
      echo "  → Moving #$issue to backlog: $TITLE"
      gh issue edit $issue --remove-milestone --add-label "backlog"
      gh issue comment $issue --body "Deferred to backlog - not required for Sprint $MILESTONE demo"
    fi
  fi
done
```

## Checklist

- [ ] Demo goal defined before task creation
- [ ] Demo script lists concrete user actions
- [ ] Each task's acceptance criteria maps to demo steps
- [ ] Critical path identified (tasks required for demo)
- [ ] Nice-to-have features moved to backlog
- [ ] Vertical slice complete (end-to-end user flow)
- [ ] Day 3 reserved for integration and demo prep
- [ ] Demo deliverable is working software, not slides
- [ ] Integration task assigned to all agents (swarm)
- [ ] Demo script documented and tested
