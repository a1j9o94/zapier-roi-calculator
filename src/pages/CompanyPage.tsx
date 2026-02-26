import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CompanyDashboard } from "../components/CompanyDashboard";

interface CompanyPageProps {
  summaryOnly?: boolean;
}

export function CompanyPage({ summaryOnly = false }: CompanyPageProps) {
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();
  const company = useQuery(
    api.companies.getByShortId,
    shortId ? { shortId } : "skip"
  );

  if (company === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading company...</p>
      </div>
    );
  }

  if (company === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Company not found</p>
          <button
            onClick={() => navigate("/")}
            className="text-[#FF4A00] hover:underline"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return <CompanyDashboard company={company} summaryOnly={summaryOnly} />;
}
