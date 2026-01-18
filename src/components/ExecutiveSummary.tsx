import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem, UseCase, UseCaseStatus } from "../types/roi";
import { USE_CASE_STATUS_INFO } from "../types/roi";
import {
  calculateTotalAnnualValue,
  calculateProjection,
  calculateROIMultiple,
  getCategoryBreakdown,
  calculateTotalHoursSaved,
  calculateItemAnnualValue,
} from "../utils/calculations";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMultiple,
  formatNumber,
  formatPercent,
} from "../utils/formatting";
import { generateExecutiveSummaryPDF } from "../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ExecutiveSummaryProps {
  calculation: Calculation;
  valueItems: ValueItem[];
  readOnly?: boolean;
}

export function ExecutiveSummary({
  calculation,
  valueItems,
  readOnly = false,
}: ExecutiveSummaryProps) {
  const [copied, setCopied] = useState(false);
  const updateTalkingPoints = useMutation(api.calculations.updateTalkingPoints);

  const totalValue = calculateTotalAnnualValue(
    valueItems,
    calculation.assumptions
  );
  const currentSpend = calculation.currentSpend ?? 0;
  const proposedSpend = calculation.proposedSpend ?? 0;
  const incrementalInvestment = proposedSpend - currentSpend;
  const roiMultiple = calculateROIMultiple(totalValue, currentSpend, proposedSpend);
  const breakdown = getCategoryBreakdown(valueItems, calculation.assumptions);
  const projections = calculateProjection(
    totalValue,
    calculation.assumptions,
    currentSpend,
    proposedSpend
  );
  const totalHoursSaved = calculateTotalHoursSaved(
    valueItems,
    calculation.assumptions
  );

  // Query use cases for pipeline summary
  const useCases = useQuery(api.useCases.listByCalculation, {
    calculationId: calculation._id,
  });

  // Calculate use case statistics
  const useCaseStats = useCases
    ? {
        total: useCases.length,
        byStatus: (["identified", "in_progress", "deployed", "future"] as UseCaseStatus[]).map((status) => {
          const casesWithStatus = useCases.filter((uc) => uc.status === status);
          const linkedValue = casesWithStatus.reduce((sum, uc) => {
            const linkedItems = valueItems.filter((item) => item.useCaseId === uc._id);
            return sum + linkedItems.reduce((s, item) => s + calculateItemAnnualValue(item, calculation.assumptions), 0);
          }, 0);
          return {
            status,
            count: casesWithStatus.length,
            value: linkedValue,
          };
        }).filter((s) => s.count > 0),
      }
    : null;

  const handleCopyToClipboard = async () => {
    const text = generateSummaryText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSummaryText = () => {
    const lines = [
      `${calculation.name} - ROI Analysis`,
      "",
      `Total Annual Value: ${formatCurrency(totalValue)}`,
      `Incremental Investment: ${formatCurrency(incrementalInvestment)}`,
      roiMultiple ? `ROI Multiple: ${formatMultiple(roiMultiple)}` : "",
      "",
      "Value Breakdown:",
      ...breakdown.map(
        (b) => `  - ${b.label}: ${formatCurrency(b.value)} (${formatPercent(b.percentage / 100)})`
      ),
      "",
      "Multi-Year Projection:",
      ...projections.map(
        (p) =>
          `  Year ${p.year}: ${formatCurrency(p.value)} value, ${formatCurrency(p.netValue)} net`
      ),
      "",
      "Key Talking Points:",
      ...(calculation.talkingPoints ?? []).map((point) => `  • ${point}`),
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleTalkingPointChange = (index: number, value: string) => {
    const newPoints = [...(calculation.talkingPoints ?? [])];
    newPoints[index] = value;
    updateTalkingPoints({
      id: calculation._id,
      talkingPoints: newPoints,
    });
  };

  const handleAddTalkingPoint = () => {
    updateTalkingPoints({
      id: calculation._id,
      talkingPoints: [...(calculation.talkingPoints ?? []), "New talking point"],
    });
  };

  const handleRemoveTalkingPoint = (index: number) => {
    const newPoints = [...(calculation.talkingPoints ?? [])];
    newPoints.splice(index, 1);
    updateTalkingPoints({
      id: calculation._id,
      talkingPoints: newPoints,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{calculation.name}</h2>
          <p className="text-muted-foreground">ROI Analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateExecutiveSummaryPDF(calculation, valueItems)}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#FF4A00] to-[#FF6B33] text-white">
          <CardContent className="pt-6">
            <p className="text-white/80 text-sm font-medium">Annual Value</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {formatCurrencyCompact(totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Incremental Investment
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {incrementalInvestment > 0
                ? formatCurrencyCompact(incrementalInvestment)
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              ROI Multiple
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#FF4A00]">
              {roiMultiple ? formatMultiple(roiMultiple) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Value Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Value Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Add value items to see the breakdown
            </p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono">
                      {formatCurrency(item.value)} ({formatPercent(item.percentage / 100)})
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Year Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Year Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground whitespace-nowrap pr-4"></th>
                  {projections.map((p) => (
                    <th
                      key={p.year}
                      className="text-right py-2 text-sm font-medium whitespace-nowrap px-2"
                    >
                      Year {p.year}
                    </th>
                  ))}
                  <th className="text-right py-2 text-sm font-medium text-[#FF4A00] whitespace-nowrap pl-2">
                    {calculation.assumptions.projectionYears}-Year Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-sm whitespace-nowrap pr-4">Value</td>
                  {projections.map((p) => (
                    <td key={p.year} className="text-right py-3 font-mono whitespace-nowrap px-2">
                      {formatCurrencyCompact(p.value)}
                    </td>
                  ))}
                  <td className="text-right py-3 font-mono font-medium whitespace-nowrap pl-2">
                    {formatCurrencyCompact(
                      projections.reduce((sum, p) => sum + p.value, 0)
                    )}
                  </td>
                </tr>
                {incrementalInvestment > 0 && (
                  <>
                    <tr className="border-b">
                      <td className="py-3 text-sm whitespace-nowrap pr-4">Investment</td>
                      {projections.map((p) => (
                        <td
                          key={p.year}
                          className="text-right py-3 font-mono text-muted-foreground whitespace-nowrap px-2"
                        >
                          {formatCurrencyCompact(p.investment)}
                        </td>
                      ))}
                      <td className="text-right py-3 font-mono text-muted-foreground whitespace-nowrap pl-2">
                        {formatCurrencyCompact(
                          projections.reduce((sum, p) => sum + p.investment, 0)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm font-medium whitespace-nowrap pr-4">Net Value</td>
                      {projections.map((p) => (
                        <td
                          key={p.year}
                          className="text-right py-3 font-mono font-medium text-[#FF4A00] whitespace-nowrap px-2"
                        >
                          {formatCurrencyCompact(p.netValue)}
                        </td>
                      ))}
                      <td className="text-right py-3 font-mono font-bold text-[#FF4A00] whitespace-nowrap pl-2">
                        {formatCurrencyCompact(
                          projections.reduce((sum, p) => sum + p.netValue, 0)
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {totalHoursSaved > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Hours Saved per Month
                </p>
                <p className="text-2xl font-bold font-mono">
                  {formatNumber(Math.round(totalHoursSaved))}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  FTE Equivalent per Year
                </p>
                <p className="text-2xl font-bold font-mono">
                  {((totalHoursSaved * 12) / 2080).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Use Case Pipeline */}
      {useCaseStats && useCaseStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Use Case Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{useCaseStats.total} use cases documented</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {useCaseStats.byStatus.map(({ status, count, value }) => {
                  const info = USE_CASE_STATUS_INFO[status];
                  return (
                    <div
                      key={status}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: info.bgColor }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: info.color }}
                        >
                          {info.label}
                        </span>
                      </div>
                      <p className="text-xl font-bold" style={{ color: info.color }}>
                        {count}
                      </p>
                      {value > 0 && (
                        <p className="text-xs font-mono" style={{ color: info.color }}>
                          {formatCurrencyCompact(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Financial Metrics from Use Cases */}
      {useCases && useCases.some((uc) => uc.metrics && uc.metrics.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Impact Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {useCases
                .filter((uc) => uc.metrics && uc.metrics.length > 0)
                .map((uc) => (
                  <div key={uc._id} className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {uc.name}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {uc.metrics!
                        .filter((m) => m.name && (m.before || m.after))
                        .map((metric, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-muted rounded-lg"
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              {metric.name}
                            </p>
                            <div className="flex items-center gap-2">
                              {metric.before && (
                                <span className="text-sm font-mono">
                                  {metric.before}
                                </span>
                              )}
                              {metric.before && metric.after && (
                                <span className="text-muted-foreground">→</span>
                              )}
                              {metric.after && (
                                <span className="text-sm font-mono font-medium text-[#FF4A00]">
                                  {metric.after}
                                </span>
                              )}
                            </div>
                            {metric.improvement && (
                              <p className="text-xs text-[#10B981] font-medium mt-1">
                                {metric.improvement}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Talking Points */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Key Talking Points</CardTitle>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={handleAddTalkingPoint}>
                + Add Point
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(calculation.talkingPoints ?? []).map((point, index) => (
              <div key={index} className="flex items-start gap-2 group">
                <span className="text-[#FF4A00] mt-2">•</span>
                {readOnly ? (
                  <p className="flex-1 py-2 text-sm">{point}</p>
                ) : (
                  <>
                    <Textarea
                      value={point}
                      onChange={(e) => handleTalkingPointChange(index, e.target.value)}
                      className="flex-1 min-h-[40px] resize-none"
                      rows={1}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTalkingPoint(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
