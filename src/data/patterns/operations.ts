// ============================================================
// Operations Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const OPERATIONS_PATTERNS: PatternTemplate[] = [
  {
    id: "ops-order-processing",
    name: "Order Processing Automation",
    description:
      "Auto-route orders from intake to fulfillment: validate, enrich, and assign to the right team.",
    department: "operations",
    archetype: "process_acceleration",
    dimension: "speed_cycle_time",
    defaultInputs: {
      processesPerMonth: 500,
      timeBeforeHrs: 0.5,
      timeAfterHrs: 0.08,
      hourlyRate: 45,
    },
    exampleScenario:
      "500 orders/month, 30 min to 5 min processing at $45/hr = $56.7K/year.",
    commonApps: ["Shopify", "Google Sheets", "Slack", "Airtable"],
    tags: ["orders", "fulfillment", "processing", "routing"],
  },
  {
    id: "ops-inventory-alerts",
    name: "Inventory & Stock Alert System",
    description:
      "Monitor inventory levels and trigger alerts, reorders, or workflow adjustments at thresholds.",
    department: "operations",
    archetype: "incident_prevention",
    dimension: "risk_quality",
    defaultInputs: {
      incidentsPerYear: 24,
      avgCostPerIncident: 3000,
      reductionRate: 0.40,
    },
    exampleScenario:
      "24 stockouts/year, $3K avg cost, 40% prevention = $28.8K/year.",
    commonApps: ["Shopify", "Airtable", "Slack", "Gmail"],
    tags: ["inventory", "stock", "alerts", "reorder", "supply"],
  },
  {
    id: "ops-data-entry-elimination",
    name: "Cross-System Data Entry Elimination",
    description:
      "Eliminate re-keying data between systems (ERP, CRM, spreadsheets) with automated sync.",
    department: "operations",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 800,
      minutesPerTask: 5,
      hourlyRate: 40,
    },
    exampleScenario:
      "800 manual entries/month, 5 min each at $40/hr = $32K/year.",
    commonApps: ["Google Sheets", "Salesforce", "QuickBooks", "Airtable"],
    tags: ["data-entry", "sync", "elimination", "re-keying"],
  },
  {
    id: "ops-quality-checks",
    name: "Automated Quality Check Workflows",
    description:
      "Run automated quality checks on processes and flag deviations for review.",
    department: "operations",
    archetype: "process_consistency",
    dimension: "risk_quality",
    defaultInputs: {
      processesPerMonth: 1000,
      defectRate: 0.04,
      costPerDefect: 100,
      reductionRate: 0.65,
    },
    exampleScenario:
      "1K processes/month, 4% defect rate, $100/defect, 65% reduction = $31.2K/year.",
    commonApps: ["Airtable", "Google Sheets", "Slack", "Email"],
    tags: ["quality", "checks", "defects", "consistency"],
  },
  {
    id: "ops-labor-avoidance",
    name: "Volume Scaling Without Headcount",
    description:
      "Handle increased operational volume with automation instead of hiring.",
    department: "operations",
    archetype: "labor_avoidance",
    dimension: "cost_avoidance",
    defaultInputs: {
      ftesAvoided: 2,
      fullyLoadedAnnualCost: 80000,
    },
    exampleScenario:
      "2 FTEs avoided at $80K/year each = $160K/year.",
    commonApps: ["Webhooks", "Zapier Tables", "Slack", "Code by Zapier"],
    tags: ["scaling", "headcount", "labor", "growth"],
  },
  {
    id: "ops-vendor-communication",
    name: "Vendor Communication Automation",
    description:
      "Auto-send POs, confirmations, and status updates to vendors based on system events.",
    department: "operations",
    archetype: "handoff_elimination",
    dimension: "speed_cycle_time",
    defaultInputs: {
      handoffsPerMonth: 100,
      avgQueueTimeHrs: 3,
      hourlyRateOfWaitingParty: 45,
    },
    exampleScenario:
      "100 vendor communications/month, 3hr delay at $45/hr = $162K/year.",
    commonApps: ["Gmail", "Google Sheets", "Slack", "Airtable"],
    tags: ["vendors", "communication", "purchase-orders", "handoffs"],
  },
];
