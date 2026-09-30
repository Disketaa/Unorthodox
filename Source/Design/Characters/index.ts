import { VNode } from 'preact';
import { CharacterId } from '@/Core';
import { Character1 } from './Character1';
import { Character2 } from './Character2';
import { Character3 } from './Character3';
import { Character4 } from './Character4';
import { Character5 } from './Character5';
import { Character6 } from './Character6';
import { Character7 } from './Character7';
import { Character8 } from './Character8';
import { Character9 } from './Character9';

/**
 * The drawing for each character, keyed by id.
 *
 * The mapping is spelled out rather than globbed so a character missing from the
 * catalogue is a build error rather than a blank space at runtime.
 */
const ArtByCharacter: Record<CharacterId, () => VNode> = {
  Character1: Character1,
  Character2: Character2,
  Character3: Character3,
  Character4: Character4,
  Character5: Character5,
  Character6: Character6,
  Character7: Character7,
  Character8: Character8,
  Character9: Character9,
};

export function artFor(character: CharacterId): () => VNode {
  return ArtByCharacter[character];
}
