import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CalculatorPage } from "./pages/CalculatorPage";
import "./index.css";

export function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/c/:id" element={<CalculatorPage />} />
        <Route path="/c/:id/summary" element={<CalculatorPage summaryOnly />} />
        <Route path="/c/:id/share" element={<CalculatorPage summaryOnly />} />
        <Route path="/c/:id/share/obfuscated" element={<CalculatorPage summaryOnly obfuscated />} />
        <Route path="/c/:id/demo" element={<CalculatorPage summaryOnly obfuscated />} />
      </Routes>
    </div>
  );
}

export default App;
