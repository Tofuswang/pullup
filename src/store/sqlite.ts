import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type {
  AgentTraceStep,
  EventBrief,
  EventFormat,
  EventStatus,
  Guest,
  GuestStatus,
  MessageLog,
  PullupEvent,
  SendResultStatus,
} from "../domain";

type EventRow = {
  id: string;
  host_conversation_id: string;
  status: EventStatus;
  title: string | null;
  date: string | null;
  format: EventFormat | null;
  cost: string | null;
  audience: string | null;
  why_join: string | null;
  what_attendees_learn: string | null;
  what_attendees_build_or_do: string | null;
  reserve_spot_cta: string | null;
  venue_or_location: string | null;
  capacity: number | null;
  guest_list_raw: string | null;
  vibe: string | null;
  invite_draft: string | null;
  created_at: string;
  updated_at: string;
};

type GuestRow = {
  id: string;
  event_id: string;
  name: string | null;
  phone: string | null;
  segment: string | null;
  rsvp_status: GuestStatus;
  send_status: GuestStatus;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  event_id: string | null;
  guest_id: string | null;
  conversation_id: string;
  direction: "inbound" | "outbound";
  channel: string;
  body: string;
  created_at: string;
};

export class PullupStore {
  private readonly db: Database;

  constructor(path = process.env.PULLUP_DB_PATH ?? "./data/pullup.sqlite") {
    if (path !== ":memory:") {
      mkdirSync(dirname(path), { recursive: true });
    }

    this.db = new Database(path);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.migrate();
  }

  close(): void {
    this.db.close();
  }

  resetForTesting(): void {
    this.db.exec(`
      DELETE FROM agent_tasks;
      DELETE FROM approvals;
      DELETE FROM messages;
      DELETE FROM guests;
      DELETE FROM events;
    `);
  }

  getOrCreateDraftEvent(hostConversationId: string): PullupEvent {
    const existing = this.getActiveEventForHost(hostConversationId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    this.db
      .query(
        `INSERT INTO events (id, host_conversation_id, status, created_at, updated_at)
         VALUES (?, ?, 'draft', ?, ?)`,
      )
      .run(id, hostConversationId, now, now);

    return this.getEvent(id)!;
  }

  getActiveEventForHost(hostConversationId: string): PullupEvent | undefined {
    const row = this.db
      .query(
        `SELECT * FROM events
         WHERE host_conversation_id = ?
           AND status NOT IN ('completed', 'cancelled')
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(hostConversationId) as EventRow | undefined;
    return row ? mapEvent(row) : undefined;
  }

  getEvent(id: string): PullupEvent | undefined {
    const row = this.db.query("SELECT * FROM events WHERE id = ?").get(id) as
      | EventRow
      | undefined;
    return row ? mapEvent(row) : undefined;
  }

  getLatestEvent(): PullupEvent | undefined {
    const row = this.db
      .query("SELECT * FROM events ORDER BY created_at DESC LIMIT 1")
      .get() as EventRow | undefined;
    return row ? mapEvent(row) : undefined;
  }

  updateEvent(id: string, brief: Partial<EventBrief> & { status?: EventStatus; inviteDraft?: string }): PullupEvent {
    const current = this.getEvent(id);
    if (!current) throw new Error(`Event not found: ${id}`);

    const next = { ...current, ...brief };
    const updatedAt = new Date().toISOString();
    this.db
      .query(
        `UPDATE events SET
          status = ?,
          title = ?,
          date = ?,
          format = ?,
          cost = ?,
          audience = ?,
          why_join = ?,
          what_attendees_learn = ?,
          what_attendees_build_or_do = ?,
          reserve_spot_cta = ?,
          venue_or_location = ?,
          capacity = ?,
          guest_list_raw = ?,
          vibe = ?,
          invite_draft = ?,
          updated_at = ?
         WHERE id = ?`,
      )
      .run(
        next.status,
        next.title ?? null,
        next.date ?? null,
        next.format ?? null,
        next.cost ?? null,
        next.audience ?? null,
        next.whyJoin ?? null,
        next.whatAttendeesLearn ?? null,
        next.whatAttendeesBuildOrDo ?? null,
        next.reserveSpotCta ?? null,
        next.venueOrLocation ?? null,
        next.capacity ?? null,
        next.guestListRaw ?? null,
        next.vibe ?? null,
        next.inviteDraft ?? null,
        updatedAt,
        id,
      );

    return this.getEvent(id)!;
  }

  replaceGuests(eventId: string, guests: Array<{ name?: string; phone?: string; segment?: string }>): Guest[] {
    this.db.query("DELETE FROM guests WHERE event_id = ?").run(eventId);
    const now = new Date().toISOString();
    const insert = this.db.query(
      `INSERT INTO guests (id, event_id, name, phone, segment, rsvp_status, send_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'not_invited', 'not_invited', ?, ?)`,
    );

    for (const guest of guests) {
      insert.run(
        crypto.randomUUID(),
        eventId,
        guest.name ?? null,
        guest.phone ?? null,
        guest.segment ?? null,
        now,
        now,
      );
    }

    return this.listGuests(eventId);
  }

  listGuests(eventId: string): Guest[] {
    const rows = this.db
      .query("SELECT * FROM guests WHERE event_id = ? ORDER BY created_at ASC")
      .all(eventId) as GuestRow[];
    return rows.map(mapGuest);
  }

  findGuestByPhone(phone: string): Guest | undefined {
    const row = this.db
      .query(
        `SELECT * FROM guests
         WHERE phone = ?
           AND rsvp_status != 'opted_out'
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(phone) as GuestRow | undefined;
    return row ? mapGuest(row) : undefined;
  }

  updateGuestStatus(guestId: string, statuses: Partial<Pick<Guest, "rsvpStatus" | "sendStatus">>): Guest {
    const current = this.db.query("SELECT * FROM guests WHERE id = ?").get(guestId) as
      | GuestRow
      | undefined;
    if (!current) throw new Error(`Guest not found: ${guestId}`);

    this.db
      .query(
        `UPDATE guests SET rsvp_status = ?, send_status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        statuses.rsvpStatus ?? current.rsvp_status,
        statuses.sendStatus ?? current.send_status,
        new Date().toISOString(),
        guestId,
      );

    const updated = this.db.query("SELECT * FROM guests WHERE id = ?").get(guestId) as GuestRow;
    return mapGuest(updated);
  }

  approveEvent(eventId: string): PullupEvent {
    const now = new Date().toISOString();
    this.db
      .query("INSERT INTO approvals (id, event_id, status, created_at) VALUES (?, ?, 'approved', ?)")
      .run(crypto.randomUUID(), eventId, now);
    return this.updateEvent(eventId, { status: "approved" });
  }

  logMessage(input: {
    eventId?: string;
    guestId?: string;
    conversationId: string;
    direction: "inbound" | "outbound";
    channel: string;
    body: string;
  }): void {
    this.db
      .query(
        `INSERT INTO messages
          (id, event_id, guest_id, conversation_id, direction, channel, body, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        crypto.randomUUID(),
        input.eventId ?? null,
        input.guestId ?? null,
        input.conversationId,
        input.direction,
        input.channel,
        input.body,
        new Date().toISOString(),
      );
  }

  listRecentMessages(eventId: string, limit = 10): MessageLog[] {
    const rows = this.db
      .query(
        `SELECT * FROM messages
         WHERE event_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(eventId, limit) as MessageRow[];

    return rows.reverse().map(mapMessage);
  }

  logAgentTask(input: {
    eventId?: string;
    agent: string;
    status: "completed" | "failed" | "needs_human";
    input: unknown;
    output?: unknown;
  }): void {
    this.db
      .query(
        `INSERT INTO agent_tasks (id, event_id, agent, status, input_json, output_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        crypto.randomUUID(),
        input.eventId ?? null,
        input.agent,
        input.status,
        JSON.stringify(input.input),
        JSON.stringify(input.output ?? null),
        new Date().toISOString(),
      );
  }

  markInviteSendResult(guestId: string, status: SendResultStatus): Guest {
    if (status === "sent") {
      return this.updateGuestStatus(guestId, {
        sendStatus: "invited",
        rsvpStatus: "invited",
      });
    }

    return this.updateGuestStatus(guestId, {
      rsvpStatus: status === "target_not_allowed" ? "send_failed_target_not_allowed" : "needs_human",
      sendStatus: status === "target_not_allowed" ? "send_failed_target_not_allowed" : "needs_human",
    });
  }

  logOutboundInvite(input: {
    eventId: string;
    guestId: string;
    phone: string;
    body: string;
    channel: string;
  }): void {
    this.logMessage({
      eventId: input.eventId,
      guestId: input.guestId,
      conversationId: input.phone,
      direction: "outbound",
      channel: input.channel,
      body: input.body,
    });
  }

  rsvpSummary(eventId: string): Record<GuestStatus, number> {
    const summary = emptyGuestSummary();
    for (const guest of this.listGuests(eventId)) {
      summary[guest.rsvpStatus] += 1;
    }
    return summary;
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        host_conversation_id TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT,
        date TEXT,
        format TEXT,
        cost TEXT,
        audience TEXT,
        why_join TEXT,
        what_attendees_learn TEXT,
        what_attendees_build_or_do TEXT,
        reserve_spot_cta TEXT,
        venue_or_location TEXT,
        capacity INTEGER,
        guest_list_raw TEXT,
        vibe TEXT,
        invite_draft TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name TEXT,
        phone TEXT,
        segment TEXT,
        rsvp_status TEXT NOT NULL,
        send_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        guest_id TEXT REFERENCES guests(id) ON DELETE SET NULL,
        conversation_id TEXT NOT NULL,
        direction TEXT NOT NULL,
        channel TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agent_tasks (
        id TEXT PRIMARY KEY,
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        agent TEXT NOT NULL,
        status TEXT NOT NULL,
        input_json TEXT NOT NULL,
        output_json TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }
}

function mapEvent(row: EventRow): PullupEvent {
  return {
    id: row.id,
    hostConversationId: row.host_conversation_id,
    status: row.status,
    title: row.title ?? undefined,
    date: row.date ?? undefined,
    format: row.format ?? undefined,
    cost: row.cost ?? undefined,
    audience: row.audience ?? undefined,
    whyJoin: row.why_join ?? undefined,
    whatAttendeesLearn: row.what_attendees_learn ?? undefined,
    whatAttendeesBuildOrDo: row.what_attendees_build_or_do ?? undefined,
    reserveSpotCta: row.reserve_spot_cta ?? undefined,
    venueOrLocation: row.venue_or_location ?? undefined,
    capacity: row.capacity ?? undefined,
    guestListRaw: row.guest_list_raw ?? undefined,
    vibe: row.vibe ?? undefined,
    inviteDraft: row.invite_draft ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name ?? undefined,
    phone: row.phone ?? undefined,
    segment: row.segment ?? undefined,
    rsvpStatus: row.rsvp_status,
    sendStatus: row.send_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): MessageLog {
  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    guestId: row.guest_id ?? undefined,
    conversationId: row.conversation_id,
    direction: row.direction,
    channel: row.channel,
    body: row.body,
    createdAt: row.created_at,
  };
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
