# pi-config

My Pi configuration repo.

Contains:
- extensions
- skills
- local settings and trust decisions
- setup docs for new Pi agents

## Quick start

1. Clone this repo.
2. Copy the files into `~/.pi/agent/`.
3. Install extension deps.
4. Run `/reload` in Pi.

## Bootstrap

```bash
./scripts/bootstrap.sh
```

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
