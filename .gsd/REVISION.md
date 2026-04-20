# Archiving & Reporting Logic Revision

## Overview
Revise the logic for:
- Archiving records
- Generating reports (Dashboard & Reports pages)

---

## Rules

### 1. Exclusion of Inactive/Disabled Offices
- Inactive or disabled offices **must NOT be included** in the archive.
- Example issue:
  - `PHO-Warehouse` was incorrectly included in the archive.

---

### 2. Conditional Inclusion Based on Data Presence
- If an inactive office **has data for a specific month**, it **CAN be included**.
- Inclusion is **data-driven**, not status-driven alone.

---

### 3. Special Office Exclusions (PYESDO & PCDO)
- Offices affected:
  - `PYESDO`
  - `PCDO`

#### For Year 2025:
- Must be **completely excluded** from:
  - Reports
  - Responses
  - Archive
  - Any records
  - Charts / visualizations

#### Starting 2026:
- Begin **normal archiving** for these offices.

---

### 4. Office Filters Logic
- Office filters should follow this priority:

1. **If archived records exist:**
   - Use archived data as the source

2. **If NOT archived:**
   - Use data from the `Firestore collection`
   - **BUT only include ACTIVE offices**
   - Exclude inactive/disabled offices unless they satisfy Rule #2 (has data for the month)

---

## Unified Logic Flow
IF office is PYESDO or PCDO:
IF year == 2025:
EXCLUDE from everything
ELSE IF year >= 2026:
INCLUDE in archiving

ELSE:
IF office is inactive/disabled:
IF has data for the month:
INCLUDE
ELSE:
EXCLUDE
ELSE:
INCLUDE (active office)

FOR office filters:
IF archived data exists:
USE archived records
ELSE:
USE Firestore collection
FILTER:
INCLUDE only ACTIVE offices
INCLUDE inactive ONLY IF they have data for the month