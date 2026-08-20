#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${HOME}/.pi/agent"

mkdir -p "$target"
rsync -a \
  --exclude '.git/' \
  --exclude 'README.md' \
  --exclude 'AGENTS.md' \
  --exclude 'scripts/' \
  --exclude '.gitignore' \
  --exclude 'sessions/' \
  --exclude 'auth.json' \
  --exclude 'models-store.json' \
  --exclude 'extensions/**/node_modules/' \
  --exclude 'skills/pdf-reader/.venv/' \
  "$repo_root"/ "$target"/

for pkg in \
  "$target/extensions/bash-guard" \
  "$target/extensions/filechanges" \
  "$target/extensions/web-fetch"
  do
  if [[ -f "$pkg/package.json" ]]; then
    (cd "$pkg" && npm install)
  fi
done

if [[ -f "$target/skills/pdf-reader/requirements.txt" ]]; then
  python3 -m venv "$target/skills/pdf-reader/.venv"
  "$target/skills/pdf-reader/.venv/bin/pip" install -r "$target/skills/pdf-reader/requirements.txt"
fi

echo "Done. Restart Pi or run /reload."
