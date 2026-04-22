import { ARCHETYPE_FIELDS, type ArchetypeFieldDef } from "../types/archetypes";
import { ARCHETYPE_INFO, ARCHETYPE_DIMENSION, DIMENSION_INFO, DIMENSION_ORDER, type Archetype, type Dimension } from "../types/roi";

/** ISO date when benchmark defaults / ranges last changed — bump when editing ARCHETYPE_FIELDS. */
export const ROI_SCHEMA_UPDATED_AT = "2026-04-22";

/** Active UVS benchmark pack for defaults and ranges (pin in API clients for reproducibility). */
export const ROI_BENCHMARK_PACK_ID = "2026-04-uvs";

export const ROI_SCHEMA_VERSION = "2.0";

function apiSourceForField(field: ArchetypeFieldDef): string {
  switch (field.defaultConfidence) {
    case "A":
      return "customer";
    case "B":
      return "industry_benchmark";
    case "C":
      return "zapier_benchmark";
    case "D":
      return "unsourced";
    default:
      return "customer";
  }
}

function buildSchemaInput(field: ArchetypeFieldDef, archetype: Archetype) {
  const sourceCategory = apiSourceForField(field);
  const row: Record<string, unknown> = {
    key: field.key,
    label: field.label,
    type: field.type,
    sourceCategory,
    source: field.source ?? sourceCategory,
    confidence: field.defaultConfidence,
  };
  if (field.prompt) row.prompt = field.prompt;
  if (field.sourceUrl) row.sourceUrl = field.sourceUrl;
  if (field.defaultValue !== undefined) row.default = field.defaultValue;
  if (field.range) row.range = field.range;
  if (field.guidance) row.guidance = field.guidance;

  if (archetype === "revenue_expansion" && field.key === "lift") {
    row.coverageNote =
      "Vendor- and analyst-heavy evidence in UVS coverage map — validate expansion lift with the customer.";
  }
  if (archetype === "time_to_revenue" && field.key === "daysAccelerated") {
    const extra =
      "Generic onboarding: 5–15 days. Quote-to-cash / deal desk can be much larger — widen with customer evidence.";
    row.guidance = field.guidance ? `${field.guidance} ${extra}` : extra;
  }

  return row;
}

export function buildRoiSchemaDimensions() {
  return DIMENSION_ORDER.map((dimId: Dimension) => {
    const dimMeta = DIMENSION_INFO[dimId];
    const archetypes = (Object.keys(ARCHETYPE_INFO) as Archetype[])
      .filter((a) => ARCHETYPE_DIMENSION[a] === dimId)
      .map((archetype) => {
        const info = ARCHETYPE_INFO[archetype];
        const fields = ARCHETYPE_FIELDS[archetype] ?? [];
        return {
          id: archetype,
          label: info.label,
          description: info.description,
          formula: info.formulaDescription,
          inputs: fields.map((f) => buildSchemaInput(f, archetype)),
        };
      });
    return {
      id: dimId,
      label: dimMeta.label,
      description: dimMeta.description,
      archetypes,
    };
  });
}
