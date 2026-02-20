# Harness

A collection of agent skills for Go/Backend development.

## Repository Layout

- `skills/` — Installable skills (each has `SKILL.md` + `references/`)
- `agents/` — Custom subagent definitions
- `hooks/` — Claude Code hooks
- `commands/` — Custom slash commands
- `evals/` — Evaluation test cases

## Skill Structure

Every skill is a directory under `skills/` containing:

- `SKILL.md` — Entry point with YAML frontmatter (`name`, `description`)
- `references/` — One markdown file per concept, named `category-topic.md`
  - Follow the template at [`templates/reference.md`](templates/reference.md): Rules → Patterns (Bad/Good) → Checklist

## Writing Guidelines

- Write for agents, not humans. Be concise.
- Exclude content LLMs already know well.
- Focus on practical patterns, working code, and gotchas.
- One concept per reference file.

## Skill Index

### go-write

Patterns and conventions for writing Go code. Key rules:

- **API design**: Exported symbols are permanent. Signatures are fixed. Interfaces are immutable. Use param objects (>3 args) and result objects (>2 returns). `context.Context` first arg; `error` last return.
- **Errors**: Handle once (log OR return). Wrap with `fmt.Errorf("op: %w", err)`. Lowercase, no "failed to", `%q` for strings. Sentinel (`ErrX`) for identity, structured (`XError`) for data, opaque `%w` for propagation.
- **Interfaces**: Keep 1-3 methods. Verify `var _ I = (*T)(nil)`. Define at consumer. No `*Interface`. Upcast for optional capabilities. Driver pattern: minimal interface + rich wrapper.
- **Concurrency**: Mutex unexported above guarded fields. Channels 0 or 1. Every goroutine: stop signal + wait. Context for cancellation. Worker pools: channel + context + WaitGroup.
- **Safety**: Two-value type assertions. Defer after acquire. No panic in libs. No `os.Exit` outside main. Copy slices/maps at boundaries. Struct tags for marshaling.
- **Performance**: `strconv` > `fmt.Sprint`. Pre-allocate slices/maps. `strings.Builder` for concatenation.
- **Style**: `:=` for locals. Named struct fields. Imports: stdlib → external. Early returns. ~99 char lines. Packages lowercase/singular.
- **Testing**: Table-driven `[]struct` with `t.Run`. `require` for preconditions, `assert` for checks. `goleak` for leak detection.
- **Options**: `Option` interface with unexported `apply(*options)`. `WithX` constructors. Defaults in constructor.

### go-review

Checklists and anti-patterns for reviewing Go code. Key checks:

- **API design**: Audit exports. Flag >3 params or >2 returns without structs. Check zero-value safety. Block interface modifications.
- **Errors**: Flag log-and-return. Flag missing `%w`, capitalized messages, `%s` where `%q` needed. Flag mixed strategies, `fmt.Errorf` sentinels, missing `Unwrap`, `==`/type-assertion checks.
- **Interfaces**: Flag missing `var _ I = (*T)(nil)`. Flag `*Interface`, >3 methods, provider-side definitions, embedded interfaces. Verify driver pattern.
- **Concurrency**: Flag embedded mutexes, channel size >1, fire-and-forget goroutines, goroutines in `init()`. Check `ctx.Done()` in select loops. `wg.Add` before `go`. Flag unbounded spawning.
- **Safety**: Flag bare type assertions, missing defer, panic in library, `os.Exit` outside main, uncopied boundaries, missing struct tags.
- **Performance**: Flag `fmt.Sprint`, `[]byte`→`string` in loops, missing pre-allocation, `+` concatenation in loops.
- **Style**: Flag generic package names, wrong import order, deep nesting, positional struct fields, unnecessary else.
- **Testing**: Flag non-table-driven tests, `assert` for preconditions, >10 case tables. Check `goleak`.
- **Options**: Flag exported options struct, missing defaults, mixed options + param objects.

### go-lib-design

Designing Go libraries for long-term evolution. Key rules:

- **Design process**: Work backwards from usage pseudo-code. Optimize for usability, readability, flexibility, testability. Minimize surface area — when in doubt, leave it out.
- **Surface area**: Use `internal/` for non-public code. No global state — use struct methods. Return zero values on error. Clone slices/maps at boundaries. Make outputs deterministic.
- **Dependencies**: Accept don't instantiate. Accept interfaces, return structs. Declare your own interfaces for types you don't own. Provide convenience constructors as thin wrappers.
- **Evolution**: Param objects for required fields or many options. Functional options for optional-only params. Never mix both. Result objects for growing returns. Extend interfaces via upcasting + fallback.

### github-sprint

AI Scrum Master translating Beads philosophy to GitHub native features with AI-native 3-day sprints. Key rules:

- **AI-native sprints**: 14 human-days → 3 AI-days. Fixed sprint duration. Epics always scoped to 14 human-days. Milestones fixed at 3 days.
- **3-agent parallelization**: Dependency analysis identifies parallel work. Tasks labeled `agents:solo` (1 agent), `agents:pair` (2 agents), `agents:swarm` (3 agents all-hands).
- **Demo-driven breakdown**: Every epic produces demo. Day 1: parallel foundation work. Day 2: integration. Day 3: demo prep and testing.
- **Dependencies drive assignments**: `Blocked by: #X` in body. Analyze graph for parallelization. Solo = no deps. Pair = complex integration. Swarm = final integration.
- **Ticket templates**: `[Day X]` in title. Imperative verb. Acceptance criteria = demo script steps. Labels: priority, type, status, agent assignment.
- **Workflows**: `decompose` analyzes epic and suggests 3-day breakdown with agent assignments. `ready` shows work by agent capacity. `status` tracks demo progress.

### compound-docs

Document solved Go problems as reusable solution files in `docs/solutions/`. Key rules:

- **Process**: 7 steps — identify problem, classify root cause, identify components, document bad pattern, document fix, extract rule, write solution file.
- **Schema**: YAML frontmatter with `title`, `problem_type`, `severity`, `components`, `root_cause`, `tags`. Problem types: `concurrency-bug`, `error-handling`, `interface-design`, `performance`, `api-design`, `dependency`, `testing`, `security`.
- **File path**: `docs/solutions/<problem-type>/<slug>.md`. Kebab-case slug. Body: Problem → Bad Pattern → Fix → Why → Rule → References.

### openspec-go

Go-specific conventions for writing OpenSpec specifications. Key rules:

- **Components**: Use Go package paths (`internal/api/handler`, `pkg/worker`) as component identifiers.
- **Requirements**: Include input validation, response codes, context handling, error behavior for every API spec.
- **Concurrency specs**: Always specify lifecycle (start, stop, cancel), bounds, and error collection for concurrent components.
- **Error specs**: Specify wrapping chain, sentinel errors, and handle-once rule.
- **Scenarios**: Cover graceful shutdown, context cancellation, and error propagation as first-class spec topics.
