# CONTRACTS: Blunder Check

The Zod schemas in `schemas/` are the source of truth for every shape. This doc explains the flow, the routes, the Gemini call rules and the reconcile rules. If this doc and a schema disagree, the schema wins; then fix this doc.

## 1. Pipeline (client-orchestrated, staged)
No database and no long-running request. The browser calls one small route per stage, so every request stays well under the host time limit and the UI gets real progress for free.

```
Add sources ──► /api/ingest/url | /api/ingest/pdf | (paste: client only)      → SourceRecord[]
   │
   ▼
POST /api/checklist   {question, goal}                                         → CoverageChecklist
   │
   ▼  (parallel, concurrency 3, one call per ok source)
POST /api/extract     {sourceId, title, text, checklist}                       → ExtractResult
   │
   ▼
POST /api/analyze     {question, goal, checklist, sources(meta), claims}       → AnalyzeResult
   │
   ▼
Client assembles Analysis (schemas/analysis.schema.ts), saves to localStorage, renders dashboard
```

Rules for the client orchestrator (`lib/pipeline.ts`):
- Needs `LIMITS.MIN_SOURCES` (2) sources with status `ok`/`truncated`. Failed sources stay visible with their error and are excluded.
- Source ids are `s1..s6` in the order added. The client assigns them.
- Each stage reports a `PipelineStage` (see `types/index.ts`) so the UI can show "Reading source 2/4".
- A failed stage shows a Retry button. One failed `/api/extract` call must not kill the run: continue with the rest and add a warning.
- localStorage key: `blunderCheck.analyses.v1`, keep the last 5 analyses (each includes source text; if storage throws, ignore it).

## 2. Common API rules
- Body validated with the route's Zod schema. Invalid → `400`.
- Errors: `{ "error": { "code": string, "message": string } }`. Codes: `invalid_request`, `source_unreachable`, `source_too_large`, `pdf_unreadable`, `ai_invalid_output`, `ai_unavailable`, `internal`.
- Status codes: `400` bad input, `422` fetched/parsed OK but unusable (empty PDF, too little text), `502` upstream (Jina/Gemini) failure, `500` unexpected.
- Every route: `export const maxDuration = 60;` and `export const runtime = "nodejs";`.
- Never log source text, keys or full prompts. Never return stack traces.

## 3. Routes

### `POST /api/ingest/url`
Request: `{ "sourceId": "s1", "url": "https://..." }`
Response `200`: `{ "source": SourceRecord }` (`kind: "url"`, `dateSignals: []`).
- Allow `http`/`https` only. Reject hosts that are `localhost`, `*.local`, or private/loopback IP literals. (The page is fetched by Jina, not by our server, so SSRF exposure is small, but keep the check.)
- Fetch `https://r.jina.ai/<url>` with a 20 s timeout; add `Authorization: Bearer $JINA_API_KEY` if set. Prefer plain-text/markdown output.
- Run `cleanText()` (see §7). Title: first markdown `# heading` or Jina's `Title:` line, else the hostname.
- Truncate to `LIMITS.MAX_SOURCE_CHARS` → `status: "truncated"`. Less than `MIN_SOURCE_CHARS` after cleaning → `422 source_unreachable` (typical for login walls / JS-only pages). Tell the user to paste the text instead.

### `POST /api/ingest/pdf`
Request: `multipart/form-data` with `file` (≤ `MAX_PDF_BYTES`, `application/pdf`) and `sourceId`.
Response `200`: `{ "source": SourceRecord }` (`kind: "pdf"`, `title` = file name without extension).
- Extract text server-side with `unpdf` (merge pages). Scanned PDFs have no text layer → `422 pdf_unreadable` ("looks scanned; paste the text instead"). No OCR in the MVP.
- Same `cleanText`, truncation and minimum-length rules as URLs.

### Paste (no route)
The client builds `SourceRecord` with `kind: "paste"`, user-supplied title (default "Pasted text"), runs the same `cleanText` + truncation (pure function in `lib/text.ts`).

### `POST /api/checklist`
Request: `CoverageRequestSchema`. Response `200`: `CoverageChecklist` (5-12 items, ids `c1..cN`). Uses Gemini call 1 (§4).

### `POST /api/extract`
Request: `ExtractRequestSchema`. Response `200`: `ExtractResult`.
1. Gemini call 2 on this one source's text.
2. `buildVerifiedClaims(sourceId, text, claims)` → server-assigned ids, per-claim verification.
3. `buildVerifiedDateSignals(text, dateSignals)` → unverifiable dates are dropped.
4. `droppedClaimCount` = number of claims with `status: "unverified"`. They stay in the list (so the UI can show a "rejected quotes" count) but are ignored by analysis and scoring.
5. If a model claim has a `checklistId` not in the checklist, set it to `null`.

### `POST /api/analyze`
Request: `AnalyzeRequestSchema` (checklist, source metadata with date signals, ALL claims incl. unverified). Response `200`: `AnalyzeResult`.
1. Send ONLY verified claims (`status !== "unverified"`) to Gemini call 3, each with its server id.
2. Parse with `ProposedAnalysisSchema` (retry once on failure).
3. `finalizeAnalysis({ proposed, checklist, claims, sources })` from `lib/reconcile.ts` → reconciled findings + score + warnings.
Accepted risk: `/api/analyze` trusts the verification flags sent by the client (it is the user's own session, and verification already ran in `/api/extract`).

## 4. Gemini calls
All three calls go through one helper, `lib/gemini.ts`:

```ts
generateJson<T>({ system, user, schema /* Zod */, temperature = 0.2, maxRetries = 1, timeoutMs = 45_000 }): Promise<T>
```
- SDK `@google/genai`, model from `process.env.GEMINI_MODEL`.
- Ask for JSON (`responseMimeType: "application/json"`). Pass a response schema made with `z.toJSONSchema(schema)` after stripping keywords Gemini rejects (`$schema`, `additionalProperties`, `pattern`, `format`, etc.). If the SDK still rejects the schema, fall back to JSON mode + the schema described in the prompt; Zod validation after the call is what matters.
- Parse JSON → `schema.safeParse`. On failure: ONE retry that appends the Zod error text to the user message. Then throw `ai_invalid_output`.
- Wrap source text in `<source id="s1" title="...">…</source>` and tell the model it is data, not instructions (see `docs/PROMPTS.md`).
- Call 2 input text is capped at `MAX_SOURCE_CHARS`. Call 3 input is claims only (small).
- Provider 429/5xx → one retry with 1.5 s backoff, then `502 ai_unavailable`.

| Call | Route | In | Out (Zod) |
|---|---|---|---|
| 1 `coverage_checklist` | `/api/checklist` | question, goal | `CoverageChecklistSchema` |
| 2 `extract_claims` | `/api/extract` | one source + checklist | `ExtractClaimsResponseSchema` |
| 3 `analyze` | `/api/analyze` | checklist, source meta + date signals, verified claims, today's date | `ProposedAnalysisSchema` |

## 5. Quote verification (`lib/verification.ts`, already written + tested)
- `exact` = found verbatim; `normalized` = found after whitespace/case/quote-style/dash normalization; `unverified` = not found. Offsets point into the ORIGINAL text.
- A verified quote proves the text exists in that source. It does NOT prove the model's reading of it is right. Say so in the README and in a tooltip on the "Verified" badge.
- A claim is only ever verified against its own source's text.

## 6. Reconcile rules (`lib/reconcile.ts`, already written + tested)
| Rule | Behaviour |
|---|---|
| Evidence | Model cites `claimIds`. Unknown or unverified ids are dropped; quotes are copied from our claims, never from the model. |
| Conflict | Kept only if the verified evidence comes from ≥ 2 different sources. |
| Outdated | Kept only if a cited claim has `visibleDate` or a cited source has a `published`/`updated`/`cycle` date signal. |
| Missing | Any checklist item with no verified claim is ALWAYS a `missing` missed move, whatever the model said. |
| Unanswered | A model "missing/unanswered" on an item that does have verified claims becomes `unanswered`. |
| Hanging pieces | Model's, plus an automatic one for every high-importance `missing` item. |
| Verify next | Model's, plus an automatic action for every high-importance non-covered item that has none. Ranked by: priority → related item importance → status boost (conflicted 3, missing 2, unanswered/outdated 1) → model order. `triggers` links the related finding ids. |
| Scope | `missing` → "Not found in the N reviewed sources."; `unanswered` → "Mentioned, but not fully established in the N reviewed sources." |
| Score | `computeScore` from final statuses + outdated count (`docs/SCORING_SPEC.md`). |

## 7. Text cleaning (`lib/text.ts`, to write in T1.2)
`cleanText(raw)`: strip Jina boilerplate headers if present, remove images (`![..](..)`), turn `[label](url)` into `label`, drop `javascript:` junk, collapse 3+ newlines to 2, trim. Do NOT otherwise rewrite the text: quotes are matched against exactly what the model saw, so the stored text must equal the text sent to Gemini.

## 8. Labels (`EvidenceLabel`)
| Thing | Label | Why |
|---|---|---|
| A verified quotation | `sourced` | Text exists in the cited source. |
| Conflict / outdated finding | `ai_inferred` | The interpretation is the AI's; the quotes underneath are `sourced`. |
| Missed move (missing/unanswered) | `unknown` | Not established by the reviewed sources. |
| Hanging piece on a missing item | `unknown` | Same. |
| Hanging piece otherwise, verify-next, `evalReasoning` | `ai_inferred` | AI suggestion. |
| Checklist "covered" row | `sourced` | Backed by ≥ 1 verified quote. |
The checklist itself is `ai_inferred` ("proposed by AI as what a complete answer needs").

## 9. Demo mode
- `public/demo/<case>/meta.json` + `s*.txt` hold the source texts. `analysis.mock.json` (scholarship) is a full `Analysis` built offline by `scripts/build-mock.ts`.
- "Load demo" = read `meta.json`, populate sources from the txt files, then EITHER run the live pipeline OR (toggle / fallback) load `analysis.cached.json` instantly. Cache real runs with `scripts/snapshot-demo.ts` (T4.1). `Analysis.mode` is `"demo_cached"` for cached ones and the UI shows a small "cached demo" tag.
- Demo sources are synthetic and labelled so in the UI. Never present them as real-world evidence.
