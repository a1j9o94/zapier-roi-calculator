import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "../utils/formatting";

export function HomePage() {
  const calculations = useQuery(api.calculations.list);
  const createCalculation = useMutation(api.calculations.create);
  const navigate = useNavigate();

  const handleNewCalculation = async () => {
    const id = await createCalculation({ name: "New ROI Calculation" });
    navigate(`/c/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <span className="font-semibold text-lg">Zapier ROI Calculator</span>
          </div>
          <Button
            onClick={handleNewCalculation}
            className="bg-[#FF4A00] hover:bg-[#CC3B00] text-white"
          >
            + New Calculation
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">ROI Calculations</h1>
            <p className="text-muted-foreground">
              Build and share ROI analyses for your customers
            </p>
          </div>

          {calculations === undefined ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : calculations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground mb-4">
                  No calculations yet
                </div>
                <Button
                  onClick={handleNewCalculation}
                  className="bg-[#FF4A00] hover:bg-[#CC3B00] text-white"
                >
                  Create your first ROI calculation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {calculations.map((calc) => (
                <Card
                  key={calc._id}
                  className="cursor-pointer hover:border-[#FF4A00]/50 transition-colors"
                  onClick={() => navigate(`/c/${calc._id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{calc.name}</CardTitle>
                        <CardDescription>
                          Updated {formatRelativeTime(calc.updatedAt)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/c/${calc._id}/summary`);
                        }}
                      >
                        View Summary
                      </Button>
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
