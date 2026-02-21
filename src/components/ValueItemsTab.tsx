import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ValueItem, Dimension, Archetype, ConfidenceTier } from "../types/roi";
import { DIMENSION_INFO, DIMENSION_ORDER, ARCHETYPE_INFO, ARCHETYPE_DIMENSION } from "../types/roi";
import { ARCHETYPE_FIELDS } from "../types/archetypes";
import type { ArchetypeFieldDef } from "../types/archetypes";
import { calculateItemAnnualValue, calculateComputedValue, calculateTotalAnnualValue } from "../utils/calculations";
import { formatCurrency, formatCurrencyCompact } from "../utils/formatting";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ValueItemsTabProps {
  calculation: { _id: Id<"calculations">; assumptions: any };
  valueItems: ValueItem[];
  readOnly?: boolean;
}

const CONFIDENCE_BADGE: Record<ConfidenceTier, { label: string; color: string; bg: string }> = {
  benchmarked: { label: "B", color: "#059669", bg: "#D1FAE5" },
  estimated: { label: "E", color: "#D97706", bg: "#FEF3C7" },
  custom: { label: "C", color: "#6B7280", bg: "#F3F4F6" },
};

export function ValueItemsTab({ calculation, valueItems, readOnly = false }: ValueItemsTabProps) {
  const totalValue = calculateTotalAnnualValue(valueItems);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Total Annual Value Banner */}
      <Card className="bg-gradient-to-r from-[#FF4A00] to-[#FF6B33] text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Annual Value</p>
              <p className="text-4xl font-bold font-mono">{formatCurrency(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">{valueItems.length} value items</p>
              <p className="text-white/80 text-sm">
                across {new Set(valueItems.map((i) => i.dimension)).size} dimensions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Sections */}
      {DIMENSION_ORDER.map((dimension) => (
        <DimensionSection
          key={dimension}
          dimension={dimension}
          calculationId={calculation._id}
          items={valueItems
            .filter((item) => item.dimension === dimension)
            .sort((a, b) => a.order - b.order)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ── Dimension Section ──────────────────────────────────────────────

interface DimensionSectionProps {
  dimension: Dimension;
  calculationId: Id<"calculations">;
  items: ValueItem[];
  readOnly: boolean;
}

function DimensionSection({ dimension, calculationId, items, readOnly }: DimensionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(items.length > 0);
  const [addingArchetype, setAddingArchetype] = useState(false);
  const createItem = useMutation(api.valueItems.create);

  const info = DIMENSION_INFO[dimension];
  const subtotal = items.reduce((sum, item) => sum + calculateItemAnnualValue(item), 0);

  // Archetypes belonging to this dimension
  const dimensionArchetypes = (Object.entries(ARCHETYPE_DIMENSION) as [Archetype, Dimension][])
    .filter(([, d]) => d === dimension)
    .map(([a]) => a);

  const handleAddItem = async (archetype: Archetype) => {
    const fields = ARCHETYPE_FIELDS[archetype];
    const inputs: Record<string, { value: number; confidence: ConfidenceTier; source?: string }> = {};
    for (const field of fields) {
      inputs[field.key] = {
        value: field.defaultValue ?? 0,
        confidence: field.defaultConfidence,
        ...(field.source ? { source: field.source } : {}),
      };
    }

    await createItem({
      calculationId,
      archetype,
      name: ARCHETYPE_INFO[archetype].label,
      inputs,
    });
    setAddingArchetype(false);
    setIsExpanded(true);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
            <div>
              <CardTitle className="text-lg">{info.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{info.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono font-semibold text-lg">{formatCurrencyCompact(subtotal)}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {items.length === 0 && !addingArchetype && (
            <p className="text-center py-4 text-muted-foreground text-sm">
              No value items in this dimension yet
            </p>
          )}

          {items.map((item) => (
            <ValueItemCard key={item._id} item={item} readOnly={readOnly} />
          ))}

          {/* Add Item */}
          {!readOnly && (
            addingArchetype ? (
              <div className="flex items-center gap-2 px-2">
                <Select onValueChange={(v) => handleAddItem(v as Archetype)}>
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue placeholder="Select archetype..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensionArchetypes.map((a) => (
                      <SelectItem key={a} value={a}>
                        {ARCHETYPE_INFO[a].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setAddingArchetype(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setAddingArchetype(true)}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                + Add Value Item
              </Button>
            )
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Value Item Card ────────────────────────────────────────────────

interface ValueItemCardProps {
  item: ValueItem;
  readOnly: boolean;
}

function ValueItemCard({ item, readOnly }: ValueItemCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateItem = useMutation(api.valueItems.update);
  const deleteItem = useMutation(api.valueItems.remove);

  const computed = calculateComputedValue(item);
  const archetypeInfo = ARCHETYPE_INFO[item.archetype];
  const fields = ARCHETYPE_FIELDS[item.archetype] ?? [];
  const confidenceBadge = CONFIDENCE_BADGE[computed.confidence];

  const handleUpdateInput = (fieldKey: string, newValue: number) => {
    const currentInputs = { ...(item.inputs ?? {}) };
    currentInputs[fieldKey] = {
      ...currentInputs[fieldKey],
      value: newValue,
    };
    updateItem({ id: item._id, inputs: currentInputs });
  };

  const handleUpdateInputConfidence = (fieldKey: string, confidence: ConfidenceTier) => {
    const currentInputs = { ...(item.inputs ?? {}) };
    currentInputs[fieldKey] = {
      ...currentInputs[fieldKey],
      confidence,
    };
    updateItem({ id: item._id, inputs: currentInputs });
  };

  const handleDelete = () => {
    if (confirm("Delete this value item?")) {
      deleteItem({ id: item._id });
    }
  };

  return (
    <div className="border rounded-lg">
      {/* Summary Row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {readOnly ? (
            <span className="text-sm font-medium truncate">{item.name}</span>
          ) : (
            <DebouncedInput
              value={item.name}
              onChange={(v) => updateItem({ id: item._id, name: String(v) })}
              className="h-8 text-sm font-medium max-w-[220px]"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
            {archetypeInfo?.label ?? item.archetype}
          </span>
          <span
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: confidenceBadge.bg, color: confidenceBadge.color }}
            title={`Overall confidence: ${computed.confidence}`}
          >
            {confidenceBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono font-semibold text-[#FF4A00]">
            {formatCurrency(computed.annualValue)}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-4 h-4 transition-transform text-muted-foreground ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Expanded Detail */}
      {isOpen && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Formula Trace */}
          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded">
            {computed.formula}
          </p>

          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map((field) => (
              <ArchetypeInput
                key={field.key}
                field={field}
                input={item.inputs?.[field.key]}
                readOnly={readOnly}
                onValueChange={(v) => handleUpdateInput(field.key, v)}
                onConfidenceChange={(c) => handleUpdateInputConfidence(field.key, c)}
              />
            ))}
          </div>

          {/* Manual Override + Delete Row */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Manual override ($):</label>
              {readOnly ? (
                <span className="text-xs font-mono">
                  {item.manualAnnualValue != null ? formatCurrency(item.manualAnnualValue) : "none"}
                </span>
              ) : (
                <>
                  <DebouncedInput
                    type="number"
                    value={item.manualAnnualValue ?? ""}
                    onChange={(v) => {
                      const num = Number(v);
                      if (v === "" || v === undefined) {
                        updateItem({ id: item._id, manualAnnualValue: -1 } as any);
                      } else {
                        updateItem({ id: item._id, manualAnnualValue: num } as any);
                      }
                    }}
                    placeholder="Leave blank for formula"
                    className="h-7 text-xs font-mono w-32"
                  />
                  {item.manualAnnualValue != null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateItem({ id: item._id, manualAnnualValue: -1 } as any)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </>
              )}
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive h-7 px-2 text-xs"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Archetype Input Field ──────────────────────────────────────────

interface ArchetypeInputProps {
  field: ArchetypeFieldDef;
  input?: { value: number; confidence: ConfidenceTier; source?: string };
  readOnly: boolean;
  onValueChange: (value: number) => void;
  onConfidenceChange: (confidence: ConfidenceTier) => void;
}

function ArchetypeInput({ field, input, readOnly, onValueChange, onConfidenceChange }: ArchetypeInputProps) {
  const value = input?.value ?? field.defaultValue ?? 0;
  const confidence = input?.confidence ?? field.defaultConfidence;
  const badge = CONFIDENCE_BADGE[confidence];

  // Display value: percentages stored as decimals, show as whole numbers
  const displayValue = field.type === "percentage" ? Math.round(value * 100) : value;

  const handleChange = (rawValue: string | number) => {
    const num = Number(rawValue) || 0;
    onValueChange(field.type === "percentage" ? num / 100 : num);
  };

  const prefix = field.type === "currency" ? "$" : undefined;
  const suffix = field.type === "percentage" ? "%" : field.type === "hours" ? "hrs" : undefined;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{field.label}</label>
        {!readOnly ? (
          <select
            value={confidence}
            onChange={(e) => onConfidenceChange(e.target.value as ConfidenceTier)}
            className="text-[10px] font-bold rounded px-1 py-0 border-none cursor-pointer"
            style={{ backgroundColor: badge.bg, color: badge.color }}
            title={`Confidence: ${confidence}${input?.source ? ` — ${input.source}` : ""}`}
          >
            <option value="benchmarked">B</option>
            <option value="estimated">E</option>
            <option value="custom">C</option>
          </select>
        ) : (
          <span
            className="text-[10px] font-bold rounded px-1"
            style={{ backgroundColor: badge.bg, color: badge.color }}
            title={`Confidence: ${confidence}${input?.source ? ` — ${input.source}` : ""}`}
          >
            {badge.label}
          </span>
        )}
      </div>
      {readOnly ? (
        <p className="text-sm font-mono py-1">
          {prefix}{displayValue.toLocaleString()}{suffix}
        </p>
      ) : (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <DebouncedInput
            type="number"
            value={displayValue}
            onChange={handleChange}
            className="h-7 text-sm font-mono"
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      )}
      {field.guidance && (
        <p className="text-[10px] text-muted-foreground/70 leading-tight">{field.guidance}</p>
      )}
    </div>
  );
}
