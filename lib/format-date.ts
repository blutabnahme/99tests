/**
 * Format a date string for display.
 * 
 * Handles both date-only strings ("1991-09-05") and full ISO timestamps 
 * ("2026-04-07T03:04:59.463Z") correctly without timezone shift.
 * 
 * Date-only strings are parsed as literal dates (no UTC conversion).
 * Full timestamps are parsed normally and displayed in German locale.
 */
export function formatDate(input: string, options?: { includeTime?: boolean }): string {
  if (!input) return '-';

  const str = input.trim();

  // Date-only format: YYYY-MM-DD (no time component)
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return `${d}.${m}.${y}`;
  }

  // Full ISO timestamp — use Date object
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (options?.includeTime || str.includes('T') || str.includes(':')) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  return `${day}.${month}.${year}`;
}

/**
 * Format a date for display as DD.MM.YYYY only (no time), 
 * safe for date-of-birth and other date-only fields.
 */
export function formatDateOnly(input: string): string {
  return formatDate(input, { includeTime: false });
}
