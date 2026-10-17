# Balance

A simulator for the scoring rules. It plays thousands of seeded rooms, scores them under every
candidate formula, and writes the tables you read the balance off.

```
npm run balance
```

Writes `Report.md` (the tables) and `Report.csv` (the same numbers, for a spreadsheet).
Nothing in `Source/` is imported or touched: the simulator has its own model of a round, so a
change to the game's real scoring cannot silently move these numbers.

There is a second run, the matrix, which crosses every scoring shape with what a duplicated
answer pays and how bad the connection is:

```
npm run balance:matrix -- players=12 rounds=60 roomsPerConfig=200
```

It writes `Matrix.md` and `Matrix.csv`. The columns are the ones a balance decision turns on:
ties, the gap the winner took, the share of rounds that scored nothing and how much of that is
the board's fault rather than the player's, what writing fast is worth, and the share of the
variance the way a seat played explains.

## Changing the parameters

Everything is in `Params.ts`. Edit it and run `npm run balance` again. The fields worth
touching first:

- `speedMaxPoints` — the top of the speed scale, before any multiplier. Every curve spends this
  same budget, so the tables compare shapes rather than sizes.
- `pointsPerLike` — what one like is worth.
- `echoRate`, `popularitySkew`, `answerBankSize` — how alike a room's answers are. Together they
  set how often an answer is duplicated, which is the floor everything else stands on: in a
  twelve-player room it is nearly all of the rounds that score nothing.
- `pairPoints` — what an answer somebody else already wrote is worth. Zero makes a duplicated
  card dead air.
- `paceBonus` — how far a fast seat sits from a slow one in the writing window.
- `laggingShare`, `lagMs` — the share of seats whose answer reaches the host late, and by how
  much, which is what a bad connection costs under a speed bonus.
- `copyRate` — how hard a seat playing the copying profile goes for the board's popular answer.

From the command line, without editing:

```
npm run balance -- players=4,8 rounds=30 roomsPerConfig=500 speedMaxPoints=15
npm run balance -- --shapes=Banded,Threshold --mixes=Even,AllCopy
```

- `players=2,4,6,8,12` — room sizes.
- `rounds=30,60` — rounds per room.
- `--shapes=` — `Legacy` (the rule the game plays today), `Bonus`, or a curve and/or a placement:
  `Linear`, `Steep`, `Banded`, `Rooted`, `Threshold`, `SpeedOnly`, `Whole`, `LikesOnly`.
- `--mixes=` — `Even`, `Half`, `AllUnique`, `AllCopy`.

## What is in the report

The first tables are per formula: every room size crossed with every round count, with the
spread, the share of points from speed against likes, and the margin the winner took.

The four questions are asked at the largest room size over the longest game, once per formula:

- **A. Enchantments** — a multiplier's share of the room's points against its share of the
  rounds. If the two are the same, the multiplier is doing nothing; if the point share is larger,
  the enchantment is worth more than its number.
- **B. Comeback** — where the eventual winner stood after each checkpoint, and how often the lead
  changed hands. A winner who is third after round five is a game that is still open.
- **C. Draw against play** — the variance of a final score, split into the part the profile
  explains and the part the dice keeps.
- **D. Ways of playing** — what writing your own answer quickly, slowly, or chasing the board's
  popular answer is worth, at four room mixes, with the share of rounds each spent duplicated.