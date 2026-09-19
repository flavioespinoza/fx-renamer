#!/bin/zsh
# fx-project -- set the project every new capture name starts with.
#   fx-project sol-bot    names become sol-bot--...
#   fx-project off        no project prefix
#   fx-project            show the current one
F="${0:A:h:h}/_tmp/project.txt"
mkdir -p "${F:h}"
case "$1" in
  "") cat "$F" 2>/dev/null || echo "(none)" ;;
  off) rm -f "$F"; echo "project prefix off" ;;
  *) echo "$1" > "$F"; echo "project prefix: $1" ;;
esac
