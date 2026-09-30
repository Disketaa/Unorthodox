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
