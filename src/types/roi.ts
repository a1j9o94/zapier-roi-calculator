import type { Id } from "../../convex/_generated/dataModel";

export type Category =
  | "time_savings"
  | "revenue_impact"
  | "cost_reduction"
  | "uptime"
  | "security_governance"
  | "tool_consolidation";

export type RateTier = "basic" | "operations" | "engineering" | "executive";

export type Complexity = "simple" | "medium" | "complex";

export interface HourlyRates {
  basic: number;
  operations: number;
  engineering: number;
  executive: number;
}

export interface TaskMinutes {
  simple: number;
  medium: number;
  complex: number;
}

export interface Assumptions {
  hourlyRates: HourlyRates;
  taskMinutes: TaskMinutes;
  projectionYears: number;
  realizationRamp: number[];
  annualGrowthRate: number;
  avgDataBreachCost: number;
  avgSupportTicketCost: number;
}

export interface Calculation {
  _id: Id<"calculations">;
  _creationTime: number;
  name: string;
  shortId?: string;
  createdAt: number;
  updatedAt: number;
  assumptions: Assumptions;
  currentSpend?: number;
  proposedSpend?: number;
  talkingPoints?: string[];
}

export interface ValueItem {
  _id: Id<"valueItems">;
  _creationTime: number;
  calculationId: Id<"calculations">;
  category: Category;
  name: string;
  description?: string;
  quantity: number;
  unitValue: number;
  rate?: number;
  rateTier?: RateTier;
  complexity?: Complexity;
  manualAnnualValue?: number;
  notes?: string;
  order: number;
  useCaseId?: Id<"useCases">;
}

// Use Case types
export type UseCaseStatus = "identified" | "in_progress" | "deployed" | "future";
export type UseCaseDifficulty = "low" | "medium" | "high";

export interface UseCaseMetric {
  name: string;
  before?: string;
  after?: string;
  improvement?: string;
}

export interface UseCase {
  _id: Id<"useCases">;
  _creationTime: number;
  calculationId: Id<"calculations">;
  name: string;
  department?: string;
  status: UseCaseStatus;
  difficulty: UseCaseDifficulty;
  description?: string;
  notes?: string;
  metrics?: UseCaseMetric[];
  order: number;
  createdAt: number;
  updatedAt: number;
}

// Use Case status display metadata
export const USE_CASE_STATUS_INFO: Record<
  UseCaseStatus,
  { label: string; color: string; bgColor: string }
> = {
  identified: {
    label: "Identified",
    color: "#6B7280", // Gray
    bgColor: "#F3F4F6",
  },
  in_progress: {
    label: "In Progress",
    color: "#D97706", // Amber
    bgColor: "#FEF3C7",
  },
  deployed: {
    label: "Deployed",
    color: "#059669", // Green
    bgColor: "#D1FAE5",
  },
  future: {
    label: "Future",
    color: "#2563EB", // Blue
    bgColor: "#DBEAFE",
  },
};

// Use Case difficulty display metadata
export const USE_CASE_DIFFICULTY_INFO: Record<
  UseCaseDifficulty,
  { label: string; color: string }
> = {
  low: {
    label: "Low",
    color: "#10B981", // Green
  },
  medium: {
    label: "Medium",
    color: "#F59E0B", // Amber
  },
  high: {
    label: "High",
    color: "#EF4444", // Red
  },
};

// Category display metadata
export const CATEGORY_INFO: Record<
  Category,
  { label: string; description: string; color: string }
> = {
  time_savings: {
    label: "Time Savings",
    description: "Productivity gains from automation",
    color: "#FF4A00", // Zapier orange
  },
  revenue_impact: {
    label: "Revenue Impact",
    description: "Top-line growth from improved processes",
    color: "#10B981", // Green
  },
  cost_reduction: {
    label: "Cost Reduction",
    description: "Bottom-line savings from efficiency",
    color: "#3B82F6", // Blue
  },
  uptime: {
    label: "Uptime / Reliability",
    description: "Disruption avoidance and risk reduction",
    color: "#8B5CF6", // Purple
  },
  security_governance: {
    label: "Security & Governance",
    description: "Risk mitigation and compliance",
    color: "#EF4444", // Red
  },
  tool_consolidation: {
    label: "Tool Consolidation",
    description: "Strategic platform simplification",
    color: "#F59E0B", // Amber
  },
};

// Category order for display
export const CATEGORY_ORDER: Category[] = [
  "time_savings",
  "revenue_impact",
  "cost_reduction",
  "uptime",
  "security_governance",
  "tool_consolidation",
];
