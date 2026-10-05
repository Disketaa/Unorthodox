# Unorthodox

Party game for writing unusual answers and letting the group vote on the best one.

Live: https://disketaa.github.io/Unorthodox/

## Run locally
```bash
npm install
npm run dev        # dev server (http://localhost:5173)
npm run build      # production build to dist/
npm test           # unit tests (watch)
npm run test:once  # unit tests (single run)
npm run lint       # ESLint
npm run typecheck  # tsc over Source, Tools and Tests
npm run comments   # comment audit
npm run check      # lint + typecheck + comment audit + test:once + build
```

Requires Node 20.19+ (Vite 8). Debug from VS Code: `.vscode/launch.json` has
`Dev server + debug app` (compound, starts `npm run dev` then Chrome),
single-file vitest debugging, and an Edge variant. `.vscode/` is gitignored.

## The `uq` alias
`Tools\Cli` is on the PATH, so `uq` runs from any directory in a fresh terminal. It calls the
npm scripts above, so it is a shortcut and not a second toolchain. It exists for the two things
`npm run` cannot express: linting one path instead of the tree, and running the tests RELATED to
what you changed instead of all 936.

| Command | What it runs |
|---|---|
| `uq lint [paths...]` | ESLint. No paths = the whole repo. |
| `uq fix [paths...]` | ESLint `--fix`. |
| `uq tc` | `tsc` over `Source`, `Tools` and `Tests`. |
| `uq tc <path>` | `tsc` for the one scope that path belongs to. |
| `uq t [filter]` | Tests related to uncommitted work, or all if nothing is uncommitted. |
| `uq rel <paths...>` | Tests related to those paths. |
| `uq ta [filter]` | Every test. This is the 936-test, 20-second run. |
| `uq cm` / `uq cf` | Comment audit / rewrite comments to the canonical shape. |
| `uq check` | The full `npm run check`. |

`uq t` on a token change runs 113 tests in about half a second. Two details behind it:

- Relatedness comes from `vitest related`, which walks the import graph, so a changed module runs
  exactly the suites that import it.
- A changed `.css` file runs the `Tests/` suites as well. Those read stylesheets with `node:fs`
  rather than importing them, so the import graph cannot see a token change at all.

To put `Tools\Cli` on the PATH yourself:
```powershell
[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ';C:\Projects\Unorthodox\Tools\Cli', 'User')
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
