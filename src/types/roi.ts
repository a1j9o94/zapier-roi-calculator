import type { Id } from "../../convex/_generated/dataModel";

// ============================================================
// UVS V2 Core Types
// ============================================================

// 5 UVS Dimensions
export type Dimension =
  | "revenue_impact"
  | "speed_cycle_time"
  | "productivity"
  | "cost_avoidance"
  | "risk_quality";

// 16 UVS Archetypes (grouped by dimension)
export type Archetype =
  // Revenue Impact (1.x)
  | "pipeline_velocity"
  | "revenue_capture"
  | "revenue_expansion"
  | "time_to_revenue"
  // Speed / Cycle Time (2.x)
  | "process_acceleration"
  | "handoff_elimination"
  // Productivity (3.x)
  | "task_elimination"
  | "task_simplification"
  | "context_surfacing"
  // Cost Avoidance (4.x)
  | "labor_avoidance"
  | "tool_consolidation"
  | "error_rework_elimination"
  // Risk & Quality (5.x)
  | "compliance_assurance"
  | "data_integrity"
  | "incident_prevention"
  | "process_consistency";

// Input confidence tiers (from value driver tree)
// [B] = Case-study-backed real data (benchmarked)
// [E] = Industry research + Zapier internal data (estimated)
// [C] = No reasonable basis — customer fills inputs (custom)
export type ConfidenceTier = "benchmarked" | "estimated" | "custom";

// Each value item input tracks its source
export interface ValueInput {
  value: number;
  confidence: ConfidenceTier;
  source?: string; // "Customer-reported", "Industry benchmark: Gartner 2025", etc.
}

// Archetype → Dimension mapping
export const ARCHETYPE_DIMENSION: Record<Archetype, Dimension> = {
  pipeline_velocity: "revenue_impact",
  revenue_capture: "revenue_impact",
  revenue_expansion: "revenue_impact",
  time_to_revenue: "revenue_impact",
  process_acceleration: "speed_cycle_time",
  handoff_elimination: "speed_cycle_time",
  task_elimination: "productivity",
  task_simplification: "productivity",
  context_surfacing: "productivity",
  labor_avoidance: "cost_avoidance",
  tool_consolidation: "cost_avoidance",
  error_rework_elimination: "cost_avoidance",
  compliance_assurance: "risk_quality",
  data_integrity: "risk_quality",
  incident_prevention: "risk_quality",
  process_consistency: "risk_quality",
};

// ============================================================
// Use Case types
// ============================================================

export type UseCaseStatus = "identified" | "in_progress" | "deployed" | "future";
export type ImplementationEffort = "low" | "medium" | "high";

export interface UseCaseMetric {
  name: string;
  before?: string;
  after?: string;
  improvement?: string;
}

export type ArchitectureItemType = "zap" | "interface" | "table" | "agent";
export type ArchitectureItemStatus = "planned" | "building" | "active" | "paused";

export interface ZapStepDetails {
  appTitle: string;
  appImageUrl?: string;
  appColor?: string;
  actionTitle: string;
  actionType?: string;
  isInstant?: boolean;
}

export interface ZapDetails {
  title?: string;
  isEnabled?: boolean;
  lastSuccessfulRun?: string;
  steps?: ZapStepDetails[];
  fetchedAt?: number;
}

export interface ZapConfig {
  title?: string;
  steps?: Array<{
    action: string;
    inputs?: Record<string, unknown>;
    authentication?: string;
    alias?: string;
  }>;
}

export interface ArchitectureItem {
  type: ArchitectureItemType;
  name: string;
  url?: string;
  zapId?: string;
  description?: string;
  status?: ArchitectureItemStatus;
  zapDetails?: ZapDetails;
  zapConfig?: ZapConfig;
}

export interface UseCase {
  _id: Id<"useCases">;
  _creationTime: number;
  calculationId: Id<"calculations">;
  shortId?: string;
  name: string;
  department?: string;
  status: UseCaseStatus;
  implementationEffort: ImplementationEffort;
  description?: string;
  metrics?: UseCaseMetric[];
  architecture?: ArchitectureItem[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// Value Item types
// ============================================================

export interface ValueItem {
  _id: Id<"valueItems">;
  _creationTime: number;
  calculationId: Id<"calculations">;
  shortId?: string;
  archetype: Archetype;
  dimension: Dimension; // Denormalized from archetype
  name: string;
  description?: string;
  inputs: Record<string, ValueInput>; // Typed per archetype on frontend
  manualAnnualValue?: number;
  useCaseId?: Id<"useCases">;
  order: number;
}

// ============================================================
// Calculation types
// ============================================================

export type RateTier = "admin" | "operations" | "salesOps" | "engineering" | "manager" | "executive";

export interface DefaultRates {
  admin: number;       // $60-80K loaded -> ~$30-40/hr
  operations: number;  // $80-120K -> ~$40-60/hr
  salesOps: number;    // $100-140K -> ~$50-70/hr
  engineering: number; // $150-200K -> ~$75-100/hr
  manager: number;     // $140-180K -> ~$70-90/hr
  executive: number;   // $200K+ -> ~$100+/hr
}

export interface Assumptions {
  projectionYears: number;
  realizationRamp: number[];
  annualGrowthRate: number;
  defaultRates: DefaultRates;
}

export interface ObfuscationSettings {
  companyDescriptor?: string; // "Fortune 500 Shipping Company"
  hideNotes?: boolean;
  roundValues?: boolean;
}

export type Role =
  | "executive"
  | "revops"
  | "marketing"
  | "sales_cs"
  | "it"
  | "hr"
  | "finance"
  | "engineering"
  | "support"
  | "supply_chain";

export interface Calculation {
  _id: Id<"calculations">;
  _creationTime: number;
  name: string;
  shortId: string;
  createdAt: number;
  updatedAt: number;
  obfuscation?: ObfuscationSettings;
  assumptions: Assumptions;
  currentSpend?: number;
  proposedSpend?: number;
  talkingPoints?: string[];
  role?: Role;
  priorityOrder?: Dimension[];
}

// ============================================================
// Computed types (returned by API, not stored)
// ============================================================

export interface ComputedValue {
  annualValue: number;
  formula: string; // Human-readable formula trace
  confidence: ConfidenceTier; // Lowest confidence of any input
}

export interface DimensionTotal {
  dimension: Dimension;
  label: string;
  total: number;
  itemCount: number;
  color: string;
  percentage: number;
}

export interface YearProjection {
  year: number;
  value: number;
  investment: number;
  netValue: number;
  cumulativeValue: number;
  cumulativeInvestment: number;
  cumulativeNetValue: number;
}

export interface CalculationSummary {
  totalAnnualValue: number;
  dimensionTotals: DimensionTotal[];
  roiMultiple: number | null;
  hoursSavedPerMonth: number;
  fteEquivalent: number;
  projection: YearProjection[];
}

// ============================================================
// Display metadata
// ============================================================

export const DIMENSION_INFO: Record<
  Dimension,
  { label: string; shortLabel: string; description: string; color: string; icon: string }
> = {
  revenue_impact: {
    label: "Revenue Impact",
    shortLabel: "Revenue",
    description: "How automation increases top-line revenue",
    color: "#10B981", // Green
    icon: "TrendingUp",
  },
  speed_cycle_time: {
    label: "Speed / Cycle Time",
    shortLabel: "Speed",
    description: "How automation accelerates business processes",
    color: "#3B82F6", // Blue
    icon: "Zap",
  },
  productivity: {
    label: "Productivity",
    shortLabel: "Productivity",
    description: "How automation eliminates or simplifies manual work",
    color: "#FF4A00", // Zapier orange
    icon: "Clock",
  },
  cost_avoidance: {
    label: "Cost Avoidance",
    shortLabel: "Cost",
    description: "How automation prevents unnecessary spending",
    color: "#8B5CF6", // Purple
    icon: "DollarSign",
  },
  risk_quality: {
    label: "Risk & Quality",
    shortLabel: "Risk",
    description: "How automation reduces errors and ensures compliance",
    color: "#EF4444", // Red
    icon: "Shield",
  },
};

export const DIMENSION_ORDER: Dimension[] = [
  "revenue_impact",
  "speed_cycle_time",
  "productivity",
  "cost_avoidance",
  "risk_quality",
];

export const ARCHETYPE_INFO: Record<
  Archetype,
  { label: string; description: string; dimension: Dimension; formulaDescription: string }
> = {
  // Revenue Impact
  pipeline_velocity: {
    label: "Pipeline Velocity",
    description: "Automation increases deal flow rate through pipeline",
    dimension: "revenue_impact",
    formulaDescription: "dealsPerQuarter x avgDealValue x conversionLift x 4",
  },
  revenue_capture: {
    label: "Revenue Capture",
    description: "Automation catches revenue that would otherwise leak",
    dimension: "revenue_impact",
    formulaDescription: "annualRevenue x leakageRate x captureImprovement",
  },
  revenue_expansion: {
    label: "Revenue Expansion",
    description: "Automation drives upsell/cross-sell at scale",
    dimension: "revenue_impact",
    formulaDescription: "customerBase x expansionRate x avgExpansionValue x lift",
  },
  time_to_revenue: {
    label: "Time-to-Revenue",
    description: "Automation accelerates revenue recognition from new customers",
    dimension: "revenue_impact",
    formulaDescription: "newCustomersPerYear x revenuePerCustomer x daysAccelerated / 365",
  },
  // Speed / Cycle Time
  process_acceleration: {
    label: "Process Acceleration",
    description: "Automation reduces end-to-end cycle time for a process",
    dimension: "speed_cycle_time",
    formulaDescription: "processesPerMonth x (timeBeforeHrs - timeAfterHrs) x hourlyRate x 12",
  },
  handoff_elimination: {
    label: "Handoff Elimination",
    description: "Automation removes manual handoff delays between people/systems",
    dimension: "speed_cycle_time",
    formulaDescription: "handoffsPerMonth x avgQueueTimeHrs x hourlyRate x 12",
  },
  // Productivity
  task_elimination: {
    label: "Task Elimination",
    description: "Automation fully replaces manual tasks",
    dimension: "productivity",
    formulaDescription: "tasksPerMonth x minutesPerTask x (hourlyRate / 60) x 12",
  },
  task_simplification: {
    label: "Task Simplification",
    description: "Automation reduces time per task (not eliminates)",
    dimension: "productivity",
    formulaDescription: "tasksPerMonth x minutesSavedPerTask x (hourlyRate / 60) x 12",
  },
  context_surfacing: {
    label: "Context Surfacing",
    description: "Automation delivers information proactively, reducing meetings and searches",
    dimension: "productivity",
    formulaDescription: "(meetingsAvoided x attendees x durationHrs x avgHourlyRate x 12) + (searchesAvoided x avgSearchTimeMin x (hourlyRate / 60) x 12)",
  },
  // Cost Avoidance
  labor_avoidance: {
    label: "Labor Avoidance",
    description: "Automation prevents the need to hire additional headcount",
    dimension: "cost_avoidance",
    formulaDescription: "ftesAvoided x fullyLoadedAnnualCost",
  },
  tool_consolidation: {
    label: "Tool Consolidation",
    description: "Automation enables eliminating redundant software tools",
    dimension: "cost_avoidance",
    formulaDescription: "toolsEliminated x annualLicenseCostPerTool",
  },
  error_rework_elimination: {
    label: "Error/Rework Elimination",
    description: "Automation prevents errors that require costly rework",
    dimension: "cost_avoidance",
    formulaDescription: "errorsPerMonth x avgCostPerError x reductionRate x 12",
  },
  // Risk & Quality
  compliance_assurance: {
    label: "Compliance Assurance",
    description: "Automation reduces compliance violations and associated penalties",
    dimension: "risk_quality",
    formulaDescription: "expectedViolationsPerYear x avgPenaltyPerViolation x reductionRate",
  },
  data_integrity: {
    label: "Data Integrity",
    description: "Automation ensures data consistency across systems",
    dimension: "risk_quality",
    formulaDescription: "recordsPerMonth x errorRate x costPerError x reductionRate x 12",
  },
  incident_prevention: {
    label: "Incident Prevention",
    description: "Automation prevents or reduces impact of operational incidents",
    dimension: "risk_quality",
    formulaDescription: "incidentsPerYear x avgCostPerIncident x reductionRate",
  },
  process_consistency: {
    label: "Process Consistency",
    description: "Automation ensures processes execute the same way every time",
    dimension: "risk_quality",
    formulaDescription: "processesPerMonth x defectRate x costPerDefect x reductionRate x 12",
  },
};

// Use Case display metadata
export const USE_CASE_STATUS_INFO: Record<
  UseCaseStatus,
  { label: string; color: string; bgColor: string }
> = {
  identified: {
    label: "Identified",
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
  in_progress: {
    label: "In Progress",
    color: "#D97706",
    bgColor: "#FEF3C7",
  },
  deployed: {
    label: "Deployed",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  future: {
    label: "Future",
    color: "#2563EB",
    bgColor: "#DBEAFE",
  },
};

export const IMPLEMENTATION_EFFORT_INFO: Record<
  ImplementationEffort,
  { label: string; color: string; tooltip: string }
> = {
  low: {
    label: "Quick Win",
    color: "#10B981",
    tooltip: "Can be built in 1-2 hours. Simple trigger-action Zap, minimal configuration.",
  },
  medium: {
    label: "Standard",
    color: "#F59E0B",
    tooltip: "Requires 1-2 days. Multi-step Zap with conditional logic, API integrations, or custom mappings.",
  },
  high: {
    label: "Complex",
    color: "#EF4444",
    tooltip: "Requires 1-2 weeks. Multi-Zap architecture, custom code steps, Tables, or Interfaces. May need Zapier expert.",
  },
};

// Default assumptions for new calculations
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  projectionYears: 3,
  realizationRamp: [0.5, 1, 1],
  annualGrowthRate: 0.1,
  defaultRates: {
    admin: 35,
    operations: 50,
    salesOps: 60,
    engineering: 88,
    manager: 80,
    executive: 105,
  },
};
