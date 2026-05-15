# StoreSure — Project Summary

## Purpose

StoreSure is an ERP-style school management application. It provides a Django REST API for procurement, stores, assets, roles and messaging, and a Vite + React TypeScript frontend that consumes the API to deliver a modern admin UI.

## Tech stack

- Backend: Django (6.x compatible), Django REST Framework, drf-spectacular
- Auth: djangorestframework-simplejwt (JWT)
- DB: PostgreSQL (production) / SQLite (development)
- Frontend: React + TypeScript, Vite, Tailwind CSS, Radix UI
- Environment/config: django-environ, django-cors-headers, whitenoise

## Top-level folders

- `backend/` — Django project, apps, tests, and Python dependencies
  - `storesure_backend/` — Django project settings, URLs, WSGI
  - `common/` — shared modules (authentication, messaging, etc.)
  - `roles/` — domain apps (procurement, storekeeper, bursar, librarian, headteacher, auditor, students, staff, finance)
  - `manage.py` — Django CLI entrypoint
  - `requirements.txt` — Python dependencies
- `frontend/` — Vite + React TypeScript app
  - `src/` — React source (App.tsx, main.tsx, components, pages)
  - `package.json` — npm scripts and dependencies
  - `index.html` — frontend entry
- `docs/` — project docs (this file)

## Key files / entry points

- Backend
  - [backend/manage.py](backend/manage.py) — runserver, migrations, tests
  - [backend/storesure_backend/settings.py](backend/storesure_backend/settings.py) — env-driven Django settings (SQLite fallback shown)
  - [backend/requirements.txt](backend/requirements.txt) — pinned Python dependencies
  - Database file for local dev: `backend/db.sqlite3`
- Frontend
  - [frontend/src/main.tsx](frontend/src/main.tsx) — app bootstrap and React root
  - [frontend/src/App.tsx](frontend/src/App.tsx) — top-level component
  - [frontend/package.json](frontend/package.json) — `dev`, `build`, `preview` scripts

## Quick setup (local development)

Prereqs: Python 3.10+, Node.js + npm

Backend (local, SQLite)

1. Create & activate venv

```powershell
python -m venv .venv
.venv\Scripts\activate
```

2. Install Python deps

```powershell
pip install -r backend/requirements.txt
```

3. Create `.env` in `backend/` (set `SECRET_KEY`, `DEBUG=True` for local). Optionally set `DATABASE_URL` for PostgreSQL.

4. Migrate and run

```powershell
cd backend
python manage.py migrate
python manage.py runserver
```

Frontend

1. Install deps and start dev server

```bash
cd frontend
npm install
npm run dev
```

2. Build for production

```bash
npm run build
```

Notes:
- Frontend dev server (Vite) typically runs at `http://localhost:5173`.
- Configure frontend API base URL via environment or proxy so it points to the Django API (default backend: `http://localhost:8000`).

## Dependencies (snapshot)

- Backend (from `backend/requirements.txt`):
  - django>=5.0,<6.0
  - djangorestframework
  - djangorestframework-simplejwt
  - django-environ
  - django-cors-headers
  - drf-spectacular
  - django-filter
  - whitenoise
  - gunicorn
  - psycopg2-binary

- Frontend (from `frontend/package.json`): notable packages include
  - react, react-dom (18.x)
  - vite, typescript
  - tailwindcss, @tailwindcss/typography
  - @tanstack/react-query, react-router-dom
  - zod, react-hook-form
  - multiple Radix UI packages and shadcn-ui tooling

## Useful developer pointers

- Settings: `backend/storesure_backend/settings.py` is env-driven via `django-environ`. Check default DB (SQLite) and production hardening toggles (HSTS, secure cookies).
- API docs: drf-spectacular endpoints are enabled; run the server and browse `/api/v1/docs/` or `/api/v1/redoc/` (URLs depend on URLConf).
- Tests: backend tests exist (`test_*.py`) and can be run via `python manage.py test`.

---

If you want, I can:
- Add a short troubleshooting section (common local errors and fixes)
- Extract and list required environment variables and provide a `.env.example`
- Add quick commands for Docker or Postgres setup

## Recent frontend improvements

- **Reusable table component**: Added a generic table UI you can drop into any page by supplying a `columns` array and `data` array. See [frontend/src/components/ui/reusable-table.tsx](frontend/src/components/ui/reusable-table.tsx).
  - Columns accept `key`, `title`, optional `align`, `width`, and an optional `render(row, index)` function for custom cell rendering.
  - Container auto-selects a sensible height (defaults to half the window height) and enables scrolling when content overflows.
  - Table header is sticky and uses `font-semibold` so headers remain visible while scrolling.

- **Pagination controls**: A reusable pagination control that works with Django REST Framework style responses (`count`, `next`, `previous`, `results`) was added: [frontend/src/components/ui/table-pagination.tsx](frontend/src/components/ui/table-pagination.tsx).

- **Table wrapper tweak**: The low-level table wrapper was updated to allow disabling its internal overflow wrapper so sticky headers work correctly when the outer container scrolls. See [frontend/src/components/ui/table.tsx](frontend/src/components/ui/table.tsx).

- **Pages updated to use reusable components**:
  - `Item Master` now uses the `ReusableTable` and DRF-style pagination via `api.getInventory(page)`: [frontend/src/pages/stores/ItemMaster.tsx](frontend/src/pages/stores/ItemMaster.tsx).
  - `Suppliers Register` also converted to `ReusableTable`: [frontend/src/pages/procurement/SuppliersRegister.tsx](frontend/src/pages/procurement/SuppliersRegister.tsx).

- **API service changes**:
  - `inventoryService.getInventory(page)` now accepts an optional `page` parameter and returns a DRF-like paginated shape when not in mock mode. See [frontend/src/services/inventory.service.ts](frontend/src/services/inventory.service.ts).
  - `inventoryService.getItem(id)` is available and used to load fresh item data before opening the edit dialog in the Item Master page.
  - The aggregator `frontend/src/services/api.ts` exposes these helpers for convenient imports.

If you'd like, I can add a short example snippet to this doc showing how to call `ReusableTable` and `TablePagination` together — or convert more pages to use the shared table component.

## Latest updates (2026-05-11)

- Replaced several manual tables with the shared `ReusableTable` + `TablePagination` pattern and added paginated service helpers that return DRF-style pages (`{ count, next, previous, results }`). Notable pages updated:
  - `frontend/src/pages/stores/IssueStock.tsx` — now uses `ReusableTable` + `TablePagination` and queries `api.getS13RecordsPaginated(page)`.
  - `frontend/src/pages/stores/ReceiveStock.tsx` — converted to use reusable table + pagination (server pagination via S11 helper).

- Service helpers added:
  - `frontend/src/services/inventory.service.ts`: `getS11RecordsPaginated`, `getS13RecordsPaginated`, and `getS13Stats` (mocks + real endpoints) to standardize paginated responses.

- Combobox and item lookup:
  - `frontend/src/components/stores/ItemCombobox.tsx` now supports lazy loading (fetch on first open) and the `StoreItem` shape includes an optional `unitCost` field. When an item with `unitCost` is selected, pages (for example `SingleClassify.tsx`) prefill the unit cost input automatically.

- Stats cards: several store pages' stats cards (Issue / Receive) were wired to backend stat endpoints (e.g. `/issue/stats/`, `/receive/stats/`) and now display numeric values from `api.getS13Stats()` / `api.getS11Stats()` when available.

These changes aim to standardize table UI across the app and enable server-side pagination without altering the server API contract.

## Recent backend & workflow changes (2026-05-15)

- Requisition → SIV (S13) end-to-end flow:
  - Backend: new view to generate S13 from a Requisition, returns an S13 record and audit links (HTML/PDF/JSON). Print HTML endpoints now return raw HTML via `HttpResponse` (avoids DRF JSON encoding) and an optional PDF endpoint is available when WeasyPrint is installed.
  - Serializer fix: `RequisitionItemSerializer` had runtime errors because `SerializerMethodField`-backed properties were not included in `Meta.fields` — these fields (`in_stock`, `available`) were added to resolve DRF assertion errors.
  - Frontend: `generateSIV(requisitionId)` service was added to `frontend/src/services/procurement.service.ts` and a convenience wrapper in `frontend/src/services/requisitions.service.ts`. The Requisitions UI calls this service, then opens an inline print preview and optionally downloads a PDF.

- Combined Queues & Capitalization UX:
  - Navigation: a single `Queues` sidebar entry replaces separate links; the page contains two accessible tabs (S2 / Capitalization) instead of separate pages.
  - UX: the queues are shown inline in tab panels (no modal/dialog). Tab components are implemented to be accessible and styled to match the app theme. Where possible we use the project's design system; `@radix-ui/react-tabs` is recommended for accessibility.
  - Capitalization tab: previously displayed raw JSON — this has been replaced with a structured, card/list UI that shows human-friendly fields, status badges, and action buttons (approve, classify, view details) instead of technical dumps.

## Developer notes & next steps

- Local verification commands (frontend):

```bash
cd frontend
npm install        # if you add new UI packages (e.g. @radix-ui/react-tabs)
npm run dev        # start Vite dev server
npm run build      # run production build (CI will also run this)
```

- Backend (Django):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

- Documentation tasks completed in this update:
  - Summarized the S13 / Requisition → SIV changes and serializer fix.
  - Documented the single `Queues` navigation, inline tabs behavior, and Capitalization UI improvements.
  - Added quick verification commands for frontend and backend.

- Suggested follow-ups (not implemented in code):
  - Permission gating for the `Capitalization` sidebar link (check `user.permissions` before rendering).
  - Add example snippets showing how to use the new `generateSIV` service and the `ReusableTable` together in a page component.
  - Add a `.env.example` in `backend/` with the minimal env vars required for local dev (already documented steps assume `SECRET_KEY` and `DEBUG`).

If you'd like, I can: add a short troubleshooting section for common local errors, add a `.env.example`, or insert a small code snippet showing `generateSIV` usage in `frontend/src/pages/procurement/Requisitions.tsx`.

