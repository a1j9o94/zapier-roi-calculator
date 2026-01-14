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
}

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
