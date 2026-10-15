import { useState } from 'preact/hooks';

/** Which of the three glint tiles a shine wears. */
export type GlintVariant = 'A' | 'B' | 'C';

/** The three tiles, in the order the tokens name them. */
const Variants: readonly GlintVariant[] = ['A', 'B', 'C'];

function roll(): GlintVariant {
  return Variants[Math.floor(Math.random() * Variants.length)] ?? 'A';
}

/** The glint tile this shine wears, rolled once when it mounts and never again. Local to the
 * browser and rolled afresh on every refresh: the finish is decoration rather than a signal, so
 * two players need not be shown the same one. */
export function useGlintVariant(): GlintVariant {
  const [variant] = useState(roll);
  return variant;
}
