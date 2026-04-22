import { useState, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Calculation, ValueItem, UseCase } from "../types/roi";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { AssumptionsTab } from "../components/AssumptionsTab";
import { ValueItemsTab } from "../components/ValueItemsTab";
import { UseCasesTab } from "../components/UseCasesTab";
import { ExecutiveSummary } from "../components/ExecutiveSummary";
import { MethodologyLedgerTab } from "../components/MethodologyLedgerTab";

// Lazy load heavier view components
const SlideView = lazy(() => import("../components/SlideView").then(m => ({ default: m.SlideView })));
const DetailView = lazy(() => import("../components/DetailView").then(m => ({ default: m.DetailView })));

interface CalculatorPageProps {
  summaryOnly?: boolean;
  obfuscated?: boolean;
}

type TabId = "assumptions" | "values" | "usecases" | "summary" | "dashboard" | "detail" | "methodology";

export function CalculatorPage({ summaryOnly = false, obfuscated = false }: CalculatorPageProps) {
  const { id: shortId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [isEditingName, setIsEditingName] = useState(false);

  const isEmbed = searchParams.get("embed") === "true";
  const isObfuscated = obfuscated || searchParams.get("obfuscate") === "true";
  const tabParam = searchParams.get("tab");

  // Override active tab from URL param
  const effectiveTab =
    tabParam &&
    ["assumptions", "values", "usecases", "summary", "dashboard", "detail", "methodology"].includes(tabParam)
      ? (tabParam as TabId)
      : activeTab;

  const calculation = useQuery(
    api.calculations.getByShortId,
    shortId ? { shortId } : "skip"
  );
  const valueItems = useQuery(
    api.valueItems.listByCalculation,
    calculation ? { calculationId: calculation._id } : "skip"
  );
  const useCases = useQuery(
    api.useCases.listByCalculation,
    calculation ? { calculationId: calculation._id } : "skip"
  );
  const company = useQuery(
    api.companies.getById,
    calculation?.companyId ? { id: calculation.companyId } : "skip"
  );
  const updateName = useMutation(api.calculations.updateName);

  if (!shortId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid calculation ID</p>
      </div>
    );
  }

  if (calculation === undefined || valueItems === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (calculation === null) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Calculation not found</p>
        <Button onClick={() => navigate("/")}>Go to Home</Button>
      </div>
    );
  }

  const typedCalculation = calculation as unknown as Calculation;
  const typedValueItems = valueItems as unknown as ValueItem[];
  const typedUseCases = (useCases ?? []) as unknown as UseCase[];

  const handleStartEditName = () => {
    setIsEditingName(true);
  };

  const tabs: { id: TabId; label: string }[] = summaryOnly
    ? [
        { id: "summary", label: "Executive Summary" },
        { id: "methodology", label: "Methodology" },
        { id: "dashboard", label: "Dashboard" },
      ]
    : [
        { id: "summary", label: "Summary" },
        { id: "methodology", label: "Methodology" },
        { id: "usecases", label: "Use Cases" },
        { id: "dashboard", label: "Dashboard" },
        { id: "detail", label: "Detail View" },
        { id: "values", label: "Value Items" },
        { id: "assumptions", label: "Inputs" },
      ];

  const displayName = isObfuscated
    ? calculation.obfuscation?.companyDescriptor || "Enterprise Customer"
    : calculation.name;

  const loadingFallback = <div className="py-12 text-center text-muted-foreground">Loading view...</div>;

  return (
    <div className="min-h-screen bg-background">
      {!isEmbed && (
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {!summaryOnly && (
                  <Link
                    to={company?.shortId ? `/company/${company.shortId}` : "/"}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </Link>
                )}
                <div className="w-8 h-8 rounded-lg bg-[#FF4A00] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                {isEditingName && !summaryOnly ? (
                  <div onBlur={() => setIsEditingName(false)}>
                    <DebouncedInput
                      value={calculation.name}
                      onChange={(value) => {
                        const name = String(value).trim();
                        if (name && name !== calculation.name) {
                          updateName({ id: calculation._id, name });
                        }
                      }}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        } else if (e.key === "Escape") {
                          setIsEditingName(false);
                        }
                      }}
                      debounceMs={500}
                      className="text-xl font-semibold w-80"
                      autoFocus
                    />
                  </div>
                ) : (
                  <h1
                    className={`text-xl font-semibold ${summaryOnly ? "" : "cursor-pointer hover:text-[#FF4A00] transition-colors"}`}
                    onClick={summaryOnly ? undefined : handleStartEditName}
                    title={summaryOnly ? undefined : "Click to edit name"}
                  >
                    {displayName}
                  </h1>
                )}
                {calculation.role && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                    {calculation.role}
                  </span>
                )}
              </div>
              {!summaryOnly && (
                <Button variant="outline" onClick={() => navigate(`/c/${shortId}/summary`)}>
                  Share Summary
                </Button>
              )}
            </div>

            <nav className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    effectiveTab === tab.id
                      ? "bg-[#FF4A00] text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      )}

      <main className={isEmbed ? "p-4" : "container mx-auto px-4 py-6"}>
        {effectiveTab === "assumptions" && (
          <AssumptionsTab
            calculation={typedCalculation}
            valueItems={typedValueItems}
            useCases={typedUseCases}
            readOnly={summaryOnly}
          />
        )}
        {effectiveTab === "values" && (
          <ValueItemsTab
            calculation={typedCalculation}
            valueItems={typedValueItems}
            readOnly={summaryOnly}
          />
        )}
        {effectiveTab === "usecases" && (
          <UseCasesTab
            calculation={typedCalculation}
            valueItems={typedValueItems}
            useCases={typedUseCases}
            readOnly={summaryOnly}
          />
        )}
        {effectiveTab === "summary" && (
          <ExecutiveSummary
            calculation={typedCalculation}
            valueItems={typedValueItems}
            useCases={typedUseCases}
            readOnly={summaryOnly}
            obfuscated={isObfuscated}
          />
        )}
        {effectiveTab === "methodology" && (
          <MethodologyLedgerTab calculation={typedCalculation} valueItems={typedValueItems} />
        )}
        {effectiveTab === "dashboard" && (
          <Suspense fallback={loadingFallback}>
            <SlideView
              calculation={typedCalculation}
              valueItems={typedValueItems}
              useCases={typedUseCases}
            />
          </Suspense>
        )}
        {effectiveTab === "detail" && (
          <Suspense fallback={loadingFallback}>
            <DetailView
              calculation={typedCalculation}
              valueItems={typedValueItems}
              useCases={typedUseCases}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
