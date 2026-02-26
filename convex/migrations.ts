import { mutation } from "./_generated/server";

/**
 * Migration: Backfill companyId on useCases and useCaseIds on calculations.
 *
 * For each existing use case:
 *   - Look up its calculation's companyId, set it on the use case
 *
 * For each existing calculation:
 *   - Set useCaseIds = [all use case IDs where calculationId === thisCalc]
 *
 * Safe to run multiple times (idempotent).
 */
export const backfillCompanyScoping = mutation({
  args: {},
  handler: async (ctx) => {
    const allCalculations = await ctx.db.query("calculations").collect();
    const allUseCases = await ctx.db.query("useCases").collect();

    let useCasesUpdated = 0;
    let calculationsUpdated = 0;

    // Step 1: Set companyId on use cases
    for (const uc of allUseCases) {
      if (!uc.companyId) {
        const calc = await ctx.db.get(uc.calculationId);
        if (calc?.companyId) {
          await ctx.db.patch(uc._id, { companyId: calc.companyId });
          useCasesUpdated++;
        }
      }
    }

    // Step 2: Set useCaseIds on calculations
    for (const calc of allCalculations) {
      if (!calc.useCaseIds) {
        const useCaseIds = allUseCases
          .filter((uc) => uc.calculationId === calc._id)
          .map((uc) => uc._id);
        await ctx.db.patch(calc._id, { useCaseIds: useCaseIds });
        calculationsUpdated++;
      }
    }

    return {
      useCasesUpdated,
      calculationsUpdated,
      totalUseCases: allUseCases.length,
      totalCalculations: allCalculations.length,
    };
  },
});
