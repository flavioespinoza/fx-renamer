import assert from "node:assert/strict"
import { test } from "node:test"
import { toFxName } from "./fx-name.ts"

// Birth times are the real capture instants; 3:43:27 AM MDT on Sep 13 2026 is 09:43:27 UTC.
const utc = (h: number, m: number, s: number) => Date.UTC(2026, 8, 13, h, m, s)

const cases: Array<[string, number, string]> = [
	["My App__2026-09-13_2.44_AM.png", utc(8, 44, 12), "my-app--2026-09-13--02-44-12--am.png"],
	["My App__2026-09-13_AM-3-01-32.png", utc(9, 1, 32), "my-app--2026-09-13--03-01-32--am.png"],
	["My-app--2026-09-13--09-59-51--utc.png", utc(9, 59, 51), "my-app--2026-09-13--03-59-51--am.png"],
	["notes--iterm-2-notes--2026-09-13--10-54-12--utc.png", utc(10, 54, 12), "notes--iterm-2-notes--2026-09-13--04-54-12--am.png"],
	["my-app --issue-74 --2026-09-13--10-27-22--utc.png", utc(10, 27, 22), "my-app--issue-74--2026-09-13--04-27-22--am.png"],
	["my-app--2026-09-13 --09-44--17.png", utc(9, 44, 17), "my-app--2026-09-13--03-44-17--am.png"],
	["my-app--2026-09-13--09-36-41.png", utc(9, 36, 41), "my-app--2026-09-13--03-36-41--am.png"],
	["my-app--issue-74--ui-css-bug--scroll-y_overflow__2026-09-13_AM-3-25-22.png", utc(9, 25, 22), "my-app--issue-74--ui-css-bug--scroll-y-overflow--2026-09-13--03-25-22--am.png"],
	["wispr--dictionary--double--2026-09-13--10-37-42--utc.png", utc(10, 37, 42), "wispr--dictionary--double--2026-09-13--04-37-42--am.png"],
	["cleanshot-x--settings__v5.png", utc(9, 0, 0), "cleanshot-x--settings__v5.png"],
	["Notes. --2026-09-13--11-08-01--utc.png", utc(11, 8, 1), "notes--2026-09-13--05-08-01--am.png"],
]

for (const [input, birth, expected] of cases) {
	test(input + " -> " + expected, () => {
		assert.equal(toFxName(input, birth), expected)
	})
}

test("UTC after midnight rolls the Mountain date back", () => {
	assert.equal(toFxName("demo--2026-09-14--02-10-05--utc.png", Date.UTC(2026, 8, 14, 2, 10, 5)), "demo--2026-09-13--20-10-05--pm.png")
})

test("winter capture uses Mountain Standard Time", () => {
	assert.equal(toFxName("demo--2026-12-01--17-00-00--utc.png", Date.UTC(2026, 11, 1, 17, 0, 0)), "demo--2026-12-01--10-00-00--am.png")
})

test("a copied file with a stale birth time trusts the --utc ending", () => {
	assert.equal(toFxName("demo--2026-09-13--09-00-00--utc.png", Date.UTC(2027, 0, 1)), "demo--2026-09-13--03-00-00--am.png")
})

test("12 PM and 12 AM", () => {
	assert.equal(toFxName("x__2026-09-13_PM-12-05-00.png", Date.UTC(2026, 8, 13, 18, 5, 0)), "x--2026-09-13--12-05-00--pm.png")
	assert.equal(toFxName("x__2026-09-13_AM-12-05-00.png", Date.UTC(2026, 8, 13, 6, 5, 0)), "x--2026-09-13--00-05-00--am.png")
})

test("no timestamp: spaces and periods removed, lowercased, extension kept", () => {
	assert.equal(toFxName("My Notes Draft.PNG", Date.UTC(2026, 8, 13)), "my-notes-draft.png")
	assert.equal(toFxName("Swim.AI - IoT Realtime Data Visualization.mp4", Date.UTC(2026, 0, 1)), "swimai-iot-realtime-data-visualization.mp4")
})

test("CleanShot older default with a month name", () => {
	assert.equal(toFxName("Presenter__July-31-2026_04.49.PM.mp4", Date.UTC(2026, 6, 31, 22, 49, 30)), "presenter--2026-07-31--16-49-30--pm.mp4")
})

test("month name, time, and a trailing word; periods in the title removed", () => {
	assert.equal(toFxName("Demo v2.1 -- Deliverable Status__July-28-2026_11.43.PM-converted.mp4", Date.UTC(2026, 6, 29, 5, 43, 10)), "demo-v21--deliverable-status--2026-07-28--23-43-10--converted--pm.mp4")
})

test("em dash, brackets, and a spaced hyphen in a window title", () => {
	assert.equal(toFxName("Review — demo-ui__August-04-2026_10.43.PM.mp4", Date.UTC(2020, 0, 1)), "review--demo-ui--2026-08-04--22-43-00--pm.mp4")
	assert.equal(toFxName("Meet - [Team Code Review] Pre-Work Onboarding Session__July-08-2026_05.15.PM.mp4", Date.UTC(2020, 0, 1)), "meet-team-code-review-pre-work-onboarding-session--2026-07-08--17-15-00--pm.mp4")
})

test("date only with a short month", () => {
	assert.equal(toFxName("demo-autotrader-update--Jul-06-2026.mp4", Date.UTC(2026, 6, 6)), "demo-autotrader-update--2026-07-06.mp4")
})

test("a browser window title: the browser is dropped, words are dashed", () => {
	assert.equal(toFxName("Google Chrome--code-preferences-help (Channel… Mercor - 19 new items - Slack__2026-09-18_8.04_PM.png", Date.UTC(2026, 8, 19, 2, 4, 11)), "code-preferences-help-channel-mercor-19-new-items-slack--2026-09-18--20-04-11--pm.png")
})

test("an FX name read again is left alone, not pushed 12 hours ahead", () => {
	const once = "code-preferences-help-channel-mercor-19-new-items-slack--2026-09-18--20-04-11--pm.png"
	assert.equal(toFxName(once, Date.UTC(2026, 8, 19, 2, 4, 11)), once)
	assert.equal(toFxName("demo--2026-09-18--09-15-00--am.png", Date.UTC(2026, 8, 18, 15, 15, 0)), "demo--2026-09-18--09-15-00--am.png")
})

test("an older __pm name moves to the --pm tag without shifting the hour", () => {
	assert.equal(toFxName("demo--2026-09-18--20-04-11__pm.png", Date.UTC(2026, 8, 19, 2, 4, 11)), "demo--2026-09-18--20-04-11--pm.png")
})

test("the CleanShot pattern on both Macs since Sep 18 2026: %a--%t__%y-%m-%d_%H.%M.%S--utc", () => {
	assert.equal(toFxName("Google Chrome--code-preferences-help (Channel… Mercor - 19 new items - Slack__2026-09-19_02.04.11--utc.png", Date.UTC(2026, 8, 19, 2, 4, 11)), "code-preferences-help-channel-mercor-19-new-items-slack--2026-09-18--20-04-11--pm.png")
})
