# PackWise

PackWise is a decision-support tool for food packaging. Pick a food, describe how it will be stored and transported and what matters to you, and it explains what the package has to achieve, recommends a film structure, and shows the alternatives and trade-offs. Built with React + Vite and a FastAPI backend.

<!-- Screenshot placeholder: add docs/screenshot.png (the result screen works well) and replace this comment with
     ![PackWise result screen](docs/screenshot.png) -->
> 📷 _Screenshot coming soon._

> **Prototype status.** The recommendations come from a rule- and physics-based engine, not a trained model. Shelf-life, cost and footprint figures are **prototype estimates** (shown with a ±30 % band) pending laboratory validation, and the UI labels every value with where it came from (source-backed, rule-derived, prototype estimate, or user-edited). A machine-learning shelf-life predictor is **in progress**: the training and loading code exists, but no model has been trained yet because it needs real measured shelf lives. Don't use the output as a packaging specification without testing.

For the complete list of features and what each one does, see **[SPEC.md](SPEC.md)**.

## What it does

- **Packaging analysis** (`/analyze`): three steps.
  1. **Food:** search the catalog or enter a custom food. Typical properties load with their source, and you can edit them.
  2. **Journey:** set storage, transport, target shelf life, priority weights and optional hard constraints.
  3. **Result:** a one-line verdict, then shelf life against your target with what limits it, cost and confidence. "Why this?" shows the requirements, reasoning, risks, a converter-ready specification, alternatives and the candidates that were ruled out. A PDF report is available.
- **Package Builder** (`/builder`): start from a library structure, swap materials, change thicknesses or add layers, and see each change evaluated by the same engine.
- **What-If Simulator** (`/what-if`): compare a baseline with changed conditions or a different package, indicator by indicator.
- **Material Explorer** (`/materials`): browse every film and structure in the knowledge base with its barrier, strength, cost and sustainability data.
- **Landing page** (`/`): as you scroll, a 3D cardboard box unpacks and the food-category icons fly out into their cards. It uses pure CSS 3D transforms, with no canvas and no animation library.

Storage the food can't physically take is blocked with an explanation instead of being analysed: for example, frozen tomatoes, or tomatoes below their 10 °C chilling-injury threshold.

## How the engine decides

The backend (`backend/app/engine/`) runs one pipeline for every analysis:

1. **Validate the inputs and normalise them**, keeping each value's provenance. Missing values lower the confidence rather than blocking the analysis.
2. **Assess deterioration risks**, such as respiration, moisture gain or loss, oxidation and handling damage, from the food's properties and conditions.
3. **Derive packaging requirements** (oxygen and moisture transmission targets, sealing, mechanical protection, gas atmosphere) before any material is named. It does this by solving closed-form mass-transfer models backwards from the target shelf life. The models are deliberate simplifications: steady state, and a linearised sorption isotherm. They're listed in each result's assumptions.
4. **Check every library structure against hard constraints** and estimate its shelf life (the shortest limiting mechanism wins), cost, carbon footprint and EPR category.
5. **Rank the feasible candidates.** The Pareto front over shelf-life margin, cost, carbon footprint, recyclability and strength is enumerated exactly, then ranked with TOPSIS using your priority weights. The sustainability weight is split between footprint and recyclability.
6. **Explain the result** in plain language, quoting only numbers that are in the response.

## Run it

Requires Node.js 20.19+ (or 22.12+) and Python 3.11+.

```bash
# Frontend
npm install
npm run dev                     # http://localhost:5173

# Backend (in a second terminal)
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows; use `source .venv/bin/activate` elsewhere
pip install -r requirements.txt # pinned versions (or: pip install -e ".[dev]")
uvicorn app.main:app            # http://localhost:8000, API docs at /docs
```

Then point the frontend at the backend: copy `.env.example` to `.env` and set `VITE_API_BASE_URL=http://localhost:8000`.

Without `VITE_API_BASE_URL` the app runs in **demo mode** on snapshots of real engine output (`src/mocks/fixtures/`), with a "Demo data" pill. The analysis and the Material Explorer work fully in demo mode. The Builder and What-If simulator calculate on demand, so they ask for the backend.

On startup the backend creates and seeds a SQLite database (`backend/packwise.db`). Set `DATABASE_URL` to use PostgreSQL instead, and `AUTO_MIGRATE=false` to skip the automatic migration and seeding.

### Other commands

```bash
npm run lint                     # ESLint
npm run build                    # production build in dist/
npm run preview                  # serve the production build

cd backend
pytest                           # API, engine and report tests (throwaway database)
python scripts/export_fixtures.py               # refresh demo-mode snapshots after engine or seed changes
alembic revision --autogenerate -m "message"    # after changing app/db/models.py
python -m app.seed.loader                       # re-seed without restarting
```

On Windows, uvicorn's `--reload` can hang after a code change. Restart the server by hand if responses stop reflecting your edits.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/commodities?query=` · `GET /api/commodities/{id}` | Food search and default profile (each value with provenance and confidence) |
| `GET /api/storage-rules` | Storage types and minimum temperatures each food can take |
| `POST /api/analyze` | Full analysis; the result is stored |
| `GET /api/analyses/{id}` · `GET /api/report/{id}?format=pdf` | A stored analysis, and its PDF report |
| `POST /api/evaluate` | Evaluate one structure, from the library or custom layers |
| `POST /api/what-if` | Compare a baseline with changed conditions or package |
| `GET /api/materials` · `GET /api/materials/{id}` · `GET /api/structures` | Knowledge-base browsing |
| `GET /api/health` | Status and library counts |

Errors always have the shape `{ "error": { "code", "message", "field" } }`.

## Project structure

```
src/                        React + Vite frontend
  pages/                    LandingPage; wizard/ (Food, Journey, Result, Report); tools/ (Builder, What-If, Materials)
  components/               UI components, one CSS module each (wizard/ for result panels, tools/ for the scenario editor)
  context/ hooks/ lib/      wizard state, data hooks, validation and request building
  services/                 API client (the only place that talks to the backend)
  mocks/                    demo-mode API and engine snapshots
  data/                     vocabulary, glossary, failure-mode explanations
backend/                    FastAPI app
  app/engine/               the decision pipeline (pure Python, no web or database code)
  app/api/                  HTTP endpoints
  app/seed/                 knowledge base: foods, materials, structures, category defaults, sources
  app/ml/                   shelf-life model training and loading (no trained model yet)
  alembic/ tests/ scripts/
```

## Data and limitations

- **Sources.** Food properties, film data and storage thresholds come from the seed files in `backend/app/seed/`, each tagged with a source or marked as a prototype estimate. Entries marked `_todo` are working assumptions that still need a source.
- **Simplified models.** The engine uses closed-form models with named simplifications, not lab-validated simulations. Treat its numbers as a starting point for testing, not results.
- **The ML predictor is not active.** `python -m app.ml.train observations.csv` trains it once at least 50 measured shelf lives across 3 or more foods are available. Labels must be real observations, not engine output. Then set `ML_ENABLED=true`. Until then every shelf life comes from the rule-based models.

## Integration hooks

The landing page talks to the analysis through `window.PackWise`:

- `window.PackWise.startCategory(category)` dispatches `packwise:start-category`
- `window.PackWise.startCustom({ description, tags })` dispatches `packwise:start-custom`

Both events are dispatched on `document`, and `PackWiseBridge` routes them into the analysis. Replace either function on `window.PackWise` to handle them yourself.
