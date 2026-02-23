# CLAUDE.md

## Project Overview

**Zapier ROI Calculator V2** — Enterprise ROI estimation platform powered by the UVS (Unified Value System) taxonomy. Calculates business value across 5 dimensions and 16 archetypes with archetype-specific formulas, confidence tracking, and Zapier platform integration.

**Production (V2)**: zapier-value.vercel.app
**Legacy (V1)**: zapier-roi-calculator.vercel.app (still live, separate Convex deployment)

## Commands

```bash
bun dev              # Dev server with HMR (localhost:3000)
bun start            # Production server
bun test             # Run unit tests (83 tests across 2 files)
bun test --watch     # Watch mode
bunx tsc --noEmit    # Type check (ignore bun-types errors)
```

## Architecture

**Stack**: Bun + React 19 + Convex (serverless DB) + Tailwind CSS 4 + shadcn/ui

### Key Files

| File | Purpose |
|------|---------|
| `src/types/roi.ts` | Core V2 types: Dimension, Archetype, ValueItem, Calculation, display metadata |
| `src/types/archetypes.ts` | 16 archetype input schemas (ARCHETYPE_FIELDS) with field definitions |
| `src/types/roles.ts` | Role types and ROLE_DEFAULT_PRIORITIES for dimension ordering |
| `src/utils/calculations.ts` | 16 archetype calculation functions + aggregation + projection |
| `src/utils/obfuscation.ts` | Anonymization utilities for shareable views |
| `src/utils/zapier-api.ts` | Zapier REST API client (Zap CRUD, run data) |
| `src/utils/zap-recommender.ts` | Maps archetypes to recommended Zap architectures |
| `convex/schema.ts` | Database schema (calculations, valueItems, useCases, zapRunCache) |
| `convex/http.ts` | REST API with self-describing schema endpoint |
| `convex/calculations.ts` | Calculation mutations/queries |
| `convex/valueItems.ts` | Value item mutations (including batch create) |
| `convex/useCases.ts` | Use case mutations with architecture support |
| `src/data/patterns/` | Pattern catalog per function (sales, IT, finance, etc.) |
| `src/data/value-packages.ts` | 10 curated value packages by role |

### UVS Taxonomy

**5 Dimensions → 16 Archetypes:**

| Dimension | Archetypes |
|-----------|-----------|
| Revenue Impact | pipeline_velocity, revenue_capture, revenue_expansion, time_to_revenue |
| Speed / Cycle Time | process_acceleration, handoff_elimination |
| Productivity | task_elimination, task_simplification, context_surfacing |
| Cost Avoidance | labor_avoidance, tool_consolidation, error_rework_elimination |
| Risk & Quality | compliance_assurance, data_integrity, incident_prevention, process_consistency |

**Confidence Tiers**: `[B]` Benchmarked (case-study data), `[E]` Estimated (industry research), `[C]` Custom (customer input)

### Value Item Structure

Each value item has:
- `archetype`: One of 16 archetypes
- `dimension`: Derived from archetype (denormalized)
- `inputs`: Archetype-specific key-value pairs, each with `{ value, confidence, source? }`
- `manualAnnualValue`: Optional override

### API Endpoints

```
GET  /api/schema                                    # Full taxonomy + input schemas
GET  /api/templates/:archetype                      # Pre-filled template
POST /api/calculations                              # Create (nested: + items + cases)
GET  /api/calculations/:shortId                     # Basic
GET  /api/calculations/:shortId/full                # Full with computed values
PUT  /api/calculations/:shortId                     # Update settings
POST /api/calculations/:shortId/value-items         # Create value item
POST /api/calculations/:shortId/value-items/batch   # Batch create
PUT  /api/calculations/:shortId/value-items/:id     # Update
DELETE /api/calculations/:shortId/value-items/:id   # Delete
POST /api/calculations/:shortId/use-cases           # Create use case
PUT  /api/calculations/:shortId/use-cases/:id       # Update (incl. architecture)
DELETE /api/calculations/:shortId/use-cases/:id     # Delete
GET  /api/calculations/:shortId/obfuscated          # Anonymized view
```

### Routes

```
/                           # Calculator listing
/c/:id                      # Editor (all tabs)
/c/:id/summary              # Read-only summary
/c/:id/share                # Shareable link
/c/:id/share/obfuscated     # Anonymized share
/c/:id/demo                 # Demo mode (anonymized)
?embed=true                 # Strips chrome for iframe embedding
?obfuscate=true             # Obfuscation mode
```

### Calculation Formulas

All 16 archetype formulas are in `src/utils/calculations.ts`. Key examples:
- **task_elimination**: `tasksPerMonth × minutesPerTask × (hourlyRate / 60) × 12`
- **pipeline_velocity**: `dealsPerQuarter × avgDealValue × conversionLift × 4`
- **labor_avoidance**: `ftesAvoided × fullyLoadedAnnualCost`

See `ARCHETYPE_FIELDS` in `src/types/archetypes.ts` for all input schemas.

## Development Workflow

1. Write failing tests → implement → verify with `bun test`
2. After code changes: `bun test` (83 tests should pass)
3. Always use TypeScript
4. Convex schema changes: `npx convex dev` auto-deploys

## Storage

Uses Convex for persistence. Schema in `convex/schema.ts`.

## Environment Variables

- `CONVEX_DEPLOYMENT` — Convex deployment URL
- `ZAPIER_API_TOKEN` — Bearer token for Zapier API (zap, zap:write scopes)
