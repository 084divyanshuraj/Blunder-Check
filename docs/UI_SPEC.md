# UI_SPEC: Blunder Check

Goal: judges understand the gap in 5 seconds without reading. The chess metaphor is the memorable part: **keep it clean, not gimmicky.** Build against `public/demo/scholarship/analysis.mock.json` first (no backend needed).

## Direction
Dark "analysis board" look (like a chess analysis page): calm dark surfaces, one green accent, red/amber only for risk. A faint 8×8 checkerboard pattern (≤ 4% opacity) in the header only. Monospace for quotes/evidence, a clean sans for everything else. Fonts: Inter (UI) + JetBrains Mono (quotes) via `next/font`.

Tokens (CSS variables in `globals.css`, also mapped in Tailwind):
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0f1115` | page |
| `--surface` | `#171a21` | cards |
| `--surface-2` | `#1f232c` | raised / hover |
| `--border` | `#2a2f3a` | lines |
| `--text` | `#e8eaed` | primary text |
| `--muted` | `#9aa3b2` | secondary text |
| `--good` | `#7fa650` | sourced / covered / best move |
| `--warn` | `#d9a441` | AI-inferred / unanswered / mistakes |
| `--bad` | `#e5534b` | blunder / conflict |
| `--unknown` | `#8b93a7` | unknown / missing |
Text on surfaces must keep ≥ 4.5:1 contrast. Respect `prefers-reduced-motion` (no spring bar, no stagger).

## Screens
### 1. Setup (`/`)
- Header: product name, tagline "Research like a chess engine: find what the sources are NOT telling you."
- Card A: **Question** (textarea) + **Goal** (input).
- Card B: **Sources** (2-6): tabs `URL` · `PDF` · `Paste text`; list below showing each source: kind icon, title, char count, status chip (`Ready` / `Truncated` / `Failed: reason`), remove button. Failed URL shows "Couldn't read this page. Paste the text instead."
- Buttons: **Analyze** (disabled until question + goal + ≥ 2 usable sources) and **Load demo case** (dropdown: Scholarship, Hostel, + real case if added). Demo sources show a "Synthetic sample" tag.
- Footer: disclaimer.

### 2. Running (same route, replaces Card B)
"Move list" progress, like PGN notation:
```
1. Planning checklist .......... ✓
2. Reading s1 Official page .... ✓
3. Reading s2 University blog .. …
4. Analysing gaps and conflicts  ○
```
Each row = one `PipelineStage`/source. Show per-row error + Retry. Under 60 s total; never a blank screen.

### 3. Dashboard (`/analysis` or same page, state-driven)
Layout (desktop): left column = **Eval bar + score**; centre = findings; right = **Evidence drawer** (slides in on click). Mobile: bar becomes a horizontal strip above findings, drawer becomes a bottom sheet.

Sections, in order:
1. **Information Position**: vertical eval bar + big number (e.g. `+1.0`) + band text ("Partly established") + one-line `evalReasoning` tagged `AI-inferred`. Button "Why this score?" expands `score.factors` (each: label, ±points, detail). If `capApplied`, show a note "Capped because …".
2. **Best moves (Verify next)**, ranked 1…N. Each: rank, action, reason, "Where to verify", priority chip, link-chips to the findings it relates to (`triggers`), a checkbox to tick off (state only). Print/Copy button copies the checklist as plain text.
3. **Blunders** (conflicts, outdated): card with `??` badge, description, severity, and **evidence pairs side by side** (quote, source title, `Verified` badge). Click quote → opens drawer scrolled to it.
4. **Missed moves**: `?!` badge, item text, kind chip (`Not found` / `Mentioned only`), `scope` line, "why it matters".
5. **Hanging pieces**: `◎` badge, short cards for high-impact unresolved items.
6. **Coverage**: table: checklist item · importance · status chip · source dots (one dot per source that has a verified claim). Optional P1 upgrade: item × source matrix (cells coloured by claim count). This is the "dark spot" visual: empty row = nothing found.
7. **Warnings + scope**: `warnings[]` list, `scopeNote`, rejected-quote count ("2 extracted quotes were excluded: not found in their source"), and the permanent **disclaimer**.

Chess badges (text, not images): Blunder `??` · Missed move `?!` · Hanging piece `◎` · Best move `!` · Verified quote `✓`. Each badge also has a visible word label.

### 4. Evidence drawer
- Source title, kind icon, "Open original" link (url sources only, `rel="noopener noreferrer"`), date signals as chips ("Updated 12 August 2026").
- Full extracted text in a scrollable monospace pane. The matched quote is wrapped in `<mark>` using `verification.start/end` (slice the string in React; **no** `dangerouslySetInnerHTML`). Auto-scroll the mark into view.
- Badge: `Verified: exact match` or `Verified: matched after whitespace/punctuation normalization`. Tooltip: "Verified = this text exists in the source. It does not prove the AI's interpretation is right."
- If the evidence came from a conflict, show the other quote(s) as tabs in the drawer.

## Eval bar
- Vertical, 28 px × 360 px (desktop), rounded; light fill rises from the bottom, dark top. Mapping `fillPercent = (score + 5) / 10 × 100`. Number label sits inside the bar near the boundary, flips side so it stays readable. Centre tick at 0.
- Animation (Framer Motion): on first render the fill springs from 50% to target (`stiffness 90, damping 18`); during the running screen, nudge the bar as each stage completes (cosmetic only: final value is always the computed one).
- `aria-label="Information Position +1.0 of range −5 to +5"`; never rely on colour alone.

## Evidence labels (component `EvidenceStatus`)
`Sourced` (green, check icon) · `AI-inferred` (amber, sparkle icon) · `Unknown` (grey-red, question icon). Pill with icon + text, 12 px. Appears on every finding, on `evalReasoning`, on the checklist, and on each quote (`Sourced`).

## Components (see `docs/ARCHITECTURE.md` §5 for tree)
`ResearchInput`, `SourceList`, `URLInput`, `PDFUploader`, `PasteInput`, `AnalysisLoader` (move list), `EvaluationBar`, `EvaluationScore` (+ factors), `BestMoveList`, `BlunderCard`, `MissedMoveCard`, `HangingPieceCard`, `CoverageOverview`, `EvidenceDrawer` (`SourceViewer`, `QuoteHighlight`, `VerificationBadge`), `EvidenceStatus`, `DisclaimerFooter`, `DemoPicker`.

## States to design (judges will hit these)
Empty · adding a source (spinner) · source failed (inline, keeps going) · running · partial result (some sources failed → warning banner) · AI error (retry) · result · result from cached demo ("Cached demo" tag) · zero findings ("No conflicts found in the reviewed sources. This is not proof none exist.").

## Copy rules
Use "potential", "in the reviewed sources", "not found in the N reviewed sources". Never "safe", "guaranteed", "does not exist". The product calls the number **Information Position**, never "safety".
