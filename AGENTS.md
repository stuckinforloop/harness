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
