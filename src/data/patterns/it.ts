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
    zapBundle: {
      zaps: [{
        title: "New Hire Account Provisioning",
        description: "Auto-provision accounts when new employee added to HRIS",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New Employee in HRIS", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Build Account List", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify IT of Provisioning", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Offboarding Access Revocation",
        description: "Auto-revoke access and deactivate accounts on termination",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Employee Terminated in HRIS", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Generate Deprovisioning Checklist", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Security Team", type: "action" },
          { app: "Gmail", action: "send_email", stepTitle: "Send Compliance Confirmation", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "IT Ticket Auto-Triage",
        description: "Classify and route IT tickets by category and urgency",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New Ticket Submitted", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Classify & Prioritize", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Route to Appropriate Channel", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Replace Middleware with Zapier Tables",
        description: "Use Zapier Tables as central hub, eliminate standalone tools",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Incoming Data from Source", type: "trigger" },
          { app: "Zapier Tables", action: "create_record", stepTitle: "Store in Zapier Tables", type: "action" },
          { app: "Webhooks by Zapier", action: "post", stepTitle: "Sync to Destination", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [{
        title: "Proactive System Monitoring",
        description: "Monitor health endpoints and alert before incidents escalate",
        steps: [
          { app: "Schedule by Zapier", action: "every_15_min", stepTitle: "Periodic Health Check", type: "trigger" },
          { app: "Webhooks by Zapier", action: "get", stepTitle: "Query Health Endpoint", type: "action" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Check Thresholds", type: "filter" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Alert on Anomaly", type: "action" },
        ],
      }],
    },
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
    zapBundle: {
      zaps: [
        {
          title: "Cross-System Data Sync",
          description: "Keep data consistent between CRM and other systems",
          steps: [
            { app: "Salesforce", action: "updated_record", stepTitle: "Record Updated in Source", type: "trigger" },
            { app: "Code by Zapier", action: "run_javascript", stepTitle: "Validate Data Integrity", type: "action" },
            { app: "HubSpot", action: "update_contact", stepTitle: "Sync to Destination System", type: "action" },
          ],
        },
        {
          title: "Duplicate Detection & Alert",
          description: "Detect duplicate records across systems",
          steps: [
            { app: "Zapier Tables", action: "new_record", stepTitle: "New Record Created", type: "trigger" },
            { app: "Zapier Tables", action: "find_records", stepTitle: "Search for Duplicates", type: "search" },
            { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Matches", type: "filter" },
            { app: "Slack", action: "send_channel_message", stepTitle: "Alert on Potential Duplicates", type: "action" },
          ],
        },
      ],
    },
  },
];
