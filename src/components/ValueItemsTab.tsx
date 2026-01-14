import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem, Category } from "../types/roi";
import { CATEGORY_INFO, CATEGORY_ORDER } from "../types/roi";
import { calculateItemAnnualValue, calculateTotalAnnualValue } from "../utils/calculations";
import { formatCurrency, formatCurrencyCompact } from "../utils/formatting";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ValueItemsTabProps {
  calculation: Calculation;
  valueItems: ValueItem[];
}

export function ValueItemsTab({ calculation, valueItems }: ValueItemsTabProps) {
  const totalValue = calculateTotalAnnualValue(valueItems, calculation.assumptions);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Grand Total Banner */}
      <Card className="bg-gradient-to-r from-[#FF4A00] to-[#FF6B33] text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Total Annual Value
              </p>
              <p className="text-4xl font-bold font-mono">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">
                {valueItems.length} value items
              </p>
              <p className="text-white/80 text-sm">
                across {new Set(valueItems.map((i) => i.category)).size} categories
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Sections */}
      {CATEGORY_ORDER.map((category) => (
        <CategorySection
          key={category}
          category={category}
          calculation={calculation}
          items={valueItems
            .filter((item) => item.category === category)
            .sort((a, b) => a.order - b.order)}
        />
      ))}
    </div>
  );
}

interface CategorySectionProps {
  category: Category;
  calculation: Calculation;
  items: ValueItem[];
}

function CategorySection({ category, calculation, items }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(items.length > 0);
  const createItem = useMutation(api.valueItems.create);

  const categoryInfo = CATEGORY_INFO[category];
  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemAnnualValue(item, calculation.assumptions),
    0
  );

  const handleAddItem = async () => {
    // Determine default values based on category
    let quantity = 1;
    let unitValue = 10000;

    if (category === "time_savings") {
      quantity = 1000;
      unitValue = 0; // Calculated from complexity + rateTier
    } else if (category === "security_governance") {
      quantity = 0.08; // 8% probability
      unitValue = calculation.assumptions.avgDataBreachCost;
    } else if (category === "uptime") {
      quantity = 0.1; // 10% probability
      unitValue = calculation.assumptions.avgSupportTicketCost;
    }

    await createItem({
      calculationId: calculation._id,
      category,
      name: "New Item",
      quantity,
      unitValue,
      complexity: category === "time_savings" ? "medium" : undefined,
      rateTier: category === "time_savings" ? "operations" : undefined,
      rate: ["revenue_impact", "cost_reduction"].includes(category) ? 1 : undefined,
    });
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
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryInfo.color }}
            />
            <div>
              <CardTitle className="text-lg">{categoryInfo.label}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {categoryInfo.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono font-semibold text-lg">
              {formatCurrencyCompact(subtotal)}
            </span>
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
        <CardContent className="pt-0">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No items in this category yet</p>
              <Button onClick={handleAddItem} variant="outline">
                + Add {categoryInfo.label} Item
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 py-1">
                <div className="col-span-3">Name</div>
                {category === "time_savings" ? (
                  <>
                    <div className="col-span-2">Tasks/Month</div>
                    <div className="col-span-2">Complexity</div>
                    <div className="col-span-2">Rate Tier</div>
                  </>
                ) : category === "uptime" || category === "security_governance" ? (
                  <>
                    <div className="col-span-2">Probability</div>
                    <div className="col-span-2">Cost/Incident</div>
                    <div className="col-span-2"></div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Value</div>
                    <div className="col-span-2">Rate</div>
                  </>
                )}
                <div className="col-span-2 text-right">Annual Value</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              {items.map((item) => (
                <ValueItemRow
                  key={item._id}
                  item={item}
                  category={category}
                  assumptions={calculation.assumptions}
                />
              ))}

              {/* Add Button */}
              <Button
                onClick={handleAddItem}
                variant="ghost"
                className="w-full mt-2 text-muted-foreground hover:text-foreground"
              >
                + Add Item
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

interface ValueItemRowProps {
  item: ValueItem;
  category: Category;
  assumptions: Calculation["assumptions"];
}

function ValueItemRow({ item, category, assumptions }: ValueItemRowProps) {
  const updateItem = useMutation(api.valueItems.update);
  const deleteItem = useMutation(api.valueItems.remove);

  const annualValue = calculateItemAnnualValue(item, assumptions);

  const handleUpdate = (field: string, value: unknown) => {
    updateItem({
      id: item._id,
      [field]: value,
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this item?")) {
      deleteItem({ id: item._id });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-lg hover:bg-muted/50 group">
      {/* Name */}
      <div className="col-span-3">
        <DebouncedInput
          value={item.name}
          onChange={(value) => handleUpdate("name", value)}
          className="h-8 text-sm"
        />
      </div>

      {category === "time_savings" ? (
        <>
          {/* Tasks/Month */}
          <div className="col-span-2">
            <DebouncedInput
              type="number"
              value={item.quantity}
              onChange={(value) => handleUpdate("quantity", value)}
              className="h-8 text-sm font-mono"
            />
          </div>

          {/* Complexity */}
          <div className="col-span-2">
            <Select
              value={item.complexity ?? "medium"}
              onValueChange={(value) => handleUpdate("complexity", value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="complex">Complex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rate Tier */}
          <div className="col-span-2">
            <Select
              value={item.rateTier ?? "operations"}
              onValueChange={(value) => handleUpdate("rateTier", value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (${assumptions.hourlyRates.basic}/hr)</SelectItem>
                <SelectItem value="operations">Ops (${assumptions.hourlyRates.operations}/hr)</SelectItem>
                <SelectItem value="engineering">Eng (${assumptions.hourlyRates.engineering}/hr)</SelectItem>
                <SelectItem value="executive">Exec (${assumptions.hourlyRates.executive}/hr)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ) : category === "uptime" || category === "security_governance" ? (
        <>
          {/* Probability */}
          <div className="col-span-2">
            <div className="flex items-center gap-1">
              <DebouncedInput
                type="number"
                value={Math.round(item.quantity * 100)}
                onChange={(value) =>
                  handleUpdate("quantity", (Number(value) || 0) / 100)
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {/* Cost per Incident */}
          <div className="col-span-2">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <DebouncedInput
                type="number"
                value={item.unitValue}
                onChange={(value) => handleUpdate("unitValue", value)}
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>

          {/* Empty column */}
          <div className="col-span-2"></div>
        </>
      ) : (
        <>
          {/* Quantity */}
          <div className="col-span-2">
            <DebouncedInput
              type="number"
              value={item.quantity}
              onChange={(value) => handleUpdate("quantity", value)}
              className="h-8 text-sm font-mono"
            />
          </div>

          {/* Unit Value */}
          <div className="col-span-2">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <DebouncedInput
                type="number"
                value={item.unitValue}
                onChange={(value) => handleUpdate("unitValue", value)}
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>

          {/* Rate (for revenue/cost categories) */}
          <div className="col-span-2">
            {["revenue_impact", "cost_reduction"].includes(category) ? (
              <div className="flex items-center gap-1">
                <DebouncedInput
                  type="number"
                  value={Math.round((item.rate ?? 1) * 100)}
                  onChange={(value) =>
                    handleUpdate("rate", (Number(value) || 0) / 100)
                  }
                  className="h-8 text-sm font-mono"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* Annual Value */}
      <div className="col-span-2 text-right font-mono font-medium text-[#FF4A00]">
        {formatCurrency(annualValue)}
      </div>

      {/* Delete Button */}
      <div className="col-span-1 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-8 w-8 p-0"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
