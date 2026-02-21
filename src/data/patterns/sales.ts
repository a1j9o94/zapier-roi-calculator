// ============================================================
// Sales Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const SALES_PATTERNS: PatternTemplate[] = [
  {
    id: "sales-lead-routing",
    name: "Automated Lead Routing & Assignment",
    description:
      "Route inbound leads to the right rep based on territory, deal size, or score. Eliminates manual assignment delays.",
    department: "sales",
    archetype: "pipeline_velocity",
    dimension: "revenue_impact",
    defaultInputs: {
      dealsPerQuarter: 500,
      avgDealValue: 25000,
      conversionLift: 0.1,
    },
    exampleScenario:
      "500 leads/quarter, $25K average deal, 10% conversion lift = $500K/year additional pipeline conversion.",
    commonApps: ["Salesforce", "HubSpot", "Slack", "Clearbit"],
    tags: ["leads", "routing", "assignment", "pipeline", "speed-to-lead"],
  },
  {
    id: "sales-deal-alerts",
    name: "Deal Stage Progression Alerts",
    description:
      "Notify reps and managers when deals advance, stall, or are at risk. Keeps pipeline momentum.",
    department: "sales",
    archetype: "pipeline_velocity",
    dimension: "revenue_impact",
    defaultInputs: {
      dealsPerQuarter: 200,
      avgDealValue: 50000,
      conversionLift: 0.05,
    },
    exampleScenario:
      "200 deals/quarter, $50K average, 5% lift from faster follow-up = $200K/year.",
    commonApps: ["Salesforce", "HubSpot", "Slack", "Gong"],
    tags: ["deals", "alerts", "pipeline", "velocity", "stalled-deals"],
  },
  {
    id: "sales-crm-data-entry",
    name: "CRM Data Entry Elimination",
    description:
      "Auto-log emails, calls, and meetings in CRM. Eliminates 30-60 minutes/day of rep admin time.",
    department: "sales",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 600,
      minutesPerTask: 3,
      hourlyRate: 60,
    },
    exampleScenario:
      "10 reps x 60 daily entries = 600/month, 3 min each at $60/hr = $21.6K/year per team.",
    commonApps: ["Gmail", "Salesforce", "HubSpot", "Google Calendar"],
    tags: ["crm", "data-entry", "logging", "activity-capture"],
  },
  {
    id: "sales-renewal-capture",
    name: "Renewal & Dunning Automation",
    description:
      "Catch expiring subscriptions and failed payments. Trigger automated renewal sequences.",
    department: "sales",
    archetype: "revenue_capture",
    dimension: "revenue_impact",
    defaultInputs: {
      annualRevenue: 10000000,
      leakageRate: 0.02,
      captureImprovement: 0.45,
    },
    exampleScenario:
      "$10M ARR, 2% leakage, 45% recovery = $90K/year captured.",
    commonApps: ["Stripe", "Salesforce", "Intercom", "Gmail"],
    tags: ["renewals", "dunning", "churn", "revenue-leakage"],
  },
  {
    id: "sales-upsell-signals",
    name: "Upsell Signal Detection",
    description:
      "Detect product usage milestones that indicate expansion readiness. Alert CSMs automatically.",
    department: "sales",
    archetype: "revenue_expansion",
    dimension: "revenue_impact",
    defaultInputs: {
      customerBase: 500,
      expansionRate: 0.15,
      avgExpansionValue: 10000,
      lift: 0.10,
    },
    exampleScenario:
      "500 customers, 15% expand rate, $10K avg, 10% lift = $75K/year.",
    commonApps: ["Salesforce", "Slack", "Webhooks", "Intercom"],
    tags: ["upsell", "expansion", "usage-signals", "csm"],
  },
  {
    id: "sales-proposal-generation",
    name: "Proposal & Quote Auto-Generation",
    description:
      "Auto-generate proposals from CRM data, reducing handoff delays between sales and ops.",
    department: "sales",
    archetype: "handoff_elimination",
    dimension: "speed_cycle_time",
    defaultInputs: {
      handoffsPerMonth: 50,
      avgQueueTimeHrs: 4,
      hourlyRateOfWaitingParty: 60,
    },
    exampleScenario:
      "50 proposals/month, 4hr delay each at $60/hr = $144K/year in recovered time.",
    commonApps: ["Salesforce", "PandaDoc", "Google Docs", "Slack"],
    tags: ["proposals", "quotes", "handoff", "sales-ops"],
  },
];
