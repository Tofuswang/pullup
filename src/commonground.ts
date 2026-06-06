import type { AgentInput, AgentResponse } from "./domain";
import { appleMapsSearchUrl, formatIphoneCalendarEventCard } from "./ios";

type CommonGroundStep =
  | "invited"
  | "awaiting_consent"
  | "awaiting_linkedin"
  | "awaiting_passport"
  | "awaiting_redaction_approval"
  | "awaiting_preferences"
  | "room_recommended"
  | "availability_collecting"
  | "slot_selected"
  | "event_confirmed"
  | "feedback_pending";

type CommonGroundState = {
  step: CommonGroundStep;
  linkedinUrl?: string;
  passportSummary?: string;
  preferences?: string;
  room?: DemoRoom;
  selectedSlot?: DemoSlot;
};

type DemoUser = {
  id: string;
  name: string;
  role: string;
  tags: string[];
};

type DemoSlot = {
  id: string;
  label: string;
  start: Date;
  end: Date;
};

type DemoRoom = {
  title: string;
  activity: string;
  venue: string;
  people: DemoUser[];
  sharedContext: string[];
  prompts: string[];
  reason: string;
};

const states = new Map<string, CommonGroundState>();

const demoPeople: DemoUser[] = [
  {
    id: "u_004",
    name: "Mina",
    role: "AI product manager",
    tags: ["AI tools", "career transitions", "quiet cafes", "city walks"],
  },
  {
    id: "u_007",
    name: "Ethan",
    role: "NTU alum, fintech builder",
    tags: ["finance", "startups", "matcha", "thoughtful conversation"],
  },
  {
    id: "u_009",
    name: "Claire",
    role: "UX researcher",
    tags: ["psychology", "books", "gallery walks", "low-pressure groups"],
  },
];

export function runCommonGroundAgent(input: AgentInput): AgentResponse | undefined {
  const text = input.text.trim();
  const cleanText = cleanUserText(text);
  const normalized = cleanText.toLowerCase();
  const state = states.get(input.conversationId);

  if (["/reset", "reset"].includes(normalized) && state) {
    states.delete(input.conversationId);
    return { text: "Reset. Text START when you want to re-enter CommonGround." };
  }

  if (!state && isLinkedinUrl(cleanText)) {
    const fresh: CommonGroundState = {
      step: "awaiting_passport",
      linkedinUrl: cleanText,
    };
    states.set(input.conversationId, fresh);
    return { text: aiPassportPrompt() };
  }

  if (!state && !startsCommonGroundFlow(normalized)) return undefined;

  if (!state) {
    const fresh: CommonGroundState = { step: "awaiting_consent" };
    states.set(input.conversationId, fresh);
    return { text: invitationMessage() };
  }

  switch (state.step) {
    case "awaiting_consent":
      if (!["consent", "i consent", "yes", "y"].includes(normalized)) {
        return { text: consentMessage() };
      }
      state.step = "awaiting_linkedin";
      return { text: linkedinPrompt() };

    case "awaiting_linkedin":
      if (!isLinkedinUrl(cleanText)) {
        return {
          text: "Please paste your LinkedIn profile URL. We use it only as a true-person verification handle, not for scraping or matching facts.",
        };
      }
      state.linkedinUrl = cleanText;
      state.step = "awaiting_passport";
      return { text: aiPassportPrompt() };

    case "awaiting_passport":
      if (text.length < 80) {
        return {
          text: "Paste a little more of your AI Passport summary: social energy, conversation style, interests, good first-meet settings, awkwardness triggers, and boundaries.",
        };
      }
      state.passportSummary = text;
      state.step = "awaiting_redaction_approval";
      return { text: redactionPreview(text) };

    case "awaiting_redaction_approval":
      if (!["approve", "approved", "looks good", "yes", "y"].includes(normalized)) {
        state.passportSummary = text;
        return { text: redactionPreview(text) };
      }
      state.step = "awaiting_preferences";
      return { text: preferencesPrompt() };

    case "awaiting_preferences":
      state.preferences = text;
      state.room = buildDemoRoom();
      state.step = "room_recommended";
      return { text: contextCard(state.room) };

    case "room_recommended":
      if (normalized === "skip") {
        state.step = "feedback_pending";
        return {
          text: "Got it. I’ll tune future rooms away from this vibe. What should change next time: people, activity, venue, timing, or group size?",
        };
      }
      if (normalized === "maybe") {
        return {
          text: "No pressure. I’ll keep you flexible for this room. If you want to join, reply YES; if not, reply SKIP.",
        };
      }
      if (normalized !== "yes") {
        return { text: "Reply YES, MAYBE, or SKIP for this room." };
      }
      state.step = "availability_collecting";
      return { text: availabilityPrompt() };

    case "availability_collecting": {
      const slots = parseSlots(text);
      if (slots.length === 0) return { text: availabilityPrompt() };
      const selectedSlot = slots[0]!;
      state.selectedSlot = selectedSlot;
      state.step = "slot_selected";
      return {
        text: [
          `I can hold ${selectedSlot.label} for this room.`,
          "Reply CONFIRM ROOM and I’ll prepare the iPhone Calendar event card and Apple Maps link.",
        ].join("\n"),
      };
    }

    case "slot_selected":
      if (normalized !== "confirm room") {
        return { text: "No event is created yet. Reply CONFIRM ROOM when you want me to prepare it." };
      }
      state.step = "event_confirmed";
      return { text: eventConfirmation(state) };

    case "event_confirmed":
      state.step = "feedback_pending";
      return { text: feedbackPrompt() };

    case "feedback_pending":
      return {
        text: "Thanks. I’ll use that as vibe feedback for future rooms, not as a person rating.",
      };

    default:
      return { text: invitationMessage() };
  }
}

export function isCommonGroundProtocolActive(conversationId: string): boolean {
  return states.has(conversationId);
}

function startsCommonGroundFlow(text: string): boolean {
  return ["/start", "start", "commonground", "join commonground", "start commonground"].includes(text);
}

function invitationMessage(): string {
  return [
    "You are one of a small first circle invited to CommonGround: a private NTU-origin room network for meeting thoughtful people offline.",
    "",
    "We do not do swiping. We design a room worth showing up for.",
    "",
    "Before collecting anything, I’ll ask consent and keep each data source separate.",
    "",
    "Reply CONSENT to continue.",
  ].join("\n");
}

function consentMessage(): string {
  return [
    "CommonGround uses three permissioned inputs:",
    "",
    "1. LinkedIn URL: true-person verification only. No scraping.",
    "2. AI Passport: user-approved matching signals only. No raw chat history.",
    "3. Explicit preferences: availability, boundaries, budget, intent, and comfort.",
    "",
    "Reply CONSENT to continue.",
  ].join("\n");
}

function linkedinPrompt(): string {
  return [
    "Paste your LinkedIn URL for true-person verification.",
    "",
    "Boundary: LinkedIn proves you are real. It does not define your personality or matching profile.",
  ].join("\n");
}

function aiPassportPrompt(): string {
  return [
    "Verified as a consented identity handle.",
    "",
    "Now create your AI Passport. Ask your everyday AI to summarize:",
    "",
    "- social energy",
    "- conversation style",
    "- interests and taste",
    "- good first-meet settings",
    "- awkwardness triggers",
    "- boundaries",
    "",
    "Paste the app-safe summary here. You can redact anything before sending.",
  ].join("\n");
}

function redactionPreview(passport: string): string {
  const preview = passport.replace(/\s+/g, " ").slice(0, 520);
  return [
    "Here is the plain-language matching preview I’ll use:",
    "",
    preview,
    preview.length >= 520 ? "..." : "",
    "",
    "I will not show this raw text to other users.",
    "Reply APPROVE if this is safe to use, or paste an edited version.",
  ].filter(Boolean).join("\n");
}

function preferencesPrompt(): string {
  return [
    "Great. Now send explicit preferences that should never be inferred:",
    "",
    "Intent, availability, budget, neighborhood radius, alcohol comfort, preferred group size, and contact-exchange boundary.",
    "",
    "Example: open to dating/social, Thu evening or Sun afternoon, NT$800-1500, Da'an/Xinyi, no alcohol-heavy first meet, group of 4, contact exchange only after mutual comfort.",
  ].join("\n");
}

function buildDemoRoom(): DemoRoom {
  return {
    title: "AI x Career Transition Coffee Room",
    activity: "coffee / matcha with structured conversation cards",
    venue: "quiet cafe near Da'an Taipei",
    people: demoPeople,
    sharedContext: [
      "AI changing work and personal productivity",
      "career transitions across tech, finance, and product",
      "low-pressure city cafe culture",
    ],
    prompts: [
      "What is one workflow you wish AI could automate?",
      "What kind of city place makes you feel most like yourself?",
      "What is a career topic you enjoy discussing but rarely get to talk about?",
    ],
    reason:
      "High conversation density, compatible low-medium social energy, public-first venue, and no forced contact exchange.",
  };
}

function contextCard(room: DemoRoom): string {
  return [
    "Your weekly room drop is ready.",
    "",
    `Room: ${room.title}`,
    `People: you + ${room.people.map((person) => `${person.name} (${person.role})`).join(" + ")}`,
    `Activity: ${room.activity}`,
    `Venue style: ${room.venue}`,
    "",
    "Why this room works:",
    room.reason,
    "",
    "Shared context:",
    ...room.sharedContext.map((item) => `- ${item}`),
    "",
    "Warm-up prompts:",
    ...room.prompts.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Boundaries:",
    "- public venue first",
    "- no forced contact exchange",
    "- private safety review available",
    "",
    "Reply YES, MAYBE, or SKIP.",
  ].join("\n");
}

function availabilityPrompt(): string {
  return [
    "Great. Check your iPhone Calendar and send 2-4 free windows.",
    "",
    "Example: Thu 7:30 PM, Sat 3 PM, Sun 4:30 PM",
    "",
    "I only need free windows, not event names or private details.",
  ].join("\n");
}

function parseSlots(text: string): DemoSlot[] {
  const parts = text
    .replace(/[，；;]/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const now = new Date();

  return parts.flatMap((part, index) => {
    const dayOffset = dayOffsetFrom(part.toLowerCase(), now);
    const time = part.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (dayOffset === undefined || !time) return [];
    let hour = Number(time[1]);
    const minute = time[2] ? Number(time[2]) : 0;
    const meridiem = time[3]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    if (!meridiem && hour < 9) hour += 12;
    const start = new Date(now);
    start.setDate(now.getDate() + dayOffset);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + 90 * 60_000);
    return [{ id: String(index + 1), label: formatSlot(start), start, end }];
  }).slice(0, 3);
}

function dayOffsetFrom(text: string, now: Date): number | undefined {
  if (text.includes("tomorrow")) return 1;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const targetDay = days.findIndex((day) => text.includes(day));
  if (targetDay === -1) return undefined;
  const offset = (targetDay - now.getDay() + 7) % 7;
  return offset === 0 ? 7 : offset;
}

function formatSlot(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function eventConfirmation(state: CommonGroundState): string {
  const slot = state.selectedSlot;
  const room = state.room ?? buildDemoRoom();
  if (!slot) return "I lost the selected time. Send availability again.";

  return [
    "Room confirmed.",
    "",
    formatIphoneCalendarEventCard({
      title: `CommonGround: ${room.title}`,
      start: slot.start,
      end: slot.end,
      location: room.venue,
      notes: [
        `Activity: ${room.activity}`,
        "No forced contact exchange.",
        "Public venue first.",
      ].join("\n"),
    }),
    "",
    `Apple Maps: ${appleMapsSearchUrl(room.venue)}`,
    "",
    "After the room, I’ll ask for vibe feedback. I will not ask you to rate people like products.",
  ].join("\n");
}

function feedbackPrompt(): string {
  return [
    "Vibe feedback:",
    "",
    "Did this room feel like your kind of people?",
    "Did the conversation feel natural?",
    "Was the activity a good container?",
    "Was the energy too quiet, balanced, or too intense?",
    "What should I tune next time: people, activity, venue, timing, or group size?",
    "",
    "Anything I should privately review for safety or respect reasons?",
  ].join("\n");
}

function isLinkedinUrl(text: string): boolean {
  return /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_.%-]+\/?/i.test(cleanUserText(text));
}

function cleanUserText(text: string): string {
  return text
    .trim()
    .replace(/^[“”"'`]+|[“”"'`]+$/g, "")
    .trim();
}
