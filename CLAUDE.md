# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zapier ROI Calculator - A real-time ROI estimation tool for customer calls. Allows adding use cases, tracking metrics like average salary and estimated revenue impact.

## Commands

```bash
# Development
bun dev              # Start dev server with HMR (localhost:3000)
bun start            # Production server

# Testing
bun test             # Run unit tests
bun test <file>      # Run single test file
bun test --watch     # Watch mode
bunx playwright test # Run E2E tests
bunx playwright test --ui # Playwright UI mode

# Type checking
bunx tsc --noEmit    # Type check without emitting
```

## Development Workflow

1. **Test-Driven Development**: Write failing tests before implementing features
2. **After code changes**: Run `bunx tsc --noEmit` and `bun test`
3. **After major UI changes**: Run `bunx playwright test`
4. Always use TypeScript

## Architecture

**Stack**: Bun + React 19 + Tailwind CSS 4 + shadcn/ui (new-york style)

**Server** (`src/index.ts`): Uses `Bun.serve()` with route-based API handling. HTML imports auto-bundle frontend.

**Frontend** (`src/frontend.tsx` → `src/App.tsx`): React SPA entry point. Uses HMR in development.

**UI Components** (`src/components/ui/`): shadcn components using Radix primitives. Add new components via `bunx shadcn@latest add <component>`.

**Utilities** (`src/lib/utils.ts`): `cn()` helper for Tailwind class merging.

**Path alias**: `@/*` maps to `./src/*`

## Bun-Specific Guidelines

- Use `bun` instead of `node`, `npm`, `yarn`, `pnpm`
- Bun auto-loads `.env` files (no dotenv needed)
- Use `Bun.serve()` for server (not Express)
- Use `Bun.file()` for file operations
- HTML files can directly import `.tsx` files

## Testing

Unit tests use `bun:test`:
```ts
import { test, expect } from "bun:test";
```

E2E tests use Playwright. Place in `tests/` or `e2e/` directory.

## Storage

If persistence is needed, use Convex.
