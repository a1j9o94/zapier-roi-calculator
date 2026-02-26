import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function generateShortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Archetype → Dimension mapping (server-side copy to avoid importing frontend types)
const ARCHETYPE_DIMENSIONS: Record<string, string> = {
  pipeline_velocity: "revenue_impact",
  revenue_capture: "revenue_impact",
  revenue_expansion: "revenue_impact",
  time_to_revenue: "revenue_impact",
  process_acceleration: "speed_cycle_time",
  handoff_elimination: "speed_cycle_time",
  task_elimination: "productivity",
  task_simplification: "productivity",
  context_surfacing: "productivity",
  labor_avoidance: "cost_avoidance",
  tool_consolidation: "cost_avoidance",
  error_rework_elimination: "cost_avoidance",
  compliance_assurance: "risk_quality",
  data_integrity: "risk_quality",
  incident_prevention: "risk_quality",
  process_consistency: "risk_quality",
};

const VALID_ARCHETYPES = Object.keys(ARCHETYPE_DIMENSIONS);

export const listByCalculation = query({
  args: { calculationId: v.id("calculations") },
  handler: async (ctx, args) => {
    const calculation = await ctx.db.get(args.calculationId);

    // If calculation has useCaseIds, collect value items from those use cases
    // plus any unlinked items that belong directly to this calculation
    if (calculation?.useCaseIds && calculation.useCaseIds.length > 0) {
      const useCaseIdSet = new Set(calculation.useCaseIds);

      // Get all value items for this calculation (includes unlinked items)
      const directItems = await ctx.db
        .query("valueItems")
        .withIndex("by_calculationId", (q) => q.eq("calculationId", args.calculationId))
        .collect();

      // Get value items linked to shared use cases (may be on a different calculationId)
      const useCaseItems: typeof directItems = [];
      for (const ucId of calculation.useCaseIds) {
        // Value items linked to this use case might have a different calculationId
        // (they belong to the use case's original calculator but are shared here)
        const useCase = await ctx.db.get(ucId);
        if (useCase && useCase.calculationId !== args.calculationId) {
          const items = await ctx.db
            .query("valueItems")
            .withIndex("by_calculationId", (q) => q.eq("calculationId", useCase.calculationId))
            .collect();
          for (const item of items) {
            if (item.useCaseId && useCaseIdSet.has(item.useCaseId)) {
              useCaseItems.push(item);
            }
          }
        }
      }

      // Combine: direct items + shared use case items (dedup by _id)
      const seenIds = new Set(directItems.map((i) => i._id));
      const combined = [...directItems];
      for (const item of useCaseItems) {
        if (!seenIds.has(item._id)) {
          combined.push(item);
          seenIds.add(item._id);
        }
      }

      return combined;
    }

    // Fallback: old model
    return await ctx.db
      .query("valueItems")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.calculationId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("valueItems").collect();
  },
});

export const get = query({
  args: { id: v.id("valueItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("valueItems")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
  },
});

export const create = mutation({
  args: {
    calculationId: v.id("calculations"),
    archetype: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    inputs: v.any(),
    manualAnnualValue: v.optional(v.number()),
    useCaseId: v.optional(v.id("useCases")),
  },
  handler: async (ctx, args) => {
    // Validate archetype
    if (!VALID_ARCHETYPES.includes(args.archetype)) {
      throw new Error(
        `Invalid archetype "${args.archetype}". Valid archetypes: ${VALID_ARCHETYPES.join(", ")}`
      );
    }

    // Derive dimension from archetype
    const dimension = ARCHETYPE_DIMENSIONS[args.archetype]!;

    // Get max order for this calculation
    const existingItems = await ctx.db
      .query("valueItems")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.calculationId))
      .collect();
    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1);

    // Generate unique short ID
    let shortId = generateShortId();
    let existing = await ctx.db
      .query("valueItems")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
    while (existing) {
      shortId = generateShortId();
      existing = await ctx.db
        .query("valueItems")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
    }

    // Update calculation timestamp
    await ctx.db.patch(args.calculationId, { updatedAt: Date.now() });

    return await ctx.db.insert("valueItems", {
      calculationId: args.calculationId,
      shortId,
      archetype: args.archetype,
      dimension,
      name: args.name,
      description: args.description,
      inputs: args.inputs ?? {},
      manualAnnualValue: args.manualAnnualValue,
      useCaseId: args.useCaseId,
      order: maxOrder + 1,
    });
  },
});

export const createBatch = mutation({
  args: {
    calculationId: v.id("calculations"),
    items: v.array(
      v.object({
        archetype: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        inputs: v.any(),
        manualAnnualValue: v.optional(v.number()),
        useCaseId: v.optional(v.id("useCases")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    // Get max order
    const existingItems = await ctx.db
      .query("valueItems")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.calculationId))
      .collect();
    let nextOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1) + 1;

    for (const item of args.items) {
      if (!VALID_ARCHETYPES.includes(item.archetype)) {
        throw new Error(`Invalid archetype "${item.archetype}"`);
      }

      const dimension = ARCHETYPE_DIMENSIONS[item.archetype]!;

      let shortId = generateShortId();
      let existing = await ctx.db
        .query("valueItems")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
      while (existing) {
        shortId = generateShortId();
        existing = await ctx.db
          .query("valueItems")
          .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
          .unique();
      }

      const id = await ctx.db.insert("valueItems", {
        calculationId: args.calculationId,
        shortId,
        archetype: item.archetype,
        dimension,
        name: item.name,
        description: item.description,
        inputs: item.inputs ?? {},
        manualAnnualValue: item.manualAnnualValue,
        useCaseId: item.useCaseId,
        order: nextOrder++,
      });

      results.push({ id, shortId });
    }

    await ctx.db.patch(args.calculationId, { updatedAt: Date.now() });
    return results;
  },
});

export const update = mutation({
  args: {
    id: v.id("valueItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    archetype: v.optional(v.string()),
    inputs: v.optional(v.any()),
    manualAnnualValue: v.optional(v.number()),
    useCaseId: v.optional(v.id("useCases")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        filtered[key] = val;
      }
    }

    // Special case: allow clearing manualAnnualValue by passing -1
    if (args.manualAnnualValue === -1) {
      filtered.manualAnnualValue = undefined;
    }

    // If archetype is being changed, update dimension too
    if (filtered.archetype) {
      const archetype = filtered.archetype as string;
      if (!VALID_ARCHETYPES.includes(archetype)) {
        throw new Error(`Invalid archetype "${archetype}"`);
      }
      filtered.dimension = ARCHETYPE_DIMENSIONS[archetype];
    }

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(id, filtered);
      const item = await ctx.db.get(id);
      if (item) {
        await ctx.db.patch(item.calculationId, { updatedAt: Date.now() });
      }
    }
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("valueItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      await ctx.db.patch(item.calculationId, { updatedAt: Date.now() });
    }
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    calculationId: v.id("calculations"),
    itemIds: v.array(v.id("valueItems")),
  },
  handler: async (ctx, args) => {
    for (const [index, itemId] of args.itemIds.entries()) {
      await ctx.db.patch(itemId, { order: index });
    }
    await ctx.db.patch(args.calculationId, { updatedAt: Date.now() });
  },
});

export const unlinkUseCase = mutation({
  args: { id: v.id("valueItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item && item.useCaseId) {
      await ctx.db.patch(args.id, { useCaseId: undefined });
      await ctx.db.patch(item.calculationId, { updatedAt: Date.now() });
    }
  },
});
