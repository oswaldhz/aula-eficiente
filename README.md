<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1:f472b6&height=200&section=header&text=Aula%20Eficiente&fontSize=50&fontColor=ffffff&fontAlignY=36&animation=fadeIn" width="100%"/>
</div>

<p align="center">
  <b>School management platform for teachers</b><br>
  <sub>React 19 + Express + Firebase + Clerk</sub>
</p>

<br>

<div align="center">

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

</div>

<br>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [License](#license)

---

## 📖 About

**Aula Eficiente** ("Efficient Classroom") is a full-stack web application that gives teachers a centralized platform to manage their academic workflow. It replaces paper grade books and scattered spreadsheets with a modern interface for organizing classrooms, tracking students, creating activities, recording grades, and generating reports.

The app is deployed on **Vercel** — the React SPA serves static assets while API routes run as serverless functions (Express). **Firebase Realtime Database** stores all data, and **Clerk** handles authentication with Google OAuth.

---

## ✨ Features

<table align="center">
<tr>
<td align="center" width="33%">
  <h3>📊 Dashboard</h3>
  <p>At-a-glance stats, recent activities, and quick actions</p>
</td>
<td align="center" width="33%">
  <h3>👥 Students</h3>
  <p>Register, edit, delete. Bulk import via Excel/CSV with preview</p>
</td>
<td align="center" width="33%">
  <h3>📚 Classrooms</h3>
  <p>Full CRUD with search and period-based filtering</p>
</td>
</tr>
<tr>
<td align="center" width="33%">
  <h3>📝 Activities</h3>
  <p>Assignments with due dates and max scores</p>
</td>
<td align="center" width="33%">
  <h3>🏆 Grades</h3>
  <p>Score entry per student per activity with auto-save</p>
</td>
<td align="center" width="33%">
  <h3>📄 Reports</h3>
  <p>Export grade reports as PDF or Excel</p>
</td>
</tr>
<tr>
<td align="center" width="33%">
  <h3>📅 Periods</h3>
  <p>Academic terms to scope data by semester</p>
</td>
<td align="center" width="33%">
  <h3>🌓 Dark Mode</h3>
  <p>Persistent light/dark toggle with Tailwind v4</p>
</td>
<td align="center" width="33%">
  <h3>🔐 Auth</h3>
  <p>Clerk-powered sign-in with Google OAuth + profile management</p>
</td>
</tr>
</table>

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks-based architecture |
| **Vite 8** | Dev server and bundler |
| **Tailwind CSS v4** | Utility-first styling with class-based dark mode |
| **Framer Motion** | Page transitions and micro-interactions |
| **React Router 7** | Client-side routing with nested layouts |
| **Clerk React** | Authentication UI, session management, JWT tokens |
| **jsPDF + jspdf-autotable** | PDF report generation |
| **xlsx** | Client-side Excel/CSV parsing for bulk import |

### Backend

| Technology | Purpose |
|---|---|
| **Express** | REST API framework running as Vercel serverless function |
| **Firebase Admin SDK** | Database access (Realtime Database) |
| **Clerk Backend SDK** | JWT verification and user management |
| **Svix** | Clerk webhook signature verification |
| **Multer** | Multipart file handling for profile image uploads |

### Infrastructure

| Service | Role |
|---|---|
| **Vercel** | Hosting — static assets + serverless functions |
| **Firebase** | Realtime Database for all application data |
| **Clerk** | Authentication, session management, profile image storage |

---

## 🏗 Architecture

```
Browser (React SPA)
    │
    ├── Clerk CDN (auth UI, session mgmt, JWT issuance)
    │
    └── Vercel (aula-eficiente.vercel.app)
        │
        ├── / (static assets from frontend/dist)
        │
        └── /api/* → Serverless Function (Express)
            │
            └── Firebase Admin SDK → Realtime Database
```

### Data flow

1. User signs in via Clerk (Google OAuth). Clerk issues a JWT.
2. Frontend includes `Authorization: Bearer <token>` on every API call.
3. Express middleware verifies the JWT with Clerk's `verifyToken()`.
4. All queries are scoped to the authenticated teacher's Clerk user ID.

---

## 📁 Project Structure

```
proyecto/
├── api/
│   └── index.js               # Express app: routes, auth middleware, webhook handler
├── lib/
│   └── firebase.js             # Firebase Admin SDK initialization
├── frontend/
│   ├── src/
│   │   ├── api.js              # API client (useFetch, fetchWithToken)
│   │   ├── App.jsx             # Routes, period selector, Clerk SignedIn/Out
│   │   ├── main.jsx            # Entry point: providers + router
│   │   ├── index.css           # Tailwind v4 + custom theme
│   │   ├── pages/              # Dashboard, Students, Classrooms, Activities,
│   │   │                       # Grades, Reports, Periods, Profile
│   │   └── components/         # Layout, Toast, ErrorBoundary
│   ├── .env                    # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
│   ├── vite.config.js
│   └── package.json
├── package.json                # API dependencies
├── vercel.json                 # Build config + rewrites
└── DEPLOYMENT_GUIDE.md         # Full deployment reference
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Clerk account with a published application
- Firebase project with Realtime Database enabled

### Local development

```bash
# 1. Install API dependencies
cd proyecto
npm install

# 2. Set environment variables
cp proyecto/.env.local.example proyecto/.env.local
# Edit with your Clerk + Firebase credentials

# 3. Start the API
node api/index.js

# 4. In another terminal, start the frontend
cd proyecto/frontend
npm install
npm run dev
```

The API runs on `http://localhost:3000` and the frontend dev server proxies API calls to it.

### Required environment variables

| Variable | Source |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase service account |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account |
| `FIREBASE_PRIVATE_KEY` | Firebase service account (with `\n` escaping) |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database URL |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |

> See [`DEPLOYMENT_GUIDE.md`](./proyecto/DEPLOYMENT_GUIDE.md) for a complete setup walkthrough.

---

## 📄 License

Distributed under the MIT License.

<br>

<div align="center">

**Built by [Oswald Flete](https://github.com/oswaldhz)**

[![GitHub stars](https://img.shields.io/github/stars/oswaldhz/aula-eficiente?style=social)](https://github.com/oswaldhz/aula-eficiente)
[![GitHub forks](https://img.shields.io/github/forks/oswaldhz/aula-eficiente?style=social)](https://github.com/oswaldhz/aula-eficiente)

</div>

<br>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1:f472b6&height=120&section=footer" width="100%"/>
</div>
