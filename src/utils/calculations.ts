import type {
  Assumptions,
  ValueItem,
  Category,
  RateTier,
  Complexity,
} from "../types/roi";
import { CATEGORY_ORDER } from "../types/roi";

/**
 * Calculate the annual value for a single value item based on its category
 */
export function calculateItemAnnualValue(
  item: ValueItem,
  assumptions: Assumptions
): number {
  // If manual override is set, use that
  if (item.manualAnnualValue !== undefined && item.manualAnnualValue !== null) {
    return item.manualAnnualValue;
  }

  switch (item.category) {
    case "time_savings":
      return calculateTimeSavings(item, assumptions);
    case "revenue_impact":
      return calculateRevenueImpact(item);
    case "cost_reduction":
      return calculateCostReduction(item);
    case "uptime":
      return calculateUptimeValue(item, assumptions);
    case "security_governance":
      return calculateSecurityValue(item);
    case "tool_consolidation":
      return calculateToolConsolidation(item);
    default:
      return 0;
  }
}

/**
 * Time savings calculation:
 * quantity = tasks per month
 * unitValue = (unused, we use complexity + taskMinutes)
 * complexity = simple/medium/complex (determines minutes per task)
 * rateTier = which hourly rate to use
 *
 * Formula: tasks/month * 12 * (minutes/task / 60) * hourly_rate
 */
function calculateTimeSavings(
  item: ValueItem,
  assumptions: Assumptions
): number {
  const tasksPerMonth = item.quantity;
  const complexity: Complexity = item.complexity ?? "medium";
  const rateTier: RateTier = item.rateTier ?? "operations";

  const minutesPerTask = assumptions.taskMinutes[complexity];
  const hourlyRate = assumptions.hourlyRates[rateTier];

  const hoursPerMonth = (tasksPerMonth * minutesPerTask) / 60;
  const annualValue = hoursPerMonth * 12 * hourlyRate;

  return annualValue;
}

/**
 * Revenue impact calculation:
 * quantity = number of deals/occurrences per year
 * unitValue = value per deal/occurrence
 * rate = improvement percentage (e.g., 0.1 for 10% improvement)
 *
 * Formula: quantity * unitValue * rate
 */
function calculateRevenueImpact(item: ValueItem): number {
  const quantity = item.quantity;
  const unitValue = item.unitValue;
  const rate = item.rate ?? 1; // Default to 100% if no rate specified

  return quantity * unitValue * rate;
}

/**
 * Cost reduction calculation:
 * quantity = number of items (e.g., licenses, subscriptions)
 * unitValue = cost per item
 * rate = reduction percentage (e.g., 1.0 for 100% reduction)
 *
 * Formula: quantity * unitValue * rate
 */
function calculateCostReduction(item: ValueItem): number {
  const quantity = item.quantity;
  const unitValue = item.unitValue;
  const rate = item.rate ?? 1; // Default to 100% reduction

  return quantity * unitValue * rate;
}

/**
 * Uptime/reliability calculation:
 * quantity = probability of incident per year (e.g., 0.15 for 15%)
 * unitValue = cost per incident
 *
 * Formula: probability * cost_per_incident (expected annual cost avoided)
 */
function calculateUptimeValue(
  item: ValueItem,
  _assumptions: Assumptions
): number {
  const probability = item.quantity;
  const costPerIncident = item.unitValue;

  return probability * costPerIncident;
}

/**
 * Security/governance calculation:
 * quantity = probability of event per year (e.g., 0.08 for 8%)
 * unitValue = potential cost if event occurs
 *
 * Formula: probability * potential_cost (expected annual risk reduction)
 */
function calculateSecurityValue(item: ValueItem): number {
  const probability = item.quantity;
  const potentialCost = item.unitValue;

  return probability * potentialCost;
}

/**
 * Tool consolidation calculation:
 * quantity = number of tools (typically 1)
 * unitValue = annual cost per tool
 *
 * Formula: quantity * unitValue (direct cost savings)
 */
function calculateToolConsolidation(item: ValueItem): number {
  return item.quantity * item.unitValue;
}

/**
 * Calculate totals by category
 */
export function calculateCategoryTotals(
  items: ValueItem[],
  assumptions: Assumptions
): Record<Category, number> {
  const totals: Record<Category, number> = {
    time_savings: 0,
    revenue_impact: 0,
    cost_reduction: 0,
    uptime: 0,
    security_governance: 0,
    tool_consolidation: 0,
  };

  for (const item of items) {
    const value = calculateItemAnnualValue(item, assumptions);
    totals[item.category] += value;
  }

  return totals;
}

/**
 * Calculate grand total annual value
 */
export function calculateTotalAnnualValue(
  items: ValueItem[],
  assumptions: Assumptions
): number {
  return items.reduce(
    (total, item) => total + calculateItemAnnualValue(item, assumptions),
    0
  );
}

/**
 * Calculate multi-year projection
 */
export interface YearProjection {
  year: number;
  value: number;
  investment: number;
  netValue: number;
}

export function calculateProjection(
  baseAnnualValue: number,
  assumptions: Assumptions,
  currentSpend: number = 0,
  proposedSpend: number = 0
): YearProjection[] {
  const projections: YearProjection[] = [];
  const incrementalInvestment = proposedSpend - currentSpend;

  for (let i = 0; i < assumptions.projectionYears; i++) {
    const yearNumber = i + 1;

    // Apply growth rate for years after the first
    const growthMultiplier = Math.pow(1 + assumptions.annualGrowthRate, i);

    // Apply realization ramp
    const realizationRate = assumptions.realizationRamp[i] ?? 1;

    const value = baseAnnualValue * growthMultiplier * realizationRate;
    const investment = incrementalInvestment > 0 ? incrementalInvestment : 0;

    projections.push({
      year: yearNumber,
      value,
      investment,
      netValue: value - investment,
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

  if (incrementalInvestment <= 0) {
    return null; // Can't calculate ROI without positive investment
  }

  return totalAnnualValue / incrementalInvestment;
}

/**
 * Calculate total hours saved per month (for time_savings items only)
 */
export function calculateTotalHoursSaved(
  items: ValueItem[],
  assumptions: Assumptions
): number {
  return items
    .filter((item) => item.category === "time_savings")
    .reduce((total, item) => {
      const complexity: Complexity = item.complexity ?? "medium";
      const minutesPerTask = assumptions.taskMinutes[complexity];
      const hoursPerMonth = (item.quantity * minutesPerTask) / 60;
      return total + hoursPerMonth;
    }, 0);
}

/**
 * Get category breakdown for visualization
 */
export interface CategoryBreakdown {
  category: Category;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export function getCategoryBreakdown(
  items: ValueItem[],
  assumptions: Assumptions
): CategoryBreakdown[] {
  const totals = calculateCategoryTotals(items, assumptions);
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  const breakdown: CategoryBreakdown[] = CATEGORY_ORDER.map((category) => {
    const value = totals[category];
    const info = {
      time_savings: { label: "Time Savings", color: "#FF4A00" },
      revenue_impact: { label: "Revenue Impact", color: "#10B981" },
      cost_reduction: { label: "Cost Reduction", color: "#3B82F6" },
      uptime: { label: "Uptime / Reliability", color: "#8B5CF6" },
      security_governance: { label: "Security & Governance", color: "#EF4444" },
      tool_consolidation: { label: "Tool Consolidation", color: "#F59E0B" },
    }[category];

    return {
      category,
      label: info.label,
      value,
      percentage: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
      color: info.color,
    };
  });

  // Sort by value descending, filter out zero values
  return breakdown.filter((b) => b.value > 0).sort((a, b) => b.value - a.value);
}
