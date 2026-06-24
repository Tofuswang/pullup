export type BusyBlock = {
  start: Date;
  end: Date;
};

export type TimeSlot = {
  id: string;
  start: Date;
  end: Date;
  label: string;
};

export type CalendarEventInput = {
  summary: string;
  description: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: string[];
};

export type CalendarEventResult =
  | {
      status: "created";
      provider: "eventkit";
      id: string;
      htmlLink?: string;
      mocked: false;
    }
  | {
      status: "native_required";
      provider: "eventkit";
      handoff: string;
      mocked: false;
    };

export type NativeCalendarWriter = (
  event: CalendarEventInput,
  context: { conversationId: string },
) => Promise<{ id: string; htmlLink?: string }>;

export function localIosCalendarInstructions(): string {
  return [
    "To use your iPhone Calendar locally, check your Calendar app and send me 2-4 windows that are actually free.",
    "",
    "Example:",
    "Thu 7:30 PM, Sat 3 PM, Sun 4:30 PM",
    "",
    "I only need free windows, not event names or private details.",
  ].join("\n");
}

export function parseLocalAvailability(text: string, now = new Date()): TimeSlot[] {
  const normalized = text
    .replace(/[，；;]/g, ",")
    .replace(/\band\b/gi, ",")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const parsed = normalized
    .map((item, index) => parseSlot(item, index + 1, now))
    .filter((slot): slot is TimeSlot => Boolean(slot));

  if (parsed.length > 0) return parsed.slice(0, 3);
  return defaultLocalAvailability(now);
}

export function findAvailableSlots(
  busyBlocks: BusyBlock[],
  options: { now?: Date; days?: number; durationMinutes?: number } = {},
): TimeSlot[] {
  const now = options.now ?? new Date();
  const days = options.days ?? 7;
  const durationMinutes = options.durationMinutes ?? 90;
  const slots: TimeSlot[] = [];

  for (let day = 1; day <= days; day += 1) {
    for (const hour of [15, 16, 18, 19]) {
      const start = new Date(now);
      start.setDate(now.getDate() + day);
      start.setHours(hour, hour >= 18 ? 30 : 0, 0, 0);
      const end = new Date(start.getTime() + durationMinutes * 60_000);

      if (!overlapsBusy(start, end, busyBlocks)) {
        slots.push({
          id: String(slots.length + 1),
          start,
          end,
          label: formatSlot(start),
        });
      }

      if (slots.length >= 3) return slots;
    }
  }

  return slots;
}

export async function createCalendarEvent(
  conversationId: string,
  event: CalendarEventInput,
  options: { nativeWriter?: NativeCalendarWriter } = {},
): Promise<CalendarEventResult> {
  if (event.end <= event.start) {
    throw new Error("Calendar event end must be after start.");
  }

  if (options.nativeWriter) {
    const created = await options.nativeWriter(event, { conversationId });
    return {
      status: "created",
      provider: "eventkit",
      id: created.id,
      htmlLink: created.htmlLink,
      mocked: false,
    };
  }

  return {
    status: "native_required",
    provider: "eventkit",
    handoff: eventKitNativeHandoff(event),
    mocked: false,
  };
}

export function eventKitNativeHandoff(event: CalendarEventInput): string {
  return [
    "Native EventKit write is required to create this Apple Calendar event.",
    "",
    "Use the iOS PullupCalendar EventKitCalendarWriter with write-only Calendar permission, then pass it as createCalendarEvent(..., { nativeWriter }).",
    "",
    `Title: ${event.summary}`,
    `When: ${formatSlot(event.start)} - ${formatSlot(event.end)}`,
    event.location ? `Location: ${event.location}` : undefined,
  ].filter(Boolean).join("\n");
}

export function formatSlotOptions(slots: TimeSlot[]): string {
  if (slots.length === 0) {
    return "I could not find a clean shared window yet. Send a few times that work for you, and I’ll coordinate manually.";
  }

  return [
    "I found a few windows that could work:",
    "",
    ...slots.map((slot) => `${slot.id}. ${slot.label}`),
    "",
    "Reply 1, 2, or 3.",
  ].join("\n");
}

function overlapsBusy(start: Date, end: Date, busyBlocks: BusyBlock[]): boolean {
  return busyBlocks.some((busy) => start < busy.end && end > busy.start);
}

function mockBusyBlocks(now: Date): BusyBlock[] {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(19, 30, 0, 0);
  return [{ start: tomorrow, end: new Date(tomorrow.getTime() + 90 * 60_000) }];
}

function defaultLocalAvailability(now: Date): TimeSlot[] {
  return findAvailableSlots(mockBusyBlocks(now), { now, days: 7, durationMinutes: 90 });
}

function parseSlot(text: string, id: number, now: Date): TimeSlot | undefined {
  const lower = text.toLowerCase();
  const dayOffset = dayOffsetFrom(lower, now);
  const hourMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (dayOffset === undefined || !hourMatch) return undefined;

  let hour = Number(hourMatch[1]);
  const minute = hourMatch[2] ? Number(hourMatch[2]) : 0;
  const meridiem = hourMatch[3];

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem && hour < 9) hour += 12;

  const start = new Date(now);
  start.setDate(now.getDate() + dayOffset);
  start.setHours(hour, minute, 0, 0);

  if (start <= now) start.setDate(start.getDate() + 7);

  return {
    id: String(id),
    start,
    end: new Date(start.getTime() + 90 * 60_000),
    label: formatSlot(start),
  };
}

function dayOffsetFrom(text: string, now: Date): number | undefined {
  if (text.includes("tomorrow")) return 1;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const targetDay = days.findIndex((day) => text.includes(day));
  if (targetDay === -1) return undefined;
  const today = now.getDay();
  const offset = (targetDay - today + 7) % 7;
  return offset === 0 ? 7 : offset;
}

function formatSlot(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
