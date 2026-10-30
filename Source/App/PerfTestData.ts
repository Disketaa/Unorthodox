import { PublicPlayer } from '@/Game';
import { CharacterId, CharacterColor } from '@/Core';
import type { ScoreEntry } from '@/Screens/Types';
import type { AnswerAuthor } from '@/Design/Components/AnswerCard';
import type { ThemeId } from '@/Core';

function playerLook(character: CharacterId, color: CharacterColor): { character: CharacterId; color: CharacterColor } {
  return { character, color };
}

export const emptyThemes: readonly ThemeId[] = [];
export const emptyCustomThemes: readonly never[] = [];

export const mockPlayers: PublicPlayer[] = [
  { id: 'host', name: 'Хост', isOnline: true, look: playerLook('Butterfly', 'Coral') },
  { id: 'p1', name: 'Аня', isOnline: true, look: playerLook('Daisy', 'Amber') },
  { id: 'p2', name: 'Боря', isOnline: true, look: playerLook('Ghost', 'Yellow') },
  { id: 'p3', name: 'Вера', isOnline: true, look: playerLook('Mask', 'Lime') },
  { id: 'p4', name: 'Гоша', isOnline: true, look: playerLook('Hat', 'Mint') },
  { id: 'p5', name: 'Дина', isOnline: true, look: playerLook('Heart', 'Sky') },
  { id: 'p6', name: 'Егор', isOnline: true, look: playerLook('Star', 'Violet') },
  { id: 'p7', name: 'Жанна', isOnline: true, look: playerLook('Butterfly', 'Rose') },
  { id: 'p8', name: 'Кира', isOnline: true, look: playerLook('Daisy', 'Coral') },
  { id: 'p9', name: 'Лёша', isOnline: true, look: playerLook('Ghost', 'Amber') },
];

export const mockScores: ScoreEntry[] = mockPlayers.map((p, i) => ({
  playerName: p.name,
  character: p.look.character,
  color: p.look.color,
  score: (10 - i) * 3,
  rank: i + 1,
  index: i,
}));

export const mockAuthors: AnswerAuthor[] = mockPlayers.map((p) => ({
  id: p.id,
  name: p.name,
  color: p.look.color,
  character: p.look.character,
}));

export const mockGroups = [
  {
    groupId: 0,
    text: 'Яблоко',
    playerCount: 1,
    voted: false,
    isEmpty: false,
    likes: 0,
    liked: false,
    own: false,
    authors: [mockAuthors[0]],
    writerDelays: [500],
    ownPlayerId: 'host',
    authorsShown: true,
    landed: 1,
    revealed: true,
    enchanted: false,
  },
  {
    groupId: 1,
    text: 'Груша',
    playerCount: 2,
    voted: false,
    isEmpty: false,
    likes: 1,
    liked: false,
    own: false,
    authors: [mockAuthors[1], mockAuthors[2]],
    writerDelays: [800, 1200],
    ownPlayerId: 'host',
    authorsShown: true,
    landed: 2,
    revealed: true,
    enchanted: false,
  },
  {
    groupId: 2,
    text: 'Апельсин',
    playerCount: 3,
    voted: false,
    isEmpty: false,
    likes: 2,
    liked: true,
    own: false,
    authors: [mockAuthors[3], mockAuthors[4], mockAuthors[5]],
    writerDelays: [1500, 2000, 2500],
    ownPlayerId: 'host',
    authorsShown: true,
    landed: 3,
    revealed: true,
    enchanted: false,
  },
  {
    groupId: 3,
    text: 'Банан',
    playerCount: 4,
    voted: false,
    isEmpty: false,
    likes: 3,
    liked: false,
    own: false,
    authors: [mockAuthors[6], mockAuthors[7], mockAuthors[8], mockAuthors[9]],
    writerDelays: [3000, 3500, 4000, 4500],
    ownPlayerId: 'host',
    authorsShown: true,
    landed: 4,
    revealed: true,
    enchanted: false,
  },
];
