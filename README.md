# DeltaSpend

DeltaSpend is an AI-assisted personal finance product that helps users turn everyday spending records into actionable financial awareness.

Current milestone: `1.0 Core Ledger & Subscription Guard`

Live app: [https://delta-spend.vercel.app](https://delta-spend.vercel.app)

## Product Summary

DeltaSpend starts with a simple user problem: people want to understand where their money goes, but manual expense tracking is tedious and subscription leakage is easy to miss.

The 1.0 product focuses on building the first reliable data loop:

- Capture expenses with low friction
- Turn receipts and screenshots into structured spending records
- Visualize spending patterns through a dashboard
- Detect recurring charges that may become subscription leakage
- Help users track free trials before they convert into paid plans

This project is designed as a phased AI product, moving from expense capture in 1.0 toward price intelligence, budget strategy, and group settlement in later versions.

## Product Management Focus

This project reflects my work across product strategy, UX definition, AI workflow design, and implementation coordination.

- Defined the 1.0 MVP scope around a tight product loop: capture, structure, review, analyze, and guard
- Prioritized subscription detection and trial reminders as practical user value before broader AI insight features
- Designed a human-in-the-loop receipt parsing flow so users can review, edit, save, or delete AI-generated entries
- Planned a staged roadmap from 1.0 to 4.0 instead of overloading the first release
- Balanced recruiter-facing live demo needs with a backend architecture that can support future AI capabilities

## Current 1.0 Build

DeltaSpend 1.0 includes:

- `Auth`: email magic-link sign-in
- `Dashboard`: spending totals, trend chart, category breakdown, and recent expenses
- `Expense capture`: manual entry plus receipt/screenshot upload, parse, auto-save, review, edit, and delete
- `Subscription guard`: recurring charge candidates, confirmation bottom sheet, snooze/dismiss/flag actions, and free-trial reminders
- `Backend foundation`: Supabase-backed auth, database, storage, and Edge Function workflows

The current navigation exposes:

- `/auth`
- `/dashboard`
- `/subscriptions`

`/expenses` currently redirects to `/dashboard` because expense capture and review are embedded directly inside the dashboard flow in 1.0.

## Preview

The live app is the primary review path. Screenshots below show the current UI direction and later product concepts.

![Dashboard preview](./docs/screenshots/dashboard.png)

![Subscriptions preview](./docs/screenshots/subscriptions.png)

![AI insights preview](./docs/screenshots/insights.png)

![Groups preview](./docs/screenshots/groups.png)

## Roadmap To 4.0

DeltaSpend is planned as a four-phase product.

### 1.0 Core Ledger & Subscription Guard

Goal: establish the core data loop and reduce manual tracking friction.

- Receipt and screenshot-assisted expense capture
- Manual entry fallback
- Spending dashboard
- Subscription candidate detection
- Free-trial reminder tracking

### 2.0 AI Price Insights & Baseline Benchmarking

Goal: help users understand how prices are changing over time.

- Delta Index for personal inflation and item-level price movement
- Movers & Shakers list for steepest price increases or drops
- Baseline price comparison for common goods

### 3.0 Smart Consumption Strategist

Goal: turn spending data into proactive financial guidance.

- Future price baseline prediction
- Discount quality checks against historical prices
- AI-guided budget reshaping and smart trimming recommendations

### 4.0 Social & Collaborative Settlement

Goal: expand DeltaSpend into shared financial scenarios.

- Scenario-based groups for travel, dining, roommates, and events
- Shared receipt upload and payer tagging
- Optimized settlement graph showing who owes whom and how much

## AI Workflow

The 1.0 AI workflow is intentionally designed around reviewability rather than full automation.

- Users upload a receipt or spending screenshot
- The backend creates a parse job and extracts structured expense fields
- The app auto-saves a draft expense
- Users review merchant, amount, category, date, notes, and line items
- Users can save edits or delete the generated entry

This keeps the AI useful while preserving user control over financial records.

## Technical Foundation

The product is implemented with:

- React 19, Vite, and TypeScript
- React Router and TanStack React Query
- Supabase Auth, Postgres, Storage, and Edge Functions
- Recharts for dashboard visualization
- Tailwind CSS v4
- Vercel deployment

## Notes

- Google AI Studio is not required to run or review this project.
- External reviewers can use the live app directly; they do not need to configure Supabase.
- The 1.0 app is the current shipped milestone. 2.0 through 4.0 are roadmap stages, not current production navigation.
