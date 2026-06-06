import OpenAI from "openai";
import type {
  AgentTraceStep,
  Channel,
  EventBrief,
  Guest,
  OutboundInvite,
  PullupEvent,
} from "./domain";
import { PullupStore } from "./store/sqlite";
import {
  buildInviteDraft,
  classifyRsvp,
  formatDraft,
  formatStatus,
  missingBriefFields,
  nextBriefQuestion,
  trace,
} from "./agents/specialists";

export type AgentInput = {
  conversationId: string;
  text: string;
  channel: Channel;
};

export type AgentResponse = {
  text: string;
  outboundInvites?: OutboundInvite[];
};

type ReplyContext = {
  event?: PullupEvent;
  guest?: Guest;
  userText: string;
  fallback: string;
  intent:
    | "host_intake"
    | "draft"
    | "approve"
    | "send"
    | "status"
    | "reset"
    | "guest_rsvp"
    | "error";
  trace: AgentTraceStep[];
};

export type PullupLlm = {
  generateReply: (context: ReplyContext) => Promise<string>;
};

let llmOverride: PullupLlm | undefined;
let storeOverride: PullupStore | undefined;
let openaiClient: OpenAI | undefined;

function getStore(): PullupStore {
  storeOverride ??= new PullupStore();
  return storeOverride;
}

function systemPromptFor(context: ReplyContext): string {
  const currentAgent = context.trace.at(-1)?.agent ?? "Host Concierge";
  const event = context.event;
  return [
    `You are ${currentAgent}, one specialist inside pullup's event activation agent team.`,
    "pullup helps hosts and brands turn loose event ideas into real gatherings.",
    "Write like a calm, socially fluent text message. Be concise.",
    "Ask at most one next question unless showing a draft or status.",
    "Do not invent confirmed logistics, venues, dates, or guest commitments.",
    "Do not claim invites were sent unless the tool result says they were queued or sent.",
    "Do not mention internal agent names in the user-facing text.",
    "",
    `Intent: ${context.intent}`,
    `Title: ${event?.title ?? "unknown"}`,
    `Date: ${event?.date ?? "unknown"}`,
    `Format: ${event?.format ?? "unknown"}`,
    `Audience: ${event?.audience ?? "unknown"}`,
    `Venue/location: ${event?.venueOrLocation ?? "unknown"}`,
    `Status: ${event?.status ?? "none"}`,
  ].join("\n");
}

function getOpenAiClient(): OpenAI | undefined {
  if (!process.env.OPENAI_API_KEY) return undefined;
  openaiClient ??= new OpenAI();
  return openaiClient;
}

function defaultLlm(): PullupLlm {
  const client = getOpenAiClient();
  if (!client) {
    throw new Error(
      "OPENAI_API_KEY is required. Add it to .env before running pullup.",
    );
  }

  return {
    async generateReply(context) {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.5",
        instructions: systemPromptFor(context),
        input: context.userText,
      });

      return response.output_text.trim() || context.fallback;
    },
  };
}

function formatTrace(traceSteps: AgentTraceStep[]): string {
  return [
    "[agent trace]",
    ...traceSteps.map((step) => `- ${step.agent}: ${step.action}`),
    "",
  ].join("\n");
}

async function reply(
  context: ReplyContext,
  options: { showTrace: boolean; outboundInvites?: OutboundInvite[] },
): Promise<AgentResponse> {
  const llm = llmOverride ?? defaultLlm();
  const generatedText = await llm.generateReply(context);
  const text = options.showTrace
    ? `${formatTrace(context.trace)}${generatedText}`
    : generatedText;

  return {
    text,
    outboundInvites: options.outboundInvites,
  };
}

export function setPullupLlmForTesting(llm: PullupLlm | undefined): void {
  llmOverride = llm;
}

export function setPullupStoreForTesting(store: PullupStore | undefined): void {
  storeOverride = store;
}

export function recordInviteSendResult(
  guestId: string,
  status: "sent" | "target_not_allowed" | "failed",
): void {
  getStore().markInviteSendResult(guestId, status);
}

export function recordOutboundInviteMessage(invite: OutboundInvite, channel: Channel): void {
  getStore().logOutboundInvite({
    eventId: invite.eventId,
    guestId: invite.guestId,
    phone: invite.phone,
    body: invite.text,
    channel,
  });
}

export async function runPullupAgent(
  input: AgentInput,
): Promise<AgentResponse> {
  const store = getStore();
  const text = input.text.trim();
  const phone = phoneFromConversation(input.conversationId);
  const guest = phone ? store.findGuestByPhone(phone) : undefined;
  const showTrace =
    input.channel === "terminal"
      ? process.env.PULLUP_SHOW_AGENT_TRACE !== "0"
      : process.env.PULLUP_SHOW_AGENT_TRACE === "1" && !guest;

  if (guest && guest.rsvpStatus !== "opted_out" && !text.startsWith("/")) {
    return handleGuestReply(store, input, guest, showTrace);
  }

  if (text === "/reset") {
    const event = store.getActiveEventForHost(input.conversationId);
    if (event) store.updateEvent(event.id, { status: "cancelled" });
    return reply(
      {
        event,
        userText: text,
        intent: "reset",
        trace: trace({
          agent: "Host Concierge",
          action: "Cancel the active draft and restart intake.",
        }),
        fallback: "Reset. Start a new pullup whenever you're ready.",
      },
      { showTrace },
    );
  }

  const event = store.getOrCreateDraftEvent(input.conversationId);
  store.logMessage({
    eventId: event.id,
    conversationId: input.conversationId,
    direction: "inbound",
    channel: input.channel,
    body: text,
  });

  if (text === "/draft") return showDraft(store, event, text, showTrace);
  if (text === "/approve") return approveDraft(store, event, text, showTrace);
  if (text === "/send") return queueInvites(store, event, text, showTrace);
  if (text === "/status") return showStatus(store, event, text, showTrace);

  return continueHostIntake(store, event, text, showTrace);
}

async function continueHostIntake(
  store: PullupStore,
  event: PullupEvent,
  text: string,
  showTrace: boolean,
): Promise<AgentResponse> {
  let updated = store.updateEvent(event.id, extractBriefUpdates(event, text));
  const guests = parseGuests(updated.guestListRaw);
  if (guests.length > 0) {
    store.replaceGuests(updated.id, guests);
  }

  if (missingBriefFields(updated).length === 0) {
    const inviteDraft = buildInviteDraft(updated);
    updated = store.updateEvent(updated.id, {
      inviteDraft,
      status: "needs_approval",
    });

    store.logAgentTask({
      eventId: updated.id,
      agent: "Invite Copy",
      status: "completed",
      input: updated,
      output: inviteDraft,
    });

    return reply(
      {
        event: updated,
        userText: text,
        intent: "draft",
        trace: trace(
          {
            agent: "Event Strategist",
            action: "All Linear event template fields are present.",
          },
          {
            agent: "Invite Copy",
            action: "Draft the first iMessage-native invite.",
          },
          {
            agent: "Safety & Trust",
            action: "Require host approval before sending.",
          },
        ),
        fallback: `${formatDraft(updated, store.listGuests(updated.id))}\n\nReply /approve to approve this invite, or send edits.`,
      },
      { showTrace },
    );
  }

  const nextField = missingBriefFields(updated)[0]!;
  return reply(
    {
      event: updated,
      userText: text,
      intent: "host_intake",
      trace: trace(
        {
          agent: "Host Concierge",
          action: "Capture host input and update the event brief.",
        },
        {
          agent: "Event Strategist",
          action: `Identify next missing Linear template field: ${nextField}.`,
        },
      ),
      fallback: nextBriefQuestion(nextField),
    },
    { showTrace },
  );
}

async function showDraft(
  store: PullupStore,
  event: PullupEvent,
  text: string,
  showTrace: boolean,
): Promise<AgentResponse> {
  return reply(
    {
      event,
      userText: text,
      intent: "draft",
      trace: trace({
        agent: "Host Concierge",
        action: "Show the current event brief and invite draft.",
      }),
      fallback: formatDraft(event, store.listGuests(event.id)),
    },
    { showTrace },
  );
}

async function approveDraft(
  store: PullupStore,
  event: PullupEvent,
  text: string,
  showTrace: boolean,
): Promise<AgentResponse> {
  if (!event.inviteDraft) {
    return reply(
      {
        event,
        userText: text,
        intent: "approve",
        trace: trace({
          agent: "Safety & Trust",
          action: "Block approval because there is no invite draft yet.",
        }),
        fallback: "There is no invite draft to approve yet. Send /draft or finish the missing event details first.",
      },
      { showTrace },
    );
  }

  const approved = store.approveEvent(event.id);
  return reply(
    {
      event: approved,
      userText: text,
      intent: "approve",
      trace: trace({
        agent: "Safety & Trust",
        action: "Record host approval for this invite draft.",
      }),
      fallback: "Approved. Send /send when you want me to invite the guest list.",
    },
    { showTrace },
  );
}

async function queueInvites(
  store: PullupStore,
  event: PullupEvent,
  text: string,
  showTrace: boolean,
): Promise<AgentResponse> {
  if (event.status !== "approved") {
    return reply(
      {
        event,
        userText: text,
        intent: "send",
        trace: trace({
          agent: "Safety & Trust",
          action: "Block outbound because host has not approved the draft.",
        }),
        fallback: "I can't send yet. Please review the invite and reply /approve first.",
      },
      { showTrace },
    );
  }

  const limit = Number.parseInt(process.env.PULLUP_MAX_INVITES_PER_BATCH ?? "20", 10);
  const guests = store
    .listGuests(event.id)
    .filter((guest) => guest.phone && guest.sendStatus === "not_invited")
    .slice(0, Number.isFinite(limit) ? limit : 20);
  const inviteText = event.inviteDraft ?? buildInviteDraft(event);
  const outboundInvites: OutboundInvite[] = guests.map((guest) => ({
    eventId: event.id,
    guestId: guest.id,
    phone: guest.phone!,
    text: inviteText,
  }));

  store.updateEvent(event.id, { status: "inviting" });

  return reply(
    {
      event,
      userText: text,
      intent: "send",
      trace: trace(
        {
          agent: "RSVP Coordinator",
          action: `Queue ${outboundInvites.length} approved invites.`,
        },
        {
          agent: "Safety & Trust",
          action: "Respect the per-batch invite limit.",
        },
      ),
      fallback: outboundInvites.length
        ? `Queued ${outboundInvites.length} invite${outboundInvites.length === 1 ? "" : "s"}. I'll update /status as replies come in.`
        : "No unsent guests with phone numbers are available. Add guests, then try /send again.",
    },
    { showTrace, outboundInvites },
  );
}

async function showStatus(
  store: PullupStore,
  event: PullupEvent,
  text: string,
  showTrace: boolean,
): Promise<AgentResponse> {
  return reply(
    {
      event,
      userText: text,
      intent: "status",
      trace: trace({
        agent: "RSVP Coordinator",
        action: "Summarize the current guest funnel.",
      }),
      fallback: formatStatus(event, store.rsvpSummary(event.id)),
    },
    { showTrace },
  );
}

async function handleGuestReply(
  store: PullupStore,
  input: AgentInput,
  guest: Guest,
  showTrace: boolean,
): Promise<AgentResponse> {
  const rsvp = classifyRsvp(input.text) ?? "needs_human";
  const updatedGuest = store.updateGuestStatus(guest.id, {
    rsvpStatus: rsvp,
  });
  const event = store.getEvent(guest.eventId);

  store.logMessage({
    eventId: guest.eventId,
    guestId: guest.id,
    conversationId: input.conversationId,
    direction: "inbound",
    channel: input.channel,
    body: input.text,
  });

  const fallback = guestReplyFor(updatedGuest.rsvpStatus);
  return reply(
    {
      event,
      guest: updatedGuest,
      userText: input.text,
      intent: "guest_rsvp",
      trace: trace({
        agent: "RSVP Coordinator",
        action: `Classify guest reply as ${updatedGuest.rsvpStatus}.`,
      }),
      fallback,
    },
    { showTrace },
  );
}

function guestReplyFor(status: Guest["rsvpStatus"]): string {
  switch (status) {
    case "confirmed":
      return "Got it - you're confirmed. I'll send any important updates here.";
    case "maybe":
      return "No pressure. I'll mark you as maybe for now.";
    case "declined":
      return "All good, thanks for letting me know.";
    case "interested":
      return "Great, I'll keep you posted with the key details.";
    case "opted_out":
      return "Got it. I won't message you about this again.";
    default:
      return "Got it. I'll have the host follow up if needed.";
  }
}

function extractBriefUpdates(event: PullupEvent, text: string): Partial<EventBrief> {
  const field = missingBriefFields(event)[0] ?? "title";
  const updates: Partial<EventBrief> = {};
  const labelUpdates = parseLabeledFields(text);
  Object.assign(updates, labelUpdates);

  if (Object.keys(updates).length === 0) {
    updates[field] = coerceFieldValue(field, text) as never;
  }

  if (!updates.date) {
    const date = text.match(/\b(next\s+\w+|tomorrow|today|tonight|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})\b/i)?.[0];
    if (date && !event.date) updates.date = date;
  }

  if (!updates.format) {
    const lower = text.toLowerCase();
    if (lower.includes("hybrid")) updates.format = "hybrid";
    else if (lower.includes("online") || lower.includes("virtual")) updates.format = "online";
    else if (lower.includes("in-person") || lower.includes("offline") || lower.includes("dinner")) updates.format = "in-person";
  }

  if (!updates.capacity) {
    const capacity = text.match(/\b(\d{1,3})\s*(people|guests|attendees|人|位)?\b/i)?.[1];
    if (capacity && !event.capacity) updates.capacity = Number.parseInt(capacity, 10);
  }

  const phones = parseGuests(text);
  if (phones.length > 0 && !event.guestListRaw) updates.guestListRaw = text;

  return updates;
}

function parseLabeledFields(text: string): Partial<EventBrief> {
  const updates: Partial<EventBrief> = {};
  const lines = text.split(/\n|;/).map((line) => line.trim());
  for (const line of lines) {
    const match = line.match(/^([\w\s'/-]+):\s*(.+)$/);
    if (!match) continue;
    const label = match[1]!.toLowerCase().replace(/\s+/g, "_");
    const value = match[2]!.trim();
    if (label.includes("title")) updates.title = value;
    else if (label.includes("date") || label.includes("time")) updates.date = value;
    else if (label.includes("format")) updates.format = coerceFormat(value);
    else if (label.includes("cost")) updates.cost = value;
    else if (label.includes("audience") || label.includes("who")) updates.audience = value;
    else if (label.includes("why")) updates.whyJoin = value;
    else if (label.includes("learn")) updates.whatAttendeesLearn = value;
    else if (label.includes("build") || label.includes("do")) updates.whatAttendeesBuildOrDo = value;
    else if (label.includes("cta") || label.includes("reserve")) updates.reserveSpotCta = value;
    else if (label.includes("venue") || label.includes("location")) updates.venueOrLocation = value;
    else if (label.includes("capacity")) updates.capacity = Number.parseInt(value, 10);
    else if (label.includes("guest")) updates.guestListRaw = value;
  }
  return updates;
}

function coerceFieldValue(field: keyof EventBrief, text: string): string | number | EventBrief["format"] {
  if (field === "format") return coerceFormat(text);
  if (field === "capacity") return Number.parseInt(text.match(/\d+/)?.[0] ?? "0", 10);
  return text;
}

function coerceFormat(text: string): EventBrief["format"] {
  const lower = text.toLowerCase();
  if (lower.includes("hybrid")) return "hybrid";
  if (lower.includes("online") || lower.includes("virtual")) return "online";
  if (lower.includes("person") || lower.includes("offline")) return "in-person";
  return "unknown";
}

function parseGuests(raw?: string): Array<{ name?: string; phone?: string; segment?: string }> {
  if (!raw) return [];
  const chunks = raw
    .split(/,|\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const guests = [];
  for (const chunk of chunks) {
    const phone = chunk.match(/\+?\d[\d\s-]{7,}\d/)?.[0]?.replace(/[\s-]/g, "");
    if (phone) {
      guests.push({
        name: chunk.replace(phone, "").trim() || undefined,
        phone: phone.startsWith("+") ? phone : `+${phone}`,
      });
    }
  }
  return guests;
}

function phoneFromConversation(conversationId: string): string | undefined {
  const match = conversationId.match(/(\+\d{8,})$/);
  return match?.[1];
}
