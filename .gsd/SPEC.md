# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Modernize the PGLU Feedback and Analytics system into a modular, high-performance Next.js and Tailwind application. The refactor will ensure 100% feature parity with the existing system while implementing a premium UI design and a fully dynamic, read-optimized data architecture.

## Goals
1. **Modular Next.js Framework**: Migrate from Vanilla JS to a structured Next.js application using Tailwind CSS for a premium "Indigo Slate" aesthetic.
2. **Vertical Slice Refactoring**: Implement a page-by-page migration (Login -> Dashboard -> Reports -> etc.) ensuring full functionality at each step.
3. **Dynamic Data Architecture**: Eliminate hard-coded office/department lists, making the entire UI responsive to database changes in Firestore.
4. **Firestore Read Optimization**: Implement caching and efficient querying patterns to minimize database costs.
5. **Logic Preservation**: Retain 100% of existing satisfaction formulas, document coding (ADM-series), and analytics logic as defined in the source codebase.

## Non-Goals (Out of Scope)
- Adding new analytics types or changing the scoring algorithm.
- Integrating third-party authentication (strictly maintaining current credential-based system).
- Real-time collaborative editing of reports.

## Users
- **Superadmin**: Full access to all office data, consolidation reports, user management, and PDF exports.
- **Department/Office User**: Restricted access to reports and data for their specific assigned offices (fetched dynamically).

## Constraints
- **UI Fidelity**: Must match the layout and components in `UI_reference` exactly.
- **Source of Truth**: `system_map.json` must be used to validate complete feature coverage.
- **Cost Sensitivity**: Strict requirement to minimize Firestore reads to avoid subscription scaling.

## Success Criteria
- [ ] 100% feature parity compared to the original system.
- [ ] UI perfectly matches `UI_reference` (Indigo Slate Pro theme).
- [ ] Zero hard-coded office/department lists in the frontend code.
- [ ] All satisfaction formulas and PDF export document codes (ADM-series) are preserved.
- [ ] Demonstrable caching layer reducing repeated Firestore reads for static metrics.
