import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PhaseSplashCovered, PhaseSplashMs } from '../Source/Design/Overlays';
import { GameConfig } from '../Source/Game';
import { stylesheet, tokenReader } from './Stylesheet';

/** The change-of-phase splash, read from the stylesheet. The same reason the count-in's test
 * reads declarations rather than rendering: happy-dom does not run an animation and does not
 * time one, so what can be checked is the movement the stylesheet asks for. */
const sheet = stylesheet('../Source/Design/Overlays/PhaseSplash/PhaseSplash.module.css');
const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenValue = tokenReader(tokens);

/** One keyframe step of a `@keyframes` block, as it was written. A step may be written for
 * several offsets at once — `0%,\n 85% {` — so the offset is matched as a whole word and the
 * body of whichever step names it is returned. */
function step(name: string, at: string): string {
  const frames = sheet.text.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`));
  if (frames?.[1] === undefined) throw new Error(`no @keyframes ${name}`);
  const found = frames[1].match(new RegExp(`(?:^|[,\\s])${at}%[^{]*\\{([^}]*)\\}`));
  if (found?.[1] === undefined) throw new Error(`no ${at}% step in ${name}`);
  return found[1].replace(/\s+/g, '');
}

describe('when the screen may be changed', () => {
  it('is only while the yellow is solid across the whole window', () => {
    // The room swaps its screen inside this window, so a change of phase happens behind flat
    // colour. Outside it the room is partly visible, and a screen changed there would be caught
    // halfway through changing.
    const discFull = Number(
      sheet.text.match(/@keyframes PhaseSplashDisc[\s\S]*?(\d+)% \{\s*scale: 1;/)?.[1]
    );
    const holeOpens = Number(
      sheet.text.match(/@keyframes PhaseSplashHole[\s\S]*?(\d+)% \{\s*--Splash-Hole: 0%;/)?.[1]
    );
    expect(PhaseSplashCovered.from).toBe(discFull / 100);
    expect(PhaseSplashCovered.to).toBe(holeOpens / 100);
    expect(PhaseSplashCovered.from).toBeLessThan(PhaseSplashCovered.to);
  });

  it('leaves the room long enough on screen to be read', () => {
    // The window is the only part of the splash the room spends looking at a mark it can read,
    // so it has to be most of the movement rather than a sliver of it.
    expect(PhaseSplashCovered.to - PhaseSplashCovered.from).toBeGreaterThan(0.5);
  });
});

describe('the phase splash', () => {
  it('runs for the length the code takes the layer away at', () => {
    // The two are in different files and neither can read the other, so this is the only
    // thing keeping them in step: a splash the stylesheet finished before the layer was
    // taken away would cut the fade off, and the other way round would leave a sheet of
    // yellow sitting on the room after the phase had moved on.
    expect(Number(tokenValue('--Duration-PhaseSplash').replace('ms', ''))).toBe(PhaseSplashMs);
  });

  it('is not a phase, so no clock is measured against it', () => {
    // The length lives in the overlay and not in `GameConfig.timing`: a number among the
    // phase durations there reads as a phase the room waits out, and this is a movement
    // played over a move that has already happened.
    expect('phaseSplashMs' in GameConfig.timing).toBe(false);
  });

  it('takes the pointer, so nothing under it can be pressed', () => {
    // Not `pointer-events: none`, which would let a press reach the screen the splash is
    // covering — and in Reviewing that screen is the vote buttons.
    expect(sheet.ruleBody(/\.Root\s*\{([^}]*)\}/)).not.toContain('pointer-events:none');
  });

  it('covers the whole window, since what is changing is the room and not one screen', () => {
    // `fixed` against the window and not a panel: the answers being read are on this screen
    // and the phase note is on that one, and a veil over half of it would be over neither.
    expect(sheet.ruleBody(/\.Root\s*\{([^}]*)\}/)).toContain('position:fixed');
    expect(sheet.ruleBody(/\.Root\s*\{([^}]*)\}/)).toContain('inset:0');
  });
});

describe('the yellow', () => {
  it('is the room yellow, since this is a fact about the room and not about the viewer', () => {
    // The same fixed yellow as the crown, the start button and this player's own chip: a fact
    // every player in the room agrees on should not wear one person's chosen tint.
    expect(sheet.declaration(/\.Disc\s*\{([^}]*)\}/, 'background-color')).toContain(
      'var(--Color-Room-Yellow)'
    );
  });

  it('comes up as a disc rather than as a sheet over the window', () => {
    // A flat fill arriving all at once is the one thing this is competing with. Drawn oversize,
    // because a circle centred in a window has to reach the corners and the diagonal is longer
    // than either side of it.
    expect(sheet.declaration(/\.Disc\s*\{([^}]*)\}/, 'border-radius')).toBe('50%');
    expect(sheet.declaration(/\.Disc\s*\{([^}]*)\}/, 'width')).toBe('150vmax');
    expect(sheet.ruleBody(/\.Disc\s*\{([^}]*)\}/)).toContain('aspect-ratio:1');
  });

  it('is full before the mark has settled, so the mark always lands on the colour', () => {
    const discFull = Number(sheet.text.match(/@keyframes PhaseSplashDisc[\s\S]*?(\d+)% \{\s*scale: 1;/) ?.[1]);
    const markSettled = Number(sheet.text.match(/@keyframes PhaseSplashGrow[\s\S]*?(\d+)% \{\s*scale: 0\.25;/) ?.[1]);
    expect(discFull).toBeLessThan(markSettled);
  });

  it('goes out as a hole opening from the middle, not as the yellow fading', () => {
    // The entrance played backwards: the room comes back in the middle of the yellow and the
    // rim closes inward. The hole is a mask rather than a second colour, so what shows through
    // is the actual room with its own paper on it.
    expect(sheet.declaration(/\.Disc\s*\{([^}]*)\}/, 'mask-image')).toContain(
      'radial-gradient'
    );
    expect(sheet.declaration(/\.Disc\s*\{([^}]*)\}/, 'mask-image')).toContain('--Splash-Hole');
    expect(step('PhaseSplashHole', '0')).toContain('--Splash-Hole:0%');
    expect(step('PhaseSplashHole', '85')).toContain('--Splash-Hole:0%');
    expect(step('PhaseSplashHole', '100')).toContain('--Splash-Hole:100%');
  });

  it('opens the hole rather than jumping it', () => {
    // Registered, because a custom property with no type on it cannot be interpolated: the hole
    // would appear as a pinhole and then as the whole disc rather than opening between them.
    expect(sheet.text).toMatch(
      /@property --Splash-Hole \{\s*syntax: '<percentage>';\s*inherits: false;/
    );
  });
});

describe('the mark in the middle of it', () => {
  it('is laid out at the window and grown to a quarter of it', () => {
    // Laid out at the whole window so the scale in the keyframes is the share of the window the
    // mark takes: 0.25 there is a quarter of it here. It also keeps the drawing a vector — `scale`
    // rasterises the mask at the element's laid-out size and stretches it afterwards, so a mark
    // laid out at the window and shrunk to a quarter is only ever scaled down.
    expect(sheet.declaration(/\.Mark\s*\{([^}]*)\}/, 'width')).toBe('min(100vw,100vh)');
    expect(step('PhaseSplashGrow', '20')).toContain('scale:0.25');
  });

it('is centred on the window rather than laid out in it', () => {
  // Absolute and centred in both directions, so the mark sits in the middle of the colour
  // rather than beside it.
    expect(sheet.ruleBody(/\.Mark\s*\{([^}]*)\}/)).toContain('translate:-50%-50%');
  });

it('grows to a quarter of the window, overshooting by a hundredth', () => {
    // Nothing, up to a quarter of the window, held while the room reads it. The overshoot is
    // where the back-out curve lands and is still under one, so the mask is never stretched
    // past the size it was drawn at.
    expect(step('PhaseSplashGrow', '0')).toContain('scale:0');
    expect(step('PhaseSplashGrow', '16')).toContain('scale:0.26');
    expect(step('PhaseSplashGrow', '20')).toContain('scale:0.25');
    expect(step('PhaseSplashGrow', '85')).toContain('scale:0.25');
  });

it('leaves by growing as it fades, both starting at the same moment', () => {
    // The mark drifts out of the yellow and dims in one movement: a mark that faded where it
    // stood, or shrank out from the middle, was being wound back in rather than taken away.
    // Both halves begin at the same step, so the mark is never either full size or already gone.
    expect(step('PhaseSplashGrow', '85')).toContain('scale:0.25');
    expect(step('PhaseSplashGrow', '100')).toContain('scale:0.3');
    expect(step('PhaseSplashGrow', '100')).toContain('opacity:0');
  });

it('holds the mark at full opacity until the very end', () => {
    // The opacity is named at every step and flat at one through the growth and the hold. An
    // opacity written only at the last step is one the browser is free to interpolate across the
    // steps in between, which fades the mark long before it is supposed to go.
    expect(step('PhaseSplashGrow', '0')).toContain('opacity:1');
    expect(step('PhaseSplashGrow', '16')).toContain('opacity:1');
    expect(step('PhaseSplashGrow', '20')).toContain('opacity:1');
    expect(step('PhaseSplashGrow', '85')).toContain('opacity:1');
    expect(step('PhaseSplashGrow', '100')).toContain('opacity:0');
  });

  it('leaves late, so the mark is read before it is taken away', () => {
    // Almost all of the movement is the mark at rest: the growth is over by a fifth, and the
    // exit does not begin until the last seventh. What is left between them is the only part of
    // the splash the room does anything with.
    expect(step('PhaseSplashGrow', '20')).toContain('scale:0.25');
    // The last step that holds the mark at its size, which is the one the exit is measured from:
    // the step at a fifth also holds it, and that one is the growth finishing rather than the
    // mark being read.
    const holds = [...sheet.text.matchAll(/(\d+)% \{\s*scale: 0\.25;\s*opacity: 1;/g)];
    expect(Number(holds[holds.length - 1]?.[1])).toBeGreaterThan(80);
  });

  it('gets there faster than it leaves, so most of it is the mark being read', () => {
    // The growth is punctuation around a hold rather than the thing being held: it arrives in
    // the first fifth of the movement and only starts leaving at the last seventh, so the room
    // spends most of the splash looking at a mark that has already settled.
    const arrivedAt = Number(sheet.text.match(/(\d+)% \{\s*scale: 0\.26/)?.[1]);
    const leavesAt = Number(
      sheet.text.match(/(\d+)% \{\s*scale: 0\.25;\s*opacity: 1;\s*animation-timing-function: var\(--Easing-Smooth\)/)?.[1]
    );
    expect(arrivedAt).toBeLessThan(25);
    expect(leavesAt).toBeGreaterThan(75);
  });

  it('never scales past the size it was drawn at, which is what keeps it a vector', () => {
    // `scale` rasterises the mask at the element's laid-out size and stretches that bitmap
    // afterwards, so anything above one would be a raster mark with a soft edge.
    const scales = [...sheet.text.matchAll(/scale:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    expect(scales.length).toBeGreaterThan(0);
    expect(Math.max(...scales)).toBeLessThanOrEqual(1);
  });

  it('bounces only on the way in, and leaves on a plain curve', () => {
    // The back-out carries the arrival and nothing else: a back-out on the way down overshoots
    // past its target and comes back, which flings the mark off screen and into the room again
    // before the splash has ended. Linear on the animation, with the curve on each step.
    const mark = sheet.ruleBody(/\.Mark\s*\{([^}]*)\}/);
    expect(mark).toContain('PhaseSplashGrowvar(--Duration-PhaseSplash)linearboth');
    expect(step('PhaseSplashGrow', '0')).toContain(
      'animation-timing-function:var(--Easing-Bounce)'
    );
    expect(step('PhaseSplashGrow', '85')).toContain(
      'animation-timing-function:var(--Easing-Smooth)'
    );
    expect(step('PhaseSplashGrow', '100')).not.toContain('Easing-Bounce');
  });

  it('never grows past its own size, which is what keeps it a vector', () => {
    // `scale` rasterises the mask at the element's laid-out size and stretches that bitmap
    // afterwards, so a mark thrown past one is a raster mark with a soft edge. The overshoot is
    // therefore on the way in and barely over, and the exit is a shrink rather than a zoom out.
    const scales = [...sheet.text.matchAll(/scale:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    expect(scales.length).toBeGreaterThan(0);
    expect(Math.max(...scales)).toBeLessThanOrEqual(1.05);
  });

  it('eases, rather than moving at one speed the whole way', () => {
    // Linear scale and linear opacity together read as a slide, and a slide over a second of
    // someone's screen is the cheapest thing this could be.
    expect(sheet.declaration(/\.Disc\s*\{([^}]*)\}/, 'animation')).toContain(
      'PhaseSplashDiscvar(--Duration-PhaseSplash)linearboth'
    );
  });

  it('runs long enough to read the name in it', () => {
    // Most of the movement is the mark standing still being looked at, so the length is what
    // the room gets to read it for rather than how long the growth takes.
    expect(PhaseSplashMs).toBe(750);
  });

  it('sways on the movement the wordmark wears, without displacing the growth', () => {
    // The sway is composed onto the mark and named in its own `animation` list, because
    // `animation` is one property: a second class declaring its own would replace the growth
    // instead of joining it, and the mark would sit at one size for the whole splash.
    const mark = sheet.ruleBody(/\.Mark\s*\{([^}]*)\}/);
    expect(mark).toContain("composes:Movingfrom'../../Primitives/Sway/Sway.module.css'");
    expect(mark).toContain('var(--Sway-Animation),PhaseSplashGrow');
    expect(sheet.text).not.toMatch(/\.Moving\s*\{/);
  });

  it('is the same drawing the wordmark wears', () => {
    // Two files for one mark is one mark that can drift from the other, so both read the
    // same file rather than one of them being a copy.
    expect(sheet.declaration(/\.Mark\s*\{([^}]*)\}/, 'mask-image')).toContain('Unorthodox.svg');
    expect(
      stylesheet('../Source/Design/Components/Wordmark/Wordmark.module.css').declaration(
        /\.Mark\s*\{([^}]*)\}/,
        'mask-image'
      )
    ).toContain('Unorthodox.svg');
  });

  it('is drawn over the yellow rather than in it, or it is not there at all', () => {
    expect(sheet.declaration(/\.Mark\s*\{([^}]*)\}/, 'background-color')).toContain(
      'var(--Color-Text-Default)'
    );
  });
});
