// ============================================================
// Convex Actions — Zapier API data fetching
//
// Actions (unlike queries/mutations) can make external network
// requests. They use ctx.runQuery / ctx.runMutation to read
// from and write to the Convex DB.
//
// Env var required: ZAPIER_API_TOKEN (set in Convex dashboard)
// ============================================================

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// ============================================================
// Types
// ============================================================

interface ZapApiStep {
  action?: {
    app?: { title?: string; image_url?: string; hex_color?: string };
    title?: string;
    type?: string;
  };
  app?: { title?: string; image_url?: string; hex_color?: string };
  title?: string;
  type?: string;
  is_instant?: boolean;
}

interface ZapApiDetailsResponse {
  id: string | number;
  title?: string;
  is_enabled?: boolean;
  last_successful_run_date?: string;
  steps?: ZapApiStep[];
}

export interface ZapApiRun {
  status?: string;
  end_time?: string;
}

export interface ParsedZapDetails {
  title: string;
  isEnabled: boolean;
  lastSuccessfulRun?: string;
  steps: Array<{
    appTitle: string;
    appImageUrl?: string;
    appColor?: string;
    actionTitle: string;
    actionType?: string;
    isInstant?: boolean;
  }>;
  fetchedAt: number;
}

export interface ParsedRunData {
  totalRuns: number;
  runsLast30Days: number;
  runsLast7Days: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt?: string;
}

// ============================================================
// Pure helpers (exported for testing)
// ============================================================

/**
 * Parse a raw Zapier API v2 Zap response into the shape stored in DB.
 */
export function parseZapDetailsResponse(
  raw: ZapApiDetailsResponse,
  nowMs = Date.now(),
): ParsedZapDetails {
  const steps = (raw.steps ?? []).map((step) => {
    const act = step.action ?? {};
    return {
      appTitle: act.app?.title ?? step.app?.title ?? "Unknown App",
      appImageUrl: act.app?.image_url ?? step.app?.image_url ?? undefined,
      appColor: act.app?.hex_color ?? step.app?.hex_color ?? undefined,
      actionTitle: act.title ?? step.title ?? "Unknown Action",
      actionType: act.type ?? step.type ?? undefined,
      isInstant: step.is_instant ?? undefined,
    };
  });

  return {
    title: raw.title ?? "Untitled Zap",
    isEnabled: raw.is_enabled ?? false,
    lastSuccessfulRun: raw.last_successful_run_date ?? undefined,
    steps,
    fetchedAt: nowMs,
  };
}

/**
 * Aggregate an array of Zap run objects into summary counts.
 * Filters by date using ISO string comparison.
 */
export function aggregateRunData(runs: ZapApiRun[], nowMs = Date.now()): ParsedRunData {
  const thirtyDaysAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();

  let successfulRuns = 0;
  let failedRuns = 0;
  let runsLast30Days = 0;
  let runsLast7Days = 0;
  let lastRunAt: string | undefined;

  for (const run of runs) {
    if (run.status === "success") {
      successfulRuns++;
    } else if (run.status === "error" || run.status === "failed") {
      failedRuns++;
    }

    if (run.end_time) {
      if (run.end_time >= thirtyDaysAgo) runsLast30Days++;
      if (run.end_time >= sevenDaysAgo) runsLast7Days++;
      if (!lastRunAt || run.end_time > lastRunAt) lastRunAt = run.end_time;
    }
  }

  return {
    totalRuns: runs.length,
    successfulRuns,
    failedRuns,
    runsLast30Days,
    runsLast7Days,
    lastRunAt,
  };
}

// ============================================================
// Internal API helpers
// ============================================================

const ZAPIER_API_BASE = "https://api.zapier.com";

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetchZapDetails(
  zapId: string,
  token: string,
): Promise<ParsedZapDetails> {
  const url = `${ZAPIER_API_BASE}/v2/zaps/${encodeURIComponent(zapId)}?expand=steps.action`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Zapier API error fetching zap ${zapId}: ${response.status} ${response.statusText}. ${body}`,
    );
  }

  const data = (await response.json()) as { data: ZapApiDetailsResponse };
  return parseZapDetailsResponse(data.data);
}

async function apiFetchZapRuns(zapId: string, token: string): Promise<ParsedRunData> {
  // Fetch up to 500 runs so we can compute accurate 30-day and 7-day windows.
  const params = new URLSearchParams({ zap_id: zapId, limit: "500" });
  const url = `${ZAPIER_API_BASE}/v2/zap-runs?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Zapier API error fetching runs for zap ${zapId}: ${response.status} ${response.statusText}. ${body}`,
    );
  }

  const data = (await response.json()) as { data: ZapApiRun[] };
  return aggregateRunData(data.data ?? []);
}

// ============================================================
// Actions
// ============================================================

/**
 * Fetch Zap details from the Zapier REST API and update the `zapDetails`
 * field on every matching architecture item within the given use case.
 *
 * Requires ZAPIER_API_TOKEN in Convex env vars (zap scope).
 */
export const fetchAndCacheZapDetails = action({
  args: {
    useCaseId: v.id("useCases"),
    zapId: v.string(),
  },
  handler: async (ctx, { useCaseId, zapId }) => {
    const token = process.env.ZAPIER_API_TOKEN;
    if (!token) {
      throw new Error("ZAPIER_API_TOKEN environment variable is not set");
    }

    const zapDetails = await apiFetchZapDetails(zapId, token);

    const useCase = await ctx.runQuery(api.useCases.get, { id: useCaseId });
    if (!useCase) {
      throw new Error(`Use case not found: ${useCaseId}`);
    }

    // Patch zapDetails on all architecture items referencing this zapId
    const updatedArchitecture = (useCase.architecture ?? []).map((item) => {
      if (item.zapId === zapId) {
        return { ...item, zapDetails };
      }
      return item;
    });

    await ctx.runMutation(api.useCases.update, {
      id: useCaseId,
      architecture: updatedArchitecture,
    });

    return zapDetails;
  },
});

/**
 * Fetch Zap run data from the Zapier REST API and upsert the result into
 * the `zapRunCache` table. Used by the Value Realized dashboard.
 *
 * Optionally accepts an `expectedAnnualValue` to compute realizationRate
 * as: (successfulRuns / totalRuns) × expectedAnnualValue.
 *
 * Requires ZAPIER_API_TOKEN in Convex env vars (zap scope).
 */
export const fetchAndCacheZapRuns = action({
  args: {
    zapId: v.string(),
    useCaseId: v.id("useCases"),
    calculationId: v.id("calculations"),
    expectedAnnualValue: v.optional(v.number()),
  },
  handler: async (ctx, { zapId, useCaseId, calculationId, expectedAnnualValue }) => {
    const token = process.env.ZAPIER_API_TOKEN;
    if (!token) {
      throw new Error("ZAPIER_API_TOKEN environment variable is not set");
    }

    const runData = await apiFetchZapRuns(zapId, token);

    let realizationRate: number | undefined;
    let realizedAnnualValue: number | undefined;
    if (expectedAnnualValue && expectedAnnualValue > 0) {
      const successRate =
        runData.totalRuns > 0 ? runData.successfulRuns / runData.totalRuns : 1;
      realizationRate = Math.min(1, successRate);
      realizedAnnualValue = expectedAnnualValue * realizationRate;
    }

    await ctx.runMutation(api.zapRunCache.upsertRunData, {
      zapId,
      useCaseId,
      calculationId,
      ...runData,
      realizationRate,
      realizedAnnualValue,
    });

    return { ...runData, realizationRate, realizedAnnualValue };
  },
});

/**
 * Sync all Zap data for a calculation in one shot.
 * For each use case, finds architecture items with type="zap" + a zapId,
 * fetches details and run data concurrently, then updates both the use case
 * architecture and the zapRunCache.
 *
 * Skips Zaps whose cache entry is younger than CACHE_TTL_MS (1 hour)
 * unless `forceRefresh` is true.
 *
 * Returns an array of per-Zap result objects for observability.
 */
export const syncZapDataForCalculation = action({
  args: {
    calculationId: v.id("calculations"),
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, { calculationId, forceRefresh }) => {
    const token = process.env.ZAPIER_API_TOKEN;
    if (!token) {
      throw new Error("ZAPIER_API_TOKEN environment variable is not set");
    }

    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    // Load use cases and existing cache in parallel
    const [useCases, existingCache] = await Promise.all([
      ctx.runQuery(api.useCases.listByCalculation, { calculationId }),
      ctx.runQuery(api.zapRunCache.getByCalculation, { calculationId }),
    ]);

    const cacheByZapId = new Map(existingCache.map((c) => [c.zapId, c]));

    const results: Array<{
      zapId: string;
      useCaseId: string;
      status: "updated" | "skipped" | "error";
      error?: string;
    }> = [];

    for (const useCase of useCases) {
      const zapItems = (useCase.architecture ?? []).filter(
        (item) => item.type === "zap" && item.zapId,
      );

      for (const item of zapItems) {
        const zapId = item.zapId!;
        const cached = cacheByZapId.get(zapId);

        // Honour TTL unless forced
        if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
          results.push({
            zapId,
            useCaseId: String(useCase._id),
            status: "skipped",
          });
          continue;
        }

        try {
          // Fetch details and run data concurrently
          const [zapDetails, runData] = await Promise.all([
            apiFetchZapDetails(zapId, token),
            apiFetchZapRuns(zapId, token),
          ]);

          // Update architecture zapDetails for this Zap
          const updatedArchitecture = (useCase.architecture ?? []).map((archItem) => {
            if (archItem.zapId === zapId) {
              return { ...archItem, zapDetails };
            }
            return archItem;
          });

          await ctx.runMutation(api.useCases.update, {
            id: useCase._id,
            architecture: updatedArchitecture,
          });

          // Upsert run cache
          await ctx.runMutation(api.zapRunCache.upsertRunData, {
            zapId,
            useCaseId: useCase._id,
            calculationId,
            ...runData,
          });

          results.push({
            zapId,
            useCaseId: String(useCase._id),
            status: "updated",
          });
        } catch (err) {
          results.push({
            zapId,
            useCaseId: String(useCase._id),
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return results;
  },
});
