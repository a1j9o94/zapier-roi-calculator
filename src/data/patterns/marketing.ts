// ============================================================
// Marketing Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const MARKETING_PATTERNS: PatternTemplate[] = [
  {
    id: "mktg-lead-nurture",
    name: "Lead Nurture Sequence Automation",
    description:
      "Auto-enroll leads in nurture sequences based on behavior signals. Keep pipeline warm without manual effort.",
    department: "marketing",
    archetype: "pipeline_velocity",
    dimension: "revenue_impact",
    defaultInputs: {
      dealsPerQuarter: 1000,
      avgDealValue: 5000,
      conversionLift: 0.08,
    },
    exampleScenario:
      "1,000 MQLs/quarter, $5K avg deal, 8% conversion lift = $160K/year.",
    commonApps: ["HubSpot", "Mailchimp", "Salesforce", "Slack"],
    tags: ["leads", "nurture", "drip", "sequences", "mql"],
  },
  {
    id: "mktg-campaign-attribution",
    name: "Campaign Attribution Sync",
    description:
      "Auto-sync campaign data between ad platforms, CRM, and reporting. Eliminate manual UTM tracking.",
    department: "marketing",
    archetype: "data_integrity",
    dimension: "risk_quality",
    defaultInputs: {
      recordsPerMonth: 5000,
      errorRate: 0.05,
      costPerError: 20,
      reductionRate: 0.75,
    },
    exampleScenario:
      "5K campaign records/month, 5% error rate, $20/error, 75% reduction = $45K/year.",
    commonApps: ["Google Ads", "Facebook Ads", "HubSpot", "Google Sheets"],
    tags: ["attribution", "campaigns", "utm", "tracking", "reporting"],
  },
  {
    id: "mktg-content-distribution",
    name: "Content Distribution Workflow",
    description:
      "Auto-distribute new content across social channels, email, and internal teams when published.",
    department: "marketing",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 40,
      minutesPerTask: 30,
      hourlyRate: 55,
    },
    exampleScenario:
      "40 content pieces/month, 30 min distribution each at $55/hr = $13.2K/year.",
    commonApps: ["WordPress", "Buffer", "Slack", "Twitter", "LinkedIn"],
    tags: ["content", "distribution", "social", "publishing"],
  },
  {
    id: "mktg-webinar-followup",
    name: "Webinar Registration & Follow-Up",
    description:
      "Auto-register leads, sync to CRM, send reminders, and trigger post-webinar follow-up sequences.",
    department: "marketing",
    archetype: "process_acceleration",
    dimension: "speed_cycle_time",
    defaultInputs: {
      processesPerMonth: 4,
      timeBeforeHrs: 8,
      timeAfterHrs: 1,
      hourlyRate: 55,
    },
    exampleScenario:
      "4 webinars/month, 8hrs to 1hr follow-up processing at $55/hr = $18.5K/year.",
    commonApps: ["Zoom", "HubSpot", "Gmail", "Google Sheets"],
    tags: ["webinars", "events", "registration", "follow-up"],
  },
  {
    id: "mktg-form-to-crm",
    name: "Form Capture to CRM Pipeline",
    description:
      "Route form submissions to CRM with enrichment, scoring, and team notification.",
    department: "marketing",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 300,
      minutesPerTask: 5,
      hourlyRate: 50,
    },
    exampleScenario:
      "300 form submissions/month, 5 min manual entry at $50/hr = $15K/year.",
    commonApps: ["Typeform", "HubSpot", "Salesforce", "Slack", "Clearbit"],
    tags: ["forms", "crm", "lead-capture", "enrichment"],
  },
  {
    id: "mktg-revenue-capture-dunning",
    name: "Marketing-Led Revenue Capture",
    description:
      "Detect at-risk revenue from disengaged users and trigger re-engagement campaigns.",
    department: "marketing",
    archetype: "revenue_capture",
    dimension: "revenue_impact",
    defaultInputs: {
      annualRevenue: 5000000,
      leakageRate: 0.03,
      captureImprovement: 0.35,
    },
    exampleScenario:
      "$5M revenue, 3% at risk from disengagement, 35% recovery = $52.5K/year.",
    commonApps: ["Intercom", "HubSpot", "Mailchimp", "Slack"],
    tags: ["churn", "re-engagement", "retention", "dunning"],
  },
];
