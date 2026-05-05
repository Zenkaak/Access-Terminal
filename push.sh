#!/bin/bash
set -e

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN is not set."
  exit 1
fi

REPO="https://Zenkaak:${TOKEN}@github.com/Zenkaak/Access-Terminal.git"

git remote set-url origin "$REPO"
git push origin main
git remote set-url origin "https://github.com/Zenkaak/Access-Terminal.git"

echo "Done. Remote URL reset to HTTPS (token removed)."
