// fx-rename -- rename files in place to FX names.
//
//   node scripts/fx-rename.ts [--dry-run] [--include-tracked] [--min-age-ms N] [--newer-than EPOCH_MS] <file-or-folder>...
//
// Skips: dot files, folders inside a folder, files Git already tracks (renaming those breaks links
// already published; pass --include-tracked to override), files younger than --min-age-ms (default
// 3000) so an app still writing is left alone, and files created before --newer-than. Renaming does
// not change a file's created or modified date. Every rename is logged to _tmp/fx-rename.log.
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { toFxName } from "../modules/fx-name/fx-name.ts"

const USAGE = "usage: node scripts/fx-rename.ts [--dry-run] [--include-tracked] [--min-age-ms N] [--newer-than EPOCH_MS] <file-or-folder>..."
const args = process.argv.slice(2)
const flagIndex = (flag: string): number => args.indexOf(flag)
const flagValue = (flag: string): number | null => (flagIndex(flag) >= 0 ? Number(args[flagIndex(flag) + 1]) : null)
const dryRun = args.includes("--dry-run")
const includeTracked = args.includes("--include-tracked")
const minAgeMs = flagValue("--min-age-ms") ?? 3000
const newerThanMs = flagValue("--newer-than") ?? 0
const valueIndexes = [flagIndex("--min-age-ms"), flagIndex("--newer-than")].filter((i) => i >= 0).map((i) => i + 1)
const targets = args.filter((a, i) => !a.startsWith("--") && !valueIndexes.includes(i))
const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "_tmp", "fx-rename.log")

function isTracked(file: string): boolean {
	try {
		execFileSync("git", ["-C", path.dirname(file), "ls-files", "--error-unmatch", path.basename(file)], { stdio: "ignore" })
		return true
	} catch {
		return false
	}
}

function log(line: string): void {
	fs.mkdirSync(path.dirname(logFile), { recursive: true })
	fs.appendFileSync(logFile, new Date().toISOString() + " " + line + os.EOL)
	console.log(line)
}

function filesFrom(target: string): string[] {
	if (!fs.statSync(target).isDirectory()) return [target]
	return fs
		.readdirSync(target)
		.filter((n) => !n.startsWith("."))
		.map((n) => path.join(target, n))
		.filter((f) => fs.statSync(f).isFile())
}

if (targets.length === 0) {
	console.error(USAGE)
	process.exit(2)
}

let count = 0
for (const file of targets.flatMap(filesFrom)) {
	const name = path.basename(file)
	const dir = path.dirname(file)
	const stat = fs.statSync(file)
	if (Date.now() - stat.mtimeMs < minAgeMs) continue
	if (newerThanMs && stat.birthtimeMs < newerThanMs) continue
	if (!includeTracked && isTracked(file)) continue
	let next = toFxName(name, stat.birthtimeMs)
	if (next === name) continue
	// On a case-insensitive disk "Jul" and "jul" are the same file, which is not a clash.
	const sameFile = (candidate: string): boolean => {
		try {
			return fs.statSync(path.join(dir, candidate)).ino === stat.ino
		} catch {
			return false
		}
	}
	const dot = next.lastIndexOf(".")
	const stem = dot > 0 ? next.slice(0, dot) : next
	const ext = dot > 0 ? next.slice(dot) : ""
	for (let n = 2; fs.existsSync(path.join(dir, next)) && !sameFile(next); n++) next = stem + "--" + n + ext
	if (dryRun) {
		console.log("would rename: " + name + " -> " + next)
	} else if (sameFile(next)) {
		const temp = path.join(dir, ".fx-rename-" + process.pid + "-" + Date.now())
		fs.renameSync(file, temp)
		fs.renameSync(temp, path.join(dir, next))
		log("renamed: " + path.join(dir, name) + " -> " + next)
	} else {
		fs.renameSync(file, path.join(dir, next))
		log("renamed: " + path.join(dir, name) + " -> " + next)
	}
	count++
}
console.log((dryRun ? "would rename " : "renamed ") + count + " file(s)")
