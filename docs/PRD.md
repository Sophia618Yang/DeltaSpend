# Product Requirements Document (PRD) - DeltaSpend

## 1. Product Vision
DeltaSpend aims to leverage Large Language Models (LLMs) and data analytics to build a frictionless, next-generation intelligent financial decision platform. Starting as an automated expense ledger, it will evolve into a personal consumption strategist and collaborative group expense manager.

## 2. Product Roadmap & Feature Specifications

### 📍 Phase 1.0: Core Ledger & Subscription Guard (MVP)
**Objective:** Establish the foundational data loop, eliminate manual entry friction, and prevent "subscription leaks."
* **1.1 Multi-Modal Expense Engine:**
    * **AI Auto-Entry:** Supports uploading shopping receipts, restaurant bills, e-commerce screenshots, and bank statements. The system automatically extracts and structures (via JSON) items, unit prices, and dates using OCR and LLMs.
    * **Manual Entry Fallback:** A minimalist manual input module for edge cases where AI extraction fails or no receipt is available.
* **1.2 Real-Time Data Dashboard:**
    * Users can seamlessly toggle between Daily, Weekly, Monthly, and Annual reports.
    * Auto-generates multi-dimensional pie charts (category distribution) and line graphs (spending trends) with real-time UI rendering.
* **1.3 Invisible Subscription Radar:**
    * **Auto-Detection:** Identifies recurring charges (e.g., Netflix, ChatGPT) from statements and prompts the user: *"Is this an intentional subscription?"*
    * **Interruption Control:** If confirmed as intentional, the system mutes alerts for this item for 6 months (global toggle available).
    * **Free Trial Manager:** Allows manual input of software trials and expiration dates, triggering an automated cancellation reminder 3 days prior to the first charge.

### 📍 Phase 2.0: AI Price Insights & Baseline Benchmarking
**Objective:** Elevate the product from a "tracker" to an "analyzer" by introducing the $\Delta$ core metric.
* **2.1 The $\Delta$ (Delta) Index:**
    * Enables Month-over-Month (MoM) and Year-over-Year (YoY) analysis of specific item categories.
    * Generates a "Movers & Shakers" list highlighting items with the steepest price hikes or drops, calculating the user's personal inflation/deflation index ($\Delta$ Index).
* **2.2 Item Baseline & Watermark Monitoring:**
    * Establishes a standardized commodity dictionary to map similar items across different users to the same category.
    * **Baseline Comparison:** Compares the extracted unit price against the system's baseline price (initially sourced via web scraping/APIs, later aggregated from an anonymized user receipt pool) to evaluate deal quality.

### 📍 Phase 3.0: Smart Consumption Strategist
**Objective:** Provide proactive decision-making support to optimize the user's budget.
* **3.1 Baseline Prediction & Discount Verification:**
    * Introduces time-series analysis models to forecast the future price baseline of specific goods.
    * **Fake Discount Detection:** Evaluates current merchant "discounts" against historical rock-bottom prices to provide a True Deal Score.
* **3.2 AI Budget Reshaping:**
    * Users input a target monthly budget; the AI analyzes historical spending structures to generate a granular budget allocation plan.
    * **Smart Trimming:** Automatically flags non-essential, high-frequency expenses (e.g., 5 coffees a week) and suggests actionable trimming strategies to meet financial goals.

### 📍 Phase 4.0: Social & Collaborative Settlement
**Objective:** Expand use cases to solve the mathematical complexities of group expenses.
* **4.1 Scenario-Based Groups:**
    * Support for creating isolated groups for "Travel," "Dining," or "Roommates" via shareable invite links/QR codes.
* **4.2 Smart Split Engine (AA):**
    * Group members can upload receipts and tag the payer.
    * The system tracks all shared expenses and generates a unified ledger upon project completion.
    * **Settlement Optimization:** Utilizes graph algorithms to minimize the number of transactions, outputting a highly optimized "Who owes whom exactly how much" execution plan.
