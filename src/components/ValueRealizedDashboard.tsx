import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem, UseCase } from "../types/roi";
import {
  computeRealizationSummary,
  HEALTH_STATUS_INFO,
  type ZapRunCacheEntry,
} from "../utils/value-realized";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatNumber,
} from "../utils/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ValueRealizedDashboardProps {
  calculation: Calculation;
  valueItems: ValueItem[];
  useCases: UseCase[];
}

interface ManualEntryForm {
  zapId: string;
  useCaseId: string;
  totalRuns: string;
  runsLast30Days: string;
  runsLast7Days: string;
  successfulRuns: string;
  failedRuns: string;
}

const EMPTY_ENTRY: ManualEntryForm = {
  zapId: "",
  useCaseId: "",
  totalRuns: "",
  runsLast30Days: "",
  runsLast7Days: "",
  successfulRuns: "",
  failedRuns: "",
};

function RealizationBar({ rate }: { rate: number }) {
  const pct = Math.min(rate * 100, 100);
  const color =
    rate >= 0.8 ? "#059669" : rate >= 0.5 ? "#D97706" : "#DC2626";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-10 text-right">
        {formatPercent(rate)}
      </span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: "increasing" | "stable" | "decreasing" }) {
  if (trend === "increasing") {
    return (
      <span className="text-green-600 text-sm" title="Increasing">
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 inline">
          <path d="M8 4l4 4H9v4H7V8H4l4-4z" />
        </svg>
      </span>
    );
  }
  if (trend === "decreasing") {
    return (
      <span className="text-red-600 text-sm" title="Decreasing">
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 inline">
          <path d="M8 12l-4-4h3V4h2v4h3l-4 4z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="text-muted-foreground text-sm" title="Stable">
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 inline">
        <path d="M3 7h10v2H3z" />
      </svg>
    </span>
  );
}

function ManualEntrySection({
  calculationId,
  useCases,
}: {
  calculationId: string;
  useCases: UseCase[];
}) {
  const [entries, setEntries] = useState<ManualEntryForm[]>([{ ...EMPTY_ENTRY }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const upsertRunData = useMutation(api.zapRunCache.upsertRunData);

  const updateEntry = (index: number, field: keyof ManualEntryForm, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index]!, [field]: value };
      return updated;
    });
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      for (const entry of entries) {
        if (!entry.zapId || !entry.useCaseId) continue;

        await upsertRunData({
          zapId: entry.zapId,
          useCaseId: entry.useCaseId as any,
          calculationId: calculationId as any,
          totalRuns: parseInt(entry.totalRuns) || 0,
          runsLast30Days: parseInt(entry.runsLast30Days) || 0,
          runsLast7Days: parseInt(entry.runsLast7Days) || 0,
          successfulRuns: parseInt(entry.successfulRuns) || 0,
          failedRuns: parseInt(entry.failedRuns) || 0,
        });
      }
      setMessage({ type: "success", text: "Run data saved successfully." });
      setEntries([{ ...EMPTY_ENTRY }]);
    } catch (err) {
      setMessage({ type: "error", text: `Failed to save: ${err instanceof Error ? err.message : "Unknown error"}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual Run Data Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Entry {index + 1}
              </span>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(index)}
                  className="text-red-500 hover:text-red-700 h-6 px-2"
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`zapId-${index}`} className="text-xs">
                  Zap ID
                </Label>
                <Input
                  id={`zapId-${index}`}
                  placeholder="e.g. 123456"
                  value={entry.zapId}
                  onChange={(e) => updateEntry(index, "zapId", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`useCaseId-${index}`} className="text-xs">
                  Use Case
                </Label>
                <select
                  id={`useCaseId-${index}`}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={entry.useCaseId}
                  onChange={(e) => updateEntry(index, "useCaseId", e.target.value)}
                >
                  <option value="">Select use case...</option>
                  {useCases.map((uc) => (
                    <option key={uc._id} value={uc._id}>
                      {uc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <Label htmlFor={`totalRuns-${index}`} className="text-xs">
                  Total Runs
                </Label>
                <Input
                  id={`totalRuns-${index}`}
                  type="number"
                  placeholder="0"
                  value={entry.totalRuns}
                  onChange={(e) => updateEntry(index, "totalRuns", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`runs30-${index}`} className="text-xs">
                  Runs (30d)
                </Label>
                <Input
                  id={`runs30-${index}`}
                  type="number"
                  placeholder="0"
                  value={entry.runsLast30Days}
                  onChange={(e) => updateEntry(index, "runsLast30Days", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`runs7-${index}`} className="text-xs">
                  Runs (7d)
                </Label>
                <Input
                  id={`runs7-${index}`}
                  type="number"
                  placeholder="0"
                  value={entry.runsLast7Days}
                  onChange={(e) => updateEntry(index, "runsLast7Days", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`success-${index}`} className="text-xs">
                  Successful
                </Label>
                <Input
                  id={`success-${index}`}
                  type="number"
                  placeholder="0"
                  value={entry.successfulRuns}
                  onChange={(e) => updateEntry(index, "successfulRuns", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`failed-${index}`} className="text-xs">
                  Failed
                </Label>
                <Input
                  id={`failed-${index}`}
                  type="number"
                  placeholder="0"
                  value={entry.failedRuns}
                  onChange={(e) => updateEntry(index, "failedRuns", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addEntry}>
            + Add Entry
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || entries.every((e) => !e.zapId || !e.useCaseId)}
          >
            {saving ? "Saving..." : "Save Run Data"}
          </Button>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ValueRealizedDashboard({
  calculation,
  valueItems,
  useCases,
}: ValueRealizedDashboardProps) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Fetch live zap run cache from Convex
  const zapRunCacheRaw = useQuery(api.zapRunCache.getByCalculation, {
    calculationId: calculation._id as any,
  });

  // Convert Convex data to the ZapRunCacheEntry type expected by computeRealizationSummary
  const zapRunCache: ZapRunCacheEntry[] = (zapRunCacheRaw ?? []).map((entry) => ({
    zapId: entry.zapId,
    useCaseId: entry.useCaseId,
    totalRuns: entry.totalRuns,
    runsLast30Days: entry.runsLast30Days,
    runsLast7Days: entry.runsLast7Days,
    successfulRuns: entry.successfulRuns,
    failedRuns: entry.failedRuns,
    lastRunAt: entry.lastRunAt,
    fetchedAt: entry.fetchedAt,
  }));

  const summary = computeRealizationSummary(useCases, valueItems, zapRunCache);

  const handleRefresh = () => {
    setRefreshMessage("Refresh queued. API-based auto-refresh coming soon.");
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  // Empty state: no linked Zaps at all
  if (!summary.hasAnyLinkedZaps && zapRunCache.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4 text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No Zaps Linked Yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Link Zaps to your use cases to start tracking value realization,
              or manually enter run data below.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualEntry(true)}
            >
              Enter Run Data Manually
            </Button>
          </CardContent>
        </Card>

        {showManualEntry && (
          <ManualEntrySection
            calculationId={calculation._id}
            useCases={useCases}
          />
        )}
      </div>
    );
  }

  const rateColor =
    summary.overallRealizationRate >= 0.8
      ? "text-green-600"
      : summary.overallRealizationRate >= 0.5
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Value Realized</h2>
          <p className="text-muted-foreground text-sm">
            Comparing actual Zap runs against projected automation value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualEntry((prev) => !prev)}
          >
            {showManualEntry ? "Hide Entry Form" : "Enter Data"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh Run Data
          </Button>
        </div>
      </div>

      {refreshMessage && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          {refreshMessage}
        </p>
      )}

      {/* Manual Entry */}
      {showManualEntry && (
        <ManualEntrySection
          calculationId={calculation._id}
          useCases={useCases}
        />
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Projected Value
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {formatCurrencyCompact(summary.projectedAnnualValue)}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Annual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Realized Value
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {summary.hasAnyRunData
                ? formatCurrencyCompact(summary.realizedAnnualValue)
                : "--"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {summary.hasAnyRunData ? "Annual (from run data)" : "No run data yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Realization Rate
            </p>
            <p className={`text-2xl sm:text-3xl font-bold font-mono ${rateColor}`}>
              {summary.hasAnyRunData
                ? formatPercent(summary.overallRealizationRate)
                : "--"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {summary.hasAnyRunData
                ? "Actual vs. projected"
                : "No run data yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Zap Runs (30d)
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {summary.hasAnyRunData
                ? formatNumber(summary.totalRunsLast30Days)
                : "--"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {summary.hasAnyRunData
                ? "Across all linked Zaps"
                : "No run data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Use-Case Table */}
      <Card>
        <CardHeader>
          <CardTitle>Use Case Realization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground pr-4">
                    Use Case
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground px-2">
                    Projected
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground px-2">
                    Realized
                  </th>
                  <th className="py-2 text-sm font-medium text-muted-foreground px-2 w-[160px]">
                    Realization
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground px-2">
                    Runs (30d)
                  </th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground px-2">
                    Trend
                  </th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground pl-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.useCases.map((uc) => {
                  const statusInfo = HEALTH_STATUS_INFO[uc.healthStatus];
                  return (
                    <tr key={uc.useCaseId} className="border-b last:border-0">
                      <td className="py-3 text-sm font-medium pr-4">
                        {uc.useCaseName}
                      </td>
                      <td className="text-right py-3 font-mono text-sm px-2">
                        {formatCurrency(uc.projectedAnnualValue)}
                      </td>
                      <td className="text-right py-3 font-mono text-sm px-2">
                        {uc.hasRunData
                          ? formatCurrency(uc.realizedAnnualValue)
                          : "--"}
                      </td>
                      <td className="py-3 px-2">
                        {uc.hasRunData ? (
                          <RealizationBar rate={uc.realizationRate} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No run data
                          </span>
                        )}
                      </td>
                      <td className="text-right py-3 font-mono text-sm px-2">
                        {uc.hasRunData
                          ? formatNumber(uc.actualRunsLast30Days)
                          : "--"}
                      </td>
                      <td className="text-center py-3 px-2">
                        {uc.hasRunData ? (
                          <TrendIndicator trend={uc.trend} />
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="text-center py-3 pl-2">
                        <span
                          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            color: statusInfo.color,
                            backgroundColor: statusInfo.bgColor,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {summary.useCases.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              No use cases found. Add use cases in the Use Cases tab.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
