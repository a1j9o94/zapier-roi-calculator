// ============================================================
// Zapier API Client for ROI Calculator V2
// Wraps the Zapier REST API (v2) for fetching Zap details,
// creating Zaps, and listing Zaps.
// ============================================================

const ZAPIER_API_BASE = "https://api.zapier.com";

// ============================================================
// Types
// ============================================================

export interface ZapStep {
  appTitle: string;
  appImageUrl?: string;
  appColor?: string;
  actionTitle: string;
  actionType?: string;
  isInstant?: boolean;
}

export interface ZapDetails {
  id: string;
  title: string;
  isEnabled: boolean;
  lastSuccessfulRun?: string;
  steps: ZapStep[];
}

export interface ZapConfig {
  title: string;
  steps: Array<{
    action: string;
    inputs?: Record<string, unknown>;
    authentication?: string;
    alias?: string;
  }>;
}

export interface ZapRunSummary {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt?: string;
}

// ============================================================
// Error handling
// ============================================================

export class ZapierApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ZapierApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => undefined);
    }
    throw new ZapierApiError(
      `Zapier API error: ${response.status} ${response.statusText}`,
      response.status,
      body,
    );
  }
  return response.json() as Promise<T>;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ============================================================
// API Functions
// ============================================================

/**
 * Fetch details of a single Zap by ID.
 * GET https://api.zapier.com/v2/zaps/{zapId}?expand=steps.action
 * Requires Bearer token with 'zap' scope.
 */
export async function fetchZapDetails(
  zapId: string,
  token: string,
): Promise<ZapDetails> {
  const url = `${ZAPIER_API_BASE}/v2/zaps/${encodeURIComponent(zapId)}?expand=steps.action`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await handleResponse<{ data: Record<string, unknown> }>(
    response,
  );
  return parseZapDetails(data.data);
}

/**
 * Create a new Zap from a config.
 * POST https://api.zapier.com/v2/zaps
 * Body: { data: { title, steps: [{ action, inputs, authentication, alias }] } }
 * Requires Bearer token with 'zap:write' scope.
 */
export async function createZap(
  config: ZapConfig,
  token: string,
): Promise<{ id: string; editorUrl: string }> {
  const url = `${ZAPIER_API_BASE}/v2/zaps`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      data: {
        title: config.title,
        steps: config.steps.map((step) => ({
          action: step.action,
          ...(step.inputs && { inputs: step.inputs }),
          ...(step.authentication && { authentication: step.authentication }),
          ...(step.alias && { alias: step.alias }),
        })),
      },
    }),
  });

  const data = await handleResponse<{
    data: { id: string; links?: { html?: string } };
  }>(response);
  return {
    id: data.data.id,
    editorUrl:
      data.data.links?.html ??
      `https://zapier.com/editor/${data.data.id}`,
  };
}

/**
 * List user's Zaps (for linking existing ones).
 * GET https://api.zapier.com/v2/zaps?expand=steps.action&limit=50
 * Requires Bearer token with 'zap' scope.
 */
export async function listZaps(
  token: string,
  options?: { limit?: number; offset?: number; search?: string },
): Promise<ZapDetails[]> {
  const params = new URLSearchParams({
    "expand": "steps.action",
    "limit": String(options?.limit ?? 50),
  });
  if (options?.offset) params.set("offset", String(options.offset));
  if (options?.search) params.set("search", options.search);

  const url = `${ZAPIER_API_BASE}/v2/zaps?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await handleResponse<{
    data: Array<Record<string, unknown>>;
  }>(response);
  return data.data.map(parseZapDetails);
}

/**
 * Generate a pre-fill URL for the embedded Zap editor.
 * Format: https://api.zapier.com/v1/embed/{triggerApp}/create?steps[0][app]=...
 */
export function generatePrefillUrl(config: ZapConfig): string {
  if (config.steps.length === 0) {
    return "https://zapier.com/app/editor";
  }

  const params = new URLSearchParams();
  if (config.title) {
    params.set("title", config.title);
  }

  config.steps.forEach((step, i) => {
    // The action field is typically in the format "AppCLIAPI.action_key"
    const appKey = step.action.split(".")[0] ?? step.action;
    params.set(`steps[${i}][action]`, step.action);
    if (i === 0) {
      params.set(`steps[${i}][app]`, appKey);
    }
    if (step.inputs) {
      for (const [key, value] of Object.entries(step.inputs)) {
        params.set(`steps[${i}][params][${key}]`, String(value));
      }
    }
  });

  // Use first step's app as the trigger app in the URL path
  const triggerApp = config.steps[0]?.action.split(".")[0] ?? "webhook";
  return `${ZAPIER_API_BASE}/v1/embed/${encodeURIComponent(triggerApp)}/create?${params.toString()}`;
}

/**
 * Fetch Zap run data for value realized dashboard.
 * GET https://api.zapier.com/v2/zap-runs?zap_id={zapId}
 * Requires Bearer token with 'zap' scope.
 */
export async function fetchZapRuns(
  zapId: string,
  token: string,
  options?: { since?: string; limit?: number },
): Promise<ZapRunSummary> {
  const params = new URLSearchParams({
    zap_id: zapId,
    limit: String(options?.limit ?? 100),
  });
  if (options?.since) params.set("from_date", options.since);

  const url = `${ZAPIER_API_BASE}/v2/zap-runs?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await handleResponse<{
    data: Array<{
      status?: string;
      end_time?: string;
    }>;
  }>(response);

  const runs = data.data;
  let successfulRuns = 0;
  let failedRuns = 0;
  let lastRunAt: string | undefined;

  for (const run of runs) {
    if (run.status === "success") {
      successfulRuns++;
    } else if (run.status === "error" || run.status === "failed") {
      failedRuns++;
    }
    if (run.end_time && (!lastRunAt || run.end_time > lastRunAt)) {
      lastRunAt = run.end_time;
    }
  }

  return {
    totalRuns: runs.length,
    successfulRuns,
    failedRuns,
    lastRunAt,
  };
}

// ============================================================
// Internal helpers
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseZapDetails(raw: Record<string, any>): ZapDetails {
  const steps: ZapStep[] = [];

  if (Array.isArray(raw.steps)) {
    for (const step of raw.steps) {
      const action = step.action ?? {};
      steps.push({
        appTitle: action.app?.title ?? step.app?.title ?? "Unknown App",
        appImageUrl:
          action.app?.image_url ?? step.app?.image_url ?? undefined,
        appColor: action.app?.hex_color ?? step.app?.hex_color ?? undefined,
        actionTitle: action.title ?? step.title ?? "Unknown Action",
        actionType: action.type ?? step.type ?? undefined,
        isInstant: step.is_instant ?? undefined,
      });
    }
  }

  return {
    id: String(raw.id),
    title: raw.title ?? "Untitled Zap",
    isEnabled: raw.is_enabled ?? false,
    lastSuccessfulRun: raw.last_successful_run_date ?? undefined,
    steps,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
