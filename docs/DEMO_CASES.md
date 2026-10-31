# DEMO_CASES: Blunder Check

Judges want to see **real or clearly identified sample sources**. Two synthetic cases ship in `public/demo/` (every source file starts with a "SYNTHETIC SAMPLE SOURCE" line and the UI shows a "Synthetic sample" tag). Add **one real case** yourself (see bottom): it is the most convincing 30 seconds of the demo.

Files per case: `meta.json` (question, goal, source list), `s*.txt` (source texts). Scholarship also has `analysis.mock.json` (offline build, see `scripts/build-mock.ts`).

---
## Case 1: Scholarship application (`public/demo/scholarship/`)
**Question:** What should I verify before applying for the Aurora Merit Scholarship 2026-27?
**Sources:** s1 official page (updated 12 Aug 2026) · s2 university blog (3 Sep 2026) · s3 ScholarHub listing (2025-26 cycle, updated 4 Jan 2026) · s4 foundation notice PDF (10 Oct 2026).

**Planted issues (ground truth; a good run finds all of these):**
| # | Type | What is planted | Evidence |
|---|---|---|---|
| 1 | **Conflict: deadline** | 15 Nov (s1) vs 22 Nov (s4, newer notice) vs 30 Nov (s2) | s1 "last date … 15 November 2026"; s4 "extended to 22 November 2026"; s2 "applications close on 30 November 2026" |
| 2 | **Conflict: income proof** | s2 says income certificate **or ITR acknowledgement**; s4 says ITR acknowledgements are **not** accepted and the certificate must be ≤ 6 months old | s2 vs s4 |
| 3 | **Outdated** | s3 describes the **2025-26** cycle (income ₹5,00,000, 80%, Rs. 40,000, last date 20 Dec 2025) | s3 "Aurora Merit Scholarship 2025-26", "Updated: 4 January 2026" |
| 4 | **Unanswered: renewal** | s2 says it "may be renewed … check … the renewal conditions" and no source gives them | s2 |
| 5 | **Unanswered: selection** | s1 only says shortlisted candidates are notified by email: no criteria or timeline | s1 |
| 6 | **Missing: appeal / grievance** | no source mentions it | none (gap) |
| 7 | Covered, agrees | eligibility (85%, income < Rs. 6,00,000, age ≤ 22), award Rs. 50,000, online-portal-only, contact email | s1 (+ s2 on award) |

**Expected shape of the result:** 2 conflicts + 1 outdated (+ optionally s1 flagged as superseded by s4); renewal and selection unanswered; appeals missing; verify-next ranks the deadline first. The hand-built mock (`analysis.mock.json`) gives Information Position **+1.0** ("Partly established"); a live run will differ slightly because the model writes its own checklist.

**Talk track (60 s):** "Four sources, three different deadlines. Blunder Check shows the two quotes side by side, verified against the source text, and ranks 'confirm the real deadline' first. It also tells me what NO source covers: renewal rules and how to appeal."

---
## Case 2: College hostel allotment (`public/demo/hostel/`)
**Question:** What should I verify before paying for a hostel room at Northfield Institute for 2026-27?
**Sources:** s1 official allotment page (20 Jul 2026) · s2 student forum post (2 Aug 2026) · s3 Student Handbook PDF **2025-26** (June 2025).

| # | Type | Planted | Evidence |
|---|---|---|---|
| 1 | **Conflict: fee** | Rs. 68,000 in two instalments (s1) vs Rs. 72,000 "including mess charges" (s2) | s1 / s2 |
| 2 | **Conflict: documents** | s1: admission letter, 2 photos, guardian declaration; s2: admission letter + medical fitness certificate | s1 / s2 |
| 3 | **Conflict: gate time** | 9:30 PM (s1) vs "around 10 PM" (s2) vs 9:00 PM (s3, old) | low severity |
| 4 | **Outdated** | s3 is the 2025-26 handbook (Rs. 61,000, single instalment, before 10 Aug 2025) | s3 |
| 5 | **Missing** | refund / cancellation policy; caution deposit; whether mess is included in s1's fee; room-sharing rules | none |
| 6 | **Weak source** | s2 is an unofficial forum post | label only; do not claim authority from it |

---
## Case 3 (you add this): a REAL case
Pick something real you can open in a browser and that has 3-4 sources with messy overlap, e.g. a real scholarship (official page + a news article + an aggregator + the official PDF notice), a college admission/fee page, or a government service page. Steps:
1. Collect 3-4 URLs/PDFs. Run them through the live app. Fix anything that breaks.
2. Save the sources + result with `scripts/snapshot-demo.ts` as `public/demo/real-1/` so it works with no network on demo day.
3. In the README, state that the real sources were captured on a date, and findings are potential signals.
Do not claim the real case's findings are verified facts; say "potential gap in the reviewed sources".

---
## Test fixtures for agents
- Lane A can unit-test extraction prompts against `s1-official-page.txt` etc.: every planted quote in `scripts/build-mock.ts` is a known-good verbatim string.
- Lane B builds the whole UI against `analysis.mock.json` first.
- Lane C's smoke script (T2.5) runs the scholarship case through all four routes and checks that issues 1-3 and 6 above appear.
