# CommonGround Demo

Runnable MVP simulation for CommonGround's multi-stage recommender system:

> We do not recommend people. We recommend a room: the people, the activity, the venue, and the context that make the first meeting worth showing up for.

## Run

```bash
python3 run_demo.py
```

## Photon SDK Setup

When wiring the real message channel layer, install Spectrum's TypeScript SDK:

```bash
npm install
```

The Python demo only prepares the payload that CommonGround would hand to Photon Spectrum.

Run the Spectrum stub locally after installing dependencies:

```bash
npm run spectrum:dev
```

## Photon Integration

Read:

- [PHOTON_SPECTRUM_INTEGRATION.md](./PHOTON_SPECTRUM_INTEGRATION.md) for the product and production integration spec.
- [photon_agent_stub.ts](./photon_agent_stub.ts) for a Spectrum server skeleton using `app.messages`, `space.responding(...)`, the iMessage provider, terminal provider, and confirmation polls.

The demo prints:

- Photon Spectrum / iMessage guided onboarding flow
- NTU invite and verification flow
- user input to structured matching profile workflow
- eligibility gate output
- retrieved candidate people
- reciprocal matching examples
- 3 candidate rooms/events
- activity and venue recommendations
- multi-objective re-ranking
- privacy-safe Context Cards
- Photon Spectrum delivery payload for iMessage / WhatsApp / Telegram / Slack
- post-event vibe feedback learning

## Product Architecture

CommonGround uses **RoomTAIRA**, a TAIRA-inspired thought-augmented room recommender:

1. Intent Interpreter turns fuzzy social intent into structured goals.
2. Thought Planner decomposes the task into people, room, activity, venue, safety, and context-card subtasks.
3. Candidate Retrieval Agents retrieve users, activities, and venues.
4. Room Formation Agent forms 3-5 person rooms.
5. Critic / Safety Agent checks boundaries, privacy leakage, awkwardness risk, and venue suitability.
6. Context Card Agent explains why the room works.
7. Feedback Distillation converts post-event vibe feedback into reusable learning signals.

CommonGround does **not** build the messaging layer. We use [Photon Spectrum](https://photon.codes/) as the delivery and control plane because Spectrum is positioned to connect agents to iMessage, WhatsApp, Telegram, Slack, and other everyday channels through a unified API, with message history, audit logs, and human-in-the-loop controls.

## Modules

- `passport_parser.py`: creates tags, embedding text, taste graph, and constraints
- `candidate_retriever.py`: retrieves plausible people with simulated embedding similarity
- `reciprocal_matcher.py`: estimates mutual opt-in likelihood
- `group_builder.py`: builds rooms with consensus-aware greedy grouping
- `activity_venue_recommender.py`: applies hard constraints and ranks activities/venues
- `event_reranker.py`: chooses top event plans
- `context_card_generator.py`: creates privacy-safe group explanations
- `spectrum_delivery_adapter.py`: prepares iMessage onboarding plus Context Card and mutual-confirm payloads for Photon Spectrum
- `feedback_updater.py`: updates user vibe profile from post-event feedback

This is a hackathon MVP, so scoring values are first-pass product heuristics, not validated empirical coefficients.
