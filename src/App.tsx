import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CalculatorPage } from "./pages/CalculatorPage";
import "./index.css";

const CompanyPage = lazy(() =>
  import("./pages/CompanyPage").then((m) => ({ default: m.CompanyPage }))
);

export function App() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/company/:shortId" element={<CompanyPage />} />
          <Route path="/company/:shortId/summary" element={<CompanyPage summaryOnly />} />
          <Route path="/c/:id" element={<CalculatorPage />} />
          <Route path="/c/:id/summary" element={<CalculatorPage summaryOnly />} />
          <Route path="/c/:id/share" element={<CalculatorPage summaryOnly />} />
          <Route path="/c/:id/share/obfuscated" element={<CalculatorPage summaryOnly obfuscated />} />
          <Route path="/c/:id/demo" element={<CalculatorPage summaryOnly obfuscated />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
