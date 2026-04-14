/**
 * Utility to get ISO string bounds for a given month and year.
 */
export function getMonthBounds(month: string, year: string) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIndex = months.indexOf(month);
  
  if (monthIndex === -1) {
    throw new Error(`Invalid month: ${month}`);
  }

  // Create dates in local time of the server/env, 
  // but usually these are stored as strings YYYY-MM-DD in Firestore for this project.
  const start = new Date(parseInt(year), monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);
  
  // Return ISO strings for comparison
  // NOTE: If Firestore stores strings in a different format (e.g. YYYY-MM-DD),
  // this might need adjustment. But ISO lexicographical order works well.
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}
