# DOC: fx-renamer -- Cookbook, File Name Patterns

v1 | Sep 13 2026 - 06:36 AM (MDT)

**Status:** Active
**Type:** Reference
**Created:** Sep 13 2026
**See-Also:** DOC__fx-renamer--api--overview.md

---

## Summary

Every capture-tool naming shape `parseTimestamp` currently recognizes, and
an honest list of shapes it does not, as a starting point for the next
addition. Verified against the live code, not asserted from memory.

## Recognized -- Covered By Tests

- **A**: **CleanShot X, AM or PM Before The Time** -- `2026-09-13_AM-3-01-32`.
- **B**: **CleanShot X, AM or PM After The Time** -- `2026-09-13_2.44_AM`.
- **C**: **CleanShot X, 24-Hour Or UTC** -- `2026-09-13--09-59-51` or `2026-09-13--09-59-51--utc`.
- **D**: **CleanShot X's Older Default, A Month Name** -- `July-08-2026_05.15.PM`, with an optional trailing suffix like `-converted`.
- **E**: **A Date With No Time At All** -- `Jul-06-2026`.
- **F**: **A Double Dash Typed With Spaces Around It** -- `- -` collapses to `--` once spaces are removed, so a Wispr Flow dictation of "double dash" that lands with stray spaces still produces the right separator.

## Not Yet Recognized -- Honest Gaps, Not Omissions

- **G**: **macOS's Own Default Screenshot Name** -- `Screenshot 2026-09-13 at 5.44.12 AM.png` (or the older `Screen Shot ... at ...`). Verified against the live code: this currently falls through to the no-timestamp path and produces `screenshot2026-09-13at54412am.png` -- the date, the literal word "at", and the time all get glued together with no separators, because the tokenizer sees "at" as its own token sitting between the date and the time, and none of the five shapes in `matchAt` allow a word in that position. **This is the most likely next addition**, since it is the single most common source of unrenamed files on a Mac that has not touched CleanShot X's settings.
- **H**: **A Timestamp With No Date, Time Only** -- some tools name a burst of captures with only a time and an index (`Capture 1_10-15-32.png`), relying on the surrounding files for date context. `parseTimestamp` requires a full date; a time-only shape would need the file's own birth date rather than a parsed one.
- **I**: **Zoom's Recording Name Shape** -- `GMT20260913-114400_Recording.mp4`, a `GMT` prefix directly against a compact `YYYYMMDD-HHMMSS` run with no separators at all between the date and time digits. Would need its own branch in `matchAt` rather than reusing the existing digit-token matching, since the digits are not split into separate tokens by any of the current separator characters.
- **J**: **A Millisecond Or Microsecond Suffix** -- some screen recorders append sub-second precision (`--123ms` or `.482`). Currently ignored entirely if present; `toFxName`'s output has no field for it.

## The Rule This List Follows

Per `SPEC__directive--coding-standards.md`: no regex when a plain-string
workaround exists. Every shape above, recognized or not, is handled (or
would be handled) with `tokenize`, a character loop, and plain string
calls -- the gaps are about which token shapes `matchAt` checks for, not
about needing regex to check for them.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| Sep 13 2026 | v1 | Written as a companion to the overview doc, verified against the live code rather than asserted from memory. |
