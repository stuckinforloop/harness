---
name: ast-grep
description: Guide for using ast-grep to write structural code assertions in EVAL.ts files. Use when writing Layer 2 pattern checks that need AST-awareness — context scoping (inside/outside a function), structural matching (interface method counts, struct field presence), or comment/string immunity. Prefer over regex when checks need structural precision.
---

# ast-grep — Eval Assertions

## Core Principles

- **AST patterns match structure, not text.** Immune to comments, strings, and formatting variations. A pattern like `panic($$$)` only matches real `panic` calls, never a comment mentioning panic.
- **Two CLI modes.** Use `sg run --pattern '...' --lang go --json` for simple pattern matches. Use `sg scan --inline-rules '...' --json` for relational/composite rules (inside, has, not).
- **Always use `stopBy: end`.** Required for `has` and `inside` rules — without it, matching stops at the first nesting level.
- **Prefer ast-grep for structural checks, keep regex for trivial text presence.** If the check needs context-awareness (inside/outside a function), structural precision (counting methods, finding fields), or comment/string immunity, use ast-grep. For simple `code.includes('someText')`, regex is fine.

## Reference Index

| Reference | Topics |
|-----------|--------|
| [eval-integration](references/eval-integration.md) | Calling ast-grep from EVAL.ts, parsing JSON output, helper functions |
| [pattern-syntax](references/pattern-syntax.md) | Metavariables (`$VAR`, `$$$`, `$_`), equality constraints, Go examples |
| [rule-syntax](references/rule-syntax.md) | YAML rules: `kind`, `has`, `inside`, `not`, `all`, `any`, `stopBy` |
| [go-eval-patterns](references/go-eval-patterns.md) | Ready-to-use Go patterns replacing common regex checks in evals |

## When to Apply

Apply when writing EVAL.ts Layer 2 checks that need:
- Context-awareness (match X only inside/outside function Y)
- Structural precision (count interface methods, find struct fields)
- Comment/string immunity (don't match pattern mentions in comments)

Do NOT apply to:
- Layer 1 checks (`go build`, `go vet`) — those are deterministic tools
- Layer 3 checks (LLM rubric scoring) — those use semantic judgment
- Trivial text presence checks where regex suffices

## Quick Reference

**Metavariables**: `$VAR` = single node, `$$$` = zero or more, `$_` = wildcard. Must be `UPPER_SNAKE_CASE`. Same `$VAR` in a pattern = equality constraint.

**Simple match**: `sg run -p 'panic($$$)' --lang go --json` — returns JSON array of matches.

**Relational rule**: `sg scan --inline-rules '...' --json` — YAML with `kind`, `has`, `inside`, `not`, `all`, `any`.

**Key rule fields**: `kind` (tree-sitter node type), `has` (descendant match), `inside` (ancestor match), `pattern` (code pattern), `regex` (text regex on node). Always pair `has`/`inside` with `stopBy: end`.

**Discover node kinds**: `sg run --debug-query=ast -p '$_' --lang go path/to/file.go` — prints the AST with node kinds.
