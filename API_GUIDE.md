# Zapier ROI Calculator API Guide (V1 — Legacy)

> **Note**: This guide documents the V1 API at `zapier-roi-calculator.vercel.app`. The V2 API is live at `zapier-value.vercel.app` with UVS taxonomy support (dimensions, archetypes, confidence tiers). See `API.md` for the V2 reference.

Base URL: `https://zapier-roi-calculator.vercel.app` (V1) | `https://zapier-value.vercel.app` (V2)

All endpoints return JSON. Use `Content-Type: application/json` for request bodies.

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Get full calculation with all data | GET | `/api/calculations/{shortId}/full` |
| List value items | GET | `/api/calculations/{shortId}/value-items` |
| Create use case | POST | `/api/calculations/{shortId}/use-cases` |
| Get assumptions | GET | `/api/calculations/{shortId}` |
| Update assumptions | PUT | `/api/calculations/{shortId}/assumptions` |

---

## Workflow for Adding Use Cases

### Step 1: Get Existing Data

First, fetch the full calculation to see existing value items you can link to:

```bash
GET /api/calculations/{shortId}/full
```

**Response includes:**
- `assumptions` - hourly rates, task minutes, projection settings
- `valueItems[]` - existing value items (each has a `shortId` for linking)
- `useCases[]` - existing use cases

**Example Response:**
```json
{
  "shortId": "abc123",
  "name": "Acme Corp ROI",
  "assumptions": {
    "hourlyRates": {
      "basic": 25,
      "operations": 50,
      "engineering": 100,
      "executive": 200
    },
    "taskMinutes": {
      "simple": 2,
      "medium": 8,
      "complex": 20
    },
    "projectionYears": 3,
    "realizationRamp": [0.5, 1, 1],
    "annualGrowthRate": 0.1,
    "avgDataBreachCost": 150000,
    "avgSupportTicketCost": 150
  },
  "valueItems": [
    {
      "shortId": "vi001",
      "category": "time_savings",
      "name": "Manual data entry automation",
      "quantity": 100,
      "unitValue": 15,
      "rateTier": "operations",
      "complexity": "medium",
      "useCaseId": null
    }
  ],
  "useCases": []
}
```

---

### Step 2: Create a Use Case

Use cases must have **at least one metric OR one value item**.

```bash
POST /api/calculations/{shortId}/use-cases
Content-Type: application/json
```

#### Option A: Use Case with Custom Metrics Only

```json
{
  "name": "Lead Response Automation",
  "status": "deployed",
  "difficulty": "low",
  "department": "Sales",
  "description": "Automated lead routing and initial response",
  "metrics": [
    {
      "name": "Response Time",
      "before": "4 hours",
      "after": "5 minutes",
      "improvement": "98% faster"
    },
    {
      "name": "Lead Conversion Rate",
      "before": "12%",
      "after": "18%",
      "improvement": "+50%"
    }
  ]
}
```

#### Option B: Use Case Linking Existing Value Items

Link existing value items by their `shortId`:

```json
{
  "name": "Data Entry Automation",
  "status": "deployed",
  "difficulty": "medium",
  "department": "Operations",
  "valueItems": [
    { "shortId": "vi001" }
  ]
}
```

#### Option C: Use Case Creating New Value Items Inline

Create new value items as part of the use case:

```json
{
  "name": "Invoice Processing Automation",
  "status": "in_progress",
  "difficulty": "medium",
  "department": "Finance",
  "valueItems": [
    {
      "category": "time_savings",
      "name": "Invoice data extraction",
      "quantity": 500,
      "unitValue": 10,
      "rateTier": "operations",
      "complexity": "medium"
    },
    {
      "category": "cost_reduction",
      "name": "Reduced processing errors",
      "quantity": 1,
      "unitValue": 5000,
      "rate": 0.8
    }
  ]
}
```

#### Option D: Mixed - Metrics + Existing + New Value Items

```json
{
  "name": "Customer Onboarding Automation",
  "status": "deployed",
  "difficulty": "high",
  "department": "Customer Success",
  "description": "End-to-end automated onboarding workflow",
  "metrics": [
    {
      "name": "Onboarding Time",
      "before": "5 days",
      "after": "1 day",
      "improvement": "80% faster"
    }
  ],
  "valueItems": [
    { "shortId": "vi001" },
    {
      "category": "time_savings",
      "name": "Welcome email sequence",
      "quantity": 200,
      "unitValue": 5,
      "rateTier": "basic",
      "complexity": "simple"
    }
  ]
}
```

---

## Value Item Categories & Fields

### Categories

| Category | Description | Typical Fields |
|----------|-------------|----------------|
| `time_savings` | Labor time automated | quantity (tasks/month), unitValue (mins/task), rateTier, complexity |
| `revenue_impact` | Revenue improvement | quantity (deals/month), unitValue (deal value), rate (improvement %) |
| `cost_reduction` | Direct cost savings | quantity (1), unitValue (annual cost), rate (reduction %) |
| `uptime` | Incident prevention | quantity (probability 0-1), unitValue (cost per incident) |
| `security_governance` | Risk mitigation | quantity (probability 0-1), unitValue (potential cost) |
| `tool_consolidation` | Tool replacement | quantity (1), unitValue (annual cost per tool) |

### Time Savings Example

```json
{
  "category": "time_savings",
  "name": "Manual report generation",
  "quantity": 20,
  "unitValue": 30,
  "rateTier": "operations",
  "complexity": "medium",
  "description": "Weekly reports that take 30 min each"
}
```

**Calculation:** 20 tasks × 30 min × $50/hr (operations) × 12 months = annual savings

### Rate Tiers (for time_savings)

| Tier | Default Rate | Use For |
|------|--------------|---------|
| `basic` | $25/hr | Admin staff, data entry |
| `operations` | $50/hr | Ops, IT support |
| `engineering` | $100/hr | Developers, engineers |
| `executive` | $200/hr | Leadership, executives |

### Complexity (for time_savings)

| Complexity | Default Minutes | Use For |
|------------|-----------------|---------|
| `simple` | 2 min | Quick lookups, copy/paste |
| `medium` | 8 min | Standard tasks |
| `complex` | 20 min | Multi-step processes |

---

## Use Case Fields

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `name` | Yes | string | Descriptive name |
| `status` | Yes | `identified`, `in_progress`, `deployed`, `future` | Implementation status |
| `difficulty` | Yes | `low`, `medium`, `high` | Implementation complexity |
| `department` | No | string | Business unit |
| `description` | No | string | Detailed description |
| `notes` | No | string | Internal notes |
| `metrics` | No* | array | Custom before/after metrics |
| `valueItems` | No* | array | Value items to create or link |

*Must have at least one metric OR one value item

### Metric Object

```json
{
  "name": "Metric Name",
  "before": "Previous state",
  "after": "New state",
  "improvement": "Change description"
}
```

---

## Checking Assumptions

Get current calculation settings:

```bash
GET /api/calculations/{shortId}
```

Update assumptions:

```bash
PUT /api/calculations/{shortId}/assumptions
Content-Type: application/json

{
  "hourlyRates": {
    "engineering": 150
  },
  "projectionYears": 5
}
```

Only include fields you want to change - others are preserved.

---

## Validating Your Work

### Get Full Calculation

```bash
GET /api/calculations/{shortId}/full
```

Returns all value items with their linked `useCaseId` and all use cases.

### List Only Value Items

```bash
GET /api/calculations/{shortId}/value-items
```

Check which items are linked (`useCaseId` is set) vs unlinked (`useCaseId` is null).

### List Only Use Cases

```bash
GET /api/calculations/{shortId}/use-cases
```

---

## Calculating Total Value

The API returns raw data. To calculate total annual value:

### For Time Savings Items

```
annualValue = quantity × unitValue × hourlyRate × 12
```

Where:
- `quantity` = tasks per month
- `unitValue` = minutes per task (or use complexity default)
- `hourlyRate` = from assumptions based on `rateTier`

### For Other Categories

```
annualValue = quantity × unitValue × rate (if applicable)
```

### Example Calculation Script

```javascript
function calculateItemValue(item, assumptions) {
  if (item.manualAnnualValue) return item.manualAnnualValue;

  if (item.category === 'time_savings') {
    const hourlyRate = assumptions.hourlyRates[item.rateTier || 'operations'];
    const minutes = item.unitValue || assumptions.taskMinutes[item.complexity || 'medium'];
    return item.quantity * minutes * (hourlyRate / 60) * 12;
  }

  // Other categories
  return item.quantity * item.unitValue * (item.rate || 1);
}

// Sum all items
const totalAnnualValue = valueItems.reduce(
  (sum, item) => sum + calculateItemValue(item, assumptions),
  0
);
```

---

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Validation failed",
  "errors": [
    { "field": "status", "message": "Must be one of: identified, in_progress, deployed, future" },
    { "field": "metrics", "message": "Use case must have at least one metric or one value item" }
  ]
}
```

### Not Found (404)

```json
{
  "error": "Calculation not found"
}
```

### Common Validation Rules

1. Use case must have at least one metric OR one value item
2. Cannot remove all metrics from a use case that has no linked value items
3. Cannot unlink the last value item from a use case that has no metrics
4. Value item `shortId` must exist and belong to same calculation when linking

---

## Complete Workflow Example

```bash
# 1. Get existing data
curl https://zapier-roi-calculator.vercel.app/api/calculations/abc123/full

# 2. Create use case with new value item
curl -X POST https://zapier-roi-calculator.vercel.app/api/calculations/abc123/use-cases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Campaign Automation",
    "status": "deployed",
    "difficulty": "low",
    "department": "Marketing",
    "metrics": [
      {"name": "Campaign Setup Time", "before": "2 hours", "after": "10 minutes", "improvement": "92% faster"}
    ],
    "valueItems": [
      {
        "category": "time_savings",
        "name": "Email template creation",
        "quantity": 50,
        "unitValue": 15,
        "rateTier": "operations",
        "complexity": "medium"
      }
    ]
  }'

# 3. Verify the use case was created
curl https://zapier-roi-calculator.vercel.app/api/calculations/abc123/use-cases

# 4. Check value items are linked
curl https://zapier-roi-calculator.vercel.app/api/calculations/abc123/value-items
```
