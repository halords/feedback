# ROADMAP.md

> **Current Milestone**: Comments Analysis Dashboard
> **Goal**: Transform the Comments Management module into an analytical powerhouse by adding a detailed "Analysis" tab that provides high-level insights, resolution metrics, and trend visualizations for feedback.

## Must-Haves
- [ ] **Tabbed Navigation**: Add an "Analysis" tab to the existing Comments Management UI.
- [ ] **Resolution Rate Analytics**:
    - [ ] Resolved Negative vs. Total Negative (Yearly/Monthly).
    - [ ] Resolved (Negative + Suggestions) vs. Total (Negative + Suggestions).
- [ ] **Data Trend Monthly**: Visual representation of comment types (Complaints vs. Suggestions) over the year.
- [ ] **Deep Insights**:
    - [ ] Repetitive comments analysis (pattern matching).
    - [ ] Heatmap/Ranking of offices with the most complaints.
    - [ ] Monthly breakdown view toggle.
- [ ] **Premium Visuals**: High-end charts and smooth transitions.

## Phases

### Phase 1: Analytical Data Engine
**Status**: ? Not Started
**Objective**: Update commentManagementService.ts to include efficient aggregation logic for the new metrics and create a dedicated API endpoint for analytics.

### Phase 2: UI Tab & Layout
**Status**: ? Not Started
**Objective**: Refactor src/app/comments/page.tsx to support the new tab and create the Analysis dashboard shell.

### Phase 3: Core Metric Visualizations
**Status**: ? Not Started
**Objective**: Implement the resolution gauges and monthly trend line/bar charts.

### Phase 4: Office & Pattern Analysis
**Status**: ? Not Started
**Objective**: Build the "Top Complaints by Office" and "Repetitive Issues" analysis components.

### Phase 5: Polish & Verification
**Status**: ? Not Started
**Objective**: Final visual polish, responsiveness checks, and data verification.
