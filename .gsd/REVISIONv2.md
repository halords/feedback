# UI & Data Refactor Tasks

## TASK
Implement the following UI improvements and data architecture changes across the system.

Ensure all changes are consistent, scalable, and do not break existing data flows.

---

## 1. SIDEBAR UI FIX

### Requirement
- Sidebar highlight must span **full width (edge-to-edge)**.
- Highlight should fully cover the sidebar item container.

### CHECK
- No partial highlight or padding gaps
- Works across all sidebar items
- Responsive across screen sizes

---

## 2. MANAGEMENT CONSOLE TOOLTIP FIX

### Requirement
- Tooltip must be **aligned exactly with the icon**
- Tooltip must remain visible on hover (no instant disappearance)

### CHECK
- Proper positioning relative to icon
- Hover state is stable (no flicker/disappear)
- Works across different screen sizes

---

## 3. OFFICE DATA NORMALIZATION (CRITICAL)

### Requirement
Refactor all collections that store **office names** to instead use:

- `officeId` (document reference or ID)
- Reference must point to the **offices collection/table**

### OBJECTIVE
- Ensure updates to office data do NOT break or require updates in other collections

### CHECK
- No raw office names stored in other collections
- All references use a consistent identifier (e.g., document ID)
- Backward compatibility handled (if needed)

---

## 4. UPDATE OFFICE FUNCTION REVISION

### DEPENDENCY
- This step depends on **Task 3 completion**

### Requirement
- Revise the `updateOffice` function to:
  - Update only the **offices collection**
  - Ensure all linked data remains valid via `officeId`
  - Avoid cascading manual updates across collections

### CHECK
- No direct updates to other collections
- Office updates automatically reflect wherever referenced
- No data inconsistency introduced

---

## 5. EXPORT SCRIPTS UPDATE (CRITICAL)

### DEPENDENCY
- Requires **Task 3 and Task 4 to be completed**

---

### 5.1 Responses_export.js

#### Description
- Exports Google Sheets data into the `Reports` collection

#### Requirement
- Modify logic to:
  - Store `officeId` instead of office name
  - Resolve office reference before saving

#### CHECK
- Incoming data correctly maps to existing office documents
- No duplicate or mismatched office entries
- Handles missing/invalid office mappings gracefully

---

### 5.2 physical_reports_export.js

#### Description
- Exports consolidated Google Sheets data into the `physical_reports` collection

#### Requirement
- Apply same referencing logic as above:
  - Use `officeId` instead of office name
  - Ensure consistent mapping

#### CHECK
- Data integrity maintained
- No broken references
- Compatible with existing queries and reports

---

## 6. ARCHIVING & FETCHING IMPACT VALIDATION (DEPENDENCY CHECK)

### TRIGGER CONDITION
This section is ONLY required IF:
- Office referencing (Task 3–5) is successfully implemented and stable

---

### REQUIREMENT
Evaluate whether existing:
- Archiving logic
- Data fetching logic (frontend + backend)
- Reporting queries

need updates due to migration from:
- `officeName` → `officeId`

---

### CHECK
- Are archived records still correctly linked to offices?
- Are queries using updated `officeId` instead of raw names?
- Do dashboard/report filters still work correctly?
- Are there any broken joins or mismatched references?

---

### DECISION RULE

IF all office referencing changes are stable:
- THEN review and update:
  - archiving logic
  - fetching logic
  - reporting queries

ELSE:
- DO NOT modify archiving/fetching yet
- Wait until referencing is fully consistent across system

---

## IMPLEMENTATION RULES

- Maintain backward compatibility where necessary
- Avoid breaking existing reports and dashboards
- Validate all references before saving data
- Prefer centralized data integrity over duplicated fields

---

## SUCCESS CRITERIA

- All collections reference offices via `officeId`
- Office updates propagate automatically without manual fixes
- Export scripts produce consistent, clean, and normalized data
- UI improvements behave correctly across all pages
- Archiving and fetching logic is only updated if required by dependency validation