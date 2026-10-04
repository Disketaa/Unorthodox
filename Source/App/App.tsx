import { useEffect, useState } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import { PlayerLook, randomLook } from '@/Core';
import { GalleryPage } from '@/Dev/ComponentGallery/GalleryPage';
import { JoinScreen } from '@/Screens';
import type { JoinScreenProps } from '@/Screens';
import { AccentProvider } from '@/Design/Accent';
import { GlyphField, PaperBackground } from '@/Design/Overlays';
import { useAccent } from './Hooks/UseAccent';
import { hostsRoom, rememberHosting } from '@/Network/RoomOwnership';
import { createRoomCode, normalizeRoomCode } from './RoomCode';
import { loadLook } from './LookStorage';
import { navigate, parseRoute, roomPath, Route } from './Routes';
import { GameRoom } from './GameRoom';
import type { GameRoomProps } from './GameRoom';

/**
 * The player name is kept in localStorage, so it outlives the tab.
 *
 * Typing does not save it. The name is written when a room is entered, join or
 * create, so the stored name is always one the player actually committed to and
 * an abandoned half-typed name never becomes the next visit's name. Until then
 * the field is state only, and a reload inside a room shows the join screen
 * with a live room link and the next keystroke would join under a one-character
 * name, which is what the stored name prevents.
 *
 * localStorage is shared by every tab of the browser, so two tabs on one device
 * would enter as the same player. The host treats a re-joining known name as
 * the same seat, so the second tab rejoins the first rather than doubling it
 * up.
 */
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

/** The entry screen, over the background. */
function Entry(props: JoinScreenProps) {
  return (
    <WithBackground>
      <JoinScreen {...props} />
    </WithBackground>
  );
}

/**
 * The entry screen's wiring: the name, the code, and the two ways into a room.
 *
 * Split out because all of it belongs to the join screen and none of it to the
 * accent or the route, and keeping it here is what leaves `App` about which
 * screen is on rather than about how the entry screen works.
 *
 * A room link that finds this browser without a name still has its code filled
 * in, which is the one thing the link knows: the room it names. The role is not
 * the player or the host's to pick here — it is what this browser remembers
 * about the room, and `onCreate` is what starts remembering.
 */
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

export function App() {
  const route = useHashRoute();
  const entry = useEntryScreen(route.kind === 'Room' ? route.roomCode : undefined);
  const [look, setLook] = useState<PlayerLook>(() => loadLook() ?? randomLook(Math.random));
  const { accent, onLook: onAccentLook } = useAccent();
  const onLook = (next: PlayerLook) => {
    onAccentLook(next);
    setLook(next);
  };

  if (route.kind === 'Gallery') {
    return (
      <>
        <AccentProvider color={accent} />
        <GalleryPage />
      </>
    );
  }
  if (route.kind === 'Room' && entry.name.trim().length > 0) {
    const room: GameRoomProps = {
      roomCode: route.roomCode,
      // What this browser may do with this room, rather than what the link claims: the
      // code is all a link carries, so the role is remembered, not read.
      role: hostsRoom(route.roomCode) ? 'Host' : 'Player',
      name: entry.name.trim(),
      look,
      onLook,
    };
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
