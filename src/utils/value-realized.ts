import type { UseCase, ValueItem, Archetype } from "../types/roi";
import { calculateItemAnnualValue } from "./calculations";

// ============================================================
// Types
// ============================================================

export interface ZapRunCacheEntry {
  zapId: string;
  useCaseId: string;
  totalRuns: number;
  runsLast30Days: number;
  runsLast7Days: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt?: string;
  fetchedAt: number;
}

export type HealthStatus = "healthy" | "warning" | "at_risk";
export type Trend = "increasing" | "stable" | "decreasing";

export interface ValueRealized {
  useCaseId: string;
  useCaseName: string;
  projectedAnnualValue: number;
  actualRunsLast30Days: number;
  projectedRunsPerMonth: number;
  realizationRate: number;
  realizedMonthlyValue: number;
  realizedAnnualValue: number;
  trend: Trend;
  healthStatus: HealthStatus;
  hasRunData: boolean;
}

export interface RealizationSummary {
  overallRealizationRate: number;
  projectedAnnualValue: number;
  realizedAnnualValue: number;
  totalRunsLast30Days: number;
  useCases: ValueRealized[];
  hasAnyRunData: boolean;
  hasAnyLinkedZaps: boolean;
}

// ============================================================
// Health status helpers
// ============================================================

export function getHealthStatus(rate: number): HealthStatus {
  if (rate >= 0.8) return "healthy";
  if (rate >= 0.5) return "warning";
  return "at_risk";
}

export const HEALTH_STATUS_INFO: Record<
  HealthStatus,
  { label: string; color: string; bgColor: string }
> = {
  healthy: { label: "Healthy", color: "#059669", bgColor: "#D1FAE5" },
  warning: { label: "Warning", color: "#D97706", bgColor: "#FEF3C7" },
  at_risk: { label: "At Risk", color: "#DC2626", bgColor: "#FEE2E2" },
};

// ============================================================
// Projected runs extraction
// ============================================================

const TASK_BASED_ARCHETYPES: Archetype[] = [
  "task_elimination",
  "task_simplification",
  "process_acceleration",
  "handoff_elimination",
];

function getProjectedMonthlyRuns(valueItems: ValueItem[]): number {
  let total = 0;
  for (const item of valueItems) {
    const inputs = item.inputs ?? {};
    switch (item.archetype) {
      case "task_elimination":
      case "task_simplification":
        total += inputs.tasksPerMonth?.value ?? 0;
        break;
      case "process_acceleration":
        total += inputs.processesPerMonth?.value ?? 0;
        break;
      case "handoff_elimination":
        total += inputs.handoffsPerMonth?.value ?? 0;
        break;
      default:
        // For non-task archetypes, use a heuristic: assume ~1 run per value-unit
        // This is a rough proxy; actual mapping depends on the archetype
        break;
    }
  }
  return total;
}

function isTaskBasedArchetype(archetype: Archetype): boolean {
  return TASK_BASED_ARCHETYPES.includes(archetype);
}

// ============================================================
// Trend detection
// ============================================================

function detectTrend(zapRuns: ZapRunCacheEntry[]): Trend {
  if (zapRuns.length === 0) return "stable";

  const totalLast30 = zapRuns.reduce((s, r) => s + r.runsLast30Days, 0);
  const totalLast7 = zapRuns.reduce((s, r) => s + r.runsLast7Days, 0);

  if (totalLast30 === 0) return "stable";

  // Project last 7 days to 30 days and compare
  const projected30FromWeekly = totalLast7 * (30 / 7);
  const ratio = projected30FromWeekly / totalLast30;

  if (ratio > 1.15) return "increasing";
  if (ratio < 0.85) return "decreasing";
  return "stable";
}

// ============================================================
// Core computation
// ============================================================

export function computeRealization(
  useCase: UseCase,
  linkedValueItems: ValueItem[],
  zapRunData: ZapRunCacheEntry[],
): ValueRealized {
  const projectedAnnualValue = linkedValueItems.reduce(
    (sum, item) => sum + calculateItemAnnualValue(item),
    0,
  );
  const projectedRunsPerMonth = getProjectedMonthlyRuns(linkedValueItems);
  const actualRunsLast30Days = zapRunData.reduce(
    (sum, r) => sum + r.runsLast30Days,
    0,
  );

  const hasRunData = zapRunData.length > 0;
  let realizationRate = 0;
  let realizedMonthlyValue = 0;

  if (hasRunData && projectedRunsPerMonth > 0) {
    realizationRate = Math.min(actualRunsLast30Days / projectedRunsPerMonth, 2);
    // For task-based archetypes, compute realized value from actual runs
    const hasTaskBased = linkedValueItems.some((vi) =>
      isTaskBasedArchetype(vi.archetype),
    );
    if (hasTaskBased) {
      realizedMonthlyValue = (projectedAnnualValue / 12) * realizationRate;
    } else {
      // For non-task archetypes, infer realization from activity presence
      realizedMonthlyValue =
        actualRunsLast30Days > 0 ? projectedAnnualValue / 12 : 0;
      realizationRate = actualRunsLast30Days > 0 ? 1 : 0;
    }
  } else if (hasRunData && projectedRunsPerMonth === 0) {
    // Has run data but no projected runs — activity is proof of automation
    realizationRate = actualRunsLast30Days > 0 ? 1 : 0;
    realizedMonthlyValue =
      actualRunsLast30Days > 0 ? projectedAnnualValue / 12 : 0;
  }

  return {
    useCaseId: useCase._id,
    useCaseName: useCase.name,
    projectedAnnualValue,
    actualRunsLast30Days,
    projectedRunsPerMonth,
    realizationRate,
    realizedMonthlyValue,
    realizedAnnualValue: realizedMonthlyValue * 12,
    trend: detectTrend(zapRunData),
    healthStatus: hasRunData
      ? getHealthStatus(realizationRate)
      : "at_risk",
    hasRunData,
  };
}

export function computeRealizationSummary(
  useCases: UseCase[],
  valueItems: ValueItem[],
  allZapRunData: ZapRunCacheEntry[],
): RealizationSummary {
  // Check if any use cases have linked Zaps in architecture
  const hasAnyLinkedZaps = useCases.some((uc) =>
    uc.architecture?.some((item) => item.type === "zap" && item.zapId),
  );

  const results: ValueRealized[] = useCases.map((uc) => {
    const linked = valueItems.filter((vi) => vi.useCaseId === uc._id);
    const runs = allZapRunData.filter((r) => r.useCaseId === uc._id);
    return computeRealization(uc, linked, runs);
  });

  const projectedAnnualValue = results.reduce(
    (s, r) => s + r.projectedAnnualValue,
    0,
  );
  const realizedAnnualValue = results.reduce(
    (s, r) => s + r.realizedAnnualValue,
    0,
  );
  const totalRunsLast30Days = results.reduce(
    (s, r) => s + r.actualRunsLast30Days,
    0,
  );
  const hasAnyRunData = results.some((r) => r.hasRunData);

  const overallRealizationRate =
    projectedAnnualValue > 0
      ? realizedAnnualValue / projectedAnnualValue
      : 0;

  // Sort by realization rate ascending (worst first)
  results.sort((a, b) => a.realizationRate - b.realizationRate);

  return {
    overallRealizationRate,
    projectedAnnualValue,
    realizedAnnualValue,
    totalRunsLast30Days,
    useCases: results,
    hasAnyRunData,
    hasAnyLinkedZaps,
  };
}
