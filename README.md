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

## Connecting across networks
Peers meet over nostr relays and connect directly, with no server of ours. Relays and STUN servers
live in `Source/Network/Signaling.ts`. On a symmetric NAT, or where STUN is blocked, set
`VITE_TURN_URL`, `VITE_TURN_USERNAME` and `VITE_TURN_CREDENTIAL` to a TURN server you control;
all three are required or none are used. The browser console reports each relay and peer state.
