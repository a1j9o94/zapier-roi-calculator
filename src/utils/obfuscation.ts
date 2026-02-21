/**
 * Obfuscation utilities for ROI Calculator V2.
 * Transforms real calculation data into anonymized versions for sharing/demo purposes.
 */

/**
 * Round a monetary value to contextually appropriate significant figures.
 * - < $1,000: nearest $100
 * - $1,000 - $10,000: nearest $1,000
 * - $10,000 - $100,000: nearest $5,000
 * - $100,000 - $1,000,000: nearest $25,000
 * - > $1,000,000: nearest $100,000
 */
export function obfuscateValue(value: number): number {
  const abs = Math.abs(value);
  const sign = value < 0 ? -1 : 1;

  let step: number;
  if (abs < 1_000) {
    step = 100;
  } else if (abs < 10_000) {
    step = 1_000;
  } else if (abs < 100_000) {
    step = 5_000;
  } else if (abs < 1_000_000) {
    step = 25_000;
  } else {
    step = 100_000;
  }

  return sign * Math.round(abs / step) * step;
}

/**
 * Replace a company name with a descriptor or generic label.
 */
export function obfuscateName(name: string, descriptor?: string): string {
  return descriptor ?? "Enterprise Customer";
}

/**
 * Obfuscate a full calculation object.
 * - Replace name with companyDescriptor or "Enterprise Customer"
 * - Round all monetary values
 * - Strip talking points if hideNotes is true
 */
export function obfuscateCalculation(
  calc: any,
  settings?: {
    companyDescriptor?: string;
    hideNotes?: boolean;
    roundValues?: boolean;
  }
): any {
  const { companyDescriptor, hideNotes = false, roundValues = true } = settings ?? {};
  const result = { ...calc };

  result.name = obfuscateName(calc.name, companyDescriptor);

  if (roundValues) {
    if (typeof result.proposedSpend === "number") {
      result.proposedSpend = obfuscateValue(result.proposedSpend);
    }
    if (typeof result.currentSpend === "number") {
      result.currentSpend = obfuscateValue(result.currentSpend);
    }
  }

  if (hideNotes) {
    delete result.talkingPoints;
    delete result.notes;
    delete result.internalNotes;
  }

  return result;
}

const DEPARTMENT_MAP = new Map<string, string>();
let departmentCounter = 0;

function anonymizeDepartment(dept: string): string {
  if (!DEPARTMENT_MAP.has(dept)) {
    departmentCounter++;
    DEPARTMENT_MAP.set(dept, `Department ${String.fromCharCode(64 + departmentCounter)}`);
  }
  return DEPARTMENT_MAP.get(dept)!;
}

/**
 * Obfuscate use cases.
 * - Strip descriptions if hideNotes
 * - Anonymize department names (e.g., "RevOps" -> "Department A")
 * - Round metric values
 */
export function obfuscateUseCases(
  cases: any[],
  settings?: {
    hideNotes?: boolean;
    roundValues?: boolean;
  }
): any[] {
  const { hideNotes = false, roundValues = true } = settings ?? {};

  // Reset department mapping for each call so results are deterministic per invocation
  DEPARTMENT_MAP.clear();
  departmentCounter = 0;

  return cases.map((uc) => {
    const result = { ...uc };

    if (result.department) {
      result.department = anonymizeDepartment(result.department);
    }

    if (hideNotes) {
      delete result.description;
      delete result.notes;
      delete result.talkingPoints;
    }

    if (roundValues && Array.isArray(result.metrics)) {
      result.metrics = result.metrics.map((m: any) => ({
        ...m,
        value: typeof m.value === "number" ? obfuscateValue(m.value) : m.value,
      }));
    }

    return result;
  });
}

/**
 * Obfuscate value items.
 * - Round all input values and computed values
 * - Strip source/confidence details
 * - Keep archetype and dimension info (those are generic)
 */
export function obfuscateValueItems(
  items: any[],
  settings?: {
    roundValues?: boolean;
  }
): any[] {
  const { roundValues = true } = settings ?? {};

  return items.map((item) => {
    const result = { ...item };

    if (roundValues) {
      if (typeof result.unitValue === "number") {
        result.unitValue = obfuscateValue(result.unitValue);
      }
      if (typeof result.annualValue === "number") {
        result.annualValue = obfuscateValue(result.annualValue);
      }
      if (typeof result.manualAnnualValue === "number") {
        result.manualAnnualValue = obfuscateValue(result.manualAnnualValue);
      }
    }

    delete result.source;
    delete result.confidence;
    delete result.confidenceNotes;

    return result;
  });
}

/**
 * Apply full obfuscation to a complete calculation response.
 */
export function obfuscateFullResponse(
  response: {
    calculation: any;
    valueItems: any[];
    useCases: any[];
    summary?: any;
  },
  settings?: {
    companyDescriptor?: string;
    hideNotes?: boolean;
    roundValues?: boolean;
  }
): typeof response {
  const result: typeof response = {
    calculation: obfuscateCalculation(response.calculation, settings),
    valueItems: obfuscateValueItems(response.valueItems, settings),
    useCases: obfuscateUseCases(response.useCases, settings),
  };

  if (response.summary) {
    const summary = { ...response.summary };

    if (settings?.roundValues !== false) {
      if (typeof summary.totalAnnualValue === "number") {
        summary.totalAnnualValue = obfuscateValue(summary.totalAnnualValue);
      }
      if (typeof summary.roiMultiple === "number") {
        summary.roiMultiple = Math.round(summary.roiMultiple * 10) / 10;
      }
      if (typeof summary.totalHoursSaved === "number") {
        summary.totalHoursSaved = Math.round(summary.totalHoursSaved / 10) * 10;
      }
    }

    result.summary = summary;
  }

  return result;
}
