import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Generate a short alphanumeric ID (6 chars = 2 billion combinations)
function generateShortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const statusValidator = v.union(
  v.literal("identified"),
  v.literal("in_progress"),
  v.literal("deployed"),
  v.literal("future")
);

const difficultyValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

const metricValidator = v.object({
  name: v.string(),
  before: v.optional(v.string()),
  after: v.optional(v.string()),
  improvement: v.optional(v.string()),
});

const categoryValidator = v.union(
  v.literal("time_savings"),
  v.literal("revenue_impact"),
  v.literal("cost_reduction"),
  v.literal("uptime"),
  v.literal("security_governance"),
  v.literal("tool_consolidation")
);

const rateTierValidator = v.union(
  v.literal("basic"),
  v.literal("operations"),
  v.literal("engineering"),
  v.literal("executive")
);

const complexityValidator = v.union(
  v.literal("simple"),
  v.literal("medium"),
  v.literal("complex")
);

const valueItemInputValidator = v.object({
  category: categoryValidator,
  name: v.string(),
  description: v.optional(v.string()),
  quantity: v.number(),
  unitValue: v.number(),
  rate: v.optional(v.number()),
  rateTier: v.optional(rateTierValidator),
  complexity: v.optional(complexityValidator),
  notes: v.optional(v.string()),
});

// Helper to check if metrics array has at least one valid metric
function hasValidMetrics(metrics: { name: string }[] | undefined): boolean {
  return metrics !== undefined && metrics.length > 0 && metrics.some((m) => m.name.trim() !== "");
}

// Get all use cases for a calculation
export const listByCalculation = query({
  args: { calculationId: v.id("calculations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("useCases")
      .withIndex("by_calculation", (q) => q.eq("calculationId", args.calculationId))
      .collect();
  },
});

// Get single use case
export const get = query({
  args: { id: v.id("useCases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get use case by short ID
export const getByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("useCases")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
  },
});

// Create new use case
export const create = mutation({
  args: {
    calculationId: v.id("calculations"),
    name: v.string(),
    department: v.optional(v.string()),
    status: statusValidator,
    difficulty: difficultyValidator,
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    metrics: v.optional(v.array(metricValidator)),
    valueItems: v.optional(v.array(valueItemInputValidator)),
  },
  handler: async (ctx, args) => {
    const { valueItems, ...useCaseData } = args;

    // Validate: must have at least one metric or one value item
    const hasMetrics = hasValidMetrics(args.metrics);
    const hasValueItems = valueItems !== undefined && valueItems.length > 0;

    if (!hasMetrics && !hasValueItems) {
      throw new Error("Use case must have at least one metric or one value item");
    }

    // Get the current max order for this calculation
    const existingItems = await ctx.db
      .query("useCases")
      .withIndex("by_calculation", (q) => q.eq("calculationId", args.calculationId))
      .collect();

    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1);
    const now = Date.now();

    // Update the calculation's updatedAt timestamp
    await ctx.db.patch(args.calculationId, {
      updatedAt: now,
    });

    // Generate unique short ID (retry if collision)
    let shortId = generateShortId();
    let existing = await ctx.db
      .query("useCases")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();

    while (existing) {
      shortId = generateShortId();
      existing = await ctx.db
        .query("useCases")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
    }

    const useCaseId = await ctx.db.insert("useCases", {
      ...useCaseData,
      shortId,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    // Create inline value items if provided
    if (valueItems && valueItems.length > 0) {
      for (let i = 0; i < valueItems.length; i++) {
        const item = valueItems[i]!;

        // Generate unique short ID for value item
        let itemShortId = generateShortId();
        let existingItem = await ctx.db
          .query("valueItems")
          .withIndex("by_shortId", (q) => q.eq("shortId", itemShortId))
          .unique();

        while (existingItem) {
          itemShortId = generateShortId();
          existingItem = await ctx.db
            .query("valueItems")
            .withIndex("by_shortId", (q) => q.eq("shortId", itemShortId))
            .unique();
        }

        await ctx.db.insert("valueItems", {
          calculationId: args.calculationId,
          shortId: itemShortId,
          category: item.category,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitValue: item.unitValue,
          rate: item.rate,
          rateTier: item.rateTier,
          complexity: item.complexity,
          notes: item.notes,
          order: i,
          useCaseId,
        });
      }
    }

    return useCaseId;
  },
});

// Update use case
export const update = mutation({
  args: {
    id: v.id("useCases"),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.optional(statusValidator),
    difficulty: v.optional(difficultyValidator),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    metrics: v.optional(v.array(metricValidator)),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get current use case
    const current = await ctx.db.get(id);
    if (!current) {
      throw new Error("Use case not found");
    }

    // If metrics are being updated, validate that use case will still have metrics or linked value items
    if (updates.metrics !== undefined) {
      const newMetrics = updates.metrics;
      const willHaveMetrics = hasValidMetrics(newMetrics);

      if (!willHaveMetrics) {
        // Check if there are linked value items
        const linkedItems = await ctx.db
          .query("valueItems")
          .withIndex("by_calculation", (q) => q.eq("calculationId", current.calculationId))
          .filter((q) => q.eq(q.field("useCaseId"), id))
          .collect();

        if (linkedItems.length === 0) {
          throw new Error("Use case must have at least one metric or one linked value item");
        }
      }
    }

    // Filter out undefined values
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        filtered[key] = val;
      }
    }

    if (Object.keys(filtered).length > 0) {
      filtered.updatedAt = Date.now();
      await ctx.db.patch(id, filtered);

      // Update the calculation's updatedAt timestamp
      await ctx.db.patch(current.calculationId, {
        updatedAt: Date.now(),
      });
    }
    return id;
  },
});

// Delete use case
export const remove = mutation({
  args: { id: v.id("useCases") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      // Unlink all value items linked to this use case
      const linkedValueItems = await ctx.db
        .query("valueItems")
        .withIndex("by_calculation", (q) => q.eq("calculationId", item.calculationId))
        .collect();

      for (const valueItem of linkedValueItems) {
        if (valueItem.useCaseId === args.id) {
          await ctx.db.patch(valueItem._id, { useCaseId: undefined });
        }
      }

      // Update the calculation's updatedAt timestamp
      await ctx.db.patch(item.calculationId, {
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Reorder use cases
export const reorder = mutation({
  args: {
    calculationId: v.id("calculations"),
    useCaseIds: v.array(v.id("useCases")),
  },
  handler: async (ctx, args) => {
    // Update order for each use case
    for (const [index, useCaseId] of args.useCaseIds.entries()) {
      await ctx.db.patch(useCaseId, { order: index, updatedAt: Date.now() });
    }

    // Update the calculation's updatedAt timestamp
    await ctx.db.patch(args.calculationId, {
      updatedAt: Date.now(),
    });

    return args.calculationId;
  },
});

// Migration: Add shortId to existing use cases
export const migrateAddShortIds = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("useCases").collect();
    let migrated = 0;

    for (const item of items) {
      if (!item.shortId) {
        // Generate unique short ID
        let shortId = generateShortId();
        let existing = await ctx.db
          .query("useCases")
          .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
          .unique();

        while (existing) {
          shortId = generateShortId();
          existing = await ctx.db
            .query("useCases")
            .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
            .unique();
        }

        await ctx.db.patch(item._id, { shortId });
        migrated++;
      }
    }

    return { migrated, total: items.length };
  },
});
