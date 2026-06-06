# Photon Spectrum Integration For CommonGround

## Why Spectrum

CommonGround should run as one agent server and let Photon Spectrum own the interface layer. Spectrum's model is exactly the product boundary we want:

- **Spectrum providers** connect native interfaces such as iMessage, WhatsApp Business, terminal development, and future custom platforms.
- **CommonGround / RoomTAIRA** owns product behavior: onboarding, consent, profile construction, room recommendation, safety, Context Cards, mutual confirmation, and feedback learning.

This follows Spectrum's core model: every provider feeds one `app.messages` stream, where each incoming item is a `[Space, Message]` tuple. `Space` is the conversation context, `Message` is the incoming user content, `User` is the participant, and providers translate platform-specific interfaces into Spectrum's unified API.

Sources:
- Spectrum introduction: https://photon.codes/docs/spectrum-ts/introduction
- Getting started and primitives: https://photon.codes/docs/spectrum-ts/getting-started

## Install

```bash
npm install spectrum-ts
```

Use TypeScript 5+.

## Provider Strategy

### Demo

Use:

- `terminal` provider for local CLI testing.
- `imessage` provider when Photon project credentials and managed iMessage line are available.

### Production MVP

Use:

- `imessage.config()` in cloud mode as the primary provider.
- WhatsApp Business as a future fallback.
- Custom providers later for app/web surfaces if needed.

The iMessage provider supports cloud, local, and dedicated modes. Cloud mode connects to managed iMessage infrastructure and supports send/receive, typing, reactions, replies, and group creation. Local mode is useful for development on a Mac but only supports text and attachments. Dedicated/business mode matters later for one consistent number and per-line routing.

Sources:
- iMessage provider: https://photon.codes/docs/spectrum-ts/providers/imessage
- Platform narrowing: https://photon.codes/docs/spectrum-ts/platform-narrowing

## CommonGround Agent Loop

CommonGround should process Spectrum messages like this:

1. Receive `[space, message]` from `app.messages`.
2. Ignore self-sent messages.
3. Narrow `message.content.type`.
4. Debounce bursts so the user can text naturally.
5. Load per-person memory by verified address and per-thread state by chat id.
6. Route the turn through the onboarding state machine.
7. Call RoomTAIRA only after user-approved profile inputs exist.
8. Use `space.responding(...)` while generating profile previews or Context Cards.
9. Send plain-language user messages with `space.send(...)`.
10. Use polls for YES / MAYBE / SKIP when supported; text fallback otherwise.

## Onboarding State Machine

Use one state per user/thread:

```text
invited
consented
linkedin_received
passport_received
passport_approved
preferences_received
profile_approved
room_recommended
mutual_confirm_pending
event_confirmed
feedback_collected
```

State rules:

- LinkedIn URL is used for true-person verification only.
- AI Passport text is used only after user redaction and approval.
- Explicit preferences capture what should never be inferred.
- Users see plain-language previews, never JSON or internal scores.
- Other users see only the Context Card.

## iMessage-Native Features To Use

Use these Spectrum/iMessage capabilities because they improve the product:

- **Typing indicators**: `space.responding(...)` while the agent is thinking.
- **Tapbacks/reactions**: acknowledge START, CONSENT, APPROVE, and YES without extra text noise.
- **Threaded replies**: attach clarifying questions to the relevant user message.
- **Polls**: use Spectrum `poll(...)` for YES / MAYBE / SKIP, with text fallback.
- **Group creation**: once enough participants mutually confirm, create an iMessage group using narrowed iMessage `space(...)`.
- **Group rename**: rename the group to the room title, such as `CommonGround: Gallery + Tea`.
- **Contact card**: share the CommonGround contact card after the first exchange so users can save the line.

Avoid mini-app cards for hackathon MVP. They require an iMessage extension bundle/team/app configuration and add implementation risk.

Sources:
- Content builders: https://photon.codes/docs/spectrum-ts/content
- Reactions and replies: https://photon.codes/docs/spectrum-ts/reactions-and-replies
- iMessage provider features: https://photon.codes/docs/spectrum-ts/providers/imessage

## Deliverability Rules

Design CommonGround as **inbound-first**:

- The user taps a prefilled iMessage link and sends `START`.
- Do not cold-message people first.
- First message should be text-only. No links or media before the user replies.
- Send a contact card after the first exchange.
- Cap non-responder followups at 2-3, spaced across days.
- Avoid bursty sends and off-hours pings.
- Track per-server and per-line usage; stop assigning new users near 70-80% utilization.

Source:
- iMessage deliverability: https://photon.codes/docs/best-practices/imessage-deliverability

## Reliability / Production Pipeline

Do not implement the Spectrum handler as `receive -> LLM -> send` in one synchronous block. Follow Photon's production pattern:

1. **Enqueue inbound message**
   Store message id, space id, sender id, provider, content type, and received timestamp.
2. **Debounce**
   Wait a few seconds for message bursts to settle.
3. **Batch handler**
   Drain queued messages inside the handler, not the enqueuer.
4. **Carry-forward**
   If a job is cancelled after draining, store drained messages for the next batch.
5. **Generate**
   Run onboarding logic or RoomTAIRA.
6. **Human review gate**
   Pause before sending when content is safety-sensitive, verification is unclear, or privacy risk is detected.
7. **Send**
   Use stable `clientGuid` values for each outbound message.
8. **Resume**
   Persist `startIndex` after each successful send.
9. **Audit**
   Store job failures with stage, payload pointer, and error.

Memory scope:

- `resourceId = verified user address`
- `threadId = chat id`

That lets the agent remember the person across DMs/groups while keeping each conversation thread separate.

Sources:
- Architecture: https://photon.codes/docs/best-practices/architecture
- Inbound pipeline: https://photon.codes/docs/best-practices/inbound-pipeline
- Recovery and state: https://photon.codes/docs/best-practices/recovery-and-state

## Product Boundary

Send to Spectrum:

- Plain-language onboarding messages
- Consent prompts
- Profile previews
- Context Cards
- YES / MAYBE / SKIP confirmation polls
- Event group messages
- Vibe feedback prompts

Do not send to Spectrum unless necessary:

- Raw AI conversation history
- Unredacted AI Passport after approval is complete
- Internal scores or embeddings
- Private safety notes
- LinkedIn-derived scraped facts

## Demo Claim

Say this:

> CommonGround runs as a Spectrum agent server. Spectrum gives us iMessage-native delivery, spaces, users, messages, reactions, polls, group creation, typing indicators, and production patterns for deliverability and recovery. CommonGround uses that layer to run a consent-first onboarding and RoomTAIRA room recommendation flow.

Do not say:

> We built iMessage from scratch.
