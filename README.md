# pi-config

My Pi configuration repo.

Contains:
- extensions
- skills
- local settings and trust decisions
- setup docs for new Pi agents

## Quick start

This repo is the canonical Pi config snapshot.
A Pi agent should read `SELF_SETUP.md` and apply the repo contents to `~/.pi/agent/` directly.

1. Clone this repo.
2. Sync `extensions/` and `skills/` into `~/.pi/agent/`.
3. Merge `settings.json` and `trust.json` as needed.
4. Install extension deps.
5. Run `/reload` in Pi.

## Self-setup guide

See `SELF_SETUP.md` for the agent-facing setup flow.

## What is tracked

- `extensions/`
- `skills/`
- `settings.json`
- `trust.json`
- `git/.gitignore`

## What is not tracked

- `auth.json` secrets
- `sessions/`
- `node_modules/`
- `.venv/`
- `models-store.json`

## Notes

- `auth.json` stays local on each machine.
- Some extensions need extra system tools like `yt-dlp`, `ffmpeg`, and Python.
