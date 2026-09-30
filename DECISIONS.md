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

## 2026-09-30 — one `Pop` primitive, one squash, for every character reaction
A character reacts to three things: it turns up, it changes tint, and it is chosen. Those were
three mechanisms, written as three pieces of the Character component: an idle sway of its own, a
reveal that swept an edge across it, and a `selected` scale on a layer between them. They are now
two things, a `Pop` primitive in `Design/Primitives` for every reaction, and the idle sway, which
is continuous rather than a reaction and stays where it is.

`Pop` has two variants that differ only in whether the character starts from zero width. Both
squash from `--Pop-Squash` down to true over `--Duration-Pop`, so arriving and being chosen are
unmistakably the same movement: `Appear` grows out of a point, `Effort` only squashes, because it
is reacting to a choice rather than turning up. `Character` composes two of them, the outer keyed
on whether it is chosen and the inner on its tint, so a tint change does not also replay the
chosen pop. They are separate elements because two animations on one element overwrite each other,
and the individual `scale`, `rotate` and `translate` properties compose with the idle `transform`
on the ancestor, so all three can play at once.

Getting there took three attempts at arriving. The first revealed with a hard edge sweeping left
to right, which read as a slide: the character travelled rather than arrived. The second grew from
nothing but varied its overshoot per character, which read as nine separate animations rather than
one movement repeated. What works is one fixed squash, with the randomness moved to where each
character arrives from, so the mechanism is identical and the arrivals differ.

The squash and the duration belong to the primitive, so every reaction is the same movement. What
a character contributes is only what makes it differ from its neighbours: where it comes from and
how it is cocked when it gets there, passed as `--Pop-*` custom properties and picked up by
inheritance. The vertical offset is negative by construction rather than by luck, so characters
drop into place instead of surfacing. The idle sway rolls six values the same way, and the two
together are what make a row read as a crowd: a shared duration and amplitude would make nine
characters look like one item on a conveyor.

Two things to know before changing this. A `var()` cannot be used *inside* the `steps()` function:
the build strips the wrapper and leaves `steps(Steps)`, an invalid timing function that silently
cancels the animation with no error at all. The step count and keyword therefore travel as one
finished `steps()` call in a custom property, which does survive. And cancelling the animation
under `prefers-reduced-motion` is not enough on its own: the pop starts collapsed, so the finished
`scale`, `rotate` and `translate` have to be stated explicitly or the character stays invisible.

`Character.test.tsx` covers the mechanism rather than the pixels, since a pop that stopped
replaying would look like a working app that had quietly stopped reacting. It checks that each
element is rebuilt when the thing it reacts to changes, that a tint change leaves the chosen pop
alone, and that the vertical offset stays negative across repeated mounts. Those values are
written from an effect, so a test has to wrap the render in `act` to flush it. The scoreboard
passes `moving={false}`, because those rows re-order as scores land and a sway on top of that
movement is noise.
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
