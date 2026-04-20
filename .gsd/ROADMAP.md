# ROADMAP.md

> **Current Milestone**: AI-INSIGHTS-V5
> **Goal**: Integrate Gemini AI to provide deep trend analysis and automated reporting for departments and the organization as a whole.

## Must-Haves
- [ ] Gemini API integration (Next.js Server-side).
- [ ] Aggregated data provider for trends (Monthly rating, collection, Citizen's Charter).
- [ ] AI-Generated Report Page (Dynamic rendering of insights and charts).
- [ ] "Generate AI Analysis" buttons for per-office and organizational views.
- [ ] Full Year Organization-wide analysis.

## Phases

### Phase 1: Gemini Setup & Data Aggregator
**Status**: ⬜ Not Started
**Objective**: Configure Gemini API on the server and create a robust data aggregator that fetches and prepares multi-month trends for AI analysis.

### Phase 2: Structured Analysis Engine
**Status**: ⬜ Not Started
**Objective**: Implement prompt engineering and structured JSON output handling to ensure Gemini returns useful, data-backed insights and chart configurations.

### Phase 3: Dynamic Report View (Custom Page)
**Status**: ⬜ Not Started
**Objective**: Build a dedicated `/analytics/ai-report` route that renders AI-generated insights using a premium, printable layout with dynamic charts.

### Phase 4: UI Integration & "New Tab" Feature
**Status**: ⬜ Not Started
**Objective**: Add AI trigger points in the Dashboard and Office views, implementing the "Open in New Tab" functionality as requested.

### Phase 5: RBAC & Security Hardening
**Status**: ⬜ Not Started
**Objective**: Secure the AI routes to prevent unauthorized data access and audit the rendering logic for security against injection.
