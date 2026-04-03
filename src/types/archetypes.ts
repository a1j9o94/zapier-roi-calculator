import type { Archetype, ValueInput } from "./roi";

// ============================================================
// Archetype-Specific Input Schemas
// Each archetype has its own input interface with labeled fields.
// Confidence tiers: [B] = Benchmarked, [E] = Estimated, [C] = Custom
// ============================================================

// 1.1 Pipeline Velocity
export interface PipelineVelocityInputs {
  dealsPerQuarter: ValueInput;   // [C] "How many deals enter pipeline per quarter?"
  avgDealValue: ValueInput;      // [C] "What's your average deal size?"
  conversionLift: ValueInput;    // [E] Zapier benchmark: 5-15% lift
}

// 1.2 Revenue Capture
export interface RevenueCaptureInputs {
  annualRevenue: ValueInput;        // [C] "What's your total annual revenue?"
  leakageRate: ValueInput;          // [E] Industry benchmark: 1-3%
  captureImprovement: ValueInput;   // [E] Zapier benchmark: 30-60%
}

// 1.3 Revenue Expansion
export interface RevenueExpansionInputs {
  customerBase: ValueInput;        // [C] "How many active customers?"
  expansionRate: ValueInput;       // [C] "Current upsell/cross-sell rate?"
  avgExpansionValue: ValueInput;   // [C] "Average expansion deal value?"
  lift: ValueInput;                // [E] Zapier benchmark: 5-15%
}

// 1.4 Time-to-Revenue
export interface TimeToRevenueInputs {
  newCustomersPerYear: ValueInput;    // [C] "How many new customers per year?"
  revenuePerCustomer: ValueInput;     // [C] "Average first-year revenue per customer?"
  daysAccelerated: ValueInput;        // [E] Zapier benchmark: 5-15 days
}

// 2.1 Process Acceleration
export interface ProcessAccelerationInputs {
  processesPerMonth: ValueInput;  // [C] "How many processes run per month?"
  timeBeforeHrs: ValueInput;      // [C] "Current time per process (hours)?"
  timeAfterHrs: ValueInput;       // [E] Benchmark: 50-80% reduction
  hourlyRate: ValueInput;         // [C] Loaded cost of person
}

// 2.2 Handoff Elimination
export interface HandoffEliminationInputs {
  handoffsPerMonth: ValueInput;          // [C] "How many handoffs per month?"
  avgQueueTimeHrs: ValueInput;           // [C] "Average wait time per handoff (hours)?"
  hourlyRateOfWaitingParty: ValueInput;  // [C] Loaded cost of waiting person
}

// 3.1 Task Elimination
export interface TaskEliminationInputs {
  tasksPerMonth: ValueInput;    // [B] from Zapier task data when available, [C] otherwise
  minutesPerTask: ValueInput;   // [C] "How long did this take manually?"
  hourlyRate: ValueInput;       // [C] Loaded cost of person
}

// 3.2 Task Simplification
export interface TaskSimplificationInputs {
  tasksPerMonth: ValueInput;         // [C] "How many tasks per month?"
  minutesSavedPerTask: ValueInput;   // [C] "Minutes saved per task?"
  hourlyRate: ValueInput;            // [C] Loaded cost of person
}

// 3.3 Context Surfacing
export interface ContextSurfacingInputs {
  meetingsAvoidedPerMonth: ValueInput;     // [C] "Meetings avoided per month?"
  attendeesPerMeeting: ValueInput;         // [C] "Average attendees per meeting?"
  meetingDurationHrs: ValueInput;          // [C] "Average meeting duration (hours)?"
  meetingHourlyRate: ValueInput;           // [C] Average hourly rate of attendees
  searchesAvoidedPerMonth: ValueInput;     // [C] "Information searches avoided per month?"
  avgSearchTimeMin: ValueInput;            // [E] Benchmark: 15-30 min
  searchHourlyRate: ValueInput;            // [C] Hourly rate of person searching
}

// 4.1 Labor Avoidance
export interface LaborAvoidanceInputs {
  ftesAvoided: ValueInput;              // [C] "FTEs that would need to be hired?"
  fullyLoadedAnnualCost: ValueInput;    // [E] Defaults by tier: Admin $70K, Ops $100K, SalesOps $120K, Eng $175K, Manager $160K
}

// 4.2 Tool Consolidation
export interface ToolConsolidationInputs {
  toolsEliminated: ValueInput;             // [C] "How many tools can be eliminated?"
  annualLicenseCostPerTool: ValueInput;    // [C] "Annual cost per tool?"
}

// 4.3 Error/Rework Elimination
export interface ErrorReworkEliminationInputs {
  errorsPerMonth: ValueInput;     // [C] "How many errors per month?"
  avgCostPerError: ValueInput;    // [E] Benchmark: $50-500
  reductionRate: ValueInput;      // [E] Data entry: 60-90%, Process: 30-50%
}

// 5.1 Compliance Assurance
export interface ComplianceAssuranceInputs {
  expectedViolationsPerYear: ValueInput;   // [E] Industry-dependent
  avgPenaltyPerViolation: ValueInput;      // [B] Regulatory: GDPR $20K-500K, SOX $5M+, HIPAA $100-50K, PCI $5K-100K/mo
  reductionRate: ValueInput;               // [E] Benchmark: 40-70%
}

// 5.2 Data Integrity
export interface DataIntegrityInputs {
  recordsPerMonth: ValueInput;    // [C] "Records processed per month?"
  errorRate: ValueInput;          // [C] "Current error rate (%)?"
  costPerError: ValueInput;       // [E] Operational: $10-100, Strategic: $1K-50K
  reductionRate: ValueInput;      // [E] Sync: 70-90%, Enrichment: 40-60%
}

// 5.3 Incident Prevention
export interface IncidentPreventionInputs {
  incidentsPerYear: ValueInput;       // [C] "Incidents per year?"
  avgCostPerIncident: ValueInput;     // [E] App downtime $5-10K/hr, Data breach $165/record, Infra $10-50K
  reductionRate: ValueInput;          // [E] Prevention: 20-40%, Faster resolution: 30-50%
}

// 5.4 Process Consistency
export interface ProcessConsistencyInputs {
  processesPerMonth: ValueInput;   // [C] "Processes executed per month?"
  defectRate: ValueInput;          // [C] "Current defect rate (%)?"
  costPerDefect: ValueInput;       // [C] "Cost per defect?"
  reductionRate: ValueInput;       // [E] Benchmark: 50-80%
}

// ============================================================
// Union type for all archetype inputs
// ============================================================

export type ArchetypeInputs =
  | PipelineVelocityInputs
  | RevenueCaptureInputs
  | RevenueExpansionInputs
  | TimeToRevenueInputs
  | ProcessAccelerationInputs
  | HandoffEliminationInputs
  | TaskEliminationInputs
  | TaskSimplificationInputs
  | ContextSurfacingInputs
  | LaborAvoidanceInputs
  | ToolConsolidationInputs
  | ErrorReworkEliminationInputs
  | ComplianceAssuranceInputs
  | DataIntegrityInputs
  | IncidentPreventionInputs
  | ProcessConsistencyInputs;

// ============================================================
// Archetype input field definitions (for dynamic form generation)
// ============================================================

export interface ArchetypeFieldDef {
  key: string;
  label: string;
  type: "number" | "percentage" | "currency" | "hours";
  prompt: string;         // Question to ask customer
  defaultConfidence: "A" | "B" | "C" | "D";
  source?: string;        // Default source label
  sourceUrl?: string;     // URL to primary reference source
  defaultValue?: number;
  range?: [number, number];
  guidance?: string;      // Help text
}

export const ARCHETYPE_FIELDS: Record<Archetype, ArchetypeFieldDef[]> = {
  pipeline_velocity: [
    { key: "dealsPerQuarter", label: "Deals per quarter", type: "number", prompt: "How many deals enter your pipeline per quarter?", defaultConfidence: "A" },
    { key: "avgDealValue", label: "Avg deal value ($)", type: "currency", prompt: "What's your average deal size?", defaultConfidence: "A" },
    { key: "conversionLift", label: "Conversion lift (%)", type: "percentage", prompt: "Expected conversion rate improvement?", defaultConfidence: "C", source: "Revenue Velocity Lab (47,832 deals): 14% close rate improvement. Blazeo 2026: 21x qualification at <5min response", sourceUrl: "https://www.prnewswire.com/news-releases/blazeo-unveils-2026-speed-to-lead-benchmark-report-302694994.html", defaultValue: 0.10, range: [0.05, 0.15] },
  ],
  revenue_capture: [
    { key: "annualRevenue", label: "Annual revenue ($)", type: "currency", prompt: "What's your total annual revenue?", defaultConfidence: "A" },
    { key: "leakageRate", label: "Revenue leakage rate (%)", type: "percentage", prompt: "Estimated revenue leakage rate?", defaultConfidence: "C", source: "Gartner 2024: 50% of B2B orgs lose 7-10% to leakage. LedgerUp SaaS: 3-5% ARR", sourceUrl: "https://www.oplacrm.com/en/post/revenue-leakage-in-b2b-is-10-of-your-revenue-evaporating-unnoticed", defaultValue: 0.05, range: [0.03, 0.10] },
    { key: "captureImprovement", label: "Capture improvement (%)", type: "percentage", prompt: "Expected improvement in capturing leaked revenue?", defaultConfidence: "C", source: "LedgerUp: contract-to-cash automation reduces leakage below 1%. Arden Insurance (Zapier): $150M/yr collected", sourceUrl: "https://zapier.com/customer-stories/arden-insurance", defaultValue: 0.50, range: [0.30, 0.80] },
  ],
  revenue_expansion: [
    { key: "customerBase", label: "Active customers", type: "number", prompt: "How many active customers do you have?", defaultConfidence: "A" },
    { key: "expansionRate", label: "Current expansion rate (%)", type: "percentage", prompt: "Current upsell/cross-sell rate?", defaultConfidence: "A" },
    { key: "avgExpansionValue", label: "Avg expansion value ($)", type: "currency", prompt: "Average expansion deal value?", defaultConfidence: "A" },
    { key: "lift", label: "Expansion lift (%)", type: "percentage", prompt: "Expected lift in expansion rate?", defaultConfidence: "C", source: "Pedowitz Group 2025: 20-30% upsell lift. Growth Suite 2026: 2.4x AI recommendation acceptance", sourceUrl: "https://www.pedowitzgroup.com/ai-driven-upsell-cross-sell-recommendations", defaultValue: 0.15, range: [0.10, 0.30] },
  ],
  time_to_revenue: [
    { key: "newCustomersPerYear", label: "New customers/year", type: "number", prompt: "How many new customers per year?", defaultConfidence: "A" },
    { key: "revenuePerCustomer", label: "Revenue per customer ($)", type: "currency", prompt: "Average first-year revenue per customer?", defaultConfidence: "A" },
    { key: "daysAccelerated", label: "Days accelerated", type: "number", prompt: "How many days faster could onboarding be?", defaultConfidence: "C", source: "SDLC Corp: quote-to-cash 20→8 days. Revenue Velocity Lab: 14.8 days saved per deal (47,832 deals)", sourceUrl: "https://zapier.com/customer-stories/remote", defaultValue: 10, range: [5, 15] },
  ],
  process_acceleration: [
    { key: "processesPerMonth", label: "Processes/month", type: "number", prompt: "How many processes run per month?", defaultConfidence: "A" },
    { key: "timeBeforeHrs", label: "Time before (hours)", type: "hours", prompt: "Current time per process (hours)?", defaultConfidence: "A" },
    { key: "timeAfterHrs", label: "Time after (hours)", type: "hours", prompt: "Expected time after automation (hours)?", defaultConfidence: "C", source: "Forrester TEI 2024: 40% process time reduction. Nucleus Research: 63-80% improvement", sourceUrl: "https://tei.forrester.com/go/Pipefy/PipefyTEI", guidance: "Typically 50-80% reduction from current time" },
    { key: "hourlyRate", label: "Hourly rate ($)", type: "currency", prompt: "Loaded cost per hour of person running this process?", defaultConfidence: "A" },
  ],
  handoff_elimination: [
    { key: "handoffsPerMonth", label: "Handoffs/month", type: "number", prompt: "How many handoffs happen per month?", defaultConfidence: "A" },
    { key: "avgQueueTimeHrs", label: "Avg queue time (hours)", type: "hours", prompt: "Average wait time per handoff (hours)?", defaultConfidence: "A" },
    { key: "hourlyRateOfWaitingParty", label: "Hourly rate ($)", type: "currency", prompt: "Loaded cost of the person waiting?", defaultConfidence: "A" },
  ],
  task_elimination: [
    { key: "tasksPerMonth", label: "Tasks/month", type: "number", prompt: "How many tasks are completed per month?", defaultConfidence: "A", guidance: "Check Zapier task data. Remote: 11M tasks/yr. Arden Insurance: 34,000+ hrs/yr automated", sourceUrl: "https://zapier.com/customer-stories/remote" },
    { key: "minutesPerTask", label: "Minutes/task", type: "number", prompt: "How long did this take manually (minutes)?", defaultConfidence: "A", source: "Zapier Impact Survey 2026 (n=116): 45% eliminate manual data entry, 38% eliminate copy/pasting. 66% save <30 min/Zap/week, 22% save 1-3 hrs", sourceUrl: "https://zapier.com/customer-stories/arden-insurance", guidance: "Most individual Zaps save <30 min/week. High-value Zaps save 1-3+ hours." },
    { key: "hourlyRate", label: "Hourly rate ($)", type: "currency", prompt: "Loaded cost per hour of person doing this task?", defaultConfidence: "A", source: "BLS 2025: Admin $35/hr, Ops $50/hr, SalesOps $60/hr, Eng $85/hr" },
  ],
  task_simplification: [
    { key: "tasksPerMonth", label: "Tasks/month", type: "number", prompt: "How many tasks per month?", defaultConfidence: "A" },
    { key: "minutesSavedPerTask", label: "Minutes saved/task", type: "number", prompt: "Minutes saved per task through automation?", defaultConfidence: "A", source: "BCG 2024 (480 consultants): 49% improvement. Brandon Sammut (Zapier): 46% reduction (12.27→6.62 min). Zapier Impact Survey 2026 (n=116): 70% report productivity gains, 60% cite reduced mental load", sourceUrl: "https://www.bcg.com/publications/2024/gen-ai-increases-productivity-and-expands-capabilities" },
    { key: "hourlyRate", label: "Hourly rate ($)", type: "currency", prompt: "Loaded cost per hour?", defaultConfidence: "A" },
  ],
  context_surfacing: [
    { key: "meetingsAvoidedPerMonth", label: "Meetings avoided/month", type: "number", prompt: "How many meetings could be avoided per month?", defaultConfidence: "A" },
    { key: "attendeesPerMeeting", label: "Attendees/meeting", type: "number", prompt: "Average number of attendees per meeting?", defaultConfidence: "A" },
    { key: "meetingDurationHrs", label: "Meeting duration (hrs)", type: "hours", prompt: "Average meeting duration (hours)?", defaultConfidence: "A" },
    { key: "meetingHourlyRate", label: "Meeting hourly rate ($)", type: "currency", prompt: "Average hourly rate of meeting attendees?", defaultConfidence: "A" },
    { key: "searchesAvoidedPerMonth", label: "Searches avoided/month", type: "number", prompt: "Information searches avoided per month?", defaultConfidence: "A" },
    { key: "avgSearchTimeMin", label: "Avg search time (min)", type: "number", prompt: "Average time spent searching for information (minutes)?", defaultConfidence: "C", source: "Nucleus Research: 27-43% productivity improvement from AI analytics. EY: 5% more strategic time. Zapier Impact Survey 2026: 32% cite looking things up as reduced work", sourceUrl: "https://nucleusresearch.com/research/single/ai-powered-analytics-improves-productivity-by-27-to-43-percent/", defaultValue: 20, range: [15, 30] },
    { key: "searchHourlyRate", label: "Search hourly rate ($)", type: "currency", prompt: "Hourly rate of person searching?", defaultConfidence: "A" },
  ],
  labor_avoidance: [
    { key: "ftesAvoided", label: "FTEs avoided", type: "number", prompt: "How many FTEs would need to be hired without automation?", defaultConfidence: "A" },
    { key: "fullyLoadedAnnualCost", label: "Fully loaded annual cost ($)", type: "currency", prompt: "Fully loaded annual cost per FTE?", defaultConfidence: "C", source: "BLS 2025: Admin $70K, Ops $100K, SalesOps $120K, Eng $175K, Mgr $160K, Exec $200K+", sourceUrl: "https://www.bls.gov/oes/current/oes_nat.htm", defaultValue: 100000 },
  ],
  tool_consolidation: [
    { key: "toolsEliminated", label: "Tools eliminated", type: "number", prompt: "How many tools can be eliminated?", defaultConfidence: "A" },
    { key: "annualLicenseCostPerTool", label: "Annual cost/tool ($)", type: "currency", prompt: "Annual license cost per tool?", defaultConfidence: "A" },
  ],
  error_rework_elimination: [
    { key: "errorsPerMonth", label: "Errors/month", type: "number", prompt: "How many errors occur per month?", defaultConfidence: "A" },
    { key: "avgCostPerError", label: "Avg cost/error ($)", type: "currency", prompt: "Average cost to fix each error?", defaultConfidence: "C", source: "Operational errors $50-500. Strategic data errors $1K-50K (Nucleus Research)", sourceUrl: "https://axis-intelligence.com/rpa-implementation-business-case-2025-guide/", defaultValue: 150, range: [50, 500] },
    { key: "reductionRate", label: "Error reduction (%)", type: "percentage", prompt: "Expected error reduction rate?", defaultConfidence: "C", source: "RPA industry: 87-97% error reduction. CRM automation: 4%→0.5% error rate. McKinsey: 20-50% for complex", sourceUrl: "https://www.cleanlist.ai/blog/2026-02-24-crm-data-quality-benchmarks", defaultValue: 0.70, range: [0.30, 0.90] },
  ],
  compliance_assurance: [
    { key: "expectedViolationsPerYear", label: "Expected violations/year", type: "number", prompt: "Expected compliance violations per year?", defaultConfidence: "C" },
    { key: "avgPenaltyPerViolation", label: "Avg penalty ($)", type: "currency", prompt: "Average penalty per violation?", defaultConfidence: "B", source: "GDPR $20K-500K, SOX $5M+, HIPAA $100-50K, PCI $5K-100K/mo" },
    { key: "reductionRate", label: "Violation reduction (%)", type: "percentage", prompt: "Expected reduction in violations?", defaultConfidence: "C", source: "European Journal CSIT 2025: 89% violation decrease. Avatier: 80% audit prep reduction. Cloud compliance: 72% detection", sourceUrl: "https://eajournals.org/ejcsit/vol13-issue21-2025/", defaultValue: 0.60, range: [0.40, 0.80] },
  ],
  data_integrity: [
    { key: "recordsPerMonth", label: "Records/month", type: "number", prompt: "How many records processed per month?", defaultConfidence: "A" },
    { key: "errorRate", label: "Error rate (%)", type: "percentage", prompt: "Current data error rate?", defaultConfidence: "A" },
    { key: "costPerError", label: "Cost/error ($)", type: "currency", prompt: "Cost per data error?", defaultConfidence: "C", source: "Operational: $10-100, Strategic: $1K-50K", sourceUrl: "https://www.recordcontext.com/resources/crm-data-quality", defaultValue: 50, range: [10, 50000] },
    { key: "reductionRate", label: "Error reduction (%)", type: "percentage", prompt: "Expected error reduction?", defaultConfidence: "C", source: "CRM quality: manual 4%→automated 0.5% (87.5% reduction). RPA: 99.5% vs 96% human accuracy", sourceUrl: "https://www.cleanlist.ai/blog/2026-02-24-crm-data-quality-benchmarks", defaultValue: 0.80, range: [0.40, 0.90] },
  ],
  incident_prevention: [
    { key: "incidentsPerYear", label: "Incidents/year", type: "number", prompt: "How many incidents per year?", defaultConfidence: "A" },
    { key: "avgCostPerIncident", label: "Avg cost/incident ($)", type: "currency", prompt: "Average cost per incident?", defaultConfidence: "C", source: "App downtime $5-10K/hr (Gartner). Data breach $165/record (IBM). Infra incidents $10-50K", sourceUrl: "https://www.freshworks.com/freshservice/benchmark-report-2025/", defaultValue: 10000 },
    { key: "reductionRate", label: "Incident reduction (%)", type: "percentage", prompt: "Expected incident reduction?", defaultConfidence: "C", source: "Freshservice (187M tickets, 10,551 orgs): 76.6% resolution reduction. Remote (Zapier): 27.5% auto-resolved", sourceUrl: "https://www.freshworks.com/freshservice/benchmark-report-2025/", defaultValue: 0.35, range: [0.20, 0.50] },
  ],
  process_consistency: [
    { key: "processesPerMonth", label: "Processes/month", type: "number", prompt: "How many processes executed per month?", defaultConfidence: "A" },
    { key: "defectRate", label: "Defect rate (%)", type: "percentage", prompt: "Current process defect rate?", defaultConfidence: "A" },
    { key: "costPerDefect", label: "Cost/defect ($)", type: "currency", prompt: "Cost per process defect?", defaultConfidence: "A" },
    { key: "reductionRate", label: "Defect reduction (%)", type: "percentage", prompt: "Expected defect reduction?", defaultConfidence: "C", source: "Automotive AI: 73% defect reduction. Packaging PDCA: 64.3% variability reduction. Conservative for knowledge work", sourceUrl: "https://www.appitsoftware.com/blog/automotive-supplier-quality-case-study", defaultValue: 0.50, range: [0.30, 0.70] },
  ],
};

// ============================================================
// Illustrative scenarios for each archetype (for templates)
// ============================================================

export const ARCHETYPE_SCENARIOS: Record<Archetype, string> = {
  pipeline_velocity: "A sales team processes 200 deals/quarter with $25K average value. A 10% conversion lift from automated lead routing yields 200 x $25K x 10% x 4 = $200K/year.",
  revenue_capture: "A company with $50M revenue has 2% leakage ($1M). Capturing 45% more through automated dunning/renewals recovers $50M x 2% x 45% = $450K/year.",
  revenue_expansion: "With 500 customers, 15% expansion rate, $10K avg expansion, and 10% lift: 500 x 15% x $10K x 10% = $75K/year additional expansion revenue.",
  time_to_revenue: "Onboarding 200 customers/year at $50K each. Accelerating by 10 days: 200 x $50K x 10/365 = $274K/year in accelerated revenue.",
  process_acceleration: "100 monthly close processes taking 8 hours each, reduced to 3 hours at $80/hr: 100 x 5hrs x $80 x 12 = $480K/year.",
  handoff_elimination: "500 handoffs/month with 2-hour average queue time at $60/hr: 500 x 2 x $60 x 12 = $720K/year in eliminated wait time.",
  task_elimination: "3,000 data entry tasks/month at 8 min each, operations staff at $50/hr: 3,000 x 8 x ($50/60) x 12 = $240K/year (= 2.3 FTE equivalent).",
  task_simplification: "2,000 tasks/month where 5 minutes saved per task at $50/hr: 2,000 x 5 x ($50/60) x 12 = $100K/year.",
  context_surfacing: "Avoiding 20 meetings/month (4 people, 1hr, $80/hr) + 100 searches/month (20min, $60/hr): (20x4x1x$80x12) + (100x20x($60/60)x12) = $76.8K + $24K = $100.8K/year.",
  labor_avoidance: "Automation handles work that would otherwise require 2 additional operations staff at $100K/year each: 2 x $100K = $200K/year avoided.",
  tool_consolidation: "Eliminating 3 tools at $15K/year each: 3 x $15K = $45K/year in license savings.",
  error_rework_elimination: "200 errors/month at $150/error average, with 70% reduction: 200 x $150 x 70% x 12 = $252K/year.",
  compliance_assurance: "Expecting 5 violations/year at $100K avg penalty, reduced 55%: 5 x $100K x 55% = $275K/year in avoided penalties.",
  data_integrity: "50K records/month with 2% error rate, $50/error, 75% reduction: 50K x 2% x $50 x 75% x 12 = $450K/year.",
  incident_prevention: "12 incidents/year at $10K average cost, 30% reduction: 12 x $10K x 30% = $36K/year.",
  process_consistency: "1,000 processes/month with 5% defect rate, $200/defect, 65% reduction: 1,000 x 5% x $200 x 65% x 12 = $78K/year.",
};
