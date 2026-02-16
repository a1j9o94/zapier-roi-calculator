import { serve, type Server } from "bun";
import index from "./index.html";
import { handleApiRequest } from "./api";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Endpoint to get public config (Convex URL for frontend)
    "/api/config": () => {
      return Response.json({
        convexUrl: process.env.VITE_CONVEX_URL,
      });
    },

    // API routes - handle all /api/* paths except /api/config
    "/api/*": async (req: Request) => {
      const apiResponse = await handleApiRequest(req);
      if (apiResponse) {
        return apiResponse;
      }
      // Should not reach here, but return 404 if it does
      return Response.json({ error: "Not found" }, { status: 404 });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
