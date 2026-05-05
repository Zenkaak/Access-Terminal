#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

export BASE_PATH="/"

echo "Building terminal app..."
pnpm --filter @workspace/terminal run build

echo "Copying output to root dist..."
rm -rf "$ROOT/dist"
cp -r "$ROOT/artifacts/terminal/dist" "$ROOT/dist"

echo "Done. Contents of dist/:"
ls "$ROOT/dist"
