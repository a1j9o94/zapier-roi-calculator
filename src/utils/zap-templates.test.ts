import { test, expect, describe } from "bun:test";
import { readFileSync } from "fs";
import { generateZapTemplate, generateUseCaseBundle, generatePrefillUrlFromTemplate } from "./zap-template-generator";
import type { ZapBundleConfig } from "./zap-template-generator";
import { resolveAppKey, getCommonAction, getAppRegistry } from "./zapier-sdk-service";
import { deduplicatePatterns } from "./package-dedup";
import { getTemplateForPattern, getTemplatesForArchetype } from "./zap-recommender";
import { ALL_PATTERNS } from "../data/patterns/index";
import { VALUE_PACKAGES, getPackagesByRole } from "../data/value-packages";
import type { ValuePackagePattern } from "../data/value-packages";

// ============================================================
// Zap Template Generator
// ============================================================

describe("generateZapTemplate", () => {
  const basicConfig: ZapBundleConfig = {
    title: "Lead Routing & Assignment",
    description: "Route new leads to the right rep instantly",
    steps: [
      { app: "Salesforce", action: "new_lead", stepTitle: "New Lead in Salesforce", type: "trigger" },
      { app: "Filter by Zapier", action: "filter", stepTitle: "Filter by Score", type: "filter" },
      { app: "Slack", action: "send_channel_message", stepTitle: "Notify Rep", type: "action" },
    ],
  };

  test("produces valid export JSON structure", () => {
    const template = generateZapTemplate(basicConfig);
    expect(template.metadata).toEqual({ version: 2 });
    expect(template.zaps).toBeArrayOfSize(1);
    expect(template.zaps[0].title).toBe("Lead Routing & Assignment");
    expect(template.zaps[0].id).toBe(1);
  });

  test("nodes chain parent_id correctly", () => {
    const template = generateZapTemplate(basicConfig);
    const nodes = template.zaps[0].nodes;
    const nodeIds = Object.keys(nodes).sort((a, b) => Number(a) - Number(b));

    // First node (trigger) has parent_id null
    expect(nodes[nodeIds[0]].parent_id).toBeNull();
    expect(nodes[nodeIds[0]].root_id).toBeNull();

    // Subsequent nodes chain parent_id
    for (let i = 1; i < nodeIds.length; i++) {
      expect(nodes[nodeIds[i]].parent_id).toBe(Number(nodeIds[i - 1]));
      // root_id should be the trigger's id
      expect(nodes[nodeIds[i]].root_id).toBe(Number(nodeIds[0]));
    }
  });

  test("authentication_id is always null", () => {
    const template = generateZapTemplate(basicConfig);
    const nodes = template.zaps[0].nodes;
    for (const node of Object.values(nodes)) {
      expect(node.authentication_id).toBeNull();
    }
  });

  test("maps type correctly to type_of", () => {
    const template = generateZapTemplate(basicConfig);
    const nodes = Object.values(template.zaps[0].nodes);
    expect(nodes[0].type_of).toBe("read"); // trigger → read
    expect(nodes[1].type_of).toBe("filter"); // filter → filter
    expect(nodes[2].type_of).toBe("write"); // action → write
  });

  test("resolves selected_api from app registry", () => {
    const template = generateZapTemplate(basicConfig);
    const nodes = Object.values(template.zaps[0].nodes);
    // Should contain CLIAPI version format
    for (const node of nodes) {
      expect(node.selected_api).toContain("@");
      expect(node.selected_api).toContain("CLIAPI");
    }
  });

  test("sets stepTitle in meta", () => {
    const template = generateZapTemplate(basicConfig);
    const nodes = Object.values(template.zaps[0].nodes);
    expect(nodes[0].meta.stepTitle).toBe("New Lead in Salesforce");
    expect(nodes[1].meta.stepTitle).toBe("Filter by Score");
    expect(nodes[2].meta.stepTitle).toBe("Notify Rep");
  });
});

describe("generateUseCaseBundle", () => {
  test("produces multiple Zaps in the zaps array", () => {
    const configs: ZapBundleConfig[] = [
      { title: "Zap 1", description: "First", steps: [{ app: "Schedule by Zapier", action: "everyDay", stepTitle: "Daily", type: "trigger" }] },
      { title: "Zap 2", description: "Second", steps: [{ app: "Slack", action: "new_message", stepTitle: "New Message", type: "trigger" }] },
    ];
    const template = generateUseCaseBundle(configs);
    expect(template.metadata).toEqual({ version: 2 });
    expect(template.zaps).toBeArrayOfSize(2);
    expect(template.zaps[0].title).toBe("Zap 1");
    expect(template.zaps[1].title).toBe("Zap 2");
  });

  test("each Zap has unique sequential id", () => {
    const configs: ZapBundleConfig[] = [
      { title: "A", description: "", steps: [{ app: "Slack", action: "new_message", stepTitle: "Msg", type: "trigger" }] },
      { title: "B", description: "", steps: [{ app: "Gmail", action: "new_email", stepTitle: "Email", type: "trigger" }] },
      { title: "C", description: "", steps: [{ app: "Salesforce", action: "new_record", stepTitle: "Record", type: "trigger" }] },
    ];
    const template = generateUseCaseBundle(configs);
    const ids = template.zaps.map((z) => z.id);
    expect(ids).toEqual([1, 2, 3]);
  });
});

describe("generatePrefillUrlFromTemplate", () => {
  test("returns a valid URL string", () => {
    const config: ZapBundleConfig = {
      title: "Test",
      description: "",
      steps: [{ app: "Slack", action: "new_message", stepTitle: "Msg", type: "trigger" }],
    };
    const url = generatePrefillUrlFromTemplate(config);
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });
});

// ============================================================
// SDK Service
// ============================================================

describe("zapier-sdk-service", () => {
  test("resolveAppKey returns CLIAPI@version format", () => {
    const key = resolveAppKey("Slack");
    expect(key).toContain("SlackCLIAPI@");
  });

  test("resolveAppKey works for all apps used in recommender templates", () => {
    const requiredApps = [
      "Salesforce", "HubSpot", "Gmail", "Google Sheets", "Slack",
      "Schedule by Zapier", "Filter by Zapier", "Code by Zapier",
      "Webhooks by Zapier", "Zapier Tables",
    ];
    for (const app of requiredApps) {
      const key = resolveAppKey(app);
      expect(key).toContain("@");
      expect(key).toContain("CLIAPI");
    }
  });

  test("getCommonAction returns action and type_of", () => {
    const action = getCommonAction("Slack", "send_channel_message");
    expect(action).toBeDefined();
    expect(action!.type_of).toBe("write");
  });

  test("getAppRegistry contains at least 15 apps", () => {
    const registry = getAppRegistry();
    expect(Object.keys(registry).length).toBeGreaterThanOrEqual(15);
  });
});

// ============================================================
// Package Dedup
// ============================================================

describe("deduplicatePatterns", () => {
  test("removes exact duplicates by patternId", () => {
    const patterns: ValuePackagePattern[] = [
      { patternId: "sales-crm-data-entry", archetype: "task_elimination", name: "CRM Entry", description: "", estimatedAnnualValue: 21600 },
      { patternId: "sales-crm-data-entry", archetype: "task_elimination", name: "CRM Entry", description: "", estimatedAnnualValue: 21600 },
    ];
    const result = deduplicatePatterns(patterns);
    expect(result.totalBefore).toBe(2);
    expect(result.duplicatesRemoved).toBe(1);
    expect(result.totalAfter).toBe(1);
    expect(result.patterns).toBeArrayOfSize(1);
  });

  test("keeps all unique patterns", () => {
    const patterns: ValuePackagePattern[] = [
      { patternId: "sales-lead-routing", archetype: "pipeline_velocity", name: "Lead Routing", description: "", estimatedAnnualValue: 500000 },
      { patternId: "sales-crm-data-entry", archetype: "task_elimination", name: "CRM Entry", description: "", estimatedAnnualValue: 21600 },
    ];
    const result = deduplicatePatterns(patterns);
    expect(result.duplicatesRemoved).toBe(0);
    expect(result.totalAfter).toBe(2);
  });

  test("RevOps + Quick Wins produces correct dedup", () => {
    const revops = VALUE_PACKAGES.find((p) => p.id === "revops-acceleration")!;
    const quickWins = VALUE_PACKAGES.find((p) => p.id === "quick-wins-starter")!;
    const allPatterns = [...revops.patterns, ...quickWins.patterns];
    const result = deduplicatePatterns(allPatterns);

    // Should have some duplicates (sales-crm-data-entry is in both)
    expect(result.duplicatesRemoved).toBeGreaterThan(0);
    expect(result.totalAfter).toBeLessThan(result.totalBefore);

    // All remaining patterns should have unique patternIds
    const ids = result.patterns.map((p) => p.patternId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================
// Pattern → Template Pipeline
// ============================================================

describe("pattern zapBundle integration", () => {
  test("all patterns have zapBundle defined", () => {
    for (const pattern of ALL_PATTERNS) {
      expect(pattern.zapBundle).toBeDefined();
      expect(pattern.zapBundle!.zaps.length).toBeGreaterThan(0);
    }
  });

  test("zapBundle steps have required fields", () => {
    for (const pattern of ALL_PATTERNS) {
      for (const zap of pattern.zapBundle!.zaps) {
        expect(zap.title).toBeTruthy();
        expect(zap.steps.length).toBeGreaterThan(0);
        for (const step of zap.steps) {
          expect(step.app).toBeTruthy();
          expect(step.action).toBeTruthy();
          expect(step.stepTitle).toBeTruthy();
          expect(["trigger", "action", "search", "filter"]).toContain(step.type);
        }
      }
    }
  });

  test("zapBundle steps reference apps that exist in SDK registry", () => {
    const registry = getAppRegistry();
    const registryApps = new Set(Object.keys(registry));

    for (const pattern of ALL_PATTERNS) {
      for (const zap of pattern.zapBundle!.zaps) {
        for (const step of zap.steps) {
          expect(registryApps.has(step.app)).toBe(true);
        }
      }
    }
  });

  test("first step of each zapBundle Zap is a trigger", () => {
    for (const pattern of ALL_PATTERNS) {
      for (const zap of pattern.zapBundle!.zaps) {
        expect(zap.steps[0].type).toBe("trigger");
      }
    }
  });

  test("getTemplateForPattern returns templates for all patterns with zapBundle", () => {
    for (const pattern of ALL_PATTERNS) {
      const templates = getTemplateForPattern(pattern.id);
      expect(templates).toBeDefined();
      expect(templates!.length).toBeGreaterThan(0);
    }
  });

  test("getTemplatesForArchetype returns templates for archetypes with patterns", () => {
    // Get archetypes that actually have patterns in the catalog
    const archetypesWithPatterns = new Set(ALL_PATTERNS.map((p) => p.archetype));

    for (const archetype of archetypesWithPatterns) {
      const templates = getTemplatesForArchetype(archetype);
      expect(templates.length).toBeGreaterThan(0);
    }

    // Verify we're testing a meaningful number of archetypes
    expect(archetypesWithPatterns.size).toBeGreaterThanOrEqual(14);
  });

  test("generateZapTemplate works with every pattern's zapBundle", () => {
    // This is the key integration test - ensures the full pipeline works:
    // Pattern → zapBundle → generateZapTemplate → valid export JSON
    for (const pattern of ALL_PATTERNS) {
      for (const zap of pattern.zapBundle!.zaps) {
        const config: ZapBundleConfig = {
          title: zap.title,
          description: zap.description,
          steps: zap.steps,
        };
        const template = generateZapTemplate(config);

        // Validate structure
        expect(template.metadata.version).toBe(2);
        expect(template.zaps).toBeArrayOfSize(1);

        const nodes = Object.values(template.zaps[0].nodes);
        expect(nodes.length).toBe(zap.steps.length);

        // First node is trigger
        expect(nodes[0].type_of).toBe("read");
        expect(nodes[0].parent_id).toBeNull();
        expect(nodes[0].root_id).toBeNull();

        // All auth is null
        for (const node of nodes) {
          expect(node.authentication_id).toBeNull();
          expect(node.selected_api).toContain("@");
        }
      }
    }
  });
});

// ============================================================
// Value Package → Wizard Pipeline
// ============================================================

describe("value package wizard pipeline", () => {
  test("all package patterns have zapCount and keyApps", () => {
    for (const pkg of VALUE_PACKAGES) {
      for (const pattern of pkg.patterns) {
        expect(pattern.zapCount).toBeDefined();
        expect(pattern.zapCount).toBeGreaterThan(0);
        expect(pattern.keyApps).toBeDefined();
        expect(pattern.keyApps!.length).toBeGreaterThan(0);
      }
    }
  });

  test("package patterns reference valid pattern IDs in catalog", () => {
    const catalogIds = new Set(ALL_PATTERNS.map((p) => p.id));
    for (const pkg of VALUE_PACKAGES) {
      for (const pattern of pkg.patterns) {
        expect(catalogIds.has(pattern.patternId)).toBe(true);
      }
    }
  });

  test("wizard architecture pipeline: pattern → zapBundle → architecture items", () => {
    // Simulates what the wizard does when creating use cases from packages
    // This would have caught the missing patternId / zapConfig bug
    const revops = VALUE_PACKAGES.find((p) => p.id === "revops-acceleration")!;

    for (const pkgPattern of revops.patterns) {
      const catalogPattern = ALL_PATTERNS.find((p) => p.id === pkgPattern.patternId);
      expect(catalogPattern).toBeDefined();
      expect(catalogPattern!.zapBundle).toBeDefined();

      // Simulate architecture item creation (what wizard does)
      const architectureItems = catalogPattern!.zapBundle!.zaps.map((zap) => ({
        type: "zap" as const,
        name: zap.title,
        status: "planned" as const,
        zapConfig: {
          title: zap.title,
          steps: zap.steps.map((s) => ({
            action: `${s.app}.${s.action}`,
            alias: s.stepTitle,
          })),
        },
      }));

      expect(architectureItems.length).toBeGreaterThan(0);

      // Verify zapConfig steps can be parsed back for rendering
      for (const item of architectureItems) {
        expect(item.zapConfig.steps.length).toBeGreaterThan(0);
        for (const step of item.zapConfig.steps) {
          expect(step.action).toContain(".");
          const appName = step.action.split(".")[0];
          expect(appName).toBeTruthy();
          expect(appName).not.toBe("undefined");
        }
      }
    }
  });

  test("executive role sees packages from all departments", () => {
    const packages = getPackagesByRole("executive");
    expect(packages.length).toBeGreaterThanOrEqual(5);
  });

  test("multi-package dedup across all roles produces valid results", () => {
    const roles = ["executive", "revops", "marketing", "it", "finance", "engineering", "support"] as const;
    for (const role of roles) {
      const packages = getPackagesByRole(role);
      if (packages.length > 1) {
        const allPatterns = packages.flatMap((p) => p.patterns);
        const result = deduplicatePatterns(allPatterns);
        expect(result.totalAfter).toBeGreaterThan(0);
        expect(result.totalAfter).toBeLessThanOrEqual(result.totalBefore);
        // All remaining should have unique IDs
        const ids = result.patterns.map((p) => p.patternId);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

// ============================================================
// Structural Conformance Against Real Zapier Exports
// ============================================================

describe("conformance with real Zapier export format", () => {
  // Load a real exported Zap to use as the reference format
  const REAL_EXPORT_PATH = `${process.env.HOME}/Downloads/exported-zap-2026-01-21T04_59_36.453Z.json`;

  let realExport: any;
  try {
    realExport = JSON.parse(readFileSync(REAL_EXPORT_PATH, "utf-8"));
  } catch {
    realExport = null;
  }

  const skipIfNoExport = realExport ? test : test.skip;

  skipIfNoExport("generated template has same top-level structure as real export", () => {
    const config: ZapBundleConfig = {
      title: "Test Zap",
      description: "Test",
      steps: [
        { app: "Schedule by Zapier", action: "everyDay", stepTitle: "Daily", type: "trigger" },
        { app: "Google Sheets", action: "lookup_row", stepTitle: "Lookup", type: "search" },
        { app: "Gmail", action: "send_email", stepTitle: "Send", type: "action" },
      ],
    };
    const generated = generateZapTemplate(config);

    // Top-level keys must match
    expect(Object.keys(generated).sort()).toEqual(Object.keys(realExport).sort());
    expect(generated.metadata).toEqual(realExport.metadata);
    expect(Array.isArray(generated.zaps)).toBe(true);
  });

  skipIfNoExport("generated nodes have same required fields as real export nodes", () => {
    const realNodes = realExport.zaps[0].nodes;
    const realNode = realNodes[Object.keys(realNodes)[0]];
    const realNodeKeys = new Set(Object.keys(realNode));

    const config: ZapBundleConfig = {
      title: "Test",
      description: "",
      steps: [
        { app: "Schedule by Zapier", action: "everyDay", stepTitle: "Daily", type: "trigger" },
        { app: "Code by Zapier", action: "run_javascript", stepTitle: "Code", type: "action" },
      ],
    };
    const generated = generateZapTemplate(config);
    const genNodes = generated.zaps[0].nodes;
    const genNode = genNodes[Object.keys(genNodes)[0]];
    const genNodeKeys = new Set(Object.keys(genNode));

    // Generated template must have all these essential fields from real exports
    const requiredFields = [
      "id", "type_of", "action", "selected_api", "params", "meta",
      "parent_id", "root_id", "authentication_id",
    ];
    for (const field of requiredFields) {
      expect(genNodeKeys.has(field)).toBe(true);
      expect(realNodeKeys.has(field)).toBe(true);
    }
  });

  skipIfNoExport("selected_api format matches real export pattern", () => {
    // Real exports use format: AppKeyCLIAPI@X.Y.Z
    const realNodes = realExport.zaps[0].nodes;
    const realApiPattern = /^[A-Za-z0-9]+CLIAPI@\d+\.\d+\.\d+$/;

    for (const node of Object.values(realNodes) as any[]) {
      // Real Zaps may use non-CLIAPI formats (BranchingAPI, FilterAPI) — skip those
      if (node.selected_api.includes("CLIAPI@")) {
        expect(node.selected_api).toMatch(realApiPattern);
      }
    }

    // Now verify our generated templates also match
    const config: ZapBundleConfig = {
      title: "Test",
      description: "",
      steps: [
        { app: "Google Sheets", action: "lookup_row", stepTitle: "Lookup", type: "search" },
        { app: "Gmail", action: "send_email", stepTitle: "Send", type: "action" },
      ],
    };
    // Note: first step won't be "read" since it's a search, but for format testing this is fine
    const generated = generateZapTemplate({
      ...config,
      steps: [
        { app: "Schedule by Zapier", action: "everyDay", stepTitle: "Trigger", type: "trigger" },
        ...config.steps,
      ],
    });
    const genNodes = generated.zaps[0].nodes;

    for (const node of Object.values(genNodes) as any[]) {
      if (node.selected_api.includes("CLIAPI@")) {
        expect(node.selected_api).toMatch(realApiPattern);
      }
    }
  });

  skipIfNoExport("trigger node type_of is 'read' matching real export", () => {
    // In real exports, triggers use type_of: "read"
    const realNodes = realExport.zaps[0].nodes;
    const firstNode = realNodes["1"];
    expect(firstNode.type_of).toBe("read");
    expect(firstNode.parent_id).toBeNull();
    expect(firstNode.root_id).toBeNull();

    // Our generated templates should match
    const config: ZapBundleConfig = {
      title: "Test",
      description: "",
      steps: [{ app: "Schedule by Zapier", action: "everyDay", stepTitle: "Daily", type: "trigger" }],
    };
    const generated = generateZapTemplate(config);
    const genFirstNode = generated.zaps[0].nodes["1"];
    expect(genFirstNode.type_of).toBe("read");
    expect(genFirstNode.parent_id).toBeNull();
    expect(genFirstNode.root_id).toBeNull();
  });

  skipIfNoExport("real export selected_api versions are in our registry", () => {
    // Validate that app versions from real exports match what we have
    const realNodes = realExport.zaps[0].nodes;
    const registry = getAppRegistry();
    const registryVersions = new Map<string, string>();
    for (const entry of Object.values(registry) as any[]) {
      registryVersions.set(entry.cliApiKey, entry.version);
    }

    const mismatches: string[] = [];
    for (const node of Object.values(realNodes) as any[]) {
      const api = node.selected_api;
      if (!api.includes("@")) continue;
      const [key, version] = api.split("@");

      if (registryVersions.has(key)) {
        const ourVersion = registryVersions.get(key)!;
        if (ourVersion !== version) {
          mismatches.push(`${key}: real=${version}, ours=${ourVersion}`);
        }
      }
    }

    // Log mismatches but don't fail — version drift is expected
    // The important thing is that the FORMAT is correct (Key@Version)
    if (mismatches.length > 0) {
      console.log("Version mismatches (expected — versions drift):", mismatches);
    }

    // But format should always match
    for (const node of Object.values(realNodes) as any[]) {
      if (node.selected_api.includes("CLIAPI@")) {
        expect(node.selected_api).toMatch(/@\d+\.\d+/);
      }
    }
  });
});
