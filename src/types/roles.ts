import type { Dimension, Role } from "./roi";

// ============================================================
// Role-based dimension prioritization
// Same UI, different dimension ordering per role
// ============================================================

export const ROLE_DEFAULT_PRIORITIES: Record<Role, Dimension[]> = {
  executive: ["revenue_impact", "risk_quality", "productivity", "speed_cycle_time", "cost_avoidance"],
  revops: ["revenue_impact", "speed_cycle_time", "productivity", "cost_avoidance", "risk_quality"],
  marketing: ["revenue_impact", "speed_cycle_time", "productivity", "cost_avoidance", "risk_quality"],
  sales_cs: ["revenue_impact", "speed_cycle_time", "productivity", "cost_avoidance", "risk_quality"],
  it: ["productivity", "cost_avoidance", "risk_quality", "speed_cycle_time", "revenue_impact"],
  hr: ["speed_cycle_time", "productivity", "cost_avoidance", "risk_quality", "revenue_impact"],
  finance: ["cost_avoidance", "risk_quality", "revenue_impact", "productivity", "speed_cycle_time"],
  engineering: ["productivity", "speed_cycle_time", "risk_quality", "cost_avoidance", "revenue_impact"],
  support: ["speed_cycle_time", "productivity", "cost_avoidance", "risk_quality", "revenue_impact"],
  supply_chain: ["cost_avoidance", "speed_cycle_time", "risk_quality", "productivity", "revenue_impact"],
};

export const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  executive: {
    label: "Executive / C-Suite",
    description: "Revenue and risk-focused. Wants the big picture: ROI, strategic value, risk mitigation.",
  },
  revops: {
    label: "Revenue Operations",
    description: "Pipeline velocity, lead routing, deal acceleration. Revenue and speed are primary drivers.",
  },
  marketing: {
    label: "Marketing",
    description: "Campaign automation, lead nurture, attribution. Revenue and speed matter most.",
  },
  sales_cs: {
    label: "Sales & Customer Success",
    description: "Deal management, renewal automation, customer health. Revenue and speed focused.",
  },
  it: {
    label: "IT / Systems Admin",
    description: "Productivity and cost reduction. Governance, security, and tool sprawl are key concerns.",
  },
  hr: {
    label: "Human Resources",
    description: "Onboarding speed, process efficiency, compliance. Speed and productivity lead.",
  },
  finance: {
    label: "Finance / Accounting",
    description: "Cost avoidance and risk reduction. Month-end close, AP/AR, audit compliance.",
  },
  engineering: {
    label: "Engineering",
    description: "Developer productivity, CI/CD, incident management. Productivity and speed are core.",
  },
  support: {
    label: "Support / Customer Service",
    description: "Ticket resolution speed, deflection, knowledge surfacing. Speed and productivity first.",
  },
  supply_chain: {
    label: "Supply Chain / Operations",
    description: "Cost control, process reliability, delivery speed. Cost avoidance and speed lead.",
  },
};
