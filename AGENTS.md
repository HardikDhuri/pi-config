# pi-config agent instructions

This repo stores Pi configuration and setup material.

## Rules

- Keep Pi extensions in `extensions/`.
- Keep Pi skills in `skills/`.
- Do not commit secrets like `auth.json` or local trust data like `trust.json`.
- Do not commit generated folders like `node_modules/`, `.venv/`, or `sessions/`.
- Prefer small, direct edits to existing config.
- Update this repo when Pi config changes.

## Setup

A Pi agent should follow `SELF_SETUP.md` and update `~/.pi/agent/` directly from the repo contents.
Do not depend on `scripts/bootstrap.sh` as the primary setup path.
