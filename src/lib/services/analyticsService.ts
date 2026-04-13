/**
 * Pure utility functions for calculating feedback metrics and satisfaction scores.
 * Ported from legacy call.js for 100% logic parity.
 */

export interface QValues {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  NA: number;
  RATE?: string;
}

/**
 * Calculates the percentage rate (4s and 5s) for a single question.
 * Formula: ((Q4 + Q5) / (TOTAL - QNA)) * 100
 */
export function calculateQuestionRate(qValues: QValues, totalCollection: number): string {
  const denominator = totalCollection - qValues.NA;
  const numerator = qValues['4'] + qValues['5'];

  if (denominator <= 0) return "N/A";
  
  const rate = (numerator / denominator) * 100;
  return rate.toFixed(2) + "%";
}

/**
 * Parses a rate string (e.g., "85.50%") into a float. Returns 0 if "N/A".
 */
export function parseRate(rateStr: string | undefined): number {
  if (!rateStr || rateStr === "N/A") return 0;
  return parseFloat(rateStr.replace("%", ""));
}

/**
 * Calculates the categorical averages (SysRate, StaffRate) and the final Overrate.
 * Follows the legacy 3-point average model.
 */
export function calculateSatisfactionAverages(qRates: Record<string, string>) {
  // Q1 is standalone: Governance/General
  const q1Rate = parseRate(qRates.Q1);

  // System & Procedures: Q2 to Q6
  let sysSum = 0;
  let sysCount = 0;
  for (let i = 2; i <= 6; i++) {
    const r = qRates[`Q${i}`];
    if (r && r !== "N/A") {
      sysSum += parseRate(r);
      sysCount++;
    }
  }
  const sysAverage = sysCount > 0 ? sysSum / sysCount : 0;

  // Staff Service: Q7 to Q9
  let staffSum = 0;
  let staffCount = 0;
  for (let i = 7; i <= 9; i++) {
    const r = qRates[`Q${i}`];
    if (r && r !== "N/A") {
      staffSum += parseRate(r);
      staffCount++;
    }
  }
  const staffAverage = staffCount > 0 ? staffSum / staffCount : 0;

  // Final Overrate: Average of (Q1, SysAvg, StaffAvg)
  // Note: Only averages points that have data.
  const points = [];
  if (qRates.Q1 && qRates.Q1 !== "N/A") points.push(q1Rate);
  if (sysCount > 0) points.push(sysAverage);
  if (staffCount > 0) points.push(staffAverage);

  const overrateValue = points.length > 0 
    ? points.reduce((a, b) => a + b, 0) / points.length 
    : 0;

  return {
    sysRate: sysAverage > 0 ? sysAverage.toFixed(2) + "%" : "N/A",
    staffRate: staffAverage > 0 ? staffAverage.toFixed(2) + "%" : "N/A",
    overrate: overrateValue > 0 ? overrateValue.toFixed(2) + "%" : "N/A",
    raw: {
      sys: sysAverage,
      staff: staffAverage,
      overall: overrateValue
    }
  };
}

/**
 * Formats a raw number to a rate string.
 */
export function formatRate(value: number): string {
  if (isNaN(value) || value === 0) return "N/A";
  return value.toFixed(2) + "%";
}

/**
 * Calculates the collection rate based on total responses and registered visitors.
 * Formula: (Collection / Visitors) * 100, capped at 100%.
 */
export function calculateCollectionRate(collection: number, visitor: number): string {
  if (visitor <= 0) return collection > 0 ? "100.00%" : "0.00%";
  const rate = (collection / visitor) * 100;
  return (rate > 100 ? 100 : rate).toFixed(2) + "%";
}

