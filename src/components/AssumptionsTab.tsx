import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { RateTier, ValueItem, UseCase } from "../types/roi";
import { calculateTotalAnnualValue, calculateTotalHoursSaved, calculateFTEEquivalent } from "../utils/calculations";
import { formatCurrencyCompact } from "../utils/formatting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Label } from "@/components/ui/label";
import { AllInputsTable } from "./AllInputsTable";

interface AssumptionsTabProps {
  calculation: {
    _id: any;
    assumptions: {
      projectionYears: number;
      realizationRamp: number[];
      annualGrowthRate: number;
      defaultRates: Record<RateTier, number>;
    };
    currentSpend?: number;
    proposedSpend?: number;
    obfuscation?: { companyDescriptor?: string; hideNotes?: boolean; roundValues?: boolean };
  };
  valueItems: ValueItem[];
  useCases: UseCase[];
  readOnly?: boolean;
}

const RATE_TIERS: { key: RateTier; label: string; description: string }[] = [
  { key: "admin", label: "Admin / Data Entry", description: "$60-80K loaded" },
  { key: "operations", label: "Operations / IT Support", description: "$80-120K loaded" },
  { key: "salesOps", label: "Sales Operations", description: "$100-140K loaded" },
  { key: "engineering", label: "Engineering", description: "$150-200K loaded" },
  { key: "manager", label: "Manager", description: "$140-180K loaded" },
  { key: "executive", label: "Executive", description: "$200K+ loaded" },
];

export function AssumptionsTab({ calculation, valueItems, useCases, readOnly = false }: AssumptionsTabProps) {
  const updateAssumptions = useMutation(api.calculations.updateAssumptions);
  const updateInvestment = useMutation(api.calculations.updateInvestment);
  const updateObfuscation = useMutation(api.calculations.updateObfuscation);

  const { assumptions } = calculation;

  const handleRateChange = (tier: RateTier, value: string | number) => {
    const numValue = Number(value) || 0;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        defaultRates: {
          ...assumptions.defaultRates,
          [tier]: numValue,
        } as any,
      },
    });
  };

  const handleProjectionChange = (field: "projectionYears" | "annualGrowthRate", value: string | number) => {
    const numValue = Number(value) || 0;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        [field]: field === "annualGrowthRate" ? numValue / 100 : numValue,
      },
    });
  };

  const handleRealizationChange = (yearIndex: number, value: string | number) => {
    const numValue = (Number(value) || 0) / 100;
    const newRamp = [...assumptions.realizationRamp];
    newRamp[yearIndex] = numValue;
    updateAssumptions({
      id: calculation._id,
      assumptions: { ...assumptions, realizationRamp: newRamp },
    });
  };

  const handleInvestmentChange = (field: "currentSpend" | "proposedSpend", value: string | number) => {
    const numValue = Number(value) || 0;
    updateInvestment({ id: calculation._id, [field]: numValue });
  };

  const totalValue = calculateTotalAnnualValue(valueItems);
  const hoursSaved = calculateTotalHoursSaved(valueItems);
  const fteEquiv = calculateFTEEquivalent(hoursSaved);
  const investment = calculation.proposedSpend ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Live Total Value Banner */}
      <div className="sticky top-[57px] z-10">
        <Card className="bg-gradient-to-r from-[#FF4A00] to-[#FF6B33] text-white shadow-lg border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">Total Annual Value</p>
                <p className="text-3xl font-bold font-mono">{formatCurrencyCompact(totalValue)}</p>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <p className="text-white/70 text-xs">Hours saved/mo</p>
                  <p className="text-lg font-semibold font-mono">{Math.round(hoursSaved).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">FTE equiv</p>
                  <p className="text-lg font-semibold font-mono">{fteEquiv.toFixed(1)}</p>
                </div>
                {investment > 0 && (
                  <div>
                    <p className="text-white/70 text-xs">Investment</p>
                    <p className="text-lg font-semibold font-mono">{formatCurrencyCompact(investment)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Value Assumptions */}
      <AllInputsTable
        valueItems={valueItems}
        useCases={useCases}
        calculationId={calculation._id}
        readOnly={readOnly}
      />

      {/* Default Hourly Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Default Hourly Rates</CardTitle>
          <CardDescription>
            Loaded hourly rates by role tier. Used as defaults when creating value items.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {RATE_TIERS.map(({ key, label, description }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`rate-${key}`} className="text-sm">{label}</Label>
              <p className="text-xs text-muted-foreground">{description}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                {readOnly ? (
                  <span className="font-mono py-2">{assumptions.defaultRates[key]}</span>
                ) : (
                  <DebouncedInput
                    id={`rate-${key}`}
                    type="number"
                    value={assumptions.defaultRates[key]}
                    onChange={(value) => handleRateChange(key, value)}
                    debounceMs={300}
                    className="font-mono"
                  />
                )}
                <span className="text-muted-foreground text-sm">/hr</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Projection Settings</CardTitle>
          <CardDescription>Multi-year projection and realization assumptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projection-years">Projection Period</Label>
              <div className="flex items-center gap-2">
                {readOnly ? (
                  <span className="font-mono py-2">{assumptions.projectionYears}</span>
                ) : (
                  <DebouncedInput
                    id="projection-years"
                    type="number"
                    min="1"
                    max="10"
                    value={assumptions.projectionYears}
                    onChange={(value) => handleProjectionChange("projectionYears", value)}
                    debounceMs={300}
                    className="font-mono"
                  />
                )}
                <span className="text-muted-foreground text-sm">years</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="growth-rate">Annual Growth Rate</Label>
              <div className="flex items-center gap-2">
                {readOnly ? (
                  <span className="font-mono py-2">{Math.round(assumptions.annualGrowthRate * 100)}</span>
                ) : (
                  <DebouncedInput
                    id="growth-rate"
                    type="number"
                    value={Math.round(assumptions.annualGrowthRate * 100)}
                    onChange={(value) => handleProjectionChange("annualGrowthRate", value)}
                    debounceMs={300}
                    className="font-mono"
                  />
                )}
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Realization Ramp</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Percentage of value realized each year (accounts for adoption curve)
            </p>
            <div className="flex gap-4">
              {assumptions.realizationRamp.map((rate, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Year {index + 1}</Label>
                  <div className="flex items-center gap-1">
                    {readOnly ? (
                      <span className="font-mono py-2 w-20">{Math.round(rate * 100)}</span>
                    ) : (
                      <DebouncedInput
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(rate * 100)}
                        onChange={(value) => handleRealizationChange(index, value)}
                        debounceMs={300}
                        className="font-mono w-20"
                      />
                    )}
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposed Investment */}
      <Card>
        <CardHeader>
          <CardTitle>Proposed Investment</CardTitle>
          <CardDescription>Annual Zapier investment for this engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="proposed-spend">Annual Investment</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              {readOnly ? (
                <span className="font-mono py-2">{(calculation.proposedSpend ?? 0).toLocaleString()}</span>
              ) : (
                <DebouncedInput
                  id="proposed-spend"
                  type="number"
                  value={calculation.proposedSpend ?? ""}
                  onChange={(value) => handleInvestmentChange("proposedSpend", value)}
                  debounceMs={300}
                  className="font-mono"
                  placeholder="0"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obfuscation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Obfuscation Settings</CardTitle>
          <CardDescription>
            Configure anonymization for shareable/demo views (applies to /demo and ?obfuscate=true URLs)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-descriptor">Company Descriptor</Label>
            <p className="text-xs text-muted-foreground">Replaces company name in obfuscated views</p>
            {readOnly ? (
              <span className="font-mono py-2">{calculation.obfuscation?.companyDescriptor || "Enterprise Customer"}</span>
            ) : (
              <DebouncedInput
                id="company-descriptor"
                value={calculation.obfuscation?.companyDescriptor ?? ""}
                onChange={(value) =>
                  updateObfuscation({
                    id: calculation._id,
                    obfuscation: {
                      ...calculation.obfuscation,
                      companyDescriptor: String(value),
                    },
                  })
                }
                debounceMs={500}
                placeholder="e.g., Fortune 500 Shipping & Logistics Company"
              />
            )}
          </div>
          {!readOnly && (
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={calculation.obfuscation?.hideNotes ?? false}
                  onChange={(e) =>
                    updateObfuscation({
                      id: calculation._id,
                      obfuscation: {
                        ...calculation.obfuscation,
                        hideNotes: e.target.checked,
                      },
                    })
                  }
                />
                Hide descriptions/notes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={calculation.obfuscation?.roundValues ?? false}
                  onChange={(e) =>
                    updateObfuscation({
                      id: calculation._id,
                      obfuscation: {
                        ...calculation.obfuscation,
                        roundValues: e.target.checked,
                      },
                    })
                  }
                />
                Round monetary values
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
