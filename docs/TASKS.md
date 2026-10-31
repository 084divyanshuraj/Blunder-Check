# TASKS: Blunder Check

How to use: give an agent ONE task id ("do T2.3, follow AGENTS.md"). Each task is 20-60 min. A task is done only when its **Done when** line is true and `typecheck` + `test` + `build` pass.
Lanes: **A** core lib, **B** UI, **C** API (see AGENTS.md). Run A and B in parallel after M0. C starts when A's libs exist.

Already in this pack (don't rewrite): `schemas/*`, `types/index.ts`, `lib/verification.ts`, `lib/scoring.ts`, `lib/reconcile.ts` (+ 22 tests), `scripts/build-mock.ts`, demo texts, `analysis.mock.json`.

Clock guide (started ~9 PM Sat; feature freeze 11:00 AM; **submit by 2:00 PM**, hard deadline 5:00 PM):
M0 ≈ 30 min · M1/M2 ≈ 5 h · M3 in parallel ≈ 5 h · M4 ≈ 2 h · M5 ≈ 2 h · M6 ≈ 2 h · buffer 3 h. Sleep somewhere in the middle while agents run.

---
## M0: Setup (solo, you or one agent)
**T0.1** Create the project: `npx create-next-app@latest blunder-check` (TypeScript, Tailwind, App Router, ESLint, `@/*` alias, no `src/`). Copy this pack's files over the new project root (keep `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `docs/`, `schemas/`, `types/`, `lib/`, `scripts/`, `public/demo/`, `vitest.config.ts`, `.env.example`). `npm i zod @google/genai framer-motion unpdf` and `npm i -D vitest tsx`. Add scripts: `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`. Ensure `tsconfig` includes `scripts`. Init git, push to a PUBLIC GitHub repo.
**Done when:** `npm test` shows 22 passing, `npm run typecheck` and `npm run build` pass, `npx tsx scripts/build-mock.ts` prints the summary (score 1).

**T0.2** Create `.env.local` from `.env.example` with real keys. Write `scripts/gemini-smoke.ts` that calls Gemini with JSON output and prints the result.
**Done when:** the script prints valid JSON. (If the model id fails, change `GEMINI_MODEL`.)

---
## M1: Core lib (Lane A)
**T1.1** `lib/gemini.ts`: `generateJson<T>()` exactly as in CONTRACTS §4 (JSON mode, Zod validation, one retry with the error appended, timeout, 429/5xx backoff). Unit-test the retry logic with a fake client.
**Done when:** tests pass; smoke script uses it.

**T1.2** `lib/text.ts` (`cleanText`, `truncateToLimit`, `titleFromText`), `lib/jina.ts` (`fetchViaJina(url)` + `assertSafeUrl(url)`), tests for cleaning and URL checks (localhost, private IPs, non-http schemes rejected).
**Done when:** tests pass; fetching a real public page returns clean text > 200 chars.

**T1.3** `lib/pdf.ts`: `extractPdfText(buffer)` with `unpdf`; rejects empty text (scanned PDFs) with `pdf_unreadable`.
**Done when:** a real text PDF extracts; an image-only PDF gives the clean error.

**T1.4** `lib/prompts.ts`: the three prompts from `docs/PROMPTS.md` as builders (`buildChecklistPrompt`, `buildExtractPrompt`, `buildAnalyzePrompt`). `buildAnalyzePrompt` formats verified claims with server ids and passes `today`. Unit-test the formatting.
**Done when:** snapshot tests pass and no prompt contains raw source text outside `<source>` tags.

**T1.5** `lib/pipeline.ts` (client-side orchestrator): runs ingest → checklist → extract (concurrency 3) → analyze, emits `PipelineStage` updates, assembles an `Analysis`, stores to localStorage (try/catch). Takes injected `fetch` so it is testable.
**Done when:** with a mocked `fetch`, a run over the scholarship demo produces a schema-valid `Analysis`; one failing extract call yields a warning, not a crash.

---
## M2: API (Lane C, needs M1)
**T2.1** `app/api/checklist/route.ts`. **Done when:** `curl` with the scholarship question returns a schema-valid checklist.
**T2.2** `app/api/ingest/url/route.ts` and `app/api/ingest/pdf/route.ts`. **Done when:** a public URL and a text PDF both return a `SourceRecord`; bad scheme, private host and 6 MB PDF return the right error codes.
**T2.3** `app/api/extract/route.ts` (Gemini call 2 → `buildVerifiedClaims` + `buildVerifiedDateSignals`). **Done when:** running on `s1-official-page.txt` returns ≥ 6 claims with `verification.status !== "unverified"` for most; unverified ones are kept and counted.
**T2.4** `app/api/analyze/route.ts` (Gemini call 3 → `finalizeAnalysis`). **Done when:** returns a schema-valid `AnalyzeResult`; model-invented claim ids are ignored.
**T2.5** `scripts/smoke.ts`: runs the scholarship case through all routes against a running dev server and prints the findings vs the ground truth in `docs/DEMO_CASES.md`.
**BACKEND GATE (target hour ~6-8):** the smoke script finds issues #1, #2, #3 and #6. If not, tune `docs/PROMPTS.md` prompts before touching the UI.

---
## M3: UI (Lane B: starts at M0, uses the mock)
**T3.1** Design tokens, fonts, layout shell, `DisclaimerFooter`, `EvidenceStatus` pill. **Done when:** a page shows all three label variants in light-on-dark with correct contrast.
**T3.2** Setup screen: `ResearchInput`, `SourceList`, `URLInput`, `PasteInput`, `PDFUploader`, `DemoPicker` (can be wired to stubs). **Done when:** you can add/remove sources, see statuses, and "Analyze" enables correctly.
**T3.3** `EvaluationBar` + `EvaluationScore` + factors panel, animated. **Done when:** mock score +1.0 renders at 60% fill with the factor list; reduced-motion respected.
**T3.4** Findings: `BlunderCard` (side-by-side evidence), `MissedMoveCard`, `HangingPieceCard`, `BestMoveList` (ranked, checkable, copy button). **Done when:** the mock renders all sections in the order of UI_SPEC §3.
**T3.5** `EvidenceDrawer` with `<mark>` highlight from `verification.start/end`, scroll-into-view, verification badge + tooltip, tabs for multiple quotes. **Done when:** clicking any quote in the mock opens the right source scrolled to the highlighted text.
**T3.6** `CoverageOverview` (table; matrix as P1), warnings list, scope note, rejected-quote count. **Done when:** the empty row for "Appeal process" is visually obvious.
**T3.7** `AnalysisLoader` (move list), error + retry states, partial-result banner, mobile layout. **Done when:** each state in UI_SPEC "States to design" can be shown (use a `?state=` dev switch or Storybook-less test page).
**T3.8** Wire to `lib/pipeline.ts` (after T1.5 + M2): Analyze button runs the real flow; demo picker loads sources from `public/demo/`. **Done when:** the scholarship case runs live end-to-end in the browser.

---
## M4: Demo reliability (hour ~12-14)
**T4.1** `scripts/snapshot-demo.ts`: run a case through the live app/routes and save `public/demo/<case>/analysis.cached.json` (`mode: "demo_cached"`). Do it for scholarship, hostel and your real case. **Done when:** "Load demo → instant result" works with the network off.
**T4.2** Add the real case (DEMO_CASES.md case 3). Save raw texts + cached result.
**T4.3** Add a "Paste text" fallback hint on every URL failure, a global error boundary, and a "Use cached demo" button if live analysis fails twice.
**Done when:** you can run the full demo flow 3 times in a row without a failure, including once with Wi-Fi off.

---
## M5: Polish (only after M4)
**T5.1** Coverage matrix (items × sources heat-cells). **T5.2** Print-friendly "Verify next" checklist / copy-to-clipboard. **T5.3** Page `<title>`, favicon, OG image, empty-state copy, accessibility pass (keyboard nav, focus rings, aria labels). **T5.4** Lighthouse/mobile check on the deployed URL.

## M6: Submission
**T6.1** Deploy to Vercel with env vars set; open the live URL in a private window and run the demo. **T6.2** README + project description from `docs/SUBMISSION_TEMPLATE.md`. **T6.3** Record the 2-minute demo video (script in the template). **T6.4** Check repo is public, no `.env.local`, `.env.example` present. **T6.5** Submit on Unista via the Rounds section. **Do not wait for the deadline.**

---
## P2 (ONLY if everything above is done and stable)
Blunder Replay (fix a conflict → show the bar change) · Opponent mode (adversarial agent attacks the user's plan using the gaps) · source-trust hints for official domains (.gov/.edu/.ac.in).
