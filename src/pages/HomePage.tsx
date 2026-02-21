import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "../utils/formatting";

const NewCalculatorWizard = lazy(() => import("../components/NewCalculatorWizard").then(m => ({ default: m.NewCalculatorWizard })));

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const calculations = useQuery(api.calculations.list);
  const createCalculation = useMutation(api.calculations.create);
  const deleteCalculation = useMutation(api.calculations.remove);
  const navigate = useNavigate();

  const filteredCalculations = calculations?.filter((calc) =>
    calc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewCalculation = async () => {
    setShowWizard(true);
  };

  const handleQuickCreate = async () => {
    const result = await createCalculation({ name: "New ROI Calculation" });
    navigate(`/c/${result.shortId}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: Id<"calculations">, name: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      await deleteCalculation({ id });
    }
  };

  if (showWizard) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading wizard...</p></div>}>
        <NewCalculatorWizard
          onComplete={(shortId) => navigate(`/c/${shortId}`)}
          onCancel={() => setShowWizard(false)}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF4A00] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Zapier ROI Calculator</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">v2</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleQuickCreate}>
              Quick Create
            </Button>
            <Button onClick={handleNewCalculation} className="bg-[#FF4A00] hover:bg-[#CC3B00] text-white">
              + New with Wizard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">ROI Calculations</h1>
            <p className="text-muted-foreground">
              Build and share ROI analyses powered by UVS taxonomy
            </p>
          </div>

          {calculations && calculations.length > 0 && (
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search calculations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          )}

          {calculations === undefined ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : calculations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground mb-4">No calculations yet</div>
                <Button onClick={handleNewCalculation} className="bg-[#FF4A00] hover:bg-[#CC3B00] text-white">
                  Create your first ROI calculation
                </Button>
              </CardContent>
            </Card>
          ) : filteredCalculations && filteredCalculations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No calculations match "{searchQuery}"
            </div>
          ) : (
            <div className="grid gap-4">
              {(filteredCalculations ?? [])
                .filter((calc) => calc.shortId)
                .map((calc) => (
                  <Card
                    key={calc._id}
                    className="cursor-pointer hover:border-[#FF4A00]/50 transition-colors"
                    onClick={() => navigate(`/c/${calc.shortId}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{calc.name}</CardTitle>
                          <CardDescription>
                            {calc.role && <span className="capitalize mr-2">{calc.role}</span>}
                            Updated {formatRelativeTime(calc.updatedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/c/${calc.shortId}/summary`);
                            }}
                          >
                            View Summary
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, calc._id, calc.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
