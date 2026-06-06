import type { Guest, GuestStatus, MessageLog, PullupEvent } from "../domain";
import type { PullupStore } from "../store/sqlite";
import type { AgentContext, AgentInput, AgentMemory } from "./types";

export function buildAgentContext(
  input: AgentInput,
  store: PullupStore,
): AgentContext {
  const text = input.text.trim();
  const phone = phoneFromConversation(input.conversationId);
  const guest = phone ? store.findGuestByPhone(phone) : undefined;
  const activeEvent =
    guest ? store.getEvent(guest.eventId) : store.getActiveEventForHost(input.conversationId);
  const guests = activeEvent ? store.listGuests(activeEvent.id) : [];
  const recentMessages = activeEvent
    ? store.listRecentMessages(activeEvent.id, 10)
    : [];

  return {
    input,
    text,
    phone,
    route: "host_intake",
    event: activeEvent,
    guest,
    guests,
    recentMessages,
    memory: activeEvent
      ? buildAgentMemory(activeEvent, guests, recentMessages)
      : undefined,
  };
}

export function buildAgentMemory(
  event: PullupEvent,
  guests: Guest[],
  recentMessages: MessageLog[],
): AgentMemory {
  return {
    eventBrief: formatEventMemory(event),
    guestSummary: formatGuestMemory(guests),
    recentMessages: formatMessageMemory(recentMessages),
  };
}

export function formatEventMemory(event: PullupEvent): string {
  return [
    `Status: ${event.status}`,
    `Title: ${event.title ?? "missing"}`,
    `Date: ${event.date ?? "missing"}`,
    `Format: ${event.format ?? "missing"}`,
    `Cost: ${event.cost ?? "missing"}`,
    `Audience: ${event.audience ?? "missing"}`,
    `Why join: ${event.whyJoin ?? "missing"}`,
    `What attendees learn: ${event.whatAttendeesLearn ?? "missing"}`,
    `What attendees build/do: ${event.whatAttendeesBuildOrDo ?? "missing"}`,
    `CTA: ${event.reserveSpotCta ?? "missing"}`,
    `Venue/location: ${event.venueOrLocation ?? "missing"}`,
    `Capacity: ${event.capacity ?? "missing"}`,
    `Guest list raw: ${event.guestListRaw ?? "missing"}`,
    `Invite draft: ${event.inviteDraft ?? "missing"}`,
  ].join("\n");
}

export function formatGuestMemory(guests: Guest[]): string {
  if (guests.length === 0) return "No guests yet.";
  const summary = guests.reduce(
    (counts, guest) => {
      counts[guest.rsvpStatus] += 1;
      return counts;
    },
    emptyGuestSummary(),
  );
  const sample = guests
    .slice(0, 8)
    .map((guest) => `${guest.name ?? guest.phone ?? "unknown"}: rsvp=${guest.rsvpStatus}, send=${guest.sendStatus}`)
    .join("\n");
  return [
    `Total guests: ${guests.length}`,
    `Confirmed: ${summary.confirmed}`,
    `Maybe: ${summary.maybe}`,
    `Declined: ${summary.declined}`,
    `Interested: ${summary.interested}`,
    `Invited: ${summary.invited}`,
    `Opted out: ${summary.opted_out}`,
    sample,
  ].filter(Boolean).join("\n");
}

export function formatMessageMemory(messages: MessageLog[]): string {
  if (messages.length === 0) return "No recent messages.";
  return messages
    .map((message) => `${message.direction}/${message.channel}: ${message.body}`)
    .join("\n");
}

function emptyGuestSummary(): Record<GuestStatus, number> {
  return {
    not_invited: 0,
    invited: 0,
    interested: 0,
    confirmed: 0,
    declined: 0,
    maybe: 0,
    send_failed_target_not_allowed: 0,
    opted_out: 0,
    needs_human: 0,
  };
}

function phoneFromConversation(conversationId: string): string | undefined {
  const match = conversationId.match(/(\+\d{8,})$/);
  return match?.[1];
}
