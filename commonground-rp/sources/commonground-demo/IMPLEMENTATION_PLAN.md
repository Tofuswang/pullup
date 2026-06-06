# CommonGround Implementation Plan

## Summary

CommonGround is an agentic room recommender for designing the first hour. The product stack is split cleanly:

- **CommonGround / RoomTAIRA** decides who should meet, why, where, and what context they need.
- **Photon Spectrum** delivers the agent experience through iMessage, WhatsApp, Telegram, Slack, and other everyday channels.

This avoids reinventing messaging infrastructure while keeping CommonGround's edge in trust, taste, room formation, and feedback learning.

## RoomTAIRA Engine

RoomTAIRA is a TAIRA-inspired thought-augmented room recommender:

1. **Intent Interpreter**
   Converts vague user language and AI Passport signals into structured social goals.
2. **Thought Planner**
   Breaks the recommendation task into people, room, activity, venue, safety, and context-card subtasks.
3. **Candidate Retrieval Agents**
   Retrieve candidate users, activities, and venues from user-approved Passport embeddings and constraints.
4. **Room Formation Agent**
   Forms 3-5 person rooms based on reciprocal opt-in, conversation density, social energy fit, and minimum member comfort.
5. **Critic / Safety Agent**
   Checks boundary violations, privacy leakage, awkwardness risk, venue suitability, and hard safety constraints.
6. **Context Card Agent**
   Generates the privacy-safe explanation, shared context, warm-up prompts, and mutual-confirm payload.
7. **Feedback Distillation**
   Converts post-event vibe feedback into reusable learning signals for future recommendations.

Pitch line:

> CommonGround is not a static matching score. It is an agentic room recommender: it reasons through who should meet, why they would have something to talk about, where the meeting should happen, and what to change after feedback.

## Photon Spectrum Channel Layer

Use [Photon Spectrum](https://photon.codes/) instead of building custom channel integrations.

SDK setup:

```bash
npm install spectrum-ts
```

Responsibilities owned by Spectrum:

- iMessage / WhatsApp Business / terminal development / future custom-provider delivery
- unified `app.messages` stream
- `Space`, `Message`, `User`, and provider primitives
- iMessage typing indicators, reactions, threaded replies, group creation, chat renaming, contact cards, and content builders
- provider-specific platform narrowing when CommonGround needs iMessage-native behavior

Responsibilities owned by CommonGround:

- user verification and Passport import
- eligibility and safety gates
- room recommendation
- activity and venue recommendation
- Context Card content
- mutual-confirm decision logic
- vibe feedback learning
- message-state machine, human review policy, memory scope, and reliability pipeline

Payload boundary:

- Send to Spectrum: event title, time, venue, limited Context Card, warm-up prompts, mutual-confirm options.
- Do not send to Spectrum: raw AI conversations, unredacted Passport, private safety notes, internal scoring features, unnecessary dating-intent fields.

Spectrum runtime model:

```ts
import { Spectrum, poll } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";

const app = await Spectrum({
  projectId: process.env.PROJECT_ID,
  projectSecret: process.env.PROJECT_SECRET,
  providers: [imessage.config(), terminal.config()],
  telemetry: true,
});

for await (const [space, message] of app.messages) {
  await space.responding(async () => {
    // route through CommonGround onboarding state machine
    // call RoomTAIRA once user approves profile
    await space.send("Plain-language response here");
    await space.send(poll("Are you in?", "YES", "MAYBE", "SKIP"));
  });
}
```

See [PHOTON_SPECTRUM_INTEGRATION.md](./PHOTON_SPECTRUM_INTEGRATION.md) and [photon_agent_stub.ts](./photon_agent_stub.ts) for the product mapping and implementation stub.

## Photon-Native UX Decisions

- **Inbound-first invite**: user taps a prefilled iMessage link and sends `START`; avoid cold outbound iMessage.
- **Text-only first message**: no links or media before the user replies.
- **Contact card after first exchange**: help the user save CommonGround as a known contact.
- **Typing indicators**: use `space.responding(...)` while creating previews and Context Cards.
- **Tapbacks**: use reactions for lightweight acknowledgement after START, CONSENT, APPROVE, and YES.
- **Polls**: use Spectrum `poll(...)` for YES / MAYBE / SKIP when supported.
- **Threaded replies**: use `message.reply(...)` for clarifying a specific pasted input.
- **Group creation**: after mutual confirmation, create an iMessage group with the selected participants.
- **Group rename**: rename the event group to a room title like `CommonGround: Gallery + Tea`.

## Photon Reliability Rules

- Debounce message bursts before running RoomTAIRA.
- Cancel in-flight generation when the user sends a newer correction.
- Carry forward drained messages if a job is cancelled mid-generation.
- Use stable client GUIDs for multi-message sends to avoid duplicate iMessages on retry.
- Persist `startIndex` after each successful send.
- Scope memory by `resourceId = verified user address`; scope conversation history by `threadId = chat id`.
- Store job failures in an audit log with queue stage, payload pointer, and error.

## Updated Demo Flow

1. Photon Spectrum opens the iMessage onboarding flow.
2. User consents to using LinkedIn only as a verification/context handle.
3. User pastes LinkedIn URL, for example `https://www.linkedin.com/in/fu-syuan-wang-7719111a9/`.
4. User imports and redacts CommonGround Passport from their everyday AI.
5. User confirms explicit preferences that should never be inferred.
6. Claim NTU invite.
7. Verify identity and context.
8. Import and redact CommonGround Passport.
9. Eligibility Gate filters the pool.
10. RoomTAIRA interprets intent and plans recommender subtasks.
11. Candidate Retrieval finds plausible people, activities, and venues.
12. Reciprocal Matching estimates mutual opt-in.
13. Room Formation creates 3 candidate rooms.
14. Activity / Venue Recommendation selects feasible experiences.
15. Critic / Safety Agent checks boundary, safety, awkwardness, and privacy risks.
16. Multi-objective Re-ranking chooses top event plans.
17. Context Card Agent generates the privacy-safe explanation.
18. CommonGround hands the Context Card and confirmation poll to Photon Spectrum.
19. Spectrum delivers through iMessage first, with WhatsApp / Telegram / Slack fallback.
20. Vibe Feedback updates future room recommendations.

## First User Demo Boundary

The first user can be initialized from a consented LinkedIn URL such as `https://www.linkedin.com/in/fu-syuan-wang-7719111a9/`, but the product must not scrape or infer private details from LinkedIn. The URL is a verification/context handle only. Personality, taste, social energy, boundaries, and dating intent come from the user-approved AI Passport and explicit self input.

## User Data Workflow

The end-to-end workflow must be articulated as:

1. **Invitation Opening**
   The first message should create excitement and prestige: the user is part of a small invited first circle, not filling out a generic signup form. Do not list the whole onboarding checklist upfront.
2. **Consent**
   After the invitation moment, user explicitly consents in iMessage before any profile construction begins.
3. **Verify Real Person**
   User pastes LinkedIn URL. CommonGround uses it only to verify true-person identity and claimed professional context. It does not scrape LinkedIn for personality, interests, dating intent, or private facts.
4. **Generate AI Passport Outside CommonGround**
   User opens their everyday AI and asks it to summarize social energy, taste, conversation style, good first-meet settings, awkwardness triggers, and boundaries.
5. **Paste Into iMessage**
   User pastes the AI Passport into the Photon-powered iMessage flow.
6. **Redact**
   User deletes sensitive or unwanted content before CommonGround converts anything into matching signals.
7. **Enter Explicit Preferences**
   User directly provides intent, availability, budget, location radius, alcohol comfort, preferred group size, and contact-exchange boundaries.
8. **Normalize**
   CommonGround converts only approved AI Passport text + explicit self input into structured fields: `social_energy`, `conversation_style`, `taste_clusters`, `conversation_topics`, `awkwardness_triggers`, `dating_intent`, `availability`, `budget_range`, `location_radius`, `alcohol_comfort`, `preferred_group_size`, and `boundaries`.
9. **Confirm**
   User previews and approves the limited matching profile in plain language. The user should not see JSON, internal scores, embeddings, or model fields unless they explicitly request export/debug mode.
10. **Recommend**
   RoomTAIRA uses the confirmed matching profile to form rooms and generate Context Cards.
11. **Share Minimal Context**
   Other users see only the privacy-safe Context Card. They do not see LinkedIn URL, raw AI Passport, dating intent, contact info, or internal scores.

One-line pitch:

> LinkedIn proves you are real. AI Passport explains what kind of first meeting feels natural. Self input sets consent, logistics, and boundaries.

User-facing rule:

> Users see warm plain-language summaries and simple actions like `APPROVE`, `EDIT`, `YES`, `MAYBE`, and `SKIP`. JSON is internal infrastructure, not user experience.

Opening copy:

> You are one of a small first circle invited to CommonGround: a private NTU-origin room network for meeting thoughtful people offline. We do not do swiping. We design a room worth showing up for.

## Judge Answer

For MVP, we use RoomTAIRA, a TAIRA-inspired thought-augmented room recommender. It interprets fuzzy social intent and decomposes it into people retrieval, reciprocal matching, room formation, activity selection, venue constraints, safety critique, and Context Card generation. We do not build the channel layer ourselves: Photon Spectrum delivers the agent experience through iMessage and other everyday channels with message history, audit logs, and human-in-the-loop controls. The feedback layer follows contextual-bandit logic to balance repeating proven vibes with exploring adjacent ones.
