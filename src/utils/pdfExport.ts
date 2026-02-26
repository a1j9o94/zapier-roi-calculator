import { jsPDF } from "jspdf";
import type { Calculation, ValueItem } from "../types/roi";
import {
  calculateTotalAnnualValue,
  calculateProjection,
  calculateROIMultiple,
  getCategoryBreakdown,
  calculateTotalHoursSaved,
  type CategoryBreakdown,
  type YearProjection,
} from "./calculations";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMultiple,
  formatNumber,
  formatPercent,
} from "./formatting";

// Zapier brand colors
const COLORS = {
  orange: "#FF4A00",
  darkGray: "#1A1A1A",
  mediumGray: "#666666",
  lightGray: "#999999",
  background: "#F5F5F5",
};

interface PDFData {
  calculation: Calculation;
  valueItems: ValueItem[];
  totalValue: number;
  proposedInvestment: number;
  roiMultiple: number | null;
  breakdown: CategoryBreakdown[];
  projections: YearProjection[];
  totalHoursSaved: number;
}

export function generateExecutiveSummaryPDF(
  calculation: Calculation,
  valueItems: ValueItem[]
): void {
  const totalValue = calculateTotalAnnualValue(valueItems, calculation.assumptions);
  const proposedSpend = calculation.proposedSpend ?? 0;
  const roiMultiple = calculateROIMultiple(totalValue, proposedSpend);
  const breakdown = getCategoryBreakdown(valueItems, calculation.assumptions);
  const projections = calculateProjection(
    totalValue,
    calculation.assumptions,
    proposedSpend
  );
  const totalHoursSaved = calculateTotalHoursSaved(valueItems, calculation.assumptions);

  const data: PDFData = {
    calculation,
    valueItems,
    totalValue,
    proposedInvestment: proposedSpend,
    roiMultiple,
    breakdown,
    projections,
    totalHoursSaved,
  };

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 12; // Starting Y position

  // Header
  y = drawHeader(doc, data, y);

  // KPI Summary
  y = drawKPISummary(doc, data, y);

  // Value Breakdown
  y = drawValueBreakdown(doc, data, y);

  // Multi-Year Projection
  y = drawProjectionTable(doc, data, y);

  // Key Metrics
  if (totalHoursSaved > 0) {
    y = drawKeyMetrics(doc, data, y);
  }

  // Talking Points
  y = drawTalkingPoints(doc, data, y);

  // Footer
  drawFooter(doc);

  // Save the PDF
  const filename = `${calculation.name.replace(/[^a-z0-9]/gi, "_")}_ROI_Summary.pdf`;
  doc.save(filename);
}

function drawHeader(doc: jsPDF, data: PDFData, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Zapier orange accent bar
  doc.setFillColor(COLORS.orange);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(COLORS.darkGray);
  doc.text(data.calculation.name, 15, y + 10);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.mediumGray);
  doc.text("ROI Analysis", 15, y + 16);

  // Date
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }), pageWidth - 15, y + 10, { align: "right" });

  return y + 22;
}

function drawKPISummary(doc: jsPDF, data: PDFData, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 50) / 3;
  const boxHeight = 22;
  const startX = 15;

  // Annual Value box (with orange background)
  doc.setFillColor(COLORS.orange);
  doc.roundedRect(startX, y, boxWidth, boxHeight, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#FFFFFF");
  doc.text("Annual Value", startX + boxWidth / 2, y + 7, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(formatCurrencyCompact(data.totalValue), startX + boxWidth / 2, y + 16, { align: "center" });

  // Incremental Investment box
  const box2X = startX + boxWidth + 10;
  doc.setFillColor(COLORS.background);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray);
  doc.text("Incremental Investment", box2X + boxWidth / 2, y + 7, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.darkGray);
  doc.text(
    data.proposedInvestment > 0 ? formatCurrencyCompact(data.proposedInvestment) : "—",
    box2X + boxWidth / 2,
    y + 16,
    { align: "center" }
  );

  // ROI Multiple box
  const box3X = box2X + boxWidth + 10;
  doc.setFillColor(COLORS.background);
  doc.roundedRect(box3X, y, boxWidth, boxHeight, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray);
  doc.text("ROI Multiple", box3X + boxWidth / 2, y + 7, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLORS.orange);
  doc.text(
    data.roiMultiple ? formatMultiple(data.roiMultiple) : "—",
    box3X + boxWidth / 2,
    y + 16,
    { align: "center" }
  );

  return y + boxHeight + 8;
}

function drawValueBreakdown(doc: jsPDF, data: PDFData, y: number): number {
  if (data.breakdown.length === 0) return y;

  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.darkGray);
  doc.text("Value Breakdown by Category", 15, y);
  y += 6;

  // Draw each category bar
  for (const item of data.breakdown) {
    // Label and value
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.darkGray);
    doc.text(item.label, 15, y + 3);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.mediumGray);
    doc.text(
      `${formatCurrency(item.value)} (${formatPercent(item.percentage / 100)})`,
      pageWidth - 15,
      y + 3,
      { align: "right" }
    );

    // Background bar
    const barY = y + 5;
    const barWidth = pageWidth - 30;
    const barHeight = 4;

    doc.setFillColor(COLORS.background);
    doc.roundedRect(15, barY, barWidth, barHeight, 1, 1, "F");

    // Filled bar
    doc.setFillColor(item.color);
    const filledWidth = (item.percentage / 100) * barWidth;
    if (filledWidth > 0) {
      doc.roundedRect(15, barY, filledWidth, barHeight, 1, 1, "F");
    }

    y += 11;
  }

  return y + 3;
}

function drawProjectionTable(doc: jsPDF, data: PDFData, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { projections, proposedInvestment } = data;
  const years = data.calculation.assumptions.projectionYears;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.darkGray);
  doc.text("Multi-Year Projection", 15, y);
  y += 7;

  // Table setup
  const colWidth = (pageWidth - 30) / (projections.length + 2);
  const rowHeight = 8;
  let x = 15;

  // Header row
  doc.setFillColor(COLORS.background);
  doc.rect(15, y, pageWidth - 30, rowHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.mediumGray);

  x = 15 + colWidth; // Skip first column
  for (const p of projections) {
    doc.text(`Year ${p.year}`, x + colWidth / 2, y + 5.5, { align: "center" });
    x += colWidth;
  }
  doc.setTextColor(COLORS.orange);
  doc.text(`${years}-Year Total`, x + colWidth / 2, y + 5.5, { align: "center" });

  y += rowHeight;

  // Value row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.darkGray);
  doc.text("Value", 18, y + 5.5);

  x = 15 + colWidth;
  for (const p of projections) {
    doc.text(formatCurrencyCompact(p.value), x + colWidth / 2, y + 5.5, { align: "center" });
    x += colWidth;
  }
  const totalValue = projections.reduce((sum, p) => sum + p.value, 0);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrencyCompact(totalValue), x + colWidth / 2, y + 5.5, { align: "center" });

  y += rowHeight;

  // Investment and Net Value rows (if there's investment)
  if (proposedInvestment > 0) {
    // Investment row
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.mediumGray);
    doc.text("Investment", 18, y + 5.5);

    x = 15 + colWidth;
    for (const p of projections) {
      doc.text(formatCurrencyCompact(p.investment), x + colWidth / 2, y + 5.5, { align: "center" });
      x += colWidth;
    }
    const totalInvestment = projections.reduce((sum, p) => sum + p.investment, 0);
    doc.text(formatCurrencyCompact(totalInvestment), x + colWidth / 2, y + 5.5, { align: "center" });

    y += rowHeight;

    // Net Value row
    doc.setTextColor(COLORS.orange);
    doc.setFont("helvetica", "bold");
    doc.text("Net Value", 18, y + 5.5);

    x = 15 + colWidth;
    for (const p of projections) {
      doc.text(formatCurrencyCompact(p.netValue), x + colWidth / 2, y + 5.5, { align: "center" });
      x += colWidth;
    }
    const totalNetValue = projections.reduce((sum, p) => sum + p.netValue, 0);
    doc.text(formatCurrencyCompact(totalNetValue), x + colWidth / 2, y + 5.5, { align: "center" });

    y += rowHeight;
  }

  return y + 6;
}

function drawKeyMetrics(doc: jsPDF, data: PDFData, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 18;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.darkGray);
  doc.text("Key Metrics", 15, y);
  y += 6;

  // Hours saved box
  doc.setFillColor(COLORS.background);
  doc.roundedRect(15, y, boxWidth, boxHeight, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray);
  doc.text("Hours Saved per Month", 18, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatNumber(Math.round(data.totalHoursSaved)), 18, y + 14);

  // FTE box
  const box2X = 20 + boxWidth;
  doc.setFillColor(COLORS.background);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray);
  doc.text("FTE Equivalent per Year", box2X + 3, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.darkGray);
  doc.text(((data.totalHoursSaved * 12) / 2080).toFixed(1), box2X + 3, y + 14);

  return y + boxHeight + 6;
}

function drawTalkingPoints(doc: jsPDF, data: PDFData, y: number): number {
  const talkingPoints = data.calculation.talkingPoints ?? [];
  if (talkingPoints.length === 0) return y;

  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.darkGray);
  doc.text("Key Talking Points", 15, y);
  y += 6;

  // Talking points
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.darkGray);

  for (const point of talkingPoints) {
    // Bullet point
    doc.setFillColor(COLORS.orange);
    doc.circle(18, y - 0.5, 1, "F");

    // Text (with word wrap)
    const lines = doc.splitTextToSize(point, pageWidth - 40);
    doc.text(lines, 22, y);
    y += lines.length * 4 + 2;
  }

  return y;
}

function drawFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Footer line
  doc.setDrawColor(COLORS.lightGray);
  doc.line(15, pageHeight - 10, pageWidth - 15, pageHeight - 10);

  // Footer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightGray);
  doc.text("Generated by Zapier ROI Calculator", 15, pageHeight - 6);
  doc.text(
    new Date().toLocaleDateString(),
    pageWidth - 15,
    pageHeight - 6,
    { align: "right" }
  );
}
