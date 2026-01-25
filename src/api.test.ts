import { test, expect, describe } from "bun:test";
import {
  isValidCategory,
  isValidRateTier,
  isValidComplexity,
  isValidUseCaseStatus,
  isValidUseCaseDifficulty,
  isNonEmptyString,
  isNumber,
  isOptionalNumber,
  isOptionalString,
  validateValueItemCreate,
  validateValueItemUpdate,
  validateUseCaseCreate,
  validateUseCaseUpdate,
  validateAssumptions,
  CATEGORIES,
  RATE_TIERS,
  COMPLEXITIES,
  USE_CASE_STATUSES,
  USE_CASE_DIFFICULTIES,
} from "./api";

describe("Validation Type Guards", () => {
  describe("isValidCategory", () => {
    test("accepts valid categories", () => {
      for (const category of CATEGORIES) {
        expect(isValidCategory(category)).toBe(true);
      }
    });

    test("rejects invalid categories", () => {
      expect(isValidCategory("invalid")).toBe(false);
      expect(isValidCategory("")).toBe(false);
      expect(isValidCategory(123)).toBe(false);
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory(undefined)).toBe(false);
    });
  });

  describe("isValidRateTier", () => {
    test("accepts valid rate tiers", () => {
      for (const tier of RATE_TIERS) {
        expect(isValidRateTier(tier)).toBe(true);
      }
    });

    test("rejects invalid rate tiers", () => {
      expect(isValidRateTier("invalid")).toBe(false);
      expect(isValidRateTier(123)).toBe(false);
    });
  });

  describe("isValidComplexity", () => {
    test("accepts valid complexities", () => {
      for (const complexity of COMPLEXITIES) {
        expect(isValidComplexity(complexity)).toBe(true);
      }
    });

    test("rejects invalid complexities", () => {
      expect(isValidComplexity("invalid")).toBe(false);
      expect(isValidComplexity(123)).toBe(false);
    });
  });

  describe("isValidUseCaseStatus", () => {
    test("accepts valid statuses", () => {
      for (const status of USE_CASE_STATUSES) {
        expect(isValidUseCaseStatus(status)).toBe(true);
      }
    });

    test("rejects invalid statuses", () => {
      expect(isValidUseCaseStatus("invalid")).toBe(false);
      expect(isValidUseCaseStatus(123)).toBe(false);
    });
  });

  describe("isValidUseCaseDifficulty", () => {
    test("accepts valid difficulties", () => {
      for (const difficulty of USE_CASE_DIFFICULTIES) {
        expect(isValidUseCaseDifficulty(difficulty)).toBe(true);
      }
    });

    test("rejects invalid difficulties", () => {
      expect(isValidUseCaseDifficulty("invalid")).toBe(false);
      expect(isValidUseCaseDifficulty(123)).toBe(false);
    });
  });

  describe("isNonEmptyString", () => {
    test("accepts non-empty strings", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString("a")).toBe(true);
      expect(isNonEmptyString(" a ")).toBe(true);
    });

    test("rejects empty strings and non-strings", () => {
      expect(isNonEmptyString("")).toBe(false);
      expect(isNonEmptyString("   ")).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe("isNumber", () => {
    test("accepts valid numbers", () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-45.6)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
    });

    test("rejects non-numbers and NaN", () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe("isOptionalNumber", () => {
    test("accepts numbers and undefined", () => {
      expect(isOptionalNumber(123)).toBe(true);
      expect(isOptionalNumber(undefined)).toBe(true);
    });

    test("rejects non-numbers", () => {
      expect(isOptionalNumber("123")).toBe(false);
      expect(isOptionalNumber(null)).toBe(false);
    });
  });

  describe("isOptionalString", () => {
    test("accepts strings and undefined", () => {
      expect(isOptionalString("hello")).toBe(true);
      expect(isOptionalString("")).toBe(true);
      expect(isOptionalString(undefined)).toBe(true);
    });

    test("rejects non-strings", () => {
      expect(isOptionalString(123)).toBe(false);
      expect(isOptionalString(null)).toBe(false);
    });
  });
});

describe("Value Item Validation", () => {
  describe("validateValueItemCreate", () => {
    test("accepts valid value item", () => {
      const errors = validateValueItemCreate({
        category: "time_savings",
        name: "Test Item",
        quantity: 10,
        unitValue: 100,
      });
      expect(errors).toEqual([]);
    });

    test("accepts value item with all optional fields", () => {
      const errors = validateValueItemCreate({
        category: "revenue_impact",
        name: "Full Item",
        quantity: 5,
        unitValue: 200,
        rate: 0.1,
        rateTier: "engineering",
        complexity: "medium",
        description: "A description",
        notes: "Some notes",
      });
      expect(errors).toEqual([]);
    });

    test("rejects missing required fields", () => {
      const errors = validateValueItemCreate({});
      expect(errors.length).toBe(4); // category, name, quantity, unitValue
      expect(errors.map((e) => e.field)).toContain("category");
      expect(errors.map((e) => e.field)).toContain("name");
      expect(errors.map((e) => e.field)).toContain("quantity");
      expect(errors.map((e) => e.field)).toContain("unitValue");
    });

    test("rejects invalid category", () => {
      const errors = validateValueItemCreate({
        category: "invalid",
        name: "Test",
        quantity: 10,
        unitValue: 100,
      });
      expect(errors.length).toBe(1);
      expect(errors[0]!.field).toBe("category");
    });

    test("rejects invalid optional fields", () => {
      const errors = validateValueItemCreate({
        category: "time_savings",
        name: "Test",
        quantity: 10,
        unitValue: 100,
        rate: "not a number",
        rateTier: "invalid",
        complexity: "invalid",
      });
      expect(errors.length).toBe(3);
      expect(errors.map((e) => e.field)).toContain("rate");
      expect(errors.map((e) => e.field)).toContain("rateTier");
      expect(errors.map((e) => e.field)).toContain("complexity");
    });
  });

  describe("validateValueItemUpdate", () => {
    test("accepts empty update (no changes)", () => {
      const errors = validateValueItemUpdate({});
      expect(errors).toEqual([]);
    });

    test("accepts partial update", () => {
      const errors = validateValueItemUpdate({
        name: "Updated Name",
        quantity: 20,
      });
      expect(errors).toEqual([]);
    });

    test("rejects invalid values in update", () => {
      const errors = validateValueItemUpdate({
        name: "",
        quantity: "not a number",
      });
      expect(errors.length).toBe(2);
    });
  });
});

describe("Use Case Validation", () => {
  describe("validateUseCaseCreate", () => {
    test("accepts valid use case with metrics", () => {
      const errors = validateUseCaseCreate({
        name: "Test Use Case",
        status: "identified",
        difficulty: "low",
        metrics: [{ name: "Metric 1" }],
      });
      expect(errors).toEqual([]);
    });

    test("accepts valid use case with valueItems", () => {
      const errors = validateUseCaseCreate({
        name: "Test Use Case",
        status: "identified",
        difficulty: "low",
        valueItems: [
          {
            category: "time_savings",
            name: "Test Item",
            quantity: 10,
            unitValue: 100,
          },
        ],
      });
      expect(errors).toEqual([]);
    });

    test("accepts use case with all optional fields", () => {
      const errors = validateUseCaseCreate({
        name: "Full Use Case",
        status: "deployed",
        difficulty: "high",
        department: "Engineering",
        description: "A description",
        notes: "Some notes",
        metrics: [
          { name: "Metric 1", before: "10", after: "20", improvement: "100%" },
          { name: "Metric 2" },
        ],
      });
      expect(errors).toEqual([]);
    });

    test("rejects missing required fields", () => {
      const errors = validateUseCaseCreate({});
      expect(errors.length).toBe(4); // name, status, difficulty, metrics (no metric or value item)
      expect(errors.map((e) => e.field)).toContain("name");
      expect(errors.map((e) => e.field)).toContain("status");
      expect(errors.map((e) => e.field)).toContain("difficulty");
      expect(errors.map((e) => e.field)).toContain("metrics");
    });

    test("rejects use case without metrics or valueItems", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
      });
      expect(errors.length).toBe(1);
      expect(errors[0]!.field).toBe("metrics");
      expect(errors[0]!.message).toContain("at least one metric or one value item");
    });

    test("rejects invalid status and difficulty", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "invalid",
        difficulty: "invalid",
        metrics: [{ name: "Valid Metric" }],
      });
      expect(errors.length).toBe(2);
      expect(errors.map((e) => e.field)).toContain("status");
      expect(errors.map((e) => e.field)).toContain("difficulty");
    });

    test("rejects invalid metrics", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
        metrics: [{ name: "" }], // name must be non-empty
      });
      expect(errors.length).toBe(2); // invalid metrics format + no valid metrics/valueItems
      expect(errors.map((e) => e.field)).toContain("metrics");
    });

    test("rejects non-array metrics", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
        metrics: "not an array",
      });
      expect(errors.length).toBe(2); // invalid metrics format + no valid metrics/valueItems
      expect(errors.map((e) => e.field)).toContain("metrics");
    });

    test("validates inline valueItems", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
        valueItems: [
          {
            category: "invalid_category",
            name: "",
            quantity: "not a number",
            unitValue: 100,
          },
        ],
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field.startsWith("valueItems[0]"))).toBe(true);
    });

    test("rejects non-array valueItems", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
        valueItems: "not an array",
      });
      expect(errors.some((e) => e.field === "valueItems")).toBe(true);
    });

    test("accepts existing value item reference (shortId only)", () => {
      const errors = validateUseCaseCreate({
        name: "Test Use Case",
        status: "identified",
        difficulty: "low",
        valueItems: [{ shortId: "abc123" }],
      });
      expect(errors).toEqual([]);
    });

    test("accepts mix of new and existing value items", () => {
      const errors = validateUseCaseCreate({
        name: "Test Use Case",
        status: "identified",
        difficulty: "low",
        valueItems: [
          { shortId: "abc123" }, // existing item
          {
            // new item
            category: "time_savings",
            name: "New Item",
            quantity: 5,
            unitValue: 50,
          },
        ],
      });
      expect(errors).toEqual([]);
    });

    test("rejects valueItem without shortId or category", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
        valueItems: [{ name: "Invalid" }],
      });
      expect(errors.some((e) => e.field === "valueItems[0]")).toBe(true);
      expect(errors.some((e) => e.message.includes("shortId") && e.message.includes("category"))).toBe(
        true
      );
    });

    test("rejects empty shortId", () => {
      const errors = validateUseCaseCreate({
        name: "Test",
        status: "identified",
        difficulty: "low",
        valueItems: [{ shortId: "" }],
      });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateUseCaseUpdate", () => {
    test("accepts empty update", () => {
      const errors = validateUseCaseUpdate({});
      expect(errors).toEqual([]);
    });

    test("accepts partial update", () => {
      const errors = validateUseCaseUpdate({
        name: "Updated Name",
        status: "in_progress",
      });
      expect(errors).toEqual([]);
    });

    test("rejects invalid values in update", () => {
      const errors = validateUseCaseUpdate({
        name: "",
        status: "invalid",
      });
      expect(errors.length).toBe(2);
    });
  });
});

describe("Assumptions Validation", () => {
  describe("validateAssumptions", () => {
    test("accepts valid assumptions", () => {
      const errors = validateAssumptions({
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
      });
      expect(errors).toEqual([]);
    });

    test("accepts partial assumptions", () => {
      const errors = validateAssumptions({
        projectionYears: 5,
      });
      expect(errors).toEqual([]);
    });

    test("accepts empty assumptions (for merging)", () => {
      const errors = validateAssumptions({});
      expect(errors).toEqual([]);
    });

    test("rejects invalid hourlyRates", () => {
      const errors = validateAssumptions({
        hourlyRates: {
          basic: "not a number",
          operations: 50,
          engineering: 100,
          executive: 200,
        },
      });
      expect(errors.length).toBe(1);
      expect(errors[0]!.field).toBe("hourlyRates.basic");
    });

    test("rejects missing hourlyRates fields", () => {
      const errors = validateAssumptions({
        hourlyRates: {
          basic: 25,
          // missing other fields
        },
      });
      expect(errors.length).toBe(3); // operations, engineering, executive missing
    });

    test("rejects invalid taskMinutes", () => {
      const errors = validateAssumptions({
        taskMinutes: {
          simple: 2,
          medium: "not a number",
          complex: 20,
        },
      });
      expect(errors.length).toBe(1);
      expect(errors[0]!.field).toBe("taskMinutes.medium");
    });

    test("rejects invalid realizationRamp", () => {
      const errors = validateAssumptions({
        realizationRamp: [0.5, "not a number", 1],
      });
      expect(errors.length).toBe(1);
      expect(errors[0]!.field).toBe("realizationRamp");
    });

    test("rejects non-array realizationRamp", () => {
      const errors = validateAssumptions({
        realizationRamp: "not an array",
      });
      expect(errors.length).toBe(1);
      expect(errors[0]!.field).toBe("realizationRamp");
    });

    test("rejects invalid numeric fields", () => {
      const errors = validateAssumptions({
        projectionYears: "not a number",
        annualGrowthRate: "not a number",
        avgDataBreachCost: "not a number",
        avgSupportTicketCost: "not a number",
      });
      expect(errors.length).toBe(4);
    });
  });
});
