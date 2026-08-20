# Pi self-setup

This repo is the source of truth for Pi configuration.

A Pi agent should use this repo to update its own config directly, not by running a wrapper script.

## Goal

Bring the local Pi install in sync with this repo:

- `~/.pi/agent/extensions/`
- `~/.pi/agent/skills/`
- `~/.pi/agent/settings.json`
- `~/.pi/agent/trust.json`
- any local auth files the user already has, such as `~/.pi/agent/auth.json`

## Agent procedure

1. Read `AGENTS.md` and `README.md` in this repo.
2. Inspect `extensions/`, `skills/`, `settings.json`, and `trust.json`.
3. Compare them with the local Pi config under `~/.pi/agent/`.
4. Copy or update files into `~/.pi/agent/`.
5. Keep secrets local. Do not commit or overwrite `auth.json` unless the user asks.
6. Install extension dependencies where needed.
7. Install the `pdf-reader` Python requirements if that skill is present.
8. Reload Pi with `/reload`.

## Notes

- Treat this repo as the canonical config snapshot.
- Prefer merging over replacing if the local Pi config already has user-specific changes.
- If a file exists locally and in the repo, reconcile intentionally.
- If the local Pi install is missing trust data, the agent may need to trust the repo or user folder before loading project-local resources.

## Common commands

```bash
# inspect
find extensions skills -maxdepth 2 -type f

# reload in Pi
/reload
```
