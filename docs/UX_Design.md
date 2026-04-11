# User Experience (UX) Design Specifications - DeltaSpend

## 1. Design Philosophy
* **Data Democratization:** Translate complex data tables into intuitive charts and AI-driven conclusions. The user shouldn't need to parse data; they only need to understand the insights.
* **Silent & Zero-Friction:** Minimize pop-ups. Aside from critical asset-saving actions (like subscription alerts), all analytical processing should happen silently in the background, visible only when requested.

## 2. Core Module Interaction Guidelines

### 2.1 Dashboard & Auto-Ledger Flow (Phase 1.0)
* **Home State:** The top navigation prominently displays total monthly expenditure and the $\Delta$ trend graph (Green = Savings, Red = Overspending).
* **Floating Action Button (FAB):** A persistent "+" button at the bottom of the screen. Tapping expands options for [Scan Receipt] and [Manual Entry].
* **Chart Interactions:** Daily/Weekly/Monthly/Annual reports utilize top-level Tab navigation with smooth sliding transitions for the charts below. Tapping a pie chart slice drills down into the specific receipts for that category.

### 2.2 Subscription Management Center (Phase 1.0)
* **Interruption UI:** When a suspected subscription is detected, utilize a non-aggressive Bottom Sheet modal.
    * *Copy Example:* "Detected a $9.99 charge for Apple Services. Is this a regular subscription?"
    * *Action Area:* [Yes, snooze for 6 months] / [No, flag for review]
* **Timeline Cards:** The Free Trial Manager uses a vertical timeline layout. Cards closer to the billing date shift toward a red hue, accompanied by a visual countdown indicator (e.g., an hourglass icon).

### 2.3 The $\Delta$ Insights Room (Phase 2.0 & 3.0)
* **Market Tickers:** Borrowing visual metaphors from stock market apps, item lists feature explicit percentage indicators for price fluctuations ($\uparrow$ / $\downarrow$).
* **AI Insight Cards:** A fixed, single-sentence AI summary sits above the charts.
    * *Interaction:* If the user sees "Personal care spending is up 15% this month," tapping the card expands it into a detailed radar chart and baseline analysis.
* **Interactive Budget Sliders:** The budget planner features bi-directional sliders. As the user drags the "Target Total" slider, sub-category budgets ripple and adjust dynamically, creating a strong sense of financial control.

### 2.4 Social Split Mode (Phase 4.0)
* **Frictionless Onboarding:** Support joining groups via QR code scanning or deep-linking through messaging apps.
* **Dynamic Ledger Feed:** Group expenses are displayed in a chat-bubble-style waterfall feed, clearly showing "[Avatar] uploaded a receipt + Paid $X".
* **One-Tap Settlement Page:** The final report utilizes a node-graph animation to visualize the transfer network (e.g., User A's avatar points to User B's avatar with "$50" on the connecting line). Includes a long-press action to copy exact transfer amounts and payment IDs.
