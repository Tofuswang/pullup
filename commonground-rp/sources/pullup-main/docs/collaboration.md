# Collaboration Setup

This project should be shared through GitHub, but local runtime credentials
should stay personal and environment-specific.

## Immediate Rule

Do not run two different services from the same Spectrum project and line.

If two developers share one Spectrum account, create separate projects:

- `pullup-dev-tofus`
- `pullup-dev-friend`
- later: `pullup-prod`

Each project should have its own:

- `PROJECT_ID`
- `PROJECT_SECRET`
- allowed iMessage targets
- debug logs and telemetry
- optional iMessage line, if Photon requires line separation

This keeps one person's experiments from consuming or replying to the other
person's iMessage traffic.

## Local Environment

Each developer should copy `.env.example` to `.env` and fill in their own values:

```sh
cp .env.example .env
```

Never commit `.env`.

Use Terminal mode while developing agent behavior:

```sh
PULLUP_PROVIDERS=terminal bun start
```

Use iMessage mode only when testing the real channel:

```sh
PULLUP_PROVIDERS=imessage bun start
```

## GitHub Flow

Recommended branches:

- `main`: stable shared base
- `dev/<name>/<short-task>`: personal work branches

Examples:

```sh
git switch -c dev/tofus/imessage-debug
git switch -c dev/friend/webhook-server
```

Recommended workflow:

1. Pull latest `main`.
2. Create a branch.
3. Commit small changes.
4. Push branch.
5. Open a draft PR.
6. Merge only after `bun run check` and `bun test` pass.

## Before Pushing

Run:

```sh
bun run check
bun test
git status --short
```

Confirm no secrets are staged:

```sh
git diff --cached --name-only
```

If `.env` appears, stop.

## iMessage Testing

Outbound messages can fail with:

```text
Target not allowed for this project
```

That usually means the recipient has not been allowed by the Spectrum project or
has not initiated an inbound conversation yet. Have the target send a message to
the project line first, then retry:

```sh
IMESSAGE_TEST_TARGET="+886..." bun src/send-test.ts
```
