# PGLU Feedback v2

A modern, high-fidelity customer feedback and analytics dashboard for the Provincial Government of La Union. This project is a Next.js re-implementation of the legacy feedback system, focusing on premium UI/UX, robust reporting, and real-time data visualization.

![PGLU Logo](https://www.launion.gov.ph/wp-content/uploads/2021/04/pglu-logo-official.png)

## 🚀 Key Features

### 📊 Advanced Analytics Engine
- **Data View**: Comprehensive audit tables with real-time response tracking.
- **Summary Matrix**: Organizational performance summary across all departments.
- **Dynamic Graphs**: High-fidelity visualization of satisfaction rates, demographics, and regional trends.
- **Trend Analysis**: Monitor performance shifts over custom date ranges.
- **Performance Optimized**: Server-side range sweep filtering for 90%+ Firestore read reduction.

### 📄 Professional Reporting (PDF)
- **AcroForm Integration**: Generates high-fidelity PDF reports with 100% visual parity to legacy systems.
- **Bulk & Individual Generation**: Consolidated organizational reports or deep-dives for specific offices.
- **Data Centering & Auto-filling**: Automated mapping of Firestore data to PDF templates.

### 👤 User & Office Management
- **RBAC (Role-Based Access Control)**: Granular permissions for Superadmins and Department-level users.
- **Data Isolation**: Users only see responses and analytics relevant to their assigned offices.
- **Office Management**: Full CRUD for government offices with soft-disable and user-assignment syncing.

### 🎨 Premium UI/UX
- **Indigo Slate Professional Design**: Custom design system built with Tailwind CSS and Next.js.
- **Manual Toggle Sidebar**: Persistent, user-controllable navigation layout.
- **Performance Indicators**: Global page-transition progress bar and descriptive skeleton loaders.
- **Micro-animations**: Smooth transitions and interactive elements using standard CSS keyframes.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Modern Theme v4)
- **Database/Auth**: Firebase & Firestore
- **State Management**: React Context API + SWR
- **Icons**: Lucide React
- **PDF Generation**: `pdf-lib` with AcroForm support

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/feedbackV2.git
   cd feedbackV2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add your Firebase configurations.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🏗 Project Structure

```text
src/
├── app/            # Next.js App Router (Routes & Layouts)
├── components/     # Reusable UI & Feature-specific components
├── context/        # Global state (Auth, Analytics)
├── lib/            # Shared utilities and service layer
│   ├── services/   # Business logic (Metrics, Analytics)
│   └── reports/    # PDF generation engine
└── types/          # TypeScript interfaces/types
```

## 📄 License

This project is proprietary software for the Provincial Government of La Union.
