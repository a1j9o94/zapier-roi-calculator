// ============================================================
// ValueRealizedBadge — Compact inline badge for use case cards
// Shows realization status color-coded: healthy/warning/at_risk
// When zapRunCache is empty, shows "Linked" for any linked Zaps
// ============================================================

import { computeRealization, HEALTH_STATUS_INFO, type ZapRunCacheEntry } from "../utils/value-realized";
import { formatPercent } from "../utils/formatting";
import type { UseCase, ValueItem } from "../types/roi";

interface ValueRealizedBadgeProps {
  useCase: UseCase;
  valueItems: ValueItem[];
  zapRunCache?: ZapRunCacheEntry[];
}

export function ValueRealizedBadge({
  useCase,
  valueItems,
  zapRunCache = [],
}: ValueRealizedBadgeProps) {
  const hasLinkedZaps = useCase.architecture?.some(
    (a) => a.type === "zap" && (a.zapId || a.url),
  );

  const ucRunData = zapRunCache.filter((r) => r.useCaseId === useCase._id);

  // Nothing to show if no Zaps linked and no run data
  if (!hasLinkedZaps && ucRunData.length === 0) return null;

  // Has linked Zaps but no run data yet — show neutral "Linked" badge
  if (!hasLinkedZaps || ucRunData.length === 0) {
    const zapCount = (useCase.architecture ?? []).filter(
      (a) => a.type === "zap",
    ).length;

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground"
        title={`${zapCount} Zap${zapCount !== 1 ? "s" : ""} linked — no run data yet`}
      >
        <ZapIcon />
        {zapCount > 1 ? `${zapCount} Zaps` : "Linked"}
      </span>
    );
  }

  // Has both linked Zaps AND run data — show realization rate
  const linkedItems = valueItems.filter((vi) => vi.useCaseId === useCase._id);
  const realized = computeRealization(useCase, linkedItems, ucRunData);
  const statusInfo = HEALTH_STATUS_INFO[realized.healthStatus];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}
      title={`${statusInfo.label}: ${formatPercent(realized.realizationRate)} of projected value realized (${realized.actualRunsLast30Days} runs/30d)`}
    >
      <ZapIcon />
      {formatPercent(realized.realizationRate)}
    </span>
  );
}

function ZapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="w-2.5 h-2.5"
    >
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
