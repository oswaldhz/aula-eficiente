# Aula Eficiente — AGENTS.md

## Architecture

- **Single Vercel serverless function** (`proyecto/api/index.js`): Express app handles both API routes and serves as the backend for the React SPA. `vercel.json` rewrites `/api/(.*)` → `/api/index`.
- **No `api/package.json`**: API dependencies are in `proyecto/package.json` (CommonJS). Frontend is `proyecto/frontend/package.json` (ESM). No monorepo tooling — one shared `node_modules` tree.
- **`lib/` is shared CommonJS code** (environment-dependent — not ESM). `lib/firebase.js` initializes Firebase Admin SDK and exports `{ admin, db, isFirebaseReady, getFirebaseError }`. Both `api/` and `lib/` are commonjs; `frontend/` is ESM.

## Commands

Run from `proyecto/`:

```sh
npm test                                # node --test api/test/**/*.test.js
npm run test:watch                      # node --test --watch api/test/**/*.test.js
npm run lint                            # eslint api/ lib/
npm run lint:fix                        # eslint api/ lib/ --fix
cd frontend && npm run lint             # eslint frontend/
npm run build                           # cd frontend && npm install && npm run build
node api/index.js                       # start API on :3000
cd frontend && npm run dev              # Vite dev server on :3000 (same port, strict)
```

- Testing uses **Node.js built-in test runner** (`node:test` + `node:assert`). Not Jest/Mocha.
- No typecheck step. No formatter config.

## API & Auth

- **JWT flow**: Frontend gets token via `window.Clerk.session.getToken()`, sends as `Authorization: Bearer <token>`.
- **JWT verification**: `verifyToken(token, { secretKey, authorizedParties: ["https://aula-eficiente.vercel.app"] })` in `api/middleware/auth.js:23-26`. Sets `req.teacherId` and `req.teacher`.
- **Auth bypass**: Webhook endpoint matches `req.path === "/api/clerk-webhook"`. The middleware is mounted at root (no path prefix), so `req.path` is the full path.
- **Error handling**: All async route handlers wrapped in `asyncHandler` (catches rejections → `next(err)`). Global error handler at line 114.

## Data Layer

- **Firebase RTDB via `firebase-admin` (CJS)**. Client does NOT use Firebase SDK — only Express talks to Firebase.
- **`isFirebaseReady()` guard**: Firebase init can fail (missing env vars); all routes check this and return 500 if not ready.
- **Tenant isolation** (`teacher_id` pattern):
  - Create: `teacher_id: req.teacherId` stamped on every new record.
  - Read: `db.ref("students").orderByChild("teacher_id").equalTo(req.teacherId)`.
  - Mutate: verify `snap.val().teacher_id !== req.teacherId` → 403.
- **Grades composite key**: `activity_id_student_id` for deterministic, idempotent upserts.
- **`database.rules.json`**: Has `.indexOn` for `teacher_id`, `classroom_id`, `activity_id`, `period_id`, `student_id` on all relevant tables.

## Env Variables

### Backend (required)
```
CLERK_SECRET_KEY
FIREBASE_PROJECT_ID
FIREBASE_DATABASE_URL
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY        # raw string; code strips quotes and replaces \n
```

### Backend (optional)
```
CLERK_PUBLISHABLE_KEY       # or VITE_CLERK_PUBLISHABLE_KEY or CLERK_CLIENT_ID or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (fallback chain in getClerkPublishableKey())
CLERK_WEBHOOK_SECRET
```

### Frontend (`proyecto/frontend/.env`)
```
VITE_CLERK_PUBLISHABLE_KEY
VITE_API_URL                 # defaults to "" (same origin in production)
```

### Quirks
- `FIREBASE_PRIVATE_KEY` parsing in `getFirebasePrivateKey()`: strips surrounding quotes and replaces `\n` with actual newlines.
- Env validation runs at module load time (warn-only, no `process.exit(1)`). Missing vars produce a warning but the server starts.
- Debug endpoints (`/api/debug-env`, `/api/debug-auth`) are conditionally registered when `NODE_ENV !== "production"`.

## Frontend

- **React 19 + Vite 8 + Tailwind v4**. Tailwind v4 uses `@tailwindcss/vite` plugin (no `tailwind.config.js`).
- **Entrypoint**: `main.jsx` — mounts `ClerkProvider > ThemeProvider > ToastProvider > BrowserRouter > App`.
- **Period scoping**: `PeriodContext` (in `context/PeriodContext.jsx`) stores selected period in `localStorage("periodo")`. Wraps `AppContent` at top level.
- **Data fetching patterns** (both exist in codebase):
  - `useFetch()` in `api.js` — returns `[]` or `null` on any error (silent swallow). Legacy.
  - `useApiQuery`/`useApiMutation` in `hooks/useApiQuery.js` — wraps TanStack Query. Invalidates all queries on mutation success. Prefer this for new code.
  - `useResource` in `hooks/useResource.js` — legacy hook (manual `useEffect`, `refetch`).
- **TanStack Query client**: `staleTime: 30_000`, `retry: 1`.

## ESLint

- **Two configs** — must lint separately:
  - `proyecto/eslint.config.js`: CJS, targets `api/**/*.js` and `lib/**/*.js`. Node + CommonJS globals. ESLint 9 flat config.
  - `proyecto/frontend/eslint.config.js`: ESM, targets JSX. ESLint 10 flat config with `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`.

## Deployment

- `vercel.json`: `buildCommand: "npm run build"`, `outputDirectory: "frontend/dist"`, rewrites `/api/(.*)` → `/api/index`.
- Build runs `cd frontend && npm install && npm run build` but does NOT install API deps — Vercel detects `package.json` in `proyecto/` and installs it automatically.
- Root `.gitignore` excludes `.env`, `node_modules/`, `dist/`, `*.db`, images. `proyecto/frontend/.gitignore` excludes `dist` and `*.local`.

## Tests

- 2 test files: `api/test/auth.test.js` (snapshotToArray, snapshotToObject, asyncHandler) and `api/test/grades.test.js` (grade validation, composite key, tenant isolation).
- Pure unit tests — no Firebase or Clerk mocks. No integration or E2E tests.
- Run with `node --test` — no test runner config file.
