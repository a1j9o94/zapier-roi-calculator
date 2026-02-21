import type {
  Archetype,
  Assumptions,
  ValueItem,
  Dimension,
  ComputedValue,
  DimensionTotal,
  YearProjection,
  ConfidenceTier,
} from "../types/roi";
import { ARCHETYPE_DIMENSION, DIMENSION_INFO, DIMENSION_ORDER } from "../types/roi";

// ============================================================
// Archetype-specific calculation functions
// Each takes the archetype's inputs and returns annual value
// Formulas from UVS Value Driver Tree (260217)
// ============================================================

function getInputValue(inputs: Record<string, { value: number }>, key: string): number {
  return inputs[key]?.value ?? 0;
}

const ARCHETYPE_CALCULATORS: Record<Archetype, (inputs: Record<string, { value: number }>) => number> = {
  // 1.1 Pipeline Velocity
  // dealsPerQuarter × avgDealValue × conversionLift × 4
  pipeline_velocity: (inputs) =>
    getInputValue(inputs, "dealsPerQuarter") *
    getInputValue(inputs, "avgDealValue") *
    getInputValue(inputs, "conversionLift") *
    4,

  // 1.2 Revenue Capture
  // annualRevenue × leakageRate × captureImprovement
  revenue_capture: (inputs) =>
    getInputValue(inputs, "annualRevenue") *
    getInputValue(inputs, "leakageRate") *
    getInputValue(inputs, "captureImprovement"),

  // 1.3 Revenue Expansion
  // customerBase × expansionRate × avgExpansionValue × lift
  revenue_expansion: (inputs) =>
    getInputValue(inputs, "customerBase") *
    getInputValue(inputs, "expansionRate") *
    getInputValue(inputs, "avgExpansionValue") *
    getInputValue(inputs, "lift"),

  // 1.4 Time-to-Revenue
  // newCustomersPerYear × revenuePerCustomer × daysAccelerated / 365
  time_to_revenue: (inputs) =>
    getInputValue(inputs, "newCustomersPerYear") *
    getInputValue(inputs, "revenuePerCustomer") *
    getInputValue(inputs, "daysAccelerated") /
    365,

  // 2.1 Process Acceleration
  // processesPerMonth × (timeBeforeHrs - timeAfterHrs) × hourlyRate × 12
  process_acceleration: (inputs) =>
    getInputValue(inputs, "processesPerMonth") *
    (getInputValue(inputs, "timeBeforeHrs") - getInputValue(inputs, "timeAfterHrs")) *
    getInputValue(inputs, "hourlyRate") *
    12,

  // 2.2 Handoff Elimination
  // handoffsPerMonth × avgQueueTimeHrs × hourlyRateOfWaitingParty × 12
  handoff_elimination: (inputs) =>
    getInputValue(inputs, "handoffsPerMonth") *
    getInputValue(inputs, "avgQueueTimeHrs") *
    getInputValue(inputs, "hourlyRateOfWaitingParty") *
    12,

  // 3.1 Task Elimination
  // tasksPerMonth × minutesPerTask × (hourlyRate / 60) × 12
  task_elimination: (inputs) =>
    getInputValue(inputs, "tasksPerMonth") *
    getInputValue(inputs, "minutesPerTask") *
    (getInputValue(inputs, "hourlyRate") / 60) *
    12,

  // 3.2 Task Simplification
  // tasksPerMonth × minutesSavedPerTask × (hourlyRate / 60) × 12
  task_simplification: (inputs) =>
    getInputValue(inputs, "tasksPerMonth") *
    getInputValue(inputs, "minutesSavedPerTask") *
    (getInputValue(inputs, "hourlyRate") / 60) *
    12,

  // 3.3 Context Surfacing
  // (meetingsAvoided × attendees × durationHrs × avgHourlyRate × 12)
  // + (searchesAvoided × avgSearchTimeMin × (hourlyRate / 60) × 12)
  context_surfacing: (inputs) => {
    const meetingValue =
      getInputValue(inputs, "meetingsAvoidedPerMonth") *
      getInputValue(inputs, "attendeesPerMeeting") *
      getInputValue(inputs, "meetingDurationHrs") *
      getInputValue(inputs, "meetingHourlyRate") *
      12;
    const searchValue =
      getInputValue(inputs, "searchesAvoidedPerMonth") *
      getInputValue(inputs, "avgSearchTimeMin") *
      (getInputValue(inputs, "searchHourlyRate") / 60) *
      12;
    return meetingValue + searchValue;
  },

  // 4.1 Labor Avoidance
  // ftesAvoided × fullyLoadedAnnualCost
  labor_avoidance: (inputs) =>
    getInputValue(inputs, "ftesAvoided") *
    getInputValue(inputs, "fullyLoadedAnnualCost"),

  // 4.2 Tool Consolidation
  // toolsEliminated × annualLicenseCostPerTool
  tool_consolidation: (inputs) =>
    getInputValue(inputs, "toolsEliminated") *
    getInputValue(inputs, "annualLicenseCostPerTool"),

  // 4.3 Error/Rework Elimination
  // errorsPerMonth × avgCostPerError × reductionRate × 12
  error_rework_elimination: (inputs) =>
    getInputValue(inputs, "errorsPerMonth") *
    getInputValue(inputs, "avgCostPerError") *
    getInputValue(inputs, "reductionRate") *
    12,

  // 5.1 Compliance Assurance
  // expectedViolationsPerYear × avgPenaltyPerViolation × reductionRate
  compliance_assurance: (inputs) =>
    getInputValue(inputs, "expectedViolationsPerYear") *
    getInputValue(inputs, "avgPenaltyPerViolation") *
    getInputValue(inputs, "reductionRate"),

  // 5.2 Data Integrity
  // recordsPerMonth × errorRate × costPerError × reductionRate × 12
  data_integrity: (inputs) =>
    getInputValue(inputs, "recordsPerMonth") *
    getInputValue(inputs, "errorRate") *
    getInputValue(inputs, "costPerError") *
    getInputValue(inputs, "reductionRate") *
    12,

  // 5.3 Incident Prevention
  // incidentsPerYear × avgCostPerIncident × reductionRate
  incident_prevention: (inputs) =>
    getInputValue(inputs, "incidentsPerYear") *
    getInputValue(inputs, "avgCostPerIncident") *
    getInputValue(inputs, "reductionRate"),

  // 5.4 Process Consistency
  // processesPerMonth × defectRate × costPerDefect × reductionRate × 12
  process_consistency: (inputs) =>
    getInputValue(inputs, "processesPerMonth") *
    getInputValue(inputs, "defectRate") *
    getInputValue(inputs, "costPerDefect") *
    getInputValue(inputs, "reductionRate") *
    12,
};

// ============================================================
// Formula trace generators (human-readable calculation strings)
// ============================================================

const FORMULA_TRACES: Record<Archetype, (inputs: Record<string, { value: number }>) => string> = {
  pipeline_velocity: (i) =>
    `${getInputValue(i, "dealsPerQuarter")} deals/qtr × $${getInputValue(i, "avgDealValue").toLocaleString()} × ${(getInputValue(i, "conversionLift") * 100).toFixed(0)}% lift × 4 qtrs`,
  revenue_capture: (i) =>
    `$${getInputValue(i, "annualRevenue").toLocaleString()} × ${(getInputValue(i, "leakageRate") * 100).toFixed(1)}% leakage × ${(getInputValue(i, "captureImprovement") * 100).toFixed(0)}% capture`,
  revenue_expansion: (i) =>
    `${getInputValue(i, "customerBase")} customers × ${(getInputValue(i, "expansionRate") * 100).toFixed(0)}% rate × $${getInputValue(i, "avgExpansionValue").toLocaleString()} × ${(getInputValue(i, "lift") * 100).toFixed(0)}% lift`,
  time_to_revenue: (i) =>
    `${getInputValue(i, "newCustomersPerYear")} new customers × $${getInputValue(i, "revenuePerCustomer").toLocaleString()} × ${getInputValue(i, "daysAccelerated")} days / 365`,
  process_acceleration: (i) =>
    `${getInputValue(i, "processesPerMonth")} processes/mo × (${getInputValue(i, "timeBeforeHrs")}h - ${getInputValue(i, "timeAfterHrs")}h) × $${getInputValue(i, "hourlyRate")}/hr × 12 mo`,
  handoff_elimination: (i) =>
    `${getInputValue(i, "handoffsPerMonth")} handoffs/mo × ${getInputValue(i, "avgQueueTimeHrs")}h wait × $${getInputValue(i, "hourlyRateOfWaitingParty")}/hr × 12 mo`,
  task_elimination: (i) =>
    `${getInputValue(i, "tasksPerMonth").toLocaleString()} tasks/mo × ${getInputValue(i, "minutesPerTask")} min × ($${getInputValue(i, "hourlyRate")}/hr ÷ 60) × 12 mo`,
  task_simplification: (i) =>
    `${getInputValue(i, "tasksPerMonth").toLocaleString()} tasks/mo × ${getInputValue(i, "minutesSavedPerTask")} min saved × ($${getInputValue(i, "hourlyRate")}/hr ÷ 60) × 12 mo`,
  context_surfacing: (i) =>
    `(${getInputValue(i, "meetingsAvoidedPerMonth")} meetings × ${getInputValue(i, "attendeesPerMeeting")} people × ${getInputValue(i, "meetingDurationHrs")}h × $${getInputValue(i, "meetingHourlyRate")}/hr × 12) + (${getInputValue(i, "searchesAvoidedPerMonth")} searches × ${getInputValue(i, "avgSearchTimeMin")}min × $${getInputValue(i, "searchHourlyRate")}/hr ÷ 60 × 12)`,
  labor_avoidance: (i) =>
    `${getInputValue(i, "ftesAvoided")} FTEs × $${getInputValue(i, "fullyLoadedAnnualCost").toLocaleString()}/yr`,
  tool_consolidation: (i) =>
    `${getInputValue(i, "toolsEliminated")} tools × $${getInputValue(i, "annualLicenseCostPerTool").toLocaleString()}/yr`,
  error_rework_elimination: (i) =>
    `${getInputValue(i, "errorsPerMonth")} errors/mo × $${getInputValue(i, "avgCostPerError")}/error × ${(getInputValue(i, "reductionRate") * 100).toFixed(0)}% reduction × 12 mo`,
  compliance_assurance: (i) =>
    `${getInputValue(i, "expectedViolationsPerYear")} violations/yr × $${getInputValue(i, "avgPenaltyPerViolation").toLocaleString()}/violation × ${(getInputValue(i, "reductionRate") * 100).toFixed(0)}% reduction`,
  data_integrity: (i) =>
    `${getInputValue(i, "recordsPerMonth").toLocaleString()} records/mo × ${(getInputValue(i, "errorRate") * 100).toFixed(1)}% errors × $${getInputValue(i, "costPerError")}/error × ${(getInputValue(i, "reductionRate") * 100).toFixed(0)}% reduction × 12 mo`,
  incident_prevention: (i) =>
    `${getInputValue(i, "incidentsPerYear")} incidents/yr × $${getInputValue(i, "avgCostPerIncident").toLocaleString()}/incident × ${(getInputValue(i, "reductionRate") * 100).toFixed(0)}% reduction`,
  process_consistency: (i) =>
    `${getInputValue(i, "processesPerMonth").toLocaleString()} processes/mo × ${(getInputValue(i, "defectRate") * 100).toFixed(1)}% defects × $${getInputValue(i, "costPerDefect")}/defect × ${(getInputValue(i, "reductionRate") * 100).toFixed(0)}% reduction × 12 mo`,
};

// ============================================================
// Public calculation functions
// ============================================================

/**
 * Calculate the annual value for a single value item
 */
export function calculateItemAnnualValue(item: ValueItem): number {
  if (item.manualAnnualValue !== undefined && item.manualAnnualValue !== null) {
    return item.manualAnnualValue;
  }

  const calculator = ARCHETYPE_CALCULATORS[item.archetype];
  if (!calculator) return 0;

  return calculator(item.inputs ?? {});
}

/**
 * Calculate value with full computation details (formula trace + confidence)
 */
export function calculateComputedValue(item: ValueItem): ComputedValue {
  const annualValue = calculateItemAnnualValue(item);

  // Generate formula trace
  const traceGenerator = FORMULA_TRACES[item.archetype];
  const inputs = item.inputs ?? {};
  const formula = item.manualAnnualValue != null
    ? `Manual override: $${item.manualAnnualValue.toLocaleString()}`
    : traceGenerator
      ? `${traceGenerator(inputs)} = $${Math.round(annualValue).toLocaleString()}`
      : `$${Math.round(annualValue).toLocaleString()}`;

  // Overall confidence = lowest confidence of any input
  const confidence = getLowestConfidence(inputs);

  return { annualValue, formula, confidence };
}

/**
 * Get the lowest confidence tier across all inputs
 */
function getLowestConfidence(inputs: Record<string, { value: number; confidence?: ConfidenceTier }>): ConfidenceTier {
  const tiers: ConfidenceTier[] = Object.values(inputs)
    .map((i) => i.confidence ?? "custom")
    .filter(Boolean) as ConfidenceTier[];

  if (tiers.length === 0) return "custom";

  const priority: Record<ConfidenceTier, number> = {
    custom: 0,
    estimated: 1,
    benchmarked: 2,
  };

  let lowest: ConfidenceTier = "benchmarked";
  for (const tier of tiers) {
    if (priority[tier] < priority[lowest]) {
      lowest = tier;
    }
  }

  return lowest;
}

/**
 * Calculate totals grouped by dimension
 */
export function calculateDimensionTotals(items: ValueItem[]): DimensionTotal[] {
  const totals: Record<Dimension, { total: number; count: number }> = {
    revenue_impact: { total: 0, count: 0 },
    speed_cycle_time: { total: 0, count: 0 },
    productivity: { total: 0, count: 0 },
    cost_avoidance: { total: 0, count: 0 },
    risk_quality: { total: 0, count: 0 },
  };

  for (const item of items) {
    const dimension = item.dimension || ARCHETYPE_DIMENSION[item.archetype];
    if (dimension && totals[dimension]) {
      totals[dimension].total += calculateItemAnnualValue(item);
      totals[dimension].count += 1;
    }
  }

  const grandTotal = Object.values(totals).reduce((sum, d) => sum + d.total, 0);

  return DIMENSION_ORDER.map((dimension) => ({
    dimension,
    label: DIMENSION_INFO[dimension].label,
    total: totals[dimension].total,
    itemCount: totals[dimension].count,
    color: DIMENSION_INFO[dimension].color,
    percentage: grandTotal > 0 ? (totals[dimension].total / grandTotal) * 100 : 0,
  }));
}

/**
 * Get dimension breakdown for visualization (filtered to non-zero, sorted by value)
 */
export function getDimensionBreakdown(items: ValueItem[]): DimensionTotal[] {
  return calculateDimensionTotals(items)
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate grand total annual value
 */
export function calculateTotalAnnualValue(items: ValueItem[]): number {
  return items.reduce((total, item) => total + calculateItemAnnualValue(item), 0);
}

/**
 * Calculate multi-year projection with cumulative tracking
 */
export function calculateProjection(
  baseAnnualValue: number,
  assumptions: Assumptions,
  currentSpend: number = 0,
  proposedSpend: number = 0
): YearProjection[] {
  const projections: YearProjection[] = [];
  const incrementalInvestment = Math.max(0, proposedSpend - currentSpend);

  let cumulativeValue = 0;
  let cumulativeInvestment = 0;

  for (let i = 0; i < assumptions.projectionYears; i++) {
    const yearNumber = i + 1;
    const growthMultiplier = Math.pow(1 + assumptions.annualGrowthRate, i);
    const realizationRate = assumptions.realizationRamp[i] ?? 1;

    const value = baseAnnualValue * growthMultiplier * realizationRate;
    const investment = incrementalInvestment;

    cumulativeValue += value;
    cumulativeInvestment += investment;

    projections.push({
      year: yearNumber,
      value,
      investment,
      netValue: value - investment,
      cumulativeValue,
      cumulativeInvestment,
      cumulativeNetValue: cumulativeValue - cumulativeInvestment,
    });
  }

  return projections;
}

/**
 * Calculate ROI multiple
 */
export function calculateROIMultiple(
  totalAnnualValue: number,
  currentSpend: number = 0,
  proposedSpend: number = 0
): number | null {
  const incrementalInvestment = proposedSpend - currentSpend;
  if (incrementalInvestment <= 0) return null;
  return totalAnnualValue / incrementalInvestment;
}

/**
 * Calculate total hours saved per month (for time-related archetypes)
 */
export function calculateTotalHoursSaved(items: ValueItem[]): number {
  let totalHours = 0;

  for (const item of items) {
    const inputs = item.inputs ?? {};

    switch (item.archetype) {
      case "task_elimination": {
        const tasks = getInputValue(inputs, "tasksPerMonth");
        const minutes = getInputValue(inputs, "minutesPerTask");
        totalHours += (tasks * minutes) / 60;
        break;
      }
      case "task_simplification": {
        const tasks = getInputValue(inputs, "tasksPerMonth");
        const minutesSaved = getInputValue(inputs, "minutesSavedPerTask");
        totalHours += (tasks * minutesSaved) / 60;
        break;
      }
      case "process_acceleration": {
        const processes = getInputValue(inputs, "processesPerMonth");
        const timeBefore = getInputValue(inputs, "timeBeforeHrs");
        const timeAfter = getInputValue(inputs, "timeAfterHrs");
        totalHours += processes * (timeBefore - timeAfter);
        break;
      }
      case "handoff_elimination": {
        const handoffs = getInputValue(inputs, "handoffsPerMonth");
        const queueTime = getInputValue(inputs, "avgQueueTimeHrs");
        totalHours += handoffs * queueTime;
        break;
      }
      case "context_surfacing": {
        const meetings = getInputValue(inputs, "meetingsAvoidedPerMonth");
        const attendees = getInputValue(inputs, "attendeesPerMeeting");
        const duration = getInputValue(inputs, "meetingDurationHrs");
        const searches = getInputValue(inputs, "searchesAvoidedPerMonth");
        const searchTime = getInputValue(inputs, "avgSearchTimeMin");
        totalHours += (meetings * attendees * duration) + (searches * searchTime / 60);
        break;
      }
    }
  }

  return totalHours;
}

/**
 * Calculate FTE equivalent from monthly hours saved
 */
export function calculateFTEEquivalent(monthlyHoursSaved: number): number {
  const monthlyFTEHours = 160; // 40 hrs/week × 4 weeks
  return monthlyHoursSaved / monthlyFTEHours;
}

/**
 * Generate full calculation summary
 */
export function calculateSummary(
  items: ValueItem[],
  assumptions: Assumptions,
  currentSpend?: number,
  proposedSpend?: number
): {
  totalAnnualValue: number;
  dimensionTotals: DimensionTotal[];
  roiMultiple: number | null;
  hoursSavedPerMonth: number;
  fteEquivalent: number;
  projection: YearProjection[];
} {
  const totalAnnualValue = calculateTotalAnnualValue(items);
  const dimensionTotals = calculateDimensionTotals(items);
  const roiMultiple = calculateROIMultiple(totalAnnualValue, currentSpend, proposedSpend);
  const hoursSavedPerMonth = calculateTotalHoursSaved(items);
  const fteEquivalent = calculateFTEEquivalent(hoursSavedPerMonth);
  const projection = calculateProjection(
    totalAnnualValue,
    assumptions,
    currentSpend,
    proposedSpend
  );

  return {
    totalAnnualValue,
    dimensionTotals,
    roiMultiple,
    hoursSavedPerMonth,
    fteEquivalent,
    projection,
  };
}
