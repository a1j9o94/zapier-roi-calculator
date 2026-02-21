// ============================================================
// IT Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const IT_PATTERNS: PatternTemplate[] = [
  {
    id: "it-user-provisioning",
    name: "Employee Onboarding Provisioning",
    description:
      "Auto-provision accounts, groups, and access when a new employee is added to HRIS.",
    department: "it",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 30,
      minutesPerTask: 45,
      hourlyRate: 75,
    },
    exampleScenario:
      "30 new hires/month, 45 min provisioning each at $75/hr = $20.3K/year.",
    commonApps: ["BambooHR", "Okta", "Google Workspace", "Slack"],
    tags: ["provisioning", "onboarding", "user-management", "access"],
  },
  {
    id: "it-deprovisioning",
    name: "Offboarding & Access Revocation",
    description:
      "Auto-revoke access and deactivate accounts when an employee leaves. Reduces security risk.",
    department: "it",
    archetype: "compliance_assurance",
    dimension: "risk_quality",
    defaultInputs: {
      expectedViolationsPerYear: 3,
      avgPenaltyPerViolation: 50000,
      reductionRate: 0.60,
    },
    exampleScenario:
      "3 potential access violations/year, $50K avg penalty, 60% reduction = $90K/year avoided.",
    commonApps: ["BambooHR", "Okta", "Google Workspace", "Jira"],
    tags: ["offboarding", "deprovisioning", "security", "compliance"],
  },
  {
    id: "it-ticket-routing",
    name: "IT Ticket Auto-Triage & Routing",
    description:
      "Classify and route support tickets to the right team based on category, urgency, and keywords.",
    department: "it",
    archetype: "process_acceleration",
    dimension: "speed_cycle_time",
    defaultInputs: {
      processesPerMonth: 500,
      timeBeforeHrs: 0.5,
      timeAfterHrs: 0.08,
      hourlyRate: 65,
    },
    exampleScenario:
      "500 tickets/month, 30 min to 5 min triage at $65/hr = $16.3K/year.",
    commonApps: ["Zendesk", "Jira", "Slack", "PagerDuty"],
    tags: ["tickets", "triage", "routing", "helpdesk"],
  },
  {
    id: "it-tool-consolidation",
    name: "Tool Sprawl Consolidation",
    description:
      "Replace standalone middleware and sync tools with Zapier-based workflows.",
    department: "it",
    archetype: "tool_consolidation",
    dimension: "cost_avoidance",
    defaultInputs: {
      toolsEliminated: 3,
      annualLicenseCostPerTool: 12000,
    },
    exampleScenario:
      "Eliminate 3 middleware tools at $12K/year each = $36K/year.",
    commonApps: ["Zapier Tables", "Webhooks", "Code by Zapier"],
    tags: ["tool-sprawl", "consolidation", "middleware", "cost-reduction"],
  },
  {
    id: "it-incident-monitoring",
    name: "Proactive System Monitoring & Alerting",
    description:
      "Monitor system health endpoints and alert before incidents escalate.",
    department: "it",
    archetype: "incident_prevention",
    dimension: "risk_quality",
    defaultInputs: {
      incidentsPerYear: 24,
      avgCostPerIncident: 8000,
      reductionRate: 0.35,
    },
    exampleScenario:
      "24 incidents/year, $8K avg cost, 35% reduction = $67.2K/year.",
    commonApps: ["PagerDuty", "Datadog", "Slack", "Webhooks"],
    tags: ["monitoring", "alerting", "incidents", "uptime"],
  },
  {
    id: "it-data-sync",
    name: "Cross-System Data Synchronization",
    description:
      "Keep employee, customer, and operational data consistent across all systems.",
    department: "it",
    archetype: "data_integrity",
    dimension: "risk_quality",
    defaultInputs: {
      recordsPerMonth: 10000,
      errorRate: 0.03,
      costPerError: 25,
      reductionRate: 0.80,
    },
    exampleScenario:
      "10K records/month, 3% error rate, $25/error, 80% reduction = $72K/year.",
    commonApps: ["Salesforce", "HubSpot", "Google Sheets", "Webhooks"],
    tags: ["sync", "data-integrity", "consistency", "deduplication"],
  },
];
