import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { USE_CASE_STATUS_INFO } from "../types/roi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UseCaseCard } from "./UseCaseCard";
import { calculateItemAnnualValue } from "../utils/calculations";
import { formatCurrencyCompact } from "../utils/formatting";

interface UseCasesTabProps {
  calculation: { _id: any; companyId?: Id<"companies">; useCaseIds?: Id<"useCases">[] };
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
  const addToCalculation = useMutation(api.useCases.addToCalculation);
  const removeFromCalculation = useMutation(api.useCases.removeFromCalculation);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Fetch all company use cases when company exists
  const companyUseCases = useQuery(
    api.useCases.listByCompany,
    calculation.companyId ? { companyId: calculation.companyId } : "skip"
  );

  // Sort use cases by order
  const sortedUseCases = [...useCases].sort((a: any, b: any) => a.order - b.order);

  // Count use cases by status
  const statusCounts = useCases.reduce((acc: Record<string, number>, uc: any) => {
    acc[uc.status] = (acc[uc.status] || 0) + 1;
    return acc;
  }, {});

  // Use cases in this calculation (by ID)
  const currentUseCaseIds = new Set(
    useCases.map((uc: any) => uc._id as string)
  );

  // Company use cases NOT in this calculator
  const importableUseCases = (companyUseCases ?? []).filter(
    (uc: any) => !currentUseCaseIds.has(uc._id)
  );

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

  const handleImportUseCase = async (useCaseId: Id<"useCases">) => {
    await addToCalculation({
      calculationId: calculation._id,
      useCaseId,
    });
  };

  const handleRemoveFromCalculation = async (useCaseId: Id<"useCases">) => {
    if (confirm("Remove this use case from this calculator? It will remain available in other calculators.")) {
      await removeFromCalculation({
        calculationId: calculation._id,
        useCaseId,
      });
    }
  };

  const handleToggleExpand = (useCaseId: string) => {
    setExpandedId(expandedId === useCaseId ? null : useCaseId);
  };

  // Check if a use case is shared (referenced by this calc but created in another)
  const isSharedUseCase = (useCase: any) => {
    return useCase.calculationId !== calculation._id;
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
              <div className="flex gap-2 justify-center">
                <Button onClick={handleAddUseCase}>+ Add Use Case</Button>
                {importableUseCases.length > 0 && (
                  <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                    Import from Company
                  </Button>
                )}
              </div>
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
              isShared={isSharedUseCase(useCase)}
              onRemoveFromCalculation={() => handleRemoveFromCalculation(useCase._id)}
            />
          ))}

          {/* Add/Import buttons at the bottom */}
          {!readOnly && (
            <div className="flex gap-2">
              <Button
                onClick={handleAddUseCase}
                variant="outline"
                className="flex-1"
              >
                + Add Use Case
              </Button>
              {importableUseCases.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                >
                  Import from Company ({importableUseCases.length})
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          importableUseCases={importableUseCases}
          allValueItems={valueItems}
          companyUseCases={companyUseCases ?? []}
          onImport={handleImportUseCase}
          onClose={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
}

// Import dialog component
function ImportDialog({
  importableUseCases,
  allValueItems,
  companyUseCases,
  onImport,
  onClose,
}: {
  importableUseCases: any[];
  allValueItems: any[];
  companyUseCases: any[];
  onImport: (useCaseId: Id<"useCases">) => Promise<void>;
  onClose: () => void;
}) {
  const [importing, setImporting] = useState<string | null>(null);

  const handleImport = async (useCaseId: Id<"useCases">) => {
    setImporting(useCaseId);
    try {
      await onImport(useCaseId);
    } finally {
      setImporting(null);
    }
  };

  // Get value items for a specific use case (across all calculators)
  const getUseCaseValueItems = (useCaseId: string) => {
    return allValueItems.filter((vi: any) => vi.useCaseId === useCaseId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Import Use Cases from Company</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add existing use cases to this calculator. Changes to shared use cases apply everywhere.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {importableUseCases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              All company use cases are already in this calculator.
            </p>
          ) : (
            importableUseCases.map((uc: any) => {
              const linkedItems = getUseCaseValueItems(uc._id);
              const totalValue = linkedItems.reduce(
                (sum: number, item: any) => sum + calculateItemAnnualValue(item),
                0
              );
              const statusInfo = USE_CASE_STATUS_INFO[uc.status as keyof typeof USE_CASE_STATUS_INFO] ?? USE_CASE_STATUS_INFO.identified;
              const isImporting = importing === uc._id;

              return (
                <div
                  key={uc._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{uc.name}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                        style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {uc.department && <span className="capitalize">{uc.department}</span>}
                      <span>{linkedItems.length} value items</span>
                      {totalValue > 0 && (
                        <span className="font-medium text-foreground">
                          {formatCurrencyCompact(totalValue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleImport(uc._id)}
                    disabled={isImporting}
                  >
                    {isImporting ? "Adding..." : "Add"}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
