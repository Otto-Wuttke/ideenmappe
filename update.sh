#!/usr/bin/env bash
# Holt die neueste Version aus GitHub und startet die Ideenmappe neu. Daten bleiben erhalten.
set -euo pipefail
cd "$(dirname "$0")"
before=$(git rev-parse --short HEAD)
git pull --ff-only
after=$(git rev-parse --short HEAD)
if [ "$before" = "$after" ]; then echo "Schon aktuell ($after)."; exit 0; fi
if command -v docker >/dev/null 2>&1 && [ -n "$(docker compose ps -q 2>/dev/null)" ]; then
  docker compose up -d --build
elif systemctl cat ideenmappe >/dev/null 2>&1; then
  sudo systemctl restart ideenmappe
else
  echo "Hinweis: Server bitte selbst neu starten."
fi
echo "Ideenmappe aktualisiert: $before → $after"
git log --oneline "$before..$after"
