# ROI Calculator V2 — API Reference

Base URL: `https://zapier-roi-calculator.vercel.app`

## Quick Start

```bash
# 1. Get the full taxonomy (call once, cache)
curl https://zapier-roi-calculator.vercel.app/api/schema

# 2. Create a calculation with value items and use cases in one call
curl -X POST https://zapier-roi-calculator.vercel.app/api/calculations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp ROI",
    "proposedSpend": 70000,
    "valueItems": [
      {
        "archetype": "task_elimination",
        "name": "Lead data entry automation",
        "inputs": {
          "tasksPerMonth": { "value": 3000, "confidence": "benchmarked", "source": "Zapier task data" },
          "minutesPerTask": { "value": 8, "confidence": "custom" },
          "hourlyRate": { "value": 50, "confidence": "estimated" }
        }
      }
    ],
    "useCases": [
      {
        "name": "Lead Management Automation",
        "department": "RevOps",
        "status": "identified",
        "implementationEffort": "medium",
        "valueItemNames": ["Lead data entry automation"]
      }
    ]
  }'

# 3. Get full calculation with computed values
curl https://zapier-roi-calculator.vercel.app/api/calculations/abc123/full
```

## Endpoints

### GET /api/schema
Returns the complete UVS taxonomy with all 16 archetypes, their input schemas, formulas, confidence tiers, and default values. **Call once and cache.**

### GET /api/templates/:archetype
Returns a pre-filled template for a specific archetype with prompts and defaults.

### POST /api/calculations
Create a calculation with optional nested value items and use cases.

**Body:**
```json
{
  "name": "string (required)",
  "role": "executive|revops|marketing|sales_cs|it|hr|finance|engineering|support|supply_chain",
  "priorityOrder": ["dimension_id", ...],
  "currentSpend": 0,
  "proposedSpend": 70000,
  "valueItems": [{ "archetype": "...", "name": "...", "inputs": {...} }],
  "useCases": [{
    "name": "...", "status": "identified", "implementationEffort": "medium",
    "valueItemNames": ["name-of-item-above"]
  }]
}
```

### GET /api/calculations/:shortId/full
Returns calculation + all value items (with computed annual values) + use cases + summary.

**Response includes `computed` on each value item:**
```json
{
  "valueItems": [{ "archetype": "task_elimination", "inputs": {...}, "computed": { "annualValue": 240000 } }],
  "summary": {
    "totalAnnualValue": 240000,
    "dimensionTotals": [{ "dimension": "productivity", "total": 240000, "percentage": 100 }],
    "roiMultiple": 3.43,
    "hoursSavedPerMonth": 400,
    "fteEquivalent": 2.5,
    "projection": [{ "year": 1, "value": 120000, "investment": 70000, "netValue": 50000 }]
  }
}
```

### POST /api/calculations/:shortId/value-items
Create a single value item.

**Body:**
```json
{
  "archetype": "pipeline_velocity",
  "name": "Lead routing automation",
  "inputs": {
    "dealsPerQuarter": { "value": 200, "confidence": "custom" },
    "avgDealValue": { "value": 25000, "confidence": "custom" },
    "conversionLift": { "value": 0.10, "confidence": "estimated", "source": "Zapier benchmark" }
  }
}
```

### POST /api/calculations/:shortId/value-items/batch
Create multiple value items at once.

**Body:**
```json
{
  "items": [
    { "archetype": "task_elimination", "name": "...", "inputs": {...} },
    { "archetype": "revenue_capture", "name": "...", "inputs": {...} }
  ]
}
```

### PUT /api/calculations/:shortId/value-items/:itemShortId
Update a value item (partial updates supported).

### POST /api/calculations/:shortId/use-cases
Create a use case with optional architecture links.

**Body:**
```json
{
  "name": "Lead Management",
  "department": "RevOps",
  "status": "identified",
  "implementationEffort": "medium",
  "description": "Auto-route leads based on territory",
  "metrics": [{ "name": "Lead response time", "before": "4 hours", "after": "5 minutes" }]
}
```

### GET /api/calculations/:shortId/obfuscated
Returns anonymized version with rounded values and hidden details (per obfuscation settings).

## Valid Values

**Archetypes (16):** pipeline_velocity, revenue_capture, revenue_expansion, time_to_revenue, process_acceleration, handoff_elimination, task_elimination, task_simplification, context_surfacing, labor_avoidance, tool_consolidation, error_rework_elimination, compliance_assurance, data_integrity, incident_prevention, process_consistency

**Statuses:** identified, in_progress, deployed, future

**Effort Levels:** low, medium, high

**Confidence Tiers:** benchmarked, estimated, custom

**Roles:** executive, revops, marketing, sales_cs, it, hr, finance, engineering, support, supply_chain

## Error Handling

Errors return structured JSON with suggestions:
```json
{
  "error": "Invalid archetype \"task_elim\"",
  "validArchetypes": ["task_elimination", "task_simplification", ...],
  "schemaUrl": "/api/schema"
}
```
