#!/bin/zsh
# fx-route -- moves renamed captures at the top of the screenshots store into one folder per project.
# Runs right after fx-rename in fx-watch.sh. The map is <store>/route-map.txt: one "<glob> <folder>" per
# line, matched against the lowercase file name, first match wins; no match goes to _inbox/.
# Only names the renamer has produced (they carry "--") are moved, so a capture still being written stays put.
#
# Usage: scripts/fx-route.sh <store> [--all]
#   --all  also move names the renamer never touched (the one-time sort of an existing store)
STORE="${1}"; ALL="${2}"
[[ -n "$STORE" && -f "$STORE/route-map.txt" ]] || exit 0
setopt null_glob extended_glob
cd "$STORE" || exit 0
for f in *.(#i)(png|jpg|jpeg|gif|webp|mp4|mov|mp3|csv|pdf)(.); do
  [[ "$ALL" == "--all" || "$f" == *--* ]] || continue
  dest="_inbox"; lc="${f:l}"
  while read -r pat dir; do
    [[ -z "$pat" || "$pat" == \#* ]] && continue
    if [[ "$lc" == ${~pat} ]]; then dest="$dir"; break; fi
  done < route-map.txt
  mkdir -p "$dest"
  [[ -e "$dest/$f" ]] && continue
  if git ls-files --error-unmatch -- "$f" >/dev/null 2>&1; then git mv -- "$f" "$dest/$f"; else mv -n -- "$f" "$dest/$f"; fi
  print "$(date '+%b %d %Y - %I:%M:%S %p') routed $f -> $dest/"
done
