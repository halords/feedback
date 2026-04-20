# RBAC Enhancement: Analytics Access Control

## TASK
Enhance the user management and RBAC system to support **Analytics Access Control**, while maintaining all existing security mechanisms and constraints.

---

## OBJECTIVE

Introduce a new permission flag:

- `analyticsEnabled: boolean`

This flag determines whether a user can:
- Access **all responses (all offices)**
- View **Summary and Graphs tabs** in Reports page (global scope)

---

## 1. USER MANAGEMENT UPDATE

### REQUIREMENT
- Extend user model to include:
  - `analyticsEnabled: true | false`

### IMPLEMENTATION
- Update user creation and update flows to support toggling this flag
- Ensure this field is stored securely (e.g., Firestore users collection)

### CHECK
- Flag persists correctly
- Only authorized roles (e.g., superadmin) can modify this flag

---

## 2. RESPONSES PAGE BEHAVIOR

### CASE A: analyticsEnabled = true

#### REQUIREMENT
- User can:
  - View **ALL responses (all offices)**
  - No restriction to assigned offices

#### CHECK
- API returns global dataset
- No office filtering applied

---

### CASE B: analyticsEnabled = false

#### REQUIREMENT
- User can:
  - View ONLY **assigned offices**
  - No tab switching or alternative views

#### UI BEHAVIOR
- Remove or disable any office-switching UI
- Enforce a single scoped view

#### CHECK
- API enforces office-level filtering
- No global data is loaded or accessible

---

## 3. REPORTS PAGE BEHAVIOR

### CASE A: analyticsEnabled = true

#### REQUIREMENT
- User can access:
  - Summary tab ✅
  - Graphs tab ✅
  - Data View tab ✅
- All tabs operate on **global (all offices) data**

#### CHECK
- Tabs are visible and functional
- API returns global aggregated data

---

### CASE B: analyticsEnabled = false

#### REQUIREMENT
- User can access:
  - Data View tab ONLY
- Data limited to assigned offices

#### UI BEHAVIOR
- Hide or disable:
  - Summary tab
  - Graphs tab

#### CHECK
- No tab switching available
- No hidden access via URL or state manipulation

---

## 4. BACKEND ENFORCEMENT (CRITICAL)

### REQUIREMENT
- Analytics access MUST be enforced server-side

### IMPLEMENTATION
- Update RBAC logic:
  - If `analyticsEnabled == true`:
    - Allow global queries
  - Else:
    - Force `resolveAuthorizedOffices()` filtering

### CHECK
- No reliance on frontend-only checks
- API responses strictly follow permission

---

## 5. SECURITY CONSTRAINTS

### MUST MAINTAIN
- Existing authentication (JWT / session)
- Existing RBAC enforcement
- No exposure of global data unless explicitly allowed

### FLAG IF
- analyticsEnabled is only checked in frontend
- API returns global data for unauthorized users
- Users can bypass restrictions via direct API calls

---

## 6. UI CONSISTENCY

### REQUIREMENT
- UI must clearly reflect access level

#### analyticsEnabled = true
- Full analytics UI visible

#### analyticsEnabled = false
- Restricted UI with:
  - No Summary/Graphs tabs
  - No confusion in navigation

---

## SUCCESS CRITERIA

- Users with `analyticsEnabled = true`:
  - Access all offices data
  - Use full Reports (Summary + Graphs + Data View)

- Users with `analyticsEnabled = false`:
  - Restricted to assigned offices only
  - No access to analytics tabs
  - No hidden or indirect access to global data

- All enforcement is done server-side
- No regression in existing security mechanisms