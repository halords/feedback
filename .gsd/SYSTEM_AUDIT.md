# AI Codebase Audit دستور

## TASK
Conduct a **full and exhaustive audit** of the entire codebase.

Analyze all relevant files, routes, services, database interactions, and UI components.

---

## OUTPUT FORMAT (STRICT)
For EACH category, return:

- status: PASS | WARNING | FAIL
- issues: list of identified problems
- risk_level: LOW | MEDIUM | HIGH | CRITICAL
- recommendations: actionable fixes

---

## AUDIT CATEGORIES

### 1. SECURITY

#### 1.1 Unintended Access
CHECK:
- Unauthorized route access
- Missing authentication checks
- Missing authorization validation

---

#### 1.2 API Protection
CHECK:
- Protected API routes (auth middleware)
- Input validation
- Rate limiting

---

#### 1.3 Injection Attacks
CHECK:
- SQL/NoSQL injection vulnerabilities
- Unsafe query construction
- Unsanitized inputs

---

#### 1.4 DDoS & Abuse Protection
CHECK:
- Rate limiting
- Throttling
- Bot protection
- WAF/CDN usage

---

#### 1.5 General Vulnerabilities
CHECK:
- XSS
- CSRF
- Insecure headers
- Exposed secrets

---

### 2. PERFORMANCE & OPTIMIZATION

#### 2.1 Page Performance
CHECK:
- Load time
- Lazy loading
- Asset optimization

---

#### 2.2 Database Performance
CHECK:
- Query efficiency
- Index usage
- Pagination
- Over-fetching

---

#### 2.3 System Speed
CHECK:
- API latency
- Caching
- Background processing

---

#### 2.4 Client vs Server Load Balance
CHECK:
- Proper distribution of processing between client and server
- Server-side processes are justified and scalable for multiple concurrent users
- Critical logic is NOT offloaded entirely to the client
- Client is NOT overloaded with heavy rendering or computation
- Server is effectively utilized for data processing, validation, and security

---

#### 2.5 Rendering & Page Load Justification
CHECK:
- All page loads are necessary and justified
- No redundant re-renders or excessive API calls
- Efficient routing and data fetching strategy
- Minimal blocking resources on load
- Navigation flow is optimized for speed

REQUIRE:
- Provide specific optimization recommendations to improve:
  - Navigation speed
  - Rendering efficiency
  - Load performance

---

### 3. USER INTERFACE

CHECK:
- Ease of navigation
- Clarity of layout
- User intuitiveness (no instructions needed)
- Compactness and readability

---

### 4. ROLE-BASED ACCESS CONTROL (RBAC)

#### 4.1 Role Separation
CHECK:
- Superadmin vs non-superadmin separation
- Backend enforcement of roles
- Prevention of privilege escalation

---

#### 4.2 Data Access Enforcement (CRITICAL FOCUS)
CHECK:
- Non-superadmin users ONLY access data they are authorized to view
- Server-side filtering is strictly enforced
- No reliance on frontend-only filtering

FLAG IF:
- Backend returns global/full datasets for non-superadmin users
- Filtering happens only in UI
- Role checks are missing in APIs

---

#### 4.3 Non-Superadmin Data Loading (CRITICAL)
CHECK:
- Non-superadmin pages DO NOT load unnecessary or unauthorized data
- API requests are scoped to user role before execution
- Database queries are filtered (e.g., by userId, officeId)

INSPECT:
- Network responses
- State management (Redux, Context, etc.)
- Cached/store data

FLAG IF:
- Data is loaded but not rendered
- Hidden/global datasets exist in memory or responses
- Over-fetching occurs for non-superadmin users

NOTE:
- “Data loaded but not shown” is considered a FAILURE

---

### 5. DATA ACCESS VALIDATION

CHECK:
- All data access is validated server-side
- No unintended global data exposure
- Queries enforce strict scoping rules

---

### 6. SCALABILITY & USER HANDLING

CHECK:
- Ability to handle 100–1000 concurrent users
- Server processes remain stable under load
- Load handling strategy (horizontal/vertical scaling)
- Queueing and async processing for heavy operations

EVALUATE:
- Whether server-side processing is justified and efficient under concurrency
- Whether architecture avoids bottlenecks

---

## FINAL OUTPUT SHALL BE MD FILE

---

## RULES
- Be strict and critical
- Do NOT assume safety without verification
- Flag even potential risks
- Prioritize backend validation over frontend assumptions
- Prefer false positives over missed vulnerabilities
- Treat unnecessary data exposure as a security issue
- Justify all performance-related observations with reasoning