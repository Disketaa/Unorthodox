import { useEffect, useState } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import { PlayerLook, randomLook, type CharacterColor } from '@/Core';
import { GalleryPage } from '@/Dev/ComponentGallery/GalleryPage';
import { JoinScreen } from '@/Screens';
import type { JoinScreenProps } from '@/Screens';
import { AccentProvider } from '@/Design/Accent';
import { GlyphField, PaperBackground } from '@/Design/Overlays';
import { useMusic, useQuietMusic } from '@/Design/Music';
import { useAccent } from './Hooks/UseAccent';
import { hostsRoom, rememberHosting } from '@/Network/RoomOwnership';
import { createRoomCode, normalizeRoomCode } from './RoomCode';
import { loadLook } from './LookStorage';
import { navigate, parseRoute, roomPath, Route } from './Routes';
import { GameRoom } from './GameRoom';
import type { GameRoomProps } from './GameRoom';

/** The player name is kept in localStorage, so it outlives the tab. Typing does not save it: the
 * name is written when a room is entered, so a half-typed name never becomes the next visit's.
 * Two tabs share it, so the host reads them as one seat. */
const NameStorageKey = 'unorthodox.playerName';

function loadName(): string {
  try {
    return localStorage.getItem(NameStorageKey) ?? '';
  } catch {
    return '';
  }
}

function saveName(value: string): void {
  try {
    localStorage.setItem(NameStorageKey, value);
  } catch {
    // Storage may be unavailable in private mode; the name then lasts for the tab only.
  }
}

/** Re-render the app whenever the hash changes. */
function useHashRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return parseRoute(hash);
}

interface WithBackgroundProps {
  children?: ComponentChildren;
}

/** The screens that sit on top of the paper background. */
function WithBackground({ children }: WithBackgroundProps) {
  return (
    <>
      <GlyphField />
      <PaperBackground />
      {children}
    </>
  );
}

/** The room, over the background. Split out so the app below stays about routing. */
function Room(props: GameRoomProps) {
  return (
    <WithBackground>
      <GameRoom {...props} />
    </WithBackground>
  );
}

/** The entry screen, over the background. The menu's track is asked for here rather than by the
 * app, so taking this screen down takes the music with it and the room is free to ask for its
 * own without the two arguing over the one bus. */
function Entry(props: JoinScreenProps) {
  useMusic('Menu');
  return (
    <WithBackground>
      <JoinScreen {...props} />
    </WithBackground>
  );
}

/** The entry screen's wiring: the name, the code, and the two ways into a room. Split out so
 * `App` stays about which screen is on rather than how the entry screen works. The role is not
 * the player's to pick here: it is what this browser remembers. */
function useEntryScreen(roomCodeFromLink?: string) {
  const [name, setName] = useState(loadName);
  const [roomCode, setRoomCode] = useState(() => roomCodeFromLink ?? '');
  const onNameChange = (value: string) => setName(value);
  const onRoomCodeChange = (value: string) => setRoomCode(normalizeRoomCode(value));
  const enter = (path: string) => {
    saveName(name);
    navigate(path);
  };
  return {
    name,
    roomCode,
    onNameChange,
    onRoomCodeChange,
    onJoin: () => enter(roomPath(normalizeRoomCode(roomCode))),
    onCreate: () => {
      const created = createRoomCode();
      // Remembered before the room is opened, because the session to host it is opened
      // on the strength of this and there is nothing to ask yet.
      rememberHosting(created);
      enter(roomPath(created));
    },
  };
}

/** The props for the room this route names, or undefined where there is no room to enter: a
 * player with no name yet is on the entry screen whatever the link said. The role is what this
 * browser may do with the room, not what the link claims. */
function roomPropsFor(
  route: Route,
  entry: ReturnType<typeof useEntryScreen>,
  look: PlayerLook,
  onLook: (look: PlayerLook) => void
): GameRoomProps | undefined {
  if (route.kind !== 'Room' || entry.name.trim().length === 0) return undefined;
  return {
    roomCode: route.roomCode,
    role: hostsRoom(route.roomCode) ? 'Host' : 'Player',
    name: entry.name.trim(),
    look,
    onLook,
  };
}

function specialRoute(route: Route, accent: CharacterColor): ComponentChildren | undefined {
  if (route.kind === 'Gallery') {
    return (
      <>
        <AccentProvider color={accent} />
        <GalleryPage />
      </>
    );
  }
  return undefined;
}

function renderRoute(
  route: Route,
  entry: ReturnType<typeof useEntryScreen>,
  look: PlayerLook,
  setLook: (look: PlayerLook) => void,
  accent: CharacterColor,
  onAccentLook: (look: PlayerLook) => void
): ComponentChildren {
  const nextLook = (next: PlayerLook) => {
    onAccentLook(next);
    setLook(next);
  };

  const special = specialRoute(route, accent);
  if (special !== undefined) return special;

  const room = roomPropsFor(route, entry, look, nextLook);
  if (room !== undefined) {
    return (
      <>
        <AccentProvider color={accent} />
        <Room {...room} />
      </>
    );
  }
  return (
    <>
      <AccentProvider color={accent} />
      <Entry {...entry} />
    </>
  );
}

export function App() {
  const route = useHashRoute();
  const entry = useEntryScreen(route.kind === 'Room' ? route.roomCode : undefined);
  const [look, setLook] = useState<PlayerLook>(() => loadLook() ?? randomLook(Math.random));
  const { accent, onLook: onAccentLook } = useAccent();

  useQuietMusic(route.kind === 'Gallery');
  return renderRoute(route, entry, look, setLook, accent, onAccentLook);
}
