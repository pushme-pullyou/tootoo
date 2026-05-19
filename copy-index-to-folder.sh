#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/index.html"

show_usage() {
  cat <<'USAGE'
Copy TooToo's index.html to another folder.

Usage:
  ./copy-index-to-folder.sh "/g/My Drive/path/to/destination-folder"

Examples:
  ./copy-index-to-folder.sh "/g/My Drive/2026-theo-github/some-other-repo"
  ./copy-index-to-folder.sh "G:\My Drive\2026-theo-github\some-other-repo"

Notes:
  - Run this from Git Bash or a bash-compatible terminal on Windows.
  - If the destination already has index.html, this script backs it up first.
USAGE
}

to_bash_path() {
  local path="$1"

  if command -v cygpath >/dev/null 2>&1; then
    cygpath -u "$path"
    return
  fi

  printf '%s\n' "$path"
}

if [[ "${1:-}" == "" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  show_usage
  exit 0
fi

DEST_DIR="$(to_bash_path "$1")"
DEST_FILE="$DEST_DIR/index.html"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Source file not found: $SOURCE_FILE" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

if [[ -f "$DEST_FILE" ]]; then
  STAMP="$(date '+%Y-%m-%d-%H-%M')"
  BACKUP_FILE="$DEST_DIR/index-$STAMP.html"
  cp -p "$DEST_FILE" "$BACKUP_FILE"
  echo "Backed up existing destination file:"
  echo "  $BACKUP_FILE"
fi

cp -p "$SOURCE_FILE" "$DEST_FILE"

echo "Copied:"
echo "  from: $SOURCE_FILE"
echo "  to:   $DEST_FILE"
