// ============================================================
// Pattern Catalog — Index
// Re-exports all department patterns and provides lookup utilities
// ============================================================

import type { Archetype, Dimension } from "../../types/roi";
import type { Role } from "../../types/roi";

import { SALES_PATTERNS } from "./sales";
import { IT_PATTERNS } from "./it";
import { FINANCE_PATTERNS } from "./finance";
import { HR_PATTERNS } from "./hr";
import { ENGINEERING_PATTERNS } from "./engineering";
import { MARKETING_PATTERNS } from "./marketing";
import { OPERATIONS_PATTERNS } from "./operations";
import { SUPPORT_PATTERNS } from "./support";

// ============================================================
// Shared types
// ============================================================

export interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  archetype: Archetype;
  dimension: Dimension;
  defaultInputs: Record<string, number>;
  exampleScenario: string;
  commonApps: string[];
  tags: string[];
}

// ============================================================
// Aggregated catalog
// ============================================================

export const ALL_PATTERNS: PatternTemplate[] = [
  ...SALES_PATTERNS,
  ...IT_PATTERNS,
  ...FINANCE_PATTERNS,
  ...HR_PATTERNS,
  ...ENGINEERING_PATTERNS,
  ...MARKETING_PATTERNS,
  ...OPERATIONS_PATTERNS,
  ...SUPPORT_PATTERNS,
];

// ============================================================
// Lookup utilities
// ============================================================

/** Get all patterns for a given department/role */
export function getPatternsByRole(role: Role): PatternTemplate[] {
  const departmentMap: Record<Role, string[]> = {
    executive: ["sales", "finance", "operations", "marketing"],
    revops: ["sales", "marketing", "operations"],
    marketing: ["marketing"],
    sales_cs: ["sales", "support"],
    it: ["it", "engineering"],
    hr: ["hr"],
    finance: ["finance"],
    engineering: ["engineering", "it"],
    support: ["support"],
    supply_chain: ["operations"],
  };

  const departments = departmentMap[role] ?? [];
  return ALL_PATTERNS.filter((p) => departments.includes(p.department));
}

/** Get all patterns for a given archetype */
export function getPatternsByArchetype(archetype: Archetype): PatternTemplate[] {
  return ALL_PATTERNS.filter((p) => p.archetype === archetype);
}

/** Get all patterns for a given dimension */
export function getPatternsByDimension(dimension: Dimension): PatternTemplate[] {
  return ALL_PATTERNS.filter((p) => p.dimension === dimension);
}

/** Search patterns by name, description, or tags */
export function searchPatterns(query: string): PatternTemplate[] {
  const q = query.toLowerCase();
  return ALL_PATTERNS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

// Re-export department patterns
export { SALES_PATTERNS } from "./sales";
export { IT_PATTERNS } from "./it";
export { FINANCE_PATTERNS } from "./finance";
export { HR_PATTERNS } from "./hr";
export { ENGINEERING_PATTERNS } from "./engineering";
export { MARKETING_PATTERNS } from "./marketing";
export { OPERATIONS_PATTERNS } from "./operations";
export { SUPPORT_PATTERNS } from "./support";
