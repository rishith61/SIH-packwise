# PackWise: Feature Specification (as built)

This document describes every feature PackWise has today and what each one does. It records the current state of the code, not a roadmap. Anything not built yet is listed under [Not built yet](#9-not-built-yet).

**Status:** working prototype. Every recommendation comes from a rule- and physics-based engine. Shelf-life, cost and footprint figures are prototype estimates (±30 % band) pending laboratory validation. No machine-learning model is active.

## Contents

1. [Product overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [User-facing features](#3-user-facing-features)
4. [Cross-cutting behaviour](#4-cross-cutting-behaviour)
5. [Decision engine](#5-decision-engine)
6. [API](#6-api)
7. [Knowledge base](#7-knowledge-base)
8. [Configuration, tooling and tests](#8-configuration-tooling-and-tests)
9. [Not built yet](#9-not-built-yet)

---

## 1. Product overview

PackWise is a food-packaging decision-support tool. You describe a food, how it will be stored and transported, and what matters most. PackWise then:

- explains the deterioration risks for that food under those conditions;
- derives what the package has to achieve (oxygen and moisture barrier, sealing, strength, gas atmosphere) before naming any material;
- screens a library of film structures, estimates each one's shelf life, cost and footprint, and recommends the best balance for your priorities;
- shows the alternatives, the candidates it ruled out and why, and how confident it is.

Four tools share one engine: the **Packaging analysis** wizard, the **Package Builder**, the **What-If Simulator** and the **Material Explorer**.

## 2. Architecture

| Part | Technology | Location |
| --- | --- | --- |
| Frontend | React 19, React Router 7, Vite 8, CSS modules | `src/` |
| Backend API | FastAPI, Pydantic 2 | `backend/app/api/` |
| Decision engine | Pure Python with NumPy (no web or database code) | `backend/app/engine/` |
| Storage | SQLAlchemy 2 with Alembic migrations; SQLite by default, PostgreSQL optional | `backend/app/db/`, `backend/alembic/` |
| Knowledge base | JSON seed files, loaded into the database on startup | `backend/app/seed/` |
| PDF reports | ReportLab | `backend/app/report.py` |
| ML hook (inactive) | scikit-learn gradient boosting, joblib | `backend/app/ml/` |

**Data flow:** browser → `src/services/api.js` (the only module that talks to the backend) → FastAPI routes → engine → JSON response.

**Demo mode:** when `VITE_API_BASE_URL` is unset, `api.js` routes calls to `src/mocks/mockApi.js`, which serves snapshots of real engine output from `src/mocks/fixtures/`. `backend/scripts/export_fixtures.py` regenerates those snapshots.

## 3. User-facing features

### 3.1 Landing page (`/`)

| Function | What it does |
| --- | --- |
| Unpacking-box hero | As you scroll, a 3D cardboard box opens and the food-category icons fly into their cards. It uses pure CSS 3D transforms (`lib/unpackEngine.js`), with no canvas or animation library. The animation runs on screens at least 720 × 600 px; smaller screens get a static layout. |
| Category cards | Six categories (fresh produce, grains/dry goods, dairy, meat & seafood, snacks, oils/other). Clicking one opens the analysis with the catalog filtered to that category. |
| "How PackWise decides" | The pipeline stages in order, revealed on scroll, with a "Start packaging analysis" button. |
| Custom packaging form | Describe a product in free text with quick tags. This starts the analysis with a custom food named from the description. |
| Tools section | Links to the Builder, What-If Simulator and Material Explorer. |

### 3.2 Packaging analysis (`/analyze/*`)

The analysis has three steps: **Food → Journey → Result**. A stepper shows progress, and later steps only unlock once the earlier ones are valid. Old five-step URLs (`/analyze/commodity`, `/profile`, `/conditions`, `/priorities`) redirect to the new steps.

#### Step 1: Food (`/analyze/food`)

| Function | What it does |
| --- | --- |
| Catalog search | Typeahead search over the 16 catalog foods, matching names, IDs and aliases. |
| Popular foods grid | All catalog foods, with category filter chips. Shows loading skeletons, an error state with retry, and an empty state. |
| Selected-food panel | Appears once a food is chosen. Shows the name, category, a one-line property summary and the data source. Has its own "Next" button. |
| Edit values (collapsible) | The full food profile: category, moisture %, fat %, pH, respiration class and oxidation sensitivity. Every value carries a provenance badge, and edited values are relabelled "user-edited". The panel starts open for custom foods and whenever the backend rejected a value. |
| Custom food | Enter a name and optional category for a food that isn't in the catalog. A matching built-in preset prefills example values where one exists (`data/customPresets.js`); otherwise the fields start empty. Results for custom foods are flagged as lower confidence. |
| Fresh-produce notice | Shown when the category or respiration class means gas-exchange (MAP) analysis will apply. |
| Validation | Client-side range checks (moisture 0–100 %, fat 0–100 %, pH 0–14) and a required name for custom foods. Moisture and fat together can't exceed 100 % (checked by the backend). |

#### Step 2: Journey (`/analyze/journey`)

| Function | What it does |
| --- | --- |
| Storage | Storage type (ambient, chilled or frozen), temperature, target shelf life in days, and relative humidity (slider plus input). |
| Transport | Transport mode (none, ambient, refrigerated or frozen) and stress level (low, medium or high). |
| Storage rules | Shows what the selected food supports (e.g. "Tomato: chilled or ambient storage only, at 10 °C or warmer."). If the storage type or temperature isn't supported, a plain explanation appears immediately and the analysis can't be run. See §4.3. |
| Priority weights | Four sliders (shelf life, cost, sustainability, mechanical strength), each 0–1 and labelled in words, with a bar showing their relative emphasis. |
| Hard constraints | Toggles for: must be recyclable, single material only, must be compostable, no metallised or foil layers, low cost band at most, medium cost band at most (the two cost limits replace each other). There are also controls to exclude a specific material and to set a maximum thickness in µm. Every constraint is shown as a plain label. |
| Analyze | Validates everything, then sends `POST /api/analyze`. |

#### Analysis in progress (`/analyze/running`)

| Function | What it does |
| --- | --- |
| Stage list | Six reasoning stages: reading food profile, checking deterioration risks, deriving requirements, filtering candidates, scoring and optimizing, preparing the explanation. When the response arrives, each stage completes in turn and shows what it actually found, taken from the backend's `trace` (e.g. "24 structures screened, 7 passed the hard checks"). |
| Error handling | A failed analysis shows the server's message. If a specific field was rejected, a "Fix …" button goes to the step that owns it. Retry is always available, and inputs are kept. |

#### Step 3: Result (`/analyze/result`)

| Function | What it does |
| --- | --- |
| Verdict header | The recommended structure plus a one-line plain verdict, e.g. "The closest match, but Tomato is expected to last about 15 days, short of your 20-day target." It also restates the conditions used and the analysis ID. |
| Warnings | Anything the backend flagged, e.g. "No candidate reaches the 20-day target…" or an unrecognised constraint. |
| Stale-input notice | If the inputs changed after the analysis, offers a re-run. |
| At a glance | **Shelf-life verdict:** the estimate and its range, whether and by how much it misses the target, and "Shelf life is limited by …" with a plain explanation of that limiting factor. **Cost** per pack and cost band. **Confidence** level. **Footprint** (g CO₂e) and recyclability. **What this rests on:** the backend's confidence reasons, always visible. A prototype-estimate label is shown. |
| Why this? | Expands in place to show the requirement table (target, pass/review status and provenance per row), the reasons, the fresh-produce / MAP panel, risks, the specification, alternatives, and the confidence-and-assumptions panel with the "Why not the others?" list of ruled-out candidates and their reasons. |
| Customize | Opens the Package Builder with the recommended structure loaded. |
| What if? | Opens the What-If Simulator using this analysis as the baseline. |
| Other actions | Compare & export report, edit inputs, start a new analysis. |

#### Report and compare (`/analyze/report`)

| Function | What it does |
| --- | --- |
| Side-by-side comparison | The recommendation against the alternatives you tick, on the same requirement rows plus shelf life, cost, carbon footprint, recyclability and the trade-off summary. |
| Full detail | Key figures, reasons, fresh-produce panel, specification, risks, the inputs used (each with its provenance), assumptions and every ruled-out candidate. |
| Export PDF | Downloads `GET /api/report/{id}?format=pdf`. In demo mode, or if the server can't produce it, the browser's print dialog opens instead, using a dedicated print stylesheet. |

### 3.3 Package Builder (`/builder`)

| Function | What it does |
| --- | --- |
| Start from | Choose any of the 24 library structures. Starts from `?structure=ID`, else the analysis's recommendation, else the first library structure. |
| Layer editor | Up to 7 layers, listed outside to inside. For each: pick the material, set the thickness (1–300 µm), move it up or down, or remove it. Add layers. Choose perforation (none, micro or macro). Editing switches the stack to "Custom structure". |
| Food and conditions | A shared scenario editor: use your analysis's food profile or any catalog food, plus all storage and transport conditions. The same storage rules as the analysis apply. |
| Live evaluation | Each change is sent to `POST /api/evaluate` (debounced, with earlier requests cancelled). The result shows: the shelf-life verdict with its limiting factor; tiles for cost, oxygen and moisture barrier class (with OTR/WVTR), carbon, recyclability and EPR category, and mechanical index; whether the structure passes every hard check or a plain list of why the analysis would rule it out; the requirement table; and the specification. |
| Barrier explanation | When a result misses its target despite a High barrier rating, and the limit isn't about barrier (e.g. CO₂ injury in sealed produce), a note explains why the rating doesn't help. |
| Gas mode for custom stacks | Perforated stacks are breathable. Laminates and stacks with barrier, metallised or foil plies are sealed. A single plain film is a produce bag for respiring food and a sealed pouch otherwise. So a sealed foil laminate is correctly ruled out for fresh produce. |

### 3.4 What-If Simulator (`/what-if`)

| Function | What it does |
| --- | --- |
| Baseline | Food and conditions (from your analysis or the catalog), plus the package: PackWise's recommendation for the baseline, or any library structure. |
| The change | Edit any condition, or use a preset: Cold chain lost, Warmer storage (+8 °C, moving to the next storage class if needed), Humid air (90 % RH), Rough transport, Twice the shelf life. You can also pick a different package. Changed fields are marked. |
| Default preset | On first load "Cold chain lost" is applied, so the table shows real differences. If that isn't valid for the food (e.g. raw meat can't be stored at ambient), the first valid preset is used instead. Reset returns to no change. |
| Comparison | `POST /api/what-if` returns, for each of 7 indicators (shelf life, cost, oxygen barrier, moisture barrier, carbon footprint, recyclability, mechanical index), the before and after values and whether the change is better, worse or the same. It also says whether PackWise would recommend a different package under the new conditions, and lists hard checks the package would fail after the change. |
| Storage rules | The baseline and the variant are both checked. An unsupported state is explained instead of compared. |

### 3.5 Material Explorer (`/materials`)

| Function | What it does |
| --- | --- |
| Films view | All 18 films. Search by name, family or application. Filter by family chips or "compostable only". Sort by name, oxygen barrier, moisture barrier, strength, sustainability or cost. Each card shows five 0–100 scores (oxygen barrier, moisture barrier, strength, sealability, sustainability), plus OTR, WVTR and cost per kg. Films that can't be heat-sealed note that they need a sealant layer. Filters live in the URL, so a filtered view can be shared. |
| Structures view | All 24 library structures, each with its layer stack, OTR, WVTR, strength and recyclability, typical applications, and an "Open in Builder" button. |
| Material detail (`/materials/:id`) | The full property table (OTR and WVTR with test conditions and provenance, reference thickness, density, sealability, seal range, Gelbo flex pinholes, light barrier, cost, carbon, EPR category, compostable, metallised, humidity sensitivity, contamination-tolerant seal). Also: scores, applications, food-contact standards, the library structures that use it (linked to the Builder), the three most similar materials, and the data source. |

## 4. Cross-cutting behaviour

### 4.1 Provenance and confidence

- Every food property and many engine values carry a provenance label: **source-backed**, **rule-derived**, **model-estimated**, **prototype estimate** or **user-edited**. Each label has its own badge style.
- Each result has a confidence level (**medium** for catalog foods, **prototype** for custom foods, assumed values, or when no candidate met every requirement), with the reasons listed.
- Figures based on prototype estimates are labelled as such wherever they appear.

### 4.2 Plain-language explanations

- Rejection reasons and warnings are full sentences, with no internal keys such as `max_cost_band:low`. If several cost limits are set, only the strictest one is checked.
- Every limiting factor (e.g. senescence and ripening, CO₂ injury, moisture gain, lipid oxidation, microbial spoilage) has a one-sentence explanation that says whether a better barrier would help (`src/data/failureModes.js`).
- Jargon tooltips explain OTR, WVTR, EPR, MAP, Gelbo flex, mechanical index, cost band and mono-material on hover and on keyboard focus (`components/Term.jsx`, `data/glossary.js`).

### 4.3 Physically impossible inputs

| Rule | Source |
| --- | --- |
| Storage-type temperature bands: frozen at −10 °C or below; chilled between −2 and 15 °C; ambient at 5 °C or above | `engine/context.py` |
| Fresh produce can't be frozen (freezing ruptures its cells; frozen vegetables are a different, blanched product) | Category rule (marked `_todo`) |
| Raw meat and seafood can't be stored at ambient temperature | Category rule (marked `_todo`) |
| Fresh paneer: chilled or frozen only | Per-food override (marked `_todo`) |
| Chilling-sensitive produce can't be stored below its threshold (tomato 10 °C; mango and banana 13 °C) | Source-backed catalog values |

The backend enforces these for the analysis, the Builder and the What-If simulator, and returns a field-level `VALIDATION_ERROR`. `GET /api/storage-rules` serves the same rules and messages so the UI can explain them inline before anything is computed.

### 4.4 State, accessibility and theming

- **Persistence:** wizard inputs and the last result are kept in `localStorage`, so a reload or a failed request never loses them.
- **Accessibility:** a skip link, focus moves to each new page heading, a live region announces changes, keyboard-reachable tooltips, and ARIA-labelled meters and progress. The pipeline reveal, analysis spinner and scroll hint respect reduced-motion settings; the hero box animation doesn't yet.
- **Theming:** light and dark themes, remembered across visits, with a print stylesheet for reports.
- **Layout:** works from 375 px phone width upwards, checked in both themes.
- **Errors:** every API error has the shape `{ error: { code, message, field } }`, and every screen has loading, empty and error states.

## 5. Decision engine

The pipeline in `backend/app/engine/pipeline.py`:

| # | Stage | Module | Function |
| --- | --- | --- | --- |
| 1–2 | Ingest and validate | `context.py`, `storage.py` | Normalises the request into a `Scenario`, keeping each value's provenance. Fills missing properties from the catalog record or category defaults (lowering confidence), estimates water activity from moisture, and checks temperature bands and storage rules. |
| 3 | Risks | `risks.py` | Assesses up to 13 deterioration risks with a level and the inputs that triggered them: respiration and headspace anoxia, chilling injury, condensation and fogging, dehydration, moisture ingress, moisture loss, lipid oxidation, photo-oxidation, microbial spoilage, handling and transit damage, seal contamination, acid attack, brittleness when frozen. |
| 4 | Requirements | `requirements.py`, `physics.py` | Turns risks into packaging requirements before naming any material: OTR target, WVTR target, thickness, sealability, mechanical protection, MAP, light barrier, anti-fog. Numeric targets come from solving closed-form mass-transfer models backwards from the target shelf life (steady state, linearised sorption isotherm, respiration-driven gas balance with a transit temperature excursion). |
| 5 | Filter | `gatekeeper.py` | Rules out structures that fail a hard check: the seal layer can't seal, a ply lacks food-contact approval, a sealed pack for breathing produce, a breathable film for non-respiring food, a seal that can't seal through contamination, acid attack on foil, brittleness when frozen, flex-cracking above the pinhole limit, or any of your hard constraints. |
| 6 | Evaluate | `evaluate.py`, `shelf_life.py`, `lca_cost.py` | For each structure, calculates OTR and WVTR at test and storage conditions, the equilibrium gas atmosphere for produce, perforation needs, shelf life (the shortest of the modelled mechanisms wins, with a ±30 % band), cost per pack, carbon footprint, EPR category and recyclability index, then marks each requirement row PASS or REVIEW. |
| 7 | Optimise | `optimize.py` | Enumerates the Pareto front over shelf-life margin, cost, carbon footprint, recyclability and mechanical strength, then ranks it with TOPSIS using your priority weights. Picks alternatives with distinct profiles: lowest cost, longest shelf life, lowest footprint, strongest, and a balanced alternative. If nothing meets the target, it falls back to the closest candidates with a warning. |
| 8 | Explain | `explain.py` | Writes plain-language reasons tracing input → risk → requirement → filter → selection, quoting only numbers that are in the response. Also writes a trade-off summary for each alternative and a per-stage `trace`. |
| 9 | Export | `report.py` | Renders a stored analysis as a multi-page PDF. |

**ML hook:** `pipeline.apply_predictor` can replace each shelf-life estimate with a trained model's prediction, labelled "model-estimated". It's off unless `ML_ENABLED=true` and a trained model file exists.

## 6. API

| Method and path | Purpose | Key response fields |
| --- | --- | --- |
| `GET /api/health` | Status | `status`, `engineVersion`, `commodities`, `structures`, `shelfLifeModel` |
| `GET /api/commodities?query=` | Food search | `results[]`: `commodityId`, `name`, `category` |
| `GET /api/commodities/{id}` | Default food profile | each property as `{ value, provenance, confidence }`, plus `source` and `aliases` |
| `GET /api/storage-rules` | Storage rules | `commodities{id: rule}`, `categories{category: rule}`; each rule has `allowedStorage`, `minTemperatureC` and `messages` |
| `POST /api/analyze` | Full analysis (stored) | `analysisId`, `recommendation`, `requirements`, `why`, `alternatives`, `freshProduceMode`/`freshProduce`, `confidence`, `risks`, `specifications`, `shelfLife` (with `targetDays`, `meetsTarget`), `costAndImpact`, `rejected`, `warnings`, `assumptions`, `inputsUsed`, `trace` |
| `GET /api/analyses/{id}` | A stored analysis | `request`, `result`, `createdAt` |
| `GET /api/report/{id}?format=pdf` | PDF report | `application/pdf` as an attachment |
| `POST /api/evaluate` | Evaluate one structure | `structure`, `indicators` (shelf life, cost, barrier classes, sustainability, mechanical index), `requirements`, `violations`, `specifications` |
| `POST /api/what-if` | Baseline vs change | `before`, `after`, `changes[]` (`indicator`, `before`, `after`, `direction`), `variantRecommendation` |
| `GET /api/materials` | Film list (`q`, `family`, `maxOtr`, `maxWvtr`, `recyclable`, `compostable`, `sort`) | `results[]`, `families[]` |
| `GET /api/materials/{id}` | Film detail | the film's fields plus `usedInStructures[]` and `similar[]` |
| `GET /api/structures` · `GET /api/structures/{id}` | Library structures | layers, OTR/WVTR at test conditions, mechanical index, Gelbo pinholes, EPR category, recyclability, applications |

Request bodies use camelCase. `POST /api/analyze` takes `commodity` (`commodityId` or a custom `profile`), `conditions`, `priorities` (weights and `hardConstraints`) and an optional `package`. Interactive documentation is served at `/docs`.

## 7. Knowledge base

| File | Contents |
| --- | --- |
| `commodities.json` | 16 foods: tomato, Alphonso mango, spinach, banana, red onion, potato chips, biscuits, basmati rice, wheat flour (atta), paneer, milk powder, fresh chicken, fresh fish, chilled mutton, multigrain bread, groundnut oil. Each has profile values with provenance plus engine parameters (water activity, critical moisture, gas windows, chilling threshold, microbial shelf life, MAP profile, and so on). |
| `materials.json` | 18 films (e.g. LDPE, HDPE, BOPP, BOPET, EVOH coex, metallised PET/BOPP, aluminium foil, PLA, PBS/PHA, mLLDPE, ionomer, CPP, BOPA, BOPE, coated BOPP, anti-fog grades). Each has OTR/WVTR at reference conditions, density, sealability, Gelbo flex, cost range, carbon, EPR category, food-contact standards and applications. |
| `structures.json` | 24 library structures: breathable produce films (plain, micro- and macro-perforated) and barrier laminates (metallised, foil, EVOH, nylon, mono-PE/PP, compostable). |
| `category_defaults.json` | Per-category fallbacks: typical pack, water activity, microbial life, MAP profile, storage rules. Also respiration models, MAP gas profiles, mechanical limits by transport stress, and cost factors. |
| `sources.json` | 11 cited sources referenced by the records above. |

Unsourced working assumptions carry a `_todo` note.

## 8. Configuration, tooling and tests

| Setting | Where | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | root `.env` | unset (demo mode) |
| `DATABASE_URL` | environment or `backend/.env` | SQLite at `backend/packwise.db` |
| `CORS_ORIGINS` | environment or `backend/.env` | `localhost:5173`, `127.0.0.1:5173`, `localhost:4173` |
| `AUTO_MIGRATE` | environment or `backend/.env` | `true` (run migrations and seed on startup) |
| `ML_ENABLED`, `ML_ARTIFACT_PATH` | environment or `backend/.env` | `false`, `backend/artifacts/shelf_life_gbr.joblib` |

- **Dependencies:** `package.json` for the frontend; `backend/requirements.txt` (pinned) and `backend/pyproject.toml` (ranges) for the backend.
- **Lint:** `npm run lint` runs ESLint with the recommended rules, React Hooks rules and JSX usage tracking.
- **Tests:** `pytest` in `backend/` runs 31 tests against a throwaway SQLite database, covering the API contract, error shapes, CORS, storage rules, plain-language constraint messages and cost-band dedup, custom gas mode, What-If direction, PDF rendering and font fallback.
- **Fixtures:** `python scripts/export_fixtures.py` refreshes the demo-mode snapshots.
- **Window hooks:** `window.PackWise.startCategory()` and `startCustom()` connect the landing page to the analysis. `window.PackWise.mock.failNext('network' | 'validation' | 'server')` simulates failures in demo mode.

## 9. Not built yet

- **Trained ML shelf-life model.** The training (`app/ml/train.py`), features and loader exist, but training needs at least 50 measured shelf lives across 3 or more foods. Until then every estimate comes from the rule-based models.
- **Accounts and sign-in.** The "Sign in" button in the navbar has no function yet.
- **Streaming progress.** The analysis runs as one request. The progress screen shows the backend's per-stage results once it returns.
- **Lab validation.** No figure has been checked against laboratory measurements, and the `_todo` storage rules still need sources.
- **Builder and What-If in demo mode.** They need the backend, because every package is calculated on demand.
