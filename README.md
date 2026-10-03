# PackWise

PackWise is a food-packaging decision-support tool. It turns a food's properties plus its storage and transport conditions into explainable packaging requirements, a recommended structure, and alternatives. Built with React, Vite and React Router.

- **Landing page (`/`).** As you scroll, a 3D cardboard box unpacks and the food-category icons fly out into their cards, using pure CSS 3D transforms with no canvas and no animation library. A "How PackWise decides" section then walks through the analysis pipeline.
- **Analysis wizard (`/analyze/*`).** The flow is commodity, food profile, conditions, priorities, analysis, result, then report and compare. It follows `PackWise_Frontend_Build_Spec.md`. The result shows the recommendation with shelf life against your target, cost, footprint, risks, a converter-ready specification, alternatives and the candidates that were ruled out. While it runs, the analysis screen shows what each stage found.
- **Package Builder (`/builder`).** Start from a library structure, then swap materials, change thicknesses or add layers. The same engine evaluates each change live.
- **What-If Simulator (`/what-if`).** Change temperature, humidity, transport or the package against a baseline and compare every indicator before and after.
- **Material Explorer (`/materials`).** Browse every film and structure in the knowledge base with its barrier, strength, cost and sustainability data.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

The app runs against a built-in mock API until a backend is configured:

```bash
cp .env.example .env    # then set VITE_API_BASE_URL=http://your-backend
```

With `VITE_API_BASE_URL` set, every call goes to the backend. In mock mode the app shows a "Demo data" pill and serves snapshots of real engine output from `src/mocks/fixtures/`. The wizard and Material Explorer work fully in mock mode. The Builder and What-If simulator compute on demand, so they say they need the backend. From the browser console you can simulate failures with `window.PackWise.mock.failNext('network' | 'validation' | 'server')`.

```bash
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Backend

The decision engine is a FastAPI app in `backend/` (Python 3.11+). It uses SQLite by default; set `DATABASE_URL` for PostgreSQL.

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows; use `source .venv/bin/activate` elsewhere
pip install -e ".[dev]"
uvicorn app.main:app            # http://localhost:8000, API docs at /docs
```

`--reload` works too, but on Windows uvicorn's reloader can hang after a change; restart by hand if responses stop reflecting your edits.

On startup the app runs `alembic upgrade head` and the idempotent seed loader (`AUTO_MIGRATE=false` turns this off). Then point the frontend at it with `VITE_API_BASE_URL=http://localhost:8000` in the root `.env`.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/commodities?query=` / `GET /api/commodities/{id}` | Typeahead search and default food profile |
| `POST /api/analyze` | Full analysis, including a per-stage `trace`; the result is stored |
| `GET /api/analyses/{id}` | A stored analysis |
| `GET /api/report/{id}?format=pdf` | PDF report of a stored analysis |
| `POST /api/evaluate` | Score one structure, library or custom layers (Package Builder) |
| `POST /api/what-if` | Compare a baseline with changed conditions or package (What-If Simulator) |
| `GET /api/materials`, `GET /api/materials/{id}`, `GET /api/structures` | Knowledge-base browsing (Material Explorer) |
| `GET /api/health` | Status and library counts |

```bash
pytest                                          # from backend/; uses a throwaway SQLite file
alembic revision --autogenerate -m "message"    # after changing app/db/models.py
python -m app.seed.loader                       # re-seed without restarting
python scripts/export_fixtures.py               # refresh the frontend's mock-mode snapshots after engine or seed changes
pip install -e ".[ml]" && python -m app.ml.train observations.csv  # optional model; needs ≥ 50 measured shelf lives, then ML_ENABLED=true
```

## Project structure

```
src/
  pages/          LandingPage, wizard/ (layout + one file per screen), tools/ (Builder, What-If, Materials)
  components/     one component per file, each with its own CSS module
    icons/        SVG icon components
    wizard/       ProvenanceBadge, ConfidenceBadge, StatusPill, WizardStepper,
                  RequirementTable, WhyThisPanel, AlternativesList, KeyFigures, RisksPanel,
                  SpecificationPanel, AssumptionsPanel, form fields…
    tools/        ScenarioEditor (food + conditions for the Builder and What-If)
  context/        UnpackProvider, AnnouncerProvider, WizardProvider (wizard state)
  hooks/          useTheme, useFocusOnMount, useQuery (cancellable, debounced loads)
  lib/            unpackEngine.js (box animation), wizardModel.js (reducer, validation, request body),
                  scenario.js (Builder / What-If scenarios)
  services/       api.js (API client), packwise.js (window.PackWise hooks)
  mocks/          mock API + engine snapshots (fixtures/) used when VITE_API_BASE_URL is unset
  data/           categories, quick tags, steps, pipeline stages, wizard vocabulary, tools
  utils/          small helpers (easing maths, tag parsing, class names, summaries, number formatting)
  styles/         global tokens, base and print styles
```

## Integration hooks

The landing page talks to the wizard through `window.PackWise`. `PackWiseBridge` listens for these events and routes into the wizard:

- `window.PackWise.startCategory(category)` dispatches `packwise:start-category`
- `window.PackWise.startCustom({ description, tags })` dispatches `packwise:start-custom`

Both events are dispatched on `document`. Replace either function on `window.PackWise` to handle them directly.
