import type { AgentTraceStep, EventBrief, Guest, GuestStatus, PullupEvent } from "../domain";

export const requiredBriefFields: Array<keyof EventBrief> = [
  "title",
  "date",
  "format",
  "cost",
  "audience",
  "whyJoin",
  "whatAttendeesLearn",
  "whatAttendeesBuildOrDo",
  "reserveSpotCta",
  "venueOrLocation",
  "capacity",
  "guestListRaw",
];

export function missingBriefFields(event: PullupEvent): Array<keyof EventBrief> {
  return requiredBriefFields.filter((field) => {
    const value = event[field];
    return value === undefined || value === "" || value === 0;
  });
}

export function nextBriefQuestion(field: keyof EventBrief): string {
  switch (field) {
    case "title":
      return "What should we call this event?";
    case "date":
      return "When is it happening? A rough date/time is enough.";
    case "format":
      return "Is this online, in-person, or hybrid?";
    case "cost":
      return "Is it free or paid?";
    case "audience":
      return "Who is this for?";
    case "whyJoin":
      return "Why should people show up?";
    case "whatAttendeesLearn":
      return "What will attendees learn or take away?";
    case "whatAttendeesBuildOrDo":
      return "What will attendees build, do, or experience during it?";
    case "reserveSpotCta":
      return "What should the CTA be: save a seat, RSVP, apply, or something else?";
    case "venueOrLocation":
      return "Where is it happening? A venue, city, or online link placeholder works.";
    case "capacity":
      return "How many people should we aim for?";
    case "guestListRaw":
      return "Who should get the invite? Send names, phone numbers, or a rough guest list.";
    default:
      return "What detail should I add next?";
  }
}

export function trace(...steps: AgentTraceStep[]): AgentTraceStep[] {
  return steps;
}

export function buildInviteDraft(event: PullupEvent): string {
  const title = event.title ?? "this pullup";
  const date = event.date ?? "soon";
  const location = event.venueOrLocation ?? "TBD";
  const audience = event.audience ?? "a small group";
  const why = event.whyJoin ?? "meet good people and trade useful notes";
  const cta = event.reserveSpotCta ?? "Want me to save you a spot?";

  return [
    `Hey - we're pulling together ${title} ${date}.`,
    `It's for ${audience}.`,
    `${why}`,
    `Location: ${location}.`,
    cta,
  ].join("\n");
}

export function formatDraft(event: PullupEvent, guests: Guest[]): string {
  const lines = [
    "Current pullup draft:",
    "",
    `Title: ${event.title ?? "missing"}`,
    `Date: ${event.date ?? "missing"}`,
    `Format: ${event.format ?? "missing"}`,
    `Cost: ${event.cost ?? "missing"}`,
    `Who's it for: ${event.audience ?? "missing"}`,
    `Why join: ${event.whyJoin ?? "missing"}`,
    `What they'll learn: ${event.whatAttendeesLearn ?? "missing"}`,
    `What they'll build/do: ${event.whatAttendeesBuildOrDo ?? "missing"}`,
    `CTA: ${event.reserveSpotCta ?? "missing"}`,
    `Venue/location: ${event.venueOrLocation ?? "missing"}`,
    `Capacity: ${event.capacity ?? "missing"}`,
    `Guests: ${guests.length ? guests.map((guest) => guest.name ?? guest.phone ?? "unknown").join(", ") : "missing"}`,
    "",
    "Invite draft:",
    event.inviteDraft ?? "missing",
  ];

  return lines.join("\n");
}

export function formatStatus(event: PullupEvent, summary: Record<GuestStatus, number>): string {
  return [
    `Status for ${event.title ?? "current event"}:`,
    `Event: ${event.status}`,
    `Invited: ${summary.invited}`,
    `Confirmed: ${summary.confirmed}`,
    `Maybe: ${summary.maybe}`,
    `Declined: ${summary.declined}`,
    `Interested: ${summary.interested}`,
    `Opted out: ${summary.opted_out}`,
    `Send failures: ${summary.send_failed_target_not_allowed + summary.needs_human}`,
  ].join("\n");
}

export function classifyRsvp(text: string): GuestStatus | undefined {
  const normalized = text.trim().toLowerCase();
  if (["stop", "unsubscribe", "opt out", "opt-out", "不要", "退訂"].some((word) => normalized.includes(word))) {
    return "opted_out";
  }
  if (["yes", "yep", "sure", "in", "confirm", "confirmed", "好", "可以", "會去"].some((word) => normalized.includes(word))) {
    return "confirmed";
  }
  if (["maybe", "可能", "看看", "不確定"].some((word) => normalized.includes(word))) {
    return "maybe";
  }
  if (["no", "can't", "cannot", "decline", "不行", "沒辦法"].some((word) => normalized.includes(word))) {
    return "declined";
  }
  if (["interested", "tell me more", "more info", "有興趣"].some((word) => normalized.includes(word))) {
    return "interested";
  }
  return undefined;
}
