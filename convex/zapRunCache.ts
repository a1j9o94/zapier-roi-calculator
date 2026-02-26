import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertRunData = mutation({
  args: {
    zapId: v.string(),
    useCaseId: v.id("useCases"),
    calculationId: v.id("calculations"),
    totalRuns: v.number(),
    runsLast30Days: v.number(),
    runsLast7Days: v.number(),
    successfulRuns: v.number(),
    failedRuns: v.number(),
    lastRunAt: v.optional(v.string()),
    realizationRate: v.optional(v.number()),
    realizedAnnualValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("zapRunCache")
      .withIndex("by_zapId", (q) => q.eq("zapId", args.zapId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, fetchedAt: Date.now() });
      return existing._id;
    } else {
      return await ctx.db.insert("zapRunCache", {
        ...args,
        fetchedAt: Date.now(),
      });
    }
  },
});

export const getByCalculation = query({
  args: { calculationId: v.id("calculations") },
  handler: async (ctx, { calculationId }) => {
    return await ctx.db
      .query("zapRunCache")
      .withIndex("by_calculationId", (q) =>
        q.eq("calculationId", calculationId)
      )
      .collect();
  },
});

export const removeByCalculation = mutation({
  args: { calculationId: v.id("calculations") },
  handler: async (ctx, { calculationId }) => {
    const entries = await ctx.db
      .query("zapRunCache")
      .withIndex("by_calculationId", (q) =>
        q.eq("calculationId", calculationId)
      )
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
  },
});
