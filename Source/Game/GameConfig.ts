export const GameConfig = {
  scoring: {
    uniquePoints: 3,
    pairPoints: 1,
    commonPoints: 0,
  },
  timing: {
    writingDurationMs: 60000,
    reviewingDurationMs: 90000,
    scoresDurationMs: 15000,
    graceMs: 3000,
    uiTickMs: 100,
  },
  rounds: {
    count: 5,
  },
  limits: {
    nameMaxLength: 16,
    answerMaxLength: 80,
    roomCodeLength: 4,
    minPlayers: 2,
    maxPlayers: 10,
  },
};