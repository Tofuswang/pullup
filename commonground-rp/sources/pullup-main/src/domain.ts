export type Channel = "terminal" | "imessage" | "unknown";

export type AgentInput = {
  conversationId: string;
  text: string;
  channel: Channel;
};

export type EventStatus =
  | "draft"
  | "needs_approval"
  | "approved"
  | "inviting"
  | "live"
  | "completed"
  | "cancelled";

export type GuestStatus =
  | "not_invited"
  | "invited"
  | "interested"
  | "confirmed"
  | "declined"
  | "maybe"
  | "send_failed_target_not_allowed"
  | "opted_out"
  | "needs_human";

export type EventFormat = "online" | "in-person" | "hybrid" | "unknown";

export type EventBrief = {
  title?: string;
  date?: string;
  format?: EventFormat;
  cost?: string;
  audience?: string;
  whyJoin?: string;
  whatAttendeesLearn?: string;
  whatAttendeesBuildOrDo?: string;
  reserveSpotCta?: string;
  venueOrLocation?: string;
  capacity?: number;
  guestListRaw?: string;
  vibe?: string;
};

export type PullupEvent = EventBrief & {
  id: string;
  hostConversationId: string;
  status: EventStatus;
  inviteDraft?: string;
  createdAt: string;
  updatedAt: string;
};

export type Guest = {
  id: string;
  eventId: string;
  name?: string;
  phone?: string;
  segment?: string;
  rsvpStatus: GuestStatus;
  sendStatus: GuestStatus;
  createdAt: string;
  updatedAt: string;
};

export type MessageLog = {
  id: string;
  eventId?: string;
  guestId?: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  channel: string;
  body: string;
  createdAt: string;
};

export type AgentName =
  | "Host Concierge"
  | "Event Strategist"
  | "Venue Scout"
  | "Invite Copy"
  | "Safety & Trust"
  | "RSVP Coordinator";

export type AgentTraceStep = {
  agent: AgentName;
  action: string;
};

export type OutboundInvite = {
  eventId: string;
  guestId: string;
  phone: string;
  text: string;
};

export type AgentResponse = {
  text: string;
  outboundInvites?: OutboundInvite[];
};

export type SendResultStatus = "sent" | "target_not_allowed" | "failed";
