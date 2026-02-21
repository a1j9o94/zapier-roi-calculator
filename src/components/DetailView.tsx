import { useMemo, useState } from "react";
import { calculateItemAnnualValue, getDimensionBreakdown } from "../utils/calculations";
import { formatCurrencyCompact } from "../utils/formatting";
import { DIMENSION_INFO, DIMENSION_ORDER, ARCHETYPE_DIMENSION } from "../types/roi";
import type { Dimension, ValueItem, Calculation, UseCase } from "../types/roi";
import { UseCaseCard } from "./UseCaseCard";

interface DetailViewProps {
  calculation: Calculation;
  valueItems: ValueItem[];
  useCases: UseCase[];
  onUseCaseChange?: () => void;
}

export function DetailView({ calculation, valueItems, useCases, onUseCaseChange }: DetailViewProps) {
  const [activeDimension, setActiveDimension] = useState<Dimension | "all">("all");
  const [expandedUseCaseId, setExpandedUseCaseId] = useState<string | null>(null);

  const dimensionBreakdown = useMemo(() => getDimensionBreakdown(valueItems), [valueItems]);

  // Group use cases by dimension (based on their linked value items)
  const useCasesByDimension = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const item of valueItems) {
      const dim = item.dimension || ARCHETYPE_DIMENSION[item.archetype];
      if (!dim || !item.useCaseId) continue;
      if (!map[dim]) map[dim] = new Set();
      map[dim].add(String(item.useCaseId));
    }

    // Also include use cases with no linked value items under "unassigned"
    const linkedIds = new Set(valueItems.filter((i) => i.useCaseId).map((i) => String(i.useCaseId)));
    const unlinked = useCases.filter((uc) => !linkedIds.has(String(uc._id)));

    return { byDimension: map, unlinked };
  }, [valueItems, useCases]);

  // Count use cases per dimension for sidebar badges
  const dimensionUseCaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [dim, set] of Object.entries(useCasesByDimension.byDimension)) {
      counts[dim] = set.size;
    }
    return counts;
  }, [useCasesByDimension]);

  // Determine display order
  const orderedDimensions: Dimension[] = calculation.priorityOrder ?? DIMENSION_ORDER;

  // Filter dimensions for display
  const visibleDimensions = activeDimension === "all"
    ? orderedDimensions.filter((d) => dimensionBreakdown.some((b) => b.dimension === d))
    : [activeDimension];

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <div className="w-56 shrink-0 space-y-1 sticky top-4 self-start">
        <button
          onClick={() => setActiveDimension("all")}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeDimension === "all"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          All Dimensions
        </button>
        {orderedDimensions.map((dim) => {
          const info = DIMENSION_INFO[dim];
          const count = dimensionUseCaseCounts[dim] ?? 0;
          const breakdown = dimensionBreakdown.find((d) => d.dimension === dim);
          if (!breakdown || breakdown.total === 0) return null;

          return (
            <button
              key={dim}
              onClick={() => setActiveDimension(dim)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                activeDimension === dim
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: info.color }}
              />
              <span className="flex-1 truncate">{info.shortLabel}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeDimension === dim
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-8">
        {visibleDimensions.map((dim) => {
          const info = DIMENSION_INFO[dim];
          const breakdown = dimensionBreakdown.find((d) => d.dimension === dim);
          if (!breakdown) return null;

          const ucIds = useCasesByDimension.byDimension[dim] ?? new Set<string>();
          const dimUseCases = useCases.filter((uc) => ucIds.has(String(uc._id)));

          return (
            <div key={dim}>
              {/* Dimension header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <h3 className="font-semibold text-lg">{info.label}</h3>
                <span className="text-sm text-muted-foreground ml-auto">
                  {formatCurrencyCompact(breakdown.total)} &middot;{" "}
                  {breakdown.itemCount} item{breakdown.itemCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Use case cards */}
              {dimUseCases.length > 0 ? (
                <div className="space-y-3">
                  {dimUseCases.map((uc) => (
                    <UseCaseCard
                      key={String(uc._id)}
                      useCase={uc}
                      valueItems={valueItems}
                      isExpanded={expandedUseCaseId === String(uc._id)}
                      onToggleExpand={() =>
                        setExpandedUseCaseId(
                          expandedUseCaseId === String(uc._id)
                            ? null
                            : String(uc._id)
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  No use cases linked to this dimension yet.
                </p>
              )}
            </div>
          );
        })}

        {/* Unlinked use cases */}
        {activeDimension === "all" && useCasesByDimension.unlinked.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full shrink-0 bg-muted-foreground/30" />
              <h3 className="font-semibold text-lg text-muted-foreground">
                Unlinked Use Cases
              </h3>
            </div>
            <div className="space-y-3">
              {useCasesByDimension.unlinked.map((uc) => (
                <UseCaseCard
                  key={String(uc._id)}
                  useCase={uc}
                  valueItems={valueItems}
                  isExpanded={expandedUseCaseId === String(uc._id)}
                  onToggleExpand={() =>
                    setExpandedUseCaseId(
                      expandedUseCaseId === String(uc._id)
                        ? null
                        : String(uc._id)
                    )
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
