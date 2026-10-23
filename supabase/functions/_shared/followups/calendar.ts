// Time-zone and business-day helpers built on Intl only (no dependencies),
// so they run unchanged in Deno edge functions and in the browser.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Weekend days (0 = Sunday ... 6 = Saturday) by ISO country code. */
const FRI_SAT_WEEKEND = new Set(["SA", "KW", "QA", "BH", "OM"]);

export function weekendDays(country?: string | null): number[] {
  return country && FRI_SAT_WEEKEND.has(country.toUpperCase()) ? [5, 6] : [0, 6];
}

export interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function localParts(at: Date, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    formatter(timeZone).formatToParts(at).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday],
  };
}

/** UTC instant for a wall-clock time in a time zone (handles DST by re-checking the offset). */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let guess = wall;
  for (let i = 0; i < 3; i++) {
    const p = localParts(new Date(guess), timeZone);
    const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const diff = wall - seen;
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

/**
 * Add business days in a time zone. Day 0 = the same local day.
 * The result keeps the input's local time of day; callers pick an exact slot afterwards.
 */
export function addBusinessDays(
  from: Date,
  businessDays: number,
  timeZone: string,
  weekend: number[] = [0, 6],
): Date {
  const start = localParts(from, timeZone);
  let cursor = Date.UTC(start.year, start.month - 1, start.day);
  let remaining = businessDays;
  while (remaining > 0) {
    cursor += DAY_MS;
    const weekday = new Date(cursor).getUTCDay();
    if (!weekend.includes(weekday)) remaining--;
  }
  const d = new Date(cursor);
  return zonedTimeToUtc(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    start.hour,
    start.minute,
    timeZone,
  );
}

/** Whole business days elapsed between two instants (local calendar days, weekend excluded). */
export function businessDaysBetween(
  from: Date,
  to: Date,
  timeZone: string,
  weekend: number[] = [0, 6],
): number {
  const a = localParts(from, timeZone);
  const b = localParts(to, timeZone);
  let cursor = Date.UTC(a.year, a.month - 1, a.day);
  const end = Date.UTC(b.year, b.month - 1, b.day);
  let count = 0;
  while (cursor < end) {
    cursor += DAY_MS;
    if (!weekend.includes(new Date(cursor).getUTCDay())) count++;
  }
  return count;
}
