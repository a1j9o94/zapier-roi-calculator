import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
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

    return await ctx.db.insert("useCases", {
      ...args,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
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
      const item = await ctx.db.get(id);
      if (item) {
        await ctx.db.patch(item.calculationId, {
          updatedAt: Date.now(),
        });
      }
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
