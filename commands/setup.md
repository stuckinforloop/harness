---
name: setup
description: Configure compound engineering for the current Go project. Detects Go, configures review agents, and initializes OpenSpec.
---

# Compound Engineering Setup

You are configuring the compound engineering workflow for this Go project.

## Step 1: Detect Go Project

Check for `go.mod` in the current directory.

- If `go.mod` exists, read it to extract the module name and Go version.
- If `go.mod` does not exist, tell the user this plugin requires a Go project and stop.

## Step 2: Configure Review Agents

Create or update `compound-engineering.local.md` in the project root with YAML frontmatter:

```yaml
---
review_agents:
  - concurrency-sentinel
  - error-handling-auditor
  - interface-auditor
  - security-sentinel
  - performance-oracle
  - architecture-strategist
go_module: "<module from go.mod>"
go_version: "<version from go.mod>"
---
```

Below the frontmatter, add a markdown section:

```markdown
# Compound Engineering Config

## Review Agents

All six review agents are enabled by default. Comment out any you want to skip.

## Project Context

- Module: <module>
- Go version: <version>
```

## Step 3: Initialize OpenSpec

Check if `openspec/` directory exists.

- If it does NOT exist, run: `Skill openspec init`
- If it already exists, skip this step and inform the user.

## Step 4: Configure OpenSpec for Go

If `openspec/config.yaml` does not exist, create it with:

```yaml
project:
  name: "<module name from go.mod>"
  tech_stack: ["Go"]
  test_command: "go test ./..."
  lint_command: "golangci-lint run ./..."
  build_command: "go build ./..."

conventions:
  language: Go
  error_handling: "handle-once, wrap with fmt.Errorf"
  concurrency: "every goroutine needs stop signal + wait"
  interfaces: "1-3 methods, consumer-side, compile-time check"
  packages: "lowercase, singular, internal/ for non-public"

artifacts:
  proposal: true
  specs: true
  design: true
  tasks: true
```

## Step 5: Create docs/solutions Directory

Create `docs/solutions/` if it doesn't exist. This is where compound learning documents will be stored.

## Step 6: Summary

Print a summary of what was configured:
- Go module and version detected
- Review agents configured
- OpenSpec initialized (or already present)
- Solution docs directory ready
- Next step: run `/workflows:plan "feature description"` to start planning
