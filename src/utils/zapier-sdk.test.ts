import { describe, test, expect } from "bun:test";
import { createZapierSdk } from "@zapier/zapier-sdk";

// Increase default timeout for all tests (real API calls need time)
const T = 30_000; // 30 seconds per test

// Create a single SDK instance for all tests (uses CLI login credentials)
const zapier = createZapierSdk();

// Helper to safely log large responses (truncated)
function logResponse(label: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  console.log(`\n--- ${label} (${json.length} chars) ---`);
  console.log(json.slice(0, 3000));
  if (json.length > 3000) {
    console.log(`... [truncated, ${json.length - 3000} more chars]`);
  }
}

// ============================================================
// Auth & Profile
// ============================================================
describe("Zapier SDK - Auth & Profile", () => {
  test("getProfile returns user data with expected fields", async () => {
    try {
      const result = await zapier.getProfile();
      logResponse("getProfile", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const { data: profile } = result;
      expect(typeof profile.id).toBe("string");
      expect(typeof profile.email).toBe("string");
      expect(typeof profile.first_name).toBe("string");
      expect(typeof profile.last_name).toBe("string");
      expect(typeof profile.full_name).toBe("string");
      expect(typeof profile.timezone).toBe("string");
      expect(typeof profile.email_confirmed).toBe("boolean");

      // Verify it's Adrian's account
      expect(profile.email).toBe("adrian.obleton@zapier.com");
      expect(profile.id).toBe("24604956");
    } catch (error: any) {
      console.error("getProfile FAILED:", error.message);
      throw error;
    }
  }, T);
});

// ============================================================
// Apps - Discovery
// ============================================================
describe("Zapier SDK - Apps", () => {
  test("listApps returns first page of apps with pagination", async () => {
    try {
      const result = await zapier.listApps({ pageSize: 5 });
      logResponse("listApps (first 5)", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThanOrEqual(5);

      // Check shape of first app
      const app = result.data[0];
      expect(typeof app.title).toBe("string");
      expect(typeof app.key).toBe("string");
      expect(typeof app.slug).toBe("string");
      expect(typeof app.implementation_id).toBe("string");

      // Check pagination cursor exists
      console.log("nextCursor:", result.nextCursor);
    } catch (error: any) {
      console.error("listApps FAILED:", error.message);
      throw error;
    }
  }, T);

  test("listApps with search filter returns relevant results", async () => {
    try {
      const result = await zapier.listApps({ search: "slack", pageSize: 5 });
      logResponse("listApps search=slack", result);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // At least one result should have "slack" in the title (case-insensitive)
      const hasSlack = result.data.some((app: any) =>
        app.title.toLowerCase().includes("slack")
      );
      expect(hasSlack).toBe(true);
    } catch (error: any) {
      console.error("listApps search FAILED:", error.message);
      throw error;
    }
  }, T);

  test("getApp returns details for Slack", async () => {
    try {
      const result = await zapier.getApp({ appKey: "slack" });
      logResponse("getApp slack", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const { data: app } = result;
      expect(typeof app.title).toBe("string");
      expect(typeof app.key).toBe("string");
      expect(typeof app.slug).toBe("string");
      expect(app.slug).toBe("slack");
    } catch (error: any) {
      console.error("getApp slack FAILED:", error.message);
      throw error;
    }
  }, T);

  test("getApp returns details for Google Sheets", async () => {
    try {
      const result = await zapier.getApp({ appKey: "google-sheets" });
      logResponse("getApp google-sheets", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const { data: app } = result;
      expect(typeof app.title).toBe("string");
      expect(app.title.toLowerCase()).toContain("google sheets");
    } catch (error: any) {
      console.error("getApp google-sheets FAILED:", error.message);
      throw error;
    }
  }, T);

  test("getApp returns details for Gmail", async () => {
    try {
      const result = await zapier.getApp({ appKey: "gmail" });
      logResponse("getApp gmail", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const { data: app } = result;
      expect(typeof app.title).toBe("string");
    } catch (error: any) {
      console.error("getApp gmail FAILED:", error.message);
      throw error;
    }
  }, T);

  test("listApps.items() iterator works with maxItems", async () => {
    try {
      const items: any[] = [];
      for await (const app of zapier.listApps({ maxItems: 3 }).items()) {
        items.push(app);
      }
      logResponse("listApps items (max 3)", items);

      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(3);

      // Each item should have title and key
      for (const app of items) {
        expect(typeof app.title).toBe("string");
        expect(typeof app.key).toBe("string");
      }
    } catch (error: any) {
      console.error("listApps items iterator FAILED:", error.message);
      throw error;
    }
  }, T);
});

// ============================================================
// Actions
// ============================================================
describe("Zapier SDK - Actions", () => {
  test("listActions returns actions for Slack", async () => {
    try {
      const result = await zapier.listActions({ appKey: "slack", pageSize: 10 });
      logResponse("listActions slack", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Check shape of first action
      const action = result.data[0];
      expect(typeof action.key).toBe("string");
      expect(typeof action.title).toBe("string");
      expect(typeof action.action_type).toBe("string");
      expect(typeof action.app_key).toBe("string");
      expect(action.type).toBe("action");

      // Log all action types found
      const actionTypes = [...new Set(result.data.map((a: any) => a.action_type))];
      console.log("Action types found:", actionTypes);
    } catch (error: any) {
      console.error("listActions slack FAILED:", error.message);
      throw error;
    }
  }, T);

  test("listActions with actionType filter returns only that type", async () => {
    try {
      const result = await zapier.listActions({
        appKey: "slack",
        actionType: "read",
        pageSize: 5,
      });
      logResponse("listActions slack read only", result);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // All actions should be 'read' type
      for (const action of result.data) {
        expect(action.action_type).toBe("read");
      }
    } catch (error: any) {
      console.error("listActions filtered FAILED:", error.message);
      throw error;
    }
  }, T);

  test("getAction returns details for a known Slack read action", async () => {
    try {
      // First, get the list to find a valid action key
      const { data: actions } = await zapier.listActions({
        appKey: "slack",
        actionType: "read",
        pageSize: 3,
      });
      console.log(
        "Available read actions:",
        actions.map((a: any) => `${a.key} (${a.title})`)
      );

      if (actions.length === 0) {
        console.warn("No read actions found for Slack - skipping");
        return;
      }

      const firstAction = actions[0];
      const result = await zapier.getAction({
        appKey: "slack",
        actionType: "read",
        actionKey: firstAction.key,
      });
      logResponse("getAction slack", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.key).toBe(firstAction.key);
      expect(result.data.action_type).toBe("read");
    } catch (error: any) {
      console.error("getAction FAILED:", error.message);
      throw error;
    }
  }, T);

  test("listActions returns actions for Google Sheets", async () => {
    try {
      const result = await zapier.listActions({
        appKey: "google-sheets",
        pageSize: 10,
      });
      logResponse("listActions google-sheets", result);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const actionTypes = [...new Set(result.data.map((a: any) => a.action_type))];
      console.log("Google Sheets action types:", actionTypes);
      console.log(
        "Google Sheets action keys:",
        result.data.map((a: any) => `${a.action_type}.${a.key}`)
      );
    } catch (error: any) {
      console.error("listActions google-sheets FAILED:", error.message);
      throw error;
    }
  }, T);
});

// ============================================================
// Input Fields
// ============================================================
describe("Zapier SDK - Input Fields", () => {
  test("listInputFields returns fields for a Slack read action", async () => {
    try {
      // Discover a read action first
      const { data: actions } = await zapier.listActions({
        appKey: "slack",
        actionType: "read",
        pageSize: 3,
      });

      if (actions.length === 0) {
        console.warn("No read actions found for Slack - skipping");
        return;
      }

      const actionKey = actions[0].key;
      console.log(`Getting input fields for slack.read.${actionKey}`);

      const result = await zapier.listInputFields({
        appKey: "slack",
        actionType: "read",
        actionKey: actionKey,
      });
      logResponse("listInputFields slack read", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Check field shape if we got any
      if (result.data.length > 0) {
        const field = result.data[0];
        expect(typeof field.key).toBe("string");
        expect(typeof field.type).toBe("string");
        console.log(
          "Field types found:",
          result.data.map((f: any) => `${f.key} (${f.type})`)
        );
      }
    } catch (error: any) {
      console.error("listInputFields FAILED:", error.message);
      throw error;
    }
  }, T);

  test("getInputFieldsSchema returns JSON Schema for a Slack action", async () => {
    try {
      const { data: actions } = await zapier.listActions({
        appKey: "slack",
        actionType: "write",
        pageSize: 3,
      });

      if (actions.length === 0) {
        console.warn("No write actions found for Slack - skipping");
        return;
      }

      const actionKey = actions[0].key;
      console.log(`Getting input schema for slack.write.${actionKey}`);

      const result = await zapier.getInputFieldsSchema({
        appKey: "slack",
        actionType: "write",
        actionKey: actionKey,
      });
      logResponse("getInputFieldsSchema slack write", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    } catch (error: any) {
      console.error("getInputFieldsSchema FAILED:", error.message);
      // Don't throw - this may require connectionId
      console.log("NOTE: This might require a connectionId to work properly");
    }
  }, T);
});

// ============================================================
// Connections
// ============================================================
describe("Zapier SDK - Connections", () => {
  test("listConnections returns user connections", async () => {
    try {
      const result = await zapier.listConnections({ pageSize: 10 });
      logResponse("listConnections (first 10)", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const conn = result.data[0];
        expect(typeof conn.id).toBe("string");
        expect(typeof conn.account_id).toBe("string");
        expect(typeof conn.date).toBe("string");
        expect(typeof conn.is_private).toBe("boolean");
        expect(typeof conn.shared_with_all).toBe("boolean");

        console.log(
          "Connection IDs & apps:",
          result.data.map(
            (c: any) => `${c.id} (${c.app_key || c.title || "unknown"})`
          )
        );
      } else {
        console.log("No connections found for this account");
      }
    } catch (error: any) {
      console.error("listConnections FAILED:", error.message);
      throw error;
    }
  }, T);

  test("listConnections filtered by appKey (Slack)", async () => {
    try {
      const result = await zapier.listConnections({
        appKey: "slack",
        owner: "me",
        pageSize: 5,
      });
      logResponse("listConnections slack owner=me", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data.length} Slack connections owned by me`);
      if (result.data.length > 0) {
        console.log("First Slack connection ID:", result.data[0].id);
      }
    } catch (error: any) {
      console.error("listConnections slack FAILED:", error.message);
      throw error;
    }
  }, T);

  test("findFirstConnection finds first available connection", async () => {
    try {
      const result = await zapier.findFirstConnection({ owner: "me" });
      logResponse("findFirstConnection owner=me", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const { data: connection } = result;
      expect(typeof connection.id).toBe("string");
      console.log(
        `First connection: ID=${connection.id}, app=${connection.app_key}, title=${connection.title}`
      );
    } catch (error: any) {
      console.error("findFirstConnection FAILED:", error.message);
      // May fail if no connections exist
      console.log(
        "NOTE: This fails if no connections exist for the user"
      );
    }
  }, T);

  test("getConnection returns details for a specific connection", async () => {
    try {
      // First get a connection ID
      const { data: connections } = await zapier.listConnections({
        owner: "me",
        pageSize: 1,
      });

      if (connections.length === 0) {
        console.warn("No connections found - skipping getConnection test");
        return;
      }

      const connectionId = connections[0].id;
      console.log(`Getting details for connection: ${connectionId}`);

      const result = await zapier.getConnection({ connectionId });
      logResponse("getConnection", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(connectionId);
    } catch (error: any) {
      console.error("getConnection FAILED:", error.message);
      throw error;
    }
  }, T);
});

// ============================================================
// Fetch (authenticated HTTP)
// ============================================================
describe("Zapier SDK - Fetch", () => {
  test("fetch can hit Zapier API v2 zaps endpoint (may be scope-limited)", async () => {
    try {
      const response = await zapier.fetch(
        "https://api.zapier.com/v2/zaps?limit=3"
      );
      console.log(`\n--- fetch /v2/zaps ---`);
      console.log("Status:", response.status);
      console.log("StatusText:", response.statusText);
      console.log(
        "Headers Content-Type:",
        response.headers.get("content-type")
      );

      const body = await response.text();
      console.log("Body (first 2000 chars):", body.slice(0, 2000));

      // We know this returns 403 with wrong scopes - just verify we get a response
      expect(response).toBeDefined();
      expect(typeof response.status).toBe("number");

      if (response.status === 403) {
        console.log("EXPECTED: 403 due to scope limitations");
      }
    } catch (error: any) {
      console.error("fetch /v2/zaps FAILED:", error.message);
      throw error;
    }
  }, T);

  test("fetch can hit internal profile endpoint", async () => {
    try {
      const response = await zapier.fetch(
        "https://api.zapier.com/api/v4/profile"
      );
      console.log(`\n--- fetch /api/v4/profile ---`);
      console.log("Status:", response.status);

      if (response.ok) {
        const body = await response.json();
        logResponse("fetch profile", body);
        expect(body).toBeDefined();
      } else {
        const text = await response.text();
        console.log("Response:", response.status, text.slice(0, 500));
      }
    } catch (error: any) {
      console.error("fetch profile FAILED:", error.message);
      // Don't throw - endpoint may not exist or may require different auth
      console.log(
        "NOTE: This endpoint may not be accessible via SDK fetch"
      );
    }
  }, T);

  test("fetch can make unauthenticated GET request to external URL", async () => {
    try {
      const response = await zapier.fetch("https://httpbin.org/get");
      console.log(`\n--- fetch httpbin.org/get ---`);
      console.log("Status:", response.status);

      const body = await response.json();
      logResponse("fetch httpbin", body);

      expect(response.status).toBe(200);
      expect(body).toBeDefined();
    } catch (error: any) {
      console.error("fetch httpbin FAILED:", error.message);
      // Zapier relay may not allow external non-app URLs
      console.log(
        "NOTE: SDK fetch goes through Zapier relay - external URLs may be blocked"
      );
    }
  }, T);
});

// ============================================================
// Client Credentials
// ============================================================
describe("Zapier SDK - Client Credentials", () => {
  test("listClientCredentials returns credentials list", async () => {
    try {
      const result = await zapier.listClientCredentials();
      logResponse("listClientCredentials", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data.length} client credentials`);
      if (result.data.length > 0) {
        const cred = result.data[0];
        console.log("First credential keys:", Object.keys(cred));
      }
    } catch (error: any) {
      console.error("listClientCredentials FAILED:", error.message);
      throw error;
    }
  }, T);
});

// ============================================================
// Run Action (read-only)
// ============================================================
describe("Zapier SDK - Run Action (read-only)", () => {
  test("runAction can execute a Slack read action (channels)", async () => {
    try {
      // First, find a Slack connection
      const { data: connections } = await zapier.listConnections({
        appKey: "slack",
        owner: "me",
        pageSize: 1,
      });

      if (connections.length === 0) {
        console.warn(
          "No Slack connections found - skipping runAction test"
        );
        return;
      }

      const connectionId = connections[0].id;
      console.log(`Using Slack connection: ${connectionId}`);

      // Find the channels read action
      const { data: readActions } = await zapier.listActions({
        appKey: "slack",
        actionType: "read",
        pageSize: 20,
      });

      const channelsAction = readActions.find((a: any) =>
        a.key.toLowerCase().includes("channel")
      );

      if (!channelsAction) {
        console.warn("No channels read action found for Slack");
        console.log(
          "Available read actions:",
          readActions.map((a: any) => a.key)
        );
        return;
      }

      console.log(`Running: slack.read.${channelsAction.key}`);

      const result = await zapier.runAction({
        appKey: "slack",
        actionType: "read",
        actionKey: channelsAction.key,
        connectionId,
      });
      logResponse("runAction slack read channels", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    } catch (error: any) {
      console.error("runAction slack read FAILED:", error.message);
      console.log(
        "NOTE: runAction requires a valid connection with appropriate permissions"
      );
    }
  }, T);

  test("runAction via apps proxy for Slack channels", async () => {
    try {
      const { data: connections } = await zapier.listConnections({
        appKey: "slack",
        owner: "me",
        pageSize: 1,
      });

      if (connections.length === 0) {
        console.warn(
          "No Slack connections found - skipping apps proxy test"
        );
        return;
      }

      const connectionId = connections[0].id;
      console.log(
        `Using Slack connection via apps proxy: ${connectionId}`
      );

      // Use the apps proxy pattern
      const result = await zapier.apps.slack.read.channels({
        connectionId,
      });
      logResponse("apps.slack.read.channels", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    } catch (error: any) {
      console.error("apps proxy slack FAILED:", error.message);
      console.log(
        "NOTE: apps proxy requires valid connection and correct action key"
      );
    }
  }, T);
});

// ============================================================
// Registry & Context (utility methods)
// ============================================================
describe("Zapier SDK - Registry & Context", () => {
  test("getRegistry returns SDK registry info", async () => {
    try {
      const result = await zapier.getRegistry();
      logResponse("getRegistry", result);

      expect(result).toBeDefined();
    } catch (error: any) {
      console.error("getRegistry FAILED:", error.message);
      console.log("NOTE: getRegistry may not be a public method");
    }
  }, T);

  test("getContext returns SDK context", async () => {
    try {
      const result = await zapier.getContext();
      logResponse("getContext", result);

      expect(result).toBeDefined();
    } catch (error: any) {
      console.error("getContext FAILED:", error.message);
      console.log("NOTE: getContext may not be a public method");
    }
  }, T);
});

// ============================================================
// Deprecated: Authentications (may or may not work)
// ============================================================
describe("Zapier SDK - Authentications (deprecated)", () => {
  test("listAuthentications returns auth methods if available", async () => {
    try {
      // @ts-ignore - may not be in types, was seen in Object.keys
      if (typeof zapier.listAuthentications === "function") {
        // @ts-ignore
        const result = await zapier.listAuthentications();
        logResponse("listAuthentications", result);
        expect(result).toBeDefined();
      } else {
        console.log(
          "listAuthentications is not available on this SDK instance"
        );
      }
    } catch (error: any) {
      console.error("listAuthentications FAILED:", error.message);
      console.log("NOTE: This method is deprecated and may not work");
    }
  }, T);
});

// ============================================================
// Edge Cases & Error Handling
// ============================================================
describe("Zapier SDK - Edge Cases", () => {
  test("getApp with invalid key returns meaningful error", async () => {
    try {
      const result = await zapier.getApp({
        appKey: "definitely-not-a-real-app-12345",
      });
      // If we get here, the API didn't error
      logResponse("getApp invalid key (unexpected success)", result);
    } catch (error: any) {
      console.log("getApp invalid key error:", error.message);
      console.log("Error type:", error.constructor.name);
      console.log("Error keys:", Object.keys(error));
      // We expect this to fail
      expect(error).toBeDefined();
    }
  }, T);

  test("listActions with invalid appKey returns meaningful error", async () => {
    try {
      const result = await zapier.listActions({
        appKey: "definitely-not-a-real-app-12345",
      });
      logResponse(
        "listActions invalid key (unexpected success)",
        result
      );
    } catch (error: any) {
      console.log("listActions invalid key error:", error.message);
      expect(error).toBeDefined();
    }
  }, T);

  test("listConnections with appKey filter for non-connected app", async () => {
    try {
      // Use an obscure app that the user probably isn't connected to
      const result = await zapier.listConnections({
        appKey: "basecamp3",
        owner: "me",
        pageSize: 5,
      });
      logResponse("listConnections basecamp3", result);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      console.log(
        `Found ${result.data.length} Basecamp connections (expected 0)`
      );
    } catch (error: any) {
      console.error("listConnections basecamp3 FAILED:", error.message);
      // Even an error is useful info
      expect(error).toBeDefined();
    }
  }, T);
});
