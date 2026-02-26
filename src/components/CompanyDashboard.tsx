import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyCompact, formatCurrency, formatRelativeTime } from "../utils/formatting";
import { DIMENSION_INFO, type Dimension, DIMENSION_ORDER } from "../types/roi";

interface CompanyDashboardProps {
  company: {
    _id: Id<"companies">;
    name: string;
    shortId: string;
    industry?: string;
    employeeCount?: number;
    createdAt: number;
    updatedAt: number;
  };
  summaryOnly?: boolean;
}

interface CalcSummary {
  shortId: string;
  name: string;
  role?: string;
  totalAnnualValue: number;
  roiMultiple: number | null;
  hoursSavedPerMonth: number;
  proposedSpend?: number;
  valueItemCount: number;
  updatedAt: number;
  primaryDimension?: string;
}

function useCompanyAggregate(companyId: Id<"companies">) {
  const calculations = useQuery(api.calculations.listByCompany, { companyId });
  const companyUseCases = useQuery(api.useCases.listByCompany, { companyId });
  const allValueItems = useQuery(api.valueItems.listAll);

  if (!calculations || !allValueItems || !companyUseCases) return null;

  // Company-level totals: sum value items per use case ONCE (no double-counting)
  const companyUseCaseIds = new Set(companyUseCases.map((uc) => uc._id));
  // Value items linked to company use cases
  const companyValueItems = allValueItems.filter(
    (vi) => vi.useCaseId && companyUseCaseIds.has(vi.useCaseId)
  );
  // Also include unlinked value items from company calculators
  const companyCalcIds = new Set(calculations.map((c) => c._id));
  const unlinkedItems = allValueItems.filter(
    (vi) => !vi.useCaseId && companyCalcIds.has(vi.calculationId)
  );
  const allCompanyItems = [...companyValueItems, ...unlinkedItems];

  let totalAnnualValue = 0;
  let totalHoursSavedPerMonth = 0;
  let totalProposedSpend = 0;
  const dimensionTotals: Record<string, number> = {};

  for (const item of allCompanyItems) {
    const value = item.manualAnnualValue ?? computeItemValue(item);
    totalAnnualValue += value;
    const dim = item.dimension;
    dimensionTotals[dim] = (dimensionTotals[dim] ?? 0) + value;

    const inputs = (item.inputs ?? {}) as Record<string, { value: number }>;
    if (item.archetype === "task_elimination") {
      totalHoursSavedPerMonth += (getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesPerTask")) / 60;
    } else if (item.archetype === "task_simplification") {
      totalHoursSavedPerMonth += (getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesSavedPerTask")) / 60;
    } else if (item.archetype === "process_acceleration") {
      totalHoursSavedPerMonth += getVal(inputs, "processesPerMonth") * (getVal(inputs, "timeBeforeHrs") - getVal(inputs, "timeAfterHrs"));
    } else if (item.archetype === "handoff_elimination") {
      totalHoursSavedPerMonth += getVal(inputs, "handoffsPerMonth") * getVal(inputs, "avgQueueTimeHrs");
    }
  }

  // Per-calculator summaries (use useCaseIds for accurate value per calc)
  const calcSummaries: CalcSummary[] = [];

  for (const calc of calculations) {
    // Value items for this calculator: items in its useCaseIds + unlinked items with this calculationId
    const calcUseCaseIds = new Set(calc.useCaseIds ?? []);
    const calcValueItems = [
      ...allValueItems.filter((vi) => vi.useCaseId && calcUseCaseIds.has(vi.useCaseId)),
      ...allValueItems.filter((vi) => !vi.useCaseId && vi.calculationId === calc._id),
    ];

    // Fallback for calculators not yet migrated
    const effectiveItems = calcValueItems.length > 0 || (calc.useCaseIds && calc.useCaseIds.length > 0)
      ? calcValueItems
      : allValueItems.filter((vi) => vi.calculationId === calc._id);

    let calcValue = 0;
    let calcHours = 0;
    const calcDimTotals: Record<string, number> = {};

    for (const item of effectiveItems) {
      const value = item.manualAnnualValue ?? computeItemValue(item);
      calcValue += value;
      const dim = item.dimension;
      calcDimTotals[dim] = (calcDimTotals[dim] ?? 0) + value;

      const inputs = (item.inputs ?? {}) as Record<string, { value: number }>;
      if (item.archetype === "task_elimination") {
        calcHours += (getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesPerTask")) / 60;
      } else if (item.archetype === "task_simplification") {
        calcHours += (getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesSavedPerTask")) / 60;
      } else if (item.archetype === "process_acceleration") {
        calcHours += getVal(inputs, "processesPerMonth") * (getVal(inputs, "timeBeforeHrs") - getVal(inputs, "timeAfterHrs"));
      } else if (item.archetype === "handoff_elimination") {
        calcHours += getVal(inputs, "handoffsPerMonth") * getVal(inputs, "avgQueueTimeHrs");
      }
    }

    totalProposedSpend += calc.proposedSpend ?? 0;

    let primaryDim = "";
    let primaryVal = 0;
    for (const [dim, val] of Object.entries(calcDimTotals)) {
      if (val > primaryVal) {
        primaryDim = dim;
        primaryVal = val;
      }
    }

    const investment = calc.proposedSpend ?? 0;
    calcSummaries.push({
      shortId: calc.shortId,
      name: calc.name,
      role: calc.role,
      totalAnnualValue: Math.round(calcValue),
      roiMultiple: investment > 0 ? Math.round((calcValue / investment) * 100) / 100 : null,
      hoursSavedPerMonth: Math.round(calcHours),
      proposedSpend: calc.proposedSpend,
      valueItemCount: effectiveItems.length,
      updatedAt: calc.updatedAt,
      primaryDimension: primaryDim,
    });
  }

  return {
    totalAnnualValue: Math.round(totalAnnualValue),
    totalROI: totalProposedSpend > 0 ? Math.round((totalAnnualValue / totalProposedSpend) * 100) / 100 : null,
    totalHoursSavedPerMonth: Math.round(totalHoursSavedPerMonth),
    calculatorCount: calculations.length,
    dimensionTotals,
    calculators: calcSummaries,
  };
}

function getVal(inputs: Record<string, { value: number }>, key: string): number {
  return inputs?.[key]?.value ?? 0;
}

function computeItemValue(item: { archetype: string; inputs: unknown; manualAnnualValue?: number }): number {
  if (item.manualAnnualValue != null) return item.manualAnnualValue;
  const inputs = (item.inputs ?? {}) as Record<string, { value: number }>;
  switch (item.archetype) {
    case "pipeline_velocity":
      return getVal(inputs, "dealsPerQuarter") * getVal(inputs, "avgDealValue") * getVal(inputs, "conversionLift") * 4;
    case "revenue_capture":
      return getVal(inputs, "annualRevenue") * getVal(inputs, "leakageRate") * getVal(inputs, "captureImprovement");
    case "revenue_expansion":
      return getVal(inputs, "customerBase") * getVal(inputs, "expansionRate") * getVal(inputs, "avgExpansionValue") * getVal(inputs, "lift");
    case "time_to_revenue":
      return getVal(inputs, "newCustomersPerYear") * getVal(inputs, "revenuePerCustomer") * getVal(inputs, "daysAccelerated") / 365;
    case "process_acceleration":
      return getVal(inputs, "processesPerMonth") * (getVal(inputs, "timeBeforeHrs") - getVal(inputs, "timeAfterHrs")) * getVal(inputs, "hourlyRate") * 12;
    case "handoff_elimination":
      return getVal(inputs, "handoffsPerMonth") * getVal(inputs, "avgQueueTimeHrs") * getVal(inputs, "hourlyRateOfWaitingParty") * 12;
    case "task_elimination":
      return getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesPerTask") * (getVal(inputs, "hourlyRate") / 60) * 12;
    case "task_simplification":
      return getVal(inputs, "tasksPerMonth") * getVal(inputs, "minutesSavedPerTask") * (getVal(inputs, "hourlyRate") / 60) * 12;
    case "context_surfacing": {
      const meetings = getVal(inputs, "meetingsAvoidedPerMonth") * getVal(inputs, "attendeesPerMeeting") * getVal(inputs, "meetingDurationHrs") * getVal(inputs, "meetingHourlyRate") * 12;
      const searches = getVal(inputs, "searchesAvoidedPerMonth") * getVal(inputs, "avgSearchTimeMin") * (getVal(inputs, "searchHourlyRate") / 60) * 12;
      return meetings + searches;
    }
    case "labor_avoidance":
      return getVal(inputs, "ftesAvoided") * getVal(inputs, "fullyLoadedAnnualCost");
    case "tool_consolidation":
      return getVal(inputs, "toolsEliminated") * getVal(inputs, "annualLicenseCostPerTool");
    case "error_rework_elimination":
      return getVal(inputs, "errorsPerMonth") * getVal(inputs, "avgCostPerError") * getVal(inputs, "reductionRate") * 12;
    case "compliance_assurance":
      return getVal(inputs, "expectedViolationsPerYear") * getVal(inputs, "avgPenaltyPerViolation") * getVal(inputs, "reductionRate");
    case "data_integrity":
      return getVal(inputs, "recordsPerMonth") * getVal(inputs, "errorRate") * getVal(inputs, "costPerError") * getVal(inputs, "reductionRate") * 12;
    case "incident_prevention":
      return getVal(inputs, "incidentsPerYear") * getVal(inputs, "avgCostPerIncident") * getVal(inputs, "reductionRate");
    case "process_consistency":
      return getVal(inputs, "processesPerMonth") * getVal(inputs, "defectRate") * getVal(inputs, "costPerDefect") * getVal(inputs, "reductionRate") * 12;
    default:
      return 0;
  }
}

export function CompanyDashboard({ company, summaryOnly = false }: CompanyDashboardProps) {
  const navigate = useNavigate();
  const createCalculation = useMutation(api.calculations.create);
  const updateCompanyId = useMutation(api.calculations.updateCompanyId);
  const allCalculations = useQuery(api.calculations.list);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const aggregate = useCompanyAggregate(company._id);

  // Standalone calcs (not linked to any company) available for linking
  const standaloneCalcs = allCalculations?.filter((c) => !c.companyId) ?? [];

  const handleAddCalculator = async () => {
    const result = await createCalculation({
      name: `${company.name} - New Calculation`,
      companyId: company._id,
    });
    navigate(`/c/${result.shortId}`);
  };

  const handleLinkCalculator = async (calcId: Id<"calculations">) => {
    await updateCompanyId({ id: calcId, companyId: company._id });
    setShowLinkDropdown(false);
  };

  if (!aggregate) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-1">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {company.industry && <span>{company.industry}</span>}
                {company.industry && company.employeeCount && <span>-</span>}
                {company.employeeCount && <span>{company.employeeCount.toLocaleString()} employees</span>}
              </div>
            </div>
          </div>
          {!summaryOnly && (
            <div className="flex gap-2 items-center relative">
              {standaloneCalcs.length > 0 && (
                <div className="relative">
                  <Button variant="outline" size="sm" onClick={() => setShowLinkDropdown(!showLinkDropdown)}>
                    Link Existing
                  </Button>
                  {showLinkDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-background border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      <div className="p-2 text-xs text-muted-foreground border-b">Link a standalone calculator</div>
                      {standaloneCalcs.map((calc) => (
                        <button
                          key={calc._id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => handleLinkCalculator(calc._id)}
                        >
                          {calc.name}
                          {calc.role && <span className="text-xs text-muted-foreground ml-1 capitalize">({calc.role})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button onClick={handleAddCalculator} className="bg-[#FF4A00] hover:bg-[#CC3B00] text-white">
                + Add Calculator
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Annual Value</div>
                <div className="text-3xl font-bold text-[#FF4A00]">
                  {formatCurrencyCompact(aggregate.totalAnnualValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total ROI</div>
                <div className="text-3xl font-bold">
                  {aggregate.totalROI ? `${aggregate.totalROI}x` : "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Hours Saved / Month</div>
                <div className="text-3xl font-bold">{aggregate.totalHoursSavedPerMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Calculators</div>
                <div className="text-3xl font-bold">{aggregate.calculatorCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Dimension breakdown */}
          {aggregate.totalAnnualValue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Value by Dimension</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-6 rounded-full overflow-hidden mb-4">
                  {DIMENSION_ORDER.map((dim) => {
                    const total = aggregate.dimensionTotals[dim] ?? 0;
                    const pct = aggregate.totalAnnualValue > 0 ? (total / aggregate.totalAnnualValue) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={dim}
                        style={{ width: `${pct}%`, backgroundColor: DIMENSION_INFO[dim].color }}
                        title={`${DIMENSION_INFO[dim].label}: ${formatCurrency(Math.round(total))} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {DIMENSION_ORDER.map((dim) => {
                    const total = aggregate.dimensionTotals[dim] ?? 0;
                    if (total === 0) return null;
                    return (
                      <div key={dim} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: DIMENSION_INFO[dim].color }}
                        />
                        <div>
                          <div className="font-medium">{DIMENSION_INFO[dim].shortLabel}</div>
                          <div className="text-muted-foreground">{formatCurrencyCompact(Math.round(total))}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculator cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Calculators</h2>
            {aggregate.calculators.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground mb-4">No calculators yet</div>
                  {!summaryOnly && (
                    <Button onClick={handleAddCalculator} className="bg-[#FF4A00] hover:bg-[#CC3B00] text-white">
                      Create first calculator
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {aggregate.calculators.map((calc) => {
                  const dimColor = calc.primaryDimension
                    ? DIMENSION_INFO[calc.primaryDimension as Dimension]?.color
                    : "#FF4A00";
                  return (
                    <Card
                      key={calc.shortId}
                      className="cursor-pointer hover:border-[#FF4A00]/50 transition-colors"
                      onClick={() => navigate(`/c/${calc.shortId}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: dimColor }}
                            />
                            <div>
                              <CardTitle className="text-base">{calc.name}</CardTitle>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {calc.role && <span className="capitalize mr-2">{calc.role}</span>}
                                {calc.valueItemCount} value items - Updated {formatRelativeTime(calc.updatedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Value: </span>
                            <span className="font-semibold">{formatCurrencyCompact(calc.totalAnnualValue)}</span>
                          </div>
                          {calc.roiMultiple && (
                            <div>
                              <span className="text-muted-foreground">ROI: </span>
                              <span className="font-semibold">{calc.roiMultiple}x</span>
                            </div>
                          )}
                          {calc.hoursSavedPerMonth > 0 && (
                            <div>
                              <span className="text-muted-foreground">Hrs/mo: </span>
                              <span className="font-semibold">{calc.hoursSavedPerMonth}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Share URL */}
          {!summaryOnly && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Share URL</div>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {window.location.origin}/company/{company.shortId}/summary
                </code>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
