# 📊 Customer Feedback Management Web App (Firebase + Node.js + PDF Reports)

A full-featured feedback tracking and reporting web application built using HTML, Bootstrap, Tailwind CSS, and vanilla JavaScript (frontend), with a Node.js backend and Firebase Firestore as the database. This system includes secure user login, CRUD operations, PDF generation with `pdf-lib`, admin-level user management, monthly chart dashboards, and consolidated report exports.

---

## ✨ Features

### 🔐 Authentication
- Secure **login system** using `bcrypt` for password hashing
- User-based access control (regular users vs. admin)

### 📊 Dashboard
- View **charts of feedback trends** (monthly filtered)
- Visualize response counts, categories, and more

### 📥 Responses (User-level)
- View **only your assigned office's responses**
- Filter by **month** and view classified comments:
  - Positive
  - Negative
  - Suggestion

### 📂 All Responses (Admin-level)
- View **all responses in the system**
- Filter globally by **month and year**

### 📄 Reports
- **Monthly Consolidated Report**: By office, exported as PDF
- **Summary Report**: Aggregate data across all offices, PDF-exportable
- **Charts Report**: Visual feedback charts also exportable as PDF

> All PDF exports are powered by [`pdf-lib`](https://pdf-lib.js.org/)

### 👥 User Management (Admin only)
- Add and delete users
- Assign specific offices for users to manage
- Role-based access and functionality visibility

---

## 🖥️ Tech Stack

### Frontend
- HTML5
- Bootstrap 5
- Tailwind CSS (utility-first enhancements)
- Vanilla JavaScript

### Backend
- Node.js (JavaScript)
- Express.js (if applicable)

### Database
- Firebase Firestore (NoSQL, cloud-hosted)

### Auth
- `bcrypt` for secure password hashing

### PDF Generation
- `pdf-lib` for custom, client-side PDF generation

---

### 🙋‍♂️ Author
Created by Harold
