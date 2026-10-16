#!/bin/zsh
# install-watch -- install a macOS launch agent that renames new files in a folder as they land.
#
#   scripts/install-watch.sh <folder> [label-suffix]
#
# <folder>       the directory to watch; files created after install are renamed automatically.
# [label-suffix] optional identifier appended to the launchd label:
#                  com.fx-renamer.watch.<suffix>
#                defaults to the basename of <folder>, so two watchers can coexist.
#
# Only files created after the install time are renamed, so existing files are never touched.
set -e
ROOT="${0:A:h:h}"
FOLDER="${1:?usage: scripts/install-watch.sh /path/to/folder [label-suffix]}"
SUFFIX="${2:-$(basename "$FOLDER")}"
LABEL="com.fx-renamer.watch.$SUFFIX"
OUT="$HOME/Library/LaunchAgents/$LABEL.plist"
TEMPLATE="$ROOT/scripts/launchd/com.fx-renamer.watch.plist.template"
CONTENT="$(cat "$TEMPLATE")"
CONTENT="${CONTENT//__ROOT__/$ROOT}"
CONTENT="${CONTENT//__FOLDER__/$FOLDER}"
CONTENT="${CONTENT//__LABEL__/$LABEL}"
mkdir -p "$ROOT/_tmp"
printf '%s\n' "$CONTENT" > "$OUT"
plutil -lint "$OUT"
# Record the install time in the watched folder so fx-watch.sh can find it per-folder.
date +%s000 > "$FOLDER/.fx-since"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$OUT"
echo "watching $FOLDER (label: $LABEL)"
