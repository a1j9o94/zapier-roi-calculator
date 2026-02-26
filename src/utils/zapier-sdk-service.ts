// ============================================================
// Zapier SDK Service — Static App Registry
// Lookup table of known app CLI API keys and versions.
// No runtime SDK calls — just a registry for template generation.
// ============================================================

// ============================================================
// Types
// ============================================================

export interface AppRegistryEntry {
  displayName: string;
  cliApiKey: string;
  version: string;
  commonActions: Record<
    string,
    { action: string; type_of: "read" | "write" | "search" | "filter" }
  >;
}

// ============================================================
// App Registry
// ============================================================

const APP_REGISTRY: Record<string, AppRegistryEntry> = {
  "Salesforce": {
    displayName: "Salesforce",
    cliApiKey: "SalesforceCLIAPI",
    version: "1.13.3",
    commonActions: {
      new_record: { action: "new_record", type_of: "read" },
      new_lead: { action: "new_lead", type_of: "read" },
      updated_record: { action: "updated_record", type_of: "read" },
      create_record: { action: "create_record", type_of: "write" },
      update_record: { action: "update_record", type_of: "write" },
      find_record: { action: "find_record", type_of: "search" },
    },
  },
  "HubSpot": {
    displayName: "HubSpot",
    cliApiKey: "HubSpotCLIAPI",
    version: "1.28.0",
    commonActions: {
      new_contact: { action: "new_contact", type_of: "read" },
      deal_updated: { action: "deal_updated", type_of: "read" },
      create_contact: { action: "create_contact", type_of: "write" },
      update_contact: { action: "update_contact", type_of: "write" },
      create_engagement: { action: "create_engagement", type_of: "write" },
      create_ticket: { action: "create_ticket", type_of: "write" },
      find_contact: { action: "find_contact", type_of: "search" },
    },
  },
  "Gmail": {
    displayName: "Gmail",
    cliApiKey: "GoogleMailV2CLIAPI",
    version: "2.7.1",
    commonActions: {
      new_email: { action: "new_email", type_of: "read" },
      send_email: { action: "send_email", type_of: "write" },
      find_email: { action: "find_email", type_of: "search" },
    },
  },
  "Google Sheets": {
    displayName: "Google Sheets",
    cliApiKey: "GoogleSheetsV2CLIAPI",
    version: "2.10.1",
    commonActions: {
      new_spreadsheet_row: { action: "new_spreadsheet_row", type_of: "read" },
      create_spreadsheet_row: {
        action: "create_spreadsheet_row",
        type_of: "write",
      },
      update_row: { action: "update_row", type_of: "write" },
      lookup_row: { action: "lookup_row", type_of: "search" },
      get_spreadsheet_row: { action: "get_spreadsheet_row", type_of: "search" },
    },
  },
  "Google Calendar": {
    displayName: "Google Calendar",
    cliApiKey: "GoogleCalendarCLIAPI",
    version: "1.6.2",
    commonActions: {
      event_start: { action: "event_start", type_of: "read" },
      new_event: { action: "new_event", type_of: "read" },
      create_event: { action: "create_event", type_of: "write" },
      find_event: { action: "find_event", type_of: "search" },
    },
  },
  "Google Drive": {
    displayName: "Google Drive",
    cliApiKey: "GoogleDriveCLIAPI",
    version: "1.15.3",
    commonActions: {
      new_file: { action: "new_file", type_of: "read" },
      upload_file: { action: "upload_file", type_of: "write" },
      find_file: { action: "find_file", type_of: "search" },
    },
  },
  "Slack": {
    displayName: "Slack",
    cliApiKey: "SlackCLIAPI",
    version: "1.37.6",
    commonActions: {
      new_message: { action: "new_message", type_of: "read" },
      send_channel_message: {
        action: "send_channel_message",
        type_of: "write",
      },
      send_direct_message: {
        action: "send_direct_message",
        type_of: "write",
      },
      find_message: { action: "find_message", type_of: "search" },
    },
  },
  "Stripe": {
    displayName: "Stripe",
    cliApiKey: "StripeCLIAPI",
    version: "1.18.0",
    commonActions: {
      new_payment: { action: "new_payment", type_of: "read" },
      subscription_updated: {
        action: "subscription_updated",
        type_of: "read",
      },
      create_charge: { action: "create_charge", type_of: "write" },
      find_customer: { action: "find_customer", type_of: "search" },
    },
  },
  "Typeform": {
    displayName: "Typeform",
    cliApiKey: "TypeformCLIAPI",
    version: "1.10.0",
    commonActions: {
      new_entry: { action: "new_entry", type_of: "read" },
    },
  },
  "Asana": {
    displayName: "Asana",
    cliApiKey: "AsanaCLIAPI",
    version: "1.34.1",
    commonActions: {
      new_task: { action: "new_task", type_of: "read" },
      create_task: { action: "create_task", type_of: "write" },
      find_task: { action: "find_task", type_of: "search" },
    },
  },
  "Schedule by Zapier": {
    displayName: "Schedule by Zapier",
    cliApiKey: "ScheduleCLIAPI",
    version: "1.6.0",
    commonActions: {
      every_day: { action: "everyDay", type_of: "read" },
      every_hour: { action: "everyHour", type_of: "read" },
      every_week: { action: "everyWeek", type_of: "read" },
      every_15_min: { action: "every15Min", type_of: "read" },
    },
  },
  "Filter by Zapier": {
    displayName: "Filter by Zapier",
    cliApiKey: "FilterCLIAPI",
    version: "1.0.0",
    commonActions: {
      filter: { action: "filter", type_of: "filter" },
    },
  },
  "Formatter by Zapier": {
    displayName: "Formatter by Zapier",
    cliApiKey: "ZapierFormatterCLIAPI",
    version: "1.0.8",
    commonActions: {
      text: { action: "text", type_of: "write" },
      number: { action: "number", type_of: "write" },
      date_time: { action: "date_time", type_of: "write" },
    },
  },
  "Code by Zapier": {
    displayName: "Code by Zapier",
    cliApiKey: "CodeCLIAPI",
    version: "1.0.1",
    commonActions: {
      run_javascript: { action: "run_javascript", type_of: "write" },
      run_python: { action: "run_python", type_of: "write" },
    },
  },
  "Webhooks by Zapier": {
    displayName: "Webhooks by Zapier",
    cliApiKey: "WebhookCLIAPI",
    version: "1.1.0",
    commonActions: {
      catch_hook: { action: "catch_hook", type_of: "read" },
      get: { action: "get", type_of: "write" },
      post: { action: "post", type_of: "write" },
    },
  },
  "Zapier Tables": {
    displayName: "Zapier Tables",
    cliApiKey: "ZapierTablesCLIAPI",
    version: "1.5.0",
    commonActions: {
      new_record: { action: "new_record", type_of: "read" },
      create_record: { action: "create_record", type_of: "write" },
      update_record: { action: "update_record", type_of: "write" },
      find_records: { action: "find_records", type_of: "search" },
    },
  },
  "Zapier Interfaces": {
    displayName: "Zapier Interfaces",
    cliApiKey: "ZapierInterfacesCLIAPI",
    version: "1.3.0",
    commonActions: {
      new_submission: { action: "new_submission", type_of: "read" },
    },
  },
  "Zapier Looping": {
    displayName: "Zapier Looping",
    cliApiKey: "ZapierLoopingCLIAPI",
    version: "1.2.6",
    commonActions: {
      loop: { action: "loop", type_of: "write" },
    },
  },
  "Files by Zapier": {
    displayName: "Files by Zapier",
    cliApiKey: "FilesByZapierCLIAPI",
    version: "1.3.4",
    commonActions: {
      hydrate_file: { action: "hydrate_file", type_of: "write" },
    },
  },
};

// ============================================================
// Lookup functions
// ============================================================

/**
 * Resolve an app display name to its full CLI API key with version.
 * E.g., "Slack" -> "SlackCLIAPI@1.37.6"
 * Falls back to a generic key if the app isn't in the registry.
 */
export function resolveAppKey(appName: string): string {
  const entry = APP_REGISTRY[appName];
  if (entry) {
    return `${entry.cliApiKey}@${entry.version}`;
  }
  // Fallback: convert display name to a CLI-style key
  const sanitized = appName.replace(/[^a-zA-Z0-9]/g, "");
  return `${sanitized}CLIAPI@1.0.0`;
}

/** Get the full app registry */
export function getAppRegistry(): Record<string, AppRegistryEntry> {
  return APP_REGISTRY;
}

/** Look up a common action for a given app */
export function getCommonAction(
  appName: string,
  actionName: string,
): { action: string; type_of: "read" | "write" | "search" | "filter" } | undefined {
  const entry = APP_REGISTRY[appName];
  if (!entry) return undefined;
  return entry.commonActions[actionName];
}
