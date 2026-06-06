# CommonGround Pitch Card

## One-Liner

CommonGround is an agentic room recommender for designing the first hour.

## Best Line

We do not recommend people. We recommend a room: the people, the activity, the venue, and the context that make the first meeting worth showing up for.

## Algorithm Answer

For MVP, we use RoomTAIRA, a TAIRA-inspired thought-augmented room recommender. The agentic layer interprets fuzzy social intent and decomposes it into people retrieval, reciprocal matching, room formation, activity selection, venue constraints, safety critique, and Context Card generation. The feedback layer follows contextual-bandit logic to balance repeating proven vibes with exploring adjacent ones.

## Channel Layer

We do not build the iMessage layer ourselves. CommonGround runs as a Photon Spectrum agent server. Spectrum gives us `Message`, `Space`, `User`, and provider primitives; iMessage-native typing, reactions, replies, polls, group creation, and chat renaming; plus terminal development and future WhatsApp Business fallback.

Developer setup:

```bash
npm install spectrum-ts
```

## First User Onboarding

With consent, the first user can paste their LinkedIn URL in iMessage for true-person verification only. Photon then guides them to generate an AI Passport in their everyday AI, paste it back, redact sensitive content, and explicitly provide intent, availability, budget, neighborhood radius, alcohol comfort, group size, and contact-exchange boundaries.

## Data Boundary

LinkedIn proves you are real. AI Passport explains what kind of first meeting feels natural. Self input sets consent, logistics, and boundaries. Other members see only the Context Card, not the LinkedIn URL, raw AI Passport, dating intent, contact info, or internal scores.

## UX Rule

Users should see plain-language previews and simple reply actions, not JSON. JSON is internal for RoomTAIRA and Photon payloads.

The first onboarding message should create invitation energy before asking for data:

> You are one of a small first circle invited to CommonGround: a private NTU-origin room network for meeting thoughtful people offline. We do not do swiping. We design a room worth showing up for.

## Photon-Native Product Decisions

- Inbound-first: user taps a prefilled iMessage link and sends `START`.
- Text-only opener, no links/media before the user replies.
- Contact card after first exchange.
- Typing indicator while RoomTAIRA generates.
- Poll for `YES / MAYBE / SKIP`.
- Create and rename iMessage group only after enough people mutually confirm.
- Debounce bursts, cancel stale generations, use stable client GUIDs, and scope memory per verified user.

## What Judges Should Notice

- Safety, identity, consent, and boundaries are hard gates.
- CommonGround forms rooms, not pairs.
- Activity and venue selection are part of the matching product.
- Context Cards reduce awkwardness without exposing private AI summaries.
- Photon Spectrum lets the team demo native-feeling message delivery without rebuilding channel infrastructure.
- Vibe feedback improves recommendations without rating humans like products.
