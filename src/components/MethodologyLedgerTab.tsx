import { useMemo, useState } from "react";
import type { Calculation, ValueItem } from "../types/roi";
import { ARCHETYPE_FIELDS } from "../types/archetypes";
import { ARCHETYPE_INFO, normalizeConfidence } from "../types/roi";
import { calculateItemAnnualValue } from "../utils/calculations";
import { formatCurrencyCompact } from "../utils/formatting";
import { Button } from "@/components/ui/button";
import { ROI_BENCHMARK_PACK_ID, ROI_SCHEMA_UPDATED_AT } from "../data/schemaResponse";

const CONCENTRATION_WARN_THRESHOLD = 0.4;

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildLedgerCsv(rows: { cells: string[] }[]): string {
  return rows.map((r) => r.cells.map(csvEscape).join(",")).join("\n");
}

interface MethodologyLedgerTabProps {
  calculation: Calculation;
  valueItems: ValueItem[];
}

export function MethodologyLedgerTab({ calculation, valueItems }: MethodologyLedgerTabProps) {
  const [copied, setCopied] = useState(false);
  const packId = calculation.benchmarkPackId ?? ROI_BENCHMARK_PACK_ID;

  const totals = useMemo(() => {
    let total = 0;
    const byItem = valueItems.map((item) => {
      const v = calculateItemAnnualValue(item);
      total += v;
      return { item, annual: v };
    });
    return { total, byItem };
  }, [valueItems]);

  const concentrationWarnings = useMemo(() => {
    if (totals.total <= 0) return [];
    return totals.byItem
      .filter(({ annual }) => annual / totals.total >= CONCENTRATION_WARN_THRESHOLD)
      .map(({ item, annual }) => ({
        name: item.name,
        pct: Math.round((annual / totals.total) * 100),
      }));
  }, [totals]);

  const csvContent = useMemo(() => {
    const header = {
      cells: [
        "value_item_name",
        "archetype",
        "input_key",
        "input_label",
        "value",
        "confidence",
        "customer_source_note",
        "default_benchmark_source",
        "source_url",
      ],
    };
    const rows: { cells: string[] }[] = [header];
    for (const item of valueItems) {
      const fields = ARCHETYPE_FIELDS[item.archetype] ?? [];
      const info = ARCHETYPE_INFO[item.archetype];
      for (const field of fields) {
        const vi = item.inputs[field.key];
        if (!vi) continue;
        const conf = normalizeConfidence(vi.confidence);
        rows.push({
          cells: [
            item.name,
            item.archetype,
            field.key,
            field.label,
            String(vi.value),
            conf,
            vi.source ?? "",
            field.source ?? "",
            field.sourceUrl ?? "",
          ],
        });
      }
    }
    rows.push({
      cells: [
        "_meta",
        "benchmark_pack_id",
        "",
        "",
        packId,
        "",
        "",
        `schema_updated_at:${ROI_SCHEMA_UPDATED_AT}`,
        "",
      ],
    });
    return buildLedgerCsv(rows);
  }, [valueItems, packId]);

  const handleCopyCsv = async () => {
    await navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${calculation.shortId}-assumption-ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 print:space-y-6 print:text-black">
      <div className="flex flex-wrap items-start justify-between gap-4 print:block">
        <div>
          <h2 className="text-xl font-semibold">Methodology & assumption ledger</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Plain-language formulas, inputs, confidence tiers, and benchmark sources for each line item. Suitable to paste
            into a Word business case or attach to procurement review.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Benchmark pack: <span className="font-mono">{packId}</span>
            {" · "}
            Schema defaults as of <span className="font-mono">{ROI_SCHEMA_UPDATED_AT}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyCsv}>
            {copied ? "Copied" : "Copy CSV"}
          </Button>
          <Button type="button" size="sm" onClick={handleDownloadCsv}>
            Download CSV
          </Button>
        </div>
      </div>

      {concentrationWarnings.length > 0 && (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
          role="status"
        >
          <p className="font-medium text-amber-950 dark:text-amber-100">Concentration check</p>
          <p className="text-muted-foreground mt-1">
            One line item accounts for {CONCENTRATION_WARN_THRESHOLD * 100}% or more of total annual value — review for
            balance so the story is not dominated by a single assumption.
          </p>
          <ul className="mt-2 list-disc list-inside">
            {concentrationWarnings.map((w) => (
              <li key={w.name}>
                <strong>{w.name}</strong> — {w.pct}% of total
              </li>
            ))}
          </ul>
        </div>
      )}

      {valueItems.length === 0 ? (
        <p className="text-muted-foreground">Add value items to see methodology detail.</p>
      ) : (
        <div className="space-y-10">
          {valueItems.map((item) => {
            const info = ARCHETYPE_INFO[item.archetype];
            const fields = ARCHETYPE_FIELDS[item.archetype] ?? [];
            const annual = calculateItemAnnualValue(item);
            const share = totals.total > 0 ? Math.round((annual / totals.total) * 100) : 0;
            return (
              <section
                key={item._id}
                className="rounded-xl border bg-card p-5 shadow-sm print:break-inside-avoid print:border print:shadow-none"
              >
                <header className="mb-4 border-b pb-3">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {info.label} · Annual value {formatCurrencyCompact(annual)}
                    {totals.total > 0 ? ` (${share}% of calculator total)` : ""}
                  </p>
                </header>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Formula</p>
                    <p className="font-mono text-sm mt-1">{info.formulaDescription}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">Input</th>
                          <th className="py-2 pr-4 font-medium">Value</th>
                          <th className="py-2 pr-4 font-medium">Tier</th>
                          <th className="py-2 pr-4 font-medium">Notes</th>
                          <th className="py-2 font-medium">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field) => {
                          const vi = item.inputs[field.key];
                          if (!vi) return null;
                          const conf = normalizeConfidence(vi.confidence);
                          const note = [vi.source, field.guidance].filter(Boolean).join(" · ");
                          return (
                            <tr key={field.key} className="border-b border-border/60">
                              <td className="py-2 pr-4 align-top">{field.label}</td>
                              <td className="py-2 pr-4 align-top font-mono">{vi.value}</td>
                              <td className="py-2 pr-4 align-top">{conf}</td>
                              <td className="py-2 pr-4 align-top text-muted-foreground">{note || "—"}</td>
                              <td className="py-2 align-top">
                                {field.sourceUrl ? (
                                  <a
                                    href={field.sourceUrl}
                                    className="text-[#FF4A00] hover:underline break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Link
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
