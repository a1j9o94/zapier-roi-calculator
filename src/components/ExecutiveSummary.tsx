import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem } from "../types/roi";
import {
  calculateTotalAnnualValue,
  calculateProjection,
  calculateROIMultiple,
  getCategoryBreakdown,
  calculateTotalHoursSaved,
} from "../utils/calculations";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMultiple,
  formatNumber,
  formatPercent,
} from "../utils/formatting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ExecutiveSummaryProps {
  calculation: Calculation;
  valueItems: ValueItem[];
}

export function ExecutiveSummary({
  calculation,
  valueItems,
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{calculation.name}</h2>
          <p className="text-muted-foreground">ROI Analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyToClipboard}>
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
          <Button
            variant="outline"
            onClick={() => alert("PDF export coming soon!")}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#FF4A00] to-[#FF6B33] text-white">
          <CardContent className="pt-6">
            <p className="text-white/80 text-sm font-medium">Annual Value</p>
            <p className="text-3xl font-bold font-mono">
              {formatCurrencyCompact(totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Incremental Investment
            </p>
            <p className="text-3xl font-bold font-mono">
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
            <p className="text-3xl font-bold font-mono text-[#FF4A00]">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground"></th>
                  {projections.map((p) => (
                    <th
                      key={p.year}
                      className="text-right py-2 text-sm font-medium"
                    >
                      Year {p.year}
                    </th>
                  ))}
                  <th className="text-right py-2 text-sm font-medium text-[#FF4A00]">
                    {calculation.assumptions.projectionYears}-Year Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-sm">Value</td>
                  {projections.map((p) => (
                    <td key={p.year} className="text-right py-3 font-mono">
                      {formatCurrencyCompact(p.value)}
                    </td>
                  ))}
                  <td className="text-right py-3 font-mono font-medium">
                    {formatCurrencyCompact(
                      projections.reduce((sum, p) => sum + p.value, 0)
                    )}
                  </td>
                </tr>
                {incrementalInvestment > 0 && (
                  <>
                    <tr className="border-b">
                      <td className="py-3 text-sm">Investment</td>
                      {projections.map((p) => (
                        <td
                          key={p.year}
                          className="text-right py-3 font-mono text-muted-foreground"
                        >
                          {formatCurrencyCompact(p.investment)}
                        </td>
                      ))}
                      <td className="text-right py-3 font-mono text-muted-foreground">
                        {formatCurrencyCompact(
                          projections.reduce((sum, p) => sum + p.investment, 0)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm font-medium">Net Value</td>
                      {projections.map((p) => (
                        <td
                          key={p.year}
                          className="text-right py-3 font-mono font-medium text-[#FF4A00]"
                        >
                          {formatCurrencyCompact(p.netValue)}
                        </td>
                      ))}
                      <td className="text-right py-3 font-mono font-bold text-[#FF4A00]">
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

      {/* Key Talking Points */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Key Talking Points</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleAddTalkingPoint}>
              + Add Point
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(calculation.talkingPoints ?? []).map((point, index) => (
              <div key={index} className="flex items-start gap-2 group">
                <span className="text-[#FF4A00] mt-2">•</span>
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
