## Quick context

This is a small Node/Express URL shortener (server + static Vue front-end).
Key files:
- `index.js` — the entire server: routes, validation, DB access, error handling.
- `public/app.js` — small Vue app that POSTs to `/url` and expects JSON back.
- `public/index.html` — static UI (served via `express.static('./public')`).
- `package.json` — run scripts (`npm run dev` uses `nodemon`).

Keep guidance concise and code-focused; cite these files when proposing changes.

## Big-picture architecture (what to know quickly)
- Single-process Express server (no separate controllers/service layers). All logic lives in `index.js`.
- MongoDB accessed via `monk` (collection `urls`). Index: `{ slug: 1 }` with unique constraint.
- Front-end is static and served from `./public` (Vue instance in `public/app.js`) — the site uses fetch to POST `/url`.
- Security: `helmet` is used selectively (most APIs wrap `helmet.*()` calls in `index.js`). `morgan('tiny')` logs requests.

## Important routes / data contracts
- GET /:id
  - Input: path param `id` (slug). Looks up `{ slug }` in `urls` collection.
  - Success: redirects (302) to stored `url`. Also increments `clicks` via `urls.update`.
  - Not found: redirects to `/?error=<slug> not found`.

- POST /url
  - Input JSON: { url: string, slug?: string }
  - Validation: `url` -> yup url(). `slug` -> /^[\w\-]/ (lowercased in server).
  - Behavior: if no slug provided, server generates `nanoid(5)` and lowercases it. Inserts { url, slug, clicks: 0 } into `urls`.
  - Response: JSON (created object without `_id`).
  - Error: Duplicate slug is transformed from Mongo/E11000 into message 'Slug in use.' and status 555 — the front-end checks for status/message '555' and maps that to "phrase already used".

Keep this contract exact when writing tests, API docs, or new front-end code.

## Environment & run instructions (developer flows)
- Dev server (hot reload): create a `.env` with MONGODB_URI then `npm run dev` (uses `nodemon` to restart on changes).
- Production run: `npm start` (runs `node index.js`). Default PORT is `7777` if `process.env.PORT` not set.
- Example .env entry: `MONGODB_URI=mongodb://localhost:27017/shorturl`

## Project-specific conventions and gotchas
- Single-file server: prefer making minimal, additive changes to `index.js` (it's intentionally compact). If you extract modules, wire them so the same exported behavior and validation is preserved.
- Slug handling: server lowercases slugs before validation and insertion. Front-end expects this behavior; changing it requires updating `public/app.js` error/URL construction.
- Error-code quirk: duplicate-slug error maps to numeric string `555` (this is relied on by `public/app.js` which throws Error(response.status)). Preserve or migrate this behavior carefully.
- DB access: uses `monk` collection methods (`findOne`, `insert`, `update`). Keep async/await semantics and return shapes consistent.

## Examples (copy-paste friendly)
- Create short URL (curl):

  curl -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com","slug":"myfav"}' http://localhost:7777/url

- The created response: { "url":"https://example.com","slug":"myfav","clicks":0 }

## What to look at when changing behavior
- If modifying slug generation, update both `index.js` (server) and `public/app.js` (construction of `createdUrl`).
- If changing error handling or status mapping, update the front-end's error branch in `public/app.js` where it checks for `'555'`.
- If changing DB schema (e.g., adding owner/createdAt), update insert & index creation in `index.js` and adjust response sanitization (the server currently deletes `_id` before returning created object).

## Tests / CI / lint notes
- There are no tests in the repo. CI currently runs a Node workflow (`.github/workflows/node.js.yml`). Keep changes small and test locally with `npm run dev`.

## When in doubt — quick file pointers
- Start in `index.js` to understand server flow.
- See `public/app.js` for UI expectations and error handling.
- See `package.json` for scripts and dependencies (nanoid, monk, yup, helmet, morgan).

---
If any section is unclear or you'd like examples expanded (more cURL examples, sample unit tests, or a minimal refactor plan), tell me which part and I will iterate.
