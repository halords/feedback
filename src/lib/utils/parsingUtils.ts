/**
 * Helper to ensure we have an array of strings, even if legacy data is a comma-separated string.
 * Uses a "smart split" for comments that anchors on periods to avoid breaking internal commas.
 */
export function ensureArray(input: any, isComment = false): string[] {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    if (isComment && (input.includes('.,') || input.includes('..,'))) {
      // Lookbehind for one or more dots followed by a comma
      return input.split(/(?<=\.+),\s*/).map(s => s.trim()).filter(Boolean);
    }
    return input.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Groups repeated comments and appends the count in parentheses.
 * Example: ["Good", "Good"] -> ["Good (2)"]
 */
export function groupRepeatedComments(comments: string[]): string[] {
  if (!comments || comments.length === 0) return [];

  const counts = new Map<string, number>();
  comments.forEach(c => {
    const trimmed = c.trim();
    const upper = trimmed.toUpperCase();
    if (trimmed && upper !== "NA" && upper !== "N/A" && upper !== "NONE") {
      counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
    }
  });

  return Array.from(counts.entries()).map(([comment, count]) => {
    const formatted = `${comment}`;
    return count > 1 ? `${formatted} (${count})` : formatted;
  });
}
