# Blunder Check ♟️
> **Find what the sources aren't telling you.**  
> *An AI-assisted evidence-auditing decision cockpit that analyzes research dossiers like a chess engine: Eval Bar, Blunders, Missed Moves, and a prioritized Best Move verification checklist, all strictly traceable to verified source quotes.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-52%2F52%20Passing-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash-orange?style=flat&logo=google)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)

Built for the **Shinchan Online Hackathon 2026**  
**Problem Statement:** *"Digital Dark Spot: AI-Assisted Information Gap & Conflict Detection Platform"*

---

## 🎯 The Problem: Digital Dark Spots
When making high-stakes decisions (scholarships, university admissions, visas, public schemes), users rely on information scattered across websites, student blogs, aggregator listings, and PDF circulars.

- **Search engines** find pages.
- **AI summarizers** condense them.
- **Neither system tells the user what is CONFLICTING, what is OUTDATED, and what is MISSING.**

Generic chatbots fail this brief because they passively synthesize inaccuracies or hallucinate facts. **Blunder Check does not answer questions—it audits the evidence.**

---

## ♟️ The Chess Metaphor

| Chess Concept | Blunder Check Meaning | Architectural Implementation |
|---|---|---|
| **Eval Bar / Score** | **Information Position** ($-5.0 \dots +5.0$) | Explainable completeness metric computed **purely in TypeScript math** in `lib/scoring.ts` (Gemini never chooses the number). |
| **Blunder (`??`)** | **Direct Contradictions & Outdated Cycles** | Flags conflicting facts across sources (e.g. 15 Nov vs 22 Nov) with verbatim quotes displayed side-by-side. |
| **Missed Move (`?!`)** | **Information Dark Spots** | Vital checklist requirements covered by **zero** reviewed sources. Scoped strictly to reviewed documents. |
| **Hanging Piece (`◎`)** | **High-Impact Unknowns** | Unverified administrative terms or legal fine print that risk disqualification. |
| **Best Move (`!`)** | **Prioritized Verify-Next Checklist** | Rank-ordered, actionable verification checklist with exact guidance on *where* to confirm each item. |

---

## 🚀 Key Features

### 1. 🛡️ "AI Proposes, Code Verifies" Architecture
- **Verbatim Quote Verification**: Every quote extracted by Gemini is checked against the raw source text using exact character offset matching in `lib/verification.ts`. Unverified quotes are **excluded from scoring** and flagged with warning badges.
- **Deterministic Math**: The Information Position score is calculated via an open mathematical formula in TypeScript—never chosen or edited by the LLM.
- **Scoped Absence**: The system reports `"Not found in the N reviewed sources"`, never stating something *"does not exist in reality"*.

### 2. 🎮 Interactive Blunder Replay Simulator
- What-if decision simulation engine running live in the browser.
- Users can simulate fixing conflicting deadlines or verifying missing dark spots; the system dynamically recomputes the Information Position and animates the Eval Bar climbing in real-time.

### 3. ⚔️ Opponent Mode (Adversarial Stress-Testing)
- Synthesizes a real-world adversarial compliance officer (e.g. *Dr. Eleanor Vance* for scholarships, *Col. R. K. Nair* for hostels, *Dame Margaret Sterling, KC* for visas).
- Formulates 3 tactical attack vectors targeting unaddressed blind spots with revealable defensive counter-moves.

### 4. 📡 Source Provenance Radar
- Automatically classifies ingested sources into **Tier 1 (Official Authority)**, **Tier 2 (Aggregator)**, and **Tier 3 (Unofficial Forum/Community)**.
- Warns users when an aggregator or blog contradicts official government guidance (*Authority Asymmetry*).

### 5. 📄 Executive Decision Dossier
- One-click export modal generating a print-ready PDF briefing and a clean Markdown audit report with an institutional sign-off block.

### 6. 🔊 Tactile Web Audio SFX Engine
- 100% offline synthesizer generating chess piece clicks, blunder chimes, and evaluation chord progressions with a global mute toggle.

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/084divyanshuraj/Blunder-Check.git
cd Blunder-Check
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
# Server-side only (never exposed to browser)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash
# Optional: Higher rate limit for Jina Reader
JINA_API_KEY=your_jina_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Test Suite

Blunder Check maintains strict test coverage across quote matching, scoring caps, provenance, and SSRF security guards:

```bash
npm test          # 52 unit tests passing across 10 test suites (Vitest)
npm run typecheck # Strict TypeScript compilation (0 errors)
npm run build     # Next.js App Router production build
```

---

## 🔍 How It Works: Pipeline Architecture

```
User Question + Ingested Sources (URLs, PDFs, Pasted Text)
                     │
                     ▼
  [Stage 1: Expected Coverage Decomposition] (Gemini Structured JSON)
  Produces checklist items [c1..cN] required for a sound decision.
                     │
                     ▼
  [Stage 2: Claim Extraction & Date Parsing] (Gemini per source)
  Extracts verbatim quotes with visible cycle years/dates.
                     │
                     ▼
  [TypeScript Gatekeeper: lib/verification.ts]
  Runs character offset & whitespace-normalized substring matching.
  Unmatched quotes are rejected and excluded from scoring.
                     │
                     ▼
  [Stage 3: Reconciliation & Conflict Analysis] (Gemini + lib/reconcile.ts)
  Detects contradictions (≥2 verified sources) and dark spots (0 claims).
                     │
                     ▼
  [Deterministic Scoring Engine: lib/scoring.ts]
  Computes Information Position (-5.0 to +5.0) with visible factor breakdown.
                     │
                     ▼
  [Decision Cockpit UI: app/studio/page.tsx]
  Interactive chess analysis board, blunder replay simulator, and evidence drawer.
```

---

## 📂 Preloaded Test Cases

Blunder Check includes 3 instant test scenarios with planted real-world failure modes:

| Demo Scenario | Sources | Planted Issues & Dark Spots |
|---|---|---|
| **Case 1: Aurora Merit Scholarship** | Official portal, student blog, aggregator, PDF circular | 3 conflicting application deadlines (15 Nov vs 22 Nov vs 30 Nov); outdated 2025-26 cycle rules; complete absence of renewal policies. |
| **Case 2: College Hostel Allotment** | Warden allotment memo, student forum FAQ, legacy handbook | Contradictory fee schedules (₹68k vs ₹72k); conflicting document checklists; unstated refund terms. |
| **Case 3: UK Global Talent Visa 2026** | GOV.UK guidance, tech solicitor portal, legacy Tech Nation PDF | Contradictory recommendation letter requirements (2 vs 3 letters); unverified Stage 2 application deadlines. |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript (strict mode, zero `any`)
- **Design System**: Tailwind CSS v4 (Midnight Black `#08080C`, Electric Cobalt `#2563EB`, Acid Lime `#CCFF00`)
- **Animations**: Framer Motion (dynamic Eval bar spring animation)
- **AI Engine**: Google Gemini API via `@google/genai` (`gemini-3.5-flash`)
- **Document Ingestion**:
  - **Web URLs**: Jina Reader (`r.jina.ai`) with SSRF private-IP blocking.
  - **PDFs**: Server-side extraction with `unpdf` (detects scanned/empty PDFs).
- **Validation**: Zod (v4)
- **Unit Testing**: Vitest (52/52 tests passing)
- **Hosting**: Vercel Serverless (zero database, zero vector DB, state in browser)

---

## ⚖️ Responsible AI & Ethical Boundaries

- **Absence is Scoped**: "Not found in the reviewed sources" is never represented as "does not exist in reality".
- **Quotes Verify Presence, Not Correctness**: A verified quote proves text exists in the source, not that the source itself is factually true.
- **Score is an Information Completeness Indicator**: It does not guarantee personal decision safety.
- **Visible Dates Only**: Flagging information as "outdated" requires an explicit date or cycle mentioned in the cited text; dates are never inferred.
- **Untrusted Input Sandboxing**: Ingested content is strictly wrapped in prompt delimiters and treated as data. No source HTML is ever rendered with `dangerouslySetInnerHTML`.

---

## 🚀 Future Roadmap

- **Browser Extension**: Real-time blunder checking while browsing across tabs.
- **OCR Engine**: Tesseract OCR fallback for scanned low-resolution PDF circulars.
- **Collaborative Review**: Team workspaces with audit logging and dispute notes.
- **Direct Integrations**: Automated dossier export to Google Docs and Notion.

---

## 👥 Author

Built solo by **Divyanshu Raj** for the **Shinchan Online Hackathon 2026**.  
*All rights reserved.*
