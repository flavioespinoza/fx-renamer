# DOC: fx-renamer -- isClean

v1 | Sep 13 2026 - 06:36 AM (MDT)

**Status:** Active
**Type:** API Reference
**Created:** Sep 13 2026

---

## Summary

Checks whether a name is already lowercase with no spaces, so `toFxName`
can leave an already-clean, timestamp-free name untouched instead of
rewriting it for no reason.

## Signature

```ts
function isClean(name: string): boolean
```

## The Regex This Replaces

```txt
/^[a-z0-9._-]*$/.test(name), or /[A-Z ]/.test(name) negated
```

## Why The Regex Version Gets Risky

A character class regex like this one is easy to get subtly wrong on the
first pass -- forgetting to include the dot before an extension, or
using `[a-z]` without the `i` flag and then negating the wrong thing.
The plain-string version tests exactly the two properties that actually
matter, no more and no fewer.

## The Plain-String Way

```ts
isClean("mynotesdraft.png")   // true
isClean("My Notes Draft.PNG") // false
```

## How It Works

- **A**: Walk the string one character at a time.
- **B**: A literal space character fails the check immediately.
- **C**: A character that differs from its own lowercased form (`ch !== ch.toLowerCase()`) fails the check immediately -- this is the plain-string way to detect an uppercase letter without an `[A-Z]` class.
- **D**: No failing character found -- the name is clean.

## Examples

| Input | Result |
|-------|--------|
| `"cleanshot-x--settings__v5.png"` | `true` |
| `"My App.png"` | `false` |

## Edge Cases And Limits

Does not check for periods, underscores, or double dashes -- those are
`cleanPrefix`'s job. `isClean` only gates the one case in `toFxName` where
no timestamp was found at all: an already-clean name with nothing to fix
is returned as-is rather than run back through `cleanPrefix`.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| Sep 13 2026 | v1 | Written alongside the four-function API doc set. |
