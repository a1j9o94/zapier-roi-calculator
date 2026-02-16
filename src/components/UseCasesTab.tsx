import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem, UseCase } from "../types/roi";
import { calculateItemAnnualValue, calculateTotalAnnualValue } from "../utils/calculations";
import { formatCurrency } from "../utils/formatting";
import { USE_CASE_STATUS_INFO } from "../types/roi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UseCaseCard } from "./UseCaseCard";

interface UseCasesTabProps {
  calculation: Calculation;
  valueItems: ValueItem[];
  readOnly?: boolean;
  onNavigateToValueItem?: (valueItemId: string) => void;
}

export function UseCasesTab({
  calculation,
  valueItems,
  readOnly = false,
  onNavigateToValueItem,
}: UseCasesTabProps) {
  const useCases = useQuery(api.useCases.listByCalculation, {
    calculationId: calculation._id,
  });
  const createUseCase = useMutation(api.useCases.create);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (useCases === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading use cases...</p>
      </div>
    );
  }

  // Sort use cases by order
  const sortedUseCases = [...useCases].sort((a, b) => a.order - b.order);

  // Calculate total value from all linked value items
  const linkedValueItemIds = new Set<string>();
  for (const useCase of useCases) {
    for (const item of valueItems) {
      if (item.useCaseId === useCase._id) {
        linkedValueItemIds.add(item._id);
      }
    }
  }
  const linkedTotalValue = valueItems
    .filter((item) => linkedValueItemIds.has(item._id))
    .reduce(
      (sum, item) => sum + calculateItemAnnualValue(item, calculation.assumptions),
      0
    );

  // Count use cases by status
  const statusCounts = useCases.reduce((acc, uc) => {
    acc[uc.status] = (acc[uc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAddUseCase = async () => {
    // Find the first unlinked value item to satisfy the "at least one metric or value item" requirement
    const unlinkedItem = valueItems.find(
      (item) => !item.useCaseId && item.shortId
    );

    const newId = await createUseCase({
      calculationId: calculation._id,
      name: "New Use Case",
      status: "identified",
      difficulty: "medium",
      ...(unlinkedItem
        ? { valueItems: [{ shortId: unlinkedItem.shortId }] }
        : { metrics: [{ name: "New Metric" }] }),
    });
    setExpandedId(newId);
  };

  const handleToggleExpand = (useCaseId: string) => {
    setExpandedId(expandedId === useCaseId ? null : useCaseId);
  };

  // Expand a specific use case (used for cross-navigation)
  const expandUseCase = (useCaseId: string) => {
    setExpandedId(useCaseId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Summary Banner */}
      <Card className="bg-gradient-to-r from-[#FF4A00] to-[#FF6B33] text-white">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Use Cases with Linked Value
              </p>
              <p className="text-4xl font-bold font-mono">
                {formatCurrency(linkedTotalValue)}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Status summary pills */}
              {(["deployed", "in_progress", "identified", "future"] as const).map(
                (status) => {
                  const count = statusCounts[status] || 0;
                  if (count === 0) return null;
                  const info = USE_CASE_STATUS_INFO[status];
                  return (
                    <div
                      key={status}
                      className="px-3 py-1 rounded-full bg-white/20 text-white text-sm"
                    >
                      {count} {info.label}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Case Cards */}
      {sortedUseCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No use cases yet. Add use cases to document your automation opportunities.
            </p>
            {!readOnly && (
              <Button onClick={handleAddUseCase}>+ Add Use Case</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedUseCases.map((useCase) => {
            const linkedItems = valueItems.filter(
              (item) => item.useCaseId === useCase._id
            );
            return (
              <UseCaseCard
                key={useCase._id}
                useCase={useCase as UseCase}
                linkedValueItems={linkedItems}
                allValueItems={valueItems}
                assumptions={calculation.assumptions}
                readOnly={readOnly}
                isExpanded={expandedId === useCase._id}
                onToggleExpand={() => handleToggleExpand(useCase._id)}
                onNavigateToValueItem={onNavigateToValueItem}
              />
            );
          })}

          {/* Add button at the bottom */}
          {!readOnly && (
            <Button
              onClick={handleAddUseCase}
              variant="outline"
              className="w-full"
            >
              + Add Use Case
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
