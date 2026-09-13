# fx-renamer

File-name utilities. The first one renames screenshots and screen recordings to clean, sortable names the moment they land in a folder.

## The Rename Rule

- **A**: **Lowercase** -- every letter.
- **B**: **Remove Spaces and Periods** -- every space and every period is removed, except the dot before the extension.
- **C**: **Keep Double Dashes** -- a `--` typed or dictated into the name stays, so `my-app --issue-74` becomes `my-app--issue-74`.
- **D**: **One Timestamp Shape** -- `YYYY-MM-DD--HH-MM-SS`, 24-hour, zero-padded, in the home time zone (America/Denver by default).
- **E**: **Reads Many Inputs** -- CleanShot X names with AM or PM before or after the time, 24-hour names, UTC names ending in `--utc`, and month-name dates like `July-08-2026_05.15.PM`. The file's own creation time decides whether a time was UTC or local.
- **F**: **An AM or PM Tag at the End** -- every name with a known time gets `__am` or `__pm` appended right before the extension, so the hour reads at a glance without decoding 24-hour time. A date-only name (no time in it at all) gets no tag.

```txt
My App. --2026-09-13--11-08-01--utc.png   ->   myapp--2026-09-13--05-08-01__am.png
My App__2026-09-13_AM-3-01-32.png         ->   myapp--2026-09-13--03-01-32__am.png
```

Renaming never changes a file's created or modified date, so sorting by date keeps working.

## Import It

```ts
import { toFxName } from "fx-renamer/fx-name"

toFxName("My App. --2026-09-13--11-08-01--utc.png", Date.now())
// "myapp--2026-09-13--05-08-01__am.png"
```

## Functions

Full documentation for every function, with its signature, how it works
step by step, and worked examples, lives in [`_docs/`](_docs/DOC__fx-renamer--api--overview.md):

| Function | Doc |
|----------|-----|
| `toFxName` | [`DOC__fx-renamer--api--to-fx-name.md`](_docs/DOC__fx-renamer--api--to-fx-name.md) |
| `parseTimestamp` | [`DOC__fx-renamer--api--parse-timestamp.md`](_docs/DOC__fx-renamer--api--parse-timestamp.md) |
| `cleanPrefix` | [`DOC__fx-renamer--api--clean-prefix.md`](_docs/DOC__fx-renamer--api--clean-prefix.md) |
| `isClean` | [`DOC__fx-renamer--api--is-clean.md`](_docs/DOC__fx-renamer--api--is-clean.md) |

[`DOC__fx-renamer--cookbook--filename-patterns.md`](_docs/DOC__fx-renamer--cookbook--filename-patterns.md)
lists every capture-tool naming shape currently recognized, and the honest
gaps -- including macOS's own default screenshot name, which is not
recognized yet -- as a starting list for the next addition.

## Use

```bash
npm install
npm test
node scripts/fx-rename.ts --dry-run ~/Pictures/Screenshots
node scripts/fx-rename.ts ~/Pictures/Screenshots
```

- **G**: **Dry Run First** -- `--dry-run` prints every rename and changes nothing.
- **H**: **Safe by Default** -- files tracked by Git are skipped (pass `--include-tracked` to override), files still being written are skipped (`--min-age-ms`, default 3000), and `--newer-than EPOCH_MS` limits renames to newer files.

## Watch a Folder (macOS)

```bash
scripts/install-watch.sh ~/Pictures/Screenshots
```

A launch agent renames each new file about five seconds after it lands. Files already in the folder are left alone. Every rename is logged to `_tmp/fx-rename.log`.

## Add a Module

`fx-renamer` is an ES module package run by Node's built-in TypeScript support (Node 23.6 or newer, no build step).

- **I**: **Where** -- one folder per utility under `modules/`, with its test beside it: `modules/{name}/{name}.ts` and `modules/{name}/{name}.test.ts`.
- **J**: **Export It** -- add `"./{name}": "./modules/{name}/{name}.ts"` to `exports` in `package.json`.
- **K**: **Code Style** -- plain string calls instead of regex, double-quoted strings, and strings joined with `+`.
