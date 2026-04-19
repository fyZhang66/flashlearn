# CLAUDE.md - FlashLearn Project Guide

## Project Overview

FlashLearn is a spaced repetition flashcard app built as a NEU INFO 6250 final project. It is a Vite-based React 19 SPA with an Express 5 backend. All data is stored in-memory on the server (no database). Authentication is session-based via cookies (no passwords).

## Quick Start

```bash
npm install       # Install dependencies
npm run build     # Vite production build → dist/
npm start         # Start Express server on port 3000
```

For development with HMR:
```bash
npm run dev       # Vite dev server (proxies /api → localhost:3000)
# In a separate terminal:
npm start         # Express API server on port 3000
```

Lint: `npm run lint`

## CRITICAL Course Restrictions

These are hard requirements for this course project. Violating any of them will lose significant points:

- **NO `async`/`await`** — use `fetch()` with `.then()/.catch()` promise chains only
- **NO react-router** or any routing library — navigation is state-driven via `TabContext`
- **NO axios** or fetch alternatives — use native `fetch()` only
- **NO CSS-in-JS, CSS modules, styled-components, Tailwind, Bootstrap, SASS/less**
- **NO jQuery** or non-React DOM manipulation
- **NO `style` attributes/props** — all styling via CSS files and class names
- **NO `localStorage`, `sessionStorage`, `IndexedDB`** — only a `sid` cookie
- **NO `alert()`, `prompt()`, `confirm()`** or blocking JS
- **NO `express-session`** — sessions are manually managed in `sessions.js`
- **Allowed backend libs**: `express`, `cookie-parser` only (plus eslint/prettier/babel for dev)
- **Allowed frontend libs**: `react`, `react-dom`, `vite` and Vite's default plugins only
- **Icons**: SVG/PNG from Google Fonts Material Icons only

## Project Structure

```
final/
├── server.js                  # Express entry point (port 3000, serves dist/ + API)
├── middleware.js               # requireAuth middleware (validates sid cookie)
├── sessions.js                # In-memory session store { sid → { username } }
├── user-management.js         # User registry (Set), validation, "dog" is pre-banned
├── cards-manager.js           # Card CRUD + spaced repetition logic (in-memory)
├── routes/
│   ├── auth.js                # GET/POST/DELETE /api/session
│   ├── register.js            # POST /api/register
│   ├── cards.js               # GET /api/cards, /api/cards/next, /api/cards/stats
│   └── card.js                # POST/PUT/DELETE /api/card, POST /api/card/:id/review
├── src/
│   ├── main.jsx               # React root (createRoot + StrictMode)
│   ├── App.jsx                # Root: UserProvider > TabProvider > AppContent
│   ├── index.css              # Global reset + :root CSS variables
│   ├── App.css                # App shell layout, header, footer, spinner
│   ├── api/
│   │   └── index.js           # All fetch calls (promise chains, NO async/await)
│   ├── components/
│   │   ├── AppContent.jsx     # Auth gate: Login vs tabbed content + StatsProvider
│   │   ├── Header.jsx         # Logo, title, NavTabs, error banner
│   │   ├── NavTabs.jsx        # Tab buttons + due badge + logout
│   │   ├── Login.jsx          # Login/Register toggle form
│   │   ├── Review.jsx         # Flashcard flip + hard/good/easy review
│   │   ├── CreateCard.jsx     # New card form
│   │   ├── CardManage.jsx     # Card list with filters (uses cardsReducer)
│   │   ├── CardList.jsx       # Card items + delete confirm modal
│   │   ├── CardStats.jsx      # Stats display (reads StatsContext)
│   │   ├── EditCardModal.jsx  # Edit card modal (uses editModalReducer)
│   │   └── *.css              # Component-scoped CSS files
│   ├── contexts/
│   │   ├── UserContext.jsx    # Auth state, login/logout, error handling
│   │   ├── TabContext.jsx     # Active tab state (review | create | manage)
│   │   └── StatsContext.jsx   # Card stats + 30s polling interval
│   ├── hooks/
│   │   └── useError.js        # Error code → human-readable message mapping
│   ├── reducers/
│   │   ├── cardsReducer.js    # Card list state + action-creator thunks
│   │   └── editModalReducer.js # Edit modal form state
│   ├── utils/
│   │   ├── errors.js          # ERROR_MESSAGES map (error codes → display strings)
│   │   └── dateUtils.js       # formatDate() helper
│   └── assets/                # SVG icons (logo, error, learn, add, manage, logout)
├── dist/                      # Vite build output (served by Express in production)
└── testsprite_tests/          # Python-based E2E/integration tests (18 test cases)
```

## Architecture

### Backend

- **Express 5** with `cookie-parser` middleware
- **Single `server.js`** serves static files from `dist/` AND mounts API routes
- **Route/model separation**: routes in `routes/`, data logic in root-level model files
- **Auth flow**: `POST /api/register` → `POST /api/session` (login, sets `sid` cookie) → protected routes check `sid` via `middleware.js`
- **"dog" user**: Pre-registered but always fails authorization checks (returns 403 `auth-insufficient`)

### Frontend

- **No routing library** — navigation via `TabContext.activeTab` state, conditional rendering in `AppContent`
- **Context API** for global state: `UserContext` (auth), `TabContext` (navigation), `StatsContext` (card stats with polling)
- **`useReducer`** for complex component state: `cardsReducer` in CardManage, `editModalReducer` in EditCardModal
- **Component hierarchy**: `App > UserProvider > TabProvider > AppContent > StatsProvider > [Header + main content]`

### API Layer (`src/api/index.js`)

All fetch calls follow the same promise chain pattern:
```js
functionName: (args) => {
  return fetch(url, options)
    .catch(() => Promise.reject({ error: "network-error" }))
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => Promise.reject(err));
      }
      return response.json();
    });
}
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/session` | GET | No | Check session status |
| `/api/session` | POST | No | Login (sets sid cookie) |
| `/api/session` | DELETE | Yes | Logout (clears session) |
| `/api/register` | POST | No | Register new username |
| `/api/cards` | GET | Yes | Get cards (optional `?status=` filter) |
| `/api/cards/next` | GET | Yes | Get next card due for review |
| `/api/cards/stats` | GET | Yes | Get card statistics {total, unlearned, due} |
| `/api/card` | POST | Yes | Create new card |
| `/api/card/:id` | PUT | Yes | Update card content |
| `/api/card/:id` | DELETE | Yes | Delete card |
| `/api/card/:id/review` | POST | Yes | Submit review (hard/good/easy) |

All endpoints return JSON. Request bodies are JSON.

## Data Model

**Card object:**
```js
{
  cardId: String,        // UUID
  front: String,         // Question/term
  explain: String,       // Answer/explanation
  expireMs: Number,      // Milliseconds until due again
  createdAt: String,     // ISO date string
  lastReviewed: String   // ISO date string or null
}
```

**Spaced repetition intervals:**
- Hard → 5 minutes (300,000 ms)
- Good → 1 day (86,400,000 ms)
- Easy → current interval × 2

## State Management Patterns

- **UserContext**: `useState` for auth state, checks session on mount
- **TabContext**: `useState("review")` — simple tab switching
- **StatsContext**: `useState` + `setInterval` ref for 30s polling, clears on logout/unmount
- **cardsReducer**: Dispatches actions like `FETCH_CARDS_REQUEST/SUCCESS/FAILURE`, `DELETE_CARD_*`, `UPDATE_CARD_SUCCESS`, `SET_FILTER`; action-creator thunks accept `dispatch` and return promises
- **editModalReducer**: Form state management with `SET_FORM_DATA`, `SET_CONFIRM_MODE`, `RESET_FORM`

## CSS Conventions

- **CSS variables** defined in `:root` (Apple-inspired design system):
  - `--apple-blue`, `--apple-blue-hover`, `--apple-blue-active`
  - `--apple-red`, `--apple-bg`, `--apple-text`, `--apple-text-secondary`, `--apple-border`
- **Component-scoped CSS files** — each component imports its own `.css` file
- **Class naming**: kebab-case, BEM-adjacent (e.g., `.card-manage-container`, `.filter-tab`, `.status-badge`)
- **No inline styles** — use CSS classes for everything, including dynamic states (e.g., `.progress-0` through `.progress-100` instead of `style={{ width }}`)
- Global styles in `index.css` (reset) and `App.css` (shell layout)

## Error Handling

- `useError` hook maps error codes to user-friendly messages via `utils/errors.js`
- Silently ignores `"auth-missing"` errors (doesn't display them to the user)
- Error banner displayed in `Header` for global errors (from `UserContext`)
- Component-level errors displayed inline (Login, Review, CreateCard each use their own `useError` instance)

## Testing

Python-based E2E tests in `testsprite_tests/` directory (18 test cases using Playwright). These test registration, login, card CRUD, review flow, filtering, stats, navigation, validation, and build commands. No Jest/Vitest unit tests are configured.

## Key Rules When Modifying Code

1. **Never use `async`/`await`** — always use `.then()/.catch()` promise chains
2. **Never add banned libraries** — check the allowed list above before adding any dependency
3. **Never use inline styles** — add CSS classes instead
4. **Never use react-router** — add navigation via `TabContext` and conditional rendering
5. **Always validate/sanitize user input on the backend** (but do NOT sanitize for HTML — React handles that)
6. **Always check auth** for protected endpoints using `requireAuth` middleware
7. **The "dog" username** must always be rejected at authorization (not authentication) — it can register but gets 403
8. **Keep route handlers thin** — business logic belongs in model files (`cards-manager.js`, `user-management.js`, `sessions.js`)
9. **Use semantic HTML** and semantic kebab-case CSS class names
10. **Clean up intervals/timers** in `useEffect` return functions
