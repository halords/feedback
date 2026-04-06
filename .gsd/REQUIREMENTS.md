# REQUIREMENTS.md

## Format
| ID | Requirement | Source | Status |
|----|-------------|--------|--------|
| REQ-01 | **Vite/React Setup:** Initialize a new React project with Vite and Tailwind CSS. | SPEC goal 1 | Pending |
| REQ-02 | **Material UI Integration:** Use `@mui/material` or a similar minimal Material-styled library for components. | SPEC goal 3 | Pending |
| REQ-03 | **Optimized Auth Logic:** Refactor `functions/auth/call.js` to eliminate O(N) queries in user lists. | SPEC goal 2 | Pending |
| REQ-04 | **Role-Based Routing:** Implement protected routes in React based on `user_type`. | SPEC goal 1, 2 | Pending |
| REQ-05 | **Dashboard Charts:** Re-implement Chart.js logic using `react-chartjs-2`. | SPEC goal 1 | Pending |
| REQ-06 | **Responsive Layouts:** Mobile-first layout with a sidebar (PC/Tablet) and bottom-nav or burger menu (Mobile). | SPEC goal 3 | Pending |
| REQ-07 | **Cache Management:** Use `React Query` (TanStack Query) to manage API requests and caching. | SPEC goal 2 | Pending |
| REQ-08 | **PDF Generation:** Re-implement PDF download logic in the React frontend (or call existing Function). | SPEC goal 1 | Pending |
| REQ-09 | **Security Rules:** Update `firestore.rules` to restrict access by `role` and `office`. | SPEC goal 4 | Pending |
| REQ-10 | **Environment Config:** Secure `serviceAccount.json` by moving to Firebase secrets/env vars. | SPEC goal 4 | Pending |

## Rules:
- Each requirement is testable.
- Each maps to a SPEC goal.
- Status starts as "Pending".
