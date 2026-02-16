import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  UseCase,
  UseCaseStatus,
  UseCaseDifficulty,
  UseCaseMetric,
  ValueItem,
  Calculation,
} from "../types/roi";
import {
  USE_CASE_STATUS_INFO,
  USE_CASE_DIFFICULTY_INFO,
} from "../types/roi";
import { calculateItemAnnualValue } from "../utils/calculations";
import { formatCurrency } from "../utils/formatting";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { DebouncedTextarea } from "@/components/ui/debounced-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface UseCaseCardProps {
  useCase: UseCase;
  linkedValueItems: ValueItem[];
  allValueItems: ValueItem[];
  assumptions: Calculation["assumptions"];
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggleExpand: () => void;
  onNavigateToValueItem?: (valueItemId: string) => void;
}

export function UseCaseCard({
  useCase,
  linkedValueItems,
  allValueItems,
  assumptions,
  readOnly = false,
  isExpanded = false,
  onToggleExpand,
  onNavigateToValueItem,
}: UseCaseCardProps) {
  const updateUseCase = useMutation(api.useCases.update);
  const deleteUseCase = useMutation(api.useCases.remove);
  const updateValueItem = useMutation(api.valueItems.update);
  const unlinkValueItem = useMutation(api.valueItems.unlinkUseCase);

  const [isLinking, setIsLinking] = useState(false);

  // Calculate total annual value from linked value items
  const totalAnnualValue = linkedValueItems.reduce(
    (sum, item) => sum + calculateItemAnnualValue(item, assumptions),
    0
  );

  const statusInfo = USE_CASE_STATUS_INFO[useCase.status];
  const difficultyInfo = USE_CASE_DIFFICULTY_INFO[useCase.difficulty];

  // Get value items that are not linked to any use case (available for linking)
  const availableForLinking = allValueItems.filter(
    (item) => !item.useCaseId || item.useCaseId === useCase._id
  );
  const unlinkedItems = availableForLinking.filter(
    (item) => item.useCaseId !== useCase._id
  );

  const handleUpdate = (field: string, value: unknown) => {
    updateUseCase({
      id: useCase._id,
      [field]: value,
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this use case? Linked value items will be unlinked.")) {
      deleteUseCase({ id: useCase._id });
    }
  };

  const handleLinkValueItem = (valueItemId: string) => {
    updateValueItem({
      id: valueItemId as any,
      useCaseId: useCase._id,
    });
    setIsLinking(false);
  };

  const handleUnlinkValueItem = (valueItemId: string) => {
    unlinkValueItem({ id: valueItemId as any });
  };

  const handleAddMetric = () => {
    const newMetrics: UseCaseMetric[] = [
      ...(useCase.metrics || []),
      { name: "", before: "", after: "", improvement: "" },
    ];
    handleUpdate("metrics", newMetrics);
  };

  const handleUpdateMetric = (
    index: number,
    field: keyof UseCaseMetric,
    value: string
  ) => {
    const newMetrics = [...(useCase.metrics || [])];
    const currentMetric = newMetrics[index];
    newMetrics[index] = {
      name: currentMetric?.name ?? "",
      before: currentMetric?.before,
      after: currentMetric?.after,
      improvement: currentMetric?.improvement,
      [field]: value,
    };
    handleUpdate("metrics", newMetrics);
  };

  const handleRemoveMetric = (index: number) => {
    const newMetrics = (useCase.metrics || []).filter((_, i) => i !== index);
    handleUpdate("metrics", newMetrics);
  };

  // Summary of metrics for collapsed view
  const metricsSummary =
    useCase.metrics && useCase.metrics.length > 0
      ? useCase.metrics
          .filter((m) => m.name && (m.before || m.after))
          .slice(0, 2)
          .map((m) => {
            if (m.before && m.after) {
              return `${m.name}: ${m.before} → ${m.after}`;
            }
            return m.name;
          })
          .join(", ")
      : null;

  return (
    <Card className={`overflow-hidden ${isExpanded ? "ring-2 ring-[#FF4A00]/20" : ""}`}>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-4 overflow-hidden">
          {/* Left side: Status badge, name, department */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Status badge */}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: statusInfo.bgColor,
                  color: statusInfo.color,
                }}
              >
                {statusInfo.label}
              </span>

              {/* Department tag */}
              {useCase.department && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {useCase.department}
                </span>
              )}

              {/* Difficulty indicator */}
              <span
                className="text-xs font-medium"
                style={{ color: difficultyInfo.color }}
              >
                {difficultyInfo.label} difficulty
              </span>
            </div>

            {/* Name */}
            <h3 className="font-semibold text-lg truncate">{useCase.name}</h3>

            {/* Metrics summary */}
            {metricsSummary && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {metricsSummary}
              </p>
            )}
          </div>

          {/* Right side: Annual value and expand icon */}
          <div className="flex items-center gap-4 shrink-0">
            {totalAnnualValue > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Annual Value</p>
                <p className="font-mono font-semibold text-[#FF4A00]">
                  {formatCurrency(totalAnnualValue)}
                </p>
              </div>
            )}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Editable fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              {readOnly ? (
                <p className="text-sm py-2">{useCase.name}</p>
              ) : (
                <DebouncedInput
                  value={useCase.name}
                  onChange={(value) => handleUpdate("name", value)}
                  className="h-9"
                />
              )}
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Department
              </label>
              {readOnly ? (
                <p className="text-sm py-2">{useCase.department || "-"}</p>
              ) : (
                <DebouncedInput
                  value={useCase.department || ""}
                  onChange={(value) => handleUpdate("department", value || undefined)}
                  placeholder="e.g., Sales, Marketing, IT"
                  className="h-9"
                />
              )}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              {readOnly ? (
                <p className="text-sm py-2">{statusInfo.label}</p>
              ) : (
                <Select
                  value={useCase.status}
                  onValueChange={(value) =>
                    handleUpdate("status", value as UseCaseStatus)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="future">Future</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Difficulty
              </label>
              {readOnly ? (
                <p className="text-sm py-2">{difficultyInfo.label}</p>
              ) : (
                <Select
                  value={useCase.difficulty}
                  onValueChange={(value) =>
                    handleUpdate("difficulty", value as UseCaseDifficulty)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            {readOnly ? (
              <p className="text-sm py-2 whitespace-pre-wrap">
                {useCase.description || "-"}
              </p>
            ) : (
              <DebouncedTextarea
                value={useCase.description || ""}
                onChange={(value) => handleUpdate("description", value || undefined)}
                placeholder="Describe what this automation does..."
                className="min-h-[80px]"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Notes (methodology, assumptions)
            </label>
            {readOnly ? (
              <p className="text-sm py-2 whitespace-pre-wrap">
                {useCase.notes || "-"}
              </p>
            ) : (
              <DebouncedTextarea
                value={useCase.notes || ""}
                onChange={(value) => handleUpdate("notes", value || undefined)}
                placeholder="Any additional notes or context..."
                className="min-h-[60px]"
              />
            )}
          </div>

          {/* Custom Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Custom Metrics (non-financial value)
              </label>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddMetric}
                  className="h-7 text-xs"
                >
                  + Add Metric
                </Button>
              )}
            </div>
            {useCase.metrics && useCase.metrics.length > 0 ? (
              <div className="space-y-2">
                {useCase.metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center bg-muted/50 p-2 rounded-lg"
                  >
                    {readOnly ? (
                      <>
                        <div className="col-span-3 text-sm font-medium">
                          {metric.name || "-"}
                        </div>
                        <div className="col-span-3 text-sm font-mono">
                          {metric.before || "-"}
                        </div>
                        <div className="col-span-3 text-sm font-mono">
                          {metric.after || "-"}
                        </div>
                        <div className="col-span-3 text-sm font-mono text-[#FF4A00]">
                          {metric.improvement || "-"}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-3">
                          <DebouncedInput
                            value={metric.name}
                            onChange={(value) =>
                              handleUpdateMetric(index, "name", String(value))
                            }
                            placeholder="Metric name"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <DebouncedInput
                            value={metric.before || ""}
                            onChange={(value) =>
                              handleUpdateMetric(index, "before", String(value))
                            }
                            placeholder="Before"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <DebouncedInput
                            value={metric.after || ""}
                            onChange={(value) =>
                              handleUpdateMetric(index, "after", String(value))
                            }
                            placeholder="After"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <DebouncedInput
                            value={metric.improvement || ""}
                            onChange={(value) =>
                              handleUpdateMetric(index, "improvement", String(value))
                            }
                            placeholder="+X%"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMetric(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="w-4 h-4"
                            >
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {/* Metric column headers */}
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Before</div>
                  <div className="col-span-3">After</div>
                  <div className="col-span-2">Improvement</div>
                  <div className="col-span-1"></div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No custom metrics added yet
              </p>
            )}
          </div>

          {/* Linked Value Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Linked Value Items ({linkedValueItems.length})
              </label>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLinking(!isLinking)}
                  className="h-7 text-xs"
                  disabled={unlinkedItems.length === 0 && !isLinking}
                >
                  {isLinking ? "Cancel" : "+ Link Item"}
                </Button>
              )}
            </div>

            {/* Linking dropdown */}
            {isLinking && (
              <Select onValueChange={handleLinkValueItem}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={unlinkedItems.length === 0 ? "No value items available" : "Select a value item to link..."} />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedItems.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Add value items in the Value Items tab first
                    </SelectItem>
                  ) : (
                    unlinkedItems.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.name} ({formatCurrency(calculateItemAnnualValue(item, assumptions))})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Linked items list */}
            {linkedValueItems.length > 0 ? (
              <div className="space-y-1">
                {linkedValueItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg group"
                  >
                    <button
                      onClick={() => onNavigateToValueItem?.(item._id)}
                      className="text-sm text-left hover:text-[#FF4A00] transition-colors flex-1 truncate"
                    >
                      {item.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-[#FF4A00]">
                        {formatCurrency(calculateItemAnnualValue(item, assumptions))}
                      </span>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkValueItem(item._id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-3 h-3"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No value items linked. Link items to calculate financial ROI.
              </p>
            )}
          </div>

          {/* Delete button */}
          {!readOnly && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Delete Use Case
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
