# Zapier Value Calculator

Enterprise ROI estimation platform powered by the UVS (Unified Value System) taxonomy. Calculates business value across 5 dimensions and 16 archetypes with archetype-specific formulas, confidence tracking, and Zapier platform integration.

**Production:** [zapier-value.vercel.app](https://zapier-value.vercel.app)

## Quick Start

```bash
bun install
bun dev          # Dev server at localhost:3000
bun test         # Run tests
bun start        # Production build
```

## Architecture

**Stack:** Bun + React 19 + Convex (serverless DB) + Tailwind CSS 4 + shadcn/ui

- **5 Value Dimensions:** Revenue Impact, Speed/Cycle Time, Productivity, Cost Avoidance, Risk & Quality
- **16 Archetypes:** Each with dedicated input schemas and calculation formulas
- **Confidence Tiers:** Benchmarked, Estimated, Custom — per input field
- **REST API:** Served via Convex HTTP actions (see [API.md](./API.md))
- **Shareable Views:** Summary, obfuscated/anonymized, embed mode

## Key Directories

| Path | Purpose |
|------|---------|
| `src/types/` | Core types: dimensions, archetypes, roles, value items |
| `src/utils/` | Calculation engine, obfuscation, Zapier API client |
| `src/data/` | Pattern catalog and value packages by role |
| `convex/` | Database schema, mutations, queries, REST API |

## Environment Variables

- `CONVEX_DEPLOYMENT` — Convex deployment URL
- `ZAPIER_API_TOKEN` — Bearer token for Zapier API

---

**Legacy:** The V1 calculator is still available at [zapier-roi-calculator.vercel.app](https://zapier-roi-calculator.vercel.app) for existing users.
