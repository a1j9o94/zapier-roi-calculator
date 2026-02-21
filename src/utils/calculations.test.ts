import { test, expect, describe } from "bun:test";
import {
  calculateItemAnnualValue,
  calculateComputedValue,
  calculateDimensionTotals,
  getDimensionBreakdown,
  calculateTotalAnnualValue,
  calculateProjection,
  calculateROIMultiple,
  calculateTotalHoursSaved,
  calculateFTEEquivalent,
  calculateSummary,
} from "./calculations";
import type { Archetype, ValueItem, Assumptions } from "../types/roi";

function createItem(archetype: Archetype, inputs: Record<string, { value: number; confidence?: string }>, overrides?: Partial<ValueItem>): ValueItem {
  const DIMS: Record<string, string> = {
    pipeline_velocity: "revenue_impact", revenue_capture: "revenue_impact",
    revenue_expansion: "revenue_impact", time_to_revenue: "revenue_impact",
    process_acceleration: "speed_cycle_time", handoff_elimination: "speed_cycle_time",
    task_elimination: "productivity", task_simplification: "productivity",
    context_surfacing: "productivity", labor_avoidance: "cost_avoidance",
    tool_consolidation: "cost_avoidance", error_rework_elimination: "cost_avoidance",
    compliance_assurance: "risk_quality", data_integrity: "risk_quality",
    incident_prevention: "risk_quality", process_consistency: "risk_quality",
  };
  return {
    _id: "test_id" as any,
    _creationTime: Date.now(),
    calculationId: "calc_id" as any,
    archetype,
    dimension: DIMS[archetype]! as any,
    name: "Test Item",
    inputs,
    order: 0,
    ...overrides,
  };
}

function vi(key: string, value: number, confidence: string = "custom") {
  return { [key]: { value, confidence } };
}

const defaultAssumptions: Assumptions = {
  projectionYears: 3,
  realizationRamp: [0.5, 1, 1],
  annualGrowthRate: 0.1,
  defaultRates: { admin: 35, operations: 50, salesOps: 60, engineering: 88, manager: 80, executive: 105 },
};

// ============================================================
// Revenue Impact Archetypes
// ============================================================

describe("pipeline_velocity", () => {
  test("dealsPerQuarter x avgDealValue x conversionLift x 4", () => {
    const item = createItem("pipeline_velocity", {
      ...vi("dealsPerQuarter", 200),
      ...vi("avgDealValue", 25000),
      ...vi("conversionLift", 0.10),
    });
    // 200 × $25,000 × 10% × 4 = $2,000,000
    expect(calculateItemAnnualValue(item)).toBe(2000000);
  });
});

describe("revenue_capture", () => {
  test("annualRevenue x leakageRate x captureImprovement", () => {
    const item = createItem("revenue_capture", {
      ...vi("annualRevenue", 50000000),
      ...vi("leakageRate", 0.02),
      ...vi("captureImprovement", 0.45),
    });
    // $50M × 2% × 45% = $450,000
    expect(calculateItemAnnualValue(item)).toBe(450000);
  });
});

describe("revenue_expansion", () => {
  test("customerBase x expansionRate x avgExpansionValue x lift", () => {
    const item = createItem("revenue_expansion", {
      ...vi("customerBase", 500),
      ...vi("expansionRate", 0.15),
      ...vi("avgExpansionValue", 10000),
      ...vi("lift", 0.10),
    });
    // 500 × 15% × $10K × 10% = $75,000
    expect(calculateItemAnnualValue(item)).toBe(75000);
  });
});

describe("time_to_revenue", () => {
  test("newCustomers x revenuePerCustomer x daysAccelerated / 365", () => {
    const item = createItem("time_to_revenue", {
      ...vi("newCustomersPerYear", 200),
      ...vi("revenuePerCustomer", 50000),
      ...vi("daysAccelerated", 10),
    });
    // 200 × $50K × 10/365 ≈ $273,973
    expect(calculateItemAnnualValue(item)).toBeCloseTo(273972.60, 0);
  });
});

// ============================================================
// Speed / Cycle Time Archetypes
// ============================================================

describe("process_acceleration", () => {
  test("processesPerMonth x (before - after) x rate x 12", () => {
    const item = createItem("process_acceleration", {
      ...vi("processesPerMonth", 100),
      ...vi("timeBeforeHrs", 8),
      ...vi("timeAfterHrs", 3),
      ...vi("hourlyRate", 80),
    });
    // 100 × (8-3) × $80 × 12 = $480,000
    expect(calculateItemAnnualValue(item)).toBe(480000);
  });
});

describe("handoff_elimination", () => {
  test("handoffs x queueTime x rate x 12", () => {
    const item = createItem("handoff_elimination", {
      ...vi("handoffsPerMonth", 500),
      ...vi("avgQueueTimeHrs", 2),
      ...vi("hourlyRateOfWaitingParty", 60),
    });
    // 500 × 2 × $60 × 12 = $720,000
    expect(calculateItemAnnualValue(item)).toBe(720000);
  });
});

// ============================================================
// Productivity Archetypes
// ============================================================

describe("task_elimination", () => {
  test("tasks x minutes x (rate/60) x 12", () => {
    const item = createItem("task_elimination", {
      ...vi("tasksPerMonth", 3000),
      ...vi("minutesPerTask", 8),
      ...vi("hourlyRate", 50),
    });
    // 3000 × 8 × ($50/60) × 12 = $240,000
    expect(calculateItemAnnualValue(item)).toBe(240000);
  });
});

describe("task_simplification", () => {
  test("tasks x minutesSaved x (rate/60) x 12", () => {
    const item = createItem("task_simplification", {
      ...vi("tasksPerMonth", 2000),
      ...vi("minutesSavedPerTask", 5),
      ...vi("hourlyRate", 50),
    });
    // 2000 × 5 × ($50/60) × 12 = $100,000
    expect(calculateItemAnnualValue(item)).toBe(100000);
  });
});

describe("context_surfacing", () => {
  test("meetings + searches value", () => {
    const item = createItem("context_surfacing", {
      ...vi("meetingsAvoidedPerMonth", 20),
      ...vi("attendeesPerMeeting", 4),
      ...vi("meetingDurationHrs", 1),
      ...vi("meetingHourlyRate", 80),
      ...vi("searchesAvoidedPerMonth", 100),
      ...vi("avgSearchTimeMin", 20),
      ...vi("searchHourlyRate", 60),
    });
    // Meetings: 20 × 4 × 1 × $80 × 12 = $76,800
    // Searches: 100 × 20 × ($60/60) × 12 = $24,000
    // Total = $100,800
    expect(calculateItemAnnualValue(item)).toBe(100800);
  });
});

// ============================================================
// Cost Avoidance Archetypes
// ============================================================

describe("labor_avoidance", () => {
  test("FTEs x annual cost", () => {
    const item = createItem("labor_avoidance", {
      ...vi("ftesAvoided", 2),
      ...vi("fullyLoadedAnnualCost", 100000),
    });
    // 2 × $100K = $200,000
    expect(calculateItemAnnualValue(item)).toBe(200000);
  });
});

describe("tool_consolidation", () => {
  test("tools x annual cost per tool", () => {
    const item = createItem("tool_consolidation", {
      ...vi("toolsEliminated", 3),
      ...vi("annualLicenseCostPerTool", 15000),
    });
    // 3 × $15K = $45,000
    expect(calculateItemAnnualValue(item)).toBe(45000);
  });
});

describe("error_rework_elimination", () => {
  test("errors x costPerError x reduction x 12", () => {
    const item = createItem("error_rework_elimination", {
      ...vi("errorsPerMonth", 200),
      ...vi("avgCostPerError", 150),
      ...vi("reductionRate", 0.70),
    });
    // 200 × $150 × 70% × 12 = $252,000
    expect(calculateItemAnnualValue(item)).toBe(252000);
  });
});

// ============================================================
// Risk & Quality Archetypes
// ============================================================

describe("compliance_assurance", () => {
  test("violations x penalty x reduction", () => {
    const item = createItem("compliance_assurance", {
      ...vi("expectedViolationsPerYear", 5),
      ...vi("avgPenaltyPerViolation", 100000),
      ...vi("reductionRate", 0.55),
    });
    // 5 × $100K × 55% = $275,000
    expect(calculateItemAnnualValue(item)).toBe(275000);
  });
});

describe("data_integrity", () => {
  test("records x errorRate x cost x reduction x 12", () => {
    const item = createItem("data_integrity", {
      ...vi("recordsPerMonth", 50000),
      ...vi("errorRate", 0.02),
      ...vi("costPerError", 50),
      ...vi("reductionRate", 0.75),
    });
    // 50K × 2% × $50 × 75% × 12 = $450,000
    expect(calculateItemAnnualValue(item)).toBe(450000);
  });
});

describe("incident_prevention", () => {
  test("incidents x cost x reduction", () => {
    const item = createItem("incident_prevention", {
      ...vi("incidentsPerYear", 12),
      ...vi("avgCostPerIncident", 10000),
      ...vi("reductionRate", 0.30),
    });
    // 12 × $10K × 30% = $36,000
    expect(calculateItemAnnualValue(item)).toBe(36000);
  });
});

describe("process_consistency", () => {
  test("processes x defectRate x cost x reduction x 12", () => {
    const item = createItem("process_consistency", {
      ...vi("processesPerMonth", 1000),
      ...vi("defectRate", 0.05),
      ...vi("costPerDefect", 200),
      ...vi("reductionRate", 0.65),
    });
    // 1000 × 5% × $200 × 65% × 12 = $78,000
    expect(calculateItemAnnualValue(item)).toBe(78000);
  });
});

// ============================================================
// Manual Override
// ============================================================

describe("manual override", () => {
  test("uses manualAnnualValue when set", () => {
    const item = createItem("task_elimination", {
      ...vi("tasksPerMonth", 1000),
      ...vi("minutesPerTask", 10),
      ...vi("hourlyRate", 50),
    }, { manualAnnualValue: 99999 });
    expect(calculateItemAnnualValue(item)).toBe(99999);
  });
});

// ============================================================
// Computed Value (formula trace + confidence)
// ============================================================

describe("calculateComputedValue", () => {
  test("generates formula trace and lowest confidence", () => {
    const item = createItem("pipeline_velocity", {
      dealsPerQuarter: { value: 100, confidence: "custom" as any },
      avgDealValue: { value: 20000, confidence: "custom" as any },
      conversionLift: { value: 0.10, confidence: "estimated" as any },
    });
    const result = calculateComputedValue(item);
    expect(result.annualValue).toBe(800000);
    expect(result.confidence).toBe("custom");
    expect(result.formula).toContain("$800,000");
  });
});

// ============================================================
// Aggregation Functions
// ============================================================

describe("calculateDimensionTotals", () => {
  test("groups by dimension correctly", () => {
    const items = [
      createItem("task_elimination", { ...vi("tasksPerMonth", 100), ...vi("minutesPerTask", 6), ...vi("hourlyRate", 50) }),
      createItem("pipeline_velocity", { ...vi("dealsPerQuarter", 10), ...vi("avgDealValue", 1000), ...vi("conversionLift", 0.1) }),
    ];
    const totals = calculateDimensionTotals(items);

    const productivity = totals.find((t) => t.dimension === "productivity");
    const revenue = totals.find((t) => t.dimension === "revenue_impact");
    // task_elimination: 100 × 6 × ($50/60) × 12 = $6,000
    expect(productivity!.total).toBe(6000);
    expect(productivity!.itemCount).toBe(1);
    // pipeline_velocity: 10 × $1000 × 10% × 4 = $4,000
    expect(revenue!.total).toBe(4000);
    expect(revenue!.itemCount).toBe(1);
  });
});

describe("getDimensionBreakdown", () => {
  test("filters zero dimensions and sorts by value", () => {
    const items = [
      createItem("task_elimination", { ...vi("tasksPerMonth", 100), ...vi("minutesPerTask", 6), ...vi("hourlyRate", 50) }),
    ];
    const breakdown = getDimensionBreakdown(items);
    expect(breakdown.length).toBe(1);
    expect(breakdown[0]!.dimension).toBe("productivity");
    expect(breakdown[0]!.percentage).toBe(100);
  });
});

// ============================================================
// Projection
// ============================================================

describe("calculateProjection", () => {
  test("applies realization ramp and growth", () => {
    const proj = calculateProjection(100000, defaultAssumptions);
    expect(proj[0]!.value).toBeCloseTo(50000); // 100K × 0.5
    expect(proj[1]!.value).toBeCloseTo(110000); // 100K × 1.1 × 1.0
    expect(proj[2]!.value).toBeCloseTo(121000); // 100K × 1.21 × 1.0
  });

  test("calculates cumulative values", () => {
    const proj = calculateProjection(100000, defaultAssumptions, 0, 50000);
    expect(proj[0]!.cumulativeValue).toBeCloseTo(50000);
    expect(proj[0]!.cumulativeInvestment).toBe(50000);
    expect(proj[1]!.cumulativeValue).toBeCloseTo(160000);
  });

  test("handles zero investment", () => {
    const proj = calculateProjection(100000, defaultAssumptions, 0, 0);
    expect(proj[0]!.investment).toBe(0);
  });
});

// ============================================================
// ROI Multiple
// ============================================================

describe("calculateROIMultiple", () => {
  test("calculates correctly", () => {
    expect(calculateROIMultiple(100000, 10000, 30000)).toBe(5);
  });
  test("returns null for zero investment", () => {
    expect(calculateROIMultiple(100000, 0, 0)).toBeNull();
  });
  test("returns null for negative investment", () => {
    expect(calculateROIMultiple(100000, 50000, 30000)).toBeNull();
  });
});

// ============================================================
// Hours Saved
// ============================================================

describe("calculateTotalHoursSaved", () => {
  test("sums hours from time-related archetypes", () => {
    const items = [
      createItem("task_elimination", { ...vi("tasksPerMonth", 600), ...vi("minutesPerTask", 8), ...vi("hourlyRate", 50) }), // 600×8/60 = 80 hrs
      createItem("task_simplification", { ...vi("tasksPerMonth", 300), ...vi("minutesSavedPerTask", 4), ...vi("hourlyRate", 50) }), // 300×4/60 = 20 hrs
      createItem("pipeline_velocity", { ...vi("dealsPerQuarter", 10), ...vi("avgDealValue", 1000), ...vi("conversionLift", 0.1) }), // 0 hrs
    ];
    expect(calculateTotalHoursSaved(items)).toBe(100);
  });

  test("includes process_acceleration hours", () => {
    const items = [
      createItem("process_acceleration", { ...vi("processesPerMonth", 50), ...vi("timeBeforeHrs", 4), ...vi("timeAfterHrs", 1), ...vi("hourlyRate", 80) }), // 50×3 = 150 hrs
    ];
    expect(calculateTotalHoursSaved(items)).toBe(150);
  });
});

describe("calculateFTEEquivalent", () => {
  test("160 hours = 1 FTE", () => {
    expect(calculateFTEEquivalent(160)).toBe(1);
  });
  test("80 hours = 0.5 FTE", () => {
    expect(calculateFTEEquivalent(80)).toBe(0.5);
  });
});

// ============================================================
// Full Summary
// ============================================================

describe("calculateSummary", () => {
  test("returns complete summary", () => {
    const items = [
      createItem("task_elimination", { ...vi("tasksPerMonth", 3000), ...vi("minutesPerTask", 8), ...vi("hourlyRate", 50) }),
      createItem("pipeline_velocity", { ...vi("dealsPerQuarter", 200), ...vi("avgDealValue", 25000), ...vi("conversionLift", 0.10) }),
    ];
    const summary = calculateSummary(items, defaultAssumptions, 0, 70000);
    // task_elimination: $240K, pipeline_velocity: $2M = $2,240K total
    expect(summary.totalAnnualValue).toBe(2240000);
    expect(summary.roiMultiple).toBe(32);
    expect(summary.hoursSavedPerMonth).toBe(400); // 3000×8/60
    expect(summary.fteEquivalent).toBe(2.5);
    expect(summary.dimensionTotals.length).toBe(5);
    expect(summary.projection.length).toBe(3);
  });
});
