import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { GameConfig } from '../Source/Game';
import { stylesheet, tokenReader } from './Stylesheet';

/** The shade over the room before the count-in starts, read from the stylesheet. The same reason
 * the layout tests read declarations rather than render: happy-dom does not run an animation
 * and does not time one, so what can be checked is the length the stylesheet asks for. */
const sheet = stylesheet('../Source/Design/Overlays/StartCountdown/StartCountdown.module.css');
const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);

/** The one thing the veil and the code have to agree on: how long the shade takes. */
const VeilMs = 300;

describe('the count-in veil', () => {
  it('takes its length from the token the code is measured against', () => {
    // The shade's own rule and not one a leaving state would add to it, which is a
    // different rule about a different animation entirely.
    const animation = sheet.declaration(/(?:^|})\s*\.Dim\s*\{([^}]*)\}/, 'animation');
    expect(animation).toContain('var(--Duration-CountVeil)');
  });

  it('runs for the same length the code waits before the first number', () => {
    // Both sides are in different languages, so nothing keeps them in step but this: a
    // veil that faded in faster than the code waited would show the first number
    // arriving into a shade that was still on its way up.
    expect(Number(tokenValue('--Duration-CountVeil').replace('ms', ''))).toBe(VeilMs);
    expect(GameConfig.timing.startVeilMs).toBe(VeilMs);
  });

  it('takes the pointer, so nothing under it can be pressed', () => {
    // Not `pointer-events: none`, which would let every press through to the room the
    // count-in is covering.
    expect(sheet.ruleBody(/\.Root\s*\{([^}]*)\}/)).not.toContain('pointer-events:none');
  });
});

describe('the shade leaving', () => {
  it('has no fade out of its own', () => {
    // The layer is taken away once the count is over and the writing screen arrives on
    // the page's own fade. A second fade here would be two movements racing each other
    // rather than the page's fade being the hand-off.
    expect(sheet.text).not.toContain('@keyframes VeilOut');
    expect(sheet.text).not.toMatch(/\.Leaving/);
  });

  it('leaves the number alone as well: it is simply gone by then', () => {
    // The number must not fade at the end of its own beat, since the shade leaving is
    // the one thing that says the count is over.
    const frames = sheet.text.match(/@keyframes CountTick \{([\s\S]*)\n\}/);
    const last = frames?.[1]?.match(/100% \{([^}]*)\}/);
    expect(last?.[1]?.replace(/\s+/g, '')).toContain('opacity:1');
  });
});

describe('the number arriving', () => {
  /** One keyframe step of a `@keyframes` block, as it was written. */
  function step(name: string, at: string): string {
    const frames = sheet.text.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*)\\n\\}`));
    if (frames?.[1] === undefined) throw new Error(`no @keyframes ${name}`);
    const found = frames[1].match(new RegExp(`${at}% \\{([^}]*)\\}`));
    if (found?.[1] === undefined) throw new Error(`no ${at}% step in ${name}`);
    return found[1].replace(/\s+/g, '');
  }

  it('comes up from under its size, rather than being there from the first frame', () => {
    // A number that is simply there is a number with no arrival, and this is the only
    // movement the count-in has to say the room is counting.
    expect(step('CountTick', '0')).toContain('scale:0.4');
    expect(step('CountTick', '0')).toContain('opacity:0');
    expect(step('CountTick', '30')).toContain('scale:1');
  });

  it('overshoots on the way up, which is what makes it a pop', () => {
    // The spring easing carries it past one and back; a straight tween to one reads as
    // a zoom rather than as something turning up.
    expect(sheet.declaration(/(?:^|})\s*\.Stage\s*\{([^}]*)\}/, 'animation')).toContain(
      'var(--Easing-Spring)',
    );
  });

  it('is on the number and not on the wrapper, which only sways', () => {
    // One element holds one `animation`, so the sway and the arrival are two elements.
    // The arrival on the wrapper would have replaced the sway instead of joining it.
    expect(sheet.text).toMatch(/\.Stage\s*\{[^}]*CountTick/);
  });
});
