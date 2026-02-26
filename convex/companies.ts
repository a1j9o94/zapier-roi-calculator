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

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").collect();
  },
});

export const getById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, { shortId }) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let shortId = generateShortId();
    let existing = await ctx.db
      .query("companies")
      .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
      .unique();
    while (existing) {
      shortId = generateShortId();
      existing = await ctx.db
        .query("companies")
        .withIndex("by_shortId", (q) => q.eq("shortId", shortId))
        .unique();
    }

    const now = Date.now();
    const id = await ctx.db.insert("companies", {
      name: args.name,
      shortId,
      industry: args.industry,
      employeeCount: args.employeeCount,
      createdAt: now,
      updatedAt: now,
    });
    return { id, shortId };
  },
});

export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, { id }) => {
    // Unlink all calculations from this company
    const calculations = await ctx.db.query("calculations").collect();
    for (const calc of calculations) {
      if (calc.companyId === id) {
        await ctx.db.patch(calc._id, { companyId: undefined });
      }
    }
    await ctx.db.delete(id);
  },
});
