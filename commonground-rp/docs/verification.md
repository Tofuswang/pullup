# Verification

Verification performed on June 6, 2026:

| Check | Result |
| --- | --- |
| PullUp remote fetch | Passed; `origin/main` updated to `e8ef46c8323a5d56fedd70a8650873caa1804fb3` |
| Git bundle verify | Passed; `git/pullup-all-fetched-refs.bundle` records a complete history |
| Standalone Python demo | Passed; `PYTHONDONTWRITEBYTECODE=1 python3 run_demo.py` completed |
| PullUp TypeScript check | Passed; `npm run check` completed with `tsc --noEmit` |
| PullUp Bun tests | Not run; `bun` is not installed in this environment |
| Secret/runtime file sweep | Passed; no copied `.env`, `.env.save`, `*.log`, `*.pid`, or `*.pyc` files found |

The PullUp source package is Bun-native. To run its test suite after restoring
or entering a snapshot, install Bun and run:

```sh
bun test
```
