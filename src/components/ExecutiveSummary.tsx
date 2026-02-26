import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem, UseCase, UseCaseStatus } from "../types/roi";
import { DIMENSION_INFO, USE_CASE_STATUS_INFO } from "../types/roi";
import {
  calculateSummary,
  calculateItemAnnualValue,
  getDimensionBreakdown,
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
  useCases: UseCase[];
  readOnly?: boolean;
  obfuscated?: boolean;
}

function obfuscateValue(value: number): number {
  if (value >= 1_000_000) return Math.round(value / 100_000) * 100_000;
  if (value >= 100_000) return Math.round(value / 10_000) * 10_000;
  if (value >= 10_000) return Math.round(value / 1_000) * 1_000;
  return Math.round(value / 100) * 100;
}

export function ExecutiveSummary({
  calculation,
  valueItems,
  useCases,
  readOnly = false,
  obfuscated = false,
}: ExecutiveSummaryProps) {
  const [copied, setCopied] = useState(false);
  const updateTalkingPoints = useMutation(api.calculations.updateTalkingPoints);

  const proposedSpend = calculation.proposedSpend ?? 0;

  const summary = calculateSummary(
    valueItems,
    calculation.assumptions,
    proposedSpend
  );

  const dimensionBreakdown = getDimensionBreakdown(valueItems);

  const fmt = (v: number) => obfuscated ? formatCurrencyCompact(obfuscateValue(v)) : formatCurrencyCompact(v);
  const fmtFull = (v: number) => obfuscated ? formatCurrency(obfuscateValue(v)) : formatCurrency(v);

  // Use case stats
  const useCaseStats = useCases.length > 0
    ? {
        total: useCases.length,
        byStatus: (["identified", "in_progress", "deployed", "future"] as UseCaseStatus[]).map((status) => {
          const casesWithStatus = useCases.filter((uc) => uc.status === status);
          const linkedValue = casesWithStatus.reduce((sum, uc) => {
            const linked = valueItems.filter((item) => item.useCaseId === uc._id);
            return sum + linked.reduce((s, item) => s + calculateItemAnnualValue(item), 0);
          }, 0);
          return { status, count: casesWithStatus.length, value: linkedValue };
        }).filter((s) => s.count > 0),
      }
    : null;

  const handleCopyToClipboard = async () => {
    const lines = [
      `${calculation.name} - ROI Analysis`,
      "",
      `Total Annual Value: ${fmtFull(summary.totalAnnualValue)}`,
      `Annual Investment: ${fmtFull(totalInvestment)}`,
      summary.roiMultiple ? `ROI Multiple: ${formatMultiple(summary.roiMultiple)}` : "",
      "",
      "Value by Dimension:",
      ...dimensionBreakdown.map(
        (d) => `  - ${d.label}: ${fmtFull(d.total)} (${formatPercent(d.percentage / 100)})`
      ),
      "",
      `Hours Saved / Month: ${formatNumber(Math.round(summary.hoursSavedPerMonth))}`,
      `FTE Equivalent: ${summary.fteEquivalent.toFixed(1)}`,
      "",
      ...(calculation.talkingPoints ?? []).length > 0
        ? ["Key Talking Points:", ...(calculation.talkingPoints ?? []).map((p) => `  - ${p}`)]
        : [],
    ];
    await navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTalkingPointChange = (index: number, value: string) => {
    const newPoints = [...(calculation.talkingPoints ?? [])];
    newPoints[index] = value;
    updateTalkingPoints({ id: calculation._id, talkingPoints: newPoints });
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
    updateTalkingPoints({ id: calculation._id, talkingPoints: newPoints });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{calculation.name}</h2>
          <p className="text-muted-foreground">ROI Analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
          <Button variant="outline" size="sm" disabled>
            Export PDF
          </Button>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#FF4A00] to-[#FF6B33] text-white">
          <CardContent className="pt-6">
            <p className="text-white/80 text-sm font-medium">Total Annual Value</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {fmt(summary.totalAnnualValue)}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {dimensionBreakdown.length} dimension{dimensionBreakdown.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">Annual Investment</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {proposedSpend > 0 ? fmt(proposedSpend) : "\u2014"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">ROI Multiple</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-[#FF4A00]">
              {summary.roiMultiple ? formatMultiple(summary.roiMultiple) : "\u2014"}
            </p>
            {summary.roiMultiple && (
              <p className="text-muted-foreground text-xs mt-1">X return</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Value by Dimension */}
      <Card>
        <CardHeader>
          <CardTitle>Value by Dimension</CardTitle>
        </CardHeader>
        <CardContent>
          {dimensionBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Add value items to see the breakdown
            </p>
          ) : (
            <div className="space-y-3">
              {dimensionBreakdown.map((dim) => (
                <div key={dim.dimension} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dim.label}</span>
                    <span className="font-mono">
                      {fmtFull(dim.total)} ({formatPercent(dim.percentage / 100)})
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${dim.percentage}%`, backgroundColor: dim.color }}
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
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground whitespace-nowrap pr-4" />
                  {summary.projection.map((p) => (
                    <th key={p.year} className="text-right py-2 text-sm font-medium whitespace-nowrap px-2">
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
                  {summary.projection.map((p) => (
                    <td key={p.year} className="text-right py-3 font-mono whitespace-nowrap px-2">
                      {fmt(p.value)}
                    </td>
                  ))}
                  <td className="text-right py-3 font-mono font-medium whitespace-nowrap pl-2">
                    {fmt(summary.projection[summary.projection.length - 1]?.cumulativeValue ?? 0)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm whitespace-nowrap pr-4">Investment</td>
                  {summary.projection.map((p) => (
                    <td key={p.year} className="text-right py-3 font-mono text-muted-foreground whitespace-nowrap px-2">
                      {fmt(p.investment)}
                    </td>
                  ))}
                  <td className="text-right py-3 font-mono text-muted-foreground whitespace-nowrap pl-2">
                    {fmt(summary.projection[summary.projection.length - 1]?.cumulativeInvestment ?? 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm font-medium whitespace-nowrap pr-4">Net Value</td>
                  {summary.projection.map((p) => (
                    <td key={p.year} className="text-right py-3 font-mono font-medium text-[#FF4A00] whitespace-nowrap px-2">
                      {fmt(p.netValue)}
                    </td>
                  ))}
                  <td className="text-right py-3 font-mono font-bold text-[#FF4A00] whitespace-nowrap pl-2">
                    {fmt(summary.projection[summary.projection.length - 1]?.cumulativeNetValue ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Hours Saved / Month</p>
              <p className="text-2xl font-bold font-mono">
                {formatNumber(Math.round(summary.hoursSavedPerMonth))}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">FTE Equivalent</p>
              <p className="text-2xl font-bold font-mono">
                {summary.fteEquivalent.toFixed(1)}
              </p>
            </div>
            {useCaseStats && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Use Cases</p>
                <p className="text-2xl font-bold font-mono">{useCaseStats.total}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {useCaseStats.byStatus.map(({ status, count }) => {
                    const info = USE_CASE_STATUS_INFO[status];
                    return (
                      <span key={status} className="text-xs" style={{ color: info.color }}>
                        {count} {info.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Talking Points */}
      {!(obfuscated && (calculation.talkingPoints ?? []).length === 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Key Talking Points</CardTitle>
              {!readOnly && !obfuscated && (
                <Button variant="ghost" size="sm" onClick={handleAddTalkingPoint}>
                  + Add Point
                </Button>
              )}
            </div>
          </CardHeader>
          {!obfuscated && (
            <CardContent>
              <div className="space-y-3">
                {(calculation.talkingPoints ?? []).length === 0 && readOnly && (
                  <p className="text-muted-foreground text-sm">No talking points added.</p>
                )}
                {(calculation.talkingPoints ?? []).map((point, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <span className="text-[#FF4A00] mt-2">&bull;</span>
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
