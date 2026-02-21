import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { UseCaseStatus, ImplementationEffort, UseCaseMetric } from "../types/roi";
import { USE_CASE_STATUS_INFO, IMPLEMENTATION_EFFORT_INFO } from "../types/roi";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { DebouncedTextarea } from "@/components/ui/debounced-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface UseCaseCardProps {
  useCase: any;
  valueItems: any[];
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggleExpand: () => void;
}

export function UseCaseCard({ useCase, valueItems, readOnly = false, isExpanded = false, onToggleExpand }: UseCaseCardProps) {
  const updateUseCase = useMutation(api.useCases.update);
  const deleteUseCase = useMutation(api.useCases.remove);
  const statusInfo = USE_CASE_STATUS_INFO[useCase.status as UseCaseStatus] ?? USE_CASE_STATUS_INFO.identified;
  const effortInfo = IMPLEMENTATION_EFFORT_INFO[useCase.implementationEffort as ImplementationEffort] ?? IMPLEMENTATION_EFFORT_INFO.medium;
  const linkedItems = valueItems.filter((item: any) => item.useCaseId === useCase._id);
  const architecture = useCase.architecture as any[] | undefined;

  const handleUpdate = (field: string, value: unknown) => {
    updateUseCase({ id: useCase._id, [field]: value });
  };
  const handleDelete = () => {
    if (confirm("Delete this use case? Linked value items will be unlinked.")) {
      deleteUseCase({ id: useCase._id });
    }
  };
  const handleAddMetric = () => {
    handleUpdate("metrics", [...(useCase.metrics || []), { name: "", before: "", after: "", improvement: "" }]);
  };
  const handleUpdateMetric = (index: number, field: keyof UseCaseMetric, value: string) => {
    const newMetrics = [...(useCase.metrics || [])];
    const cur = newMetrics[index];
    newMetrics[index] = { name: cur?.name ?? "", before: cur?.before, after: cur?.after, improvement: cur?.improvement, [field]: value };
    handleUpdate("metrics", newMetrics);
  };
  const handleRemoveMetric = (index: number) => {
    handleUpdate("metrics", (useCase.metrics || []).filter((_: any, i: number) => i !== index));
  };

  return (
    <Card className={`overflow-hidden ${isExpanded ? "ring-2 ring-[#FF4A00]/20" : ""}`}>
      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggleExpand}>
        <div className="flex items-start justify-between gap-4 overflow-hidden">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>
                {statusInfo.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${effortInfo.color}18`, color: effortInfo.color }} title={effortInfo.tooltip}>
                {effortInfo.label}
              </span>
              {useCase.department && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{useCase.department}</span>
              )}
            </div>
            <h3 className="font-semibold text-lg truncate">{useCase.name}</h3>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {linkedItems.length > 0 && (
              <span className="text-xs text-muted-foreground">{linkedItems.length} value item{linkedItems.length !== 1 ? "s" : ""}</span>
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" readOnly={readOnly} display={useCase.name}>
              <DebouncedInput value={useCase.name} onChange={(v) => handleUpdate("name", v)} className="h-9" />
            </Field>
            <Field label="Department" readOnly={readOnly} display={useCase.department || "-"}>
              <DebouncedInput value={useCase.department || ""} onChange={(v) => handleUpdate("department", v || undefined)} placeholder="e.g., Sales, Marketing, IT" className="h-9" />
            </Field>
            <Field label="Status" readOnly={readOnly} display={statusInfo.label}>
              <Select value={useCase.status} onValueChange={(v) => handleUpdate("status", v as UseCaseStatus)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(USE_CASE_STATUS_INFO) as [UseCaseStatus, typeof statusInfo][]).map(([k, info]) => (
                    <SelectItem key={k} value={k}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Implementation Effort" readOnly={readOnly} display={effortInfo.label}>
              <Select value={useCase.implementationEffort} onValueChange={(v) => handleUpdate("implementationEffort", v as ImplementationEffort)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(IMPLEMENTATION_EFFORT_INFO) as [ImplementationEffort, typeof effortInfo][]).map(([k, info]) => (
                    <SelectItem key={k} value={k}><span title={info.tooltip}>{info.label}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            {readOnly ? (
              <p className="text-sm py-2 whitespace-pre-wrap">{useCase.description || "-"}</p>
            ) : (
              <DebouncedTextarea value={useCase.description || ""} onChange={(v) => handleUpdate("description", v || undefined)} placeholder="Describe what this automation does..." className="min-h-[80px]" />
            )}
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Metrics (before/after)</label>
              {!readOnly && <Button variant="ghost" size="sm" onClick={handleAddMetric} className="h-7 text-xs">+ Add Metric</Button>}
            </div>
            {useCase.metrics?.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
                  <div className="col-span-3">Name</div><div className="col-span-3">Before</div><div className="col-span-3">After</div><div className="col-span-2">Improvement</div><div className="col-span-1" />
                </div>
                {useCase.metrics.map((m: UseCaseMetric, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-muted/50 p-2 rounded-lg">
                    {readOnly ? (<>
                      <div className="col-span-3 text-sm font-medium">{m.name || "-"}</div>
                      <div className="col-span-3 text-sm font-mono">{m.before || "-"}</div>
                      <div className="col-span-3 text-sm font-mono">{m.after || "-"}</div>
                      <div className="col-span-3 text-sm font-mono text-[#FF4A00]">{m.improvement || "-"}</div>
                    </>) : (<>
                      <div className="col-span-3"><DebouncedInput value={m.name} onChange={(v) => handleUpdateMetric(i, "name", String(v))} placeholder="Metric name" className="h-8 text-sm" /></div>
                      <div className="col-span-3"><DebouncedInput value={m.before || ""} onChange={(v) => handleUpdateMetric(i, "before", String(v))} placeholder="Before" className="h-8 text-sm" /></div>
                      <div className="col-span-3"><DebouncedInput value={m.after || ""} onChange={(v) => handleUpdateMetric(i, "after", String(v))} placeholder="After" className="h-8 text-sm" /></div>
                      <div className="col-span-2"><DebouncedInput value={m.improvement || ""} onChange={(v) => handleUpdateMetric(i, "improvement", String(v))} placeholder="+X%" className="h-8 text-sm" /></div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMetric(i)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </Button>
                      </div>
                    </>)}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-2">No metrics added yet</p>}
          </div>

          {/* Architecture */}
          {architecture && architecture.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Architecture ({architecture.length})</label>
              {architecture.map((item: any, idx: number) => (
                <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase text-muted-foreground">{item.type}</span>
                    {item.status && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.status}</span>}
                  </div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.type === "zap" && item.zapDetails?.steps?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                      {item.zapDetails.steps.map((step: any, si: number) => (
                        <div key={si} className="flex items-center gap-1 shrink-0">
                          {si > 0 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-muted-foreground"><path d="M9 6l6 6-6 6" /></svg>}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border text-xs">
                            {step.appImageUrl ? <img src={step.appImageUrl} alt="" className="w-4 h-4 rounded" /> : <div className="w-4 h-4 rounded" style={{ backgroundColor: step.appColor || "#ccc" }} />}
                            <span className="whitespace-nowrap">{step.appTitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Linked Value Items */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Linked Value Items ({linkedItems.length})</label>
            {linkedItems.length > 0 ? (
              <div className="space-y-1">
                {linkedItems.map((item: any) => (
                  <div key={item._id} className="flex items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-2">No value items linked to this use case.</p>}
          </div>

          {!readOnly && (
            <div className="flex justify-end pt-4 border-t">
              <Button variant="destructive" size="sm" onClick={handleDelete}>Delete Use Case</Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Field({ label, readOnly, display, children }: { label: string; readOnly: boolean; display: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {readOnly ? <p className="text-sm py-2">{display}</p> : children}
    </div>
  );
}
