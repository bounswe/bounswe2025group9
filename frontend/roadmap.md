# Frontend Roadmap – Milestone 1

> **Scope:** Home, Auth (Login / Sign‑Up), Food Catalog, Forum feed – all powered by mocked API.

---

## 0 · Bootstrap

- [x] Configure **Vite + React + TS + Tailwind**
- [x] Add **Navbar**, **Footer**, and `<MainLayout>` using React‑Router `<Outlet>`
- [x] Create **routing skeleton** with empty pages
- [x] Install & init **Mock Service Worker** (`msw`); add `foods.json`, `posts.json`
  - ✓ Install MSW: `npm install msw --save-dev`
  - ✓ Initialize service worker: `npx msw init public`
  - ✓ Create mock data and handlers

---

## 1 · Weekly Schedule

| Day   | Lead                               | J1 – Auth                              | J2 – Foods                              | J3 – Forum                              |
| ----- | ---------------------------------- | -------------------------------------- | --------------------------------------- | --------------------------------------- |
| **1** | Finish bootstrap & merge to `main` | —                                      | —                                       | —                                       |
| **2** | `Home.tsx` – hero + CTA buttons    | `/login` page with `AuthForm` (static) | `/foods` route – hard‑coded grid        | `/forum` route – hard‑coded list        |
| **3** | `apiClient.ts` + MSW handlers      | Wire login + signup POST               | Replace grid data with `GET /api/foods` | Replace list data with `GET /api/posts` |
| **4** | First Jest test + testing doc      | Add form validation (zod)              | Add click → `FoodModal`                 | Add `LikeButton` (local state)          |
| **5** | Review & merge PRs; unify styles   | Jest test: invalid email shows error   | Jest test: modal opens                  | Jest test: like increments              |
| **6** | Dark‑mode toggle, polish           | Bug‑fix                                | Bug‑fix                                 | Bug‑fix                                 |
| **7** | `npm run build` ✔, Lighthouse > 90 | —                                      | —                                       | —                                       |

---

## 2 · Roles & Ownership

- **yazici** — project setup, code reviews, global styles, Home page
- **saygan** — Login, Sign‑Up, validation, related tests
- **keles** — Food list, modal, future propose‑food form
- **goktas** — Post list, like button, future comments

---

## 3 · Directory Cheat‑Sheet

```
src/
  components/      shared UI (Navbar, Modal, Spinner…)
  pages/
    Home/
    auth/
    foods/
    forum/
  mocks/
    data/foods.json
    data/posts.json
    handlers.ts
  lib/
    apiClient.ts
```

---

## 4 · Mock API Endpoints (MSW)

```txt
GET  /api/foods   →  [ { id, name, calories } ]
GET  /api/posts   →  [ { id, title, likes } ]
POST /api/login   ←  { email, password }
POST /api/signup  ←  { email, password, username }
```

Handlers live in **`src/mocks/handlers.ts`**.

---

## 5 · Testing Minimums (Jest + React Testing Library)

- [ ] `Navbar` snapshot (lead)
- [ ] AuthForm validation error (J1)
- [ ] FoodModal opens on card click (J2)
- [ ] LikeButton increments like count (J3)

Run with `npm test`.

---

## 6 · Stretch (optional)

- Propose Food page (`/foods/new`)
- CommentList on Post detail (`/forum/:id`)
- [x] Dark‑mode persisted in `localStorage`

---

### Quick Commands

```bash
npm run dev        # start Vite with MSW in dev mode
npm run lint       # eslint --fix
npm run test       # jest
npm run build      # production bundle
```

Happy coding! 🚀
