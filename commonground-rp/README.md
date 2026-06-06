# CommonGround RP

This repository is a local CommonGround recovery/research package assembled on
June 6, 2026 from files and git refs accessible on this computer.

## What Is Here

- `RP.md` - short executive record of what was found and pulled.
- `sources/pullup-main/` - archive snapshot of fetched `origin/main` from
  `https://github.com/Tofuswang/pullup.git` at commit
  `e8ef46c8323a5d56fedd70a8650873caa1804fb3`.
- `sources/pullup-research-matching-calendar-loop/` - archive snapshot of the
  richer CommonGround feature branch at commit
  `dd6b4e94918313ebe95c44edef6aa49f84d6b193`.
- `sources/commonground-demo/` - standalone CommonGround demo source and docs
  copied from prior Codex outputs, with local secrets/runtime files excluded.
- `presentations/exports/` - deck/PDF/HTML exports found locally.
- `presentations/deck-source/` - source notes and slide-generation files for
  the manual CommonGround demo deck.
- `git/pullup-all-fetched-refs.bundle` - portable git bundle containing the
  fetched PullUp refs and history available from the local checkout.
- `docs/` - provenance, file manifests, SHA-256 checksums, and local search
  result lists.

## Restore The PullUp Git Bundle

```sh
git clone git/pullup-all-fetched-refs.bundle pullup-restored
cd pullup-restored
git branch -a
```

## Run The Demo Snapshot

```sh
cd sources/commonground-demo
python3 run_demo.py
```

## Run The PullUp Snapshot

```sh
cd sources/pullup-research-matching-calendar-loop
bun install
bun test
PULLUP_SHOW_AGENT_TRACE=0 PULLUP_PROVIDERS=terminal bun start
```

## Notes

Generated dependency folders, `.git` directories, `.env` files, logs, PIDs,
Python bytecode, and other runtime noise were intentionally excluded from the
copied snapshots. The git bundle preserves the fetched repository history.
