import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ROI Calculation (shareable document)
  calculations: defineTable({
    name: v.string(), // Customer/project name
    shortId: v.optional(v.string()), // Short URL-friendly ID (e.g., "abc123")
    createdAt: v.number(),
    updatedAt: v.number(),

    // Global Assumptions
    assumptions: v.object({
      // Labor costs by tier
      hourlyRates: v.object({
        basic: v.number(), // Default: $25 (admin staff)
        operations: v.number(), // Default: $50 (ops/IT)
        engineering: v.number(), // Default: $100 (engineering)
        executive: v.number(), // Default: $200 (leadership)
      }),

      // Task complexity multipliers (minutes per task)
      taskMinutes: v.object({
        simple: v.number(), // Default: 2 min
        medium: v.number(), // Default: 8 min
        complex: v.number(), // Default: 20 min
      }),

      // Projection settings
      projectionYears: v.number(), // Default: 3
      realizationRamp: v.array(v.number()), // Default: [0.5, 1, 1] for Y1/Y2/Y3
      annualGrowthRate: v.number(), // Default: 0.1 (10% YoY)

      // Risk assumptions
      avgDataBreachCost: v.number(), // Default: $150,000
      avgSupportTicketCost: v.number(), // Default: $150
    }),

    // Investment comparison
    currentSpend: v.optional(v.number()), // What they pay now
    proposedSpend: v.optional(v.number()), // Zapier investment

    // Editable talking points for the executive summary
    talkingPoints: v.optional(v.array(v.string())),
  }).index("by_shortId", ["shortId"]),

  // Value Line Items (categorized by type)
  valueItems: defineTable({
    calculationId: v.id("calculations"),

    // Categorization
    category: v.union(
      v.literal("time_savings"),
      v.literal("revenue_impact"),
      v.literal("cost_reduction"),
      v.literal("uptime"),
      v.literal("security_governance"),
      v.literal("tool_consolidation")
    ),

    name: v.string(),
    description: v.optional(v.string()),

    // Flexible value inputs - interpretation depends on category
    // Time savings: quantity = tasks/month, unitValue = minutes per task
    // Revenue: quantity = deals/month, unitValue = avg deal value, rate = improvement %
    // Cost: quantity = 1, unitValue = annual cost, rate = reduction %
    // Uptime: quantity = probability (0-1), unitValue = cost per incident
    // Security: quantity = probability (0-1), unitValue = potential cost
    // Tool consolidation: quantity = 1, unitValue = annual cost per tool
    quantity: v.number(),
    unitValue: v.number(),
    rate: v.optional(v.number()), // Multiplier, improvement %, or hourly rate tier key

    // For time savings: which hourly rate tier to use
    rateTier: v.optional(
      v.union(
        v.literal("basic"),
        v.literal("operations"),
        v.literal("engineering"),
        v.literal("executive")
      )
    ),

    // For time savings: task complexity
    complexity: v.optional(
      v.union(v.literal("simple"), v.literal("medium"), v.literal("complex"))
    ),

    // Override calculated annual value if needed
    manualAnnualValue: v.optional(v.number()),

    // Context
    notes: v.optional(v.string()),

    // Ordering within category
    order: v.number(),
  }).index("by_calculation", ["calculationId"]),
});
