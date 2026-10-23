import { assert, assertEquals } from "jsr:@std/assert@1";
import { addBusinessDays, businessDaysBetween, localParts, weekendDays, zonedTimeToUtc } from "./calendar.ts";
import { CHASER_WINDOW, nextSlot, workdayWindow } from "./sendWindow.ts";

const BERLIN = "Europe/Berlin";
const RIYADH = "Asia/Riyadh";

Deno.test("Gulf weekends are Friday and Saturday, UAE is Saturday and Sunday", () => {
  assertEquals(weekendDays("SA"), [5, 6]);
  assertEquals(weekendDays("ae"), [0, 6]);
  assertEquals(weekendDays(null), [0, 6]);
});

Deno.test("zonedTimeToUtc survives the Berlin DST switch", () => {
  // 2026-10-25 clocks go back in Berlin; 10:00 that day is UTC+1.
  assertEquals(zonedTimeToUtc(2026, 10, 25, 10, 0, BERLIN).toISOString(), "2026-10-25T09:00:00.000Z");
  assertEquals(zonedTimeToUtc(2026, 10, 24, 10, 0, BERLIN).toISOString(), "2026-10-24T08:00:00.000Z");
});

Deno.test("applied Friday + 6 business days lands on Monday of the week after next", () => {
  const fri = zonedTimeToUtc(2026, 10, 23, 15, 0, BERLIN);
  const due = addBusinessDays(fri, 6, BERLIN);
  const p = localParts(due, BERLIN);
  assertEquals([p.year, p.month, p.day, p.weekday], [2026, 11, 2, 1]);
});

Deno.test("Riyadh business days skip Friday and Saturday", () => {
  const thu = zonedTimeToUtc(2026, 10, 22, 12, 0, RIYADH);
  const p = localParts(addBusinessDays(thu, 1, RIYADH, weekendDays("SA")), RIYADH);
  assertEquals([p.day, p.weekday], [25, 0]); // Sunday is a workday there
});

Deno.test("businessDaysBetween counts weekdays only", () => {
  const mon = zonedTimeToUtc(2026, 10, 19, 9, 0, BERLIN);
  const nextMon = zonedTimeToUtc(2026, 10, 26, 9, 0, BERLIN);
  assertEquals(businessDaysBetween(mon, nextMon, BERLIN), 5);
});

Deno.test("chaser slot is Tue-Thu 10:00-14:00 local and never on the hour", () => {
  const sat = zonedTimeToUtc(2026, 10, 24, 11, 0, BERLIN);
  const slot = nextSlot(sat, BERLIN, CHASER_WINDOW, "fu-123");
  const p = localParts(slot, BERLIN);
  assertEquals(p.weekday, 2);
  assert(p.hour >= 10 && p.hour < 14, `hour ${p.hour}`);
  assert(p.minute !== 0);
});

Deno.test("same seed gives the same slot; slot is always after the input", () => {
  const t = zonedTimeToUtc(2026, 10, 27, 9, 0, BERLIN);
  const a = nextSlot(t, BERLIN, CHASER_WINDOW, "seed");
  const b = nextSlot(t, BERLIN, CHASER_WINDOW, "seed");
  assertEquals(a.getTime(), b.getTime());
  for (let h = 0; h < 24 * 14; h += 5) {
    const at = new Date(t.getTime() + h * 3_600_000);
    const s = nextSlot(at, "America/New_York", CHASER_WINDOW, `s${h}`);
    assert(s > at);
    const p = localParts(s, "America/New_York");
    assert([2, 3, 4].includes(p.weekday));
    assert(p.hour >= 10 && p.hour < 14);
  }
});

Deno.test("mid-window sends the same day; too close to closing rolls to the next window day", () => {
  for (const seed of ["a", "b", "zzzz", "fu-9"]) {
    const tue11 = zonedTimeToUtc(2026, 10, 27, 11, 0, BERLIN);
    const same = localParts(nextSlot(tue11, BERLIN, CHASER_WINDOW, seed), BERLIN);
    assertEquals(same.day, 27, seed);
    assert(same.hour < 14, seed);

    const tue1359 = zonedTimeToUtc(2026, 10, 27, 13, 59, BERLIN);
    const next = localParts(nextSlot(tue1359, BERLIN, CHASER_WINDOW, seed), BERLIN);
    assertEquals([next.day, next.weekday], [28, 3], seed);
  }
});

Deno.test("thank-you window allows Sunday in Riyadh", () => {
  const satNight = zonedTimeToUtc(2026, 10, 24, 20, 0, RIYADH);
  const slot = nextSlot(satNight, RIYADH, workdayWindow(weekendDays("SA")), "ty");
  assertEquals(localParts(slot, RIYADH).weekday, 0);
});
