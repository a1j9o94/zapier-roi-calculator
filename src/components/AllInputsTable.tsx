import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ValueItem, UseCase, ConfidenceTier } from "../types/roi";
import { normalizeConfidence } from "../types/roi";
import { ARCHETYPE_FIELDS } from "../types/archetypes";
import type { ArchetypeFieldDef } from "../types/archetypes";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface AllInputsTableProps {
  valueItems: ValueItem[];
  useCases: UseCase[];
  calculationId: Id<"calculations">;
  readOnly?: boolean;
}

const CONFIDENCE_BADGE: Record<ConfidenceTier, { label: string; color: string; bg: string; title: string }> = {
  A: { label: "A", color: "#059669", bg: "#D1FAE5", title: "Customer Provided" },
  B: { label: "B", color: "#2563EB", bg: "#DBEAFE", title: "Published Benchmark" },
  C: { label: "C", color: "#D97706", bg: "#FEF3C7", title: "Estimated" },
  D: { label: "D", color: "#6B7280", bg: "#F3F4F6", title: "Unsourced" },
};

const CONFIDENCE_OPTIONS: { value: ConfidenceTier; label: string }[] = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

interface GroupedItems {
  label: string;
  items: ValueItem[];
}

function groupByUseCase(valueItems: ValueItem[], useCases: UseCase[]): GroupedItems[] {
  const useCaseMap = new Map(useCases.map((uc) => [uc._id, uc]));
  const groups = new Map<string, { label: string; items: ValueItem[] }>();

  for (const item of valueItems) {
    const key = item.useCaseId ?? "__ungrouped__";
    if (!groups.has(key)) {
      const uc = item.useCaseId ? useCaseMap.get(item.useCaseId) : undefined;
      groups.set(key, { label: uc?.name ?? "Ungrouped", items: [] });
    }
    groups.get(key)!.items.push(item);
  }

  const result: GroupedItems[] = [];
  // Named use cases first, ungrouped last
  for (const [key, group] of groups) {
    if (key !== "__ungrouped__") result.push(group);
  }
  if (groups.has("__ungrouped__")) result.push(groups.get("__ungrouped__")!);
  return result;
}

export function AllInputsTable({
  valueItems,
  useCases,
  calculationId,
  readOnly = false,
}: AllInputsTableProps) {
  const updateItem = useMutation(api.valueItems.update);
  const groups = groupByUseCase(valueItems, useCases);

  if (valueItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Value Assumptions</CardTitle>
          <CardDescription>
            Every input that drives the calculation. Change any number — the model recalculates automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No value items yet. Add items from the Value Items tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleUpdateInput = (
    item: ValueItem,
    fieldKey: string,
    patch: Partial<{ value: number; confidence: ConfidenceTier; source: string }>
  ) => {
    const currentInputs = { ...(item.inputs ?? {}) };
    currentInputs[fieldKey] = { value: 0, confidence: "C" as const, ...currentInputs[fieldKey], ...patch };
    updateItem({ id: item._id, inputs: currentInputs });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader>
          <CardTitle>All Value Assumptions</CardTitle>
          <CardDescription>
            Every input that drives the calculation. Change any number — the model recalculates automatically.{" "}
            <Link to="/methodology" className="text-[#FF4A00] hover:underline">
              View methodology & sources →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Value Item</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Input</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground w-36">Value</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground w-16">Conf.</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <GroupSection
                    key={group.label}
                    group={group}
                    readOnly={readOnly}
                    onUpdateInput={handleUpdateInput}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function GroupSection({
  group,
  readOnly,
  onUpdateInput,
}: {
  group: GroupedItems;
  readOnly: boolean;
  onUpdateInput: (
    item: ValueItem,
    fieldKey: string,
    patch: Partial<{ value: number; confidence: ConfidenceTier; source: string }>
  ) => void;
}) {
  return (
    <>
      <tr className="border-b bg-muted/30">
        <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.label}
        </td>
      </tr>
      {group.items.map((item) => (
        <ItemRows
          key={item._id}
          item={item}
          readOnly={readOnly}
          onUpdateInput={onUpdateInput}
        />
      ))}
    </>
  );
}

function ItemRows({
  item,
  readOnly,
  onUpdateInput,
}: {
  item: ValueItem;
  readOnly: boolean;
  onUpdateInput: (
    item: ValueItem,
    fieldKey: string,
    patch: Partial<{ value: number; confidence: ConfidenceTier; source: string }>
  ) => void;
}) {
  const fields = ARCHETYPE_FIELDS[item.archetype] ?? [];

  return (
    <>
      {fields.map((field, idx) => {
        const input = item.inputs?.[field.key];
        const value = input?.value ?? field.defaultValue ?? 0;
        const confidence = normalizeConfidence(input?.confidence ?? field.defaultConfidence);
        const source = input?.source ?? field.source ?? "";
        const badge = CONFIDENCE_BADGE[confidence];

        const displayValue = field.type === "percentage" ? Math.round(value * 100) : value;

        const handleValueChange = (rawValue: string | number) => {
          const num = Number(rawValue) || 0;
          onUpdateInput(item, field.key, {
            value: field.type === "percentage" ? num / 100 : num,
          });
        };

        const prefix = field.type === "currency" ? "$" : undefined;
        const suffix = field.type === "percentage" ? "%" : field.type === "hours" ? "hrs" : undefined;

        return (
          <tr
            key={field.key}
            className={`border-b last:border-b-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
          >
            {/* Value Item name: only on first row */}
            <td className="px-3 py-1.5 align-top">
              {idx === 0 && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </td>

            {/* Input label */}
            <td className="px-3 py-1.5 text-muted-foreground">{field.label}</td>

            {/* Value */}
            <td className="px-3 py-1.5 text-right">
              {readOnly ? (
                <span className="font-mono text-sm">
                  {prefix}{displayValue.toLocaleString()}{suffix}
                </span>
              ) : (
                <div className="flex items-center justify-end gap-1">
                  {prefix && <span className="text-muted-foreground">{prefix}</span>}
                  <DebouncedInput
                    type="number"
                    value={displayValue}
                    onChange={handleValueChange}
                    debounceMs={300}
                    className="h-7 text-sm font-mono w-24 text-right"
                  />
                  {suffix && <span className="text-muted-foreground">{suffix}</span>}
                </div>
              )}
            </td>

            {/* Confidence badge */}
            <td className="px-3 py-1.5 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  {readOnly ? (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  ) : (
                    <select
                      value={confidence}
                      onChange={(e) =>
                        onUpdateInput(item, field.key, {
                          confidence: e.target.value as ConfidenceTier,
                        })
                      }
                      className="text-[10px] font-bold rounded px-1 py-0.5 border-none cursor-pointer w-8"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {CONFIDENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-semibold">Confidence: {CONFIDENCE_BADGE[confidence].title}</p>
                  <p>Source: {source || field.source || "No source specified"}</p>
                  {field.guidance && <p className="mt-1 text-white/80">{field.guidance}</p>}
                  {field.range && <p className="mt-1 text-white/80">Typical range: {field.range[0]} – {field.range[1]}</p>}
                </TooltipContent>
              </Tooltip>
            </td>

            {/* Source */}
            <td className="px-3 py-1.5">
              {field.sourceUrl ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={field.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#FF4A00] hover:underline truncate block max-w-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {source || "View source →"}
                    </a>
                  </TooltipTrigger>
                  {source && source.length > 30 && (
                    <TooltipContent side="top" className="max-w-sm">
                      <p>{source}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ) : source ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground truncate block max-w-xs cursor-default">
                      {source}
                    </span>
                  </TooltipTrigger>
                  {source.length > 30 && (
                    <TooltipContent side="top" className="max-w-sm">
                      <p>{source}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ) : (
                <span className="text-xs text-muted-foreground/50">—</span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
