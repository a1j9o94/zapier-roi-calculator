/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

// Build-time injected value (for static hosting)
declare const __CONVEX_URL__: string | undefined;

interface AppConfig {
  convexUrl: string;
}

async function getConfig(): Promise<AppConfig> {
  // Try build-time injected value first (static hosting)
  if (typeof __CONVEX_URL__ !== "undefined" && __CONVEX_URL__) {
    return { convexUrl: __CONVEX_URL__ };
  }

  // Fall back to API endpoint (dev server with Bun)
  const configResponse = await fetch("/api/config");
  if (!configResponse.ok) {
    throw new Error(`Failed to fetch config: ${String(configResponse.status)}`);
  }
  return (await configResponse.json()) as AppConfig;
}

async function init() {
  const config = await getConfig();

  if (!config.convexUrl) {
    throw new Error(
      "Convex URL is not configured. Run `bunx convex dev` and set VITE_CONVEX_URL environment variable."
    );
  }

  // Initialize Convex client with URL from config
  const convex = new ConvexReactClient(config.convexUrl);

  const elem = document.getElementById("root");
  if (!elem) {
    throw new Error("Root element not found");
  }

  const app = (
    <StrictMode>
      <ConvexProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProvider>
    </StrictMode>
  );

  // Render the app
  createRoot(elem).render(app);
}

init().catch((error: unknown) => {
  console.error("Failed to initialize app:", error);
  const elem = document.getElementById("root");
  if (elem) {
    elem.innerHTML = `
      <div style="color: #ef4444; padding: 40px; font-family: system-ui, sans-serif;">
        <h1>Configuration Error</h1>
        <p>Failed to load app configuration.</p>
        <p style="color: #9ca3af; font-size: 14px;">
          Make sure to run <code>bunx convex dev</code> and check that VITE_CONVEX_URL is set in your .env file.
        </p>
      </div>
    `;
  }
});
