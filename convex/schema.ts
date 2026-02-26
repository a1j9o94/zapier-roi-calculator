import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Companies — groups of related calculators
  companies: defineTable({
    name: v.string(),
    shortId: v.string(),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_shortId", ["shortId"]),

  // ROI Calculation (root document)
  calculations: defineTable({
    name: v.string(),
    shortId: v.string(),
    companyId: v.optional(v.id("companies")),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Per-endpoint obfuscation settings
    obfuscation: v.optional(
      v.object({
        companyDescriptor: v.optional(v.string()), // "Fortune 500 Shipping Company"
        hideNotes: v.optional(v.boolean()),
        roundValues: v.optional(v.boolean()),
      })
    ),

    // Global assumptions
    assumptions: v.object({
      projectionYears: v.number(),
      realizationRamp: v.array(v.number()),
      annualGrowthRate: v.number(),
      // Default hourly rates by tier
      defaultRates: v.object({
        admin: v.number(), // $60-80K loaded -> ~$30-40/hr
        operations: v.number(), // $80-120K -> ~$40-60/hr
        salesOps: v.number(), // $100-140K -> ~$50-70/hr
        engineering: v.number(), // $150-200K -> ~$75-100/hr
        manager: v.number(), // $140-180K -> ~$70-90/hr
        executive: v.number(), // $200K+ -> ~$100+/hr
      }),
    }),

    // Investment comparison
    currentSpend: v.optional(v.number()),
    proposedSpend: v.optional(v.number()),

    // Editable talking points
    talkingPoints: v.optional(v.array(v.string())),

    // Role-based view
    role: v.optional(v.string()),
    priorityOrder: v.optional(v.array(v.string())),

    // Referenced use case IDs (company-scoped sharing)
    useCaseIds: v.optional(v.array(v.id("useCases"))),
  }).index("by_shortId", ["shortId"]),

  // Value Items — archetype-driven
  valueItems: defineTable({
    calculationId: v.id("calculations"),
    shortId: v.optional(v.string()),

    // UVS taxonomy
    archetype: v.string(), // One of 16 archetypes
    dimension: v.string(), // Derived from archetype (denormalized)

    name: v.string(),
    description: v.optional(v.string()),

    // Archetype-specific inputs stored as JSON
    // Each key is an input name, value is { value, confidence, source }
    inputs: v.any(),

    // Override calculated value
    manualAnnualValue: v.optional(v.number()),

    // Optional link to use case
    useCaseId: v.optional(v.id("useCases")),

    // Ordering
    order: v.number(),
  })
    .index("by_calculationId", ["calculationId"])
    .index("by_shortId", ["shortId"]),

  // Use Cases — enhanced with architecture (company-scoped)
  useCases: defineTable({
    calculationId: v.id("calculations"), // Original creator (backward compat)
    companyId: v.optional(v.id("companies")), // Company scope for sharing
    shortId: v.optional(v.string()),

    name: v.string(),
    department: v.optional(v.string()),
    status: v.string(), // identified | in_progress | deployed | future
    implementationEffort: v.string(), // low | medium | high

    // Single description field (no more notes/description split)
    description: v.optional(v.string()),

    // Custom metrics
    metrics: v.optional(
      v.array(
        v.object({
          name: v.string(),
          before: v.optional(v.string()),
          after: v.optional(v.string()),
          improvement: v.optional(v.string()),
        })
      )
    ),

    // Architecture: linked Zaps, Interfaces, Tables, Agents
    architecture: v.optional(
      v.array(
        v.object({
          type: v.string(), // "zap" | "interface" | "table" | "agent"
          name: v.string(),
          url: v.optional(v.string()),
          zapId: v.optional(v.string()),
          description: v.optional(v.string()),
          status: v.optional(v.string()), // planned | building | active | paused
          // Cached Zap details from Zapier API
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
          // Pre-filled Zap config for "Create Zap" flow
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
        })
      )
    ),

    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_calculationId", ["calculationId"])
    .index("by_companyId", ["companyId"])
    .index("by_shortId", ["shortId"]),

  // Zap Run Cache — for Value Realized dashboard
  zapRunCache: defineTable({
    zapId: v.string(),
    useCaseId: v.id("useCases"),
    calculationId: v.id("calculations"),
    // Cached run data
    totalRuns: v.number(),
    runsLast30Days: v.number(),
    runsLast7Days: v.number(),
    successfulRuns: v.number(),
    failedRuns: v.number(),
    lastRunAt: v.optional(v.string()),
    // Computed
    realizationRate: v.optional(v.number()),
    realizedAnnualValue: v.optional(v.number()),
    // Metadata
    fetchedAt: v.number(),
  })
    .index("by_calculationId", ["calculationId"])
    .index("by_zapId", ["zapId"]),
});
