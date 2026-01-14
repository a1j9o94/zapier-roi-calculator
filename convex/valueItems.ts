import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// Get all value items for a calculation
export const listByCalculation = query({
  args: { calculationId: v.id("calculations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("valueItems")
      .withIndex("by_calculation", (q) => q.eq("calculationId", args.calculationId))
      .collect();
  },
});

// Get single value item
export const get = query({
  args: { id: v.id("valueItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new value item
export const create = mutation({
  args: {
    calculationId: v.id("calculations"),
    category: categoryValidator,
    name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    unitValue: v.number(),
    rate: v.optional(v.number()),
    rateTier: v.optional(rateTierValidator),
    complexity: v.optional(complexityValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the current max order for this calculation and category
    const existingItems = await ctx.db
      .query("valueItems")
      .withIndex("by_calculation", (q) => q.eq("calculationId", args.calculationId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();

    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1);

    // Update the calculation's updatedAt timestamp
    await ctx.db.patch(args.calculationId, {
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("valueItems", {
      ...args,
      order: maxOrder + 1,
    });
  },
});

// Update value item
export const update = mutation({
  args: {
    id: v.id("valueItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unitValue: v.optional(v.number()),
    rate: v.optional(v.number()),
    rateTier: v.optional(rateTierValidator),
    complexity: v.optional(complexityValidator),
    manualAnnualValue: v.optional(v.number()),
    notes: v.optional(v.string()),
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

// Delete value item
export const remove = mutation({
  args: { id: v.id("valueItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      // Update the calculation's updatedAt timestamp
      await ctx.db.patch(item.calculationId, {
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Reorder items within a category
export const reorder = mutation({
  args: {
    calculationId: v.id("calculations"),
    category: categoryValidator,
    itemIds: v.array(v.id("valueItems")),
  },
  handler: async (ctx, args) => {
    // Update order for each item
    for (const [index, itemId] of args.itemIds.entries()) {
      await ctx.db.patch(itemId, { order: index });
    }

    // Update the calculation's updatedAt timestamp
    await ctx.db.patch(args.calculationId, {
      updatedAt: Date.now(),
    });

    return args.calculationId;
  },
});
