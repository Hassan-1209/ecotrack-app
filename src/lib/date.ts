// ============================================================================
// Date Utilities
// ============================================================================
// Returns the local date as YYYY-MM-DD (not UTC) to match the DB seed function
// which uses `current_date` (server local time). Using toISOString() would
// shift the date backwards in timezones behind UTC, causing today's log and
// chart data to not match.
// ============================================================================

export function localDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateStr(d);
}
