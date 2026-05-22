<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1:f472b6&height=180&section=header&text=Aula%20Eficiente&fontSize=50&fontColor=ffffff&fontAlignY=36&animation=fadeIn" width="100%"/>
</div>

<p align="center">
  <b>School management platform built with Flask + React</b><br>
  <sub>Manage classrooms, students, activities, grades, and reports — all in one place.</sub>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api">API</a> •
  <a href="#screenshots">Screenshots</a>
</p>

<br>

<div align="center">

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)

</div>

<br>

---

## ✨ Features

<table align="center">
<tr>
<td align="center" width="33%">
  <h3>📊 Dashboard</h3>
  <p>At-a-glance stats, recent activities, and quick actions for your daily workflow</p>
</td>
<td align="center" width="33%">
  <h3>👥 Students</h3>
  <p>Bulk import via Excel/CSV with drag-and-drop, preview, and template downloads</p>
</td>
<td align="center" width="33%">
  <h3>📚 Classrooms</h3>
  <p>CRUD operations with search and period-based filtering</p>
</td>
</tr>
<tr>
<td align="center" width="33%">
  <h3>📝 Activities</h3>
  <p>Create, edit, delete activities with classroom association</p>
</td>
<td align="center" width="33%">
  <h3>🏆 Grades</h3>
  <p>Score entry per student per activity with classroom filter</p>
</td>
<td align="center" width="33%">
  <h3>📄 Reports</h3>
  <p>Export grades as PDF (jsPDF) or Excel (xlsx) with auto-calculated columns</p>
</td>
</tr>
<tr>
<td align="center" width="33%">
  <h3>📅 Periods</h3>
  <p>Academic period management for organizing terms and years</p>
</td>
<td align="center" width="33%">
  <h3>🌓 Dark Mode</h3>
  <p>Light/dark toggle with localStorage persistence and system preference detection</p>
</td>
<td align="center" width="33%">
  <h3>🔐 Auth</h3>
  <p>Secure authentication via Clerk with profile management and image upload</p>
</td>
</tr>
</table>

<br>

---

## 🛠 Tech Stack

<div align="center">

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks-based architecture |
| **Vite 8** | Fast dev server and bundler |
| **Tailwind CSS v4** | Utility-first styling with `@custom-variant dark` |
| **Framer Motion** | Page transitions and micro-animations |
| **React Router v7** | Client-side routing |
| **Clerk React** | Authentication components and hooks |
| **lucide-react** | Icon library |
| **jsPDF + jspdf-autotable** | PDF report generation |
| **xlsx** | Excel/CSV import and export |

### Backend

| Technology | Purpose |
|---|---|
| **Flask** | REST API framework |
| **SQLAlchemy** | ORM for PostgreSQL |
| **PostgreSQL 18** | Primary database |
| **Alembic** | Database migrations |
| **Pillow** | Image processing (profile photos) |
| **Flask-CORS** | Cross-origin resource sharing |

</div>

<br>

---

## 🏗 Architecture

```
proyecto/
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── api.js                 # API client (useFetch, fetchWithToken)
│   │   ├── App.jsx                # Routes, period selector, layout wrapper
│   │   ├── main.jsx               # Entry point (Clerk, Theme, Toast, Router)
│   │   ├── index.css              # Tailwind v4 config + custom theme
│   │   ├── context/
│   │   │   └── ThemeContext.jsx    # Dark mode state + localStorage persistence
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar, top bar, user menu, dark toggle
│   │   │   ├── Toast.jsx          # Stacked animated toast notifications
│   │   │   └── ErrorBoundary.jsx  # React error boundary
│   │   └── pages/
│   │       ├── Dashboard.jsx      # Stats cards, recent activities
│   │       ├── StudentsPage.jsx   # Bulk import via Excel/CSV
│   │       ├── ClassroomsPage.jsx # CRUD with search
│   │       ├── ActivitiesPage.jsx # CRUD with classroom filter
│   │       ├── GradesPage.jsx     # Score entry per student
│   │       ├── ReportsPage.jsx    # PDF/Excel export
│   │       ├── PeriodsPage.jsx    # CRUD academic periods
│   │       └── ProfilePage.jsx    # Profile edit + image crop modal
│   ├── .env                       # Clerk key + API URL
│   └── vite.config.js             # Tailwind v4 plugin + React
│
├── backend/
│   ├── app.py                     # Flask app, CORS, Clerk middleware
│   ├── models.py                  # SQLAlchemy models
│   ├── database.py                # DB connection (SQLAlchemy)
│   ├── routes/
│   │   ├── teachers.py            # Profile GET/PUT, image upload
│   │   ├── periods.py             # CRUD academic periods
│   │   ├── classrooms.py          # CRUD classrooms
│   │   ├── students.py            # CRUD students
│   │   ├── activities.py          # CRUD activities
│   │   └── grades.py              # CRUD grades
│   ├── uploads/                   # Profile photo storage
│   └── alembic/                   # DB migrations
│
└── README.md
```

<br>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **Python** 3.10+
- **PostgreSQL** 16+

### 1. Clone & Install

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

```bash
# Frontend
cd frontend
npm install
```

### 2. Environment Variables

**`frontend/.env`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
VITE_API_URL=http://127.0.0.1:5000
```

**`backend/.env`** (create one)
```env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/aula_eficiente
CLERK_SECRET_KEY=sk_test_xxxxxxxx
```

### 3. Database Setup

```bash
# Create the database
createdb aula_eficiente

# Run migrations
cd backend
alembic upgrade head
```

### 4. Run

```bash
# Terminal 1 — Backend (port 5000)
cd backend
python app.py

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000** and sign in with Clerk.

<br>

---

## 📡 API Endpoints

<details>
<summary><b>Teachers</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/teachers/profile` | Get authenticated teacher's profile |
| `PUT` | `/teachers/profile` | Update name, profile image URL |
| `POST` | `/teachers/profile/image` | Upload profile photo (multipart) |
| `GET` | `/teachers/uploads/<filename>` | Serve uploaded profile images |

</details>

<details>
<summary><b>Periods</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/periods` | List all periods for the teacher |
| `POST` | `/periods` | Create a new period |
| `GET` | `/periods/<id>` | Get a single period |
| `PUT` | `/periods/<id>` | Update a period |
| `DELETE` | `/periods/<id>` | Delete a period |

</details>

<details>
<summary><b>Classrooms</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/classrooms?period_id=` | List classrooms (filtered by period) |
| `POST` | `/classrooms` | Create a classroom |
| `GET` | `/classrooms/<id>` | Get a single classroom |
| `PUT` | `/classrooms/<id>` | Update a classroom |
| `DELETE` | `/classrooms/<id>` | Delete a classroom |

</details>

<details>
<summary><b>Students</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/students?classroom_id=` | List students (filtered by classroom) |
| `POST` | `/students` | Create a student |
| `POST` | `/students/bulk` | Bulk import students |
| `GET` | `/students/<id>` | Get a single student |
| `PUT` | `/students/<id>` | Update a student |
| `DELETE` | `/students/<id>` | Delete a student |

</details>

<details>
<summary><b>Activities</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/activities?period_id=` | List activities (filtered by period) |
| `POST` | `/activities` | Create an activity |
| `GET` | `/activities/<id>` | Get a single activity |
| `PUT` | `/activities/<id>` | Update an activity |
| `DELETE` | `/activities/<id>` | Delete an activity |

</details>

<details>
<summary><b>Grades</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/grades?activity_id=` | List grades for an activity |
| `POST` | `/grades/bulk` | Bulk save/update grades |
| `GET` | `/grades/report?activity_id=` | Get grade report with stats |

</details>

<br>

---

## 🖼 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Dashboard</b></td>
      <td align="center"><b>Students (Bulk Import)</b></td>
    </tr>
    <tr>
      <td><img src="docs/screenshots/dashboard.png" alt="Dashboard" width="400"/></td>
      <td><img src="docs/screenshots/students.png" alt="Students" width="400"/></td>
    </tr>
    <tr>
      <td align="center"><b>Grades Entry</b></td>
      <td align="center"><b>Reports Export</b></td>
    </tr>
    <tr>
      <td><img src="docs/screenshots/grades.png" alt="Grades" width="400"/></td>
      <td><img src="docs/screenshots/reports.png" alt="Reports" width="400"/></td>
    </tr>
  </table>
</div>

> **Note:** Add actual screenshots to `docs/screenshots/` and they will appear here.

<br>

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you'd like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

<br>

---

<div align="center">

**Built with ❤️ by [Oswald Flete](https://github.com/oswaldhz)**

[![GitHub stars](https://img.shields.io/github/stars/oswaldhz/aula-eficiente?style=social)](https://github.com/oswaldhz/aula-eficiente)
[![GitHub forks](https://img.shields.io/github/forks/oswaldhz/aula-eficiente?style=social)](https://github.com/oswaldhz/aula-eficiente)
[![GitHub license](https://img.shields.io/github/license/oswaldhz/aula-eficiente?style=flat)](https://github.com/oswaldhz/aula-eficiente)

</div>

<p align="center">
  <sub>If you find this project useful, consider giving it a ⭐!</sub>
</p>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1:f472b6&height=120&section=footer" width="100%"/>
</div>
