import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { InfoScreen } from '@/Screens';
import { Strings } from '@/Content';
import { assertNever } from '@/Core';
import {
  EnchantedArrival,
  PausedRoom,
  PhaseSplash,
  PhaseSplashMs,
  StartCountdown,
} from '@/Design/Overlays';
import { useDuckedMusic, useHeldMusic, useMusic, type MusicName } from '@/Design/Music';
import type { GameSessionView } from '../Hooks/UseGameSession';
import type { SessionPhaseName } from '../Hooks/UseSessionPhase';
import { AnswerFlushProvider } from '../Hooks/UseAnswerFlush';
import { RoomDebugTools } from './RoomTools';
import { useStartCountdown } from '../Hooks/UseStartCountdown';
import { usePhaseSplash } from '../Hooks/UsePhaseSplash';
import { useEnchantedArrival } from '../Hooks/UseEnchantedArrival';
import { BlockedReason } from '../Session';
import { CopyConnectionReport } from './DiagnosticsPanel';
import styles from './CountedRoom.module.css';
import { gameOverOf } from './GameOver';
import { LobbyView } from './LobbyView';
import { EnchantFlash } from './EnchantFlash';
import {
  GameScene,
  WritingScene,
  ReviewScene,
  LeaderboardScene,
  WinningScene,
} from './GameScene';

type PhaseScreenFn = (props: { view: GameSessionView }) => ComponentChildren;

/** Still reaching the host, or failing to. */
function ConnectingScreen({ view }: { view: GameSessionView }) {
  const failure =
    view.connectionHint === 'clockUnchecked'
      ? Strings.status.clockUnchecked
      : view.connectionHint === 'noPeers'
        ? Strings.status.stillLooking
        : view.connectionHint === 'relayUnreachable'
          ? Strings.status.relayUnreachable
          : undefined;
  if (failure !== undefined) {
    return (
      <>
        <InfoScreen
          message={failure}
          variant="Error"
          action={Strings.common.cancel}
          onAcknowledge={view.exitRoom}
        />
        <div class={styles.ReportAction}>
          <CopyConnectionReport />
        </div>
      </>
    );
  }
  return (
    <InfoScreen
      message={Strings.status.connecting}
      mark="Loading"
      action={Strings.common.cancel}
      onAcknowledge={view.exitRoom}
    />
  );
}

const PhaseScreens: Record<SessionPhaseName, PhaseScreenFn> = {
  Connecting: ConnectingScreen,
  Lobby: LobbyView,
  Choosing: GameScene,
  Writing: WritingScene,
  Reviewing: ReviewScene,
  Scores: ReviewScene,
  Leaderboard: LeaderboardScene,
  Winning: WinningScene,
};

function blockedMessage(reason: BlockedReason, roomLimit: number): string {
  switch (reason) {
    case 'NameTaken':
      return Strings.status.nameTaken;
    case 'AlreadyStarted':
      return Strings.status.alreadyStarted;
    case 'RoomFull':
      return Strings.status.roomFull(roomLimit);
    case 'Kicked':
      return Strings.status.kicked;
    default:
      return assertNever(reason);
  }
}

function PhaseScreen({ view }: { view: GameSessionView }) {
  if (view.hostLeft) {
    return <InfoScreen message={Strings.status.hostLeft} onAcknowledge={view.exitRoom} />;
  }
  if (view.blocked !== undefined) {
    return (
      <InfoScreen
        message={blockedMessage(view.blocked, view.roomLimit)}
        onAcknowledge={view.exitRoom}
      />
    );
  }
  const Screen = PhaseScreens[view.phase];
  return <Screen view={view} />;
}

function musicFor(view: GameSessionView, phase: SessionPhaseName): MusicName {
  if (phase === 'Lobby' || phase === 'Connecting') return 'Menu';
  if (phase === 'Reviewing' || phase === 'Scores') return 'Voting';
  if (phase === 'Leaderboard') return gameOverOf(view) ? 'Winner' : 'Game';
  return 'Game';
}

export interface CountedRoomProps {
  view: GameSessionView;
  roomCode: string;
  debugEnabled: boolean;
}

export function CountedRoom({ view, roomCode, debugEnabled }: CountedRoomProps) {
  const { veiling, count } = useStartCountdown(view, roomCode);
  const counting = veiling || count !== null;
  const { splashing, covered } = usePhaseSplash(view, counting);
  useMusic(
    (counting ? 'Lobby' : view.phase) === 'Winning'
      ? undefined
      : musicFor(view, counting ? 'Lobby' : view.phase),
    splashing ? PhaseSplashMs / 1000 : undefined
  );
  useHeldMusic(view.paused);
  useDuckedMusic(counting);
  const enchanted = useEnchantedArrival(view);
  const underRef = useRef<GameSessionView | null>(null);
  if (!counting && (!splashing || covered)) {
    underRef.current = view;
  }
  return (
    <AnswerFlushProvider>
      {counting && <StartCountdown veiling={veiling} count={count} />}
      {splashing && <PhaseSplash label={Strings.phaseSplash.label} />}
      {view.paused && <PausedRoom label={Strings.pause.held} />}
      {!counting && !splashing && (
        <>
          <EnchantedArrival enchanted={enchanted}>{Strings.writing.enchanted}</EnchantedArrival>
          <EnchantFlash view={view} />
          <RoomDebugTools view={view} enabled={debugEnabled} />
        </>
      )}
      <PhaseScreen view={underRef.current ?? view} />
    </AnswerFlushProvider>
  );
}
