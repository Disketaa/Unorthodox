# Unorthodox

Party game for writing unusual answers and letting the group vote on the best one.

Live: https://disketaa.github.io/Unorthodox/

## Run locally
```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm test         # unit tests
```

## Change the theme
All colors, spacing and radii live as CSS variables in `Source/Design/Tokens/Tokens.css`.
Edit the `--Color-*` / `--Space-*` scales there and the whole UI updates; no component changes needed.

## Add a component
1. Create `Source/Design/Components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `index.ts`.
2. Export it from `Source/Design/Components/index.ts`.
3. Add a `<Name>.Gallery.tsx` entry to preview it in the component gallery.
4. Use it as `<Name />` in any screen.

## Deploy
Push to `main`; the `Deploy to GitHub Pages` workflow builds and publishes to Pages.
Set Settings → Pages → Source to **GitHub Actions** once, if it is not already.
