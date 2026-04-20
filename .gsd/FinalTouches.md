# Non-Superadmin & Responses System Fix Audit

## TASK
Fix and validate all issues affecting **non-superadmin users** and ensure system-wide stability across:
- Settings access
- Reports functionality
- Responses loading
- Role-based data filtering

Also resolve Firestore query failures causing API errors.

---

## 1. NON-SUPERADMIN ACCESS ISSUES

### 1.1 SETTINGS PAGE ACCESS

#### ISSUE
- Non-superadmin users have **no access to Settings page**

#### REQUIREMENT
- Define intended behavior:
  - Either explicitly allow access (read-only or limited)
  - OR properly restrict with clear UI handling (no broken routes)

#### CHECK
- Route does not break or error for non-superadmin users
- Proper fallback UI exists if access is restricted
- No blank or inaccessible pages

---

### 1.2 REPORTS PAGE FUNCTIONALITY

#### ISSUE
- Reports page tabs are partially broken for non-superadmin users

#### TABS AFFECTED
- Summary tab ❌ not working
- Graphs tab ❌ not working
- Data View tab ✅ working but restricted

#### REQUIREMENT
- Summary and Graphs tabs must behave **identically to superadmin**
- Only Data View tab should be restricted to assigned offices

#### CHECK
- No role-based blocking on Summary/Graphs tabs
- Data loads correctly for all users
- UI behaves consistently across roles

---

## 2. RESPONSES PAGE ISSUE (ALL USERS)

### 2.1 DATA LOADING FAILURE

#### ISSUE
- Responses page fails to load assigned offices
- API error occurs during Firestore query execution

---

### 2.2 FIRESTORE ERROR (CRITICAL)

#### ERROR
FAILED_PRECONDITION: The query requires an index


#### AFFECTED FILES
- `src/lib/services/responseService.ts`
- `src/app/api/responses/route.ts`

#### QUERY ISSUE
- Composite query using:
  - `officeId`
  - `date_iso range filters`

---

### 2.3 REQUIREMENT

#### FIX FIRESTORE INDEX ISSUE
- Create required composite index in Firestore:
  - Collection: `Responses`
  - Fields:
    - `officeId`
    - `date_iso`
    - `__name__` (if required by Firestore auto index rules)

---

### 2.4 CHECK AFTER FIX
- Responses API no longer throws 500 error
- Assigned offices load correctly
- Date filtering works properly
- No regression in performance

---

## 3. ROLE-BASED DATA CONSISTENCY

### REQUIREMENT
Ensure consistent behavior across all roles:

#### CHECK
- Non-superadmin users:
  - Can access Reports (Summary + Graphs fully functional)
  - Only Data View is restricted to assigned offices
- Superadmin:
  - Full access to all data
- No mixed behavior between tabs

---

## 4. API & DATA STABILITY

### CHECK
- `/api/responses` endpoint:
  - Handles Firestore queries safely
  - Gracefully handles missing indexes
  - Does not crash entire page on query failure

---

## 5. REQUIRED FIXES SUMMARY

### MUST FIX
- Firestore composite index creation
- Responses API crash handling
- Reports tab functionality (Summary + Graphs)
- Non-superadmin Settings page behavior

---

## SUCCESS CRITERIA

- No API crashes in `/api/responses`
- All Reports tabs work for non-superadmin (except Data View restriction)
- Settings page does not break or block navigation
- Assigned offices load correctly
- Firestore queries execute without manual errors