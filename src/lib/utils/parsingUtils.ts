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
