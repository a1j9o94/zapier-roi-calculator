// ============================================================
// ZapTemplateSuggestions — Template suggestions based on archetypes
// Surfaces Zap bundle templates relevant to the value items linked
// to a use case. Lightweight alternative to full ZapTemplateGallery.
// ============================================================

import type { Archetype } from "../types/roi";
import {
  getTemplatesForArchetype,
  recommendZapArchitecture,
} from "../utils/zap-recommender";
import {
  generateZapTemplate,
  downloadTemplate,
  generatePrefillUrlFromTemplate,
} from "../utils/zap-template-generator";
import type { ZapBundleConfig } from "../utils/zap-template-generator";
import { Button } from "@/components/ui/button";

interface ZapTemplateSuggestionsProps {
  archetypes: Archetype[];
  useCaseName?: string;
  maxTemplates?: number;
}

export function ZapTemplateSuggestions({
  archetypes,
  useCaseName,
  maxTemplates = 3,
}: ZapTemplateSuggestionsProps) {
  // Collect unique templates from bundle catalog first
  const seen = new Set<string>();
  const bundleTemplates: ZapBundleConfig[] = [];

  for (const archetype of archetypes) {
    const atTemplates = getTemplatesForArchetype(archetype);
    for (const t of atTemplates) {
      if (!seen.has(t.title)) {
        seen.add(t.title);
        bundleTemplates.push(t);
      }
    }
  }

  // If no bundle templates, fall back to archetype recommendation patterns
  const fallbackTemplates: ZapBundleConfig[] = [];
  if (bundleTemplates.length === 0 && archetypes.length > 0) {
    for (const archetype of archetypes) {
      const recommendations = recommendZapArchitecture(archetype, {
        name: useCaseName ?? archetype,
      });
      for (const rec of recommendations) {
        if (!seen.has(rec.title)) {
          seen.add(rec.title);
          fallbackTemplates.push({
            title: rec.title,
            description: rec.description,
            steps: rec.steps.map((s) => ({
              app: s.suggestedApp,
              action: s.action,
              stepTitle: s.actionTitle,
              type: "action" as const,
            })),
          });
        }
      }
    }
  }

  const templates = [...bundleTemplates, ...fallbackTemplates].slice(
    0,
    maxTemplates,
  );

  if (templates.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        Suggested Templates ({templates.length})
      </label>
      <div className="space-y-2">
        {templates.map((template, idx) => (
          <TemplateSuggestionRow key={`${template.title}-${idx}`} config={template} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TemplateSuggestionRow — compact template card
// ============================================================

function TemplateSuggestionRow({ config }: { config: ZapBundleConfig }) {
  const handleDownload = () => {
    const tmpl = generateZapTemplate(config);
    const filename = config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadTemplate(tmpl, `${filename}.json`);
  };

  const prefillUrl = generatePrefillUrlFromTemplate(config);

  return (
    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
      <div>
        <p className="text-sm font-medium leading-tight">{config.title}</p>
        {config.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {config.description}
          </p>
        )}
      </div>

      {/* Step flow preview */}
      {config.steps.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto">
          {config.steps.map((step, si) => (
            <div key={si} className="flex items-center gap-1 shrink-0">
              {si > 0 && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-3 h-3 text-muted-foreground"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border text-[10px] whitespace-nowrap">
                <span>{step.app}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleDownload}
        >
          Download Template
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
          <a href={prefillUrl} target="_blank" rel="noopener noreferrer">
            Open in Zapier Editor
          </a>
        </Button>
      </div>
    </div>
  );
}
