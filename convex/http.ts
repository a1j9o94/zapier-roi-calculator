import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errorResponse(message: string, status = 400, details?: Record<string, unknown>) {
  return jsonResponse({ error: message, ...details }, status);
}

async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ============================================================
// Archetype → Dimension mapping + calculation engine (server-side)
// ============================================================

const ARCHETYPE_DIMENSIONS: Record<string, string> = {
  pipeline_velocity: "revenue_impact",
  revenue_capture: "revenue_impact",
  revenue_expansion: "revenue_impact",
  time_to_revenue: "revenue_impact",
  process_acceleration: "speed_cycle_time",
  handoff_elimination: "speed_cycle_time",
  task_elimination: "productivity",
  task_simplification: "productivity",
  context_surfacing: "productivity",
  labor_avoidance: "cost_avoidance",
  tool_consolidation: "cost_avoidance",
  error_rework_elimination: "cost_avoidance",
  compliance_assurance: "risk_quality",
  data_integrity: "risk_quality",
  incident_prevention: "risk_quality",
  process_consistency: "risk_quality",
};

const VALID_ARCHETYPES = Object.keys(ARCHETYPE_DIMENSIONS);
const VALID_STATUSES = ["identified", "in_progress", "deployed", "future"];
const VALID_EFFORTS = ["low", "medium", "high"];

function getVal(inputs: Record<string, { value: number }>, key: string): number {
  return inputs?.[key]?.value ?? 0;
}

// Server-side calculation (mirrors src/utils/calculations.ts)
function calculateArchetypeValue(archetype: string, inputs: Record<string, { value: number }>): number {
  switch (archetype) {
    case "pipeline_velocity":
      return getVal(inputs, "dealsPerQuarter") * getVal(inputs, "avgDealValue") * getVal(inputs, "conversionLift") * 4;
    case "revenue_capture":
      return getVal(inputs, "annualRevenue") * getVal(inputs, "leakageRate") * getVal(inputs, "captureImprovement");
    case "revenue_expansion":
      return getVal(inputs, "customerBase") * getVal(inputs, "expansionRate") * getVal(inputs, "avgExpansionValue") * getVal(inputs, "lift");
    case "time_to_revenue":
      return getVal(inputs, "newCustomersPerYear") * getVal(inputs, "revenuePerCustomer") * getVal(inputs, "daysAccelerated") / 365;
    case "process_acceleration":
      return getVal(inputs, "processesPerMonth") * (getVal(inputs, "timeBeforeHrs") - getVal(inputs, "timeAfterHrs")) * getVal(inputs, "hourlyRate") * 12;
    case "handoff_elimination":
      return getVal(inputs, "handoffsPerMonth") * getVal(inputs, "avgQueueTimeHrs") * getVal(inputs, "hourlyRateOfWaitingParty") * 12;
    case "task_elimination":
      return getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesPerTask") * (getVal(inputs, "hourlyRate") / 60) * 12;
    case "task_simplification":
      return getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesSavedPerTask") * (getVal(inputs, "hourlyRate") / 60) * 12;
    case "context_surfacing": {
      const meetings = getVal(inputs, "meetingsAvoidedPerMonth") * getVal(inputs, "attendeesPerMeeting") * getVal(inputs, "meetingDurationHrs") * getVal(inputs, "meetingHourlyRate") * 12;
      const searches = getVal(inputs, "searchesAvoidedPerMonth") * getVal(inputs, "avgSearchTimeMin") * (getVal(inputs, "searchHourlyRate") / 60) * 12;
      return meetings + searches;
    }
    case "labor_avoidance":
      return getVal(inputs, "ftesAvoided") * getVal(inputs, "fullyLoadedAnnualCost");
    case "tool_consolidation":
      return getVal(inputs, "toolsEliminated") * getVal(inputs, "annualLicenseCostPerTool");
    case "error_rework_elimination":
      return getVal(inputs, "errorsPerMonth") * getVal(inputs, "avgCostPerError") * getVal(inputs, "reductionRate") * 12;
    case "compliance_assurance":
      return getVal(inputs, "expectedViolationsPerYear") * getVal(inputs, "avgPenaltyPerViolation") * getVal(inputs, "reductionRate");
    case "data_integrity":
      return getVal(inputs, "recordsPerMonth") * getVal(inputs, "errorRate") * getVal(inputs, "costPerError") * getVal(inputs, "reductionRate") * 12;
    case "incident_prevention":
      return getVal(inputs, "incidentsPerYear") * getVal(inputs, "avgCostPerIncident") * getVal(inputs, "reductionRate");
    case "process_consistency":
      return getVal(inputs, "processesPerMonth") * getVal(inputs, "defectRate") * getVal(inputs, "costPerDefect") * getVal(inputs, "reductionRate") * 12;
    default:
      return 0;
  }
}

function computeItemValue(item: { archetype: string; inputs: Record<string, unknown>; manualAnnualValue?: number }) {
  if (item.manualAnnualValue != null) return item.manualAnnualValue;
  return calculateArchetypeValue(item.archetype, (item.inputs ?? {}) as Record<string, { value: number }>);
}

function computeSummary(
  valueItems: Array<{ archetype: string; dimension: string; inputs: unknown; manualAnnualValue?: number }>,
  assumptions: { projectionYears: number; realizationRamp: number[]; annualGrowthRate: number },
  currentSpend?: number,
  proposedSpend?: number
) {
  const dimensionTotals: Record<string, number> = {};
  let totalAnnualValue = 0;
  let hoursSavedPerMonth = 0;

  for (const item of valueItems) {
    const value = computeItemValue(item as { archetype: string; inputs: Record<string, unknown>; manualAnnualValue?: number });
    totalAnnualValue += value;
    dimensionTotals[item.dimension] = (dimensionTotals[item.dimension] ?? 0) + value;

    // Hours saved for time-related archetypes
    const inputs = (item.inputs ?? {}) as Record<string, { value: number }>;
    if (item.archetype === "task_elimination") {
      hoursSavedPerMonth += (getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesPerTask")) / 60;
    } else if (item.archetype === "task_simplification") {
      hoursSavedPerMonth += (getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesSavedPerTask")) / 60;
    } else if (item.archetype === "process_acceleration") {
      hoursSavedPerMonth += getVal(inputs, "processesPerMonth") * (getVal(inputs, "timeBeforeHrs") - getVal(inputs, "timeAfterHrs"));
    } else if (item.archetype === "handoff_elimination") {
      hoursSavedPerMonth += getVal(inputs, "handoffsPerMonth") * getVal(inputs, "avgQueueTimeHrs");
    }
  }

  const incrementalInvestment = Math.max(0, (proposedSpend ?? 0) - (currentSpend ?? 0));
  const roiMultiple = incrementalInvestment > 0 ? totalAnnualValue / incrementalInvestment : null;

  const projection = [];
  let cumValue = 0, cumInvestment = 0;
  for (let i = 0; i < assumptions.projectionYears; i++) {
    const growth = Math.pow(1 + assumptions.annualGrowthRate, i);
    const ramp = assumptions.realizationRamp[i] ?? 1;
    const value = totalAnnualValue * growth * ramp;
    cumValue += value;
    cumInvestment += incrementalInvestment;
    projection.push({
      year: i + 1,
      value: Math.round(value),
      investment: incrementalInvestment,
      netValue: Math.round(value - incrementalInvestment),
      cumulativeValue: Math.round(cumValue),
      cumulativeInvestment: Math.round(cumInvestment),
      cumulativeNetValue: Math.round(cumValue - cumInvestment),
    });
  }

  const dims = ["revenue_impact", "speed_cycle_time", "productivity", "cost_avoidance", "risk_quality"];
  const dimLabels: Record<string, string> = {
    revenue_impact: "Revenue Impact", speed_cycle_time: "Speed / Cycle Time",
    productivity: "Productivity", cost_avoidance: "Cost Avoidance", risk_quality: "Risk & Quality",
  };
  const dimColors: Record<string, string> = {
    revenue_impact: "#10B981", speed_cycle_time: "#3B82F6",
    productivity: "#FF4A00", cost_avoidance: "#8B5CF6", risk_quality: "#EF4444",
  };

  return {
    totalAnnualValue: Math.round(totalAnnualValue),
    dimensionTotals: dims.map((d) => ({
      dimension: d,
      label: dimLabels[d],
      total: Math.round(dimensionTotals[d] ?? 0),
      itemCount: valueItems.filter((i) => i.dimension === d).length,
      color: dimColors[d],
      percentage: totalAnnualValue > 0 ? Math.round(((dimensionTotals[d] ?? 0) / totalAnnualValue) * 100) : 0,
    })),
    roiMultiple: roiMultiple ? Math.round(roiMultiple * 100) / 100 : null,
    hoursSavedPerMonth: Math.round(hoursSavedPerMonth),
    fteEquivalent: Math.round((hoursSavedPerMonth / 160) * 100) / 100,
    projection,
  };
}

// ============================================================
// Schema definition (for GET /api/schema)
// ============================================================

const SCHEMA_RESPONSE = {
  version: "2.0",
  dimensions: [
    {
      id: "revenue_impact", label: "Revenue Impact", description: "How automation increases top-line revenue",
      archetypes: [
        {
          id: "pipeline_velocity", label: "Pipeline Velocity",
          description: "Automation increases deal flow rate through pipeline",
          formula: "dealsPerQuarter x avgDealValue x conversionLift x 4",
          inputs: [
            { key: "dealsPerQuarter", label: "Deals per quarter", type: "number", source: "customer", prompt: "How many deals enter your pipeline per quarter?", confidence: "custom" },
            { key: "avgDealValue", label: "Avg deal value ($)", type: "currency", source: "customer", prompt: "What's your average deal size?", confidence: "custom" },
            { key: "conversionLift", label: "Conversion lift (%)", type: "percentage", source: "zapier_benchmark", prompt: "Expected conversion rate improvement?", confidence: "estimated", default: 0.10, range: [0.05, 0.15] },
          ],
        },
        {
          id: "revenue_capture", label: "Revenue Capture",
          description: "Automation catches revenue that would otherwise leak",
          formula: "annualRevenue x leakageRate x captureImprovement",
          inputs: [
            { key: "annualRevenue", label: "Annual revenue ($)", type: "currency", source: "customer", prompt: "What's your total annual revenue?", confidence: "custom" },
            { key: "leakageRate", label: "Leakage rate (%)", type: "percentage", source: "industry_benchmark", prompt: "Estimated revenue leakage rate?", confidence: "estimated", default: 0.02, range: [0.01, 0.03] },
            { key: "captureImprovement", label: "Capture improvement (%)", type: "percentage", source: "zapier_benchmark", prompt: "Expected improvement?", confidence: "estimated", default: 0.45, range: [0.30, 0.60] },
          ],
        },
        {
          id: "revenue_expansion", label: "Revenue Expansion",
          description: "Automation drives upsell/cross-sell at scale",
          formula: "customerBase x expansionRate x avgExpansionValue x lift",
          inputs: [
            { key: "customerBase", label: "Active customers", type: "number", source: "customer", confidence: "custom" },
            { key: "expansionRate", label: "Expansion rate (%)", type: "percentage", source: "customer", confidence: "custom" },
            { key: "avgExpansionValue", label: "Avg expansion value ($)", type: "currency", source: "customer", confidence: "custom" },
            { key: "lift", label: "Expansion lift (%)", type: "percentage", source: "zapier_benchmark", confidence: "estimated", default: 0.10, range: [0.05, 0.15] },
          ],
        },
        {
          id: "time_to_revenue", label: "Time-to-Revenue",
          description: "Automation accelerates revenue recognition",
          formula: "newCustomersPerYear x revenuePerCustomer x daysAccelerated / 365",
          inputs: [
            { key: "newCustomersPerYear", label: "New customers/year", type: "number", source: "customer", confidence: "custom" },
            { key: "revenuePerCustomer", label: "Revenue per customer ($)", type: "currency", source: "customer", confidence: "custom" },
            { key: "daysAccelerated", label: "Days accelerated", type: "number", source: "zapier_benchmark", confidence: "estimated", default: 10, range: [5, 15] },
          ],
        },
      ],
    },
    {
      id: "speed_cycle_time", label: "Speed / Cycle Time", description: "How automation accelerates business processes",
      archetypes: [
        {
          id: "process_acceleration", label: "Process Acceleration",
          description: "Reduces end-to-end cycle time for a process",
          formula: "processesPerMonth x (timeBeforeHrs - timeAfterHrs) x hourlyRate x 12",
          inputs: [
            { key: "processesPerMonth", label: "Processes/month", type: "number", source: "customer", confidence: "custom" },
            { key: "timeBeforeHrs", label: "Time before (hours)", type: "hours", source: "customer", confidence: "custom" },
            { key: "timeAfterHrs", label: "Time after (hours)", type: "hours", source: "zapier_benchmark", confidence: "estimated" },
            { key: "hourlyRate", label: "Hourly rate ($)", type: "currency", source: "customer", confidence: "custom" },
          ],
        },
        {
          id: "handoff_elimination", label: "Handoff Elimination",
          description: "Removes manual handoff delays",
          formula: "handoffsPerMonth x avgQueueTimeHrs x hourlyRateOfWaitingParty x 12",
          inputs: [
            { key: "handoffsPerMonth", label: "Handoffs/month", type: "number", source: "customer", confidence: "custom" },
            { key: "avgQueueTimeHrs", label: "Avg queue time (hours)", type: "hours", source: "customer", confidence: "custom" },
            { key: "hourlyRateOfWaitingParty", label: "Hourly rate ($)", type: "currency", source: "customer", confidence: "custom" },
          ],
        },
      ],
    },
    {
      id: "productivity", label: "Productivity", description: "How automation eliminates or simplifies manual work",
      archetypes: [
        {
          id: "task_elimination", label: "Task Elimination",
          description: "Fully replaces manual tasks",
          formula: "tasksPerMonth x minutesPerTask x (hourlyRate / 60) x 12",
          inputs: [
            { key: "tasksPerMonth", label: "Tasks/month", type: "number", source: "customer_or_zapier", confidence: "custom", guidance: "Check Zapier task data if available [B]" },
            { key: "minutesPerTask", label: "Minutes/task", type: "number", source: "customer", confidence: "custom" },
            { key: "hourlyRate", label: "Hourly rate ($)", type: "currency", source: "customer", confidence: "custom" },
          ],
        },
        {
          id: "task_simplification", label: "Task Simplification",
          description: "Reduces time per task",
          formula: "tasksPerMonth x minutesSavedPerTask x (hourlyRate / 60) x 12",
          inputs: [
            { key: "tasksPerMonth", label: "Tasks/month", type: "number", source: "customer", confidence: "custom" },
            { key: "minutesSavedPerTask", label: "Minutes saved/task", type: "number", source: "customer", confidence: "custom" },
            { key: "hourlyRate", label: "Hourly rate ($)", type: "currency", source: "customer", confidence: "custom" },
          ],
        },
        {
          id: "context_surfacing", label: "Context Surfacing",
          description: "Delivers information proactively",
          formula: "(meetings x attendees x hours x rate x 12) + (searches x minutes x rate/60 x 12)",
          inputs: [
            { key: "meetingsAvoidedPerMonth", label: "Meetings avoided/month", type: "number", source: "customer", confidence: "custom" },
            { key: "attendeesPerMeeting", label: "Attendees", type: "number", source: "customer", confidence: "custom" },
            { key: "meetingDurationHrs", label: "Duration (hours)", type: "hours", source: "customer", confidence: "custom" },
            { key: "meetingHourlyRate", label: "Meeting rate ($)", type: "currency", source: "customer", confidence: "custom" },
            { key: "searchesAvoidedPerMonth", label: "Searches avoided/month", type: "number", source: "customer", confidence: "custom" },
            { key: "avgSearchTimeMin", label: "Search time (min)", type: "number", source: "zapier_benchmark", confidence: "estimated", default: 20, range: [15, 30] },
            { key: "searchHourlyRate", label: "Search rate ($)", type: "currency", source: "customer", confidence: "custom" },
          ],
        },
      ],
    },
    {
      id: "cost_avoidance", label: "Cost Avoidance", description: "How automation prevents unnecessary spending",
      archetypes: [
        {
          id: "labor_avoidance", label: "Labor Avoidance",
          description: "Prevents need for additional headcount",
          formula: "ftesAvoided x fullyLoadedAnnualCost",
          inputs: [
            { key: "ftesAvoided", label: "FTEs avoided", type: "number", source: "customer", confidence: "custom" },
            { key: "fullyLoadedAnnualCost", label: "Annual cost ($)", type: "currency", source: "industry_benchmark", confidence: "estimated", default: 100000 },
          ],
        },
        {
          id: "tool_consolidation", label: "Tool Consolidation",
          description: "Eliminates redundant software tools",
          formula: "toolsEliminated x annualLicenseCostPerTool",
          inputs: [
            { key: "toolsEliminated", label: "Tools eliminated", type: "number", source: "customer", confidence: "custom" },
            { key: "annualLicenseCostPerTool", label: "Annual cost/tool ($)", type: "currency", source: "customer", confidence: "custom" },
          ],
        },
        {
          id: "error_rework_elimination", label: "Error/Rework Elimination",
          description: "Prevents costly rework from errors",
          formula: "errorsPerMonth x avgCostPerError x reductionRate x 12",
          inputs: [
            { key: "errorsPerMonth", label: "Errors/month", type: "number", source: "customer", confidence: "custom" },
            { key: "avgCostPerError", label: "Cost/error ($)", type: "currency", source: "industry_benchmark", confidence: "estimated", default: 150, range: [50, 500] },
            { key: "reductionRate", label: "Reduction (%)", type: "percentage", source: "zapier_benchmark", confidence: "estimated", default: 0.70, range: [0.30, 0.90] },
          ],
        },
      ],
    },
    {
      id: "risk_quality", label: "Risk & Quality", description: "How automation reduces errors and ensures compliance",
      archetypes: [
        {
          id: "compliance_assurance", label: "Compliance Assurance",
          description: "Reduces compliance violations",
          formula: "expectedViolationsPerYear x avgPenaltyPerViolation x reductionRate",
          inputs: [
            { key: "expectedViolationsPerYear", label: "Violations/year", type: "number", source: "industry_benchmark", confidence: "estimated" },
            { key: "avgPenaltyPerViolation", label: "Penalty ($)", type: "currency", source: "regulatory", confidence: "benchmarked" },
            { key: "reductionRate", label: "Reduction (%)", type: "percentage", source: "zapier_benchmark", confidence: "estimated", default: 0.55, range: [0.40, 0.70] },
          ],
        },
        {
          id: "data_integrity", label: "Data Integrity",
          description: "Ensures data consistency across systems",
          formula: "recordsPerMonth x errorRate x costPerError x reductionRate x 12",
          inputs: [
            { key: "recordsPerMonth", label: "Records/month", type: "number", source: "customer", confidence: "custom" },
            { key: "errorRate", label: "Error rate (%)", type: "percentage", source: "customer", confidence: "custom" },
            { key: "costPerError", label: "Cost/error ($)", type: "currency", source: "industry_benchmark", confidence: "estimated", default: 50, range: [10, 50000] },
            { key: "reductionRate", label: "Reduction (%)", type: "percentage", source: "zapier_benchmark", confidence: "estimated", default: 0.75, range: [0.40, 0.90] },
          ],
        },
        {
          id: "incident_prevention", label: "Incident Prevention",
          description: "Prevents or reduces operational incidents",
          formula: "incidentsPerYear x avgCostPerIncident x reductionRate",
          inputs: [
            { key: "incidentsPerYear", label: "Incidents/year", type: "number", source: "customer", confidence: "custom" },
            { key: "avgCostPerIncident", label: "Cost/incident ($)", type: "currency", source: "industry_benchmark", confidence: "estimated", default: 10000 },
            { key: "reductionRate", label: "Reduction (%)", type: "percentage", source: "zapier_benchmark", confidence: "estimated", default: 0.30, range: [0.20, 0.50] },
          ],
        },
        {
          id: "process_consistency", label: "Process Consistency",
          description: "Ensures consistent process execution",
          formula: "processesPerMonth x defectRate x costPerDefect x reductionRate x 12",
          inputs: [
            { key: "processesPerMonth", label: "Processes/month", type: "number", source: "customer", confidence: "custom" },
            { key: "defectRate", label: "Defect rate (%)", type: "percentage", source: "customer", confidence: "custom" },
            { key: "costPerDefect", label: "Cost/defect ($)", type: "currency", source: "customer", confidence: "custom" },
            { key: "reductionRate", label: "Reduction (%)", type: "percentage", source: "zapier_benchmark", confidence: "estimated", default: 0.65, range: [0.50, 0.80] },
          ],
        },
      ],
    },
  ],
  validStatuses: VALID_STATUSES,
  validEffortLevels: VALID_EFFORTS,
  architectureTypes: ["zap", "interface", "table", "agent"],
  confidenceTiers: {
    benchmarked: "Case-study-backed real data [B]",
    estimated: "Industry research + Zapier internal data [E]",
    custom: "Customer-provided inputs [C]",
  },
};

// ============================================================
// CORS preflight
// ============================================================

http.route({
  path: "/api/schema",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  pathPrefix: "/api/templates/",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: "/api/calculations",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  pathPrefix: "/api/calculations/",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

// ============================================================
// GET /api/schema — Self-describing taxonomy + input schemas
// ============================================================

http.route({
  path: "/api/schema",
  method: "GET",
  handler: httpAction(async () => jsonResponse(SCHEMA_RESPONSE)),
});

// ============================================================
// GET /api/templates/:archetype — Pre-filled template
// ============================================================

http.route({
  pathPrefix: "/api/templates/",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const archetype = url.pathname.replace("/api/templates/", "");

    if (!VALID_ARCHETYPES.includes(archetype)) {
      return errorResponse(`Invalid archetype "${archetype}". Valid: ${VALID_ARCHETYPES.join(", ")}`, 400, {
        validArchetypes: VALID_ARCHETYPES,
      });
    }

    // Find the archetype in the schema
    for (const dim of SCHEMA_RESPONSE.dimensions) {
      const archetypes = dim.archetypes as Array<Record<string, unknown>>;
      const arch = archetypes.find((a: Record<string, unknown>) => a.id === archetype);
      if (arch) {
        const inputs: Record<string, unknown> = {};
        const archInputs = arch.inputs as Array<Record<string, unknown>>;
        for (const input of archInputs) {
          const entry: Record<string, unknown> = {
            value: input.default ?? null,
            confidence: input.confidence,
            prompt: input.prompt ?? `Enter ${input.label}`,
          };
          if (input.source) entry.source = input.source;
          if (input.range) entry.range = input.range;
          if (input.guidance) entry.guidance = input.guidance;
          inputs[input.key as string] = entry;
        }
        return jsonResponse({
          archetype: arch.id,
          dimension: dim.id,
          name: `[Name] — ${arch.label}`,
          description: arch.description,
          formula: arch.formula,
          inputs,
        });
      }
    }

    return errorResponse("Archetype not found", 404);
  }),
});

// ============================================================
// GET /api/calculations — List all
// ============================================================

http.route({
  path: "/api/calculations",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const calculations = await ctx.runQuery(api.calculations.list);
    return jsonResponse(calculations);
  }),
});

// ============================================================
// POST /api/calculations — Create (supports nested value items + use cases)
// ============================================================

http.route({
  path: "/api/calculations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await parseBody<{
      name?: string;
      role?: string;
      priorityOrder?: string[];
      currentSpend?: number;
      proposedSpend?: number;
      assumptions?: Record<string, unknown>;
      valueItems?: Array<{
        archetype: string;
        name: string;
        description?: string;
        inputs?: Record<string, unknown>;
        manualAnnualValue?: number;
      }>;
      useCases?: Array<{
        name: string;
        department?: string;
        status?: string;
        implementationEffort?: string;
        description?: string;
        metrics?: Array<{ name: string; before?: string; after?: string; improvement?: string }>;
        valueItemNames?: string[];
      }>;
    }>(request);

    if (!body?.name) {
      return errorResponse("name is required and must be a string");
    }

    // Create calculation
    const result = await ctx.runMutation(api.calculations.create, {
      name: body.name,
      role: body.role,
      priorityOrder: body.priorityOrder,
      currentSpend: body.currentSpend,
      proposedSpend: body.proposedSpend,
      ...(body.assumptions && { assumptions: body.assumptions as { projectionYears: number; realizationRamp: number[]; annualGrowthRate: number; defaultRates: { admin: number; operations: number; salesOps: number; engineering: number; manager: number; executive: number } } }),
    });

    const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId: result.shortId });
    if (!calculation) return errorResponse("Failed to create calculation", 500);

    // Create value items if provided
    const createdItemNames: Map<string, string> = new Map(); // name → Convex ID
    if (body.valueItems && body.valueItems.length > 0) {
      const batchItems = [];
      for (const item of body.valueItems) {
        if (!VALID_ARCHETYPES.includes(item.archetype)) {
          return errorResponse(`Invalid archetype "${item.archetype}"`, 400, {
            validArchetypes: VALID_ARCHETYPES,
            schemaUrl: "/api/schema",
          });
        }
        batchItems.push({
          archetype: item.archetype,
          name: item.name,
          description: item.description,
          inputs: item.inputs ?? {},
          manualAnnualValue: item.manualAnnualValue,
        });
      }

      const results = await ctx.runMutation(api.valueItems.createBatch, {
        calculationId: calculation._id,
        items: batchItems,
      });

      // Map names to IDs for use case linking
      for (let i = 0; i < body.valueItems.length; i++) {
        createdItemNames.set(body.valueItems[i]!.name, results[i]!.id);
      }
    }

    // Create use cases if provided
    if (body.useCases && body.useCases.length > 0) {
      for (const uc of body.useCases) {
        const ucResult = await ctx.runMutation(api.useCases.create, {
          calculationId: calculation._id,
          name: uc.name,
          department: uc.department,
          status: uc.status ?? "identified",
          implementationEffort: uc.implementationEffort ?? "medium",
          description: uc.description,
          metrics: uc.metrics,
        });

        // Link value items by name
        if (uc.valueItemNames && uc.valueItemNames.length > 0) {
          for (const itemName of uc.valueItemNames) {
            const itemId = createdItemNames.get(itemName);
            if (itemId) {
              await ctx.runMutation(api.valueItems.update, {
                id: itemId as any,
                useCaseId: ucResult.id,
              });
            }
          }
        }
      }
    }

    // Return full calculation with computed values
    const valueItems = await ctx.runQuery(api.valueItems.listByCalculation, { calculationId: calculation._id });
    const useCases = await ctx.runQuery(api.useCases.listByCalculation, { calculationId: calculation._id });
    const summary = computeSummary(
      valueItems as any,
      calculation.assumptions,
      calculation.currentSpend,
      calculation.proposedSpend
    );

    return jsonResponse({
      calculation,
      valueItems: valueItems.map((vi) => ({
        ...vi,
        computed: {
          annualValue: computeItemValue(vi as any),
        },
      })),
      useCases,
      summary,
    }, 201);
  }),
});

// ============================================================
// GET routes (nested under /api/calculations/)
// ============================================================

http.route({
  pathPrefix: "/api/calculations/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/calculations/:shortId/full
    const fullMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/full$/);
    if (fullMatch) {
      const shortId = fullMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const valueItems = await ctx.runQuery(api.valueItems.listByCalculation, { calculationId: calculation._id });
      const useCases = await ctx.runQuery(api.useCases.listByCalculation, { calculationId: calculation._id });
      const summary = computeSummary(valueItems as any, calculation.assumptions, calculation.currentSpend, calculation.proposedSpend);

      return jsonResponse({
        calculation,
        valueItems: valueItems.map((vi) => ({
          ...vi,
          computed: { annualValue: computeItemValue(vi as any) },
        })),
        useCases,
        summary,
      });
    }

    // GET /api/calculations/:shortId/value-items
    const viMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items$/);
    if (viMatch) {
      const shortId = viMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);
      const items = await ctx.runQuery(api.valueItems.listByCalculation, { calculationId: calculation._id });
      return jsonResponse(items.map((vi) => ({ ...vi, computed: { annualValue: computeItemValue(vi as any) } })));
    }

    // GET /api/calculations/:shortId/use-cases
    const ucMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/use-cases$/);
    if (ucMatch) {
      const shortId = ucMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);
      const useCases = await ctx.runQuery(api.useCases.listByCalculation, { calculationId: calculation._id });
      return jsonResponse(useCases);
    }

    // GET /api/calculations/:shortId/obfuscated
    const obfMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/obfuscated$/);
    if (obfMatch) {
      const shortId = obfMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const valueItems = await ctx.runQuery(api.valueItems.listByCalculation, { calculationId: calculation._id });
      const useCases = await ctx.runQuery(api.useCases.listByCalculation, { calculationId: calculation._id });
      const summary = computeSummary(valueItems as any, calculation.assumptions, calculation.currentSpend, calculation.proposedSpend);

      const settings = calculation.obfuscation ?? {};
      const roundValue = (v: number) => {
        if (!settings.roundValues) return v;
        if (v < 1000) return Math.round(v / 100) * 100;
        if (v < 10000) return Math.round(v / 1000) * 1000;
        if (v < 100000) return Math.round(v / 5000) * 5000;
        if (v < 1000000) return Math.round(v / 25000) * 25000;
        return Math.round(v / 100000) * 100000;
      };

      return jsonResponse({
        calculation: {
          ...calculation,
          name: settings.companyDescriptor || "Enterprise Customer",
          talkingPoints: settings.hideNotes ? [] : calculation.talkingPoints,
        },
        valueItems: valueItems.map((vi) => ({
          ...vi,
          description: settings.hideNotes ? undefined : vi.description,
          computed: { annualValue: roundValue(computeItemValue(vi as any)) },
        })),
        useCases: useCases.map((uc, i) => ({
          ...uc,
          description: settings.hideNotes ? undefined : uc.description,
          department: settings.hideNotes ? `Department ${String.fromCharCode(65 + i)}` : uc.department,
        })),
        summary: {
          ...summary,
          totalAnnualValue: roundValue(summary.totalAnnualValue),
          dimensionTotals: summary.dimensionTotals.map((d) => ({ ...d, total: roundValue(d.total) })),
        },
      });
    }

    // GET /api/calculations/:shortId (basic)
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)$/);
    if (calcMatch) {
      const shortId = calcMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);
      return jsonResponse(calculation);
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

// ============================================================
// POST routes (nested under /api/calculations/)
// ============================================================

http.route({
  pathPrefix: "/api/calculations/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // POST /api/calculations/:shortId/value-items/batch
    const batchMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items\/batch$/);
    if (batchMatch) {
      const shortId = batchMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const body = await parseBody<{ items: Array<{ archetype: string; name: string; description?: string; inputs?: Record<string, unknown>; manualAnnualValue?: number }> }>(request);
      if (!body?.items || !Array.isArray(body.items)) {
        return errorResponse("items array is required");
      }

      for (const item of body.items) {
        if (!VALID_ARCHETYPES.includes(item.archetype)) {
          return errorResponse(`Invalid archetype "${item.archetype}"`, 400, { validArchetypes: VALID_ARCHETYPES });
        }
      }

      const results = await ctx.runMutation(api.valueItems.createBatch, {
        calculationId: calculation._id,
        items: body.items.map((i) => ({
          archetype: i.archetype,
          name: i.name,
          description: i.description,
          inputs: i.inputs ?? {},
          manualAnnualValue: i.manualAnnualValue,
        })),
      });

      // Fetch created items with computed values
      const allItems = await ctx.runQuery(api.valueItems.listByCalculation, { calculationId: calculation._id });
      const createdIds = new Set(results.map((r) => r.id));
      const created = allItems.filter((i) => createdIds.has(i._id)).map((vi) => ({
        ...vi,
        computed: { annualValue: computeItemValue(vi as any) },
      }));

      return jsonResponse(created, 201);
    }

    // POST /api/calculations/:shortId/value-items
    const viMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items$/);
    if (viMatch) {
      const shortId = viMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const body = await parseBody<{ archetype?: string; name?: string; description?: string; inputs?: Record<string, unknown>; manualAnnualValue?: number }>(request);
      if (!body) return errorResponse("Invalid JSON body");
      if (!body.name) return errorResponse("name is required");
      if (!body.archetype || !VALID_ARCHETYPES.includes(body.archetype)) {
        return errorResponse(`archetype is required. Valid: ${VALID_ARCHETYPES.join(", ")}`, 400, { validArchetypes: VALID_ARCHETYPES });
      }

      const itemId = await ctx.runMutation(api.valueItems.create, {
        calculationId: calculation._id,
        archetype: body.archetype,
        name: body.name,
        description: body.description,
        inputs: body.inputs ?? {},
        manualAnnualValue: body.manualAnnualValue,
      });

      const item = await ctx.runQuery(api.valueItems.get, { id: itemId });
      return jsonResponse({ ...item, computed: { annualValue: computeItemValue(item as any) } }, 201);
    }

    // POST /api/calculations/:shortId/use-cases
    const ucMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/use-cases$/);
    if (ucMatch) {
      const shortId = ucMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const body = await parseBody<{
        name?: string;
        department?: string;
        status?: string;
        implementationEffort?: string;
        description?: string;
        metrics?: Array<{ name: string; before?: string; after?: string; improvement?: string }>;
        architecture?: Array<Record<string, unknown>>;
      }>(request);
      if (!body) return errorResponse("Invalid JSON body");
      if (!body.name) return errorResponse("name is required");

      const result = await ctx.runMutation(api.useCases.create, {
        calculationId: calculation._id,
        name: body.name,
        department: body.department,
        status: body.status ?? "identified",
        implementationEffort: body.implementationEffort ?? "medium",
        description: body.description,
        metrics: body.metrics,
        architecture: body.architecture as any,
      });

      const useCase = await ctx.runQuery(api.useCases.get, { id: result.id });
      return jsonResponse(useCase, 201);
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

// ============================================================
// PUT routes
// ============================================================

http.route({
  pathPrefix: "/api/calculations/",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // PUT /api/calculations/:shortId/value-items/:itemShortId
    const viMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items\/([a-z0-9]+)$/);
    if (viMatch) {
      const [, calcShortId, itemShortId] = viMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId: calcShortId! });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const valueItem = await ctx.runQuery(api.valueItems.getByShortId, { shortId: itemShortId! });
      if (!valueItem || valueItem.calculationId !== calculation._id) return errorResponse("Value item not found", 404);

      const body = await parseBody<Record<string, unknown>>(request);
      if (!body) return errorResponse("Invalid JSON body");

      await ctx.runMutation(api.valueItems.update, {
        id: valueItem._id,
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.archetype !== undefined && { archetype: String(body.archetype) }),
        ...(body.inputs !== undefined && { inputs: body.inputs }),
        ...(body.manualAnnualValue !== undefined && { manualAnnualValue: Number(body.manualAnnualValue) }),
      });

      const updated = await ctx.runQuery(api.valueItems.getByShortId, { shortId: itemShortId! });
      return jsonResponse({ ...updated, computed: { annualValue: computeItemValue(updated as any) } });
    }

    // PUT /api/calculations/:shortId/use-cases/:ucShortId
    const ucMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/use-cases\/([a-z0-9]+)$/);
    if (ucMatch) {
      const [, calcShortId, ucShortId] = ucMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId: calcShortId! });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const useCase = await ctx.runQuery(api.useCases.getByShortId, { shortId: ucShortId! });
      if (!useCase || useCase.calculationId !== calculation._id) return errorResponse("Use case not found", 404);

      const body = await parseBody<Record<string, unknown>>(request);
      if (!body) return errorResponse("Invalid JSON body");

      await ctx.runMutation(api.useCases.update, {
        id: useCase._id,
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.department !== undefined && { department: String(body.department) }),
        ...(body.status !== undefined && { status: String(body.status) }),
        ...(body.implementationEffort !== undefined && { implementationEffort: String(body.implementationEffort) }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.metrics !== undefined && { metrics: body.metrics as any }),
        ...(body.architecture !== undefined && { architecture: body.architecture as any }),
      });

      const updated = await ctx.runQuery(api.useCases.getByShortId, { shortId: ucShortId! });
      return jsonResponse(updated);
    }

    // PUT /api/calculations/:shortId
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)$/);
    if (calcMatch) {
      const shortId = calcMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);

      const body = await parseBody<Record<string, unknown>>(request);
      if (!body) return errorResponse("Invalid JSON body");

      if (body.name) await ctx.runMutation(api.calculations.updateName, { id: calculation._id, name: String(body.name) });
      if (body.assumptions) await ctx.runMutation(api.calculations.updateAssumptions, { id: calculation._id, assumptions: body.assumptions as any });
      if (body.currentSpend !== undefined || body.proposedSpend !== undefined) {
        await ctx.runMutation(api.calculations.updateInvestment, {
          id: calculation._id,
          ...(body.currentSpend !== undefined && { currentSpend: Number(body.currentSpend) }),
          ...(body.proposedSpend !== undefined && { proposedSpend: Number(body.proposedSpend) }),
        });
      }
      if (body.talkingPoints) await ctx.runMutation(api.calculations.updateTalkingPoints, { id: calculation._id, talkingPoints: body.talkingPoints as string[] });
      if (body.obfuscation) await ctx.runMutation(api.calculations.updateObfuscation, { id: calculation._id, obfuscation: body.obfuscation as any });
      if (body.role !== undefined || body.priorityOrder !== undefined) {
        await ctx.runMutation(api.calculations.updateRole, {
          id: calculation._id,
          ...(body.role !== undefined && { role: body.role as string }),
          ...(body.priorityOrder !== undefined && { priorityOrder: body.priorityOrder as string[] }),
        });
      }

      const updated = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      return jsonResponse(updated);
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

// ============================================================
// DELETE routes
// ============================================================

http.route({
  pathPrefix: "/api/calculations/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // DELETE /api/calculations/:shortId/value-items/:itemShortId
    const viMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/value-items\/([a-z0-9]+)$/);
    if (viMatch) {
      const [, calcShortId, itemShortId] = viMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId: calcShortId! });
      if (!calculation) return errorResponse("Calculation not found", 404);
      const valueItem = await ctx.runQuery(api.valueItems.getByShortId, { shortId: itemShortId! });
      if (!valueItem || valueItem.calculationId !== calculation._id) return errorResponse("Value item not found", 404);
      await ctx.runMutation(api.valueItems.remove, { id: valueItem._id });
      return jsonResponse({ deleted: true });
    }

    // DELETE /api/calculations/:shortId/use-cases/:ucShortId
    const ucMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)\/use-cases\/([a-z0-9]+)$/);
    if (ucMatch) {
      const [, calcShortId, ucShortId] = ucMatch;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId: calcShortId! });
      if (!calculation) return errorResponse("Calculation not found", 404);
      const useCase = await ctx.runQuery(api.useCases.getByShortId, { shortId: ucShortId! });
      if (!useCase || useCase.calculationId !== calculation._id) return errorResponse("Use case not found", 404);
      await ctx.runMutation(api.useCases.remove, { id: useCase._id });
      return jsonResponse({ deleted: true });
    }

    // DELETE /api/calculations/:shortId
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)$/);
    if (calcMatch) {
      const shortId = calcMatch[1]!;
      const calculation = await ctx.runQuery(api.calculations.getByShortId, { shortId });
      if (!calculation) return errorResponse("Calculation not found", 404);
      await ctx.runMutation(api.calculations.remove, { id: calculation._id });
      return jsonResponse({ deleted: true });
    }

    return errorResponse("Unknown endpoint", 404);
  }),
});

export default http;
