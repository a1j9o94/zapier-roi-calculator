import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssumptionsTab } from "../components/AssumptionsTab";
import { ValueItemsTab } from "../components/ValueItemsTab";
import { ExecutiveSummary } from "../components/ExecutiveSummary";

interface CalculatorPageProps {
  summaryOnly?: boolean;
}

type TabId = "assumptions" | "values" | "summary";

export function CalculatorPage({ summaryOnly = false }: CalculatorPageProps) {
  const { id: shortId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>(
    summaryOnly ? "summary" : "values"
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const calculation = useQuery(
    api.calculations.getByShortId,
    shortId ? { shortId } : "skip"
  );
  const valueItems = useQuery(
    api.valueItems.listByCalculation,
    calculation ? { calculationId: calculation._id } : "skip"
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

  const handleStartEditName = () => {
    setEditedName(calculation.name);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== calculation.name) {
      await updateName({ id: calculation._id, name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = summaryOnly
    ? [{ id: "summary", label: "Executive Summary" }]
    : [
        { id: "assumptions", label: "Assumptions" },
        { id: "values", label: "Value Items" },
        { id: "summary", label: "Executive Summary" },
      ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-8 h-8 rounded-lg bg-[#FF4A00] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-white"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              {isEditingName ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  className="text-xl font-semibold w-80"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-xl font-semibold cursor-pointer hover:text-[#FF4A00] transition-colors"
                  onClick={handleStartEditName}
                  title="Click to edit name"
                >
                  {calculation.name}
                </h1>
              )}
            </div>
            {!summaryOnly && (
              <Button
                variant="outline"
                onClick={() => navigate(`/c/${shortId}/summary`)}
              >
                Share Summary
              </Button>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
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

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "assumptions" && (
          <AssumptionsTab calculation={calculation} />
        )}
        {activeTab === "values" && (
          <ValueItemsTab
            calculation={calculation}
            valueItems={valueItems}
          />
        )}
        {activeTab === "summary" && (
          <ExecutiveSummary
            calculation={calculation}
            valueItems={valueItems}
          />
        )}
      </main>
    </div>
  );
}
