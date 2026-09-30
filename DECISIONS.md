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

## 2026-09-30 — the picker sizes its characters from the cell, not from a token
The character grid was three columns of a fixed 96px, so on a narrow phone three drawings
overflowed the column and pushed the panel's padding off the page. Two things were wrong
together: the grid used a bare `1fr`, whose floor is `min-content`, so a column cannot shrink
under its contents however narrow the screen is; and the drawing inside it had a fixed pixel
size. The columns are now `minmax(0, 1fr)`, and `Character` and `ColorSwatch` gained a `Fill`
size that takes its width from the cell and derives the height with `aspect-ratio`. The
drawings are square on a 512 viewBox, so that keeps them round at any width without a media
query. The tint row is `auto-fill` with a floor of a comfortable target, so the discs wrap on
a phone and spread on a wide screen rather than all eight squeezing onto one row.

## 2026-09-30 — one pop, keyed on everything, rippling across a row
A character reacts to three things: it turns up, it changes tint, it is chosen. All three run one
`Pop`, keyed on the character, its tint and a pulse count, and all three are the same movement.
There are no variants, and getting there is the lesson: it went through two nested pops, then two
variants of one pop, and both were worse than having none.

The two nested pops were wrong because remounting the outer one always recreates the inner, so
changing tint also replayed the reaction. The two variants fixed that but needed the variant to be
chosen from the previous look, because recomputing it every render changed the pop's key, and since
the roster re-renders whenever anyone joins, every player popped whenever anyone else did. That
needed a ref holding the previous trigger, and it was the most complex thing in the component for
no visible gain. One pop has none of that: the key is the trigger, and the trigger is everything
that should make it play.

A variant that grew from zero width looked fine in the picker and was wrong in the roster, where a
row of small characters flashed to nothing on every change and read as a rendering fault. So the
pop only ever squashes the height. There is now no `scale: 0` anywhere in it, which is worth
knowing before anyone adds one back for effect.

Reaction is a count rather than a flag. A flag also changes when a character is *deselected*, so
the character that lost the choice popped as though it had been picked; a count that only goes up
reacts on every click, repeats included, and leaves deselection alone. The picker keeps that count
per character, so a click raises only the character clicked.

A row ripples: the pop waits `--Pop-Stagger` per position via `--Pop-Index`, which `PlayerChip`,
`ScoreRow` and the picker grid all pass. The index is set from a ref callback rather than an
effect, and that is the whole ripple. An effect runs after the first paint, by which point the
animation has already begun, and a custom property changed mid-animation is too late to affect the
delay it was supposed to set, so every character animated at once with no wait. A ref callback runs
during the commit, before the browser has painted anything, so the delay is in place before the
animation exists.

`Character.test.tsx` covers the mechanism rather than the pixels, since a pop that stopped
replaying would look like a working app that had quietly stopped reacting. It checks that the
element is rebuilt when the trigger changes, that five re-renders in a row leave the same element
in place, and that the vertical offset stays negative across repeated mounts. Those values are
written from an effect, so a test has to wrap the render in `act` to flush it. What the pop
animates is left to the stylesheet and its own comment, since the test runner rewrites plain CSS
imports to an empty module and reading the raw file out of a test is not worth the fight. The
scoreboard passes `moving={false}`, because those rows re-order as scores land and a sway on top of
that movement is noise.
## 2026-09-30 — phase transitions and round scoring split out of the session and the actions
`HostSession` and `Game/GameActions.ts` passed the 150-line limit once the roster grew. The
rules about when a phase may end now live in `Network/HostPhases.ts`, and the rejection rule
and totals arithmetic in `Game/RoundScoring.ts`. This is a move, not a change: the same
transitions are still the only things that can trigger each other.

## 2026-09-30 — the tint row shows discs, not the artwork again
The character grid already draws all nine at full size, so repeating that artwork eight more
times for the tints made the row heavy and harder to scan than the choice needs. `ColorSwatch`
renders the tint as a plain disc instead, reading the same `--Character-Tint` custom property
the characters use, so the palette still lives in one place. Picking a tint now reports the
tint alone rather than a character-and-tint pair, because the character is already fixed by
the grid above; the character is still shown wearing the chosen tint, so the result of the
choice is visible.
