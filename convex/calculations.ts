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

const DEFAULT_ASSUMPTIONS = {
  projectionYears: 3,
  realizationRamp: [0.5, 1, 1],
  annualGrowthRate: 0.1,
  defaultRates: {
    admin: 35,
    operations: 50,
    salesOps: 60,
    engineering: 88,
    manager: 80,
    executive: 105,
  },
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calculations").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("calculations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calculations")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.optional(v.string()),
    priorityOrder: v.optional(v.array(v.string())),
    currentSpend: v.optional(v.number()),
    proposedSpend: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    assumptions: v.optional(
      v.object({
        projectionYears: v.number(),
        realizationRamp: v.array(v.number()),
        annualGrowthRate: v.number(),
        defaultRates: v.object({
          admin: v.number(),
          operations: v.number(),
          salesOps: v.number(),
          engineering: v.number(),
          manager: v.number(),
          executive: v.number(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let shortId = generateShortId();
    let existing = await ctx.db
      .query("calculations")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
    while (existing) {
      shortId = generateShortId();
      existing = await ctx.db
        .query("calculations")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
    }

    const id = await ctx.db.insert("calculations", {
      name: args.name,
      shortId,
      createdAt: now,
      updatedAt: now,
      assumptions: args.assumptions ?? DEFAULT_ASSUMPTIONS,
      role: args.role,
      priorityOrder: args.priorityOrder,
      currentSpend: args.currentSpend,
      proposedSpend: args.proposedSpend,
      companyId: args.companyId,
      talkingPoints: [
        "Automation delivers measurable value across 5 dimensions",
        "ROI projections use conservative realization estimates",
        "Implementation follows a phased rollout approach",
      ],
    });

    return { id, shortId };
  },
});

export const updateName = mutation({
  args: { id: v.id("calculations"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name, updatedAt: Date.now() });
  },
});

export const updateAssumptions = mutation({
  args: {
    id: v.id("calculations"),
    assumptions: v.object({
      projectionYears: v.number(),
      realizationRamp: v.array(v.number()),
      annualGrowthRate: v.number(),
      defaultRates: v.object({
        admin: v.number(),
        operations: v.number(),
        salesOps: v.number(),
        engineering: v.number(),
        manager: v.number(),
        executive: v.number(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      assumptions: args.assumptions,
      updatedAt: Date.now(),
    });
  },
});

export const updateInvestment = mutation({
  args: {
    id: v.id("calculations"),
    currentSpend: v.optional(v.number()),
    proposedSpend: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

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
  },
});

export const updateObfuscation = mutation({
  args: {
    id: v.id("calculations"),
    obfuscation: v.object({
      companyDescriptor: v.optional(v.string()),
      hideNotes: v.optional(v.boolean()),
      roundValues: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      obfuscation: args.obfuscation,
      updatedAt: Date.now(),
    });
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("calculations"),
    role: v.optional(v.string()),
    priorityOrder: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      role: args.role,
      priorityOrder: args.priorityOrder,
      updatedAt: Date.now(),
    });
  },
});

export const listByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    const all = await ctx.db.query("calculations").order("desc").collect();
    return all.filter((c) => c.companyId === companyId);
  },
});

export const updateCompanyId = mutation({
  args: {
    id: v.id("calculations"),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      companyId: args.companyId,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("calculations") },
  handler: async (ctx, args) => {
    // Delete all value items
    const valueItems = await ctx.db
      .query("valueItems")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.id))
      .collect();
    for (const item of valueItems) {
      await ctx.db.delete(item._id);
    }

    // Delete all use cases
    const useCases = await ctx.db
      .query("useCases")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.id))
      .collect();
    for (const uc of useCases) {
      await ctx.db.delete(uc._id);
    }

    // Delete all zap run cache entries
    const zapRunCaches = await ctx.db
      .query("zapRunCache")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.id))
      .collect();
    for (const cache of zapRunCaches) {
      await ctx.db.delete(cache._id);
    }

    await ctx.db.delete(args.id);
  },
});
