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
  },
];
