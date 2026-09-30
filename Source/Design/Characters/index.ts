import { VNode } from 'preact';
import { CharacterId } from '@/Core';
import { Butterfly } from './Butterfly';
import { Explosion } from './Explosion';
import { Daisy } from './Daisy';
import { Ghost } from './Ghost';
import { Mask } from './Mask';
import { Hat } from './Hat';
import { Heart } from './Heart';
import { Star } from './Star';

/**
 * The drawing for each character, keyed by id.
 *
 * The mapping is spelled out rather than globbed so a character missing from the
 * catalogue is a build error rather than a blank space at runtime.
 */
const ArtByCharacter: Record<CharacterId, () => VNode> = {
  Butterfly,
  Explosion,
  Daisy,
  Ghost,
  Mask,
  Hat,
  Heart,
  Star,
};

export function artFor(character: CharacterId): () => VNode {
  return ArtByCharacter[character];
}
