// ============================================================
// Engineering Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const ENGINEERING_PATTERNS: PatternTemplate[] = [
  {
    id: "eng-ci-cd-notifications",
    name: "CI/CD Pipeline Notifications",
    description:
      "Auto-notify teams on build failures, deployment status, and test results.",
    department: "engineering",
    archetype: "context_surfacing",
    dimension: "productivity",
    defaultInputs: {
      meetingsAvoidedPerMonth: 8,
      attendeesPerMeeting: 4,
      meetingDurationHrs: 0.5,
      meetingHourlyRate: 100,
      searchesAvoidedPerMonth: 60,
      avgSearchTimeMin: 10,
      searchHourlyRate: 100,
    },
    exampleScenario:
      "8 status meetings avoided (4 eng, 30min, $100/hr) + 60 build status checks saved = $31.2K/year.",
    commonApps: ["GitHub", "Slack", "PagerDuty", "Datadog"],
    tags: ["ci-cd", "deployments", "build-status", "notifications"],
    zapBundle: {
      zaps: [{
        title: "CI/CD Pipeline Notifications",
        description: "Real-time build and deploy alerts to Slack",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Build/Deploy Webhook", type: "trigger" },
          { app: "Filter by Zapier", action: "filter", stepTitle: "Filter Failures Only", type: "filter" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Post Build Status to Engineering", type: "action" },
        ],
      }],
    },
  },
  {
    id: "eng-incident-response",
    name: "Incident Response Orchestration",
    description:
      "Auto-create incident channels, page on-call, and compile runbooks when alerts fire.",
    department: "engineering",
    archetype: "incident_prevention",
    dimension: "risk_quality",
    defaultInputs: {
      incidentsPerYear: 36,
      avgCostPerIncident: 5000,
      reductionRate: 0.30,
    },
    exampleScenario:
      "36 incidents/year, $5K avg impact, 30% faster resolution = $54K/year.",
    commonApps: ["PagerDuty", "Slack", "Jira", "Datadog"],
    tags: ["incidents", "on-call", "alerting", "response"],
    zapBundle: {
      zaps: [
        {
          title: "Incident Response Channel Creator",
          description: "Auto-create incident channel and compile runbook",
          steps: [
            { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Alert Fired", type: "trigger" },
            { app: "Slack", action: "send_channel_message", stepTitle: "Create Incident Channel & Post Context", type: "action" },
          ],
        },
        {
          title: "Incident Resolution Tracker",
          description: "Track resolution and notify stakeholders",
          steps: [
            { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Incident Resolved", type: "trigger" },
            { app: "Google Sheets", action: "create_spreadsheet_row", stepTitle: "Log Incident Metrics", type: "action" },
            { app: "Slack", action: "send_channel_message", stepTitle: "Post Resolution Summary", type: "action" },
          ],
        },
      ],
    },
  },
  {
    id: "eng-issue-tracking-sync",
    name: "Issue Tracking Cross-Sync",
    description:
      "Keep Jira, GitHub Issues, and Linear in sync. Eliminate duplicate data entry across tools.",
    department: "engineering",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 300,
      minutesPerTask: 5,
      hourlyRate: 88,
    },
    exampleScenario:
      "300 issue updates/month, 5 min duplicate entry at $88/hr = $26.4K/year.",
    commonApps: ["Jira", "GitHub", "Linear", "Slack"],
    tags: ["jira", "github", "issues", "sync", "tracking"],
    zapBundle: {
      zaps: [{
        title: "Issue Tracker Cross-Sync",
        description: "Keep Jira and GitHub issues in sync",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Issue Updated in Source", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Map Fields Between Systems", type: "action" },
          { app: "Webhooks by Zapier", action: "post", stepTitle: "Sync to Destination", type: "action" },
        ],
      }],
    },
  },
  {
    id: "eng-pr-review-workflow",
    name: "PR Review & Merge Automation",
    description:
      "Auto-assign reviewers, notify on approval, and trigger post-merge actions.",
    department: "engineering",
    archetype: "handoff_elimination",
    dimension: "speed_cycle_time",
    defaultInputs: {
      handoffsPerMonth: 150,
      avgQueueTimeHrs: 2,
      hourlyRateOfWaitingParty: 88,
    },
    exampleScenario:
      "150 PRs/month, 2hr avg review wait at $88/hr = $316.8K/year in developer wait time.",
    commonApps: ["GitHub", "Slack", "Linear", "Jira"],
    tags: ["pr", "review", "code-review", "merge", "developer-velocity"],
    zapBundle: {
      zaps: [{
        title: "PR Review & Merge Automation",
        description: "Auto-assign reviewers and notify on approval",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "New PR Opened", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Determine Reviewer Assignment", type: "action" },
          { app: "Slack", action: "send_direct_message", stepTitle: "Notify Assigned Reviewer", type: "action" },
        ],
      }],
    },
  },
  {
    id: "eng-release-management",
    name: "Release Notes & Changelog Automation",
    description:
      "Auto-generate release notes from merged PRs and notify stakeholders.",
    department: "engineering",
    archetype: "task_simplification",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 8,
      minutesSavedPerTask: 60,
      hourlyRate: 88,
    },
    exampleScenario:
      "8 releases/month, 1hr saved per release at $88/hr = $8.4K/year.",
    commonApps: ["GitHub", "Slack", "Notion", "Gmail"],
    tags: ["releases", "changelog", "notes", "documentation"],
    zapBundle: {
      zaps: [{
        title: "Release Notes Auto-Generation",
        description: "Auto-generate release notes from merged PRs",
        steps: [
          { app: "Webhooks by Zapier", action: "catch_hook", stepTitle: "Release Tag Created", type: "trigger" },
          { app: "Code by Zapier", action: "run_javascript", stepTitle: "Compile PR Summaries", type: "action" },
          { app: "Slack", action: "send_channel_message", stepTitle: "Post Release Notes", type: "action" },
          { app: "Gmail", action: "send_email", stepTitle: "Email Stakeholders", type: "action" },
        ],
      }],
    },
  },
];
