// ============================================================
// Support / Customer Service Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const SUPPORT_PATTERNS: PatternTemplate[] = [
  {
    id: "support-ticket-triage",
    name: "Ticket Auto-Triage & Priority Assignment",
    description:
      "Auto-classify tickets by category, sentiment, and urgency. Route to the right agent or queue.",
    department: "support",
    archetype: "process_acceleration",
    dimension: "speed_cycle_time",
    defaultInputs: {
      processesPerMonth: 2000,
      timeBeforeHrs: 0.25,
      timeAfterHrs: 0.03,
      hourlyRate: 35,
    },
    exampleScenario:
      "2K tickets/month, 15 min to 2 min triage at $35/hr = $18.5K/year.",
    commonApps: ["Zendesk", "Intercom", "Slack", "Jira"],
    tags: ["tickets", "triage", "priority", "routing", "classification"],
    zapBundle: {
      zaps: [{
        title: "Ticket Auto-Triage & Routing",
        description: "Classify and route tickets by category and urgency",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New Ticket Created", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Classify by Keywords & Sentiment", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Route to Appropriate Queue", type: "action" },
        ],
      }],
    },
  },
  {
    id: "support-csat-followup",
    name: "CSAT Survey & Follow-Up Automation",
    description:
      "Auto-send satisfaction surveys and trigger escalation workflows for low scores.",
    department: "support",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 500,
      minutesPerTask: 5,
      hourlyRate: 35,
    },
    exampleScenario:
      "500 surveys/month, 5 min manual follow-up at $35/hr = $17.5K/year.",
    commonApps: ["Typeform", "Zendesk", "Slack", "Gmail"],
    tags: ["csat", "nps", "surveys", "follow-up", "escalation"],
    zapBundle: {
      zaps: [{
        title: "CSAT Survey & Follow-Up",
        description: "Auto-send satisfaction surveys and escalate low scores",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Ticket Resolved", type: "trigger" },
          { app: "Gmail", action: "send_email", stepTitle: "Send CSAT Survey", type: "action" },
          { app: "Zapier Tables", action: "create_record", stepTitle: "Log Response", type: "action" },
        ],
      }],
    },
  },
  {
    id: "support-knowledge-surfacing",
    name: "Knowledge Base Article Suggestions",
    description:
      "Auto-surface relevant KB articles when tickets are created, reducing resolution time.",
    department: "support",
    archetype: "context_surfacing",
    dimension: "productivity",
    defaultInputs: {
      meetingsAvoidedPerMonth: 0,
      attendeesPerMeeting: 0,
      meetingDurationHrs: 0,
      meetingHourlyRate: 0,
      searchesAvoidedPerMonth: 500,
      avgSearchTimeMin: 8,
      searchHourlyRate: 35,
    },
    exampleScenario:
      "500 KB searches avoided/month, 8 min each at $35/hr = $28K/year.",
    commonApps: ["Zendesk", "Notion", "Intercom", "Slack"],
    tags: ["knowledge-base", "kb", "articles", "deflection", "self-service"],
    zapBundle: {
      zaps: [{
        title: "KB Article Auto-Suggest",
        description: "Surface relevant KB articles when tickets are created",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New Ticket Created", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Search KB for Matches", type: "action" },
          { app: "Slack", action: "send_direct_message", stepTitle: "Send Suggested Articles to Agent", type: "action" },
        ],
      }],
    },
  },
  {
    id: "support-escalation-workflow",
    name: "Escalation & SLA Management",
    description:
      "Auto-escalate tickets approaching SLA breach. Notify managers and reassign.",
    department: "support",
    archetype: "compliance_assurance",
    dimension: "risk_quality",
    defaultInputs: {
      expectedViolationsPerYear: 50,
      avgPenaltyPerViolation: 2000,
      reductionRate: 0.60,
    },
    exampleScenario:
      "50 SLA breaches/year, $2K avg penalty/impact, 60% reduction = $60K/year.",
    commonApps: ["Zendesk", "PagerDuty", "Slack", "Jira"],
    tags: ["escalation", "sla", "breach", "management", "priority"],
    zapBundle: {
      zaps: [{
        title: "SLA Breach Prevention & Escalation",
        description: "Auto-escalate tickets approaching SLA breach",
        steps: [
          { app: "Schedule by Zapier", action: "every_15_min", stepTitle: "Check SLA Status", type: "trigger" },
          { app: "Zapier Tables", action: "find_records", stepTitle: "Query Tickets Near SLA Breach", type: "search" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Approaching Breach", type: "filter" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Escalate to Manager", type: "action" },
        ],
      }],
    },
  },
  {
    id: "support-customer-health",
    name: "Customer Health Score Alerting",
    description:
      "Monitor usage signals and alert CSMs when customer health drops below threshold.",
    department: "support",
    archetype: "revenue_capture",
    dimension: "revenue_impact",
    defaultInputs: {
      annualRevenue: 5000000,
      leakageRate: 0.05,
      captureImprovement: 0.30,
    },
    exampleScenario:
      "$5M ARR, 5% at-risk churn, 30% save rate = $75K/year saved.",
    commonApps: ["Intercom", "Salesforce", "Slack", "Webhooks"],
    tags: ["health-score", "churn", "retention", "csm", "alerts"],
    zapBundle: {
      zaps: [{
        title: "Customer Health Score Alerting",
        description: "Monitor usage signals and alert on churn risk",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Usage Signal Received", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Calculate Health Score", type: "action" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Below Threshold", type: "filter" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Alert CSM of At-Risk Customer", type: "action" },
        ],
      }],
    },
  },
  {
    id: "support-error-reduction",
    name: "Response Error Reduction",
    description:
      "Auto-validate agent responses against templates and flag deviations before sending.",
    department: "support",
    archetype: "error_rework_elimination",
    dimension: "cost_avoidance",
    defaultInputs: {
      errorsPerMonth: 100,
      avgCostPerError: 50,
      reductionRate: 0.65,
    },
    exampleScenario:
      "100 response errors/month, $50 avg rework cost, 65% reduction = $39K/year.",
    commonApps: ["Zendesk", "Intercom", "Code by Zapier", "Slack"],
    tags: ["errors", "templates", "quality", "response-validation"],
    zapBundle: {
      zaps: [{
        title: "Response Quality Checker",
        description: "Validate agent responses before sending",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Agent Response Drafted", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Validate Against Templates", type: "action" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Flag Deviations", type: "filter" },
          { app: "Slack", action: "send_direct_message", stepTitle: "Notify Agent of Issue", type: "action" },
        ],
      }],
    },
  },
];
