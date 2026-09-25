# PackWise

PackWise is a food-packaging decision-support tool. It turns a food's properties plus its storage and transport conditions into explainable packaging requirements, a recommended structure, and alternatives. Built with React, Vite and React Router.

- **Landing page (`/`).** As you scroll, a 3D cardboard box unpacks and the food-category icons fly out into their cards, using pure CSS 3D transforms with no canvas and no animation library. A "How PackWise decides" section then walks through the analysis pipeline.
- **Analysis wizard (`/analyze/*`).** The flow is commodity, food profile, conditions, priorities, analysis, result, then report and compare. It follows `PackWise_Frontend_Build_Spec.md`.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

The app runs against a built-in mock API until a backend is configured:

```bash
cp .env.example .env    # then set VITE_API_BASE_URL=http://your-backend
```

With `VITE_API_BASE_URL` set, every call goes to the endpoints in the spec's §7 contract. In mock mode the wizard shows a "Demo data" pill. From the browser console you can simulate failures with `window.PackWise.mock.failNext('network' | 'validation' | 'server')`.

```bash
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Project structure

```
src/
  pages/          LandingPage, wizard/ (layout + one file per screen)
  components/     one component per file, each with its own CSS module
    icons/        SVG icon components
    wizard/       ProvenanceBadge, ConfidenceBadge, StatusPill, WizardStepper,
                  RequirementTable, WhyThisPanel, AlternativesList, form fields…
  context/        UnpackProvider, AnnouncerProvider, WizardProvider (wizard state)
  hooks/          useTheme, useFocusOnMount
  lib/            unpackEngine.js (box animation), wizardModel.js (reducer, validation, request body)
  services/       api.js (API client), packwise.js (window.PackWise hooks)
  mocks/          mock API + fixtures used when VITE_API_BASE_URL is unset
  data/           categories, quick tags, steps, pipeline stages, wizard vocabulary
  utils/          small helpers (easing maths, tag parsing, class names, summaries)
  styles/         global tokens, base and print styles
```

## Integration hooks

The landing page talks to the wizard through `window.PackWise`. `PackWiseBridge` listens for these events and routes into the wizard:

- `window.PackWise.startCategory(category)` dispatches `packwise:start-category`
- `window.PackWise.startCustom({ description, tags })` dispatches `packwise:start-custom`

Both events are dispatched on `document`. Replace either function on `window.PackWise` to handle them directly.
