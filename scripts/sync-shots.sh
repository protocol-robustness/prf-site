#!/usr/bin/env bash
# Fetch the screenshot gallery bundle published by the prf repo into
# public/shots/, mirroring what the deploy workflow does (.github/workflows/
# deploy.yml). Replaces whatever is currently in public/shots/.
#
# Usage:
#   scripts/sync-shots.sh <bundle-url>
#   PRF_SHOTS_URL=... scripts/sync-shots.sh
#
# Example url:
#   https://github.com/<org>/<prf>/releases/latest/download/shots.tar.gz
set -euo pipefail

url="${1:-${PRF_SHOTS_URL:-}}"
if [ -z "$url" ]; then
  echo "error: no bundle url (pass one or set PRF_SHOTS_URL)" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "fetching $url"
curl --fail --location --retry 3 "$url" -o "$tmp/shots.tar.gz"

rm -rf public/shots
mkdir -p public/shots
tar -xzf "$tmp/shots.tar.gz" -C public/shots --strip-components=1

echo "done -> public/shots ($(du -sh public/shots | cut -f1))"
