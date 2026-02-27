// ============================================================
// ZapPicker — Modal for linking / unlinking Zaps to a use case
// Adds entries to useCase.architecture with type: "zap"
// Allows entering a Zap ID (and optional display name)
// ============================================================

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { UseCase } from "../types/roi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ZapPickerProps {
  useCase: UseCase;
  onClose: () => void;
}

export function ZapPicker({ useCase, onClose }: ZapPickerProps) {
  const [zapId, setZapId] = useState("");
  const [zapName, setZapName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUseCase = useMutation(api.useCases.update);

  const architecture = useCase.architecture ?? [];
  const linkedZaps = architecture.filter((a) => a.type === "zap");

  const handleAddZap = async () => {
    const trimmedId = zapId.trim();
    if (!trimmedId) {
      setError("Zap ID is required.");
      return;
    }
    // Prevent duplicate Zap IDs
    if (architecture.some((a) => a.zapId === trimmedId)) {
      setError("This Zap is already linked.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const newItem = {
        type: "zap" as const,
        name: zapName.trim() || `Zap ${trimmedId}`,
        zapId: trimmedId,
        status: "active" as const,
      };
      await updateUseCase({
        id: useCase._id,
        architecture: [...architecture, newItem],
      });
      setZapId("");
      setZapName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link Zap.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveZap = async (archIndex: number) => {
    const updated = architecture.filter((_, i) => i !== archIndex);
    await updateUseCase({ id: useCase._id, architecture: updated });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Link Automation</h2>
            <p className="text-sm text-muted-foreground truncate">{useCase.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Linked Zaps list */}
          {linkedZaps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Linked Zaps ({linkedZaps.length})
              </p>
              <div className="space-y-2">
                {architecture.map((item, idx) => {
                  if (item.type !== "zap") return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.zapId && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {item.zapId}
                          </p>
                        )}
                        {item.status && (
                          <span
                            className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted"
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.zapId && (
                          <a
                            href={`https://zapier.com/editor/${item.zapId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#FF4A00] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveZap(idx)}
                          className="h-7 px-2 text-destructive hover:text-destructive text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new Zap */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {linkedZaps.length > 0 ? "Add Another Zap" : "Link a Zap"}
            </p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="zp-zap-id" className="text-xs text-muted-foreground">
                  Zap ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zp-zap-id"
                  placeholder="e.g. 123456789"
                  value={zapId}
                  onChange={(e) => { setZapId(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && !saving && handleAddZap()}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zp-zap-name" className="text-xs text-muted-foreground">
                  Display name (optional)
                </Label>
                <Input
                  id="zp-zap-name"
                  placeholder="e.g. Lead Routing Automation"
                  value={zapName}
                  onChange={(e) => setZapName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !saving && handleAddZap()}
                  className="mt-1"
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              onClick={handleAddZap}
              disabled={saving || !zapId.trim()}
              className="w-full"
              size="sm"
            >
              {saving ? "Linking..." : "Link Zap"}
            </Button>

            <p className="text-[11px] text-muted-foreground">
              Find your Zap ID in the Zapier editor URL:{" "}
              <span className="font-mono">zapier.com/editor/</span>
              <span className="font-mono text-[#FF4A00]">&#123;zapId&#125;</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button variant="outline" onClick={onClose} className="w-full" size="sm">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
