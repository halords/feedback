import { DashboardMetrics } from "../services/metricsService";

/**
 * Aggregates individual office/satellite results into their primary groups (PHO/PTO)
 * for CHART visualization, as per system_map.json requirements.
 */
export function aggregateForCharts(data: DashboardMetrics[], visibleMonths: string[]): any[] {
  if (!data || !visibleMonths) return [];

  // Initialize group for each visible month to ensure chronological order
  const monthStats: Record<string, any> = {};
  visibleMonths.forEach(m => {
    monthStats[m] = {
      name: m,
      collection: 0,
      visitor: 0,
      overrateSum: 0,
      sysRateSum: 0,
      staffRateSum: 0,
      q1RateSum: 0,
      validCount: 0 // Count only offices with actual data
    };
  });

  data.forEach((item) => {
    const m = item.month;
    if (!monthStats[m]) return; // Skip months before baseline

    // Validate if item has any collection data as a proxy for "valid numeric value" 
    // or check if rates are not 'N/A'
    const hasData = item.collection > 0;
    
    monthStats[m].collection += item.collection;
    monthStats[m].visitor += item.visitor;

    if (hasData) {
      const safeParse = (val: any) => {
        const n = parseFloat(String(val));
        return isNaN(n) ? 0 : n;
      };

      monthStats[m].overrateSum += safeParse(item.overrate);
      monthStats[m].sysRateSum += safeParse(item.sysRate);
      monthStats[m].staffRateSum += safeParse(item.staffRate);
      monthStats[m].q1RateSum += safeParse(item.qValues?.Q1?.RATE);
      monthStats[m].validCount++;
    }
  });

  return visibleMonths.map(m => {
    const s = monthStats[m];
    const count = s.validCount || 1; // Prevent division by zero
    
    return {
      name: s.name.substring(0, 3), // e.g. "Jan"
      collection: s.collection,
      visitor: s.visitor,
      collectRate: s.visitor > 0 ? (s.collection / s.visitor * 100).toFixed(2) : "0.00",
      // If no valid data, we return 0 or N/A logic is handled in chart later
      overrate: s.validCount > 0 ? (s.overrateSum / count).toFixed(2) : "0.00",
      sysRate: s.validCount > 0 ? (s.sysRateSum / count).toFixed(2) : "0.00",
      staffRate: s.validCount > 0 ? (s.staffRateSum / count).toFixed(2) : "0.00",
      q1Rate: s.validCount > 0 ? (s.q1RateSum / count).toFixed(2) : "0.00",
      hasData: s.validCount > 0
    };
  });
}
