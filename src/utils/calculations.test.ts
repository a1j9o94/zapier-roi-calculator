import { test, expect, describe } from "bun:test";
import {
  calculateItemAnnualValue,
  calculateCategoryTotals,
  calculateTotalAnnualValue,
  calculateProjection,
  calculateROIMultiple,
  calculateTotalHoursSaved,
  getCategoryBreakdown,
} from "./calculations";
import type { Assumptions, ValueItem, Category } from "../types/roi";

// Helper to create a mock value item
function createValueItem(
  overrides: Partial<ValueItem> & { category: Category }
): ValueItem {
  return {
    _id: "test_id" as any,
    _creationTime: Date.now(),
    calculationId: "calc_id" as any,
    name: "Test Item",
    quantity: 1,
    unitValue: 100,
    order: 0,
    ...overrides,
  };
}

// Default test assumptions
const defaultAssumptions: Assumptions = {
  hourlyRates: {
    basic: 25,
    operations: 50,
    engineering: 100,
    executive: 200,
  },
  taskMinutes: {
    simple: 2,
    medium: 8,
    complex: 20,
  },
  projectionYears: 3,
  realizationRamp: [0.5, 1, 1],
  annualGrowthRate: 0.1,
  avgDataBreachCost: 150000,
  avgSupportTicketCost: 150,
};

describe("calculateItemAnnualValue", () => {
  describe("time_savings", () => {
    test("calculates correctly with default complexity and rate tier", () => {
      const item = createValueItem({
        category: "time_savings",
        quantity: 1000, // tasks per month
      });

      // 1000 tasks * 8 min (medium) / 60 = 133.33 hours/month
      // 133.33 * 12 * $50 (operations) = $80,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(80000);
    });

    test("calculates correctly with simple complexity", () => {
      const item = createValueItem({
        category: "time_savings",
        quantity: 1000,
        complexity: "simple",
        rateTier: "operations",
      });

      // 1000 tasks * 2 min / 60 = 33.33 hours/month
      // 33.33 * 12 * $50 = $20,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(20000);
    });

    test("calculates correctly with complex tasks and engineering rate", () => {
      const item = createValueItem({
        category: "time_savings",
        quantity: 500,
        complexity: "complex",
        rateTier: "engineering",
      });

      // 500 tasks * 20 min / 60 = 166.67 hours/month
      // 166.67 * 12 * $100 = $200,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(200000);
    });

    test("uses executive rate tier correctly", () => {
      const item = createValueItem({
        category: "time_savings",
        quantity: 60, // 60 tasks per month
        complexity: "medium",
        rateTier: "executive",
      });

      // 60 tasks * 8 min / 60 = 8 hours/month
      // 8 * 12 * $200 = $19,200
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(19200);
    });
  });

  describe("revenue_impact", () => {
    test("calculates correctly with rate multiplier", () => {
      const item = createValueItem({
        category: "revenue_impact",
        quantity: 1,
        unitValue: 10000,
        rate: 1, // 100%
      });

      // 1 * 12 * $10,000 * 1 = $120,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(120000);
    });

    test("applies partial rate correctly", () => {
      const item = createValueItem({
        category: "revenue_impact",
        quantity: 10,
        unitValue: 5000,
        rate: 0.1, // 10% improvement
      });

      // 10 * 12 * $5,000 * 0.1 = $60,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(60000);
    });

    test("defaults to 100% rate when not specified", () => {
      const item = createValueItem({
        category: "revenue_impact",
        quantity: 2,
        unitValue: 1000,
      });

      // 2 * 12 * $1,000 * 1 = $24,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(24000);
    });
  });

  describe("cost_reduction", () => {
    test("calculates full cost reduction", () => {
      const item = createValueItem({
        category: "cost_reduction",
        quantity: 1,
        unitValue: 50000,
        rate: 1, // 100% reduction
      });

      // 1 * $50,000 * 1 = $50,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(50000);
    });

    test("calculates partial cost reduction", () => {
      const item = createValueItem({
        category: "cost_reduction",
        quantity: 1,
        unitValue: 100000,
        rate: 0.3, // 30% reduction
      });

      // 1 * $100,000 * 0.3 = $30,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(30000);
    });

    test("calculates cost reduction with quantity", () => {
      const item = createValueItem({
        category: "cost_reduction",
        quantity: 500,
        unitValue: 10000,
        rate: 1, // 100% reduction
      });

      // 500 * $10,000 * 1 = $5,000,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(5000000);
    });
  });

  describe("uptime", () => {
    test("calculates expected value from probability and cost", () => {
      const item = createValueItem({
        category: "uptime",
        quantity: 0.15, // 15% probability
        unitValue: 100000, // cost per incident
      });

      // 0.15 * $100,000 = $15,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(15000);
    });
  });

  describe("security_governance", () => {
    test("calculates risk reduction value", () => {
      const item = createValueItem({
        category: "security_governance",
        quantity: 0.08, // 8% probability
        unitValue: 150000, // potential cost
      });

      // 0.08 * $150,000 = $12,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(12000);
    });
  });

  describe("tool_consolidation", () => {
    test("calculates direct cost savings", () => {
      const item = createValueItem({
        category: "tool_consolidation",
        quantity: 3, // 3 tools
        unitValue: 12000, // $12,000 per tool per year
      });

      // 3 * $12,000 = $36,000
      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(36000);
    });
  });

  describe("manual override", () => {
    test("uses manualAnnualValue when set", () => {
      const item = createValueItem({
        category: "time_savings",
        quantity: 1000,
        manualAnnualValue: 50000,
      });

      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(50000);
    });

    test("ignores calculation when manualAnnualValue is set", () => {
      const item = createValueItem({
        category: "revenue_impact",
        quantity: 100,
        unitValue: 10000,
        rate: 1,
        manualAnnualValue: 999,
      });

      const result = calculateItemAnnualValue(item, defaultAssumptions);
      expect(result).toBe(999);
    });
  });
});

describe("calculateCategoryTotals", () => {
  test("calculates totals for each category", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", quantity: 100, complexity: "medium", rateTier: "operations" }),
      createValueItem({ category: "time_savings", quantity: 50, complexity: "simple", rateTier: "basic" }),
      createValueItem({ category: "revenue_impact", quantity: 1, unitValue: 5000, rate: 1 }),
      createValueItem({ category: "cost_reduction", quantity: 1, unitValue: 10000, rate: 0.5 }),
    ];

    const totals = calculateCategoryTotals(items, defaultAssumptions);

    // time_savings: (100 * 8/60 * 12 * 50) + (50 * 2/60 * 12 * 25) = 8000 + 500 = 8500
    expect(totals.time_savings).toBe(8500);
    // revenue_impact: 1 * 12 * 5000 * 1 = 60000
    expect(totals.revenue_impact).toBe(60000);
    // cost_reduction: 10000 * 0.5 = 5000
    expect(totals.cost_reduction).toBe(5000);
    // Others should be 0
    expect(totals.uptime).toBe(0);
    expect(totals.security_governance).toBe(0);
    expect(totals.tool_consolidation).toBe(0);
  });

  test("returns zeros for empty items array", () => {
    const totals = calculateCategoryTotals([], defaultAssumptions);

    expect(totals.time_savings).toBe(0);
    expect(totals.revenue_impact).toBe(0);
    expect(totals.cost_reduction).toBe(0);
    expect(totals.uptime).toBe(0);
    expect(totals.security_governance).toBe(0);
    expect(totals.tool_consolidation).toBe(0);
  });
});

describe("calculateTotalAnnualValue", () => {
  test("sums all item values", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", quantity: 1000, complexity: "medium", rateTier: "operations" }),
      createValueItem({ category: "revenue_impact", quantity: 1, unitValue: 10000, rate: 1 }),
    ];

    // time_savings: 80000, revenue_impact: 120000
    const total = calculateTotalAnnualValue(items, defaultAssumptions);
    expect(total).toBe(200000);
  });

  test("returns 0 for empty items", () => {
    const total = calculateTotalAnnualValue([], defaultAssumptions);
    expect(total).toBe(0);
  });
});

describe("calculateProjection", () => {
  test("applies realization ramp correctly", () => {
    const projections = calculateProjection(100000, defaultAssumptions);

    // Year 1: 100000 * 1.0^0 * 0.5 = 50000
    expect(projections[0]!.year).toBe(1);
    expect(projections[0]!.value).toBeCloseTo(50000, 2);

    // Year 2: 100000 * 1.1^1 * 1.0 = 110000
    expect(projections[1]!.year).toBe(2);
    expect(projections[1]!.value).toBeCloseTo(110000, 2);

    // Year 3: 100000 * 1.1^2 * 1.0 = 121000
    expect(projections[2]!.year).toBe(3);
    expect(projections[2]!.value).toBeCloseTo(121000, 2);
  });

  test("calculates investment correctly", () => {
    const projections = calculateProjection(100000, defaultAssumptions, 10000, 30000);

    // Incremental investment = 30000 - 10000 = 20000
    expect(projections[0]!.investment).toBe(20000);
    expect(projections[0]!.netValue).toBe(50000 - 20000);
  });

  test("handles zero investment", () => {
    const projections = calculateProjection(100000, defaultAssumptions, 0, 0);

    expect(projections[0]!.investment).toBe(0);
    expect(projections[0]!.netValue).toBe(projections[0]!.value);
  });

  test("handles negative incremental investment (cost savings)", () => {
    const projections = calculateProjection(100000, defaultAssumptions, 50000, 30000);

    // Incremental = 30000 - 50000 = -20000, so investment should be 0
    expect(projections[0]!.investment).toBe(0);
  });
});

describe("calculateROIMultiple", () => {
  test("calculates ROI multiple correctly", () => {
    const roi = calculateROIMultiple(100000, 10000, 30000);
    // ROI = 100000 / (30000 - 10000) = 100000 / 20000 = 5
    expect(roi).toBe(5);
  });

  test("returns null when investment is zero", () => {
    const roi = calculateROIMultiple(100000, 0, 0);
    expect(roi).toBeNull();
  });

  test("returns null when investment is negative", () => {
    const roi = calculateROIMultiple(100000, 50000, 30000);
    expect(roi).toBeNull();
  });

  test("calculates fractional ROI", () => {
    const roi = calculateROIMultiple(50000, 0, 100000);
    // ROI = 50000 / 100000 = 0.5
    expect(roi).toBe(0.5);
  });
});

describe("calculateTotalHoursSaved", () => {
  test("sums hours from time_savings items only", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", quantity: 600, complexity: "medium" }), // 600 * 8 / 60 = 80 hours
      createValueItem({ category: "time_savings", quantity: 300, complexity: "simple" }), // 300 * 2 / 60 = 10 hours
      createValueItem({ category: "revenue_impact", quantity: 1, unitValue: 10000 }), // Should be ignored
    ];

    const hours = calculateTotalHoursSaved(items, defaultAssumptions);
    expect(hours).toBe(90);
  });

  test("returns 0 when no time_savings items", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "revenue_impact", quantity: 1, unitValue: 10000 }),
      createValueItem({ category: "cost_reduction", quantity: 1, unitValue: 5000 }),
    ];

    const hours = calculateTotalHoursSaved(items, defaultAssumptions);
    expect(hours).toBe(0);
  });

  test("handles complex tasks", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", quantity: 180, complexity: "complex" }), // 180 * 20 / 60 = 60 hours
    ];

    const hours = calculateTotalHoursSaved(items, defaultAssumptions);
    expect(hours).toBe(60);
  });
});

describe("getCategoryBreakdown", () => {
  test("returns breakdown sorted by value descending", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", quantity: 1000, complexity: "medium", rateTier: "operations" }), // 80000
      createValueItem({ category: "revenue_impact", quantity: 1, unitValue: 10000, rate: 1 }), // 120000
    ];

    const breakdown = getCategoryBreakdown(items, defaultAssumptions);

    expect(breakdown.length).toBe(2);
    expect(breakdown[0]!.category).toBe("revenue_impact");
    expect(breakdown[0]!.value).toBe(120000);
    expect(breakdown[1]!.category).toBe("time_savings");
    expect(breakdown[1]!.value).toBe(80000);
  });

  test("calculates percentages correctly", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", manualAnnualValue: 75000 }),
      createValueItem({ category: "revenue_impact", manualAnnualValue: 25000 }),
    ];

    const breakdown = getCategoryBreakdown(items, defaultAssumptions);

    expect(breakdown[0]!.percentage).toBe(75);
    expect(breakdown[1]!.percentage).toBe(25);
  });

  test("filters out zero-value categories", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", manualAnnualValue: 50000 }),
    ];

    const breakdown = getCategoryBreakdown(items, defaultAssumptions);

    expect(breakdown.length).toBe(1);
    expect(breakdown[0]!.category).toBe("time_savings");
  });

  test("includes correct labels and colors", () => {
    const items: ValueItem[] = [
      createValueItem({ category: "time_savings", manualAnnualValue: 10000 }),
    ];

    const breakdown = getCategoryBreakdown(items, defaultAssumptions);

    expect(breakdown[0]!.label).toBe("Time Savings");
    expect(breakdown[0]!.color).toBe("#FF4A00");
  });

  test("returns empty array for no items", () => {
    const breakdown = getCategoryBreakdown([], defaultAssumptions);
    expect(breakdown.length).toBe(0);
  });
});
