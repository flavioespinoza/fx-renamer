#!/bin/zsh
# fx-watch -- run by launchd whenever a file lands in a watched folder.
# Waits for the capture app to finish writing, then renames only files created after the watcher was
# installed (the time in <folder>/.fx-since, or _tmp/watch-since.txt as fallback for older installs),
# so older files are never touched automatically.
#
# Usage: scripts/fx-watch.sh <folder>
#   <folder>  the directory to rename files in; omit for no-op (backward compat)
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
ROOT="${0:A:h:h}"
FOLDER="${1}"

if [[ -n "$FOLDER" ]]; then
  # Prefer per-folder since file; fall back to shared _tmp/watch-since.txt for the
  # live job that was installed before this change.
  SINCE_FILE="$FOLDER/.fx-since"
  [[ -f "$SINCE_FILE" ]] || SINCE_FILE="$ROOT/_tmp/watch-since.txt"
  SINCE="$(cat "$SINCE_FILE" 2>/dev/null || echo 0)"
  sleep 5
  node "$ROOT/scripts/fx-rename.ts" --min-age-ms 2000 --newer-than "$SINCE" "$FOLDER" >> "$ROOT/_tmp/fx-watch.out.log" 2>&1
  # then file each renamed capture into its project folder (no-op when the folder has no route-map.txt)
  zsh "$ROOT/scripts/fx-route.sh" "$FOLDER" >> "$ROOT/_tmp/fx-watch.out.log" 2>&1
else
  # No argument: backward-compat path -- loop over $@ (empty = no-op, same as before).
  SINCE="$(cat "$ROOT/_tmp/watch-since.txt" 2>/dev/null || echo 0)"
  sleep 5
  for DIR in "$@"; do
    node "$ROOT/scripts/fx-rename.ts" --min-age-ms 2000 --newer-than "$SINCE" "$DIR" >> "$ROOT/_tmp/fx-watch.out.log" 2>&1
  done
fi
