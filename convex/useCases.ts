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

const VALID_STATUSES = ["identified", "in_progress", "deployed", "future"];
const VALID_EFFORTS = ["low", "medium", "high"];

const metricValidator = v.object({
  name: v.string(),
  before: v.optional(v.string()),
  after: v.optional(v.string()),
  improvement: v.optional(v.string()),
});

const architectureItemValidator = v.object({
  type: v.string(),
  name: v.string(),
  url: v.optional(v.string()),
  zapId: v.optional(v.string()),
  description: v.optional(v.string()),
  status: v.optional(v.string()),
  zapDetails: v.optional(
    v.object({
      title: v.optional(v.string()),
      isEnabled: v.optional(v.boolean()),
      lastSuccessfulRun: v.optional(v.string()),
      steps: v.optional(
        v.array(
          v.object({
            appTitle: v.string(),
            appImageUrl: v.optional(v.string()),
            appColor: v.optional(v.string()),
            actionTitle: v.string(),
            actionType: v.optional(v.string()),
            isInstant: v.optional(v.boolean()),
          })
        )
      ),
      fetchedAt: v.optional(v.number()),
    })
  ),
  zapConfig: v.optional(
    v.object({
      title: v.optional(v.string()),
      steps: v.optional(
        v.array(
          v.object({
            action: v.string(),
            inputs: v.optional(v.any()),
            authentication: v.optional(v.string()),
            alias: v.optional(v.string()),
          })
        )
      ),
    })
  ),
});

export const listByCalculation = query({
  args: { calculationId: v.id("calculations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("useCases")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.calculationId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("useCases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("useCases")
      .withIndex("by_shortId", (q) => q.eq("shortId", args.shortId))
      .unique();
  },
});

export const create = mutation({
  args: {
    calculationId: v.id("calculations"),
    name: v.string(),
    department: v.optional(v.string()),
    status: v.string(),
    implementationEffort: v.string(),
    description: v.optional(v.string()),
    metrics: v.optional(v.array(metricValidator)),
    architecture: v.optional(v.array(architectureItemValidator)),
  },
  handler: async (ctx, args) => {
    // Validate status
    if (!VALID_STATUSES.includes(args.status)) {
      throw new Error(`Invalid status "${args.status}". Valid: ${VALID_STATUSES.join(", ")}`);
    }
    // Validate effort
    if (!VALID_EFFORTS.includes(args.implementationEffort)) {
      throw new Error(
        `Invalid implementationEffort "${args.implementationEffort}". Valid: ${VALID_EFFORTS.join(", ")}`
      );
    }

    const existingCases = await ctx.db
      .query("useCases")
      .withIndex("by_calculationId", (q) => q.eq("calculationId", args.calculationId))
      .collect();
    const maxOrder = existingCases.reduce((max, uc) => Math.max(max, uc.order), -1);
    const now = Date.now();

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

    await ctx.db.patch(args.calculationId, { updatedAt: now });

    const id = await ctx.db.insert("useCases", {
      calculationId: args.calculationId,
      shortId,
      name: args.name,
      department: args.department,
      status: args.status,
      implementationEffort: args.implementationEffort,
      description: args.description,
      metrics: args.metrics,
      architecture: args.architecture,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return { id, shortId };
  },
});

export const update = mutation({
  args: {
    id: v.id("useCases"),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.optional(v.string()),
    implementationEffort: v.optional(v.string()),
    description: v.optional(v.string()),
    metrics: v.optional(v.array(metricValidator)),
    architecture: v.optional(v.array(architectureItemValidator)),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const current = await ctx.db.get(id);
    if (!current) throw new Error("Use case not found");

    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      throw new Error(`Invalid status "${updates.status}"`);
    }
    if (updates.implementationEffort && !VALID_EFFORTS.includes(updates.implementationEffort)) {
      throw new Error(`Invalid implementationEffort "${updates.implementationEffort}"`);
    }

    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        filtered[key] = val;
      }
    }

    if (Object.keys(filtered).length > 0) {
      filtered.updatedAt = Date.now();
      await ctx.db.patch(id, filtered);
      await ctx.db.patch(current.calculationId, { updatedAt: Date.now() });
    }
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("useCases") },
  handler: async (ctx, args) => {
    const useCase = await ctx.db.get(args.id);
    if (useCase) {
      // Unlink all value items from this use case
      const linkedItems = await ctx.db
        .query("valueItems")
        .withIndex("by_calculationId", (q) => q.eq("calculationId", useCase.calculationId))
        .collect();
      for (const item of linkedItems) {
        if (item.useCaseId === args.id) {
          await ctx.db.patch(item._id, { useCaseId: undefined });
        }
      }
      await ctx.db.patch(useCase.calculationId, { updatedAt: Date.now() });
    }
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    calculationId: v.id("calculations"),
    useCaseIds: v.array(v.id("useCases")),
  },
  handler: async (ctx, args) => {
    for (const [index, useCaseId] of args.useCaseIds.entries()) {
      await ctx.db.patch(useCaseId, { order: index, updatedAt: Date.now() });
    }
    await ctx.db.patch(args.calculationId, { updatedAt: Date.now() });
  },
});
