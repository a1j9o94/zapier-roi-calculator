import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation } from "../types/roi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AssumptionsTabProps {
  calculation: Calculation;
}

export function AssumptionsTab({ calculation }: AssumptionsTabProps) {
  const updateAssumptions = useMutation(api.calculations.updateAssumptions);
  const updateInvestment = useMutation(api.calculations.updateInvestment);

  const { assumptions } = calculation;

  const handleHourlyRateChange = (
    tier: "basic" | "operations" | "engineering" | "executive",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        hourlyRates: {
          ...assumptions.hourlyRates,
          [tier]: numValue,
        },
      },
    });
  };

  const handleTaskMinutesChange = (
    complexity: "simple" | "medium" | "complex",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        taskMinutes: {
          ...assumptions.taskMinutes,
          [complexity]: numValue,
        },
      },
    });
  };

  const handleProjectionChange = (
    field: "projectionYears" | "annualGrowthRate",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        [field]: field === "annualGrowthRate" ? numValue / 100 : numValue,
      },
    });
  };

  const handleRealizationChange = (yearIndex: number, value: string) => {
    const numValue = (parseFloat(value) || 0) / 100;
    const newRamp = [...assumptions.realizationRamp];
    newRamp[yearIndex] = numValue;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        realizationRamp: newRamp,
      },
    });
  };

  const handleRiskAssumptionChange = (
    field: "avgDataBreachCost" | "avgSupportTicketCost",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    updateAssumptions({
      id: calculation._id,
      assumptions: {
        ...assumptions,
        [field]: numValue,
      },
    });
  };

  const handleInvestmentChange = (
    field: "currentSpend" | "proposedSpend",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    updateInvestment({
      id: calculation._id,
      [field]: numValue,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Labor Cost Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Labor Cost Assumptions</CardTitle>
          <CardDescription>
            Hourly rates by role tier for calculating time savings value
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basic-rate">Basic Staff Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="basic-rate"
                type="number"
                value={assumptions.hourlyRates.basic}
                onChange={(e) =>
                  handleHourlyRateChange("basic", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">/hour</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ops-rate">Operations Staff Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="ops-rate"
                type="number"
                value={assumptions.hourlyRates.operations}
                onChange={(e) =>
                  handleHourlyRateChange("operations", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">/hour</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eng-rate">Engineering Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="eng-rate"
                type="number"
                value={assumptions.hourlyRates.engineering}
                onChange={(e) =>
                  handleHourlyRateChange("engineering", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">/hour</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exec-rate">Executive Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="exec-rate"
                type="number"
                value={assumptions.hourlyRates.executive}
                onChange={(e) =>
                  handleHourlyRateChange("executive", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">/hour</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Complexity */}
      <Card>
        <CardHeader>
          <CardTitle>Task Complexity</CardTitle>
          <CardDescription>
            Minutes required per task by complexity level
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simple-mins">Simple Tasks</Label>
            <div className="flex items-center gap-2">
              <Input
                id="simple-mins"
                type="number"
                value={assumptions.taskMinutes.simple}
                onChange={(e) =>
                  handleTaskMinutesChange("simple", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">min</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="medium-mins">Medium Tasks</Label>
            <div className="flex items-center gap-2">
              <Input
                id="medium-mins"
                type="number"
                value={assumptions.taskMinutes.medium}
                onChange={(e) =>
                  handleTaskMinutesChange("medium", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">min</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complex-mins">Complex Tasks</Label>
            <div className="flex items-center gap-2">
              <Input
                id="complex-mins"
                type="number"
                value={assumptions.taskMinutes.complex}
                onChange={(e) =>
                  handleTaskMinutesChange("complex", e.target.value)
                }
                className="font-mono"
              />
              <span className="text-muted-foreground text-sm">min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Projection Settings</CardTitle>
          <CardDescription>
            Multi-year projection and realization assumptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projection-years">Projection Period</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="projection-years"
                  type="number"
                  min="1"
                  max="10"
                  value={assumptions.projectionYears}
                  onChange={(e) =>
                    handleProjectionChange("projectionYears", e.target.value)
                  }
                  className="font-mono"
                />
                <span className="text-muted-foreground text-sm">years</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="growth-rate">Annual Growth Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="growth-rate"
                  type="number"
                  value={Math.round(assumptions.annualGrowthRate * 100)}
                  onChange={(e) =>
                    handleProjectionChange("annualGrowthRate", e.target.value)
                  }
                  className="font-mono"
                />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Realization Ramp</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Percentage of value realized each year
            </p>
            <div className="flex gap-4">
              {assumptions.realizationRamp.map((rate, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Year {index + 1}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(rate * 100)}
                      onChange={(e) =>
                        handleRealizationChange(index, e.target.value)
                      }
                      className="font-mono w-20"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assumptions</CardTitle>
          <CardDescription>
            Default values for security and uptime calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="breach-cost">Avg Data Breach Cost</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="breach-cost"
                type="number"
                value={assumptions.avgDataBreachCost}
                onChange={(e) =>
                  handleRiskAssumptionChange("avgDataBreachCost", e.target.value)
                }
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-cost">Avg Support Ticket Cost</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="ticket-cost"
                type="number"
                value={assumptions.avgSupportTicketCost}
                onChange={(e) =>
                  handleRiskAssumptionChange(
                    "avgSupportTicketCost",
                    e.target.value
                  )
                }
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Comparison</CardTitle>
          <CardDescription>
            Compare current spend vs proposed Zapier investment
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current-spend">Current Annual Spend</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="current-spend"
                type="number"
                value={calculation.currentSpend ?? ""}
                onChange={(e) =>
                  handleInvestmentChange("currentSpend", e.target.value)
                }
                className="font-mono"
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proposed-spend">Proposed Zapier Investment</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="proposed-spend"
                type="number"
                value={calculation.proposedSpend ?? ""}
                onChange={(e) =>
                  handleInvestmentChange("proposedSpend", e.target.value)
                }
                className="font-mono"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
