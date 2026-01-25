import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// JSON response helper
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Error response helper
function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Parse JSON body helper
async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Validation constants
const VALID_CATEGORIES = [
  "time_savings",
  "revenue_impact",
  "cost_reduction",
  "uptime",
  "security_governance",
  "tool_consolidation",
] as const;
const VALID_RATE_TIERS = ["basic", "operations", "engineering", "executive"] as const;
const VALID_COMPLEXITIES = ["simple", "medium", "complex"] as const;
const VALID_STATUSES = ["identified", "in_progress", "deployed", "future"] as const;
const VALID_DIFFICULTIES = ["low", "medium", "high"] as const;

type Category = (typeof VALID_CATEGORIES)[number];
type RateTier = (typeof VALID_RATE_TIERS)[number];
type Complexity = (typeof VALID_COMPLEXITIES)[number];
type Status = (typeof VALID_STATUSES)[number];
type Difficulty = (typeof VALID_DIFFICULTIES)[number];

// Validation helpers
function isValidCategory(value: unknown): value is Category {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as Category);
}
function isValidRateTier(value: unknown): value is RateTier {
  return typeof value === "string" && VALID_RATE_TIERS.includes(value as RateTier);
}
function isValidComplexity(value: unknown): value is Complexity {
  return typeof value === "string" && VALID_COMPLEXITIES.includes(value as Complexity);
}
function isValidStatus(value: unknown): value is Status {
  return typeof value === "string" && VALID_STATUSES.includes(value as Status);
}
function isValidDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && VALID_DIFFICULTIES.includes(value as Difficulty);
}

// ========================================
// CORS preflight handlers
// ========================================
http.route({
  path: "/api/calculations",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  pathPrefix: "/api/calculations/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// ========================================
// GET /api/calculations - List all calculations
// ========================================
http.route({
  path: "/api/calculations",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const calculations = await ctx.runQuery(api.calculations.list);
    return jsonResponse(calculations);
  }),
});

// ========================================
// POST /api/calculations - Create new calculation
// ========================================
http.route({
  path: "/api/calculations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await parseBody<{ name?: string }>(request);
    if (!body?.name || typeof body.name !== "string") {
      return errorResponse("name is required and must be a string");
    }
    const shortId = await ctx.runMutation(api.calculations.create, { name: body.name });
    const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
    return jsonResponse(calculation, 201);
  }),
});

// ========================================
// GET /api/calculations/:shortId and nested routes
// ========================================
http.route({
  pathPrefix: "/api/calculations/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/calculations/:shortId
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)$/);
    if (calcMatch) {
      const shortId = calcMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }
      return jsonResponse(calculation);
    }

    // GET /api/calculations/:shortId/full
    const fullMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/full$/);
    if (fullMatch) {
      const shortId = fullMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }
      const valueItems = await ctx.runQuery(api.valueItems.listByCalculation, {
        calculationId: calculation._id,
      });
      const useCases = await ctx.runQuery(api.useCases.listByCalculation, {
        calculationId: calculation._id,
      });
      return jsonResponse({ ...calculation, valueItems, useCases });
    }

    // GET /api/calculations/:shortId/value-items
    const valueItemsMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items$/);
    if (valueItemsMatch) {
      const shortId = valueItemsMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }
      const valueItems = await ctx.runQuery(api.valueItems.listByCalculation, {
        calculationId: calculation._id,
      });
      return jsonResponse(valueItems);
    }

    // GET /api/calculations/:shortId/use-cases
    const useCasesMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/use-cases$/);
    if (useCasesMatch) {
      const shortId = useCasesMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }
      const useCases = await ctx.runQuery(api.useCases.listByCalculation, {
        calculationId: calculation._id,
      });
      return jsonResponse(useCases);
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

// ========================================
// PUT routes
// ========================================
http.route({
  pathPrefix: "/api/calculations/",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // PUT /api/calculations/:shortId/full - Full sync
    const fullMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/full$/);
    if (fullMatch) {
      const shortId = fullMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const body = await parseBody<{
        name?: string;
        assumptions?: Record<string, unknown>;
        currentSpend?: number;
        proposedSpend?: number;
        talkingPoints?: string[];
        valueItems?: Array<Record<string, unknown>>;
        useCases?: Array<Record<string, unknown>>;
      }>(request);

      if (!body) {
        return errorResponse("Invalid JSON body");
      }

      // Update calculation fields if provided
      if (body.name) {
        await ctx.runMutation(api.calculations.updateName, {
          id: calculation._id,
          name: body.name,
        });
      }
      if (body.currentSpend !== undefined || body.proposedSpend !== undefined) {
        await ctx.runMutation(api.calculations.updateInvestment, {
          id: calculation._id,
          currentSpend: body.currentSpend,
          proposedSpend: body.proposedSpend,
        });
      }
      if (body.talkingPoints) {
        await ctx.runMutation(api.calculations.updateTalkingPoints, {
          id: calculation._id,
          talkingPoints: body.talkingPoints,
        });
      }

      // Sync value items if provided (by shortId)
      if (body.valueItems && Array.isArray(body.valueItems)) {
        const existingItems = await ctx.runQuery(api.valueItems.listByCalculation, {
          calculationId: calculation._id,
        });
        const existingByShortId = new Map(
          existingItems.filter((i) => i.shortId).map((i) => [i.shortId, i])
        );

        for (const item of body.valueItems) {
          if (item.shortId && typeof item.shortId === "string") {
            const existing = existingByShortId.get(item.shortId);
            if (existing) {
              // Update existing
              await ctx.runMutation(api.valueItems.update, {
                id: existing._id,
                ...(item.name !== undefined && { name: String(item.name) }),
                ...(item.description !== undefined && { description: String(item.description) }),
                ...(item.quantity !== undefined && { quantity: Number(item.quantity) }),
                ...(item.unitValue !== undefined && { unitValue: Number(item.unitValue) }),
                ...(item.rate !== undefined && { rate: Number(item.rate) }),
                ...(item.rateTier !== undefined &&
                  isValidRateTier(item.rateTier) && { rateTier: item.rateTier }),
                ...(item.complexity !== undefined &&
                  isValidComplexity(item.complexity) && { complexity: item.complexity }),
                ...(item.manualAnnualValue !== undefined && {
                  manualAnnualValue: Number(item.manualAnnualValue),
                }),
                ...(item.notes !== undefined && { notes: String(item.notes) }),
              });
            }
          } else if (item.name && item.category && isValidCategory(item.category)) {
            // Create new item
            await ctx.runMutation(api.valueItems.create, {
              calculationId: calculation._id,
              category: item.category,
              name: String(item.name),
              quantity: Number(item.quantity ?? 0),
              unitValue: Number(item.unitValue ?? 0),
              ...(item.description !== undefined && { description: String(item.description) }),
              ...(item.rate !== undefined && { rate: Number(item.rate) }),
              ...(item.rateTier !== undefined &&
                isValidRateTier(item.rateTier) && { rateTier: item.rateTier }),
              ...(item.complexity !== undefined &&
                isValidComplexity(item.complexity) && { complexity: item.complexity }),
              ...(item.notes !== undefined && { notes: String(item.notes) }),
            });
          }
        }
      }

      // Sync use cases if provided (by shortId)
      if (body.useCases && Array.isArray(body.useCases)) {
        const existingCases = await ctx.runQuery(api.useCases.listByCalculation, {
          calculationId: calculation._id,
        });
        const existingByShortId = new Map(
          existingCases.filter((c) => c.shortId).map((c) => [c.shortId, c])
        );

        for (const useCase of body.useCases) {
          if (useCase.shortId && typeof useCase.shortId === "string") {
            const existing = existingByShortId.get(useCase.shortId);
            if (existing) {
              // Update existing
              await ctx.runMutation(api.useCases.update, {
                id: existing._id,
                ...(useCase.name !== undefined && { name: String(useCase.name) }),
                ...(useCase.department !== undefined && { department: String(useCase.department) }),
                ...(useCase.status !== undefined &&
                  isValidStatus(useCase.status) && { status: useCase.status }),
                ...(useCase.difficulty !== undefined &&
                  isValidDifficulty(useCase.difficulty) && { difficulty: useCase.difficulty }),
                ...(useCase.description !== undefined && {
                  description: String(useCase.description),
                }),
                ...(useCase.notes !== undefined && { notes: String(useCase.notes) }),
                ...(useCase.metrics !== undefined && {
                  metrics: useCase.metrics as Array<{
                    name: string;
                    before?: string;
                    after?: string;
                    improvement?: string;
                  }>,
                }),
              });
            }
          } else if (
            useCase.name &&
            isValidStatus(useCase.status) &&
            isValidDifficulty(useCase.difficulty)
          ) {
            // Create new use case
            await ctx.runMutation(api.useCases.create, {
              calculationId: calculation._id,
              name: String(useCase.name),
              status: useCase.status,
              difficulty: useCase.difficulty,
              ...(useCase.department !== undefined && { department: String(useCase.department) }),
              ...(useCase.description !== undefined && {
                description: String(useCase.description),
              }),
              ...(useCase.notes !== undefined && { notes: String(useCase.notes) }),
              ...(useCase.metrics !== undefined && {
                metrics: useCase.metrics as Array<{
                  name: string;
                  before?: string;
                  after?: string;
                  improvement?: string;
                }>,
              }),
            });
          }
        }
      }

      // Return updated calculation with all items
      const updated = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      const valueItems = await ctx.runQuery(api.valueItems.listByCalculation, {
        calculationId: calculation._id,
      });
      const useCases = await ctx.runQuery(api.useCases.listByCalculation, {
        calculationId: calculation._id,
      });
      return jsonResponse({ ...updated, valueItems, useCases });
    }

    // PUT /api/calculations/:shortId/value-items/:itemShortId
    const valueItemMatch = path.match(
      /^\/api\/calculations\/([a-z0-9]+)\/value-items\/([a-z0-9]+)$/
    );
    if (valueItemMatch) {
      const [, calcShortId, itemShortId] = valueItemMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, {
        shortId: calcShortId,
      });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const valueItem = await ctx.runQuery(api.valueItems.getByShortId, { shortId: itemShortId });
      if (!valueItem || valueItem.calculationId !== calculation._id) {
        return errorResponse("Value item not found", 404);
      }

      const body = await parseBody<Record<string, unknown>>(request);
      if (!body) {
        return errorResponse("Invalid JSON body");
      }

      await ctx.runMutation(api.valueItems.update, {
        id: valueItem._id,
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
        ...(body.unitValue !== undefined && { unitValue: Number(body.unitValue) }),
        ...(body.rate !== undefined && { rate: Number(body.rate) }),
        ...(body.rateTier !== undefined &&
          isValidRateTier(body.rateTier) && { rateTier: body.rateTier }),
        ...(body.complexity !== undefined &&
          isValidComplexity(body.complexity) && { complexity: body.complexity }),
        ...(body.manualAnnualValue !== undefined && {
          manualAnnualValue: Number(body.manualAnnualValue),
        }),
        ...(body.notes !== undefined && { notes: String(body.notes) }),
      });

      const updated = await ctx.runQuery(api.valueItems.getByShortId, { shortId: itemShortId });
      return jsonResponse(updated);
    }

    // PUT /api/calculations/:shortId/use-cases/:useCaseShortId
    const useCaseMatch = path.match(
      /^\/api\/calculations\/([a-z0-9]+)\/use-cases\/([a-z0-9]+)$/
    );
    if (useCaseMatch) {
      const [, calcShortId, useCaseShortId] = useCaseMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, {
        shortId: calcShortId,
      });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const useCase = await ctx.runQuery(api.useCases.getByShortId, { shortId: useCaseShortId });
      if (!useCase || useCase.calculationId !== calculation._id) {
        return errorResponse("Use case not found", 404);
      }

      const body = await parseBody<Record<string, unknown>>(request);
      if (!body) {
        return errorResponse("Invalid JSON body");
      }

      await ctx.runMutation(api.useCases.update, {
        id: useCase._id,
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.department !== undefined && { department: String(body.department) }),
        ...(body.status !== undefined && isValidStatus(body.status) && { status: body.status }),
        ...(body.difficulty !== undefined &&
          isValidDifficulty(body.difficulty) && { difficulty: body.difficulty }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.notes !== undefined && { notes: String(body.notes) }),
        ...(body.metrics !== undefined && {
          metrics: body.metrics as Array<{
            name: string;
            before?: string;
            after?: string;
            improvement?: string;
          }>,
        }),
      });

      const updated = await ctx.runQuery(api.useCases.getByShortId, { shortId: useCaseShortId });
      return jsonResponse(updated);
    }

    // PUT /api/calculations/:shortId - Update calculation (partial)
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)$/);
    if (calcMatch) {
      const shortId = calcMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const body = await parseBody<{
        name?: string;
        assumptions?: {
          hourlyRates: { basic: number; operations: number; engineering: number; executive: number };
          taskMinutes: { simple: number; medium: number; complex: number };
          projectionYears: number;
          realizationRamp: number[];
          annualGrowthRate: number;
          avgDataBreachCost: number;
          avgSupportTicketCost: number;
        };
        currentSpend?: number;
        proposedSpend?: number;
        talkingPoints?: string[];
      }>(request);

      if (!body) {
        return errorResponse("Invalid JSON body");
      }

      if (body.name) {
        await ctx.runMutation(api.calculations.updateName, {
          id: calculation._id,
          name: body.name,
        });
      }
      if (body.assumptions) {
        await ctx.runMutation(api.calculations.updateAssumptions, {
          id: calculation._id,
          assumptions: body.assumptions,
        });
      }
      if (body.currentSpend !== undefined || body.proposedSpend !== undefined) {
        await ctx.runMutation(api.calculations.updateInvestment, {
          id: calculation._id,
          currentSpend: body.currentSpend,
          proposedSpend: body.proposedSpend,
        });
      }
      if (body.talkingPoints) {
        await ctx.runMutation(api.calculations.updateTalkingPoints, {
          id: calculation._id,
          talkingPoints: body.talkingPoints,
        });
      }

      const updated = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      return jsonResponse(updated);
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

// ========================================
// POST /api/calculations/:shortId/value-items - Create value item
// POST /api/calculations/:shortId/use-cases - Create use case
// ========================================
http.route({
  pathPrefix: "/api/calculations/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // POST /api/calculations/:shortId/value-items
    const valueItemMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items$/);
    if (valueItemMatch) {
      const shortId = valueItemMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const body = await parseBody<{
        category?: string;
        name?: string;
        description?: string;
        quantity?: number;
        unitValue?: number;
        rate?: number;
        rateTier?: string;
        complexity?: string;
        notes?: string;
      }>(request);

      if (!body) {
        return errorResponse("Invalid JSON body");
      }
      if (!body.name || typeof body.name !== "string") {
        return errorResponse("name is required");
      }
      if (!body.category || !isValidCategory(body.category)) {
        return errorResponse(
          `category is required and must be one of: ${VALID_CATEGORIES.join(", ")}`
        );
      }

      const itemId = await ctx.runMutation(api.valueItems.create, {
        calculationId: calculation._id,
        category: body.category,
        name: body.name,
        quantity: body.quantity ?? 0,
        unitValue: body.unitValue ?? 0,
        ...(body.description !== undefined && { description: body.description }),
        ...(body.rate !== undefined && { rate: body.rate }),
        ...(body.rateTier !== undefined &&
          isValidRateTier(body.rateTier) && { rateTier: body.rateTier }),
        ...(body.complexity !== undefined &&
          isValidComplexity(body.complexity) && { complexity: body.complexity }),
        ...(body.notes !== undefined && { notes: body.notes }),
      });

      const item = await ctx.runQuery(api.valueItems.get, { id: itemId });
      return jsonResponse(item, 201);
    }

    // POST /api/calculations/:shortId/use-cases
    const useCaseMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/use-cases$/);
    if (useCaseMatch) {
      const shortId = useCaseMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const body = await parseBody<{
        name?: string;
        department?: string;
        status?: string;
        difficulty?: string;
        description?: string;
        notes?: string;
        metrics?: Array<{
          name: string;
          before?: string;
          after?: string;
          improvement?: string;
        }>;
        valueItems?: Array<
          | { shortId: string }
          | {
              category: string;
              name: string;
              description?: string;
              quantity: number;
              unitValue: number;
              rate?: number;
              rateTier?: string;
              complexity?: string;
              notes?: string;
            }
        >;
      }>(request);

      if (!body) {
        return errorResponse("Invalid JSON body");
      }
      if (!body.name || typeof body.name !== "string") {
        return errorResponse("name is required");
      }
      if (!body.status || !isValidStatus(body.status)) {
        return errorResponse(`status is required and must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      if (!body.difficulty || !isValidDifficulty(body.difficulty)) {
        return errorResponse(
          `difficulty is required and must be one of: ${VALID_DIFFICULTIES.join(", ")}`
        );
      }

      // Validate: must have at least one metric or one value item
      const hasMetrics =
        body.metrics && body.metrics.length > 0 && body.metrics.some((m) => m.name?.trim());
      const hasValueItems = body.valueItems && body.valueItems.length > 0;
      if (!hasMetrics && !hasValueItems) {
        return errorResponse("Use case must have at least one metric or one value item");
      }

      // Validate and transform valueItems
      let valueItems:
        | Array<
            | { shortId: string }
            | {
                category:
                  | "time_savings"
                  | "revenue_impact"
                  | "cost_reduction"
                  | "uptime"
                  | "security_governance"
                  | "tool_consolidation";
                name: string;
                description?: string;
                quantity: number;
                unitValue: number;
                rate?: number;
                rateTier?: "basic" | "operations" | "engineering" | "executive";
                complexity?: "simple" | "medium" | "complex";
                notes?: string;
              }
          >
        | undefined;

      if (body.valueItems && body.valueItems.length > 0) {
        valueItems = [];
        for (const item of body.valueItems) {
          if ("shortId" in item && typeof item.shortId === "string" && !("category" in item)) {
            // Linking existing item
            valueItems.push({ shortId: item.shortId });
          } else if ("category" in item && isValidCategory(item.category)) {
            // Creating new item
            if (!item.name || typeof item.name !== "string") {
              return errorResponse("valueItems[].name is required for new items");
            }
            valueItems.push({
              category: item.category,
              name: item.name,
              quantity: item.quantity ?? 0,
              unitValue: item.unitValue ?? 0,
              ...(item.description !== undefined && { description: item.description }),
              ...(item.rate !== undefined && { rate: item.rate }),
              ...(item.rateTier !== undefined &&
                isValidRateTier(item.rateTier) && { rateTier: item.rateTier }),
              ...(item.complexity !== undefined &&
                isValidComplexity(item.complexity) && { complexity: item.complexity }),
              ...(item.notes !== undefined && { notes: item.notes }),
            });
          } else {
            return errorResponse(
              "valueItems[] must have either 'shortId' (to link existing) or valid 'category' (to create new)"
            );
          }
        }
      }

      try {
        const useCaseId = await ctx.runMutation(api.useCases.create, {
          calculationId: calculation._id,
          name: body.name,
          status: body.status,
          difficulty: body.difficulty,
          ...(body.department !== undefined && { department: body.department }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.metrics !== undefined && { metrics: body.metrics }),
          ...(valueItems !== undefined && { valueItems }),
        });

        const useCase = await ctx.runQuery(api.useCases.get, { id: useCaseId });
        return jsonResponse(useCase, 201);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return errorResponse(error.message, 404);
        }
        throw error;
      }
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

// ========================================
// DELETE /api/calculations/:shortId - Delete calculation
// DELETE /api/calculations/:shortId/value-items/:itemShortId - Delete value item
// DELETE /api/calculations/:shortId/use-cases/:useCaseShortId - Delete use case
// ========================================
http.route({
  pathPrefix: "/api/calculations/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // DELETE /api/calculations/:shortId/value-items/:itemShortId
    const valueItemMatch = path.match(
      /^\/api\/calculations\/([a-z0-9]+)\/value-items\/([a-z0-9]+)$/
    );
    if (valueItemMatch) {
      const [, calcShortId, itemShortId] = valueItemMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, {
        shortId: calcShortId,
      });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const valueItem = await ctx.runQuery(api.valueItems.getByShortId, { shortId: itemShortId });
      if (!valueItem || valueItem.calculationId !== calculation._id) {
        return errorResponse("Value item not found", 404);
      }

      await ctx.runMutation(api.valueItems.remove, { id: valueItem._id });
      return jsonResponse({ deleted: true });
    }

    // DELETE /api/calculations/:shortId/use-cases/:useCaseShortId
    const useCaseMatch = path.match(
      /^\/api\/calculations\/([a-z0-9]+)\/use-cases\/([a-z0-9]+)$/
    );
    if (useCaseMatch) {
      const [, calcShortId, useCaseShortId] = useCaseMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, {
        shortId: calcShortId,
      });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      const useCase = await ctx.runQuery(api.useCases.getByShortId, { shortId: useCaseShortId });
      if (!useCase || useCase.calculationId !== calculation._id) {
        return errorResponse("Use case not found", 404);
      }

      await ctx.runMutation(api.useCases.remove, { id: useCase._id });
      return jsonResponse({ deleted: true });
    }

    // DELETE /api/calculations/:shortId
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)$/);
    if (calcMatch) {
      const shortId = calcMatch[1];
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) {
        return errorResponse("Calculation not found", 404);
      }

      await ctx.runMutation(api.calculations.remove, { id: calculation._id });
      return jsonResponse({ deleted: true });
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

export default http;
