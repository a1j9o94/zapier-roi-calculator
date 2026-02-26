import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Role, Dimension } from "../types/roi";
import { ROLE_INFO, ROLE_DEFAULT_PRIORITIES } from "../types/roles";
import { getPackagesByRole, type ValuePackage } from "../data/value-packages";
import { ALL_PATTERNS } from "../data/patterns/index";
import { deduplicatePatterns } from "../utils/package-dedup";
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
  const [selectedPackages, setSelectedPackages] = useState<ValuePackage[]>([]);
  const [createMode, setCreateMode] = useState<"single" | "multi">("single");
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<"companies"> | "">("");
  const [isCreating, setIsCreating] = useState(false);

  const companies = useQuery(api.companies.list);
  const createCalculation = useMutation(api.calculations.create);
  const createCompany = useMutation(api.companies.create);
  const createValueItemsBatch = useMutation(api.valueItems.createBatch);
  const createUseCase = useMutation(api.useCases.create);

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

      // Auto-create company if none selected
      let companyId = selectedCompanyId as Id<"companies"> | "" ;
      if (!companyId && name) {
        const companyResult = await createCompany({
          name,
          industry: industry || undefined,
          employeeCount: employeeCount ? Number(employeeCount) : undefined,
        });
        companyId = companyResult.id as Id<"companies">;
      }

      const result = await createCalculation({
        name,
        role: selectedRole,
        priorityOrder,
        ...(companyId ? { companyId: companyId as Id<"companies"> } : {}),
      });
      const { id: calcId, shortId } = result as { id: any; shortId: string };

      // If packages were selected, create value items from deduplicated patterns
      if (selectedPackages.length > 0) {
        const items = dedupResult.patterns.map((pkg) => {
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

        // Create use cases with architecture from zapBundle
        for (const pkg of dedupResult.patterns) {
          const pattern = ALL_PATTERNS.find((p) => p.id === pkg.patternId);
          if (!pattern?.zapBundle) continue;

          const architecture = pattern.zapBundle.zaps.map((zap) => ({
            type: "zap" as const,
            name: zap.title,
            description: zap.description,
            status: "planned",
            zapConfig: {
              title: zap.title,
              steps: zap.steps.map((s) => ({
                action: `${s.app}.${s.action}`,
              })),
            },
          }));

          await createUseCase({
            calculationId: calcId,
            name: pkg.name,
            department: pattern.department,
            status: "identified",
            implementationEffort: "medium",
            description: pkg.description,
            architecture,
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

  // Dedup computation for multi-select packages
  const dedupResult = useMemo(() => {
    const allPatterns = selectedPackages.flatMap((pkg) => pkg.patterns);
    return deduplicatePatterns(allPatterns);
  }, [selectedPackages]);

  const totalEstimatedValue = dedupResult.patterns.reduce(
    (sum, p) => sum + p.estimatedAnnualValue,
    0,
  );

  const togglePackage = (pkg: ValuePackage) => {
    setSelectedPackages((prev) => {
      const exists = prev.some((p) => p.id === pkg.id);
      return exists ? prev.filter((p) => p.id !== pkg.id) : [...prev, pkg];
    });
  };

  const selectAllPackages = () => {
    setSelectedPackages(availablePackages);
  };

  const clearAllPackages = () => {
    setSelectedPackages([]);
  };

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
          <h2 className="text-xl font-semibold">Company</h2>
          <p className="text-sm text-muted-foreground">
            Select an existing company or create a new one.
          </p>
          <div className="space-y-3">
            {companies && companies.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Existing Companies</label>
                <div className="grid gap-2">
                  {companies.map((co) => {
                    const isSelected = selectedCompanyId === co._id;
                    return (
                      <button
                        key={co._id}
                        type="button"
                        className={`text-left p-3 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCompanyId("");
                            setCompanyName("");
                          } else {
                            setSelectedCompanyId(co._id);
                            setCompanyName(co.name);
                            if (co.industry) setIndustry(co.industry);
                          }
                        }}
                      >
                        <p className="text-sm font-medium">{co.name}</p>
                        {co.industry && <p className="text-xs text-muted-foreground">{co.industry}</p>}
                      </button>
                    );
                  })}
                </div>
                <div className="relative flex items-center py-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="px-3 text-xs text-muted-foreground">or create new</span>
                  <div className="flex-1 border-t border-border" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (selectedCompanyId) setSelectedCompanyId("");
                }}
                placeholder="e.g., Acme Corp"
                autoFocus={!companies || companies.length === 0}
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
                    setSelectedPackages([]);
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Value Packages (Optional)</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select one or more packages, or skip to create a blank calculator.
              </p>
            </div>
            {availablePackages.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPackages}
                  disabled={selectedPackages.length === availablePackages.length}
                >
                  Select All
                </Button>
                {selectedPackages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllPackages}>
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Running total */}
          {selectedPackages.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex items-center justify-between font-medium">
                <span>
                  {selectedPackages.length} package{selectedPackages.length !== 1 ? "s" : ""} selected
                  {" -- "}
                  {dedupResult.totalAfter} pattern{dedupResult.totalAfter !== 1 ? "s" : ""}
                  {" -- "}
                  {formatCurrencyCompact(totalEstimatedValue)} estimated value
                </span>
              </div>
              {dedupResult.duplicatesRemoved > 0 && (
                <p className="text-xs text-muted-foreground">
                  {dedupResult.totalBefore} patterns selected, {dedupResult.duplicatesRemoved} duplicate{dedupResult.duplicatesRemoved !== 1 ? "s" : ""} resolved -- {dedupResult.totalAfter} unique patterns
                </p>
              )}
            </div>
          )}

          {availablePackages.length > 0 ? (
            <div className="space-y-3">
              {availablePackages.map((pkg) => {
                const isSelected = selectedPackages.some((p) => p.id === pkg.id);
                return (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => togglePackage(pkg)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
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
              {selectedCompanyId && companies && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Linked to</span>
                  <span className="font-medium">{companies.find((c) => c._id === selectedCompanyId)?.name ?? "Company"}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{ROLE_INFO[selectedRole].label}</span>
              </div>
              {selectedPackages.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Packages</span>
                    <span className="font-medium">{selectedPackages.length} selected</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPackages.map((pkg) => (
                      <span key={pkg.id} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {pkg.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Patterns</span>
                    <span className="font-medium">
                      {dedupResult.totalAfter} unique
                      {dedupResult.duplicatesRemoved > 0 && (
                        <span className="text-muted-foreground font-normal">
                          {" "}({dedupResult.duplicatesRemoved} deduped)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Value</span>
                    <span className="font-medium">{formatCurrencyCompact(totalEstimatedValue)}</span>
                  </div>
                </>
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

          {/* Mode toggle */}
          {selectedPackages.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Calculator Mode</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`text-left p-3 rounded-lg border-2 transition-colors ${
                      createMode === "single"
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => setCreateMode("single")}
                  >
                    <p className="text-sm font-medium">Single calculator</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All patterns in one calculator
                    </p>
                  </button>
                  <button
                    type="button"
                    className="text-left p-3 rounded-lg border-2 border-transparent bg-muted/50 opacity-60 cursor-not-allowed"
                    disabled
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Multi-calculator</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Coming Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      One calculator per role
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
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
              {selectedPackages.length === 0 && (
                <Button variant="ghost" onClick={goNext}>
                  Skip
                </Button>
              )}
              <Button onClick={goNext} disabled={!canProceed()}>
                Next
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
