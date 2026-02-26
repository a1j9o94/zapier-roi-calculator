import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateSummary,
  calculateItemAnnualValue,
  getDimensionBreakdown,
} from "../utils/calculations";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
} from "../utils/formatting";
import {
  DIMENSION_INFO,
  DIMENSION_ORDER,
  ARCHETYPE_DIMENSION,
} from "../types/roi";
import type { Dimension, ValueItem, Calculation, UseCase } from "../types/roi";

interface SlideViewProps {
  calculation: Calculation;
  valueItems: ValueItem[];
  useCases: UseCase[];
}

export function SlideView({ calculation, valueItems, useCases }: SlideViewProps) {
  const summary = useMemo(
    () =>
      calculateSummary(
        valueItems,
        calculation.assumptions,
        calculation.proposedSpend
      ),
    [valueItems, calculation]
  );

  const dimensionBreakdown = useMemo(
    () => getDimensionBreakdown(valueItems),
    [valueItems]
  );

  const maxDimensionValue = dimensionBreakdown[0]?.total ?? 0;

  // Count use cases per dimension based on linked value items
  const dimensionUseCaseCounts = useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    for (const item of valueItems) {
      const dim = item.dimension || ARCHETYPE_DIMENSION[item.archetype];
      if (!dim) continue;
      if (!counts[dim]) counts[dim] = new Set();
      if (item.useCaseId) counts[dim].add(String(item.useCaseId));
    }
    const result: Record<string, number> = {};
    for (const [dim, set] of Object.entries(counts)) {
      result[dim] = set.size;
    }
    return result;
  }, [valueItems]);

  // Determine dimension display order
  const orderedDimensions: Dimension[] =
    calculation.priorityOrder ?? DIMENSION_ORDER;

  // Dimension cards filtered to non-zero
  const dimensionCards = orderedDimensions
    .map((dim) => {
      const info = DIMENSION_INFO[dim];
      const breakdown = dimensionBreakdown.find((d) => d.dimension === dim);
      return breakdown && breakdown.total > 0
        ? { dim, info, breakdown }
        : null;
    })
    .filter(Boolean) as Array<{
    dim: Dimension;
    info: (typeof DIMENSION_INFO)[Dimension];
    breakdown: (typeof dimensionBreakdown)[number];
  }>;

  return (
    <div className="space-y-8">
      {/* Hero KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Total Estimated Value
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(summary.totalAnnualValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              across {dimensionBreakdown.length} dimension
              {dimensionBreakdown.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">ROI Multiple</p>
            <p className="text-3xl font-bold tracking-tight">
              {summary.roiMultiple != null
                ? `${summary.roiMultiple.toFixed(1)}x`
                : "--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              return on investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Hours Saved / Month
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {formatNumber(Math.round(summary.hoursSavedPerMonth))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.fteEquivalent.toFixed(1)} FTE equivalent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dimension bar chart */}
      {dimensionBreakdown.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-4">Value by Dimension</h3>
            <div className="space-y-3">
              {dimensionBreakdown.map((d) => {
                const widthPct =
                  maxDimensionValue > 0
                    ? (d.total / maxDimensionValue) * 100
                    : 0;
                return (
                  <div key={d.dimension} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-muted-foreground">
                        {formatCurrencyCompact(d.total)}
                      </span>
                    </div>
                    <div className="h-6 w-full bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{
                          width: `${Math.max(widthPct, 2)}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dimension card grid */}
      {dimensionCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensionCards.map(({ dim, info, breakdown }) => (
            <Card key={dim}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <h4 className="font-semibold text-sm">{info.label}</h4>
                </div>
                <p className="text-2xl font-bold tracking-tight mb-1">
                  {formatCurrencyCompact(breakdown.total)}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {breakdown.itemCount} value item
                    {breakdown.itemCount !== 1 ? "s" : ""}
                  </span>
                  {(dimensionUseCaseCounts[dim] ?? 0) > 0 && (
                    <span>
                      {dimensionUseCaseCounts[dim]} use case
                      {dimensionUseCaseCounts[dim] !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
