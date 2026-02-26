// ============================================================
// ZapTemplateGallery — Template browser for Zap bundles
// Shows templates for a given archetype or pattern, with
// download and prefill URL actions.
// ============================================================

import { useState } from "react";
import type { Archetype } from "../types/roi";
import { getTemplatesForArchetype, getTemplateForPattern } from "../utils/zap-recommender";
import { generateZapTemplate, downloadTemplate, generatePrefillUrlFromTemplate } from "../utils/zap-template-generator";
import type { ZapBundleConfig } from "../utils/zap-template-generator";
import { resolveAppKey } from "../utils/zapier-sdk-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ZapTemplateGalleryProps {
  archetype?: Archetype;
  patternId?: string;
  title?: string;
}

export function ZapTemplateGallery({ archetype, patternId, title }: ZapTemplateGalleryProps) {
  const [filter, setFilter] = useState("");

  // Gather templates from either pattern or archetype
  let templates: ZapBundleConfig[] = [];
  if (patternId) {
    templates = getTemplateForPattern(patternId) ?? [];
  }
  if (archetype && templates.length === 0) {
    templates = getTemplatesForArchetype(archetype);
  }

  // Apply text filter
  const filtered = filter
    ? templates.filter(
        (t) =>
          t.title.toLowerCase().includes(filter.toLowerCase()) ||
          t.steps.some((s) => s.app.toLowerCase().includes(filter.toLowerCase())),
      )
    : templates;

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title ?? "Zap Templates"} ({filtered.length})
        </h4>
        {templates.length > 3 && (
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or app..."
            className="h-7 px-2 text-xs rounded-md border border-input bg-transparent w-48 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((template, idx) => (
          <TemplateCard key={`${template.title}-${idx}`} config={template} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TemplateCard — Individual template card
// ============================================================

function TemplateCard({ config }: { config: ZapBundleConfig }) {
  const handleDownload = () => {
    const template = generateZapTemplate(config);
    const filename = config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadTemplate(template, `${filename}.json`);
  };

  const prefillUrl = generatePrefillUrlFromTemplate(config);

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div>
          <p className="text-sm font-medium leading-tight">{config.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{config.description}</p>
        </div>

        {/* Step flow preview */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {config.steps.map((step, si) => (
            <div key={si} className="flex items-center gap-1 shrink-0">
              {si > 0 && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-muted-foreground shrink-0">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
              <StepPill app={step.app} stepTitle={step.stepTitle} type={step.type} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download JSON
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <a href={prefillUrl} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open in Zapier
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// StepPill — Compact step badge
// ============================================================

const TYPE_COLORS: Record<string, string> = {
  trigger: "#FF4A00",
  action: "#3B82F6",
  search: "#8B5CF6",
  filter: "#F59E0B",
};

function StepPill({ app, stepTitle, type }: { app: string; stepTitle: string; type: string }) {
  const borderColor = TYPE_COLORS[type] ?? "#999";

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-background border whitespace-nowrap"
      style={{ borderColor: `${borderColor}40` }}
      title={`${stepTitle} (${type})`}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: borderColor }} />
      <span className="truncate max-w-[90px]">{app}</span>
    </div>
  );
}
