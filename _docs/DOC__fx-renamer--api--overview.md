# DOC: fx-renamer -- Overview

v1 | Sep 13 2026 - 06:36 AM (MDT)

**Status:** Active
**Type:** Overview
**Created:** Sep 13 2026
**See-Also:** DOC__fx-renamer--cookbook--filename-patterns.md

---

## Summary

`fx-renamer` is a TypeScript ESM module that turns a screenshot or screen
recording's messy, capture-tool-generated name into one clean, sortable
shape: `{prefix}--YYYY-MM-DD--HH-MM-SS[--suffix]__am|pm.{ext}`, lowercase,
24-hour, zero-padded, in a fixed home time zone. This file is the index into
the four function docs below and the reasoning behind the whole package.

## Why This Exists

A capture tool writes whatever name its own defaults produce -- spaces,
capital letters, AM/PM in three different positions, sometimes UTC and
sometimes local time with no way to tell which from the name alone. None of
that sorts, greps, or reads consistently six months later. `fx-renamer`
normalizes all of it to one shape without ever reaching for a regular
expression -- `replaceAll`, `split`, `slice`, character loops, and the
file's own creation time do the whole job.

## The Four Functions

| Function | What it does | Doc |
|----------|---------------|-----|
| `toFxName` | The whole pipeline: reads a file name and its birth time, returns the clean name | `DOC__fx-renamer--api--to-fx-name.md` |
| `parseTimestamp` | Finds and decodes a timestamp anywhere in a name, in five input shapes | `DOC__fx-renamer--api--parse-timestamp.md` |
| `cleanPrefix` | Lowercases, strips spaces and periods, keeps double dashes | `DOC__fx-renamer--api--clean-prefix.md` |
| `isClean` | Checks whether a name is already in the target shape | `DOC__fx-renamer--api--is-clean.md` |

`HOME_TIME_ZONE` (`"America/Denver"`) is the default time zone `toFxName`
resolves a local timestamp against; pass a different IANA zone name as the
third argument to override it.

## The Two Techniques That Cover Most Of This

- **A**: **Tokenize, Then Scan From The End** -- `parseTimestamp` splits a name into tokens on `" ._-"` and tries to match a timestamp shape starting at each token, working backward from the last token. Scanning from the end means a title that happens to contain digits (`v2.1`) never gets mistaken for the date.
- **B**: **Birth Time Breaks The UTC-Or-Local Tie** -- a name carrying `09-59-51` with no `--utc` marker could be either UTC or Mountain time. `toFxName` computes both interpretations as epoch milliseconds and keeps whichever one lands within two minutes of the file's actual creation time. The `--utc` suffix is only consulted when neither guess is close enough, which happens when a file was copied and its birth time is stale.

## Extending It

Find a new capture-tool naming shape `parseTimestamp` does not recognize
yet, add a branch to `matchAt` in `modules/fx-name/fx-name.ts`, write a
test next to it in `modules/fx-name/fx-name.test.ts`, and add or update the
doc here the same way.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| Sep 13 2026 | v1 | Written alongside the four-function API doc set, bringing documentation to the standard set by `fx-no-regex`. |
