# SUBMISSION_TEMPLATE

Everything you must hand in on Unista: **Project name**, **Project description** (mandatory, detailed), **GitHub repo link** (mandatory, public, with README). Optional but worth it: **live demo link**, **demo video**. Submission window: 31 Oct 10:00 AM → **1 Nov 5:00 PM** (submit by 2:00 PM).

---
## Project name
Blunder Check: Find what the sources aren't telling you

(One-liner: *An AI-assisted information-gap detector that analyses research like a chess engine: eval bar, blunders, missed moves, and a ranked "best move" verification checklist, all traceable to verified source quotes.*)

---
## Project description (paste into Unista; fill the {{…}} after you've built it)

**Problem.** People make decisions about scholarships, admissions, visas and public services from information scattered across websites and documents. Sources are outdated, disagree, or silently skip things that matter. Search finds pages and summarisers condense them, but neither tells the user **what is missing, what conflicts, and what to verify before acting**.

**Solution.** Blunder Check takes a research question and 2-6 sources (URLs, PDFs, pasted text) and produces: an expected-coverage checklist (what a complete answer needs), claims extracted with exact quotations, detected conflicts and outdated information, the items no source covers ("dark spots"), an explainable **Information Position** score, and a prioritised **verify-next checklist**. Every finding links to the evidence behind it.

**How it works.**
1. *Sources:* Jina Reader for URLs, server-side PDF text extraction, or pasted text.
2. *Expected coverage:* Gemini proposes what a complete answer must cover for this kind of decision.
3. *Claim extraction:* per source, Gemini returns claims with verbatim quotes and any visible dates.
4. *Code verifies:* every quote is matched against its own source text in TypeScript. Unmatched quotes are excluded and counted. Models never create ids; evidence is attached by code.
5. *Analysis:* Gemini proposes conflicts, outdated information, gaps and next steps by citing claim ids only. Code reconciles them (a conflict needs verified claims from ≥ 2 sources; "outdated" needs a visible date/cycle; any checklist item with no verified claim is always a gap).
6. *Score:* a deterministic, versioned formula computes the Information Position (−5…+5) with a visible "why this score" breakdown. The AI never picks the number.
7. *Dashboard:* chess-style analysis board with an evidence drawer that highlights the exact verified quote in the source.

**Features.** Expected-coverage checklist · evidence-linked findings · programmatic quote verification with Verified badges · conflict side-by-side view · staleness warnings only when a date/cycle is visible · Sourced / AI-inferred / Unknown labels on everything · prioritised verify-next checklist · coverage view showing dark spots · partial-failure handling · cached synthetic demo cases + real-source case.

**What makes it different.** It doesn't answer the question; it audits the evidence. It reports what is *absent* and *disputed*, separates sourced facts from AI suggestions, and makes the AI's evidence checkable (quote verification, deterministic scoring). A generic chatbot or summary can't do this.

**Tech stack.** Next.js (App Router) + TypeScript, Tailwind, Framer Motion, Zod, Gemini API (structured JSON), Jina Reader, unpdf, Vitest; deployed on Vercel. No database: state in the browser.

**Responsible AI and limitations.** Findings are *potential* gaps/signals, not facts. Absence in the reviewed sources does not mean absence in reality. A verified quote proves the text exists in the source, not that the AI's interpretation is correct. The score is an indicator of information completeness and consistency, not the safety of a decision. Dates are never inferred. Scanned PDFs are not OCR'd. Some pages (login walls, JS-only) can't be fetched; users can paste text.

**Future scope.** Blunder Replay (watch the score change as you resolve gaps) · Opponent mode (an adversarial agent that attacks your plan using the gaps) · source-trust signals for official domains · OCR for scanned PDFs · browser extension for research-as-you-browse · shareable analyses with saved history.

---
## README.md skeleton
```
# Blunder Check
> Find what the sources aren't telling you.
[Live demo](…) · [Demo video](…)
![screenshot](docs/screenshot.png)

## What it does   (3 bullets + the chess metaphor table)
## Try it in 60 seconds   (Load demo case → Analyze → open a conflict → open the evidence)
## How it works   (pipeline diagram from docs/ARCHITECTURE.md)
## Why you can trust the evidence
  - quotes verified in code · models never choose ids/scores · scoped absence · visible dates only
## Run locally
  npm i && cp .env.example .env.local   # add GEMINI_API_KEY
  npm run dev
## Tests   npm test   (verification, scoring, reconcile)
## Limitations
## Tech stack
## Project structure
```
Add a screenshot of the dashboard before you submit.

---
## 2-minute demo video script
| Time | Show | Say |
|---|---|---|
| 0:00-0:15 | Setup screen | "Scholarship decisions rely on scattered pages. Search finds them, summaries condense them, but nothing tells you what's *missing*. That's Blunder Check." |
| 0:15-0:35 | Load scholarship demo, click Analyze; move list ticks | "Four sources: official page, a blog, an aggregator and a PDF notice. It first plans what a complete answer needs, then reads each source." |
| 0:35-1:00 | Eval bar springs to +1.0; "Why this score?" | "Information Position: +1.0. Deterministic and explainable: the AI never picks it." |
| 1:00-1:25 | Open the deadline conflict → drawer highlights the quote | "Three sources, three deadlines. Each quote is verified against the source text, with a badge. The notice is the newest." |
| 1:25-1:45 | Missed moves + coverage empty row | "No source covers renewal conditions or appeals. These are the dark spots, scoped to the sources reviewed." |
| 1:45-2:00 | Verify-next list + disclaimer | "A ranked checklist of what to confirm, and where. Potential gaps, not guaranteed facts." |
Optional 10 s at the end: the real-source case.

## Submission checklist
- [ ] Repo public; README + screenshot; `.env.example` present; **no `.env.local` / keys in git history**
- [ ] Vercel deployment works in a private window (env vars set)
- [ ] Demo runs 3× in a row; works offline via cached demo
- [ ] Project description pasted and proof-read; limitations section included
- [ ] Video uploaded (unlisted link is fine) and link tested
- [ ] Submitted on Unista **with the same account used to register**, before 2:00 PM
