# SCORING_SPEC: Information Position (v1)

**What it is:** an explainable indicator of how completely and consistently the *reviewed sources* establish what a complete answer needs. Range `-5.0 … +5.0`, one decimal.
**What it is not:** a probability that a decision is safe, or a claim that the information is true. UI label is always **"Information Position"**, with the line "Based on reviewed sources only."
**Who computes it:** `lib/scoring.ts` only. Gemini never chooses it. Version string `SCORING_VERSION = "v1"` is stored with every result; bump it if any number below changes.

## Inputs
- Checklist items, each with `importance` (high=3, medium=2, low=1 weight).
- A coverage **status** per item, derived in code:
  | Status | Meaning | Credit |
  |---|---|---|
  | `covered` | ≥ 1 verified claim and no flag | 1.0 |
  | `conflicted` | verified claims exist but a reconciled **conflict** blunder is on this item | 0.5 |
  | `unanswered` | verified claims exist but the item is flagged as only mentioned / not fully established | 0.4 |
  | `missing` | no verified claim at all | 0.0 |
  If an item is both conflicted and unanswered, the lower credit wins (unanswered).
- `outdatedCount`: number of reconciled **outdated** blunders (each already requires a visible date/cycle).
- `verifiedClaimCount`.

## Formula
```
coverage = Σ(weight × credit) / Σ(weight)                   ∈ [0, 1]
base     = -5 + 10 × coverage
value    = base − min(1.5, 0.5 × outdatedCount)             # staleness penalty
cap      = 2.0 if any HIGH item is missing
           3.0 else if any HIGH item is conflicted/unanswered
value    = min(value, cap)                                   # "high-importance gap cap"
value    = clamp(value, -5, +5), rounded to 1 decimal
if verifiedClaimCount == 0:  value = -5
```
Why the cap: the position should never look comfortable while something that decides the outcome (a high-importance item) is unknown or disputed.

## Output (`ScoreResult`)
`value`, `coverage` (3 dp), `version`, `factors[]` (first factor = coverage start value; then staleness, then cap, each with a plain-English `detail`), `capApplied`. The UI shows the factors as "Why this score".

## Worked examples (also in `lib/__tests__/scoring.test.ts`)
Checklist: c1,c2,c3 = high; c4,c5,c6 = medium; c7,c8 = low → total weight 9+6+2 = **17**.

| # | Statuses | Calculation | Result |
|---|---|---|---|
| A | all covered | coverage 1.0 → base +5.0 | **+5.0** |
| B | c1,c4,c5,c7 covered; c2 conflicted; c6 unanswered; c3,c8 missing; 1 outdated | credit = 3+1.5+0+2+2+0.8+1+0 = 10.3 → coverage 0.606 → base 1.06 → −0.5 = 0.56; cap 2.0 not binding | **+0.6** |
| C | all covered except c3 (high) missing | 14/17 = 0.824 → base 3.24 → cap 2.0 | **+2.0** |
| D | all covered except c2 (high) conflicted | 15.5/17 = 0.912 → base 4.12 → cap 3.0 | **+3.0** |
| E | no verified claims | n/a | **−5.0** |
| F | all covered, 9 outdated warnings | penalty capped at 1.5 → 5 − 1.5 | **+3.5** |

Demo scholarship case (`analysis.mock.json`): 9 items, weight 20, credit 13.0 → coverage 0.65 → base +1.5 → 1 outdated −0.5 → **+1.0**.

## Display bands (UI only)
`≥ +3.0` "Well established" · `+0.5 … +2.9` "Partly established" · `−1.9 … +0.4` "Significant gaps" · `≤ −2.0` "Largely unestablished". Always paired with the number and the factors, never alone.
