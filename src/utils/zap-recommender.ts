// ============================================================
// Zap Recommender
// Maps archetypes to common Zap patterns. Given an archetype
// and use case context, recommends Zap architectures.
// ============================================================

import type { Archetype, Dimension } from "../types/roi";
import { ARCHETYPE_DIMENSION } from "../types/roi";
import { generatePrefillUrl } from "./zapier-api";
import { ALL_PATTERNS } from "../data/patterns/index";
import type { ZapBundleConfig } from "./zap-template-generator";

// ============================================================
// Types
// ============================================================

export interface ZapRecommendation {
  title: string;
  description: string;
  steps: Array<{
    action: string;
    suggestedApp: string;
    appImageUrl?: string;
    actionTitle: string;
    inputs?: Record<string, string>;
  }>;
  prefillUrl?: string;
}

interface UseCaseContext {
  name: string;
  department?: string;
  description?: string;
}

// ============================================================
// Archetype-specific recommendation templates
// ============================================================

interface RecommendationTemplate {
  title: string;
  description: string;
  steps: Array<{
    action: string;
    suggestedApp: string;
    actionTitle: string;
  }>;
}

const ARCHETYPE_TEMPLATES: Record<Archetype, RecommendationTemplate[]> = {
  task_elimination: [
    {
      title: "CRM to Spreadsheet Sync",
      description:
        "Automatically sync new CRM records to a spreadsheet, eliminating manual data entry.",
      steps: [
        {
          action: "SalesforceCLIAPI.new_record",
          suggestedApp: "Salesforce",
          actionTitle: "New Record in Salesforce",
        },
        {
          action: "GoogleSheetsCLIAPI.create_spreadsheet_row",
          suggestedApp: "Google Sheets",
          actionTitle: "Create Row in Google Sheets",
        },
      ],
    },
    {
      title: "Form Submission to Database",
      description:
        "Route form submissions directly to your database, removing copy-paste work.",
      steps: [
        {
          action: "TypeformCLIAPI.new_entry",
          suggestedApp: "Typeform",
          actionTitle: "New Entry in Typeform",
        },
        {
          action: "ZapierTablesCLIAPI.create_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "Create Record in Zapier Tables",
        },
      ],
    },
    {
      title: "Email to CRM Logging",
      description:
        "Automatically log important emails as CRM activities, eliminating manual logging.",
      steps: [
        {
          action: "GmailCLIAPI.new_email",
          suggestedApp: "Gmail",
          actionTitle: "New Email Matching Search",
        },
        {
          action: "HubSpotCLIAPI.create_engagement",
          suggestedApp: "HubSpot",
          actionTitle: "Create Engagement in HubSpot",
        },
      ],
    },
  ],

  pipeline_velocity: [
    {
      title: "Lead Routing & Notification",
      description:
        "Route new leads to the right rep instantly with automated assignment and alerts.",
      steps: [
        {
          action: "SalesforceCLIAPI.new_lead",
          suggestedApp: "Salesforce",
          actionTitle: "New Lead in Salesforce",
        },
        {
          action: "FilterCLIAPI.filter",
          suggestedApp: "Filter by Zapier",
          actionTitle: "Filter by Lead Score/Region",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Notify Assigned Rep in Slack",
        },
      ],
    },
    {
      title: "Deal Stage Progression Alerts",
      description:
        "Notify stakeholders when deals advance stages, keeping momentum high.",
      steps: [
        {
          action: "HubSpotCLIAPI.deal_updated",
          suggestedApp: "HubSpot",
          actionTitle: "Deal Stage Changed",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Post Deal Update to Sales Channel",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Email Stakeholder Summary",
        },
      ],
    },
  ],

  process_acceleration: [
    {
      title: "Multi-Step Workflow Automation",
      description:
        "Trigger a multi-step workflow from an app event, processing data and notifying stakeholders.",
      steps: [
        {
          action: "WebhookCLIAPI.catch_hook",
          suggestedApp: "Webhooks by Zapier",
          actionTitle: "Catch Webhook Trigger",
        },
        {
          action: "CodeCLIAPI.run_javascript",
          suggestedApp: "Code by Zapier",
          actionTitle: "Transform & Validate Data",
        },
        {
          action: "GoogleSheetsCLIAPI.create_spreadsheet_row",
          suggestedApp: "Google Sheets",
          actionTitle: "Log to Tracking Sheet",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Notify Team of Completion",
        },
      ],
    },
    {
      title: "Approval Workflow Acceleration",
      description:
        "Automate approval routing to eliminate manual handoffs and bottlenecks.",
      steps: [
        {
          action: "FormCLIAPI.new_submission",
          suggestedApp: "Zapier Interfaces",
          actionTitle: "New Approval Request Submitted",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Send Approval Request Email",
        },
        {
          action: "ZapierTablesCLIAPI.update_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "Update Status in Tracker",
        },
      ],
    },
  ],

  tool_consolidation: [
    {
      title: "Replace Middleware with Zapier Tables",
      description:
        "Use Zapier Tables as the central hub, eliminating standalone middleware tools.",
      steps: [
        {
          action: "AppACLIAPI.trigger",
          suggestedApp: "Source App",
          actionTitle: "New/Updated Record in Source",
        },
        {
          action: "ZapierTablesCLIAPI.create_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "Store in Zapier Tables",
        },
        {
          action: "AppBCLIAPI.create",
          suggestedApp: "Destination App",
          actionTitle: "Sync to Destination",
        },
      ],
    },
    {
      title: "Consolidate Notification Tools",
      description:
        "Replace multiple notification services with unified Slack/email alerts via Zapier.",
      steps: [
        {
          action: "ScheduleCLIAPI.every_hour",
          suggestedApp: "Schedule by Zapier",
          actionTitle: "Scheduled Check",
        },
        {
          action: "ZapierTablesCLIAPI.find_records",
          suggestedApp: "Zapier Tables",
          actionTitle: "Query Pending Notifications",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Send Consolidated Alert",
        },
      ],
    },
  ],

  error_rework_elimination: [
    {
      title: "Webhook Validation & Error Alerting",
      description:
        "Validate incoming data and alert on errors before they propagate downstream.",
      steps: [
        {
          action: "WebhookCLIAPI.catch_hook",
          suggestedApp: "Webhooks by Zapier",
          actionTitle: "Receive Data via Webhook",
        },
        {
          action: "CodeCLIAPI.run_javascript",
          suggestedApp: "Code by Zapier",
          actionTitle: "Validate & Flag Errors",
        },
        {
          action: "FilterCLIAPI.filter",
          suggestedApp: "Filter by Zapier",
          actionTitle: "Route Valid vs Invalid",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Alert Team on Errors",
        },
      ],
    },
    {
      title: "Data Entry Error Prevention",
      description:
        "Use form validation and auto-formatting to prevent errors at the point of entry.",
      steps: [
        {
          action: "FormCLIAPI.new_submission",
          suggestedApp: "Zapier Interfaces",
          actionTitle: "New Form Submission",
        },
        {
          action: "FormatterCLIAPI.text",
          suggestedApp: "Formatter by Zapier",
          actionTitle: "Standardize & Clean Data",
        },
        {
          action: "SalesforceCLIAPI.create_record",
          suggestedApp: "Salesforce",
          actionTitle: "Create Clean Record in CRM",
        },
      ],
    },
  ],

  compliance_assurance: [
    {
      title: "Scheduled Compliance Audit Check",
      description:
        "Run scheduled checks against compliance rules and alert on violations.",
      steps: [
        {
          action: "ScheduleCLIAPI.every_day",
          suggestedApp: "Schedule by Zapier",
          actionTitle: "Daily Audit Schedule",
        },
        {
          action: "ZapierTablesCLIAPI.find_records",
          suggestedApp: "Zapier Tables",
          actionTitle: "Query Records for Compliance",
        },
        {
          action: "FilterCLIAPI.filter",
          suggestedApp: "Filter by Zapier",
          actionTitle: "Flag Non-Compliant Records",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Send Violation Alert",
        },
      ],
    },
    {
      title: "Document Retention Compliance",
      description:
        "Automate document retention policies to ensure regulatory compliance.",
      steps: [
        {
          action: "ScheduleCLIAPI.every_week",
          suggestedApp: "Schedule by Zapier",
          actionTitle: "Weekly Retention Check",
        },
        {
          action: "GoogleDriveCLIAPI.find_file",
          suggestedApp: "Google Drive",
          actionTitle: "Find Expiring Documents",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Notify Compliance Team",
        },
      ],
    },
  ],

  data_integrity: [
    {
      title: "Cross-System Data Sync & Validation",
      description:
        "Keep data consistent across systems with automated sync and validation checks.",
      steps: [
        {
          action: "SalesforceCLIAPI.updated_record",
          suggestedApp: "Salesforce",
          actionTitle: "Record Updated in Source",
        },
        {
          action: "CodeCLIAPI.run_javascript",
          suggestedApp: "Code by Zapier",
          actionTitle: "Validate Data Integrity",
        },
        {
          action: "HubSpotCLIAPI.update_contact",
          suggestedApp: "HubSpot",
          actionTitle: "Sync to Destination System",
        },
      ],
    },
    {
      title: "Duplicate Detection & Merge",
      description:
        "Detect and flag duplicate records across systems to maintain clean data.",
      steps: [
        {
          action: "ZapierTablesCLIAPI.new_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "New Record Created",
        },
        {
          action: "ZapierTablesCLIAPI.find_records",
          suggestedApp: "Zapier Tables",
          actionTitle: "Search for Duplicates",
        },
        {
          action: "FilterCLIAPI.filter",
          suggestedApp: "Filter by Zapier",
          actionTitle: "Filter Matches",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Alert on Potential Duplicates",
        },
      ],
    },
  ],

  // Revenue Impact archetypes
  revenue_capture: [
    {
      title: "Renewal & Dunning Automation",
      description:
        "Automatically catch expiring subscriptions and trigger renewal outreach.",
      steps: [
        {
          action: "StripeCLIAPI.subscription_updated",
          suggestedApp: "Stripe",
          actionTitle: "Subscription Status Change",
        },
        {
          action: "FilterCLIAPI.filter",
          suggestedApp: "Filter by Zapier",
          actionTitle: "Filter Expiring/Failed",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Send Renewal/Dunning Email",
        },
      ],
    },
  ],

  revenue_expansion: [
    {
      title: "Upsell Trigger Automation",
      description:
        "Detect usage milestones and trigger upsell outreach automatically.",
      steps: [
        {
          action: "WebhookCLIAPI.catch_hook",
          suggestedApp: "Webhooks by Zapier",
          actionTitle: "Usage Milestone Webhook",
        },
        {
          action: "SalesforceCLIAPI.update_record",
          suggestedApp: "Salesforce",
          actionTitle: "Update Account with Expansion Signal",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Notify CSM of Expansion Opportunity",
        },
      ],
    },
  ],

  time_to_revenue: [
    {
      title: "Onboarding Acceleration Workflow",
      description:
        "Automate onboarding steps to get new customers to value faster.",
      steps: [
        {
          action: "SalesforceCLIAPI.new_record",
          suggestedApp: "Salesforce",
          actionTitle: "New Customer Won",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Send Welcome & Onboarding Kit",
        },
        {
          action: "ZapierTablesCLIAPI.create_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "Create Onboarding Tracker Record",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Notify CS Team",
        },
      ],
    },
  ],

  handoff_elimination: [
    {
      title: "Automated Handoff Between Teams",
      description:
        "Eliminate manual handoffs by automatically routing work between teams.",
      steps: [
        {
          action: "SalesforceCLIAPI.updated_record",
          suggestedApp: "Salesforce",
          actionTitle: "Deal Stage Changed to Won",
        },
        {
          action: "HubSpotCLIAPI.create_ticket",
          suggestedApp: "HubSpot",
          actionTitle: "Create Onboarding Ticket",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Notify Implementation Team",
        },
      ],
    },
  ],

  task_simplification: [
    {
      title: "Report Auto-Generation",
      description:
        "Simplify recurring reporting by auto-pulling data and formatting it.",
      steps: [
        {
          action: "ScheduleCLIAPI.every_week",
          suggestedApp: "Schedule by Zapier",
          actionTitle: "Weekly Report Schedule",
        },
        {
          action: "GoogleSheetsCLIAPI.get_spreadsheet_row",
          suggestedApp: "Google Sheets",
          actionTitle: "Pull Latest Data",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Email Formatted Report",
        },
      ],
    },
  ],

  context_surfacing: [
    {
      title: "Meeting Prep Auto-Brief",
      description:
        "Automatically compile relevant context before meetings, reducing prep time.",
      steps: [
        {
          action: "GoogleCalendarCLIAPI.event_start",
          suggestedApp: "Google Calendar",
          actionTitle: "Meeting Starting Soon",
        },
        {
          action: "SalesforceCLIAPI.find_record",
          suggestedApp: "Salesforce",
          actionTitle: "Pull Account/Contact Details",
        },
        {
          action: "SlackCLIAPI.send_direct_message",
          suggestedApp: "Slack",
          actionTitle: "Send Context Brief via DM",
        },
      ],
    },
  ],

  labor_avoidance: [
    {
      title: "Volume Handling Without Headcount",
      description:
        "Handle growing volume with automation instead of hiring additional staff.",
      steps: [
        {
          action: "WebhookCLIAPI.catch_hook",
          suggestedApp: "Webhooks by Zapier",
          actionTitle: "Incoming Request",
        },
        {
          action: "CodeCLIAPI.run_javascript",
          suggestedApp: "Code by Zapier",
          actionTitle: "Process & Route",
        },
        {
          action: "ZapierTablesCLIAPI.create_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "Log & Track",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Alert Only on Exceptions",
        },
      ],
    },
  ],

  incident_prevention: [
    {
      title: "Proactive Monitoring & Alerting",
      description:
        "Monitor systems for anomalies and alert before incidents occur.",
      steps: [
        {
          action: "ScheduleCLIAPI.every_15_min",
          suggestedApp: "Schedule by Zapier",
          actionTitle: "Periodic Health Check",
        },
        {
          action: "WebhookCLIAPI.get",
          suggestedApp: "Webhooks by Zapier",
          actionTitle: "Query System Health Endpoint",
        },
        {
          action: "FilterCLIAPI.filter",
          suggestedApp: "Filter by Zapier",
          actionTitle: "Check Thresholds",
        },
        {
          action: "SlackCLIAPI.send_channel_message",
          suggestedApp: "Slack",
          actionTitle: "Alert on Anomaly",
        },
      ],
    },
  ],

  process_consistency: [
    {
      title: "Standardized Process Enforcement",
      description:
        "Ensure processes run identically every time with automated step enforcement.",
      steps: [
        {
          action: "FormCLIAPI.new_submission",
          suggestedApp: "Zapier Interfaces",
          actionTitle: "New Process Request",
        },
        {
          action: "CodeCLIAPI.run_javascript",
          suggestedApp: "Code by Zapier",
          actionTitle: "Apply Business Rules",
        },
        {
          action: "ZapierTablesCLIAPI.create_record",
          suggestedApp: "Zapier Tables",
          actionTitle: "Log Standardized Output",
        },
        {
          action: "GmailCLIAPI.send_email",
          suggestedApp: "Gmail",
          actionTitle: "Send Confirmation",
        },
      ],
    },
  ],
};

// ============================================================
// Dimension-level fallback patterns
// ============================================================

const DIMENSION_FALLBACKS: Record<Dimension, RecommendationTemplate> = {
  revenue_impact: {
    title: "Revenue Signal Automation",
    description:
      "Capture revenue signals from your systems and route them to the right team.",
    steps: [
      {
        action: "WebhookCLIAPI.catch_hook",
        suggestedApp: "Webhooks by Zapier",
        actionTitle: "Revenue Signal Trigger",
      },
      {
        action: "SalesforceCLIAPI.update_record",
        suggestedApp: "Salesforce",
        actionTitle: "Update CRM Record",
      },
      {
        action: "SlackCLIAPI.send_channel_message",
        suggestedApp: "Slack",
        actionTitle: "Notify Revenue Team",
      },
    ],
  },
  speed_cycle_time: {
    title: "Cycle Time Reduction Workflow",
    description:
      "Automate sequential steps in a process to eliminate manual delays.",
    steps: [
      {
        action: "AppCLIAPI.trigger",
        suggestedApp: "Trigger App",
        actionTitle: "Process Initiated",
      },
      {
        action: "CodeCLIAPI.run_javascript",
        suggestedApp: "Code by Zapier",
        actionTitle: "Process & Transform",
      },
      {
        action: "AppCLIAPI.action",
        suggestedApp: "Destination App",
        actionTitle: "Complete Next Step",
      },
    ],
  },
  productivity: {
    title: "Manual Task Automation",
    description:
      "Replace repetitive manual work with an automated workflow.",
    steps: [
      {
        action: "AppCLIAPI.trigger",
        suggestedApp: "Source App",
        actionTitle: "Task Trigger Event",
      },
      {
        action: "FormatterCLIAPI.text",
        suggestedApp: "Formatter by Zapier",
        actionTitle: "Format & Prepare Data",
      },
      {
        action: "AppCLIAPI.action",
        suggestedApp: "Destination App",
        actionTitle: "Complete Automated Task",
      },
    ],
  },
  cost_avoidance: {
    title: "Cost Prevention Workflow",
    description:
      "Automate detection and prevention of unnecessary costs.",
    steps: [
      {
        action: "ScheduleCLIAPI.every_day",
        suggestedApp: "Schedule by Zapier",
        actionTitle: "Scheduled Cost Check",
      },
      {
        action: "CodeCLIAPI.run_javascript",
        suggestedApp: "Code by Zapier",
        actionTitle: "Analyze for Cost Signals",
      },
      {
        action: "SlackCLIAPI.send_channel_message",
        suggestedApp: "Slack",
        actionTitle: "Alert on Cost Risk",
      },
    ],
  },
  risk_quality: {
    title: "Risk Monitoring & Prevention",
    description:
      "Monitor systems and processes for risk signals and take preventive action.",
    steps: [
      {
        action: "ScheduleCLIAPI.every_hour",
        suggestedApp: "Schedule by Zapier",
        actionTitle: "Periodic Risk Check",
      },
      {
        action: "CodeCLIAPI.run_javascript",
        suggestedApp: "Code by Zapier",
        actionTitle: "Evaluate Risk Criteria",
      },
      {
        action: "GmailCLIAPI.send_email",
        suggestedApp: "Gmail",
        actionTitle: "Send Risk Alert",
      },
    ],
  },
};

// ============================================================
// App substitution for connected apps
// ============================================================

const APP_SUBSTITUTIONS: Record<string, string[]> = {
  Salesforce: ["HubSpot", "Pipedrive", "Zoho CRM", "Close"],
  HubSpot: ["Salesforce", "Pipedrive", "Zoho CRM", "Close"],
  Gmail: ["Outlook", "Microsoft Outlook"],
  "Google Sheets": ["Airtable", "Excel", "Notion"],
  "Google Calendar": ["Outlook Calendar", "Microsoft Outlook"],
  "Google Drive": ["Dropbox", "OneDrive", "Box"],
  Slack: ["Microsoft Teams", "Discord"],
  Stripe: ["Chargebee", "Recurly", "Paddle"],
  Typeform: ["JotForm", "Google Forms", "Tally"],
};

function substituteApps(
  steps: RecommendationTemplate["steps"],
  connectedApps?: string[],
): RecommendationTemplate["steps"] {
  if (!connectedApps || connectedApps.length === 0) return steps;

  const connectedSet = new Set(
    connectedApps.map((a) => a.toLowerCase()),
  );

  return steps.map((step) => {
    // If the suggested app is already connected, keep it
    if (connectedSet.has(step.suggestedApp.toLowerCase())) return step;

    // Check if any connected app is a substitute
    const substitutes = APP_SUBSTITUTIONS[step.suggestedApp] ?? [];
    const match = substitutes.find((sub) =>
      connectedSet.has(sub.toLowerCase()),
    );

    if (match) {
      return { ...step, suggestedApp: match };
    }

    return step;
  });
}

// ============================================================
// Main recommendation function
// ============================================================

/**
 * Recommend Zap architectures based on archetype and use case context.
 * Returns 1-3 recommendations with pre-fill URLs for the Zap editor.
 */
export function recommendZapArchitecture(
  archetype: Archetype,
  useCase: UseCaseContext,
  connectedApps?: string[],
): ZapRecommendation[] {
  // Get archetype-specific templates, or fall back to dimension-level
  let templates = ARCHETYPE_TEMPLATES[archetype];

  if (!templates || templates.length === 0) {
    const dimension = ARCHETYPE_DIMENSION[archetype];
    const fallback = DIMENSION_FALLBACKS[dimension];
    templates = fallback ? [fallback] : [];
  }

  return templates.map((template) => {
    const substitutedSteps = substituteApps(template.steps, connectedApps);

    // Customize title with use case name if it adds context
    const title =
      useCase.name && useCase.name !== template.title
        ? `${template.title} for ${useCase.name}`
        : template.title;

    // Build the recommendation
    const recommendation: ZapRecommendation = {
      title,
      description: template.description,
      steps: substitutedSteps.map((step) => ({
        action: step.action,
        suggestedApp: step.suggestedApp,
        actionTitle: step.actionTitle,
      })),
    };

    // Generate prefill URL
    try {
      recommendation.prefillUrl = generatePrefillUrl({
        title: recommendation.title,
        steps: substitutedSteps.map((step) => ({
          action: step.action,
        })),
      });
    } catch {
      // Prefill URL generation is best-effort
    }

    return recommendation;
  });
}

// ============================================================
// Template lookup functions
// ============================================================

/**
 * Get Zap bundle configs for a given pattern ID.
 * Returns the zapBundle.zaps as ZapBundleConfig[] if the pattern has one.
 */
export function getTemplateForPattern(
  patternId: string,
): ZapBundleConfig[] | undefined {
  const pattern = ALL_PATTERNS.find((p) => p.id === patternId);
  if (!pattern?.zapBundle) return undefined;

  return pattern.zapBundle.zaps.map((zap) => ({
    title: zap.title,
    description: zap.description,
    steps: zap.steps,
  }));
}

/**
 * Get all Zap bundle configs for patterns matching a given archetype.
 * Aggregates zapBundle.zaps across all matching patterns.
 */
export function getTemplatesForArchetype(
  archetype: Archetype,
): ZapBundleConfig[] {
  const patterns = ALL_PATTERNS.filter(
    (p) => p.archetype === archetype && p.zapBundle,
  );

  return patterns.flatMap((p) =>
    (p.zapBundle?.zaps ?? []).map((zap) => ({
      title: zap.title,
      description: zap.description,
      steps: zap.steps,
    })),
  );
}
