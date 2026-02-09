# Ticket Templates

## Rules

- **Standard format for all issues.** Use consistent title, description, acceptance criteria, and dependency structure.
- **Title: imperative verb + object.** "Add user authentication", "Fix login timeout bug", "Refactor API client".
- **Description: 2-3 sentence context.** Why this work exists, what problem it solves, high-level approach.
- **Acceptance criteria: bullet list.** Concrete, testable outcomes. Use `- [ ]` checkboxes.
- **Dependencies: explicit references.** List blocking issues via `Blocked by: #123, #456` and blocked issues via `Blocks: #789`.
- **Metadata: labels only.** Priority, type, status via labels. No custom fields in description.
- **Story points in title.** Append `[SP:X]` to title for estimation (optional).

## Patterns

### Story Template -- Good

```markdown
**Title**: Implement user profile page [SP:5]

**Labels**: type:story, priority:high, status:ready

**Description**:
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

**Assignee**: @alice
**Milestone**: Sprint 3
```

### Bug Template -- Good

```markdown
**Title**: Fix API timeout on large file uploads

**Labels**: type:bug, priority:critical, status:blocked

**Description**:
File uploads over 10MB consistently timeout after 30s. Error logs show "context deadline exceeded" from the upload handler. Root cause is missing timeout configuration on the reverse proxy.

**Steps to Reproduce**:
1. Upload file >10MB via /api/upload endpoint
2. Observe timeout after ~30s
3. Check nginx error logs

**Expected**: Upload succeeds or returns proper error after 5min timeout
**Actual**: Request fails with 504 Gateway Timeout after 30s

**Dependencies**:
Blocked by: #67 (nginx config review)
```

### Epic Template -- Good

```markdown
**Title**: User Authentication System [SP:21]

**Labels**: type:epic, priority:high

**Description**:
Implement end-to-end user authentication with JWT tokens, password reset, and OAuth providers. Replaces existing session-based auth. See architecture doc at docs/auth-rfc.md.

**Sub-Issues**:
- #101 Design auth database schema
- #102 Implement JWT token service
- #103 Add password reset flow
- #104 Integrate Google OAuth
- #105 Migrate existing users

**Acceptance Criteria**:
- [ ] All sub-issues closed
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Migration script tested in staging

**Milestone**: Phase 2
```

### Task Template -- Good

```markdown
**Title**: Add database indexes for user queries

**Labels**: type:task, priority:medium, status:ready

**Description**:
Slow query analysis shows missing indexes on users table for email and created_at columns. Add composite index to improve lookup performance.

**Acceptance Criteria**:
- [ ] CREATE INDEX on (email, created_at)
- [ ] Query time < 10ms for email lookups
- [ ] Migration script added
- [ ] Performance test validates improvement

**Assignee**: @bob
**Milestone**: Sprint 2
```

### Spike Template -- Good

```markdown
**Title**: Research GraphQL migration strategy [SP:3]

**Labels**: type:spike, priority:low

**Description**:
Investigate feasibility of migrating REST API to GraphQL. Evaluate libraries, breaking changes, client migration path, and performance implications.

**Research Questions**:
- [ ] Which Go GraphQL library best fits our needs?
- [ ] Can we run REST and GraphQL in parallel?
- [ ] What's the migration timeline estimate?
- [ ] Are there performance regressions?

**Deliverable**: Write-up in docs/graphql-spike.md with recommendation

**Milestone**: Sprint 4
```

## Dependency Declaration Format

### Blocked By

```markdown
**Dependencies**:
Blocked by: #42 (API endpoint must exist first)
Blocked by: #67, #68 (Infrastructure setup)
```

- Issue cannot start until blocking issues close
- Add `status:blocked` label
- Remove label when blockers resolve

### Blocks

```markdown
**Dependencies**:
Blocks: #58 (Avatar upload depends on this)
Blocks: #72, #73 (Downstream features)
```

- Other issues wait on this one
- Add `blocks:` label (optional, for visibility)
- Referenced issues should have `Blocked by: #X` entry

### Bidirectional Links

```markdown
**Issue #42**: User API endpoint
Blocks: #45 (Profile page)

**Issue #45**: Profile page
Blocked by: #42 (User API endpoint)
```

- Always create bidirectional references
- Maintains dependency graph integrity
- Enables automated `ready` query

## Checklist

- [ ] Title uses imperative verb + object format
- [ ] Description provides 2-3 sentence context
- [ ] Acceptance criteria use `- [ ]` checkboxes
- [ ] Dependencies explicitly declared with issue numbers
- [ ] Bidirectional links present (Blocked by ↔ Blocks)
- [ ] Labels applied: type, priority, status
- [ ] Milestone assigned if part of sprint
- [ ] Assignee set if work started
- [ ] Story points in title if estimating
