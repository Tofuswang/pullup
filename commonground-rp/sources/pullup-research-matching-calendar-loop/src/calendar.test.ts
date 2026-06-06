import { describe, expect, test } from "bun:test";
import {
  createCalendarEvent,
  eventKitNativeHandoff,
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

  test("requires the native EventKit writer instead of creating mock holds", async () => {
    const event = {
      summary: "CommonGround room",
      description: "Public venue first.",
      location: "quiet cafe near Da'an Taipei",
      start: new Date("2026-06-11T19:30:00+08:00"),
      end: new Date("2026-06-11T21:00:00+08:00"),
    };

    const result = await createCalendarEvent("iMessage:room-1", event);

    expect(result.status).toBe("native_required");
    expect(result.mocked).toBe(false);
    expect(result.provider).toBe("eventkit");
    if (result.status !== "native_required") {
      throw new Error("Expected native_required calendar result.");
    }
    expect(result.handoff).toContain("Native EventKit write is required");
    expect(eventKitNativeHandoff(event)).toContain("CommonGround room");
  });

  test("uses an injected native EventKit writer when available", async () => {
    const event = {
      summary: "CommonGround room",
      description: "Public venue first.",
      start: new Date("2026-06-11T19:30:00+08:00"),
      end: new Date("2026-06-11T21:00:00+08:00"),
    };

    const result = await createCalendarEvent("iMessage:room-1", event, {
      nativeWriter: async (input, context) => {
        expect(input.summary).toBe("CommonGround room");
        expect(context.conversationId).toBe("iMessage:room-1");
        return { id: "eventkit-event-id" };
      },
    });

    expect(result).toEqual({
      status: "created",
      provider: "eventkit",
      id: "eventkit-event-id",
      htmlLink: undefined,
      mocked: false,
    });
  });
});
