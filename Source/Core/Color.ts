/** Colour maths, enough to check that two colours can be read together. WCAG 2.1 relative
 * luminance and contrast ratio, on six-digit hex only, which is all the palette needs: every
 * token here is a flat hex. */

/** One colour, split into the channels the ratios are computed from. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function clamp(value: number): number {
  return Math.min(255, Math.max(0, value));
}

function round(value: number): number {
  return Math.round(value);
}

/** Reads `#rgb` or `#rrggbb`. Returns nothing for anything else. */
export function parseHex(hex: string): Rgb | undefined {
  const value = hex.trim().replace(/^#/, '');
  const short = value.length === 3 || value.length === 4;
  const digits = short
    ? value
        .slice(0, 3)
        .split('')
        .map((c) => c + c)
        .join('')
    : value.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(digits)) return undefined;
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
  };
}

/** The colour back as `#rrggbb`. */
export function toHex({ r, g, b }: Rgb): string {
  const part = (channel: number) => clamp(round(channel)).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** One channel, linearised the way WCAG asks for. */
function linear(channel: number): number {
  const share = channel / 255;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 for black and 1 for white. The sRGB values are linearised first:
 * brightness on a screen is not linear in the stored number, so #808080 is nowhere near half as
 * bright as white. */
export function luminance(color: Rgb): number {
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}

/** The contrast ratio of two colours, from 1 to 21. Order does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = luminance(a);
  const second = luminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Whether a colour can carry text, and which text. Body text wants 4.5 and large text wants 3,
 * so a step that clears 4.5 against one of ink or white can be used either way; one between the
 * two must go dark before it can hold type. */
export interface Readable {
  /** Ink is the dark text, white the light one; exactly one is legible here. */
  ink?: Rgb;
  white?: Rgb;
}

/** Which of two candidates reads on this background. `Ink` and `White` are passed in rather than
 * hardcoded so the caller decides what its own text colours are; this only compares them. */
export function readableOn(background: Rgb, ink: Rgb, white: Rgb, minimum = 4.5): Readable {
  return {
    ink: contrastRatio(background, ink) >= minimum ? ink : undefined,
    white: contrastRatio(background, white) >= minimum ? white : undefined,
  };
}

/** The same colour with every channel scaled towards black by `amount`. */
export function darken(color: Rgb, amount: number): Rgb {
  return { r: color.r * (1 - amount), g: color.g * (1 - amount), b: color.b * (1 - amount) };
}

/** The same colour with every channel scaled towards white by `amount`. */
export function lighten(color: Rgb, amount: number): Rgb {
  return {
    r: color.r + (255 - color.r) * amount,
    g: color.g + (255 - color.g) * amount,
    b: color.b + (255 - color.b) * amount,
  };
}

/** The average of two colours, channel by channel. */
export function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  };
}