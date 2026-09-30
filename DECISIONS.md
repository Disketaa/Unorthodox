# DECISIONS

## 2026-09-30 — happy-dom as a dev dependency for the app smoke test
`vitest` runs in a node environment by default, so nothing rendered the app itself. A
blank page passes every unit test, because the logic modules are tested in isolation.
`happy-dom` provides a DOM for `Source/App/App.test.tsx`, which renders `<App />` once and
asserts that real content appears. It caught a bug where the join screen was not rendered
at all: a wrapper component declared as `function Wrapper(children: ComponentChildren)`
lost its children, leaving only the sibling background on the page. The same code works
when the children are taken from a props object, which is the convention used everywhere
else in the codebase. dev-only, not shipped to the browser.

## 2026-09-30 — the paper overlay shifts a CSS custom property, set from the ref
`design.md` forbids inline styles, but a value that changes every second cannot be a
static class. `PaperBackground` writes `--Overlay-TextureX` / `--Overlay-TextureY` onto
its own node through a ref, and the stylesheet consumes them in a `transform`. The
component API stays closed: callers pass nothing and cannot restyle it. A seamless
texture tiles, so the layer is oversized by `--Overlay-ShiftMax` and any offset stays
seamless, and only one axis moves per step so the drift reads as a slow sway.

A looping 138 MB ProRes clip was replaced with a 185 KB seamless JPEG. The image is small
enough not to compress, costs one request instead of decoding a video every second, and
the same look comes from moving it by hand.

## 2026-09-30 — the character art is inlined as components, not used as image files
The nine drawings arrived as SVGs with a coloured body and black linework. Tinting needs the
body to be a fill rather than baked pixels, so each drawing is now a Preact component in
`Source/Design/Characters/` whose body paths read `var(--Character-Tint)`. The alternative
was keeping them as `.svg` files and tinting with a CSS mask, but a mask cannot keep the
black linework on top of the tint, so that needed a second ink-only copy of every file. One
file per character with a plain `fill` is smaller, has no `Ink/` folder, and needs no extra
CSS per character.

## 2026-09-30 — the host remembers who each name is, so a returning player keeps their character
A player closes the tab and comes back to the lobby, and the character must still be theirs.
Nothing may be stored in the browser, and `sessionStorage` dies with the tab anyway, so the
name is the only handle that survives: the host keeps `name -> playerId` in `HostRoster` and
a player re-joining under a known name reclaims that seat, with the character the host
already had. The look a client arrives with is deliberately ignored for a known player,
since it was rolled again on their side. This also means a returning player keeps their
scores, and a reload no longer adds a duplicate to the roster. The trade-off is that two
people who pick the same name are treated as one player, which is accepted for a party game
that has no accounts.

## 2026-09-30 — the character picker lives in the lobby, and is frozen once play starts
Picking a character needs to be changeable while people are still arriving, so the picker is
part of `LobbyScreen` rather than the join screen. `SET_LOOK` is ignored by the reducer
outside the Lobby phase, which freezes everyone's face for the game: a player cannot swap
characters mid-round, and the scoreboards stay meaningful. The picker is hidden until the
host has told the client which character it kept, so it never shows a character the rest of
the room is not seeing.

## 2026-09-30 — the character catalogue lives in Core, and its labels travel as a prop
`CharacterId`, `CharacterColor` and `PlayerLook` are in `Core` because `Design` renders them,
`Game` stores them and `Network` carries them, and `Core` is the only layer all three may
import. `Design` may not import `Content`, so the picker's display names arrive as a
`labels` prop rather than being read from `Strings` directly.

## 2026-09-30 — phase transitions and round scoring split out of the session and the actions
`HostSession` and `Game/GameActions.ts` passed the 150-line limit once the roster grew. The
rules about when a phase may end now live in `Network/HostPhases.ts`, and the rejection rule
and totals arithmetic in `Game/RoundScoring.ts`. This is a move, not a change: the same
transitions are still the only things that can trigger each other.
