// ============================================================
// Value Packages
// Pre-built bundles of patterns for common business scenarios.
// Each package includes curated patterns, target roles, and
// a narrative framing for sales conversations.
// ============================================================

import type { Archetype, Dimension, Role } from "../types/roi";

// ============================================================
// Types
// ============================================================

export interface ValuePackagePattern {
  patternId: string;
  archetype: Archetype;
  name: string;
  description: string;
  estimatedAnnualValue: number;
  zapCount?: number;
  keyApps?: string[];
}

export interface ValuePackage {
  id: string;
  name: string;
  tagline: string;
  description: string;
  targetRoles: Role[];
  primaryDimension: Dimension;
  patterns: ValuePackagePattern[];
  narrative: string;
  estimatedTotalValue: number;
  difficulty: "starter" | "standard" | "advanced";
  implementationWeeks: number;
  tags: string[];
}

// ============================================================
// Curated Value Packages
// ============================================================

export const VALUE_PACKAGES: ValuePackage[] = [
  // 1. RevOps Acceleration
  {
    id: "revops-acceleration",
    name: "RevOps Acceleration",
    tagline: "Accelerate pipeline, capture more revenue, eliminate sales admin",
    description:
      "The complete revenue operations package: automate lead routing, deal progression, CRM hygiene, and renewal capture. Designed for teams where pipeline velocity and revenue leakage are top priorities.",
    targetRoles: ["revops", "sales_cs", "executive"],
    primaryDimension: "revenue_impact",
    patterns: [
      {
        patternId: "sales-lead-routing",
        archetype: "pipeline_velocity",
        name: "Automated Lead Routing & Assignment",
        description: "Route inbound leads to the right rep instantly",
        estimatedAnnualValue: 500000,
        zapCount: 1,
        keyApps: ["Salesforce", "Slack", "Filter by Zapier"],
      },
      {
        patternId: "sales-renewal-capture",
        archetype: "revenue_capture",
        name: "Renewal & Dunning Automation",
        description: "Catch expiring subscriptions before they churn",
        estimatedAnnualValue: 90000,
        zapCount: 1,
        keyApps: ["Stripe", "Gmail", "Filter by Zapier", "Salesforce"],
      },
      {
        patternId: "sales-crm-data-entry",
        archetype: "task_elimination",
        name: "CRM Data Entry Elimination",
        description: "Free reps from manual CRM logging",
        estimatedAnnualValue: 21600,
        zapCount: 2,
        keyApps: ["Gmail", "HubSpot", "Google Calendar", "Salesforce"],
      },
      {
        patternId: "sales-deal-alerts",
        archetype: "pipeline_velocity",
        name: "Deal Stage Progression Alerts",
        description: "Keep pipeline momentum with real-time alerts",
        estimatedAnnualValue: 200000,
        zapCount: 1,
        keyApps: ["HubSpot", "Slack", "Gmail"],
      },
    ],
    narrative:
      "Your revenue team spends too much time on admin and not enough time selling. This package eliminates the manual work that slows pipeline velocity, ensures no revenue leaks through the cracks, and gives reps back hours each week to focus on closing deals.",
    estimatedTotalValue: 811600,
    difficulty: "standard",
    implementationWeeks: 3,
    tags: ["revenue", "pipeline", "sales", "crm", "renewals"],
  },

  // 2. Marketing Ops Engine
  {
    id: "marketing-ops-engine",
    name: "Marketing Ops Engine",
    tagline: "Automate the full funnel from lead capture to pipeline",
    description:
      "End-to-end marketing operations: form capture, lead nurture, campaign attribution, and content distribution. For marketing teams drowning in manual campaign management.",
    targetRoles: ["marketing", "revops"],
    primaryDimension: "revenue_impact",
    patterns: [
      {
        patternId: "mktg-lead-nurture",
        archetype: "pipeline_velocity",
        name: "Lead Nurture Sequence Automation",
        description: "Auto-enroll leads based on behavior signals",
        estimatedAnnualValue: 160000,
        zapCount: 1,
        keyApps: ["HubSpot", "Gmail", "Slack", "Filter by Zapier"],
      },
      {
        patternId: "mktg-form-to-crm",
        archetype: "task_elimination",
        name: "Form Capture to CRM Pipeline",
        description: "Route submissions with enrichment and scoring",
        estimatedAnnualValue: 15000,
        zapCount: 1,
        keyApps: ["Typeform", "HubSpot", "Formatter by Zapier", "Slack"],
      },
      {
        patternId: "mktg-campaign-attribution",
        archetype: "data_integrity",
        name: "Campaign Attribution Sync",
        description: "Keep attribution data clean across platforms",
        estimatedAnnualValue: 45000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Formatter by Zapier", "Google Sheets", "HubSpot"],
      },
      {
        patternId: "mktg-content-distribution",
        archetype: "task_elimination",
        name: "Content Distribution Workflow",
        description: "Auto-distribute content across all channels",
        estimatedAnnualValue: 13200,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Slack", "Zapier Tables"],
      },
    ],
    narrative:
      "Marketing teams waste hours every week on campaign admin: copying form data to CRM, manually distributing content, chasing attribution discrepancies. This package automates the operational backbone of marketing so your team can focus on strategy and creative.",
    estimatedTotalValue: 233200,
    difficulty: "standard",
    implementationWeeks: 3,
    tags: ["marketing", "leads", "campaigns", "attribution", "content"],
  },

  // 3. IT Governance & Efficiency
  {
    id: "it-governance",
    name: "IT Governance & Efficiency",
    tagline: "Secure provisioning, tool consolidation, data integrity",
    description:
      "For IT teams managing tool sprawl, manual provisioning, and data inconsistency. Combines security compliance with operational efficiency.",
    targetRoles: ["it", "executive"],
    primaryDimension: "risk_quality",
    patterns: [
      {
        patternId: "it-user-provisioning",
        archetype: "task_elimination",
        name: "Employee Onboarding Provisioning",
        description: "Auto-provision accounts on new hire",
        estimatedAnnualValue: 20300,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Slack"],
      },
      {
        patternId: "it-deprovisioning",
        archetype: "compliance_assurance",
        name: "Offboarding & Access Revocation",
        description: "Auto-revoke access on termination",
        estimatedAnnualValue: 90000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Slack", "Gmail"],
      },
      {
        patternId: "it-tool-consolidation",
        archetype: "tool_consolidation",
        name: "Tool Sprawl Consolidation",
        description: "Replace standalone middleware tools",
        estimatedAnnualValue: 36000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Zapier Tables"],
      },
      {
        patternId: "it-data-sync",
        archetype: "data_integrity",
        name: "Cross-System Data Synchronization",
        description: "Keep data consistent across all systems",
        estimatedAnnualValue: 72000,
        zapCount: 2,
        keyApps: ["Salesforce", "HubSpot", "Code by Zapier", "Zapier Tables"],
      },
    ],
    narrative:
      "IT is the backbone of every company, but manual provisioning, tool sprawl, and data inconsistency create security risks and waste budget. This package automates the most impactful IT operations while strengthening governance and compliance.",
    estimatedTotalValue: 218300,
    difficulty: "standard",
    implementationWeeks: 4,
    tags: ["it", "governance", "provisioning", "security", "compliance"],
  },

  // 4. Finance Close Accelerator
  {
    id: "finance-close-accelerator",
    name: "Finance Close Accelerator",
    tagline: "Faster close, fewer errors, better compliance",
    description:
      "Accelerate month-end close, automate AP processing, and ensure compliance. For finance teams where close takes too long and errors are costly.",
    targetRoles: ["finance", "executive"],
    primaryDimension: "speed_cycle_time",
    patterns: [
      {
        patternId: "finance-month-end-close",
        archetype: "process_acceleration",
        name: "Month-End Close Acceleration",
        description: "Cut close time by 50-60%",
        estimatedAnnualValue: 40300,
        zapCount: 1,
        keyApps: ["Schedule by Zapier", "Google Sheets", "Code by Zapier", "Slack"],
      },
      {
        patternId: "finance-ap-automation",
        archetype: "task_elimination",
        name: "Accounts Payable Processing",
        description: "Auto-capture and route invoices",
        estimatedAnnualValue: 27000,
        zapCount: 1,
        keyApps: ["Gmail", "Formatter by Zapier", "Google Sheets", "Slack"],
      },
      {
        patternId: "finance-revenue-rec",
        archetype: "error_rework_elimination",
        name: "Revenue Recognition Automation",
        description: "Eliminate rev rec errors",
        estimatedAnnualValue: 63000,
        zapCount: 1,
        keyApps: ["Salesforce", "Code by Zapier", "Google Sheets", "Slack"],
      },
      {
        patternId: "finance-expense-compliance",
        archetype: "compliance_assurance",
        name: "Expense Policy Compliance",
        description: "Auto-flag policy violations",
        estimatedAnnualValue: 39600,
        zapCount: 1,
        keyApps: ["Schedule by Zapier", "Google Sheets", "Filter by Zapier", "Gmail"],
      },
    ],
    narrative:
      "Month-end close is still a manual grind at most companies. This package targets the biggest time sinks: reconciliation, invoice processing, and revenue recognition. The result: faster close, fewer errors, and audit-ready compliance.",
    estimatedTotalValue: 169900,
    difficulty: "advanced",
    implementationWeeks: 5,
    tags: ["finance", "close", "ap", "compliance", "accounting"],
  },

  // 5. HR People Ops Automation
  {
    id: "hr-people-ops",
    name: "HR People Ops Automation",
    tagline: "Streamline onboarding, offboarding, and compliance",
    description:
      "Automate the employee lifecycle from hire to exit. Consistent onboarding, secure offboarding, and compliance training tracking.",
    targetRoles: ["hr"],
    primaryDimension: "speed_cycle_time",
    patterns: [
      {
        patternId: "hr-onboarding-workflow",
        archetype: "process_acceleration",
        name: "New Hire Onboarding Workflow",
        description: "Automated onboarding checklist execution",
        estimatedAnnualValue: 45000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Gmail", "Google Sheets", "Slack"],
      },
      {
        patternId: "hr-offboarding",
        archetype: "process_consistency",
        name: "Employee Offboarding Automation",
        description: "Consistent, secure offboarding every time",
        estimatedAnnualValue: 12600,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Zapier Tables", "Slack", "Gmail"],
      },
      {
        patternId: "hr-pto-tracking",
        archetype: "task_elimination",
        name: "PTO & Leave Management Automation",
        description: "Sync leave requests across systems",
        estimatedAnnualValue: 9000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Google Calendar", "Slack"],
      },
      {
        patternId: "hr-compliance-training",
        archetype: "compliance_assurance",
        name: "Compliance Training Tracking",
        description: "Auto-enroll and track required training",
        estimatedAnnualValue: 25000,
        zapCount: 1,
        keyApps: ["Schedule by Zapier", "Google Sheets", "Filter by Zapier", "Gmail"],
      },
    ],
    narrative:
      "Every employee lifecycle event touches multiple systems and stakeholders. Manual handoffs create delays, missed steps, and compliance gaps. This package ensures every hire, departure, and training requirement is handled consistently and on time.",
    estimatedTotalValue: 91600,
    difficulty: "starter",
    implementationWeeks: 2,
    tags: ["hr", "onboarding", "offboarding", "compliance", "people-ops"],
  },

  // 6. Engineering Velocity
  {
    id: "engineering-velocity",
    name: "Engineering Velocity",
    tagline: "Ship faster with less toil and fewer incidents",
    description:
      "Developer productivity package: CI/CD notifications, incident response, issue sync, and release automation. Reclaim engineering time lost to operational overhead.",
    targetRoles: ["engineering"],
    primaryDimension: "productivity",
    patterns: [
      {
        patternId: "eng-ci-cd-notifications",
        archetype: "context_surfacing",
        name: "CI/CD Pipeline Notifications",
        description: "Real-time build and deploy alerts",
        estimatedAnnualValue: 31200,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Filter by Zapier", "Slack"],
      },
      {
        patternId: "eng-incident-response",
        archetype: "incident_prevention",
        name: "Incident Response Orchestration",
        description: "Auto-create channels and page on-call",
        estimatedAnnualValue: 54000,
        zapCount: 2,
        keyApps: ["Webhooks by Zapier", "Slack", "Google Sheets"],
      },
      {
        patternId: "eng-issue-tracking-sync",
        archetype: "task_elimination",
        name: "Issue Tracking Cross-Sync",
        description: "Keep Jira, GitHub, and Linear in sync",
        estimatedAnnualValue: 26400,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier"],
      },
      {
        patternId: "eng-pr-review-workflow",
        archetype: "handoff_elimination",
        name: "PR Review & Merge Automation",
        description: "Faster code review cycles",
        estimatedAnnualValue: 316800,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Slack"],
      },
    ],
    narrative:
      "Engineering teams lose significant productivity to operational toil: context-switching between tools, waiting for code reviews, manually managing incidents. This package automates the operational overhead so engineers can focus on building.",
    estimatedTotalValue: 428400,
    difficulty: "standard",
    implementationWeeks: 3,
    tags: ["engineering", "developer", "ci-cd", "incidents", "velocity"],
  },

  // 7. Support Excellence
  {
    id: "support-excellence",
    name: "Support Excellence",
    tagline: "Faster resolution, happier customers, fewer escalations",
    description:
      "Optimize support operations: auto-triage tickets, surface knowledge, enforce SLAs, and detect churn risk. For support teams scaling beyond manual processes.",
    targetRoles: ["support", "sales_cs"],
    primaryDimension: "speed_cycle_time",
    patterns: [
      {
        patternId: "support-ticket-triage",
        archetype: "process_acceleration",
        name: "Ticket Auto-Triage & Priority Assignment",
        description: "Classify and route tickets instantly",
        estimatedAnnualValue: 18500,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Slack"],
      },
      {
        patternId: "support-knowledge-surfacing",
        archetype: "context_surfacing",
        name: "Knowledge Base Article Suggestions",
        description: "Surface relevant articles automatically",
        estimatedAnnualValue: 28000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Slack"],
      },
      {
        patternId: "support-escalation-workflow",
        archetype: "compliance_assurance",
        name: "Escalation & SLA Management",
        description: "Prevent SLA breaches with auto-escalation",
        estimatedAnnualValue: 60000,
        zapCount: 1,
        keyApps: ["Schedule by Zapier", "Zapier Tables", "Filter by Zapier", "Slack"],
      },
      {
        patternId: "support-customer-health",
        archetype: "revenue_capture",
        name: "Customer Health Score Alerting",
        description: "Detect churn risk from usage signals",
        estimatedAnnualValue: 75000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Filter by Zapier", "Slack"],
      },
    ],
    narrative:
      "Support teams face a constant tension: faster resolution vs. quality. This package removes that tradeoff by automating triage, surfacing knowledge proactively, and catching churn signals before they become cancellations.",
    estimatedTotalValue: 181500,
    difficulty: "standard",
    implementationWeeks: 3,
    tags: ["support", "tickets", "sla", "knowledge", "churn"],
  },

  // 8. Operations Scaling
  {
    id: "operations-scaling",
    name: "Operations Scaling",
    tagline: "Handle 10x volume without 10x headcount",
    description:
      "Scale operations with automation instead of hiring. Order processing, quality checks, vendor communication, and data entry elimination.",
    targetRoles: ["supply_chain", "executive"],
    primaryDimension: "cost_avoidance",
    patterns: [
      {
        patternId: "ops-order-processing",
        archetype: "process_acceleration",
        name: "Order Processing Automation",
        description: "Route orders from intake to fulfillment",
        estimatedAnnualValue: 56700,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Google Sheets", "Slack"],
      },
      {
        patternId: "ops-labor-avoidance",
        archetype: "labor_avoidance",
        name: "Volume Scaling Without Headcount",
        description: "Avoid 2+ FTE hires with automation",
        estimatedAnnualValue: 160000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Zapier Tables", "Slack"],
      },
      {
        patternId: "ops-data-entry-elimination",
        archetype: "task_elimination",
        name: "Cross-System Data Entry Elimination",
        description: "Stop re-keying data between systems",
        estimatedAnnualValue: 32000,
        zapCount: 1,
        keyApps: ["Google Sheets", "Formatter by Zapier", "Salesforce"],
      },
      {
        patternId: "ops-quality-checks",
        archetype: "process_consistency",
        name: "Automated Quality Check Workflows",
        description: "Catch defects before they reach customers",
        estimatedAnnualValue: 31200,
        zapCount: 1,
        keyApps: ["Schedule by Zapier", "Google Sheets", "Code by Zapier", "Slack"],
      },
    ],
    narrative:
      "Growth is great until operations can't keep up. This package is for teams hitting a scaling wall: processing volume is outpacing headcount, errors are creeping in, and hiring isn't fast enough. Automation handles the volume while your team handles the exceptions.",
    estimatedTotalValue: 279900,
    difficulty: "standard",
    implementationWeeks: 4,
    tags: ["operations", "scaling", "labor", "quality", "orders"],
  },

  // 9. Data & Compliance Foundation
  {
    id: "data-compliance-foundation",
    name: "Data & Compliance Foundation",
    tagline: "Clean data, proven compliance, zero audit anxiety",
    description:
      "Cross-functional data integrity and compliance automation. For organizations where data quality and regulatory compliance are existential concerns.",
    targetRoles: ["it", "finance", "executive"],
    primaryDimension: "risk_quality",
    patterns: [
      {
        patternId: "it-data-sync",
        archetype: "data_integrity",
        name: "Cross-System Data Synchronization",
        description: "Consistent data across all systems",
        estimatedAnnualValue: 72000,
        zapCount: 2,
        keyApps: ["Salesforce", "HubSpot", "Code by Zapier", "Zapier Tables"],
      },
      {
        patternId: "it-deprovisioning",
        archetype: "compliance_assurance",
        name: "Offboarding & Access Revocation",
        description: "Secure access management on exit",
        estimatedAnnualValue: 90000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Code by Zapier", "Slack", "Gmail"],
      },
      {
        patternId: "finance-expense-compliance",
        archetype: "compliance_assurance",
        name: "Expense Policy Compliance",
        description: "Auto-enforce spending policies",
        estimatedAnnualValue: 39600,
        zapCount: 1,
        keyApps: ["Schedule by Zapier", "Google Sheets", "Filter by Zapier", "Gmail"],
      },
      {
        patternId: "mktg-campaign-attribution",
        archetype: "data_integrity",
        name: "Campaign Attribution Sync",
        description: "Clean marketing data across platforms",
        estimatedAnnualValue: 45000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Formatter by Zapier", "Google Sheets", "HubSpot"],
      },
    ],
    narrative:
      "Data quality issues and compliance gaps are silent killers. They don't show up until an audit, a missed renewal, or a security incident. This package builds the automated foundation that keeps data clean and compliance provable.",
    estimatedTotalValue: 246600,
    difficulty: "advanced",
    implementationWeeks: 5,
    tags: ["data", "compliance", "governance", "audit", "integrity"],
  },

  // 10. Quick Wins Starter
  {
    id: "quick-wins-starter",
    name: "Quick Wins Starter",
    tagline: "Prove value fast with high-impact, low-effort automations",
    description:
      "The fastest path to demonstrating ROI. Four simple automations that show immediate time savings. Perfect for getting organizational buy-in before larger initiatives.",
    targetRoles: ["executive", "revops", "it", "marketing", "sales_cs", "hr", "finance", "engineering", "support", "supply_chain"],
    primaryDimension: "productivity",
    patterns: [
      {
        patternId: "sales-crm-data-entry",
        archetype: "task_elimination",
        name: "CRM Data Entry Elimination",
        description: "Free reps from manual CRM logging",
        estimatedAnnualValue: 21600,
        zapCount: 2,
        keyApps: ["Gmail", "HubSpot", "Google Calendar", "Salesforce"],
      },
      {
        patternId: "mktg-form-to-crm",
        archetype: "task_elimination",
        name: "Form Capture to CRM Pipeline",
        description: "Route form submissions automatically",
        estimatedAnnualValue: 15000,
        zapCount: 1,
        keyApps: ["Typeform", "HubSpot", "Formatter by Zapier", "Slack"],
      },
      {
        patternId: "hr-pto-tracking",
        archetype: "task_elimination",
        name: "PTO & Leave Management Automation",
        description: "Auto-sync leave across systems",
        estimatedAnnualValue: 9000,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Google Calendar", "Slack"],
      },
      {
        patternId: "support-csat-followup",
        archetype: "task_elimination",
        name: "CSAT Survey & Follow-Up Automation",
        description: "Automated post-interaction surveys",
        estimatedAnnualValue: 17500,
        zapCount: 1,
        keyApps: ["Webhooks by Zapier", "Gmail", "Zapier Tables"],
      },
    ],
    narrative:
      "Start here. These four automations each take less than an hour to set up and deliver immediate, visible time savings. They're the proof points that build the case for larger automation initiatives.",
    estimatedTotalValue: 63100,
    difficulty: "starter",
    implementationWeeks: 1,
    tags: ["quick-wins", "starter", "proof-of-value", "low-effort"],
  },
];

// ============================================================
// Lookup utilities
// ============================================================

/** Get packages suitable for a given role */
export function getPackagesByRole(role: Role): ValuePackage[] {
  return VALUE_PACKAGES.filter((p) => p.targetRoles.includes(role));
}

/** Get packages by difficulty level */
export function getPackagesByDifficulty(
  difficulty: ValuePackage["difficulty"],
): ValuePackage[] {
  return VALUE_PACKAGES.filter((p) => p.difficulty === difficulty);
}

/** Get a package by ID */
export function getPackageById(id: string): ValuePackage | undefined {
  return VALUE_PACKAGES.find((p) => p.id === id);
}

/** Search packages by name, description, or tags */
export function searchPackages(query: string): ValuePackage[] {
  const q = query.toLowerCase();
  return VALUE_PACKAGES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
