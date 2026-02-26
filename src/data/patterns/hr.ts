// ============================================================
// HR Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const HR_PATTERNS: PatternTemplate[] = [
  {
    id: "hr-onboarding-workflow",
    name: "New Hire Onboarding Workflow",
    description:
      "Automate the full onboarding checklist: welcome email, IT provisioning, manager notifications, training enrollment.",
    department: "hr",
    archetype: "process_acceleration",
    dimension: "speed_cycle_time",
    defaultInputs: {
      processesPerMonth: 15,
      timeBeforeHrs: 6,
      timeAfterHrs: 1,
      hourlyRate: 50,
    },
    exampleScenario:
      "15 hires/month, 6hrs to 1hr onboarding at $50/hr = $45K/year.",
    commonApps: ["BambooHR", "Workday", "Gmail", "Slack", "Google Calendar"],
    tags: ["onboarding", "new-hire", "checklist", "provisioning"],
    zapBundle: {
      zaps: [{
        title: "New Hire Onboarding Workflow",
        description: "Automated onboarding checklist execution",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New Employee Added to HRIS", type: "trigger" },
          { app: "Gmail", action: "send_email", stepTitle: "Send Welcome Email", type: "action" },
          { app: "Google Sheets", action: "create_spreadsheet_row", stepTitle: "Create Onboarding Tracker Row", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Manager", type: "action" },
        ],
      }],
    },
  },
  {
    id: "hr-offboarding",
    name: "Employee Offboarding Automation",
    description:
      "Trigger offboarding checklist on termination: revoke access, collect equipment, notify stakeholders.",
    department: "hr",
    archetype: "process_consistency",
    dimension: "risk_quality",
    defaultInputs: {
      processesPerMonth: 10,
      defectRate: 0.15,
      costPerDefect: 1000,
      reductionRate: 0.70,
    },
    exampleScenario:
      "10 offboardings/month, 15% miss a step, $1K/defect, 70% reduction = $12.6K/year.",
    commonApps: ["BambooHR", "Okta", "Slack", "Gmail"],
    tags: ["offboarding", "termination", "access-revocation", "compliance"],
    zapBundle: {
      zaps: [{
        title: "Employee Offboarding Automation",
        description: "Consistent, secure offboarding on termination",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Employee Termination Event", type: "trigger" },
          { app: "Zapier Tables", action: "create_record", stepTitle: "Create Offboarding Checklist", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify IT & Manager", type: "action" },
          { app: "Gmail", action: "send_email", stepTitle: "Send Exit Paperwork", type: "action" },
        ],
      }],
    },
  },
  {
    id: "hr-pto-tracking",
    name: "PTO & Leave Management Automation",
    description:
      "Auto-sync leave requests to calendars, notify managers, and update payroll.",
    department: "hr",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 100,
      minutesPerTask: 10,
      hourlyRate: 45,
    },
    exampleScenario:
      "100 PTO requests/month, 10 min manual processing at $45/hr = $9K/year.",
    commonApps: ["BambooHR", "Google Calendar", "Slack", "Google Sheets"],
    tags: ["pto", "leave", "time-off", "calendar"],
    zapBundle: {
      zaps: [{
        title: "PTO Request Sync",
        description: "Auto-sync leave requests to calendars and notify managers",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "PTO Request Submitted", type: "trigger" },
          { app: "Google Calendar", action: "create_event", stepTitle: "Block Calendar", type: "action" },
          { app: "Slack", action: "send_direct_message", stepTitle: "Notify Manager", type: "action" },
        ],
      }],
    },
  },
  {
    id: "hr-applicant-tracking",
    name: "Applicant Pipeline Automation",
    description:
      "Auto-move candidates through pipeline stages, send status updates, schedule interviews.",
    department: "hr",
    archetype: "handoff_elimination",
    dimension: "speed_cycle_time",
    defaultInputs: {
      handoffsPerMonth: 200,
      avgQueueTimeHrs: 8,
      hourlyRateOfWaitingParty: 40,
    },
    exampleScenario:
      "200 candidate handoffs/month, 8hr avg wait at $40/hr = $768K/year in candidate experience value.",
    commonApps: ["Greenhouse", "Lever", "Google Calendar", "Gmail", "Slack"],
    tags: ["applicants", "recruiting", "pipeline", "scheduling"],
    zapBundle: {
      zaps: [{
        title: "Applicant Pipeline Automation",
        description: "Auto-move candidates and schedule interviews",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Candidate Stage Changed", type: "trigger" },
          { app: "Google Calendar", action: "create_event", stepTitle: "Schedule Interview", type: "action" },
          { app: "Gmail", action: "send_email", stepTitle: "Send Status Update to Candidate", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Notify Hiring Manager", type: "action" },
        ],
      }],
    },
  },
  {
    id: "hr-compliance-training",
    name: "Compliance Training Tracking",
    description:
      "Auto-enroll employees in required training and alert on non-completion.",
    department: "hr",
    archetype: "compliance_assurance",
    dimension: "risk_quality",
    defaultInputs: {
      expectedViolationsPerYear: 5,
      avgPenaltyPerViolation: 10000,
      reductionRate: 0.50,
    },
    exampleScenario:
      "5 training compliance gaps/year, $10K avg penalty, 50% reduction = $25K/year.",
    commonApps: ["BambooHR", "Gmail", "Slack", "Google Sheets"],
    tags: ["compliance", "training", "enrollment", "tracking"],
    zapBundle: {
      zaps: [{
        title: "Compliance Training Tracker",
        description: "Auto-enroll and track required training completion",
        steps: [
          { app: "Schedule by Zapier", action: "every_week", stepTitle: "Weekly Training Check", type: "trigger" },
          { app: "Google Sheets", action: "lookup_row", stepTitle: "Check Training Status", type: "search" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Incomplete Training", type: "filter" },
          { app: "Gmail", action: "send_email", stepTitle: "Send Reminder Email", type: "action" },
        ],
      }],
    },
  },
];
