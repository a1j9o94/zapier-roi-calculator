import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// Lazy-initialize Convex HTTP client (allows tests to import validation functions without env vars)
let _convex: ConvexHttpClient | null = null;
function getConvex(): ConvexHttpClient {
  if (!_convex) {
    const convexUrl = process.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("VITE_CONVEX_URL environment variable is required");
    }
    _convex = new ConvexHttpClient(convexUrl);
  }
  return _convex;
}

// =============================================================================
// Validation Types and Constants
// =============================================================================

export const CATEGORIES = [
  "time_savings",
  "revenue_impact",
  "cost_reduction",
  "uptime",
  "security_governance",
  "tool_consolidation",
] as const;

export const RATE_TIERS = ["basic", "operations", "engineering", "executive"] as const;

export const COMPLEXITIES = ["simple", "medium", "complex"] as const;

export const USE_CASE_STATUSES = ["identified", "in_progress", "deployed", "future"] as const;

export const USE_CASE_DIFFICULTIES = ["low", "medium", "high"] as const;

export type Category = (typeof CATEGORIES)[number];
export type RateTier = (typeof RATE_TIERS)[number];
export type Complexity = (typeof COMPLEXITIES)[number];
export type UseCaseStatus = (typeof USE_CASE_STATUSES)[number];
export type UseCaseDifficulty = (typeof USE_CASE_DIFFICULTIES)[number];

// =============================================================================
// Validation Utilities
// =============================================================================

export function isValidCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

export function isValidRateTier(value: unknown): value is RateTier {
  return typeof value === "string" && RATE_TIERS.includes(value as RateTier);
}

export function isValidComplexity(value: unknown): value is Complexity {
  return typeof value === "string" && COMPLEXITIES.includes(value as Complexity);
}

export function isValidUseCaseStatus(value: unknown): value is UseCaseStatus {
  return typeof value === "string" && USE_CASE_STATUSES.includes(value as UseCaseStatus);
}

export function isValidUseCaseDifficulty(value: unknown): value is UseCaseDifficulty {
  return typeof value === "string" && USE_CASE_DIFFICULTIES.includes(value as UseCaseDifficulty);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || isNumber(value);
}

export function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValueItemInput {
  category?: unknown;
  name?: unknown;
  description?: unknown;
  quantity?: unknown;
  unitValue?: unknown;
  rate?: unknown;
  rateTier?: unknown;
  complexity?: unknown;
  manualAnnualValue?: unknown;
  notes?: unknown;
}

export function validateValueItemCreate(data: ValueItemInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isValidCategory(data.category)) {
    errors.push({ field: "category", message: `Must be one of: ${CATEGORIES.join(", ")}` });
  }
  if (!isNonEmptyString(data.name)) {
    errors.push({ field: "name", message: "Required, non-empty string" });
  }
  if (!isNumber(data.quantity)) {
    errors.push({ field: "quantity", message: "Required number" });
  }
  if (!isNumber(data.unitValue)) {
    errors.push({ field: "unitValue", message: "Required number" });
  }
  if (data.rate !== undefined && !isNumber(data.rate)) {
    errors.push({ field: "rate", message: "Must be a number" });
  }
  if (data.rateTier !== undefined && !isValidRateTier(data.rateTier)) {
    errors.push({ field: "rateTier", message: `Must be one of: ${RATE_TIERS.join(", ")}` });
  }
  if (data.complexity !== undefined && !isValidComplexity(data.complexity)) {
    errors.push({ field: "complexity", message: `Must be one of: ${COMPLEXITIES.join(", ")}` });
  }
  if (data.manualAnnualValue !== undefined && !isNumber(data.manualAnnualValue)) {
    errors.push({ field: "manualAnnualValue", message: "Must be a number" });
  }
  if (!isOptionalString(data.description)) {
    errors.push({ field: "description", message: "Must be a string" });
  }
  if (!isOptionalString(data.notes)) {
    errors.push({ field: "notes", message: "Must be a string" });
  }

  return errors;
}

export function validateValueItemUpdate(data: ValueItemInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.name !== undefined && !isNonEmptyString(data.name)) {
    errors.push({ field: "name", message: "Must be non-empty string" });
  }
  if (data.quantity !== undefined && !isNumber(data.quantity)) {
    errors.push({ field: "quantity", message: "Must be a number" });
  }
  if (data.unitValue !== undefined && !isNumber(data.unitValue)) {
    errors.push({ field: "unitValue", message: "Must be a number" });
  }
  if (data.rate !== undefined && !isNumber(data.rate)) {
    errors.push({ field: "rate", message: "Must be a number" });
  }
  if (data.rateTier !== undefined && !isValidRateTier(data.rateTier)) {
    errors.push({ field: "rateTier", message: `Must be one of: ${RATE_TIERS.join(", ")}` });
  }
  if (data.complexity !== undefined && !isValidComplexity(data.complexity)) {
    errors.push({ field: "complexity", message: `Must be one of: ${COMPLEXITIES.join(", ")}` });
  }
  if (data.manualAnnualValue !== undefined && !isNumber(data.manualAnnualValue)) {
    errors.push({ field: "manualAnnualValue", message: "Must be a number" });
  }
  if (!isOptionalString(data.description)) {
    errors.push({ field: "description", message: "Must be a string" });
  }
  if (!isOptionalString(data.notes)) {
    errors.push({ field: "notes", message: "Must be a string" });
  }

  return errors;
}

interface UseCaseInput {
  name?: unknown;
  department?: unknown;
  status?: unknown;
  difficulty?: unknown;
  description?: unknown;
  notes?: unknown;
  metrics?: unknown;
  valueItems?: unknown;
}

interface Metric {
  name: string;
  before?: string;
  after?: string;
  improvement?: string;
}

function isValidMetric(value: unknown): value is Metric {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  if (!isNonEmptyString(m.name)) return false;
  if (m.before !== undefined && typeof m.before !== "string") return false;
  if (m.after !== undefined && typeof m.after !== "string") return false;
  if (m.improvement !== undefined && typeof m.improvement !== "string") return false;
  return true;
}

function isValidMetricsArray(value: unknown): value is Metric[] {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every(isValidMetric);
}

export function validateUseCaseCreate(data: UseCaseInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isNonEmptyString(data.name)) {
    errors.push({ field: "name", message: "Required, non-empty string" });
  }
  if (!isValidUseCaseStatus(data.status)) {
    errors.push({ field: "status", message: `Must be one of: ${USE_CASE_STATUSES.join(", ")}` });
  }
  if (!isValidUseCaseDifficulty(data.difficulty)) {
    errors.push({
      field: "difficulty",
      message: `Must be one of: ${USE_CASE_DIFFICULTIES.join(", ")}`,
    });
  }
  if (!isOptionalString(data.department)) {
    errors.push({ field: "department", message: "Must be a string" });
  }
  if (!isOptionalString(data.description)) {
    errors.push({ field: "description", message: "Must be a string" });
  }
  if (!isOptionalString(data.notes)) {
    errors.push({ field: "notes", message: "Must be a string" });
  }
  if (!isValidMetricsArray(data.metrics)) {
    errors.push({ field: "metrics", message: "Must be an array of {name, before?, after?, improvement?}" });
  }

  // Validate inline value items if provided
  if (data.valueItems !== undefined) {
    if (!Array.isArray(data.valueItems)) {
      errors.push({ field: "valueItems", message: "Must be an array" });
    } else {
      data.valueItems.forEach((item: unknown, i: number) => {
        if (typeof item !== "object" || item === null) {
          errors.push({ field: `valueItems[${i}]`, message: "Must be an object" });
          return;
        }
        const itemObj = item as Record<string, unknown>;

        // Check if this is an existing item reference (has shortId but no category)
        const hasShortId = isNonEmptyString(itemObj.shortId);
        const hasCategory = "category" in itemObj;

        if (hasShortId && !hasCategory) {
          // Linking existing item - shortId is valid, nothing else to validate
          return;
        } else if (hasCategory) {
          // Creating new item - validate all required fields
          const itemErrors = validateValueItemCreate(item as ValueItemInput);
          itemErrors.forEach((e) => {
            errors.push({ field: `valueItems[${i}].${e.field}`, message: e.message });
          });
        } else {
          // Invalid: no shortId and no category
          errors.push({
            field: `valueItems[${i}]`,
            message: "Must have either 'shortId' (to link existing) or 'category' (to create new)",
          });
        }
      });
    }
  }

  // Require at least one metric or value item
  const hasMetrics =
    Array.isArray(data.metrics) &&
    data.metrics.length > 0 &&
    data.metrics.some((m: unknown) => isNonEmptyString((m as Record<string, unknown>).name));
  const hasValueItems = Array.isArray(data.valueItems) && data.valueItems.length > 0;

  if (!hasMetrics && !hasValueItems) {
    errors.push({
      field: "metrics",
      message: "Use case must have at least one metric or one value item",
    });
  }

  return errors;
}

export function validateUseCaseUpdate(data: UseCaseInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.name !== undefined && !isNonEmptyString(data.name)) {
    errors.push({ field: "name", message: "Must be non-empty string" });
  }
  if (data.status !== undefined && !isValidUseCaseStatus(data.status)) {
    errors.push({ field: "status", message: `Must be one of: ${USE_CASE_STATUSES.join(", ")}` });
  }
  if (data.difficulty !== undefined && !isValidUseCaseDifficulty(data.difficulty)) {
    errors.push({
      field: "difficulty",
      message: `Must be one of: ${USE_CASE_DIFFICULTIES.join(", ")}`,
    });
  }
  if (!isOptionalString(data.department)) {
    errors.push({ field: "department", message: "Must be a string" });
  }
  if (!isOptionalString(data.description)) {
    errors.push({ field: "description", message: "Must be a string" });
  }
  if (!isOptionalString(data.notes)) {
    errors.push({ field: "notes", message: "Must be a string" });
  }
  if (!isValidMetricsArray(data.metrics)) {
    errors.push({ field: "metrics", message: "Must be an array of {name, before?, after?, improvement?}" });
  }

  return errors;
}

interface AssumptionsInput {
  hourlyRates?: unknown;
  taskMinutes?: unknown;
  projectionYears?: unknown;
  realizationRamp?: unknown;
  annualGrowthRate?: unknown;
  avgDataBreachCost?: unknown;
  avgSupportTicketCost?: unknown;
}

export function validateAssumptions(data: AssumptionsInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // hourlyRates validation
  if (data.hourlyRates !== undefined) {
    if (typeof data.hourlyRates !== "object" || data.hourlyRates === null) {
      errors.push({ field: "hourlyRates", message: "Must be an object" });
    } else {
      const hr = data.hourlyRates as Record<string, unknown>;
      for (const tier of RATE_TIERS) {
        if (!isNumber(hr[tier])) {
          errors.push({ field: `hourlyRates.${tier}`, message: "Must be a number" });
        }
      }
    }
  }

  // taskMinutes validation
  if (data.taskMinutes !== undefined) {
    if (typeof data.taskMinutes !== "object" || data.taskMinutes === null) {
      errors.push({ field: "taskMinutes", message: "Must be an object" });
    } else {
      const tm = data.taskMinutes as Record<string, unknown>;
      for (const complexity of COMPLEXITIES) {
        if (!isNumber(tm[complexity])) {
          errors.push({ field: `taskMinutes.${complexity}`, message: "Must be a number" });
        }
      }
    }
  }

  if (data.projectionYears !== undefined && !isNumber(data.projectionYears)) {
    errors.push({ field: "projectionYears", message: "Must be a number" });
  }

  if (data.realizationRamp !== undefined) {
    if (!Array.isArray(data.realizationRamp) || !data.realizationRamp.every(isNumber)) {
      errors.push({ field: "realizationRamp", message: "Must be an array of numbers" });
    }
  }

  if (data.annualGrowthRate !== undefined && !isNumber(data.annualGrowthRate)) {
    errors.push({ field: "annualGrowthRate", message: "Must be a number" });
  }

  if (data.avgDataBreachCost !== undefined && !isNumber(data.avgDataBreachCost)) {
    errors.push({ field: "avgDataBreachCost", message: "Must be a number" });
  }

  if (data.avgSupportTicketCost !== undefined && !isNumber(data.avgSupportTicketCost)) {
    errors.push({ field: "avgSupportTicketCost", message: "Must be a number" });
  }

  return errors;
}

// =============================================================================
// Response Helpers
// =============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400, errors?: ValidationError[]): Response {
  return jsonResponse({ error: message, errors }, status);
}

function notFoundResponse(resource: string): Response {
  return errorResponse(`${resource} not found`, 404);
}

// =============================================================================
// Route Handlers
// =============================================================================

// GET /api/calculations - List all calculations
async function listCalculations(): Promise<Response> {
  const calculations = await getConvex().query(api.calculations.list);
  return jsonResponse(calculations);
}

// POST /api/calculations - Create new calculation
async function createCalculation(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));

  if (!isNonEmptyString(body.name)) {
    return errorResponse("name is required and must be a non-empty string");
  }

  const shortId = await getConvex().mutation(api.calculations.create, { name: body.name });
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  return jsonResponse(calculation, 201);
}

// GET /api/calculations/:shortId - Get calculation by short ID
async function getCalculation(shortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  return jsonResponse(calculation);
}

// PUT /api/calculations/:shortId - Update calculation (partial)
async function updateCalculation(shortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const body = await req.json().catch(() => ({}));

  // Update name if provided
  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) {
      return errorResponse("name must be a non-empty string");
    }
    await getConvex().mutation(api.calculations.updateName, {
      id: calculation._id,
      name: body.name,
    });
  }

  // Update investment if provided
  if (body.currentSpend !== undefined || body.proposedSpend !== undefined) {
    const investmentUpdate: { currentSpend?: number; proposedSpend?: number } = {};
    if (body.currentSpend !== undefined) {
      if (!isNumber(body.currentSpend)) {
        return errorResponse("currentSpend must be a number");
      }
      investmentUpdate.currentSpend = body.currentSpend;
    }
    if (body.proposedSpend !== undefined) {
      if (!isNumber(body.proposedSpend)) {
        return errorResponse("proposedSpend must be a number");
      }
      investmentUpdate.proposedSpend = body.proposedSpend;
    }
    await getConvex().mutation(api.calculations.updateInvestment, {
      id: calculation._id,
      ...investmentUpdate,
    });
  }

  // Update talking points if provided
  if (body.talkingPoints !== undefined) {
    if (!Array.isArray(body.talkingPoints) || !body.talkingPoints.every((p: unknown) => typeof p === "string")) {
      return errorResponse("talkingPoints must be an array of strings");
    }
    await getConvex().mutation(api.calculations.updateTalkingPoints, {
      id: calculation._id,
      talkingPoints: body.talkingPoints,
    });
  }

  // Return updated calculation
  const updated = await getConvex().query(api.calculations.getByShortId, { shortId });
  return jsonResponse(updated);
}

// DELETE /api/calculations/:shortId - Delete calculation
async function deleteCalculation(shortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  await getConvex().mutation(api.calculations.remove, { id: calculation._id });
  return jsonResponse({ success: true });
}

// GET /api/calculations/:shortId/full - Get calculation + all value items + use cases
async function getCalculationFull(shortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const [valueItems, useCases] = await Promise.all([
    getConvex().query(api.valueItems.listByCalculation, { calculationId: calculation._id }),
    getConvex().query(api.useCases.listByCalculation, { calculationId: calculation._id }),
  ]);

  return jsonResponse({
    ...calculation,
    valueItems,
    useCases,
  });
}

// PUT /api/calculations/:shortId/full - Full sync - merge all data
async function updateCalculationFull(shortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const body = await req.json().catch(() => ({}));

  // Update name if provided
  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) {
      return errorResponse("name must be a non-empty string");
    }
    await getConvex().mutation(api.calculations.updateName, {
      id: calculation._id,
      name: body.name,
    });
  }

  // Update assumptions if provided
  if (body.assumptions !== undefined) {
    const assumptionErrors = validateAssumptions(body.assumptions);
    if (assumptionErrors.length > 0) {
      return errorResponse("Invalid assumptions", 400, assumptionErrors);
    }

    // Merge with existing assumptions
    const mergedAssumptions = {
      ...calculation.assumptions,
      ...body.assumptions,
      hourlyRates: body.assumptions.hourlyRates
        ? { ...calculation.assumptions.hourlyRates, ...body.assumptions.hourlyRates }
        : calculation.assumptions.hourlyRates,
      taskMinutes: body.assumptions.taskMinutes
        ? { ...calculation.assumptions.taskMinutes, ...body.assumptions.taskMinutes }
        : calculation.assumptions.taskMinutes,
    };

    await getConvex().mutation(api.calculations.updateAssumptions, {
      id: calculation._id,
      assumptions: mergedAssumptions,
    });
  }

  // Update investment if provided
  if (body.currentSpend !== undefined || body.proposedSpend !== undefined) {
    const investmentUpdate: { currentSpend?: number; proposedSpend?: number } = {};
    if (body.currentSpend !== undefined) {
      if (!isNumber(body.currentSpend)) {
        return errorResponse("currentSpend must be a number");
      }
      investmentUpdate.currentSpend = body.currentSpend;
    }
    if (body.proposedSpend !== undefined) {
      if (!isNumber(body.proposedSpend)) {
        return errorResponse("proposedSpend must be a number");
      }
      investmentUpdate.proposedSpend = body.proposedSpend;
    }
    await getConvex().mutation(api.calculations.updateInvestment, {
      id: calculation._id,
      ...investmentUpdate,
    });
  }

  // Update talking points if provided
  if (body.talkingPoints !== undefined) {
    if (!Array.isArray(body.talkingPoints) || !body.talkingPoints.every((p: unknown) => typeof p === "string")) {
      return errorResponse("talkingPoints must be an array of strings");
    }
    await getConvex().mutation(api.calculations.updateTalkingPoints, {
      id: calculation._id,
      talkingPoints: body.talkingPoints,
    });
  }

  // Merge value items if provided
  if (body.valueItems !== undefined) {
    if (!Array.isArray(body.valueItems)) {
      return errorResponse("valueItems must be an array");
    }

    // Get existing value items
    const existingItems = await getConvex().query(api.valueItems.listByCalculation, {
      calculationId: calculation._id,
    });
    const existingByShortId = new Map(existingItems.filter((i) => i.shortId).map((i) => [i.shortId, i]));

    for (const item of body.valueItems) {
      // Check if item has shortId and exists
      if (item.shortId && existingByShortId.has(item.shortId)) {
        // Update existing item
        const existing = existingByShortId.get(item.shortId)!;
        const updateErrors = validateValueItemUpdate(item);
        if (updateErrors.length > 0) {
          return errorResponse(`Invalid value item (shortId: ${item.shortId})`, 400, updateErrors);
        }

        const updateData: Record<string, unknown> = { id: existing._id };
        if (item.name !== undefined) updateData.name = item.name;
        if (item.description !== undefined) updateData.description = item.description;
        if (item.quantity !== undefined) updateData.quantity = item.quantity;
        if (item.unitValue !== undefined) updateData.unitValue = item.unitValue;
        if (item.rate !== undefined) updateData.rate = item.rate;
        if (item.rateTier !== undefined) updateData.rateTier = item.rateTier;
        if (item.complexity !== undefined) updateData.complexity = item.complexity;
        if (item.manualAnnualValue !== undefined) updateData.manualAnnualValue = item.manualAnnualValue;
        if (item.notes !== undefined) updateData.notes = item.notes;

        await getConvex().mutation(api.valueItems.update, updateData as any);
      } else {
        // Create new item
        const createErrors = validateValueItemCreate(item);
        if (createErrors.length > 0) {
          return errorResponse("Invalid new value item", 400, createErrors);
        }

        await getConvex().mutation(api.valueItems.create, {
          calculationId: calculation._id,
          category: item.category,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitValue: item.unitValue,
          rate: item.rate,
          rateTier: item.rateTier,
          complexity: item.complexity,
          notes: item.notes,
        });
      }
    }
  }

  // Merge use cases if provided
  if (body.useCases !== undefined) {
    if (!Array.isArray(body.useCases)) {
      return errorResponse("useCases must be an array");
    }

    // Get existing use cases
    const existingCases = await getConvex().query(api.useCases.listByCalculation, {
      calculationId: calculation._id,
    });
    const existingByShortId = new Map(existingCases.filter((c) => c.shortId).map((c) => [c.shortId, c]));

    for (const useCase of body.useCases) {
      // Check if use case has shortId and exists
      if (useCase.shortId && existingByShortId.has(useCase.shortId)) {
        // Update existing use case
        const existing = existingByShortId.get(useCase.shortId)!;
        const updateErrors = validateUseCaseUpdate(useCase);
        if (updateErrors.length > 0) {
          return errorResponse(`Invalid use case (shortId: ${useCase.shortId})`, 400, updateErrors);
        }

        const updateData: Record<string, unknown> = { id: existing._id };
        if (useCase.name !== undefined) updateData.name = useCase.name;
        if (useCase.department !== undefined) updateData.department = useCase.department;
        if (useCase.status !== undefined) updateData.status = useCase.status;
        if (useCase.difficulty !== undefined) updateData.difficulty = useCase.difficulty;
        if (useCase.description !== undefined) updateData.description = useCase.description;
        if (useCase.notes !== undefined) updateData.notes = useCase.notes;
        if (useCase.metrics !== undefined) updateData.metrics = useCase.metrics;

        await getConvex().mutation(api.useCases.update, updateData as any);
      } else {
        // Create new use case
        const createErrors = validateUseCaseCreate(useCase);
        if (createErrors.length > 0) {
          return errorResponse("Invalid new use case", 400, createErrors);
        }

        await getConvex().mutation(api.useCases.create, {
          calculationId: calculation._id,
          name: useCase.name,
          department: useCase.department,
          status: useCase.status,
          difficulty: useCase.difficulty,
          description: useCase.description,
          notes: useCase.notes,
          metrics: useCase.metrics,
        });
      }
    }
  }

  // Return full updated data
  return getCalculationFull(shortId);
}

// PUT /api/calculations/:shortId/assumptions - Update assumptions only
async function updateAssumptions(shortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const body = await req.json().catch(() => ({}));
  const errors = validateAssumptions(body);

  if (errors.length > 0) {
    return errorResponse("Invalid assumptions", 400, errors);
  }

  // Merge with existing assumptions
  const mergedAssumptions = {
    ...calculation.assumptions,
    ...body,
    hourlyRates: body.hourlyRates
      ? { ...calculation.assumptions.hourlyRates, ...body.hourlyRates }
      : calculation.assumptions.hourlyRates,
    taskMinutes: body.taskMinutes
      ? { ...calculation.assumptions.taskMinutes, ...body.taskMinutes }
      : calculation.assumptions.taskMinutes,
  };

  await getConvex().mutation(api.calculations.updateAssumptions, {
    id: calculation._id,
    assumptions: mergedAssumptions,
  });

  const updated = await getConvex().query(api.calculations.getByShortId, { shortId });
  return jsonResponse(updated?.assumptions);
}

// GET /api/calculations/:shortId/value-items - List value items
async function listValueItems(shortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const items = await getConvex().query(api.valueItems.listByCalculation, {
    calculationId: calculation._id,
  });

  return jsonResponse(items);
}

// POST /api/calculations/:shortId/value-items - Create value item
async function createValueItem(shortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const body = await req.json().catch(() => ({}));
  const errors = validateValueItemCreate(body);

  if (errors.length > 0) {
    return errorResponse("Validation failed", 400, errors);
  }

  const itemId = await getConvex().mutation(api.valueItems.create, {
    calculationId: calculation._id,
    category: body.category,
    name: body.name,
    description: body.description,
    quantity: body.quantity,
    unitValue: body.unitValue,
    rate: body.rate,
    rateTier: body.rateTier,
    complexity: body.complexity,
    notes: body.notes,
  });

  const item = await getConvex().query(api.valueItems.get, { id: itemId });
  return jsonResponse(item, 201);
}

// PUT /api/calculations/:shortId/value-items/:itemShortId - Update value item
async function updateValueItem(shortId: string, itemShortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const item = await getConvex().query(api.valueItems.getByShortId, { shortId: itemShortId });

  if (!item || item.calculationId !== calculation._id) {
    return notFoundResponse("Value item");
  }

  const body = await req.json().catch(() => ({}));
  const errors = validateValueItemUpdate(body);

  if (errors.length > 0) {
    return errorResponse("Validation failed", 400, errors);
  }

  const updateData: Record<string, unknown> = { id: item._id };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.unitValue !== undefined) updateData.unitValue = body.unitValue;
  if (body.rate !== undefined) updateData.rate = body.rate;
  if (body.rateTier !== undefined) updateData.rateTier = body.rateTier;
  if (body.complexity !== undefined) updateData.complexity = body.complexity;
  if (body.manualAnnualValue !== undefined) updateData.manualAnnualValue = body.manualAnnualValue;
  if (body.notes !== undefined) updateData.notes = body.notes;

  await getConvex().mutation(api.valueItems.update, updateData as any);

  const updated = await getConvex().query(api.valueItems.get, { id: item._id });
  return jsonResponse(updated);
}

// DELETE /api/calculations/:shortId/value-items/:itemShortId - Delete value item
async function deleteValueItem(shortId: string, itemShortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const item = await getConvex().query(api.valueItems.getByShortId, { shortId: itemShortId });

  if (!item || item.calculationId !== calculation._id) {
    return notFoundResponse("Value item");
  }

  await getConvex().mutation(api.valueItems.remove, { id: item._id });
  return jsonResponse({ success: true });
}

// GET /api/calculations/:shortId/use-cases - List use cases
async function listUseCases(shortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const cases = await getConvex().query(api.useCases.listByCalculation, {
    calculationId: calculation._id,
  });

  return jsonResponse(cases);
}

// POST /api/calculations/:shortId/use-cases - Create use case
async function createUseCase(shortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const body = await req.json().catch(() => ({}));
  const errors = validateUseCaseCreate(body);

  if (errors.length > 0) {
    return errorResponse("Validation failed", 400, errors);
  }

  const useCaseId = await getConvex().mutation(api.useCases.create, {
    calculationId: calculation._id,
    name: body.name,
    department: body.department,
    status: body.status,
    difficulty: body.difficulty,
    description: body.description,
    notes: body.notes,
    metrics: body.metrics,
    valueItems: body.valueItems,
  });

  const useCase = await getConvex().query(api.useCases.get, { id: useCaseId });
  return jsonResponse(useCase, 201);
}

// PUT /api/calculations/:shortId/use-cases/:useCaseShortId - Update use case
async function updateUseCase(shortId: string, useCaseShortId: string, req: Request): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const useCase = await getConvex().query(api.useCases.getByShortId, { shortId: useCaseShortId });

  if (!useCase || useCase.calculationId !== calculation._id) {
    return notFoundResponse("Use case");
  }

  const body = await req.json().catch(() => ({}));
  const errors = validateUseCaseUpdate(body);

  if (errors.length > 0) {
    return errorResponse("Validation failed", 400, errors);
  }

  const updateData: Record<string, unknown> = { id: useCase._id };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.department !== undefined) updateData.department = body.department;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.metrics !== undefined) updateData.metrics = body.metrics;

  try {
    await getConvex().mutation(api.useCases.update, updateData as any);
  } catch (error) {
    if (error instanceof Error && error.message.includes("must have at least one")) {
      return errorResponse("Validation failed", 400, [
        {
          field: "metrics",
          message: "Use case must have at least one metric or one linked value item",
        },
      ]);
    }
    throw error;
  }

  const updated = await getConvex().query(api.useCases.get, { id: useCase._id });
  return jsonResponse(updated);
}

// DELETE /api/calculations/:shortId/use-cases/:useCaseShortId - Delete use case
async function deleteUseCase(shortId: string, useCaseShortId: string): Promise<Response> {
  const calculation = await getConvex().query(api.calculations.getByShortId, { shortId });

  if (!calculation) {
    return notFoundResponse("Calculation");
  }

  const useCase = await getConvex().query(api.useCases.getByShortId, { shortId: useCaseShortId });

  if (!useCase || useCase.calculationId !== calculation._id) {
    return notFoundResponse("Use case");
  }

  await getConvex().mutation(api.useCases.remove, { id: useCase._id });
  return jsonResponse({ success: true });
}

// =============================================================================
// Main API Router
// =============================================================================

export async function handleApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Only handle /api/* routes
  if (!path.startsWith("/api/")) {
    return null;
  }

  // Skip the /api/config endpoint (handled elsewhere)
  if (path === "/api/config") {
    return null;
  }

  try {
    // GET /api/calculations
    if (path === "/api/calculations" && method === "GET") {
      return await listCalculations();
    }

    // POST /api/calculations
    if (path === "/api/calculations" && method === "POST") {
      return await createCalculation(req);
    }

    // Routes with :shortId
    const calcMatch = path.match(/^\/api\/calculations\/([a-z0-9]+)(\/.*)?$/);
    if (calcMatch) {
      const shortId = calcMatch[1]!;
      const subPath = calcMatch[2] || "";

      // GET /api/calculations/:shortId
      if (subPath === "" && method === "GET") {
        return await getCalculation(shortId);
      }

      // PUT /api/calculations/:shortId
      if (subPath === "" && method === "PUT") {
        return await updateCalculation(shortId, req);
      }

      // DELETE /api/calculations/:shortId
      if (subPath === "" && method === "DELETE") {
        return await deleteCalculation(shortId);
      }

      // GET /api/calculations/:shortId/full
      if (subPath === "/full" && method === "GET") {
        return await getCalculationFull(shortId);
      }

      // PUT /api/calculations/:shortId/full
      if (subPath === "/full" && method === "PUT") {
        return await updateCalculationFull(shortId, req);
      }

      // PUT /api/calculations/:shortId/assumptions
      if (subPath === "/assumptions" && method === "PUT") {
        return await updateAssumptions(shortId, req);
      }

      // GET /api/calculations/:shortId/value-items
      if (subPath === "/value-items" && method === "GET") {
        return await listValueItems(shortId);
      }

      // POST /api/calculations/:shortId/value-items
      if (subPath === "/value-items" && method === "POST") {
        return await createValueItem(shortId, req);
      }

      // Value item routes with :itemShortId
      const itemMatch = subPath.match(/^\/value-items\/([a-z0-9]+)$/);
      if (itemMatch) {
        const itemShortId = itemMatch[1]!;

        // PUT /api/calculations/:shortId/value-items/:itemShortId
        if (method === "PUT") {
          return await updateValueItem(shortId, itemShortId, req);
        }

        // DELETE /api/calculations/:shortId/value-items/:itemShortId
        if (method === "DELETE") {
          return await deleteValueItem(shortId, itemShortId);
        }
      }

      // GET /api/calculations/:shortId/use-cases
      if (subPath === "/use-cases" && method === "GET") {
        return await listUseCases(shortId);
      }

      // POST /api/calculations/:shortId/use-cases
      if (subPath === "/use-cases" && method === "POST") {
        return await createUseCase(shortId, req);
      }

      // Use case routes with :useCaseShortId
      const useCaseMatch = subPath.match(/^\/use-cases\/([a-z0-9]+)$/);
      if (useCaseMatch) {
        const useCaseShortId = useCaseMatch[1]!;

        // PUT /api/calculations/:shortId/use-cases/:useCaseShortId
        if (method === "PUT") {
          return await updateUseCase(shortId, useCaseShortId, req);
        }

        // DELETE /api/calculations/:shortId/use-cases/:useCaseShortId
        if (method === "DELETE") {
          return await deleteUseCase(shortId, useCaseShortId);
        }
      }
    }

    // No matching route
    return errorResponse("Not found", 404);
  } catch (error) {
    console.error("API error:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", 500);
  }
}
