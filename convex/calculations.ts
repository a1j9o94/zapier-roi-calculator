import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Default assumptions for new calculations
const DEFAULT_ASSUMPTIONS = {
  hourlyRates: {
    basic: 25,
    operations: 50,
    engineering: 100,
    executive: 200,
  },
  taskMinutes: {
    simple: 2,
    medium: 8,
    complex: 20,
  },
  projectionYears: 3,
  realizationRamp: [0.5, 1, 1],
  annualGrowthRate: 0.1,
  avgDataBreachCost: 150000,
  avgSupportTicketCost: 150,
};

// Get all calculations (for homepage listing)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calculations")
      .order("desc")
      .collect();
  },
});

// Get single calculation by ID
export const get = query({
  args: { id: v.id("calculations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new calculation with default assumptions
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("calculations", {
      name: args.name,
      createdAt: now,
      updatedAt: now,
      assumptions: DEFAULT_ASSUMPTIONS,
      talkingPoints: [
        "Your automation saves X hours per month",
        "Enterprise eliminates billing disruption risk",
        "SSO/SCIM addresses your security requirements",
      ],
    });
  },
});

// Update calculation name
export const updateName = mutation({
  args: {
    id: v.id("calculations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Update assumptions
export const updateAssumptions = mutation({
  args: {
    id: v.id("calculations"),
    assumptions: v.object({
      hourlyRates: v.object({
        basic: v.number(),
        operations: v.number(),
        engineering: v.number(),
        executive: v.number(),
      }),
      taskMinutes: v.object({
        simple: v.number(),
        medium: v.number(),
        complex: v.number(),
      }),
      projectionYears: v.number(),
      realizationRamp: v.array(v.number()),
      annualGrowthRate: v.number(),
      avgDataBreachCost: v.number(),
      avgSupportTicketCost: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      assumptions: args.assumptions,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Update investment comparison
export const updateInvestment = mutation({
  args: {
    id: v.id("calculations"),
    currentSpend: v.optional(v.number()),
    proposedSpend: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Update talking points
export const updateTalkingPoints = mutation({
  args: {
    id: v.id("calculations"),
    talkingPoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      talkingPoints: args.talkingPoints,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Delete calculation and all its value items
export const remove = mutation({
  args: { id: v.id("calculations") },
  handler: async (ctx, args) => {
    // Delete all value items for this calculation
    const items = await ctx.db
      .query("valueItems")
      .withIndex("by_calculation", (q) => q.eq("calculationId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete the calculation
    await ctx.db.delete(args.id);
    return args.id;
  },
});
