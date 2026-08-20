# pi-config agent instructions

This repo stores Pi configuration and setup material.

## Rules

- Keep Pi extensions in `extensions/`.
- Keep Pi skills in `skills/`.
- Do not commit secrets like `auth.json`.
- Do not commit generated folders like `node_modules/`, `.venv/`, or `sessions/`.
- Prefer small, direct edits to existing config.
- Update this repo when Pi config changes.

## Setup

Use `./scripts/bootstrap.sh` to copy the repo into `~/.pi/agent/` and install dependencies.
