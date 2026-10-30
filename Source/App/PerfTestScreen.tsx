import { useState, useEffect } from 'preact/hooks';
import { Screen, Stack, Text } from '@/Design/Primitives';
import { Button } from '@/Design/Components';
import { Strings } from '@/Content';
import { WritingScreen } from '@/Screens/WritingScreen';
import { ReviewScreen } from '@/Screens/ReviewScreen';
import { ScoresScreen } from '@/Screens/ScoresScreen';
import { LobbyScreen } from '@/Screens/LobbyScreen';
import { CharacterId, CharacterColor } from '@/Core';
import {
  mockPlayers,
  mockScores,
  mockGroups,
  emptyThemes,
  emptyCustomThemes,
} from './PerfTestData';

function playerLook(character: CharacterId, color: CharacterColor): { character: CharacterId; color: CharacterColor } {
  return { character, color };
}

function lobbyScreen() {
  return (
    <LobbyScreen
      ownPlayerName="Хост"
      ownLook={playerLook('Butterfly', 'Coral')}
      pace="Standard"
      themeMode="Random"
      themes={emptyThemes}
      customThemes={emptyCustomThemes}
      onCustomThemes={() => {}}
      onRemoveCustomTheme={() => {}}
      onPickLook={() => {}}
      onPickPace={() => {}}
      onPickThemes={() => {}}
      onLoadCustomThemes={() => {}}
      roomCode="1234"
      players={mockPlayers}
      ownPlayerId="host"
      isHost={true}
      onStart={() => {}}
      onExit={() => {}}
      onKick={() => {}}
    />
  );
}

function writingScreen() {
  return (
    <WritingScreen
      topic="Какое хобби вы бы выбрали, если бы не работа?"
      theme="Еда"
      themeAccent={{ wash: '#f0f0f0', ink: '#333333' }}
      remainingMs={45000}
      durationMs={60000}
      value=""
      held={false}
      onValueChange={() => {}}
      onSubmit={() => {}}
      onEditing={() => {}}
    />
  );
}

function reviewingScreen() {
  return (
    <ReviewScreen
      topic="Какое хобби вы бы выбрали, если бы не работа?"
      groups={mockGroups}
      revealed={4}
      onReject={() => {}}
      onLike={() => {}}
      payingIndex={undefined}
      spotlight={false}
      inert={false}
      payingElapsedMs={undefined}
      paused={false}
      run={1}
    />
  );
}

function scoresScreen() {
  return <ScoresScreen scores={mockScores} isHost={true} onNext={() => {}} />;
}

export function PerfTestScreen() {
  const [phase, setPhase] = useState<'Lobby' | 'Writing' | 'Reviewing' | 'Scores'>('Writing');

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((current) => {
        switch (current) {
          case 'Lobby': return 'Writing';
          case 'Writing': return 'Reviewing';
          case 'Reviewing': return 'Scores';
          case 'Scores': return 'Lobby';
        }
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <Screen>
      <Stack gap="Lg" align="Center" grow>
        <Text variant="Title">{Strings.app.title}</Text>
        <Text variant="Body">Тест производительности — 10 игроков, боты, 100× ускорение</Text>
        {phase === 'Lobby' && lobbyScreen()}
        {phase === 'Writing' && writingScreen()}
        {phase === 'Reviewing' && reviewingScreen()}
        {phase === 'Scores' && scoresScreen()}
        <Button variant="Secondary" size="Medium" onClick={() => setPhase('Writing')}>
          {Strings.common.ok}
        </Button>
      </Stack>
    </Screen>
  );
}
