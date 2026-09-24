# PackWise

Landing page for PackWise, an AI tool that recommends food packaging materials, barriers and formats. Built with React and Vite.

As you scroll, a 3D cardboard box unpacks and the food-category icons fly out into their cards. The animation uses pure CSS 3D transforms, with no canvas and no animation library.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Project structure

```
src/
  components/     one component per file, each with its own CSS module
    icons/        SVG icon components
  context/        UnpackProvider (animation engine wiring), AnnouncerProvider
  hooks/          useTheme
  lib/            unpackEngine.js: the scroll-driven box animation
  services/       packwise.js: window.PackWise integration hooks
  data/           categories, quick tags, steps
  utils/          small helpers (easing maths, tag parsing, class names)
  styles/         global tokens and base styles
```

## Integration hooks

A later wizard can plug in through `window.PackWise`:

- `window.PackWise.startCategory(category)` dispatches `packwise:start-category`
- `window.PackWise.startCustom({ description, tags })` dispatches `packwise:start-custom`

Both events are dispatched on `document`. Replace either function on `window.PackWise` to handle them directly.
