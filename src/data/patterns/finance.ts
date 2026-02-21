// ============================================================
// Finance Department Patterns
// ============================================================

import type { PatternTemplate } from "./index";

export const FINANCE_PATTERNS: PatternTemplate[] = [
  {
    id: "finance-month-end-close",
    name: "Month-End Close Acceleration",
    description:
      "Automate reconciliation, journal entry prep, and variance reporting to speed up monthly close.",
    department: "finance",
    archetype: "process_acceleration",
    dimension: "speed_cycle_time",
    defaultInputs: {
      processesPerMonth: 1,
      timeBeforeHrs: 80,
      timeAfterHrs: 32,
      hourlyRate: 70,
    },
    exampleScenario:
      "Monthly close reduced from 10 days (80 hrs) to 4 days (32 hrs) at $70/hr = $40.3K/year.",
    commonApps: ["QuickBooks", "Xero", "Google Sheets", "Slack"],
    tags: ["month-end", "close", "reconciliation", "accounting"],
  },
  {
    id: "finance-ap-automation",
    name: "Accounts Payable Processing",
    description:
      "Auto-capture invoices, route for approval, and sync to accounting system.",
    department: "finance",
    archetype: "task_elimination",
    dimension: "productivity",
    defaultInputs: {
      tasksPerMonth: 200,
      minutesPerTask: 15,
      hourlyRate: 45,
    },
    exampleScenario:
      "200 invoices/month, 15 min manual processing each at $45/hr = $27K/year.",
    commonApps: ["Gmail", "QuickBooks", "Google Sheets", "Slack"],
    tags: ["ap", "invoices", "payables", "approval-routing"],
  },
  {
    id: "finance-expense-compliance",
    name: "Expense Policy Compliance",
    description:
      "Auto-flag expense reports that violate policy limits before approval.",
    department: "finance",
    archetype: "compliance_assurance",
    dimension: "risk_quality",
    defaultInputs: {
      expectedViolationsPerYear: 12,
      avgPenaltyPerViolation: 5000,
      reductionRate: 0.55,
    },
    exampleScenario:
      "12 violations/year, $5K avg cost, 55% reduction = $39.6K/year.",
    commonApps: ["Expensify", "Google Sheets", "Slack", "Gmail"],
    tags: ["expenses", "compliance", "policy", "audit"],
  },
  {
    id: "finance-revenue-rec",
    name: "Revenue Recognition Automation",
    description:
      "Auto-capture contract changes and calculate revenue recognition per ASC 606.",
    department: "finance",
    archetype: "error_rework_elimination",
    dimension: "cost_avoidance",
    defaultInputs: {
      errorsPerMonth: 15,
      avgCostPerError: 500,
      reductionRate: 0.70,
    },
    exampleScenario:
      "15 rev rec errors/month, $500 avg cost, 70% reduction = $63K/year.",
    commonApps: ["Salesforce", "QuickBooks", "Google Sheets", "Stripe"],
    tags: ["rev-rec", "asc-606", "revenue", "recognition"],
  },
  {
    id: "finance-budget-variance",
    name: "Budget vs Actual Variance Alerts",
    description:
      "Auto-calculate budget variances and alert managers when spending exceeds thresholds.",
    department: "finance",
    archetype: "context_surfacing",
    dimension: "productivity",
    defaultInputs: {
      meetingsAvoidedPerMonth: 4,
      attendeesPerMeeting: 5,
      meetingDurationHrs: 1,
      meetingHourlyRate: 80,
      searchesAvoidedPerMonth: 20,
      avgSearchTimeMin: 20,
      searchHourlyRate: 60,
    },
    exampleScenario:
      "4 budget review meetings avoided (5 people, 1hr, $80/hr) + 20 searches saved = $23K/year.",
    commonApps: ["Google Sheets", "Slack", "QuickBooks", "Schedule"],
    tags: ["budget", "variance", "alerts", "reporting"],
  },
];
