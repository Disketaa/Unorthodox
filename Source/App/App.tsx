import { useEffect, useState } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import { PlayerLook, randomLook } from '@/Core';
import { GalleryPage } from '@/Dev/ComponentGallery/GalleryPage';
import { JoinScreen } from '@/Screens';
import { PaperBackground } from '@/Design/Overlays';
import { createRoomCode, normalizeRoomCode } from './RoomCode';
import { parseRoute, roomPath, Route } from './Routes';
import { GameRoom } from './GameRoom';

/**
 * The player name is kept in sessionStorage, which is scoped to one tab.
 *
 * It has to survive a reload, otherwise reloading inside a room shows the join
 * screen with a live room link and the next keystroke joins the game under a
 * one-character name. localStorage would survive reloads too, but it is shared
 * by every tab of the browser, so two tabs would enter as the same player.
 */
const NameStorageKey = 'unorthodox.playerName';

function loadName(): string {
  try {
    return sessionStorage.getItem(NameStorageKey) ?? '';
  } catch {
    return '';
  }
}

function saveName(value: string): void {
  try {
    sessionStorage.setItem(NameStorageKey, value);
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
      <PaperBackground />
      {children}
    </>
  );
}

export function App() {
  const route = useHashRoute();
  const [name, setName] = useState(loadName);
  const [roomCode, setRoomCode] = useState('');
  // Rolled once per page load, so everyone arrives with a different face. The
  // host is what keeps it: a player who leaves and comes back is given the
  // character it already had for them, not a new roll. Changing it later is the
  // lobby's job, so the host can refuse once the game has started.
  const [look] = useState<PlayerLook>(() => randomLook(Math.random));

  const onNameChange = (value: string) => {
    setName(value);
    saveName(value);
  };
  const onRoomCodeChange = (value: string) => setRoomCode(normalizeRoomCode(value));
  const onJoin = () => {
    window.location.hash = roomPath(normalizeRoomCode(roomCode), 'Player');
  };
  const onCreate = () => {
    window.location.hash = roomPath(createRoomCode(), 'Host');
  };

  if (route.kind === 'Gallery') {
    return <GalleryPage />;
  }
  const nameMissing = name.trim().length === 0;
  if (route.kind === 'Room' && !nameMissing) {
    return (
      <WithBackground>
        <GameRoom roomCode={route.roomCode} role={route.role} name={name.trim()} look={look} />
      </WithBackground>
    );
  }

  return (
    <WithBackground>
      <JoinScreen
        name={name}
        roomCode={roomCode}
        onNameChange={onNameChange}
        onRoomCodeChange={onRoomCodeChange}
        onJoin={onJoin}
        onCreate={onCreate}
      />
    </WithBackground>
  );
}
