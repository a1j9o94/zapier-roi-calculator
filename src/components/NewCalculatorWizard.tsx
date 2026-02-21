import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Role, Dimension } from "../types/roi";
import { ROLE_INFO, ROLE_DEFAULT_PRIORITIES } from "../types/roles";
import { getPackagesByRole, type ValuePackage } from "../data/value-packages";
import { ALL_PATTERNS } from "../data/patterns/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrencyCompact } from "../utils/formatting";
import { DIMENSION_INFO } from "../types/roi";

interface NewCalculatorWizardProps {
  onComplete: (shortId: string) => void;
  onCancel: () => void;
}

type Step = "context" | "role" | "package" | "review";

const INDUSTRIES = [
  "SaaS",
  "Manufacturing",
  "Finance",
  "Healthcare",
  "Retail",
  "Professional Services",
  "Other",
] as const;

const ALL_ROLES: Role[] = [
  "executive",
  "revops",
  "marketing",
  "sales_cs",
  "it",
  "hr",
  "finance",
  "engineering",
  "support",
  "supply_chain",
];

const STEPS: Step[] = ["context", "role", "package", "review"];

export function NewCalculatorWizard({ onComplete, onCancel }: NewCalculatorWizardProps) {
  const [step, setStep] = useState<Step>("context");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ValuePackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createCalculation = useMutation(api.calculations.create);
  const createValueItemsBatch = useMutation(api.valueItems.createBatch);

  const currentStepIndex = STEPS.indexOf(step);

  const canProceed = (): boolean => {
    switch (step) {
      case "context":
        return companyName.trim().length > 0;
      case "role":
        return selectedRole !== null;
      case "package":
        return true; // optional
      case "review":
        return true;
    }
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleCreate = async () => {
    if (!selectedRole) return;
    setIsCreating(true);
    try {
      const name = companyName.trim();
      const priorityOrder = ROLE_DEFAULT_PRIORITIES[selectedRole];
      const result = await createCalculation({
        name,
        role: selectedRole,
        priorityOrder,
      });
      const { id: calcId, shortId } = result as { id: any; shortId: string };

      // If a package was selected, create value items from its patterns
      if (selectedPackage) {
        const items = selectedPackage.patterns.map((pkg) => {
          // Look up the full pattern to get defaultInputs
          const pattern = ALL_PATTERNS.find((p) => p.id === pkg.patternId);
          const inputs: Record<string, { value: number; confidence: string }> = {};
          if (pattern) {
            for (const [key, val] of Object.entries(pattern.defaultInputs)) {
              inputs[key] = { value: val, confidence: "estimated" };
            }
          }
          return {
            archetype: pkg.archetype,
            name: pkg.name,
            description: pkg.description,
            inputs,
          };
        });

        if (items.length > 0) {
          await createValueItemsBatch({
            calculationId: calcId,
            items,
          });
        }
      }

      onComplete(shortId);
    } catch (err) {
      console.error("Failed to create calculation:", err);
      setIsCreating(false);
    }
  };

  const availablePackages = selectedRole ? getPackagesByRole(selectedRole) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
          </div>
        ))}
        <span className="ml-3 text-sm text-muted-foreground capitalize">{step}</span>
      </div>

      {/* Step content */}
      {step === "context" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Company Context</h2>
          <p className="text-sm text-muted-foreground">
            Basic information about the company this calculator is for.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Employee Count</label>
              <Input
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                placeholder="e.g., 500"
              />
            </div>
          </div>
        </div>
      )}

      {step === "role" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Role</h2>
          <p className="text-sm text-muted-foreground">
            Choose the primary stakeholder role. This determines which value dimensions are prioritized.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_ROLES.map((role) => {
              const info = ROLE_INFO[role];
              const isSelected = selectedRole === role;
              return (
                <Card
                  key={role}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedRole(role);
                    setSelectedPackage(null);
                  }}
                >
                  <CardContent className="pt-4 pb-4">
                    <p className="font-medium text-sm">{info.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {info.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {step === "package" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Value Package (Optional)</h2>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built package of value patterns, or skip to create a blank calculator.
          </p>
          {availablePackages.length > 0 ? (
            <div className="space-y-3">
              {availablePackages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() =>
                      setSelectedPackage(isSelected ? null : pkg)
                    }
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pkg.tagline}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            {formatCurrencyCompact(pkg.estimatedTotalValue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pkg.patterns.length} patterns
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No packages available for this role. You can skip this step.
            </p>
          )}
        </div>
      )}

      {step === "review" && selectedRole && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Review & Create</h2>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{companyName}</span>
              </div>
              {industry && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium">{industry}</span>
                </div>
              )}
              {employeeCount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-medium">{employeeCount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{ROLE_INFO[selectedRole].label}</span>
              </div>
              {selectedPackage && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">{selectedPackage.name}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Dimension Priority
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_DEFAULT_PRIORITIES[selectedRole].map(
                    (dim: Dimension, i: number) => (
                      <span
                        key={dim}
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-muted"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: DIMENSION_INFO[dim].color,
                          }}
                        />
                        {DIMENSION_INFO[dim].shortLabel}
                      </span>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {currentStepIndex === 0 ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : (
            <Button variant="ghost" onClick={goBack}>
              Back
            </Button>
          )}
        </div>
        <div>
          {step === "review" ? (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !canProceed()}
            >
              {isCreating ? "Creating..." : "Create Calculator"}
            </Button>
          ) : step === "package" ? (
            <div className="flex gap-2">
              {!selectedPackage && (
                <Button variant="ghost" onClick={goNext}>
                  Skip
                </Button>
              )}
              <Button onClick={goNext} disabled={!canProceed()}>
                {selectedPackage ? "Next" : "Next"}
              </Button>
            </div>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
