import { useEffect, useState } from 'preact/hooks';
import { GalleryPage } from '@/Dev/ComponentGallery/GalleryPage';
import { JoinScreen } from '@/Screens';
import { createRoomCode, normalizeRoomCode } from './RoomCode';
import { parseRoute, roomPath, Route } from './Routes';
import { GameRoom } from './GameRoom';

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

export function App() {
  const route = useHashRoute();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const onNameChange = (value: string) => setName(value);
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
    return <GameRoom roomCode={route.roomCode} role={route.role} name={name.trim()} />;
  }

  return (
    <JoinScreen
      name={name}
      roomCode={roomCode}
      onNameChange={onNameChange}
      onRoomCodeChange={onRoomCodeChange}
      onJoin={onJoin}
      onCreate={onCreate}
    />
  );
}
