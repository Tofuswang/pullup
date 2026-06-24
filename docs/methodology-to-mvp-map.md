# Methodology To MVP Map

This document translates the CommonGround research/methodology story into the
current GitHub implementation. It is intentionally explicit about what is real
MVP code today and what remains future native, ML, or ops work.

## Current Position

CommonGround is currently implemented as an iMessage-first demo inside the
Spectrum agent. The MVP simulates a trustworthy room recommender honestly:

- deterministic onboarding state machine
- LinkedIn URL as a consented verification handle
- AI Passport as user-approved matching input
- first-pass profile parsing and heuristic recommendation
- demo candidate pool
- Context Card generation
- local iOS Calendar / Maps handoff
- vibe feedback framing

It does not claim to run trained ML models, scrape LinkedIn, read local iPhone
data directly, or fully automate trust and safety.

## Methodology Mapping

| Methodology Claim | MVP Implementation | Current File(s) | Not Yet Real |
| --- | --- | --- | --- |
| Invite-only prestige funnel | `START` opens with first-circle CommonGround framing | `src/commonground.ts` | Real invite-code validation and NTU eligibility database |
| Consent before data collection | `CONSENT` step explains LinkedIn, AI Passport, and explicit preferences | `src/commonground.ts` | Persisted consent records and revocation UI |
| LinkedIn as true-person verification only | Accepts LinkedIn URL and stores it in conversation state | `src/commonground.ts` | LinkedIn API verification, identity document checks, alumni email verification |
| No LinkedIn scraping | Copy says LinkedIn is not scraped or used for matching facts | `src/commonground.ts` | Automated compliance/audit logging |
| AI Passport as user-approved memory summary | User pastes app-safe AI summary; app previews/redacts before approval | `src/commonground.ts` | Rich Passport editor UI and persistent member profile table |
| Convert Passport into social taste signals | Keyword parser extracts interests, values, social modes, boundaries, energy, and intent | `src/commonground_recommender.ts` | Embedding generation, vector retrieval, trained representation learning |
| Reciprocal / group-native recommendation | Demo recommender scores dyadic chemistry, group dynamics, experience fit, and first-meeting quality | `src/commonground_recommender.ts` | Real reciprocal opt-in model, learned group recommender, fairness constraints |
| Recommend a room, not a person | Context Card outputs people + activity + venue + shared context + prompts | `src/commonground.ts`, `src/commonground_recommender.ts` | Multiple weekly candidate rooms and human review queue |
| Activity chosen by interaction mechanics | Coffee/matcha with structured prompts is selected as the low-pressure container | `src/commonground_recommender.ts` | Activity inventory, venue/activity supply ranking, novelty control |
| Safety and privacy as hard gates | Copy enforces public-first, no forced contact exchange, and private safety review | `src/commonground.ts` | Real safety incident tooling, member trust score, moderation dashboard |
| Local iOS scheduling | User shares free windows from iPhone Calendar; app creates an iPhone Calendar-ready message card; native package can write confirmed events through EventKit write-only access | `src/commonground.ts`, `src/ios.ts`, `src/calendar.ts`, `ios/PullupCalendar/Sources/PullupCalendar/EventKitCalendarWriter.swift` | Full-access EventKit free/busy reading and complete iOS app UI |
| Apple Maps handoff | Generates Apple Maps URL for venue planning | `src/ios.ts` | Native MapKit venue picker, live ETA, travel-time ranking |
| iPhone location status | Copy asks user to share live/current location in Messages or text arrival status | `docs/ios-local-integrations.md`, `src/ios.ts` | Native CoreLocation permission and arrival detection |
| iPhone Contacts handoff | Copy asks user to share a contact card/phone/email explicitly | `docs/ios-local-integrations.md`, `src/ios.ts` | Native Contacts picker and invite-only selected contacts |
| Vibe feedback, not rating people | Post-room prompt asks what to tune, not who to rate | `src/commonground.ts` | Feedback persistence, bandit learning, reliability updates |

## What Is Real Code Today

### Onboarding

Implemented:

- `START`
- `CONSENT`
- LinkedIn URL validation
- AI Passport intake
- redaction/approval loop
- explicit preferences intake

Main files:

- `src/commonground.ts`
- `src/agent.ts`

### Recommendation

Implemented:

- profile parsing from Passport + preferences
- candidate person pool
- heuristic room scoring
- Context Card output
- scoring explanation

Main file:

- `src/commonground_recommender.ts`

### Scheduling And iOS Handoff

Implemented:

- user-shared availability windows
- mutual slot parsing when multiple people are labeled
- Calendar-ready text card
- Apple Maps URL

Main files:

- `src/commonground.ts`
- `src/commonground_recommender.ts`
- `src/ios.ts`
- `src/calendar.ts`

### Feedback

Implemented:

- post-room vibe feedback prompt
- copy frames feedback as preference tuning

Main file:

- `src/commonground.ts`

## What Is Explicitly Not Implemented Yet

### Native iOS

Not yet implemented:

- full-access EventKit free/busy prompt
- complete native iOS scheduling UI
- CoreLocation permission prompt
- live location ingestion
- Contacts permission prompt
- native contact picker
- MapKit venue picker

Reason:

The current product surface is Photon/Spectrum iMessage. A server-side iMessage
agent cannot silently read on-device iPhone Calendar, Contacts, or Location
data. Native access requires an iOS app and explicit Apple permission prompts.

### Trained ML / Recommender Infrastructure

Not yet implemented:

- learned embeddings
- vector database retrieval
- reciprocal accept-probability model
- contextual bandit feedback learning
- real-time ranking service
- fairness and exploration controls

Reason:

The MVP uses first-pass product heuristics to make the architecture demoable
without overclaiming scientific validity.

### Trust And Ops

Not yet implemented:

- NTU invite-code database
- referral accountability
- human review dashboard
- member trust score
- incident review workflow
- persistent CommonGround member profiles

Reason:

The current code proves the user-facing loop and recommender shape. Operational
trust tooling is the next layer after the demo.

## Pitch-Safe Language

Use:

> The MVP simulates the full CommonGround architecture with honest product
> heuristics: consented identity handle, user-approved AI Passport, structured
> profile parsing, heuristic room recommendation, iOS handoff for scheduling,
> and vibe feedback. The architecture is ready for embeddings, native iOS
> permissions, and human review, but we are not claiming those are already live.

Avoid:

> We scrape LinkedIn.

> We read your iPhone Calendar.

> We have a trained compatibility model.

> We can predict love.

## Testing The Mapped Flow

Run:

```sh
PULLUP_SHOW_AGENT_TRACE=0 PULLUP_PROVIDERS=terminal bun start
```

Then send:

```text
START
CONSENT
https://www.linkedin.com/in/your-profile/
[AI Passport summary]
APPROVE
[explicit preferences]
YES
you: Thu 7:30 PM; Mina: Thu 7:30 PM
CONFIRM ROOM
```

Expected:

- asks for LinkedIn
- asks for AI Passport
- asks for approval/redaction
- asks for explicit preferences
- recommends a room with people/activity/venue/context
- schedules via iPhone Calendar-ready handoff
- asks for vibe feedback
