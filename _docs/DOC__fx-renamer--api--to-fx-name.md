# DOC: fx-renamer -- toFxName

v1 | Sep 13 2026 - 06:36 AM (MDT)

**Status:** Active
**Type:** API Reference
**Created:** Sep 13 2026

---

## Summary

Turns one file name into its FX-style name: lowercase, spaces and periods
removed, double dashes kept, one timestamp shape, an `__am` or `__pm` tag
on any name with a known time.

## Signature

```ts
function toFxName(fileName: string, birthtimeMs: number, timeZone?: string): string
```

- **A**: `fileName` -- the name as the capture tool wrote it, extension included.
- **B**: `birthtimeMs` -- the file's actual creation time, as Unix epoch milliseconds. Used to decide UTC versus local and to fill in seconds the name did not carry.
- **C**: `timeZone` -- an IANA zone name, defaulting to `HOME_TIME_ZONE` (`"America/Denver"`).

## How It Works

- **A**: Split the extension off the end (`lastIndexOf(".")`, no regex).
- **B**: Call `parseTimestamp` on the remaining base name. No timestamp found -- return the name lowercased and cleaned by `cleanPrefix` if it was not already, unchanged otherwise.
- **C**: Clean the text before the timestamp with `cleanPrefix` and anything after it the same way, joined back with `--`.
- **D**: A date with no time (`Jul-06-2026`) returns immediately -- no hour exists to decide UTC or local, and no `__am`/`__pm` tag is added.
- **E**: Otherwise, compute the timestamp two ways -- as if it were UTC, and as if it were local time in `timeZone` -- and keep whichever epoch lands within two minutes of `birthtimeMs`. Neither is close enough (a copied file with a stale birth time) -- trust the name's own `--utc` suffix if it has one.
- **F**: A name with no seconds borrows them from `birthtimeMs` when the two agree on the same minute.
- **G**: Append `__am` or `__pm` based on the final 24-hour hour.

## Examples

| Input | Birth time (UTC) | Output |
|-------|-------------------|--------|
| `"My App. --2026-09-13--11-08-01--utc.png"` | `09:59:51 UTC` window | `"myapp--2026-09-13--05-08-01__am.png"` |
| `"My App__2026-09-13_AM-3-01-32.png"` | `09:01:32 UTC` | `"myapp--2026-09-13--03-01-32__am.png"` |
| `"demo-autotrader-update--Jul-06-2026.mp4"` | any | `"demo-autotrader-update--2026-07-06.mp4"` (date only, no `__am`/`__pm`) |

## Edge Cases And Limits

Composes `parseTimestamp` and `cleanPrefix` -- it is the function most
callers use directly; the other two are exported mainly so `scripts/fx-rename.ts`
can reuse the cleaning step without re-parsing a name it already parsed.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| Sep 13 2026 | v1 | Written alongside the four-function API doc set. |
