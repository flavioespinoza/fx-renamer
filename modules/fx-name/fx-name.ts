// fx-name -- turn a screenshot or recording file name into an FX-style name.
//
// Output shape: {prefix}--YYYY-MM-DD--HH-MM-SS[--suffix]--am|pm.{ext}, lowercase, Mountain time,
// 24-hour, zero-padded, with an --am or --pm tag appended after any known time. Flavio's rule for
// image names: words joined by single dashes, every period removed except the extension's dot. Date-only names
// carry no clock time, so no --am or --pm tag is added. No regex anywhere in this project: plain
// string calls only.
//
// UTC or local: CleanShot X writes the timestamp in UTC only when "Use UTC time zone" is checked,
// and a name may or may not end in "--utc". The file's own creation time settles it: the reading
// (UTC or Mountain) that lands within two minutes of the birth time wins.

export const HOME_TIME_ZONE = "America/Denver"
const TOLERANCE_MS = 2 * 60 * 1000
const SEPARATORS = " ._-"

type Token = { text: string; start: number }

type Parsed = {
	prefix: string
	year: number
	month: number
	day: number
	hour: number
	minute: number
	second: number | null
	utcHint: boolean
	suffix: string
	dateOnly: boolean
}

const MONTHS: Record<string, number> = {
	jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
	jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
	oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}

function tokenize(text: string): Token[] {
	const tokens: Token[] = []
	let start = -1
	for (let i = 0; i <= text.length; i++) {
		const ch = i < text.length ? text[i] : " "
		const isSeparator = SEPARATORS.includes(ch)
		if (!isSeparator && start < 0) start = i
		if (isSeparator && start >= 0) {
			tokens.push({ text: text.slice(start, i), start: start })
			start = -1
		}
	}
	return tokens
}

function isDigits(value: string, minLength: number, maxLength: number): boolean {
	if (value.length < minLength || value.length > maxLength) return false
	for (const ch of value) {
		if (ch < "0" || ch > "9") return false
	}
	return true
}

function isAmPm(value: string): boolean {
	const lower = value.toLowerCase()
	return lower === "am" || lower === "pm"
}

function to24(hour: number, ampm: string): number {
	// Already 24-hour (an FX name read a second time: 20-04-11--pm): keep it, never add 12 again.
	if (hour > 12) return hour
	const pm = ampm.toLowerCase() === "pm"
	if (hour === 12) return pm ? 12 : 0
	return pm ? hour + 12 : hour
}

/** Try to read a timestamp that starts at token i and runs to the end of the name. */
function matchAt(base: string, t: Token[], i: number): Parsed | null {
	const n = t.length
	const at = (k: number): string => (k < n ? t[k].text : "")
	const prefix = base.slice(0, t[i].start)
	const rest = (k: number): string => (k < n ? base.slice(t[k].start) : "")

	// Numeric date: 2026-09-13
	if (isDigits(at(i), 4, 4) && isDigits(at(i + 1), 2, 2) && isDigits(at(i + 2), 2, 2)) {
		const year = Number(at(i))
		const month = Number(at(i + 1))
		const day = Number(at(i + 2))
		const j = i + 3
		// AM or PM before the time: 2026-09-13_AM-3-01-32
		if (isAmPm(at(j)) && isDigits(at(j + 1), 1, 2) && isDigits(at(j + 2), 2, 2)) {
			let k = j + 3
			let second: number | null = null
			if (isDigits(at(k), 2, 2)) second = Number(at(k++))
			if (k === n) return { prefix: prefix, year: year, month: month, day: day, hour: to24(Number(at(j + 1)), at(j)), minute: Number(at(j + 2)), second: second, utcHint: false, suffix: "", dateOnly: false }
		}
		if (isDigits(at(j), 1, 2) && isDigits(at(j + 1), 2, 2)) {
			let k = j + 2
			let second: number | null = null
			if (isDigits(at(k), 2, 2)) second = Number(at(k++))
			// AM or PM after the time: 2026-09-13_2.44_AM
			if (isAmPm(at(k)) && k + 1 === n) return { prefix: prefix, year: year, month: month, day: day, hour: to24(Number(at(j)), at(k)), minute: Number(at(j + 1)), second: second, utcHint: false, suffix: "", dateOnly: false }
			// 24-hour or UTC: 2026-09-13--09-59-51--utc
			let utcHint = false
			if (at(k).toLowerCase() === "utc") {
				utcHint = true
				k++
			}
			if (k === n && Number(at(j)) <= 23) return { prefix: prefix, year: year, month: month, day: day, hour: Number(at(j)), minute: Number(at(j + 1)), second: second, utcHint: utcHint, suffix: "", dateOnly: false }
		}
		return null
	}

	// Month name: July-08-2026
	const monthNumber = MONTHS[at(i).toLowerCase()] ?? 0
	if (monthNumber > 0 && isDigits(at(i + 1), 1, 2) && isDigits(at(i + 2), 4, 4)) {
		const day = Number(at(i + 1))
		const year = Number(at(i + 2))
		const j = i + 3
		// CleanShot's older default: July-08-2026_05.15.PM, sometimes followed by -converted
		if (isDigits(at(j), 1, 2) && isDigits(at(j + 1), 2, 2)) {
			let k = j + 2
			let second: number | null = null
			if (isDigits(at(k), 2, 2)) second = Number(at(k++))
			if (isAmPm(at(k))) return { prefix: prefix, year: year, month: monthNumber, day: day, hour: to24(Number(at(j)), at(k)), minute: Number(at(j + 1)), second: second, utcHint: false, suffix: rest(k + 1), dateOnly: false }
		}
		// A date with no time: Jul-06-2026
		return { prefix: prefix, year: year, month: monthNumber, day: day, hour: 0, minute: 0, second: 0, utcHint: false, suffix: rest(j), dateOnly: true }
	}
	return null
}

export function parseTimestamp(base: string): Parsed | null {
	const t = tokenize(base)
	for (let i = t.length - 1; i >= 0; i--) {
		const found = matchAt(base, t, i)
		if (found) return found
	}
	return null
}

const FORMAT: Intl.DateTimeFormatOptions = { hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }

function partsIn(epochMs: number, timeZone: string): Record<string, string> {
	const out: Record<string, string> = {}
	for (const p of new Intl.DateTimeFormat("en-US", { ...FORMAT, timeZone: timeZone }).formatToParts(new Date(epochMs))) out[p.type] = p.value
	return out
}

/** Offset of a time zone from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(epochMs: number, timeZone: string): number {
	const p = partsIn(epochMs, timeZone)
	const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
	return asUtc - Math.floor(epochMs / 1000) * 1000
}

function localToEpoch(p: Parsed, second: number, timeZone: string): number {
	const guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, second)
	const first = guess - zoneOffsetMs(guess, timeZone)
	return guess - zoneOffsetMs(first, timeZone)
}

// The browser or editor a capture came from says nothing about what is in it (Flavio, Sep 18 2026).
const DROPPED_APPS = ["google chrome", "chrome", "brave browser", "brave", "safari", "arc", "firefox", "microsoft edge", "visual studio code", "code", "cursor", "iterm2", "ghostty", "terminal"]

/** Drop a leading browser name when a window title follows it: "Google Chrome--code-preferences-help". */
function dropApp(raw: string): string {
	const cut = raw.indexOf("--")
	if (cut < 0) return raw
	const head = raw.slice(0, cut).trim().toLowerCase()
	return DROPPED_APPS.includes(head) ? raw.slice(cut + 2) : raw
}

/**
 * Flavio's rule: lowercase, every word its own dash-joined piece, no periods, FX double dashes kept.
 * Sep 18 2026: "logically rename stuff", so spaces become single dashes instead of vanishing.
 */
export function cleanPrefix(raw: string): string {
	let s = dropApp(raw).toLowerCase()
	s = s.replaceAll("—", "--").replaceAll("–", "--")
	s = s.replaceAll("…", " ").replaceAll("[", " ").replaceAll("]", " ").replaceAll("(", " ").replaceAll(")", " ")
	s = s.replaceAll(".", "")
	s = s.replaceAll("__", "--").replaceAll("_", "-")
	while (s.includes("  ")) s = s.replaceAll("  ", " ")
	// A double dash is an FX break and keeps its spaces off; a spaced single hyphen is just a word gap.
	s = s.replaceAll(" --", "--").replaceAll("-- ", "--")
	s = s.replaceAll(" - ", "-").replaceAll(" -", "-").replaceAll("- ", "-")
	s = s.replaceAll(" ", "-")
	let kept = ""
	for (const ch of s) {
		if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") || ch === "-") kept += ch
	}
	while (kept.includes("---")) kept = kept.replaceAll("---", "--")
	while (kept.startsWith("-")) kept = kept.slice(1)
	while (kept.endsWith("-")) kept = kept.slice(0, -1)
	return kept
}

export function isClean(name: string): boolean {
	for (const ch of name) {
		if (ch === " " || ch !== ch.toLowerCase()) return false
	}
	return true
}

function pad(n: number): string {
	return String(n).padStart(2, "0")
}

/**
 * The FX name for a file. birthtimeMs is the file's creation time, used to tell UTC from local and
 * to fill in missing seconds. Returns the name unchanged when there is nothing to fix.
 */
export function toFxName(fileName: string, birthtimeMs: number, timeZone: string = HOME_TIME_ZONE): string {
	const trimmed = fileName.trim()
	const dot = trimmed.lastIndexOf(".")
	const base = dot > 0 ? trimmed.slice(0, dot) : trimmed
	const ext = dot > 0 ? trimmed.slice(dot).toLowerCase() : ""
	const p = parseTimestamp(base)
	if (!p) return isClean(trimmed) ? trimmed : cleanPrefix(base) + ext

	const prefix = cleanPrefix(p.prefix)
	const lead = prefix ? prefix + "--" : ""
	const tail = p.suffix ? "--" + cleanPrefix(p.suffix) : ""
	if (p.dateOnly) return lead + p.year + "-" + pad(p.month) + "-" + pad(p.day) + tail + ext

	const sec = p.second ?? 0
	const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, sec)
	const asLocal = localToEpoch(p, sec, timeZone)
	const dUtc = Math.abs(asUtc - birthtimeMs)
	const dLocal = Math.abs(asLocal - birthtimeMs)
	let epoch: number
	if (dUtc <= TOLERANCE_MS || dLocal <= TOLERANCE_MS) epoch = dUtc < dLocal ? asUtc : asLocal
	else epoch = p.utcHint ? asUtc : asLocal
	// Seconds were not in the name: borrow them from the birth time when it is the same minute.
	if (p.second === null && Math.abs(epoch - birthtimeMs) < 60 * 1000) epoch = Math.floor(birthtimeMs / 1000) * 1000

	const q = partsIn(epoch, timeZone)
	const ampm = Number(q.hour) < 12 ? "--am" : "--pm"
	return lead + q.year + "-" + q.month + "-" + q.day + "--" + q.hour + "-" + q.minute + "-" + q.second + tail + ampm + ext
}
