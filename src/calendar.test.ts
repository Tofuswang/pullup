import { describe, expect, test } from "bun:test";
import {
  findAvailableSlots,
  formatSlotOptions,
  localIosCalendarInstructions,
  parseLocalAvailability,
} from "./calendar";

describe("calendar helpers", () => {
  test("explains local iPhone Calendar availability sharing", () => {
    expect(localIosCalendarInstructions()).toContain("iPhone Calendar");
    expect(localIosCalendarInstructions()).toContain("free windows");
  });

  test("finds slots around busy blocks without exposing event details", () => {
    const now = new Date("2026-06-06T10:00:00+08:00");
    const busyStart = new Date(now);
    busyStart.setDate(now.getDate() + 1);
    busyStart.setHours(15, 0, 0, 0);

    const slots = findAvailableSlots(
      [{ start: busyStart, end: new Date(busyStart.getTime() + 90 * 60_000) }],
      { now, days: 2, durationMinutes: 90 },
    );

    expect(slots.length).toBeGreaterThan(0);
    const firstSlot = slots[0];
    expect(firstSlot).toBeDefined();
    expect(firstSlot!.id).toBe("1");
    expect(formatSlotOptions(slots)).toContain("Reply 1, 2, or 3");
  });

  test("handles no-slot fallback", () => {
    expect(formatSlotOptions([])).toContain("could not find a clean shared window");
  });

  test("parses user-shared local availability windows", () => {
    const now = new Date("2026-06-06T10:00:00+08:00");
    const slots = parseLocalAvailability("Thu 7:30 PM, Sat 3 PM", now);

    expect(slots).toHaveLength(2);
    const firstSlot = slots[0];
    expect(firstSlot).toBeDefined();
    expect(firstSlot!.id).toBe("1");
    expect(firstSlot!.label).toContain("Thu");
  });
});
