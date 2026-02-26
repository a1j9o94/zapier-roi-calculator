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
    zapBundle: {
      zaps: [{
        title: "Lead Routing & Assignment",
        description: "Route new leads to the right rep instantly",
        steps: [
          { app: "Salesforce", action: "new_lead", stepTitle: "New Lead in Salesforce", type: "trigger" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter by Score/Region", type: "filter" },
          { app: "Salesforce", action: "update_record", stepTitle: "Assign to Rep", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Rep in Slack", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Deal Stage Progression Alerts",
        description: "Notify stakeholders when deals advance or stall",
        steps: [
          { app: "HubSpot", action: "deal_updated", stepTitle: "Deal Stage Changed", type: "trigger" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Post Deal Update to Sales Channel", type: "action" },
          { app: "Gmail", action: "send_email", stepTitle: "Email Stakeholder Summary", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [
        {
          title: "Email to CRM Activity Log",
          description: "Auto-log important emails as CRM activities",
          steps: [
            { app: "Gmail", action: "new_email", stepTitle: "New Email Matching Search", type: "trigger" },
            { app: "HubSpot", action: "create_engagement", stepTitle: "Create Engagement in CRM", type: "action" },
          ],
        },
        {
          title: "Calendar Meeting to CRM Log",
          description: "Auto-log completed meetings in CRM",
          steps: [
            { app: "Google Calendar", action: "event_start", stepTitle: "Meeting Ended", type: "trigger" },
            { app: "Salesforce", action: "create_record", stepTitle: "Create Activity Record", type: "action" },
          ],
        },
      ],
    },
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
    zapBundle: {
      zaps: [{
        title: "Renewal & Dunning Automation",
        description: "Catch expiring subscriptions and trigger renewal outreach",
        steps: [
          { app: "Stripe", action: "subscription_updated", stepTitle: "Subscription Status Change", type: "trigger" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Expiring/Failed", type: "filter" },
          { app: "Gmail", action: "send_email", stepTitle: "Send Renewal/Dunning Email", type: "action" },
          { app: "Salesforce", action: "update_record", stepTitle: "Update CRM Record", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Upsell Signal Detection & Alert",
        description: "Detect usage milestones and notify CSMs",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Usage Milestone Webhook", type: "trigger" },
          { app: "Salesforce", action: "update_record", stepTitle: "Update Account with Expansion Signal", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify CSM of Expansion Opportunity", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Proposal Auto-Generation",
        description: "Auto-generate proposals from CRM deal data",
        steps: [
          { app: "Salesforce", action: "updated_record", stepTitle: "Deal Moved to Proposal Stage", type: "trigger" },
          { app: "Google Sheets", action: "lookup_row", stepTitle: "Pull Pricing Data", type: "search" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Sales Ops", type: "action" },
        ],
      }],
    },
  },
];
