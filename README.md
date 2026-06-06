# pullup

A [Spectrum](https://photon.codes/docs/spectrum-ts) project. Wired with: iMessage.

## Environment

Before running, open `.env` and fill in the values:

From your project Settings on the [Photon dashboard](https://app.photon.codes):

- `PROJECT_ID`
- `PROJECT_SECRET`

LLM settings:

- `OPENAI_API_KEY` is required for runtime.
- `OPENAI_MODEL` overrides the default model (`gpt-5.5`).

Add them to `.env`:

```sh
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
```

The scheduling MVP uses local iOS handoff instead of Google OAuth. The agent
asks users to check iPhone Calendar and send free windows, then sends Apple Maps
links, supports voluntary location status, and uses only contacts the user
explicitly shares. See `docs/ios-local-integrations.md`.

Tests inject a fake model, but the running TUI/iMessage agent should use a real
LLM. If `OPENAI_API_KEY` is missing at runtime, pullup exits with a clear error.

## Run

```sh
bun install
bun start
```

By default, `bun start` runs only the Terminal provider so the agent brain can
be tested without depending on iMessage delivery.

```sh
bun run start:tui       # local terminal UI only
bun run start:imessage  # iMessage only
bun run start:both      # terminal + iMessage in one loop
```

Set `PULLUP_PROVIDERS` directly if you prefer:

```sh
PULLUP_PROVIDERS=terminal bun start
PULLUP_PROVIDERS=imessage bun start
PULLUP_PROVIDERS=both bun start
```

The product logic lives in `src/agent.ts`. Keep channel-specific concerns in
`src/index.ts` so the same agent can run in the TUI while iMessage is flaky.

## CommonGround member flow

Text `START` to enter the CommonGround onboarding and room recommendation demo.

Flow:

```text
START
CONSENT
https://www.linkedin.com/in/your-profile/
[paste AI Passport summary]
APPROVE
[send preferences: intent, availability, budget, radius, alcohol comfort, group size, contact boundary]
YES
Thu 7:30 PM, Sat 3 PM
CONFIRM ROOM
[post-event vibe feedback]
```

Text `METHODOLOGY` or `/methodology` to show the code-backed methodology map:
what is implemented, what is simulated as MVP heuristic code, and what remains
future native/ML work.

This flow asks for LinkedIn as a true-person verification handle only, asks for
an AI Passport, converts approved information into a demo room recommendation,
then sends a Context Card, iPhone Calendar-ready event card, Apple Maps link, and
vibe feedback prompt.

The MVP persists event, guest, approval, message, and agent-task state in
SQLite. By default the local database is `./data/pullup.sqlite`; override it
with `PULLUP_DB_PATH`.

Host commands:

```sh
/draft    # show the current event brief and invite draft
/approve  # approve the current invite draft
/send     # send approved invites to the small-batch guest list
/status   # show RSVP summary
/reset    # cancel the active draft and restart
```

## Agent design

See `docs/commonground-business-flow-v2.md` for the current CommonGround V2
business flow mapped to the GitHub code infrastructure.

See `docs/methodology-to-mvp-map.md` for the exact mapping between research
methodology, current MVP code, and future native/ML work.

See `docs/agent-architecture.md` for the planned agent team, responsibilities,
handoffs, shared data objects, and MVP build milestones.

See `docs/ios-local-integrations.md` for the local iPhone Calendar flow,
EventKit write-only event creation, Apple Maps, location status, and Contacts
handoff plan.

## Collaboration

See `docs/collaboration.md` before sharing credentials or pushing to GitHub.
Use separate Spectrum projects for separate services or developers.

## Where to go next

- [Spectrum docs](https://photon.codes/docs/spectrum-ts)
- Edit `src/index.ts` to replace the echo loop with real agent logic.
- Add more providers from `spectrum-ts/providers/*`.
