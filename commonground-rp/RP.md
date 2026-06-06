# CommonGround RP

## Summary

I pulled together the accessible CommonGround material found locally and from
the reachable PullUp git remote. The strongest source is the PullUp repo:
`origin/main` was fetched to `e8ef46c8323a5d56fedd70a8650873caa1804fb3`, while
the most complete CommonGround implementation snapshot is
`origin/feature/research-matching-calendar-loop` at
`dd6b4e94918313ebe95c44edef6aa49f84d6b193`.

The package includes source snapshots, a full git bundle of fetched refs,
standalone demo code, deck exports, presentation source notes, file manifests,
checksums, and local search result records.

## Product Shape Found

CommonGround is documented and implemented as an iMessage/Spectrum-first room
recommender:

- invite-only onboarding via `START`
- consent before collecting profile signals
- LinkedIn URL as a true-person verification handle, not a scraped profile
- AI Passport intake as user-approved matching context
- privacy-safe Context Cards
- heuristic room recommendation, not a trained compatibility model
- local iOS Calendar and Apple Maps handoff language
- post-room vibe feedback framed as tuning preferences rather than rating
  people

The recurring line across the materials is:

> We do not recommend people. We recommend a room.

## Pulled Sources

| Area | Included Path | Source |
| --- | --- | --- |
| Latest fetched PullUp main | `sources/pullup-main/` | `origin/main` at `e8ef46c8323a5d56fedd70a8650873caa1804fb3` |
| Richest CommonGround feature branch | `sources/pullup-research-matching-calendar-loop/` | `origin/feature/research-matching-calendar-loop` at `dd6b4e94918313ebe95c44edef6aa49f84d6b193` |
| Full fetched PullUp git history | `git/pullup-all-fetched-refs.bundle` | local checkout of `https://github.com/Tofuswang/pullup.git` after `git fetch --all --prune` |
| Standalone demo | `sources/commonground-demo/` | prior Codex output `commonground_demo` |
| Deck exports | `presentations/exports/` | prior Codex output and local Downloads |
| Manual deck source | `presentations/deck-source/` | prior Codex output `manual-commonground-demo-20260606-154219` |

## Key PullUp Files

- `sources/pullup-research-matching-calendar-loop/docs/commonground-business-flow-v2.md`
- `sources/pullup-research-matching-calendar-loop/docs/methodology-to-mvp-map.md`
- `sources/pullup-research-matching-calendar-loop/src/commonground.ts`
- `sources/pullup-research-matching-calendar-loop/src/commonground_recommender.ts`
- `sources/pullup-research-matching-calendar-loop/src/commonground_methodology.ts`
- `sources/pullup-research-matching-calendar-loop/src/calendar.ts`
- `sources/pullup-research-matching-calendar-loop/ios/PullupCalendar/Sources/PullupCalendar/EventKitCalendarWriter.swift`

## Exclusions

I did not copy local `.git` directories, dependency folders, `.env` files,
saved env files, logs, PID files, Python bytecode, or generated runtime caches.
This keeps the RP small and avoids packaging local secrets or machine-specific
state. The fetched PullUp history is preserved through the git bundle instead.

## Verification

- Fetched the PullUp remotes successfully on June 6, 2026.
- Verified `git/pullup-all-fetched-refs.bundle` with `git bundle verify`.
- Ran the standalone Python demo successfully with
  `PYTHONDONTWRITEBYTECODE=1 python3 run_demo.py`.
- Ran PullUp static TypeScript checking successfully with `npm run check`.
- Did not run `bun test` because `bun` is not installed in this environment.
- Generated `docs/file-manifest.txt` for package contents.
- Generated `docs/SHA256SUMS.txt` for file checksums.
- Confirmed no copied `.env`, `.pid`, log, or `.pyc` files were present after
  packaging.
