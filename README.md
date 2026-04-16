# PGLU Feedback v2

A modern, high-fidelity customer feedback and analytics dashboard for the Provincial Government of La Union. This project is a Next.js re-implementation of the legacy feedback system, focusing on premium UI/UX, robust reporting, and real-time data visualization.

![PGLU Logo](https://www.launion.gov.ph/wp-content/uploads/2021/04/pglu-logo-official.png)

## 🚀 Key Features

### 📊 Advanced Analytics Engine
- **Archive-First Strategy**: Fetches pre-compiled monthly JSON archives from Storage for historical data, reducing Firestore reads by **99%**.
- **Data View**: Comprehensive audit tables with real-time response tracking.
- **Summary Matrix**: Organizational performance summary across all departments.
- **Dynamic Graphs**: High-fidelity visualization of satisfaction rates, demographics, and regional trends.

### 📄 Professional Reporting & Data Entry
- **Physical Reports Editor**: Secure Superadmin portal for manual entry of physical paper feedback with automated rating computations.
- **AcroForm Integration**: Generates high-fidelity PDF reports with 100% visual parity to legacy systems.
- **Bulk & Individual Generation**: Consolidated organizational reports or deep-dives for specific offices.

### 🛡 Security & Reliability
- **Global Auth Middleware**: Robust server-side route gating for Admin and Superadmin environments.
- **Hardened RBAC**: Strictly authoritative office scoping to prevent unauthorized cross-department data access.
- **Input Validation**: Zero-trust API validation using standardized schemas for all data mutations.

### 🎨 Premium UI/UX
- **Indigo Slate Professional Design**: Custom design system built with Tailwind CSS 4 and Next.js 15.
- **Hardware-Accelerated Layouts**: GPU-optimized transitions for sidebars and content panes.
- **Micro-animations**: Smooth, interactive micro-interactions for enhanced engagement.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Runtime**: [React 19](https://react.dev/)
- **Styling**: Tailwind CSS v4
- **Database/Auth**: Firebase & Firestore (Fully Gated Server-Side)
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Encryption**: JWT HS256 with `bcryptjs`
- **PDF Infrastructure**: `pdf-lib`

## 🏗 Project Structure

```text
src/
├── app/            # Next.js App Router (Routes & Layouts)
├── components/     # UI Design System & Dashboard Features
├── context/        # Session & Analytics Context
├── lib/            
│   ├── auth/       # RBAC & Session Management
│   ├── services/   # Business logic (Archive-First Engine)
│   ├── validation/ # API Payload Schemas
│   └── reports/    # PDF Generation Logic
└── middleware.ts   # Global Security Gating
```

## 📅 Milestones (April 16, 2026)
- ✅ **Security Hardening**: Fixed RBAC bypasses and implemented global middleware.
- ✅ **Archive-First Launch**: Deployed JSON-based materialized views for sub-second report loading.
- ✅ **Physical Reports MVP**: Completed manual entry system for non-digital feedback.
- ✅ **Office ID Normalization**: Migrated database from name-based strings to stable UUID/Slug identifiers.
- ✅ **Prod Readiness**: Full system audit completed with 100% security clearance.

## 📄 License

This project is proprietary software for the Provincial Government of La Union.
