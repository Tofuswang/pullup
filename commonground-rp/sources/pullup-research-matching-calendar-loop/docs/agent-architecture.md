# pullup Agent Architecture

pullup is not a general chatbot. It is a conversational event activation system:
people text pullup, pullup turns a loose idea into a real gathering, then helps
the host or brand get the right people to show up.

The product has a 2C surface and a 2B business model:

- Consumer surface: "text pullup and it helps you get people together."
- Business buyer: "use pullup to activate an audience, drive turnout, and learn
  what worked."

This means the agent system must be good at social nuance, but it also needs
operational discipline: statuses, approvals, reminders, analytics, and audit
logs.

## Design Principle

Use one orchestrator and a small set of specialist agents. Do not make every
capability an autonomous agent at first. Each specialist should have:

- A narrow job
- Structured inputs
- Structured outputs
- Clear handoff points
- A human-review escape hatch

The early product should feel magical to the user, but internally it should
behave like a debuggable workflow.

## The Agent Team

### 1. Host Concierge Agent

The Host Concierge is the front door. It talks to the person or marketer trying
to create a gathering.

Responsibilities:

- Understand what the host wants to make happen.
- Ask the minimum useful follow-up questions.
- Decide whether this is a personal plan, brand event, community meetup, date,
  dinner, launch, office hours, or recurring series.
- Keep the conversation moving without sounding like a form.
- Summarize the event brief before work starts.

Inputs:

- Incoming user message
- Current conversation state
- Known host or brand profile
- Existing event draft, if any

Outputs:

- Event brief
- Missing-fields list
- Next question to ask
- Suggested handoff to another agent

Example:

```text
User: help me get 20 founders to a dinner next thursday
Host Concierge:
  intent: create_event
  event_type: dinner
  audience: founders
  target_size: 20
  missing: city, venue, vibe, invite list
  next: "Got it. What city, and do you already have a venue?"
```

MVP status: build first. This is the current `runPullupAgent()` role.

### 2. Event Strategist Agent

The Event Strategist turns a rough idea into a plan that can actually work.
This is especially important for B2B customers, because they care about
campaign goals, audience quality, and show-up rate.

Responsibilities:

- Convert the host brief into a concrete event concept.
- Choose the event shape: dinner, salon, demo night, waitlist meetup, launch
  party, customer roundtable, creator drop, campus activation.
- Identify the target audience and success metric.
- Recommend timing, capacity, format, and CTA.
- Flag if the plan is too vague or unlikely to drive turnout.

Inputs:

- Event brief from Host Concierge
- Brand or campaign goals
- Audience segment
- Historical event data, when available

Outputs:

- Event strategy
- Suggested audience segment
- Recommended capacity
- Success metric
- Risks and assumptions

Example outputs:

```json
{
  "eventType": "founder_dinner",
  "goal": "warm pipeline and community trust",
  "targetAudience": "seed-stage founders in NYC",
  "capacity": 18,
  "primaryMetric": "qualified_attendees",
  "risk": "audience is too broad unless filtered by stage or topic"
}
```

MVP status: lightweight heuristic + LLM. Do not overbuild.

### 3. Invite Copy Agent

The Invite Copy Agent writes messages that feel native to the channel. This is
where pullup earns the 2C outer shell: the invite should feel like a good text,
not a marketing email compressed into SMS.

Responsibilities:

- Draft invite copy for iMessage/SMS/WhatsApp.
- Adapt tone for friend, creator, brand, or community host.
- Produce short variants for A/B tests.
- Keep messages consent-aware and not spammy.
- Write follow-up reminders and post-event messages.

Inputs:

- Event strategy
- Host tone
- Audience segment
- Channel constraints
- Required brand language

Outputs:

- Initial invite
- RSVP follow-up
- Reminder sequence
- Waitlist message
- Decline/no-response message
- Post-event follow-up

Example:

```text
Initial invite:
Hey - we're pulling together a small founder dinner next Thu in SF.
18 people, no panels, just sharp operators comparing notes on distribution.
Want me to save you a seat?
```

MVP status: build early. This creates the product's voice.

### 4. Guest List Agent

The Guest List Agent decides who should be invited and why. In the consumer
case, it may work from names in a text. In the B2B case, it works from audience
segments, CRM exports, waitlists, community lists, or manually uploaded leads.

Responsibilities:

- Parse names, phone numbers, handles, or uploaded audience lists.
- Segment guests by fit, priority, and risk.
- Recommend who to invite first.
- Avoid inviting duplicates or blocked contacts.
- Keep consent and opt-out state attached to each person.

Inputs:

- Raw guest text or list
- CRM/community fields
- Past RSVP and attendance history
- Brand rules
- Opt-in/opt-out records

Outputs:

- Clean guest records
- Invite priority
- Audience segment labels
- Suppression list
- Missing contact info

Example fields:

```json
{
  "guestId": "guest_123",
  "name": "Ari",
  "phone": "+15551234567",
  "segment": "seed_founder",
  "priority": "high",
  "consentStatus": "opted_in",
  "lastInteraction": "attended_2026_05_demo_night"
}
```

MVP status: start manual or CSV-like. Full CRM integrations can wait.

### 5. RSVP Coordinator Agent

The RSVP Coordinator runs the live conversation after invites go out. Its job
is not just to collect yes/no. Its job is to turn interest into commitment.

Responsibilities:

- Send invites to selected guests.
- Interpret replies: yes, maybe, no, question, complaint, unsubscribe.
- Ask follow-up questions when needed.
- Maintain RSVP status.
- Move people from interested to confirmed.
- Handle waitlist promotion.
- Respect opt-out immediately.

Inputs:

- Outbound invite campaign
- Incoming guest replies
- Event capacity
- Waitlist rules
- Consent records

Outputs:

- RSVP status changes
- Guest questions requiring answer
- Confirmed attendee list
- Waitlist list
- Opt-out events
- Escalations to human operator

Core statuses:

```text
not_invited
invited
opened_or_seen
interested
confirmed
declined
waitlisted
cancelled
no_response
opted_out
needs_human
```

MVP status: build after Host Concierge and Invite Copy. This is where the
product starts becoming useful to brands.

### 6. Logistics Agent

The Logistics Agent handles all practical details that make the event feel real:
time, location, capacity, calendar, reminders, arrival instructions, and
changes.

Responsibilities:

- Ask for date, time, location, capacity, and arrival details.
- Generate event summary and guest-facing details.
- Send calendar links or rich links when supported.
- Schedule reminders.
- Handle changes and cancellations.
- Make sure guests know where to go and what to expect.

Inputs:

- Event plan
- Venue/location
- Host constraints
- Confirmed guest list
- Reminder policy

Outputs:

- Event details object
- Reminder schedule
- Guest-facing logistics copy
- Change notifications

MVP status: build a simple version early. Perfect calendar integrations can
wait, but reminders cannot.

### 7. Safety and Trust Agent

The Safety and Trust Agent is a policy layer. It does not own the conversation;
it reviews risky content, guest behavior, and outbound messaging before damage
happens.

Responsibilities:

- Detect harassment, spam, scams, unsafe events, or inappropriate requests.
- Enforce opt-out and consent rules.
- Flag sensitive events for human review.
- Prevent overly aggressive reminder sequences.
- Keep brand and user trust intact.

Inputs:

- Incoming and outgoing messages
- Event type
- Guest reports
- Opt-out state
- Brand rules

Outputs:

- allow
- block
- rewrite_suggestion
- needs_human
- reason

MVP status: required before sending real outbound campaigns. Keep simple but
explicit.

### 8. Brand Success Agent

The Brand Success Agent serves the paying customer. It explains what happened,
what worked, and what to do next.

Responsibilities:

- Summarize campaign performance.
- Report funnel metrics: invited, replied, confirmed, attended, no-show.
- Identify which segments performed best.
- Recommend the next event or follow-up campaign.
- Generate a brand-facing recap.

Inputs:

- Event lifecycle data
- RSVP and attendance data
- Guest segments
- Post-event feedback

Outputs:

- Event report
- Segment insights
- Recommended follow-up
- Suggested next campaign

Example:

```text
37 invited, 21 replied, 14 confirmed, 11 showed.
Seed founders replied best. Operators showed higher intent but needed more
notice. Next time, invite 7 days earlier and lead with the distribution angle.
```

MVP status: not first, but essential for B2B retention.

### 9. Human Operator Agent

This is not a model. It is the operational handoff surface for you or the
customer's team.

Responsibilities:

- Review risky messages.
- Approve guest lists.
- Edit invite copy before launch.
- Answer guest questions the AI cannot answer.
- Override status, capacity, or event details.

Inputs:

- Escalations from other agents
- Pending approvals
- Event dashboard state

Outputs:

- approve
- reject
- edit
- send_as_host
- mark_resolved

MVP status: required, even if it is just a local admin log or manual console at
first. Early agent products need human supervision.

## Recommended MVP Agent Set

Do not build all nine agents immediately. For the next prototype, build this:

1. Host Concierge Agent
2. Event Strategist Agent
3. Invite Copy Agent
4. RSVP Coordinator Agent
5. Safety and Trust Agent

Keep Guest List and Logistics as simple functions at first. Brand Success can be
a report template. Human Operator can be manual review in logs.

The first real demo should prove:

```text
Host texts pullup
→ pullup gathers event intent
→ pullup drafts an invite
→ host approves
→ pullup sends to test guests
→ guests reply
→ pullup tracks RSVP state
→ host receives a simple turnout summary
```

## Workflow

### Create Event

```text
Incoming message
→ Host Concierge
→ Event Strategist
→ Invite Copy
→ Safety and Trust
→ Host approval
→ Event draft saved
```

### Launch Invite

```text
Host approval
→ Guest List
→ Safety and Trust
→ RSVP Coordinator
→ Spectrum send
→ RSVP statuses created
```

### Handle Guest Reply

```text
Incoming guest message
→ Safety and Trust
→ RSVP Coordinator
→ Logistics, if the guest needs details
→ Human Operator, if ambiguous or risky
→ Spectrum send reply
```

### Post Event

```text
Event ends
→ RSVP Coordinator finalizes attendance/no-show
→ Brand Success creates recap
→ Invite Copy drafts follow-up
→ Host approves
→ Spectrum sends follow-up
```

## Shared Data Objects

### Event

```ts
type Event = {
  id: string;
  hostId: string;
  brandId?: string;
  title: string;
  type: "dinner" | "meetup" | "launch" | "party" | "office_hours" | "other";
  goal?: string;
  audience?: string;
  vibe?: string;
  startsAt?: string;
  location?: string;
  capacity?: number;
  status:
    | "draft"
    | "needs_approval"
    | "approved"
    | "inviting"
    | "live"
    | "completed"
    | "cancelled";
};
```

### Guest

```ts
type Guest = {
  id: string;
  name?: string;
  phone?: string;
  segment?: string;
  consentStatus: "unknown" | "opted_in" | "opted_out";
  rsvpStatus:
    | "not_invited"
    | "invited"
    | "interested"
    | "confirmed"
    | "declined"
    | "waitlisted"
    | "cancelled"
    | "no_response"
    | "needs_human";
};
```

### AgentTask

```ts
type AgentTask = {
  id: string;
  eventId?: string;
  agent:
    | "host_concierge"
    | "event_strategist"
    | "invite_copy"
    | "guest_list"
    | "rsvp_coordinator"
    | "logistics"
    | "safety_trust"
    | "brand_success"
    | "human_operator";
  status: "pending" | "running" | "completed" | "failed" | "needs_human";
  input: unknown;
  output?: unknown;
  error?: string;
};
```

## What Each Agent Must Not Do

- Host Concierge must not send bulk invites directly.
- Invite Copy must not decide who is safe to contact.
- RSVP Coordinator must not ignore opt-out requests.
- Event Strategist must not invent confirmed logistics.
- Brand Success must not claim attendance unless attendance was measured.
- Safety and Trust must not silently rewrite high-risk messages without a log.

These boundaries matter because a messaging product can quickly become spammy or
creepy if every agent can do everything.

## Implementation Shape

Start with one process:

```text
Spectrum provider
→ message adapter
→ orchestrator
→ specialist function calls
→ state store
→ response
```

Early code modules:

```text
src/agent/orchestrator.ts
src/agent/host-concierge.ts
src/agent/event-strategist.ts
src/agent/invite-copy.ts
src/agent/rsvp-coordinator.ts
src/agent/safety-trust.ts
src/store/memory.ts
src/domain/event.ts
src/domain/guest.ts
```

Do not introduce queues, CRM integrations, or a dashboard until the TUI can
simulate a full event lifecycle.

## Next Build Milestones

### Milestone 1: TUI Event Lifecycle

Use the Terminal provider to simulate:

- Host creates an event.
- Agent drafts invite copy.
- Host approves.
- Fake guests reply yes/no/maybe.
- Agent reports RSVP state.

No real iMessage required.

### Milestone 2: iMessage Smoke Test

After iMessage reply works:

- Run the same Host Concierge through Spectrum iMessage.
- Send to one test number.
- Confirm inbound reply updates RSVP state.
- Keep a manual kill switch.

### Milestone 3: Brand Pilot

For one friendly brand/customer:

- Import a small opted-in list manually.
- Human approves every outbound message.
- Run one event.
- Produce a recap.

This is enough to learn whether pullup is a product or just a nice demo.
