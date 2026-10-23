import { localParts, zonedTimeToUtc } from "./calendar.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SendWindow {
  /** Allowed local weekdays, 0 = Sunday. */
  days: number[];
  /** Local hour the window opens (inclusive). */
  startHour: number;
  /** Local hour the window closes (exclusive). */
  endHour: number;
}

/** Tuesday to Thursday, 10:00 to 14:00 in the recipient's time zone. */
export const CHASER_WINDOW: SendWindow = { days: [2, 3, 4], startHour: 10, endHour: 14 };

/** Thank-yous go out the same business day, any weekday. */
export function workdayWindow(weekend: number[]): SendWindow {
  return {
    days: [0, 1, 2, 3, 4, 5, 6].filter((d) => !weekend.includes(d)),
    startHour: 9,
    endHour: 18,
  };
}

/** Small stable hash so the same follow-up always gets the same minute (never on the hour). */
function seededMinute(seed: string, spanMinutes: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const minute = Math.abs(h) % spanMinutes;
  return minute % 60 === 0 ? minute + 7 : minute;
}

/**
 * First slot inside the window that is strictly after `after`.
 * Within today's window, sends a few minutes after now rather than waiting for tomorrow.
 */
export function nextSlot(after: Date, timeZone: string, window: SendWindow, seed: string): Date {
  const span = (window.endHour - window.startHour) * 60;
  const offset = seededMinute(seed, span);
  const start = localParts(after, timeZone);
  const base = Date.UTC(start.year, start.month - 1, start.day);

  for (let d = 0; d < 14; d++) {
    const day = new Date(base + d * DAY_MS);
    if (!window.days.includes(day.getUTCDay())) continue;

    const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, dd = day.getUTCDate();
    const slot = zonedTimeToUtc(
      y, m, dd,
      window.startHour + Math.floor(offset / 60), offset % 60,
      timeZone,
    );
    if (slot > after) return slot;

    // Already past today's seeded minute but still inside the window: go soon.
    const close = zonedTimeToUtc(y, m, dd, window.endHour, 0, timeZone);
    const soon = new Date(after.getTime() + (5 + (offset % 20)) * 60_000);
    if (soon < close) return soon;
  }
  throw new Error(`no send slot within 14 days for window ${JSON.stringify(window)}`);
}
