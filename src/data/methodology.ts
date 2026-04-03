export interface StudyReference {
  author: string;
  year: number | string;
  title: string;
  finding: string;
  sampleSize?: string;
  url?: string;
  tier: "A" | "B" | "C" | "D";
}

export interface ArchetypeEvidence {
  archetype: string;
  label: string;
  dimension: string;
  dimensionColor: string;
  formula: string;
  category2Inputs: { field: string; defaultValue: string; range: string; tier: string }[];
  externalStudies: StudyReference[];
  zapierStudies: StudyReference[];
  coverageStatus: "GREEN" | "YELLOW" | "NA";
  coverageExplanation: string;
  sourcePageDraft: string;
}

const DIMENSION_COLORS = {
  Revenue: "#32372C",
  Productivity: "#FF4F00",
  Cost: "#8B5CF6",
  Risk: "#E46962",
};

// ── Revenue Archetypes ──────────────────────────────────────────────

const pipelineVelocity: ArchetypeEvidence = {
  archetype: "pipeline_velocity",
  label: "Pipeline Velocity",
  dimension: "Revenue",
  dimensionColor: DIMENSION_COLORS.Revenue,
  formula: "deals/quarter × avg_deal_value × conversion_lift × 4",
  category2Inputs: [
    { field: "dealsPerQuarter", defaultValue: "200", range: "50–1,000", tier: "C" },
    { field: "avgDealValue", defaultValue: "$25,000", range: "$5K–$500K", tier: "A" },
    { field: "conversionLift", defaultValue: "10%", range: "5–25%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Blazeo",
      year: 2026,
      title: "Speed-to-Lead Response Time Statistics",
      finding: "21x higher contact rate when responding in <5 minutes vs. 30 minutes",
      url: "https://www.prnewswire.com/news-releases/blazeo-unveils-2026-speed-to-lead-benchmark-report-302694994.html",
      tier: "B",
    },
    {
      author: "Pedowitz Group",
      year: 2025,
      title: "Revenue Operations Automation Benchmark",
      finding: "40% increase in lead-to-opportunity conversion with automated routing and follow-up",
      url: "https://www.pedowitzgroup.com/ai-lead-routing-with-predictive-intent-signals",
      tier: "B",
    },
    {
      author: "Revenue Velocity Lab",
      year: 2025,
      title: "Pipeline Acceleration Through Automation",
      finding: "14% improvement in pipeline conversion across 47,832 deals with automated nurture workflows",
      sampleSize: "47,832 deals",
      tier: "A",
    },
    {
      author: "Jeeva AI",
      year: 2026,
      title: "AI-Powered Lead Response Benchmarks",
      finding: "87% faster initial lead response time with AI-automated outreach sequences",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Strong external evidence for speed-to-lead and conversion lift. No Zapier-specific pipeline velocity case study yet.",
  sourcePageDraft: "Pipeline velocity value is driven by speed-to-lead research showing dramatic conversion improvements when response times drop below 5 minutes.",
};

const revenueCapture: ArchetypeEvidence = {
  archetype: "revenue_capture",
  label: "Revenue Capture",
  dimension: "Revenue",
  dimensionColor: DIMENSION_COLORS.Revenue,
  formula: "annual_revenue × leakage_rate × capture_improvement",
  category2Inputs: [
    { field: "annualRevenue", defaultValue: "$10,000,000", range: "$1M–$1B", tier: "A" },
    { field: "leakageRate", defaultValue: "5%", range: "3–10%", tier: "C" },
    { field: "captureImprovement", defaultValue: "30%", range: "10–50%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Gartner",
      year: 2024,
      title: "Revenue Leakage in B2B Organizations",
      finding: "50% of B2B organizations lose 7–10% of revenue to billing errors, contract mismanagement, and process gaps",
      url: "https://www.oplacrm.com/en/post/revenue-leakage-in-b2b-is-10-of-your-revenue-evaporating-unnoticed",
      tier: "A",
    },
    {
      author: "LedgerUp",
      year: 2025,
      title: "SaaS Revenue Leakage Analysis",
      finding: "SaaS companies typically leak 3–5% of ARR through failed charges, dunning gaps, and upgrade friction",
      url: "https://www.ledgerup.ai/resources/revenue-leakage-saas",
      tier: "B",
    },
    {
      author: "DealHub",
      year: 2025,
      title: "CPQ and Revenue Integrity Report",
      finding: "Automated quoting and billing reduces revenue leakage by 25–40% through error elimination and faster renewals",
      tier: "B",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Arden Insurance",
      year: 2025,
      title: "Arden Insurance Revenue Capture Case Study",
      finding: "Automated quote-to-bind workflow captured $150M/year in premium revenue that previously leaked through manual handoffs",
      url: "https://zapier.com/customer-stories/arden-insurance",
      tier: "A",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Strong external evidence from Gartner plus a validated Zapier customer case at Arden Insurance.",
  sourcePageDraft: "Revenue leakage is a well-documented problem. Gartner finds 50% of B2B orgs lose 7–10% of revenue. Automation closes the gaps.",
};

const revenueExpansion: ArchetypeEvidence = {
  archetype: "revenue_expansion",
  label: "Revenue Expansion",
  dimension: "Revenue",
  dimensionColor: DIMENSION_COLORS.Revenue,
  formula: "customer_base × expansion_rate × avg_value × lift",
  category2Inputs: [
    { field: "customerBase", defaultValue: "500", range: "50–50,000", tier: "A" },
    { field: "expansionRate", defaultValue: "15%", range: "5–40%", tier: "C" },
    { field: "avgExpansionValue", defaultValue: "$5,000", range: "$500–$100K", tier: "A" },
    { field: "lift", defaultValue: "20%", range: "10–40%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Pedowitz Group",
      year: 2025,
      title: "Upsell and Cross-sell Automation ROI",
      finding: "20–30% increase in upsell acceptance rate with automated trigger-based expansion campaigns",
      url: "https://www.pedowitzgroup.com/ai-driven-upsell-cross-sell-recommendations",
      tier: "B",
    },
    {
      author: "Growth Suite",
      year: 2026,
      title: "AI-Driven Expansion Revenue Benchmarks",
      finding: "2.4x higher expansion offer acceptance rate when AI identifies optimal timing and offer type",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Moderate external evidence. No Zapier-specific expansion case study. Need customer story showing automated upsell/cross-sell lift.",
  sourcePageDraft: "Expansion revenue benefits from automation through better timing and personalization of upsell offers.",
};

const timeToRevenue: ArchetypeEvidence = {
  archetype: "time_to_revenue",
  label: "Time to Revenue",
  dimension: "Revenue",
  dimensionColor: DIMENSION_COLORS.Revenue,
  formula: "customers/yr × revenue/customer × days_accelerated / 365",
  category2Inputs: [
    { field: "customersPerYear", defaultValue: "100", range: "10–10,000", tier: "A" },
    { field: "revenuePerCustomer", defaultValue: "$50,000", range: "$1K–$1M", tier: "A" },
    { field: "daysAccelerated", defaultValue: "14", range: "5–90", tier: "C" },
  ],
  externalStudies: [
    {
      author: "SDLC Corp",
      year: 2025,
      title: "Customer Onboarding Acceleration Study",
      finding: "Automated onboarding reduced time-to-value from 20 days to 8 days (60% reduction)",
      tier: "B",
    },
    {
      author: "Zams",
      year: 2025,
      title: "Instant Account Provisioning Impact",
      finding: "AI-automated provisioning cut onboarding from 14 days to 14 minutes",
      tier: "C",
    },
    {
      author: "Revenue Velocity Lab",
      year: 2025,
      title: "Time-to-Revenue Compression Analysis",
      finding: "14.8 days average reduction in time-to-first-value with automated onboarding sequences",
      tier: "B",
    },
    {
      author: "ESG Success",
      year: 2025,
      title: "Enterprise Onboarding Time Study",
      finding: "Complex enterprise onboarding reduced from 90 days to 30 days (67% reduction) with workflow automation",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Good external evidence across multiple sources. Need a Zapier customer story showing onboarding acceleration.",
  sourcePageDraft: "Faster onboarding means faster revenue recognition. Multiple studies show 60–67% reduction in time-to-value with automation.",
};

// ── Productivity Archetypes ─────────────────────────────────────────

const processAcceleration: ArchetypeEvidence = {
  archetype: "process_acceleration",
  label: "Process Acceleration",
  dimension: "Productivity",
  dimensionColor: DIMENSION_COLORS.Productivity,
  formula: "processes/mo × (time_before - time_after) × hourly_rate × 12",
  category2Inputs: [
    { field: "processesPerMonth", defaultValue: "200", range: "20–5,000", tier: "A" },
    { field: "timeBefore", defaultValue: "60 min", range: "10–480 min", tier: "C" },
    { field: "timeAfter", defaultValue: "15 min", range: "1–120 min", tier: "C" },
    { field: "hourlyRate", defaultValue: "$50", range: "$25–$200", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Gitnux",
      year: 2025,
      title: "Business Process Automation Statistics",
      finding: "50–70% reduction in process cycle time with automation across surveyed enterprises",
      url: "https://gitnux.org/workflow-automation-statistics/",
      tier: "B",
    },
    {
      author: "Forrester / Pipefy",
      year: 2024,
      title: "Total Economic Impact of Process Automation",
      finding: "40% process acceleration through elimination of manual steps and approval bottlenecks",
      url: "https://tei.forrester.com/go/Pipefy/PipefyTEI",
      tier: "A",
    },
    {
      author: "Nucleus Research / Paycom",
      year: 2024,
      title: "HR Process Automation ROI",
      finding: "63–80% reduction in HR process completion time (onboarding, PTO, expense approvals)",
      url: "https://pycm.co/4qEKiui",
      tier: "A",
    },
    {
      author: "BCG / Harvard Business School",
      year: 2023,
      title: "The Impact of AI on Knowledge Worker Productivity",
      finding: "Consultants using AI completed tasks 10% faster with higher quality output",
      url: "https://www.bcg.com/publications/2024/gen-ai-increases-productivity-and-expands-capabilities",
      tier: "A",
    },
    {
      author: "GitHub",
      year: 2024,
      title: "GitHub Copilot Productivity Study",
      finding: "26% faster task completion for developers using AI-assisted coding tools",
      url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4945566",
      tier: "A",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Premiere Property Group",
      year: 2025,
      title: "Premiere Property Onboarding Automation",
      finding: "Saved 100 hours per agent onboarding through automated workflow provisioning and training sequences",
      url: "https://zapier.com/customer-stories/premiere-property-group",
      tier: "B",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Strong multi-source evidence including Forrester TEI, Nucleus Research, and a Zapier customer case.",
  sourcePageDraft: "Process acceleration is the most broadly evidenced category with peer-reviewed studies showing 40–80% cycle time reduction.",
};

const handoffElimination: ArchetypeEvidence = {
  archetype: "handoff_elimination",
  label: "Handoff Elimination",
  dimension: "Productivity",
  dimensionColor: DIMENSION_COLORS.Productivity,
  formula: "handoffs/mo × queue_time × hourly_rate × 12",
  category2Inputs: [],
  externalStudies: [],
  zapierStudies: [],
  coverageStatus: "NA",
  coverageExplanation: "No Category 2 inputs defined. Handoff elimination value is typically captured through process_acceleration or task_elimination archetypes.",
  sourcePageDraft: "Handoff delays are a major source of process waste. This archetype quantifies the queue time cost between process steps.",
};

const taskElimination: ArchetypeEvidence = {
  archetype: "task_elimination",
  label: "Task Elimination",
  dimension: "Productivity",
  dimensionColor: DIMENSION_COLORS.Productivity,
  formula: "tasks/mo × minutes/task × (hourly_rate/60) × 12",
  category2Inputs: [
    { field: "tasksPerMonth", defaultValue: "3,000", range: "100–100,000", tier: "B" },
    { field: "minutesPerTask", defaultValue: "8", range: "2–60", tier: "C" },
    { field: "hourlyRate", defaultValue: "$50", range: "$25–$200", tier: "C" },
  ],
  externalStudies: [
    {
      author: "McKinsey & Company",
      year: 2024,
      title: "The State of AI: How Organizations Are Rewiring to Capture Value",
      finding: "60–70% of worker tasks are automatable with current AI and workflow technology",
      url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-AI-the-next-productivity-frontier",
      tier: "A",
    },
    {
      author: "Freshservice",
      year: 2025,
      title: "AI-Powered IT Service Management Impact Report",
      finding: "65.7% ticket deflection rate, saving 431,000 agent hours across customer base",
      sampleSize: "187M tickets analyzed",
      url: "https://www.freshworks.com/freshservice/benchmark-report-2025/",
      tier: "A",
    },
    {
      author: "Gartner",
      year: 2024,
      title: "AI Agent Impact on Employee Productivity",
      finding: "60% higher task completion rate when employees have AI-powered task automation",
      url: "https://www.usepylon.com/blog/ai-powered-customer-support-guide",
      tier: "A",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Remote",
      year: 2025,
      title: "Remote.com Automation at Scale",
      finding: "11M automated tasks saving 2,219 workdays per month across global operations",
      url: "https://zapier.com/customer-stories/remote",
      tier: "A",
    },
    {
      author: "Zapier — Arden Insurance",
      year: 2025,
      title: "Arden Insurance Task Automation",
      finding: "34,000 hours per year saved through automated policy processing and claims workflows",
      url: "https://zapier.com/customer-stories/arden-insurance",
      tier: "A",
    },
    {
      author: "Zapier — Wellness Coach",
      year: 2025,
      title: "Solo Business Automation ROI",
      finding: "550 hours per year saved by automating client scheduling, follow-ups, and intake forms",
      url: "https://zapier.com/customer-stories/wellness-coach",
      tier: "B",
    },
    {
      author: "Zapier — Internal Impact Survey",
      year: 2026,
      title: "Zap Impact Survey: Personal Productivity Baseline",
      finding: "70% of Zapier users report individual productivity improvement. Top tasks eliminated: manual data entry (45%), copy/pasting between tools (38%). 66% save <30 min/Zap/week, 22% save 1–3 hours",
      sampleSize: "116 respondents",
      tier: "B",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Strongest evidence base across all archetypes. McKinsey, Freshservice (187M tickets), three Zapier customer stories, and internal impact survey (n=116).",
  sourcePageDraft: "Task elimination is the foundation of automation ROI. McKinsey estimates 60–70% of tasks are automatable. Zapier customers validate this at scale. Internal survey shows 70% of users report productivity gains.",
};

const taskSimplification: ArchetypeEvidence = {
  archetype: "task_simplification",
  label: "Task Simplification",
  dimension: "Productivity",
  dimensionColor: DIMENSION_COLORS.Productivity,
  formula: "tasks/mo × minutes_saved × (hourly_rate/60) × 12",
  category2Inputs: [
    { field: "tasksPerMonth", defaultValue: "1,000", range: "100–50,000", tier: "C" },
    { field: "minutesSaved", defaultValue: "5", range: "1–30", tier: "C" },
    { field: "hourlyRate", defaultValue: "$50", range: "$25–$200", tier: "C" },
  ],
  externalStudies: [
    {
      author: "BCG / Harvard Business School",
      year: 2023,
      title: "Navigating the Jagged Technological Frontier",
      finding: "49% faster completion on complex creative tasks when augmented with AI tools",
      url: "https://www.bcg.com/publications/2024/gen-ai-increases-productivity-and-expands-capabilities",
      tier: "A",
    },
    {
      author: "Google",
      year: 2024,
      title: "AI-Assisted Productivity in Enterprise Settings",
      finding: "21% reduction in task completion time for information-gathering and summarization work",
      url: "https://arxiv.org/pdf/2410.12944",
      tier: "A",
    },
    {
      author: "GitHub",
      year: 2024,
      title: "Copilot Impact on Developer Productivity",
      finding: "12–26% faster task completion depending on task complexity and developer experience",
      url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4945566",
      tier: "A",
    },
    {
      author: "Forrester",
      year: 2024,
      title: "The ROI of Workflow Simplification",
      finding: "40% reduction in task complexity and steps required when manual processes are augmented with automation",
      url: "https://tei.forrester.com/go/Pipefy/PipefyTEI",
      tier: "B",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Brandon Sammut",
      year: 2025,
      title: "Marketing Workflow Simplification Study",
      finding: "Task time reduced from 12.27 to 6.62 minutes (46% improvement) through AI-augmented workflow steps",
      tier: "B",
    },
    {
      author: "Zapier — Internal Impact Survey",
      year: 2026,
      title: "Zap Impact Survey: Productivity Improvements",
      finding: "60% cite reduced mental load, 39% report less work falling through the cracks, 32% report more consistent execution. 70% confirm individual productivity improvement",
      sampleSize: "116 respondents",
      tier: "B",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Strong evidence from BCG/HBS, Google, GitHub, Zapier customer measurement (46% reduction), and internal impact survey (n=116).",
  sourcePageDraft: "Task simplification captures the partial time savings when tasks aren't fully eliminated but are made faster through automation and AI augmentation. Internal survey confirms 70% of users see productivity gains.",
};

const contextSurfacing: ArchetypeEvidence = {
  archetype: "context_surfacing",
  label: "Context Surfacing",
  dimension: "Productivity",
  dimensionColor: DIMENSION_COLORS.Productivity,
  formula: "(meetings × attendees × duration × rate × 12) + (searches × time × rate × 12)",
  category2Inputs: [
    { field: "meetingsPerMonth", defaultValue: "40", range: "10–200", tier: "C" },
    { field: "avgAttendees", defaultValue: "4", range: "2–20", tier: "C" },
    { field: "meetingDuration", defaultValue: "0.5 hrs", range: "0.25–2 hrs", tier: "C" },
    { field: "searchesPerMonth", defaultValue: "200", range: "50–1,000", tier: "C" },
    { field: "searchTime", defaultValue: "10 min", range: "3–30 min", tier: "C" },
    { field: "hourlyRate", defaultValue: "$75", range: "$25–$200", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Nucleus Research",
      year: 2024,
      title: "AI-Powered Knowledge Management ROI",
      finding: "27–43% reduction in time spent searching for information and preparing for meetings",
      url: "https://nucleusresearch.com/research/single/ai-powered-analytics-improves-productivity-by-27-to-43-percent/",
      tier: "A",
    },
    {
      author: "EY",
      year: 2024,
      title: "FP&A Transformation with AI Automation",
      finding: "5% more strategic analysis time freed up by automating data gathering and context assembly for financial planning",
      url: "https://www.ey.com/content/dam/ey-unified-site/ey-com/en-gl/services/consulting/documents/ey-gl-how-ai-is-transforming-fpa-06-2025.pdf",
      tier: "B",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Internal Impact Survey",
      year: 2026,
      title: "Zap Impact Survey: Context & Information Flow",
      finding: "32% of respondents cite 'looking things up / checking status' as the work most reduced by automation. 20% cite less context switching as a key improvement",
      sampleSize: "116 respondents",
      tier: "B",
    },
  ],
  coverageStatus: "YELLOW",
  coverageExplanation: "Moderate external evidence plus internal survey data. Context surfacing is a newer category — customer stories would strengthen further.",
  sourcePageDraft: "Knowledge workers spend 27–43% of their time searching for information. Automation that surfaces context proactively eliminates this waste. Internal survey: 32% cite reduced lookup time.",
};

// ── Cost Archetypes ─────────────────────────────────────────────────

const laborAvoidance: ArchetypeEvidence = {
  archetype: "labor_avoidance",
  label: "Labor Avoidance",
  dimension: "Cost",
  dimensionColor: DIMENSION_COLORS.Cost,
  formula: "FTEs_avoided × loaded_annual_cost",
  category2Inputs: [
    { field: "ftesAvoided", defaultValue: "2", range: "0.5–20", tier: "C" },
    { field: "loadedAnnualCost", defaultValue: "$150,000", range: "$60K–$300K", tier: "A" },
  ],
  externalStudies: [
    {
      author: "McKinsey & Company",
      year: 2024,
      title: "AI Workforce Transformation Study",
      finding: "60–70% of tasks automatable, enabling headcount reallocation rather than growth",
      url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-AI-the-next-productivity-frontier",
      tier: "A",
    },
    {
      author: "Mercedes-Benz",
      year: 2024,
      title: "Manufacturing AI Deployment at Scale",
      finding: "5,075 FTE equivalents of work automated across manufacturing and administrative processes",
      sampleSize: "Global operations",
      url: "http://article.sapub.org/10.5923.j.ajis.20211101.02.html",
      tier: "A",
    },
    {
      author: "Athenic AI / 156 Companies",
      year: 2025,
      title: "AI ROI Across 156 Organizations",
      finding: "3.7x average ROI on AI investments, primarily driven by labor cost avoidance",
      sampleSize: "156 companies",
      url: "https://getathenic.com/blog/ai-automation-roi-calculator-2025-data-study",
      tier: "A",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Remote",
      year: 2025,
      title: "Remote.com Labor Avoidance",
      finding: "$500K in annual hiring costs avoided through automation handling work that would have required additional headcount",
      url: "https://zapier.com/customer-stories/remote",
      tier: "A",
    },
    {
      author: "Zapier — Arden Insurance",
      year: 2025,
      title: "Arden Insurance Staffing Efficiency",
      finding: "$500K+ in labor costs avoided annually by automating manual insurance processing workflows",
      url: "https://zapier.com/customer-stories/arden-insurance",
      tier: "A",
    },
    {
      author: "Zapier — Brandon Sammut",
      year: 2025,
      title: "Agency Staffing Efficiency Study",
      finding: "Reduced team from 6 to 3 FTEs while maintaining output through automation (50% labor avoidance)",
      tier: "B",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Excellent coverage. McKinsey, Mercedes-Benz at scale, and three strong Zapier customer cases with dollar figures.",
  sourcePageDraft: "Labor avoidance is the most financially impactful category. Customers avoid hiring 2–5 FTEs at $150K+ loaded cost each.",
};

const toolConsolidation: ArchetypeEvidence = {
  archetype: "tool_consolidation",
  label: "Tool Consolidation",
  dimension: "Cost",
  dimensionColor: DIMENSION_COLORS.Cost,
  formula: "tools × annual_cost/tool",
  category2Inputs: [
    { field: "toolsConsolidated", defaultValue: "3", range: "1–20", tier: "A" },
    { field: "annualCostPerTool", defaultValue: "$12,000", range: "$1K–$100K", tier: "A" },
  ],
  externalStudies: [
    {
      author: "Gitnux",
      year: 2025,
      title: "SaaS Stack Rationalization Benchmarks",
      finding: "20–30% of SaaS spend is on redundant or underutilized tools, recoverable through consolidation",
      url: "https://gitnux.org/workflow-automation-statistics/",
      tier: "B",
    },
    {
      author: "AdAI",
      year: 2025,
      title: "Enterprise Tool Consolidation Study",
      finding: "35% reduction in SaaS costs when integration platform replaces point-to-point connectors and redundant middleware",
      url: "https://adai.news/resources/statistics/ai-automation-statistics-2026/",
      tier: "B",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Premiere Property Group",
      year: 2025,
      title: "Premiere Property Tool Consolidation",
      finding: "$115K in annual SaaS costs eliminated by replacing standalone tools with Zapier-powered workflows",
      url: "https://zapier.com/customer-stories/premiere-property-group",
      tier: "A",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Good external evidence plus a strong Zapier case with specific dollar savings.",
  sourcePageDraft: "Most enterprises have 20–30% redundant SaaS spend. Zapier replaces middleware and point solutions, driving direct cost savings.",
};

const errorReworkElimination: ArchetypeEvidence = {
  archetype: "error_rework_elimination",
  label: "Error & Rework Elimination",
  dimension: "Cost",
  dimensionColor: DIMENSION_COLORS.Cost,
  formula: "errors/mo × cost/error × reduction × 12",
  category2Inputs: [
    { field: "errorsPerMonth", defaultValue: "50", range: "5–500", tier: "C" },
    { field: "costPerError", defaultValue: "$200", range: "$10–$5,000", tier: "C" },
    { field: "reductionRate", defaultValue: "70%", range: "50–97%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "RPA Composite Study",
      year: 2024,
      title: "Robotic Process Automation Error Reduction",
      finding: "87–97% error reduction in data entry and processing tasks through automation",
      url: "https://axis-intelligence.com/rpa-implementation-business-case-2025-guide/",
      tier: "B",
    },
    {
      author: "CRM Data Quality Research",
      year: 2024,
      title: "Automated vs. Manual CRM Data Entry Quality",
      finding: "Error rates dropped from 4% to 0.5% when CRM data entry was automated (87.5% reduction)",
      url: "https://www.cleanlist.ai/blog/2026-02-24-crm-data-quality-benchmarks",
      tier: "B",
    },
    {
      author: "McKinsey & Company",
      year: 2024,
      title: "Quality Improvement Through AI and Automation",
      finding: "20–50% reduction in error-driven rework costs across manufacturing and service operations",
      url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-AI-the-next-productivity-frontier",
      tier: "A",
    },
    {
      author: "Automotive AI Consortium",
      year: 2025,
      title: "AI Quality Inspection in Manufacturing",
      finding: "73% defect detection improvement with AI-powered quality automation vs. manual inspection",
      url: "https://www.appitsoftware.com/blog/automotive-supplier-quality-case-study",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Good external evidence from RPA and manufacturing studies. Need a Zapier-specific error reduction case study.",
  sourcePageDraft: "Automation eliminates human error at the source. Studies show 87–97% error reduction in data entry and 20–50% rework cost reduction.",
};

// ── Risk Archetypes ─────────────────────────────────────────────────

const complianceAssurance: ArchetypeEvidence = {
  archetype: "compliance_assurance",
  label: "Compliance Assurance",
  dimension: "Risk",
  dimensionColor: DIMENSION_COLORS.Risk,
  formula: "violations/yr × penalty × reduction",
  category2Inputs: [
    { field: "violationsPerYear", defaultValue: "5", range: "1–50", tier: "C" },
    { field: "avgPenalty", defaultValue: "$50,000", range: "$1K–$10M", tier: "C" },
    { field: "reductionRate", defaultValue: "70%", range: "50–90%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "European Journal of CSIT",
      year: 2025,
      title: "AI-Driven Compliance Monitoring in Financial Services",
      finding: "89% improvement in compliance violation detection rate with automated monitoring (peer-reviewed)",
      url: "https://eajournals.org/ejcsit/vol13-issue21-2025/",
      tier: "A",
    },
    {
      author: "Avatier",
      year: 2024,
      title: "Identity Governance and Compliance Automation",
      finding: "80% reduction in compliance audit preparation time through automated access controls and reporting",
      url: "https://www.avatier.com/blog/compliance-automation-audit/",
      tier: "B",
    },
    {
      author: "Cloud Compliance Consortium",
      year: 2025,
      title: "Automated Cloud Security Compliance",
      finding: "72% faster compliance remediation with automated policy enforcement and drift detection",
      url: "https://axis-intelligence.com/grc-automation-implementation-guide-2025-roi/",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Strong peer-reviewed evidence from European Journal of CSIT. Need Zapier-specific compliance case study.",
  sourcePageDraft: "Compliance automation catches violations that manual processes miss. Peer-reviewed research shows 89% detection improvement.",
};

const dataIntegrity: ArchetypeEvidence = {
  archetype: "data_integrity",
  label: "Data Integrity",
  dimension: "Risk",
  dimensionColor: DIMENSION_COLORS.Risk,
  formula: "records/mo × error_rate × cost/error × reduction × 12",
  category2Inputs: [
    { field: "recordsPerMonth", defaultValue: "10,000", range: "500–1,000,000", tier: "A" },
    { field: "errorRate", defaultValue: "4%", range: "1–15%", tier: "C" },
    { field: "costPerError", defaultValue: "$50", range: "$5–$1,000", tier: "C" },
    { field: "reductionRate", defaultValue: "80%", range: "50–99%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "CRM Data Quality Research",
      year: 2024,
      title: "Automated Data Entry Quality Benchmarks",
      finding: "Error rates dropped from 4% to 0.5% with automated data entry (87.5% improvement)",
      url: "https://www.recordcontext.com/resources/crm-data-quality",
      tier: "B",
    },
    {
      author: "Data Decay Analysis",
      year: 2024,
      title: "Annual CRM Data Degradation Study",
      finding: "91% of CRM data decays annually without automated enrichment and validation processes",
      url: "https://www.cleanlist.ai/blog/2026-02-24-crm-data-quality-benchmarks",
      tier: "B",
    },
    {
      author: "RPA Accuracy Benchmark",
      year: 2024,
      title: "Automation vs. Human Data Processing Accuracy",
      finding: "99.5% accuracy for automated processes vs. 96% for manual data handling (3.5pp improvement)",
      url: "https://axis-intelligence.com/rpa-implementation-business-case-2025-guide/",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Moderate external evidence focused on CRM data quality. Need Zapier case showing data integrity improvements.",
  sourcePageDraft: "Bad data compounds over time — 91% annual decay rate. Automation maintains 99.5% accuracy vs. 96% manual.",
};

const incidentPrevention: ArchetypeEvidence = {
  archetype: "incident_prevention",
  label: "Incident Prevention",
  dimension: "Risk",
  dimensionColor: DIMENSION_COLORS.Risk,
  formula: "incidents/yr × cost/incident × reduction",
  category2Inputs: [
    { field: "incidentsPerYear", defaultValue: "24", range: "5–200", tier: "C" },
    { field: "costPerIncident", defaultValue: "$10,000", range: "$500–$500K", tier: "C" },
    { field: "reductionRate", defaultValue: "50%", range: "25–80%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Freshservice",
      year: 2025,
      title: "AI-Driven IT Incident Management",
      finding: "76.6% ticket auto-resolution rate across 187M tickets, preventing escalation to human agents",
      sampleSize: "187M tickets",
      url: "https://www.freshworks.com/freshservice/benchmark-report-2025/",
      tier: "A",
    },
    {
      author: "Global Enterprise ITSM Study",
      year: 2025,
      title: "Mean Time to Resolve Reduction with Automation",
      finding: "55% reduction in MTTR (Mean Time to Resolve) with automated incident triage and response",
      url: "https://auralis.ai/case-studies/global-enterprise-reduced-mttr-by-55/",
      tier: "B",
    },
    {
      author: "ServiceNow / Nucleus Research",
      year: 2024,
      title: "IT Service Management Automation ROI",
      finding: "41% reduction in incident volume through proactive monitoring and automated remediation",
      tier: "A",
    },
  ],
  zapierStudies: [
    {
      author: "Zapier — Remote",
      year: 2025,
      title: "Remote.com Incident Reduction",
      finding: "27.5% reduction in operational incidents through automated monitoring and alert workflows",
      url: "https://zapier.com/customer-stories/remote",
      tier: "B",
    },
  ],
  coverageStatus: "GREEN",
  coverageExplanation: "Strong evidence from Freshservice (187M tickets) and ServiceNow/Nucleus. Zapier case at Remote shows 27.5% reduction (moderate).",
  sourcePageDraft: "Automated incident prevention reduces both frequency and severity. Freshservice data shows 76.6% auto-resolution across 187M tickets.",
};

const processConsistency: ArchetypeEvidence = {
  archetype: "process_consistency",
  label: "Process Consistency",
  dimension: "Risk",
  dimensionColor: DIMENSION_COLORS.Risk,
  formula: "processes/mo × defect_rate × cost/defect × reduction × 12",
  category2Inputs: [
    { field: "processesPerMonth", defaultValue: "500", range: "50–10,000", tier: "C" },
    { field: "defectRate", defaultValue: "5%", range: "1–20%", tier: "C" },
    { field: "costPerDefect", defaultValue: "$100", range: "$10–$5,000", tier: "C" },
    { field: "reductionRate", defaultValue: "60%", range: "40–80%", tier: "C" },
  ],
  externalStudies: [
    {
      author: "Automotive AI Consortium",
      year: 2025,
      title: "Process Standardization Through AI",
      finding: "73% improvement in process consistency with AI-enforced standard operating procedures",
      url: "https://www.appitsoftware.com/blog/automotive-supplier-quality-case-study",
      tier: "B",
    },
    {
      author: "Mercedes-Benz",
      year: 2024,
      title: "Manufacturing Process Consistency at Scale",
      finding: "5,075 FTE equivalents of standardized work achieved through automation, ensuring consistent output quality",
      sampleSize: "Global operations",
      url: "http://article.sapub.org/10.5923.j.ajis.20211101.02.html",
      tier: "A",
    },
    {
      author: "Packaging Industry PDCA Study",
      year: 2024,
      title: "PDCA Cycle Automation in Packaging Manufacturing",
      finding: "64.3% reduction in process variation and defects through automated quality control workflows",
      tier: "B",
    },
  ],
  zapierStudies: [],
  coverageStatus: "YELLOW",
  coverageExplanation: "Moderate evidence from manufacturing sector. Need service/knowledge-work case studies showing consistency improvements.",
  sourcePageDraft: "Process consistency eliminates variation-driven costs. Manufacturing studies show 64–73% defect reduction through standardized automation.",
};

// ── Assembled Data ──────────────────────────────────────────────────

const allArchetypes: ArchetypeEvidence[] = [
  pipelineVelocity,
  revenueCapture,
  revenueExpansion,
  timeToRevenue,
  processAcceleration,
  handoffElimination,
  taskElimination,
  taskSimplification,
  contextSurfacing,
  laborAvoidance,
  toolConsolidation,
  errorReworkElimination,
  complianceAssurance,
  dataIntegrity,
  incidentPrevention,
  processConsistency,
];

function buildBibliography(): StudyReference[] {
  const seen = new Set<string>();
  const studies: StudyReference[] = [];
  for (const a of allArchetypes) {
    for (const s of [...a.externalStudies, ...a.zapierStudies]) {
      const key = `${s.author}|${s.year}|${s.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        studies.push(s);
      }
    }
  }
  return studies.sort((a, b) => a.author.localeCompare(b.author));
}

export const METHODOLOGY_DATA: { archetypes: ArchetypeEvidence[]; bibliography: StudyReference[] } = {
  archetypes: allArchetypes,
  bibliography: buildBibliography(),
};
