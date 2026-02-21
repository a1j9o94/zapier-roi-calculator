import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem } from "../types/roi";
import { USE_CASE_STATUS_INFO } from "../types/roi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UseCaseCard } from "./UseCaseCard";

interface UseCasesTabProps {
  calculation: { _id: any };
  valueItems: any[];
  useCases: any[];
  readOnly?: boolean;
}

export function UseCasesTab({
  calculation,
  valueItems,
  useCases,
  readOnly = false,
}: UseCasesTabProps) {
  const createUseCase = useMutation(api.useCases.create);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort use cases by order
  const sortedUseCases = [...useCases].sort((a: any, b: any) => a.order - b.order);

  // Count use cases by status
  const statusCounts = useCases.reduce((acc: Record<string, number>, uc: any) => {
    acc[uc.status] = (acc[uc.status] || 0) + 1;
    return acc;
  }, {});

  const handleAddUseCase = async () => {
    const result = await createUseCase({
      calculationId: calculation._id,
      name: "New Use Case",
      status: "identified",
      implementationEffort: "medium",
    });
    if (result?.id) {
      setExpandedId(result.id);
    }
  };

  const handleToggleExpand = (useCaseId: string) => {
    setExpandedId(expandedId === useCaseId ? null : useCaseId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Pipeline Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Pipeline:
        </span>
        {(["deployed", "in_progress", "identified", "future"] as const).map(
          (status) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            const info = USE_CASE_STATUS_INFO[status];
            return (
              <span
                key={status}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: info.bgColor, color: info.color }}
              >
                {count} {info.label}
              </span>
            );
          }
        )}
        {useCases.length === 0 && (
          <span className="text-sm text-muted-foreground">No use cases yet</span>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {useCases.length} total
        </span>
      </div>

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
          {sortedUseCases.map((useCase: any) => (
            <UseCaseCard
              key={useCase._id}
              useCase={useCase}
              valueItems={valueItems}
              readOnly={readOnly}
              isExpanded={expandedId === useCase._id}
              onToggleExpand={() => handleToggleExpand(useCase._id)}
            />
          ))}

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
