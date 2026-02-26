// ============================================================
// Zap Template Generator
// Converts zap-recommender output into importable Zap export JSON.
// Generates templates matching Zapier's export format.
// ============================================================

import { resolveAppKey } from "./zapier-sdk-service";

// ============================================================
// Types
// ============================================================

export interface ZapTemplateNode {
  id: number;
  type_of: "read" | "write" | "search" | "filter";
  action: string;
  selected_api: string;
  params: Record<string, unknown>;
  meta: { stepTitle: string; parammap?: Record<string, string> };
  parent_id: number | null;
  root_id: number | null;
  authentication_id: null;
}

export interface ZapTemplate {
  metadata: { version: 2 };
  zaps: Array<{
    id: number;
    title: string;
    nodes: Record<string, ZapTemplateNode>;
  }>;
}

export interface ZapBundleStep {
  app: string;
  action: string;
  stepTitle: string;
  type: "trigger" | "action" | "search" | "filter";
}

export interface ZapBundleConfig {
  title: string;
  description: string;
  steps: ZapBundleStep[];
}

// ============================================================
// Type mapping
// ============================================================

const STEP_TYPE_MAP: Record<
  ZapBundleStep["type"],
  ZapTemplateNode["type_of"]
> = {
  trigger: "read",
  action: "write",
  search: "search",
  filter: "filter",
};

// ============================================================
// Generator functions
// ============================================================

/**
 * Generate a single Zap template from a bundle config.
 * Maps each step to a node with proper type_of, selected_api,
 * parent_id chain, and root_id references.
 */
export function generateZapTemplate(config: ZapBundleConfig): ZapTemplate {
  const nodes: Record<string, ZapTemplateNode> = {};

  config.steps.forEach((step, index) => {
    const nodeId = index + 1;
    const isTrigger = index === 0;

    nodes[String(nodeId)] = {
      id: nodeId,
      type_of: STEP_TYPE_MAP[step.type],
      action: step.action,
      selected_api: resolveAppKey(step.app),
      params: {},
      meta: { stepTitle: step.stepTitle },
      parent_id: isTrigger ? null : index,
      root_id: isTrigger ? null : 1,
      authentication_id: null,
    };
  });

  return {
    metadata: { version: 2 },
    zaps: [
      {
        id: 1,
        title: config.title,
        nodes,
      },
    ],
  };
}

/**
 * Generate a multi-Zap bundle template from multiple configs.
 * Each config becomes a separate Zap in the export.
 */
export function generateUseCaseBundle(
  configs: ZapBundleConfig[],
): ZapTemplate {
  const zaps = configs.map((config, zapIndex) => {
    const singleTemplate = generateZapTemplate(config);
    const zap = singleTemplate.zaps[0];
    return {
      ...zap,
      id: zapIndex + 1,
    };
  });

  return {
    metadata: { version: 2 },
    zaps,
  };
}

/**
 * Trigger a browser download of a Zap template as JSON.
 * Only works in browser environments.
 */
export function downloadTemplate(
  template: ZapTemplate,
  filename: string,
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a Zapier prefill URL from a bundle config.
 * Uses the Zapier embed API format for one-click Zap creation.
 */
export function generatePrefillUrlFromTemplate(
  config: ZapBundleConfig,
): string {
  const ZAPIER_API_BASE = "https://api.zapier.com";

  if (config.steps.length === 0) {
    return "https://zapier.com/app/editor";
  }

  const params = new URLSearchParams();
  if (config.title) {
    params.set("title", config.title);
  }

  config.steps.forEach((step, i) => {
    const apiKey = resolveAppKey(step.app);
    // Extract the CLI API key without version for the action reference
    const cliKey = apiKey.split("@")[0];
    params.set(`steps[${i}][action]`, `${cliKey}.${step.action}`);
    if (i === 0) {
      params.set(`steps[${i}][app]`, cliKey);
    }
  });

  const triggerApiKey = resolveAppKey(config.steps[0].app);
  const triggerCliKey = triggerApiKey.split("@")[0];
  return `${ZAPIER_API_BASE}/v1/embed/${encodeURIComponent(triggerCliKey)}/create?${params.toString()}`;
}
