# DOC: fx-renamer -- parseTimestamp

v1 | Sep 13 2026 - 06:36 AM (MDT)

**Status:** Active
**Type:** API Reference
**Created:** Sep 13 2026

---

## Summary

Finds a timestamp anywhere in a file's base name (the part before the
extension) and decodes it, trying five input shapes in order.

## Signature

```ts
function parseTimestamp(base: string): Parsed | null
```

Returns `null` when no recognized timestamp shape is present anywhere in
`base`.

## The Five Shapes It Reads

- **A**: Numeric date, AM or PM, then hour, minute, optional second -- `2026-09-13_AM-3-01-32`.
- **B**: Numeric date, hour, minute, optional second, then AM or PM -- `2026-09-13_2.44_AM`.
- **C**: Numeric date, 24-hour hour, minute, optional second, optional `--utc` -- `2026-09-13--09-59-51--utc`.
- **D**: Month name, day, year, then hour, minute, optional second, AM or PM, optional trailing suffix -- `July-08-2026_05.15.PM-converted`.
- **E**: Month name, day, year, with no time at all -- `Jul-06-2026`.

## How It Works

- **A**: `tokenize` splits `base` on the separator characters `" ._-"`, recording where each token starts.
- **B**: Scan tokens from the LAST one back to the first, calling `matchAt` at each position. Scanning backward means a timestamp near the end of the name wins over a coincidental digit run earlier in the title.
- **C**: `matchAt` checks the five shapes above at the current token, in order, and returns a `Parsed` record -- year, month, day, hour, minute, second, whether the name hinted UTC, the text before and after the timestamp, and whether it was a date with no time.
- **D**: First match wins; `parseTimestamp` returns immediately once `matchAt` succeeds anywhere.

## Examples

| Input | Parsed |
|-------|--------|
| `"my-app --issue-74 --2026-09-13--10-27-22--utc"` | year 2026, month 9, day 13, hour 10, minute 27, second 22, `utcHint: true`, prefix `"my-app --issue-74 "` |
| `"demo-autotrader-update--Jul-06-2026"` | year 2026, month 7, day 6, `dateOnly: true` |
| `"cleanshot-x--settings__v5"` | `null` -- no timestamp shape present |

## Edge Cases And Limits

Reads AM/PM in either position relative to the time, but never both at once
in the same name. A 24-hour hour above 23 does not match shape C and falls
through to `null` unless another shape applies.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| Sep 13 2026 | v1 | Written alongside the four-function API doc set. |
