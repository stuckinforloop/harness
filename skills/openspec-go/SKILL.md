---
name: openspec-go
description: >
  Go-specific conventions for writing OpenSpec specifications. Defines how to
  write requirements, scenarios, and design docs for Go services, with patterns
  for concurrency, error handling, and API design.
---

# OpenSpec Go Conventions

## Core Principles

- **Specs mirror Go's design philosophy.** Requirements should be concrete, testable, and minimal -- like Go APIs.
- **Scenarios cover Go-specific concerns.** Concurrency, error propagation, context cancellation, and graceful shutdown are first-class spec topics.
- **Component names match Go packages.** Use the actual package path as the component identifier in specs.

## Reference Index

This skill has no separate reference files. All conventions are in this document because they're concise enough to fit.

## Requirement Patterns

### API Endpoint Spec

When specifying a Go HTTP endpoint:

```markdown
### REQ-API-001: Create User Endpoint

**Component**: `internal/api/handler`
**Method**: `POST /api/v1/users`

**Input validation**:
- Request body MUST be valid JSON
- `email` field MUST be a valid email format
- `name` field MUST be non-empty, max 255 characters

**Success response** (201):
- MUST return the created user with `id` field
- MUST set `Content-Type: application/json`

**Error responses**:
- 400: Invalid input (validation failure)
- 409: Email already exists
- 500: Internal server error (MUST NOT expose internal details)

**Context handling**:
- MUST respect `context.Context` cancellation
- MUST return 503 if context is cancelled before completion
```

### Concurrency Spec

When specifying concurrent behavior:

```markdown
### REQ-CONC-001: Worker Pool

**Component**: `internal/worker`

**Lifecycle**:
- Pool MUST accept a `context.Context` for cancellation
- Each worker MUST check `ctx.Done()` in its processing loop
- `Pool.Stop()` MUST wait for all workers to finish (WaitGroup)
- Workers MUST NOT be spawned without a corresponding wait

**Bounds**:
- Pool size MUST be configurable (default: `runtime.NumCPU()`)
- Task queue MUST have bounded capacity
- MUST NOT spawn unbounded goroutines

**Error handling**:
- Worker errors MUST be collected, not swallowed
- A single worker panic MUST NOT crash the pool
```

### Error Handling Spec

When specifying error behavior:

```markdown
### REQ-ERR-001: Error Propagation

**Component**: `internal/service`

**Wrapping**:
- All errors from dependencies MUST be wrapped with `fmt.Errorf("<op>: %w", err)`
- Error messages MUST be lowercase
- Error messages MUST NOT start with "failed to"

**Sentinel errors**:
- `ErrNotFound` for missing resources
- `ErrAlreadyExists` for duplicate resources
- `ErrUnauthorized` for auth failures

**Handle-once rule**:
- Each error MUST be handled exactly once (log OR return)
- Handlers at the top of the call stack log; everything else wraps and returns
```

## Scenario Patterns

### Graceful Shutdown Scenario

```markdown
#### SCENARIO: Graceful Shutdown

**Given** the service is running with active connections
**When** SIGTERM is received
**Then**:
1. Stop accepting new connections
2. Wait for active requests to complete (with timeout)
3. Close database connections
4. Exit with code 0

**Timeout behavior**:
- If active requests don't complete within 30s, force shutdown
- Log any requests that were interrupted
```

### Context Cancellation Scenario

```markdown
#### SCENARIO: Client Disconnects Mid-Request

**Given** a long-running request is in progress
**When** the client disconnects (context cancelled)
**Then**:
1. Database queries in progress MUST be cancelled
2. Goroutines spawned for this request MUST stop
3. No partial writes to the database
4. Request logged as "cancelled" not "error"
```

## Design Doc Conventions

When writing design.md for Go services:

- **Package structure**: Show the directory layout with `internal/` usage
- **Dependency direction**: Diagram showing which packages depend on which
- **Interface boundaries**: Define interfaces at the consumer, document them in design
- **Error strategy**: State the error wrapping chain from handler to repository
- **Concurrency model**: Document goroutine lifecycle, who owns cancellation

## When to Apply

Apply when:
- Writing OpenSpec specs for a Go service or library
- Creating requirements for Go APIs, workers, or concurrent components
- Designing Go packages with specs that will drive implementation

Do NOT apply when:
- Writing specs for non-Go systems
- Writing generic product requirements (use vanilla OpenSpec)

## Quick Reference

**Components**: Use Go package paths (`internal/api/handler`, `pkg/worker`)
**Requirements**: Include input validation, response codes, context handling, error behavior
**Concurrency**: Always spec lifecycle (start, stop, cancel), bounds, and error collection
**Errors**: Spec wrapping chain, sentinel errors, and handle-once rule
**Scenarios**: Cover graceful shutdown, context cancellation, and error propagation
