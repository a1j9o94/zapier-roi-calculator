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
    zapBundle: {
      zaps: [{
        title: "Order Processing Automation",
        description: "Route orders from intake to fulfillment",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New Order Received", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Validate & Enrich Order", type: "action" },
          { app: "Google Sheets", action: "create_spreadsheet_row", stepTitle: "Log Order", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Fulfillment Team", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Inventory Stock Alerts",
        description: "Monitor inventory levels and alert on low stock",
        steps: [
          { app: "Schedule by Zapier", action: "every_hour", stepTitle: "Hourly Stock Check", type: "trigger" },
          { app: "Google Sheets", action: "lookup_row", stepTitle: "Check Inventory Levels", type: "search" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Below Threshold", type: "filter" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Alert Ops Team", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Cross-System Data Entry Elimination",
        description: "Auto-sync data between systems to eliminate re-keying",
        steps: [
          { app: "Google Sheets", action: "new_spreadsheet_row", stepTitle: "New Row in Source Sheet", type: "trigger" },
          { app: "Formatter by Zapier", action: "text", stepTitle: "Format Data for Destination", type: "action" },
          { app: "Salesforce", action: "create_record", stepTitle: "Create Record in CRM", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Automated Quality Check Workflow",
        description: "Run quality checks and flag deviations",
        steps: [
          { app: "Schedule by Zapier", action: "every_day", stepTitle: "Daily Quality Check", type: "trigger" },
          { app: "Google Sheets", action: "lookup_row", stepTitle: "Query Process Outputs", type: "search" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Apply Quality Rules", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Report Deviations", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Volume Handling Automation",
        description: "Handle growing volume without additional headcount",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Incoming Request", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Process & Route", type: "action" },
          { app: "Zapier Tables", action: "create_record", stepTitle: "Log & Track", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Alert Only on Exceptions", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Vendor Communication Automation",
        description: "Auto-send POs and status updates to vendors",
        steps: [
          { app: "Google Sheets", action: "new_spreadsheet_row", stepTitle: "New PO Created", type: "trigger" },
          { app: "Gmail", action: "send_email", stepTitle: "Send PO to Vendor", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Procurement Team", type: "action" },
        ],
      }],
    },
  },
];
