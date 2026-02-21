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

interface ValueRealizedDashboardProps {
  calculation: Calculation;
  valueItems: ValueItem[];
  useCases: UseCase[];
}

// Placeholder: in production, this would come from Convex or local cache
function getZapRunCache(_useCases: UseCase[]): ZapRunCacheEntry[] {
  return [];
}

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

export function ValueRealizedDashboard({
  calculation: _calculation,
  valueItems,
  useCases,
}: ValueRealizedDashboardProps) {
  const zapRunCache = getZapRunCache(useCases);
  const summary = computeRealizationSummary(useCases, valueItems, zapRunCache);

  // Empty state: no linked Zaps at all
  if (!summary.hasAnyLinkedZaps) {
    return (
      <div className="max-w-4xl mx-auto">
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
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Link Zaps to your use cases to start tracking value realization.
              Go to the Use Cases tab to add Zap architecture.
            </p>
          </CardContent>
        </Card>
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
        <Button variant="outline" size="sm" disabled>
          Refresh Run Data
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                ? "Actual vs. projected value"
                : "No run data yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Projected vs. Realized
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono">
                {formatCurrencyCompact(summary.realizedAnnualValue)}
              </p>
              <p className="text-muted-foreground text-sm">
                / {formatCurrencyCompact(summary.projectedAnnualValue)}
              </p>
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              Annual value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm font-medium">
              Zap Runs (30 days)
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
