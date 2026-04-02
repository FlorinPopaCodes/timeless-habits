# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun test              # run all tests
bun test --filter "taskCounter"  # run a single test by name
bun run dev           # local dev server (wrangler dev)
bun run deploy        # deploy to Cloudflare Workers
bun run lint          # biome check
bun run lint:fix      # biome check --write
bun run typecheck     # tsc --noEmit
```

## Tooling

- **Runtime**: Cloudflare Workers (Hono framework)
- **Dev/Test**: Bun (not Node.js). Use `bun` for running, testing, installing.
- **Lint/Format**: Biome (not ESLint/Prettier)
- **Todoist SDK**: `@doist/todoist-api-typescript` — typed REST API v1 wrapper
- **Types**: auto-generated `worker-configuration.d.ts` via `wrangler types` (runs on postinstall)

## Architecture

Cloudflare Worker that listens for Todoist webhooks and applies rewrite rules to task content.

**`src/index.ts`** — Generic webhook dispatcher. Verifies HMAC signature, parses payload, looks up `EventConfig` from the rules registry, applies rules, then either duplicates the task or updates it in place. Contains zero domain logic.

**`src/rules.ts`** — All domain logic. Defines the `RewriteRule` type (`(content: string) => string`), individual rule functions, guards, and the `eventHandlers` registry that maps Todoist event types to their config (rules array, action type, optional guard).

**`src/todoist.ts`** — Thin wrappers around the Todoist SDK: `duplicateTask` (creates a copy preserving placement) and `updateTaskContent`. Handles snake_case webhook payload → camelCase SDK mapping. Uses `requestId` for idempotency.

### Adding a new rewrite rule

1. Write a `(content: string) => string` function in `rules.ts`. It **must be idempotent** (applying twice = same result) — this is how webhook loop prevention works for `"update"` actions.
2. Add it to the relevant event arrays in `eventHandlers`.
3. Add tests in `rules.test.ts`.

### Event flow

```
Todoist webhook → HMAC verify → eventHandlers[event_name]
  → guard check → applyRules(content, rules)
  → action: "duplicate" → duplicateTask (item:completed)
  → action: "update"    → updateTaskContent if content changed (loop prevention)
```

### Secrets (set via `wrangler secret put`)

- `TODOIST_CLIENT_SECRET` — HMAC signature verification
- `TODOIST_CLIENT_ID` — OAuth (declared in wrangler.jsonc)
- `TODOIST_ACCESS_TOKEN` — Todoist API calls
