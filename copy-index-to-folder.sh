#!/usr/bin/env bash

# Drop `set -e` so one failing destination (e.g. drive not mounted) does
# not abort the rest of the batch.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/index.html"
CONFIG_FILE="$SCRIPT_DIR/tootoo.config.js"

# Downstream copies of TooToo's index.html. Edit this list to add or
# remove targets; the script always copies to every entry here.
DESTINATIONS=(
  'G:\My Drive\2026-theo-github\heritage-happenings.github.io'
  'G:\My Drive\2026-theo-github\pushme-pullyou-github'
  'G:\My Drive\2026-theo-github\pushme-pullyou-assets'
  'G:\My Drive\2026-theo-github\theo-armour-2025'
  'G:\My Drive\2026-theo-github\theo-armour-2026'
  'G:\My Drive\2026-theo-github\theo-armour-agenda'
  'G:\My Drive\2026-theo-github\theo-armour-pages'
  'G:\My Drive\2026-theo-github\theo-armour-qdata'
  'G:\My Drive\2026-theo-github\theo-armour-sandbox'
  'G:\My Drive\2026-theo-github\theo-armour-aa'
  'G:\My Drive\2026-theo-github\theo-armour-genealogy'
  'G:\My Drive\2026-theo-github\theo-armour-wikitheo'
  'I:\My Drive\tech'
)

show_usage() {
  cat <<'USAGE'
Copy TooToo's index.html to every downstream folder in DESTINATIONS.

Usage:
  ./copy-index-to-folder.sh           # copy to all configured folders
  ./copy-index-to-folder.sh -h        # show this help

Edit the DESTINATIONS array near the top of this script to change targets.

For each destination:
  - The folder is created if it doesn't exist.
  - Any existing index.html is overwritten. No backup is made — the
    canonical history lives in the tootoo repo.
  - If tootoo.config.js does not exist in the destination, a copy of
    the canonical template is placed there. Existing configs are never
    overwritten (each fork customizes its own).
  - If the folder can't be created (e.g. drive not mounted), the
    destination is skipped and the script continues.

Run this from Git Bash or another bash-compatible shell on Windows.
USAGE
}

to_bash_path() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -u "$path"
    return
  fi
  echo "cygpath not found; run this script from Git Bash on Windows." >&2
  exit 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  show_usage
  exit 0
fi

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Source file not found: $SOURCE_FILE" >&2
  exit 1
fi

echo "Source: $SOURCE_FILE"
echo

copied=0
configs=0
skipped=0

for raw_dest in "${DESTINATIONS[@]}"; do
  DEST_DIR="$(to_bash_path "$raw_dest")"
  DEST_FILE="$DEST_DIR/index.html"
  DEST_CONFIG="$DEST_DIR/tootoo.config.js"

  if ! mkdir -p "$DEST_DIR" 2>/dev/null; then
    echo "SKIP  $raw_dest  (cannot create folder)"
    skipped=$((skipped + 1))
    continue
  fi

  if cp -p "$SOURCE_FILE" "$DEST_FILE"; then
    echo "COPY  $raw_dest"
    copied=$((copied + 1))
  else
    echo "FAIL  $raw_dest"
    skipped=$((skipped + 1))
  fi

  if [[ -f "$CONFIG_FILE" && ! -f "$DEST_CONFIG" ]]; then
    if cp -p "$CONFIG_FILE" "$DEST_CONFIG"; then
      echo "  +config  tootoo.config.js (new)"
      configs=$((configs + 1))
    fi
  fi
done

echo
echo "Done. Copied: $copied   New configs: $configs   Skipped: $skipped"

# Exit non-zero if any destination was skipped or failed, so callers
# can detect partial-failure runs.
(( skipped == 0 ))
