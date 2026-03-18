import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  METHODOLOGY_DATA,
  type ArchetypeEvidence,
  type StudyReference,
} from "@/data/methodology";

const DIMENSIONS = [
  { name: "Revenue", color: "#32372C", count: 4 },
  { name: "Productivity", color: "#FF4F00", count: 5 },
  { name: "Cost", color: "#8B5CF6", count: 3 },
  { name: "Risk", color: "#E46962", count: 4 },
];

function DimensionBadge({ dimension, color }: { dimension: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {dimension}
    </span>
  );
}

function CoverageBadge({ status }: { status: "GREEN" | "YELLOW" | "NA" }) {
  const styles = {
    GREEN: "bg-emerald-100 text-emerald-800",
    YELLOW: "bg-amber-100 text-amber-800",
    NA: "bg-gray-100 text-gray-500",
  };
  const labels = { GREEN: "Strong", YELLOW: "Moderate", NA: "N/A" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800",
    B: "bg-blue-100 text-blue-800",
    C: "bg-amber-100 text-amber-800",
    D: "bg-gray-100 text-gray-500",
    benchmarked: "bg-emerald-100 text-emerald-800",
    estimated: "bg-amber-100 text-amber-800",
    custom: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[tier] ?? "bg-gray-100 text-gray-500"}`}>
      {tier}
    </span>
  );
}

function StudyCard({ study, isZapier }: { study: StudyReference; isZapier?: boolean }) {
  return (
    <div className="border rounded-lg p-3 bg-white/60">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-foreground leading-tight">
          {study.title}
        </p>
        <TierBadge tier={study.tier} />
      </div>
      <p className="text-xs text-muted-foreground mb-1.5">
        {study.author} ({study.year})
        {study.sampleSize && <span className="ml-1">· {study.sampleSize}</span>}
        {isZapier && <span className="ml-1 text-[#FF4A00]">· Zapier</span>}
      </p>
      <p className="text-sm text-foreground/80">{study.finding}</p>
    </div>
  );
}

function ArchetypeAccordion({
  archetype,
  isOpen,
  onToggle,
}: {
  archetype: ArchetypeEvidence;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const totalStudies = archetype.externalStudies.length + archetype.zapierStudies.length;

  return (
    <div className="border rounded-lg overflow-hidden bg-white/40">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <DimensionBadge dimension={archetype.dimension} color={archetype.dimensionColor} />
          <span className="font-medium text-sm">{archetype.label}</span>
          <span className="text-xs text-muted-foreground font-mono">{archetype.archetype}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{totalStudies} studies</span>
          <CoverageBadge status={archetype.coverageStatus} />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t space-y-4">
          {/* Formula */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Formula</h4>
            <code className="text-sm bg-muted/50 px-3 py-1.5 rounded block font-mono">
              {archetype.formula}
            </code>
          </div>

          {/* Category 2 Inputs */}
          {archetype.category2Inputs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Default Inputs</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground text-xs">Field</th>
                      <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground text-xs">Default</th>
                      <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground text-xs">Range</th>
                      <th className="text-left py-1.5 font-medium text-muted-foreground text-xs">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archetype.category2Inputs.map((input) => (
                      <tr key={input.field} className="border-b border-dashed last:border-0">
                        <td className="py-1.5 pr-4 font-mono text-xs">{input.field}</td>
                        <td className="py-1.5 pr-4 text-xs">{input.defaultValue}</td>
                        <td className="py-1.5 pr-4 text-xs text-muted-foreground">{input.range}</td>
                        <td className="py-1.5"><TierBadge tier={input.tier} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* External Studies */}
          {archetype.externalStudies.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                External Studies ({archetype.externalStudies.length})
              </h4>
              <div className="space-y-2">
                {archetype.externalStudies.map((s, i) => (
                  <StudyCard key={i} study={s} />
                ))}
              </div>
            </div>
          )}

          {/* Zapier Studies */}
          {archetype.zapierStudies.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Zapier Case Studies ({archetype.zapierStudies.length})
              </h4>
              <div className="space-y-2">
                {archetype.zapierStudies.map((s, i) => (
                  <StudyCard key={i} study={s} isZapier />
                ))}
              </div>
            </div>
          )}

          {/* Coverage */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evidence Coverage</h4>
              <CoverageBadge status={archetype.coverageStatus} />
            </div>
            <p className="text-sm text-foreground/80">{archetype.coverageExplanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function MethodologyPage() {
  const [openArchetypes, setOpenArchetypes] = useState<Set<string>>(new Set());
  const { archetypes, bibliography } = METHODOLOGY_DATA;

  const toggle = (id: string) => {
    setOpenArchetypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenArchetypes(new Set(archetypes.map((a) => a.archetype)));
  const collapseAll = () => setOpenArchetypes(new Set());

  const coverageCounts = {
    GREEN: archetypes.filter((a) => a.coverageStatus === "GREEN").length,
    YELLOW: archetypes.filter((a) => a.coverageStatus === "YELLOW").length,
    NA: archetypes.filter((a) => a.coverageStatus === "NA").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#FF4A00] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-semibold text-lg">Zapier Value Calculator</span>
            </Link>
          </div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-[#FF4A00] transition-colors"
          >
            ← Back to Calculator
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <section className="mb-12">
          <h1 className="text-3xl font-bold mb-3">Methodology & Sources</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            The Unified Value System (UVS) quantifies automation value across 4 dimensions
            and 16 archetypes. Every default input and formula is backed by published research
            or validated Zapier customer data.
          </p>
        </section>

        {/* Framework Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Framework Overview</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {DIMENSIONS.map((d) => (
                  <div key={d.name} className="text-center">
                    <DimensionBadge dimension={d.name} color={d.color} />
                    <p className="text-xs text-muted-foreground mt-1.5">{d.count} archetypes</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm text-foreground/80">
                <p>
                  <strong>16 archetypes</strong> map every type of automation value to a specific, auditable formula.
                  Each archetype belongs to one dimension and has its own input schema with default values
                  derived from external research.
                </p>
                <p>
                  Calculations multiply activity volumes by unit economics and time savings,
                  then annualize the result. Every input carries a confidence tier so stakeholders
                  know which numbers are benchmarked, estimated, or customer-provided.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Confidence Tiers */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Confidence Tiers</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                  Benchmarked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Backed by published research, large-sample studies, or validated customer data.
                  Highest confidence — defensible in executive conversations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
                  Estimated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reasonable assumptions based on industry patterns and analyst reports.
                  Should be validated with the customer during discovery.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-400" />
                  Custom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Customer-provided values specific to their business. Most credible when
                  sourced directly from the buyer during a live conversation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Evidence by Archetype */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Evidence by Archetype</h2>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="text-xs text-muted-foreground hover:text-[#FF4A00] transition-colors"
              >
                Expand all
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                onClick={collapseAll}
                className="text-xs text-muted-foreground hover:text-[#FF4A00] transition-colors"
              >
                Collapse all
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {archetypes.map((a) => (
              <ArchetypeAccordion
                key={a.archetype}
                archetype={a}
                isOpen={openArchetypes.has(a.archetype)}
                onToggle={() => toggle(a.archetype)}
              />
            ))}
          </div>
        </section>

        {/* Coverage Summary */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Coverage Summary</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">{coverageCounts.GREEN}</div>
                  <p className="text-sm text-muted-foreground mt-1">Strong Evidence</p>
                  <p className="text-xs text-muted-foreground">External + Zapier data</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{coverageCounts.YELLOW}</div>
                  <p className="text-sm text-muted-foreground mt-1">Moderate Evidence</p>
                  <p className="text-xs text-muted-foreground">External only or limited</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">0</div>
                  <p className="text-sm text-muted-foreground mt-1">Weak / Red</p>
                  <p className="text-xs text-muted-foreground">No archetypes</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">{coverageCounts.NA}</div>
                  <p className="text-sm text-muted-foreground mt-1">N/A</p>
                  <p className="text-xs text-muted-foreground">No cat-2 inputs defined</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Bibliography */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-4">Bibliography</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {bibliography.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <TierBadge tier={s.tier} />
                    <div>
                      <span className="font-medium">{s.author}</span>{" "}
                      <span className="text-muted-foreground">({s.year})</span>.{" "}
                      <span className="italic">{s.title}</span>.{" "}
                      <span className="text-foreground/80">{s.finding}</span>
                      {s.sampleSize && (
                        <span className="text-muted-foreground"> [{s.sampleSize}]</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t pt-6 pb-8 text-center text-xs text-muted-foreground">
          <p>Unified Value System — Zapier Enterprise Value Engineering</p>
          <p className="mt-1">
            Study tiers: <strong>A</strong> = peer-reviewed or large-sample, <strong>B</strong> = analyst/vendor with methodology,{" "}
            <strong>C</strong> = case study or small sample, <strong>D</strong> = anecdotal
          </p>
        </footer>
      </main>
    </div>
  );
}
