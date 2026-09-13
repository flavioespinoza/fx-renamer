#!/bin/zsh
# install-watch -- install the macOS launch agent that renames new files in a folder as they land.
#   scripts/install-watch.sh /path/to/folder
# Only files created after the install time are renamed, so existing files are never touched.
set -e
ROOT="${0:A:h:h}"
FOLDER="${1:?usage: scripts/install-watch.sh /path/to/folder}"
LABEL="com.fx-renamer.watch"
OUT="$HOME/Library/LaunchAgents/$LABEL.plist"
CONTENT="$(cat "$ROOT/scripts/launchd/$LABEL.plist.template")"
CONTENT="${CONTENT//__ROOT__/$ROOT}"
CONTENT="${CONTENT//__FOLDER__/$FOLDER}"
mkdir -p "$ROOT/_tmp"
printf '%s\n' "$CONTENT" > "$OUT"
plutil -lint "$OUT"
date +%s000 > "$ROOT/_tmp/watch-since.txt"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$OUT"
echo "watching $FOLDER"
