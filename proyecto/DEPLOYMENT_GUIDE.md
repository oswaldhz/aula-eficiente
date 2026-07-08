# Deployment Guide: Vercel + Firebase

This guide covers setting up and deploying the migrated Aula Eficiente app on **Vercel** (hosting) with **Firebase Realtime Database** (data), keeping **Clerk** for authentication and profile images.

---

## Architecture Overview

```
Browser (React SPA)
    │
    ├── Clerk CDN (auth UI, session management)
    │
    └── Vercel (your-app.vercel.app)
        │
        ├── / (static assets from frontend/dist)
        │
        └── /api/* → Serverless Function (Express)
            │
            └── Firebase Admin SDK → Realtime Database
```

---

## Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Create a project** (or use an existing one)
3. Name it (e.g., `aula-eficiente`)
4. Disable Google Analytics (not needed)

### 1.1 Enable Realtime Database

1. In the Firebase console, go to **Build → Realtime Database**
2. Click **Create Database**
3. Choose a location (e.g., `us-central1`)
4. Start in **test mode** (you'll secure it later via Admin SDK — the API key is never exposed)
5. Copy the **Database URL** (looks like `https://aula-eficiente-default-rtdb.firebaseio.com`)

### 1.3 Generate Service Account Credentials

1. Go to **Project settings → Service accounts** (gear icon next to "Project Overview")
2. Click **Generate new private key**
3. A JSON file downloads — **keep this safe** (contains `project_id`, `client_email`, `private_key`)
4. You'll use these three values as Vercel environment variables

### 1.4 Set Realtime Database Rules (optional but recommended)

In **Realtime Database → Rules**, set:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

This blocks direct client access — all reads/writes go through your API (which uses the Admin SDK with full access). The Admin SDK bypasses these rules.

---

## Step 2: Get Clerk Credentials

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application (or create one)
3. From **API Keys**:
   - Copy **Publishable Key** (`pk_test_...`)
   - Copy **Secret Key** (`sk_test_...`)

### 2.1 Create a JWT Template (for custom token verification)

1. In Clerk Dashboard, go to **JWT Templates**
2. Click **New Template**
3. Name it (e.g., `aula-eficiente`)
4. Set **Claims** to something like:
   ```json
   {
     "sub": "{{user.id}}"
   }
   ```
5. Save and copy the **Issuer URL** and **JWKS URL** from the template info

### 2.2 Create a Webhook

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. **Endpoint URL:** `https://your-app.vercel.app/api/clerk-webhook` (you'll set this after deploying)
4. **Events:** Select `user.created` and `user.updated`
5. Copy the **Signing Secret** (`whsec_...`)

---

## Step 3: Set Environment Variables in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo (`oswaldhz/aula-eficiente`)
3. **Root Directory:** `proyecto`
4. **Framework Preset:** Other
5. **Build Command:** `cd frontend && npm run build` (this is already in `vercel.json`)
6. **Output Directory:** `frontend/dist` (already in `vercel.json`)

### 3.1 Required Environment Variables

| Variable | Where to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase service account JSON → `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account JSON → `client_email` |
| `FIREBASE_PRIVATE_KEY` | Firebase service account JSON → `private_key` (include the full value with `-----BEGIN PRIVATE KEY-----\n...`) |
| `FIREBASE_DATABASE_URL` | Firebase → Realtime Database → URL (e.g., `https://aula-eficiente-default-rtdb.firebaseio.com`) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys → Secret Key |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Signing Secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable Key (prefixed with `pk_`) |

> **Important for `FIREBASE_PRIVATE_KEY`:** The private key contains literal `\n` characters. Vercel's UI may interpret them. Paste the key **exactly as it appears** in the JSON file. If the value in the JSON shows `-----BEGIN PRIVATE KEY-----\nMII...`, paste it that way. The code handles the `\n` replacement automatically.

### 3.2 Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Vercel gives you a URL like `https://aula-eficiente.vercel.app`

### 3.3 Update Clerk Webhook URL

1. Go back to Clerk Dashboard → Webhooks
2. Edit your webhook endpoint
3. Set **Endpoint URL** to `https://your-app.vercel.app/api/clerk-webhook`
4. Save

### 3.4 Update Clerk Allowed Origins

1. Clerk Dashboard → **Sessions**
2. Under **Allowed origins**, add `https://your-app.vercel.app`

---

## Step 4: Verify the Deployment

1. Visit `https://your-app.vercel.app`
2. Sign in with Google/GitHub (Clerk handles this)
3. You should be redirected to the dashboard
4. Create a period → add a classroom → add students → create activities → enter grades

### 4.1 Test the API directly

```bash
# Health check (no auth required)
curl https://your-app.vercel.app/api/test-teacher
# → { "error": "Unauthorized: invalid token" }  (expected — no token)

# Get a token from Clerk (in browser console):
# const token = await window.Clerk.session.getToken()
# then:
# curl -H "Authorization: Bearer <token>" https://your-app.vercel.app/api/test-teacher
# → { "message": "Usuario validado", "name": "...", "id": "..." }
```

### 4.2 Check Vercel Logs

If something doesn't work:
1. Vercel Dashboard → your project → **Logs** tab
2. Look for runtime errors (missing env vars, Firebase connection issues, etc.)

---

## Step 5: Local Development

### 5.1 Prerequisites

- Node.js 18+
- A Firebase project (steps 1.1-1.3 above)
- Clerk credentials (step 2 above)

### 5.2 Frontend Setup

```bash
cd proyecto/frontend
npm install
```

Create `proyecto/frontend/.env.development`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:3000/api
```

Run the frontend:

```bash
cd proyecto/frontend
npm run dev
```

### 5.3 Backend (API) Setup

```bash
cd proyecto
npm install
```

Create `proyecto/.env.local`:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Run the API locally:

```bash
cd proyecto
node api/index.js
```

The API will be available at `http://localhost:3000`.

### 5.4 Full Local Dev (frontend + API)

Terminal 1 (API):

```bash
cd proyecto
node api/index.js
```

Terminal 2 (frontend):

```bash
cd proyecto/frontend
npm run dev
```

Open `http://localhost:3000` — the frontend dev server proxies API calls to the Express server on the same port (thanks to VITE_API_URL pointing to `http://localhost:3000/api`).

---

## Data Structure (Realtime Database)

The API creates and expects data in this format:

```
/teachers/<clerk_user_id>/
  email: "teacher@example.com"
  name: "John Doe"
  first_name: "John"
  last_name: "John"
  profile_image_url: "https://img.clerk.com/..."

/periods/<push_id>/
  name: "Fall 2026"
  year: 2026
  teacher_id: "<clerk_user_id>"

/classrooms/<push_id>/
  name: "Math 101"
  description: "Advanced algebra"
  teacher_id: "<clerk_user_id>"
  period_id: "<period_push_id>"

/students/<push_id>/
  name: "Alice Smith"
  identifier: "ALI-001"
  classroom_id: "<classroom_push_id>"

/activities/<push_id>/
  title: "Homework 3"
  description: "Chapter 5 problems"
  due_date: "2026-04-15"
  max_score: 100
  classroom_id: "<classroom_push_id>"

/grades/<push_id>/
  student_id: "<student_push_id>"
  activity_id: "<activity_push_id>"
  score: 85
  submission_date: "2026-04-14"
```

All IDs are Firebase push IDs (strings). The `teacher_id` field is the Clerk user ID (`user_xxxxxxxxx`).

---

## Troubleshooting

### "401 Unauthorized" on every API call

1. Check that `CLERK_SECRET_KEY` is set correctly in Vercel env vars
2. Verify the JWT token by calling `await window.Clerk.session.getToken()` in the browser console — you should see a valid JWT string
3. Check if the token's `sub` claim matches a teacher node in Firebase RTDB

### "Invalid webhook signature" in Clerk Dashboard

1. Make sure `CLERK_WEBHOOK_SECRET` matches the **Signing Secret** in Clerk Dashboard exactly
2. The webhook handler reads the **raw body** before JSON parsing — this is handled correctly in the code

### Firebase connection errors

1. Verify all five Firebase env vars are set (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`)
2. Check that `FIREBASE_PRIVATE_KEY` includes the full key with `\n` escaping as it appears in the service account JSON
3. Ensure the service account has been granted access (if using VPC or restricted networking)

### "Cannot find module 'firebase-admin'"

The `package.json` at the project root (not `frontend/package.json`) must have `firebase-admin` listed. Run `npm install` in the project root directory.

### Vercel build fails

1. Check the build logs in Vercel Dashboard
2. Ensure `vercel.json` is in the root of the deployed directory (`proyecto/`)
3. The build command runs `cd frontend && npm run build` — verify the frontend builds locally first

---

## File Structure (After Migration)

```
proyecto/
├── api/
│   └── index.js                 # Express app — all API routes + webhook handler
├── lib/
│   └── firebase.js              # Firebase Admin SDK initialization
├── frontend/
│   ├── src/
│   │   ├── api.js               # API client (useFetch, fetchWithToken)
│   │   ├── App.jsx              # Routes, period selector, Clerk SignedIn/Out
│   │   ├── main.jsx             # Entry: ClerkProvider, ThemeProvider, Router
│   │   ├── pages/               # All page components
│   │   └── components/          # Layout, Toast, ErrorBoundary
│   ├── .env                     # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
│   ├── vite.config.js
│   └── package.json
├── package.json                 # API dependencies (express, firebase-admin, clerk, svix)
├── vercel.json                  # Build config, rewrites
└── .gitignore
```
