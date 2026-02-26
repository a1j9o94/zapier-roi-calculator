// ============================================================
// Package Deduplication
// Removes duplicate patterns when combining multiple value packages.
// ============================================================

import type { ValuePackagePattern } from "../data/value-packages";

// ============================================================
// Types
// ============================================================

export interface DedupResult {
  patterns: ValuePackagePattern[];
  totalBefore: number;
  duplicatesRemoved: number;
  totalAfter: number;
}

// ============================================================
// Dedup logic
// ============================================================

/**
 * Deduplicate patterns from combined value packages.
 *
 * Rules:
 * 1. Same patternId — keep first occurrence
 * 2. Same archetype + department (derived from patternId prefix) — keep higher estimatedAnnualValue
 */
export function deduplicatePatterns(
  patterns: ValuePackagePattern[],
): DedupResult {
  const totalBefore = patterns.length;

  // Pass 1: deduplicate by exact patternId
  const byPatternId = new Map<string, ValuePackagePattern>();
  for (const pattern of patterns) {
    if (!byPatternId.has(pattern.patternId)) {
      byPatternId.set(pattern.patternId, pattern);
    }
  }

  // Pass 2: deduplicate by archetype + department
  const byArchetypeDept = new Map<string, ValuePackagePattern>();
  for (const pattern of byPatternId.values()) {
    const dept = extractDepartment(pattern.patternId);
    const key = `${pattern.archetype}:${dept}`;

    const existing = byArchetypeDept.get(key);
    if (!existing || pattern.estimatedAnnualValue > existing.estimatedAnnualValue) {
      byArchetypeDept.set(key, pattern);
    }
  }

  const deduped = Array.from(byArchetypeDept.values());

  return {
    patterns: deduped,
    totalBefore,
    duplicatesRemoved: totalBefore - deduped.length,
    totalAfter: deduped.length,
  };
}

/**
 * Extract department prefix from a patternId.
 * E.g., "sales-lead-routing" -> "sales", "mktg-form-to-crm" -> "mktg"
 */
function extractDepartment(patternId: string): string {
  const firstDash = patternId.indexOf("-");
  if (firstDash === -1) return patternId;
  return patternId.substring(0, firstDash);
}
