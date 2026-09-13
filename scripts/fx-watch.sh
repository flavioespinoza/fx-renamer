#!/bin/zsh
# fx-watch -- run by launchd whenever a file lands in a watched folder.
# Waits for the capture app to finish writing, then renames only files created after the watcher was
# installed (the time in _tmp/watch-since.txt), so older files are never touched automatically.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
ROOT="${0:A:h:h}"
SINCE="$(cat "$ROOT/_tmp/watch-since.txt" 2>/dev/null || echo 0)"
sleep 5
for DIR in "$@"; do
  node "$ROOT/scripts/fx-rename.ts" --min-age-ms 2000 --newer-than "$SINCE" "$DIR" >> "$ROOT/_tmp/fx-watch.out.log" 2>&1
done
