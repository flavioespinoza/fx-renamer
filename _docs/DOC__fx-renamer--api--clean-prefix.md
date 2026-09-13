# DOC: fx-renamer -- cleanPrefix

v1 | Sep 13 2026 - 06:36 AM (MDT)

**Status:** Active
**Type:** API Reference
**Created:** Sep 13 2026

---

## Summary

Lowercases a piece of text, removes every space and every period, and
keeps a double dash exactly as typed -- Flavio's naming rule, as a plain
string call with no regex.

## Signature

```ts
function cleanPrefix(raw: string): string
```

## The Regex This Replaces

```txt
a chain of regexes: lowercase is not a regex concern, but collapsing
"---" to "--" and trimming leading or trailing "-" are both commonly
written as /-{3,}/g and /^-+|-+$/g
```

## Why The Regex Version Gets Risky

A dash-collapsing regex has to be re-run after every other replacement in
the chain, because an earlier fix (removing a space between two dashes)
can produce a fresh run of three or more dashes that the regex already
ran past. Looping a plain `while (kept.includes("---"))` check catches
that automatically, because it keeps re-checking the same string until
nothing changes.

## The Plain-String Way

```ts
cleanPrefix("Test-three - - spaces-between-double-dash")
// "test-three--spaces-between-double-dash"
```

## How It Works

- **A**: Lowercase the whole string.
- **B**: Replace an em dash or en dash with a double dash (`replaceAll`, twice, one call per character).
- **C**: Remove ellipsis characters and any bracket or parenthesis.
- **D**: Remove every space -- this is also what turns `"- -"` (a double dash a capture tool or dictation tool split with spaces) back into a clean `"--"`.
- **E**: Remove every period except none yet -- the extension's own dot is handled by the caller, before `cleanPrefix` ever sees the base name.
- **F**: Turn a double underscore into a double dash and a single underscore into a single dash.
- **G**: Walk the result one character at a time, keeping only `a`-`z`, `0`-`9`, and `-`. This is the character-loop step that drops anything else (an ampersand, an at sign) with no allowlist regex.
- **H**: Loop `while (kept.includes("---"))` and collapse to `"--"` each pass, until nothing changes.
- **I**: Trim a leading or trailing `-` with `while` loops, one character at a time.

## Examples

| Input | Output |
|-------|--------|
| `"My-app --issue-74"` | `"my-app--issue-74"` |
| `"Meet - [Team Code Review] Pre-Work Onboarding Session"` | `"meet-teamcodereviewpre-workonboardingsession"` |

## Edge Cases And Limits

Only strips characters outside `a`-`z 0-9 -`; a name with characters
outside the ASCII range needs its own decision before reaching this
function, since the character loop drops them silently by design.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| Sep 13 2026 | v1 | Written alongside the four-function API doc set. |
