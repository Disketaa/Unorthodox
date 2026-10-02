# DECISIONS

## 2026-10-01 — a theme card is a button that washes in its own accent and numbers itself
The card is a `<button>` rather than a `Card` with a hover on a wrapper, and that is the only
place in the design system where a surface is re-declared: `Card` paints an opaque background
of its own and takes no `className`, so the wash would have been hidden underneath it. The
frame is drawn from the same tokens, so it reads as the same family as every other card.

The wash and the ink are written onto the card's own node from `themeAccent` in `Core` rather
than passed in as props. A caller that passed the colour could pass the wrong one, and two
cards of one bank wearing two colours would be a mistake nothing could see. The nine themes
reuse the eight `CharacterColor` tints — the palette is smaller than the catalogue, and
`Accents` are already measured for contrast and already on screen as the faces players are
drawn as. The wash and never the raw tint: a tint behind a name fails contrast in all eight.

The number behind the name is the card's place in the bank, counted from one, not the theme's
place in the catalogue. Six cards in front of a player are numbered one to six whatever they
are; a catalogue index would read as a fact about the theme that the room has not agreed on.
It is pushed into the bottom right corner and cut off on two sides, because a figure set to
fill the panel and then clipped is something the card is showing, and a figure that fits
inside the card is a second label.

The cards ride the shared `Sway` through `composes`, so a card and a character are one
movement. That forced the press onto `scale` rather than `transform`: the sway animates
`transform` on the same node, and an animation outranks a transition on the same property, so
a press written there would shrink the card for one frame and then stop. `useSwayMotion` is
now generic over its element, because the characters ride a span and a card rides a button.

## 2026-10-01 — a block centred in the viewport gives back half of what is above it
`ViewportCenter` exists because "centred in what is left" and "centred in the viewport" are
different questions, and the second one is what a stage wants. A child that grows into the
room below a bar is centred in that room, so the bar pushes it half its own height too low —
and the error grows with the bar, which wraps onto a second row on a phone and is not the
same height as on a desktop.

The fix measures the height above the frame and takes half of it back off the top with a
negative `margin-top`. The half is the whole of it: a stage with `a` above and `b` below
centres the child in the middle of `a + b`, which is half a bar too low exactly when `a` is
half a bar. It measures its own offset from the top rather than summing its siblings, so the
number of things at the top of the game is not a number this has to be told about — a sibling
count would have been wrong from the first phase that added something above.

`Stack` gained `grow` for the same reason it needed one: a stack is otherwise exactly as tall
as its contents, so a child with room to be given has none. And the measure-then-subscribe
shape was written twice — once here, once in `useCardTurns` — so it is `useViewportMeasure`,
one hook for both.

## 2026-10-01 — the themes are a bank of cards, dealt from the room code and turned to face the player
`Core/Themes.ts` holds nine themes and `dealThemes`, a partial shuffle rather than six
independent rolls: a deal that can hold the same theme twice is not a choice, since a player
would be weighing a card against its own duplicate. The randomness is injected, so a lobby's
deal can be reproduced from its seed rather than being a thing that happened once.

"Random per lobby" is `randomFor(roomCode)` — FNV-1a over the four letters — and not a roll.
That is the whole mechanism, and it is a temporary one: every device that knows the room code
derives the same six themes, with nothing sent between them and no host holding the answer.
A per-device `Math.random` would give every player a different hand and there would be no hand
at all. When the host owns the theme and sends it, this is replaced by a field on the lobby
state and the roll goes away; nothing downstream of `ThemeCardsView` changes, because the six
ids arrive the same way either way.

Who chooses is deliberately not built. The game's shape is "choose a theme, read a topic, write
an answer, show answers", and this is that first phase's cards and nothing past them, so the
cards are a display and not a control. That is also why `ThemeCard` takes a name and no
callback: adding an `onPick` now would be a control with no rule behind it, and the rule is
the part that is still being decided.

The arrangement went through four shapes, and three of them were wrong in ways worth recording.

**Six fixed angles per position** was first, and it is wrong for a reason that only shows up on
a second screen size: how far a card is from the middle of the *screen* is a fact about the
window, so an angle written for the card in that position is right at exactly one width. The
turn is now measured per card and re-measured on `resize`, written onto each slot as
`--ThemeCard-Yaw` and `--ThemeCard-Pitch`. `CardTurn.ts` is the arithmetic and is pure;
`Scripts/ThemeCardsLayout.test.ts` asserts it as arithmetic, since happy-dom neither lays out
a row nor composes a transform. The angles are read out of the tokens by the hook through
`getComputedStyle` rather than imported, so `Tokens.css` stays the one place an angle is
written.

**`preserve-3d` on the row and on every card** was in the second version and had to go. There
is nothing nested inside a card to keep in the same 3D space, and asking for it let a card's
border be painted as a plane floating off its own fill — flat broken edges that read as a
rendering fault rather than as an arrangement. That is what "the tilt looks weird" turned out
to be, and it was not the tilt.

**`nth-child` rules for the columns and the rows** were the middle version and are gone with the
measurement, which is the better of the two anyway: six fixed rules that each set `transform` in
full is a card in a corner keeping only whichever turn was written last. A grid of three across
and two down is now three and three because the row's own width is capped
(`--Layout-ThemeCardsMaxWidth`), not because a stylesheet knows how wide the window is — so the
fourth card always wraps, on any screen, and six fixed-width cards never sit four over two.

The turn was also inverted and un-inverted on request, and the sign is the interesting part
rather than the toggle: `rotateY` brings a card's near edge towards the viewer while `rotateX`
pushes its top edge away, so the two axes of the same 3D rotation do not agree about which way
is positive. The vertical offset is compared against the same convention rather than copied
from the horizontal one, which is why the inversion lives in the one function instead of at the
two call sites.

Cards are `Card variant="Elevated"` with a name on them, in `--Color-Text-Default` rather than
the title's accent: the accent is the tint a player chose for themselves, and six cards of it
would say whose screen this is rather than what the room could play. Every player in the room
has to read the same six names.

Sizes are shares rather than numbers, which is the second thing that was wrong. A flat 320px
card needed about 660px for two of them, so on a phone the row held one card and six turned
panels stood in a list. The width is now capped at what two cards need beside the page's own
padding, the height comes from `--Ratio-ThemeCard` rather than a second number, and the name is
`calc(var(--Size-ThemeCardWidth) * 0.115)` so it shrinks with the card — a fixed size there
would have put the name straight back to reading as a caption on a phone.

## 2026-10-01 — a room full is refused at the door, and the refusal quotes the limit
Nothing enforced `GameConfig.limits.maxPlayers` on a real join. The rule was in three places
that only ever *displayed* it — the lobby's Start button, the bot path, and now the bar — so a
seventeenth player was seated in a sixteen-seat room and the bar quietly drew sixteen of the
seventeen. The bar is what made it visible: it drops a player past its slot count, so the game
looked right and the roster was not.

`HostRoster.hasRoom` counts seats, not connections, and is checked before the phase rather than
after: a dropped player still holds a seat, and a room that filled up with the gaps left behind
would turn somebody's bad connection into a locked door. A player who already holds a seat is
exempt, which is the same exemption the mid-game return needs — a refresh asks with a name the
room already knows, and a room at its limit must not answer that the way it answers a stranger.

`RoomFull` carries `maxPlayers` rather than the host writing the sentence, for the same reason
`SetPlayerId` carries an id: the number is the host's, and a client that quoted a copy of the
limit would put a number in front of the player that the room does not hold. It is the one
refusal that can be withdrawn, so it is also the one that does not close the session — a kicked
player must not be left listening to the room they were put out of, and a refused one may knock
again.

The four refusals were a case each in `ClientSession.handleHostMessage` and are now a table in
`Network/ClientRefusals.ts`, because they differ in exactly two facts — which reason, and whether
the session closes — and the handler had outgrown its 40 lines while saying so. `BlockedReason`
moved to `Protocol.ts` with it: the reasons are the host's messages first and the client's own
bookkeeping second.

## 2026-10-01 — the crown is the host's mark again, and it breathes
The bar's host wears the same crown the lobby chip does, in the same room yellow: a fact the
whole room would agree on must not follow the viewer's own tint. It is out of the flow and lifted
onto the top edge of the slot, because a crown in the flow makes the host the only tall slot in a
row of faces, and half above the edge makes it a mark on a seat rather than a fourth line of text.

It is centred over the character rather than tucked into a corner, and it carries the shared
`Sway` — the same movement as the characters, composed rather than copied. Centring rides the
`translate` property for exactly that reason: the sway animates `transform` on the same node, so
the two compose instead of one being written over.

## 2026-10-01 — the slot went back to being slim
`--Size-PlayerBarSlot` is 60px, down from the 84px it was widened to. A name is up to sixteen long
and the common one is five or six, so a wide slot only bought back names nobody uses, while what
it really bought was fewer rows: at 60px sixteen slots are two rows on a phone and one on a
desktop, and a bar the game has no room under is not a bar.

## 2026-10-01 — the bar of players runs across the whole game, and the roster moved into every phase
`PlayerBar` draws every player along the top of a game as character, name and score, in
roster order, and holds `--Layout-PlayerBarSlots` of them. The row wraps onto a second row
rather than scrolling, because a bar a player has to swipe sideways is a bar nobody can find
themselves in.

Making it span the phases turned out to be a change to what the host's state is, not to the
UI. Names, faces and presence were on the wire only in the lobby, so the bar had a roster in
the lobby and nothing at all afterwards — which is also why a client that refreshed mid-round
came back to a bar with nobody in it, and why a client could not be told a dropped player had
dropped. `players` is now on every phase rather than the lobby's alone (`GameState.RoomMembers`),
so `toPublicState` sends the roster in all of them. Nothing new is exposed: a name, a face and
whether a player is connected were all public in the lobby already.

That in turn is what makes a mid-game return work. `AlreadyStarted` was right for a stranger
and wrong for a tab that had been in the room a moment ago, and the difference is a seat rather
than a phase, so `HostRoster.restore` puts the seats back when a host resumes its game and
`hasSeatForName` decides the join. A returning player keeps their seat, their score, their
answer and their character; `handleJoin` will not let a join rewrite the record the room has of
somebody. A restored seat starts marked gone, because the refresh has lost every connection the
room had — and because a seat whose name is held by a browser this tab knows nothing about would
turn that same returning player into an impostor, which is what the first attempt did and what
`ReturningPlayer.test.ts` caught.

The cost is one field on every phase and a room-state codec that writes the roster in all of
them, for a room that is otherwise a lobby with a game bolted on. `Game/PublicState.ts` also had
to split: the five per-phase mappers went to `Game/PublicPhases.ts` because the roster pushed it
past the 150-line limit.

Two things deliberately not built on the back of this. A returning player's own marks — the
answer they have already written, the groups they have already rejected — are still local state
and are lost on a refresh, so they can be asked again for something they have already answered.
And `PublicScoresState` grew a `cumulative` beside its round `scores`, because a bar that drops
back to the last round every time the scores phase arrives is a bar that cannot be read as a
running total.

## 2026-10-01 — a room holds sixteen, and the bar holds exactly as many
`GameConfig.limits.maxPlayers` was ten and is now sixteen, which is what
`--Layout-PlayerBarSlots` has always said. They are the same number on purpose: a bar that drops
a player the room still has is worse than a room that is too big for a bar. The token is the copy
rather than the other way round because `Design` may not import `Game`, so
`Scripts/PlayerBarLayout.test.ts` holds the two to each other and fails if either moves.

The bar's slot count is read off the document rather than written in the component, with a
fallback for a page that has not loaded `Tokens.css` — and that fallback is a second copy of the
number, which is the only part of this that can go stale quietly, so the same test holds it to
the token.

Sixteen is wide for a party game and narrow for a phone, which is why the slot is 84px rather
than the character size: at the small size a room of ten could only have been drawn by throwing
away most of the names. The row wrapping is what covers the rest — more bar rather than less of
it, with a player cut to an ellipsis rather than a slot dropped.

## 2026-10-01 — the game screen is an empty stage, on purpose
The four phase screens are still in `Screens/` and are no longer mounted: `PhaseScreen` chooses
`GameScene` for every phase after the lobby, which draws the bar and nothing under it. A bar has
to be judged against the space it leaves for the game, and it cannot be judged with three
screens still on the page. `App/Views/WritingView.tsx` and its three siblings are unused until
the screens come back.

## 2026-10-01 — bots are named to break the bar, not to sound like a room
The bot names went from twelve Russian first names to thirty-eight, which is not a bigger list
so much as a list written against the slot: one to be cut with an ellipsis, one in another
script, one in caps, one letter, one with a glyph, one in a mixture of cases. A bot is the only
player nobody has to type, so it is the only name the bar is guaranteed to be tested with, and a
list of tidy short names tested nothing.

## 2026-10-01 — the room asks who you are, instead of waiting to be told you left
A player who refreshed could not get back into a room, ever: the same name, from the
menu, through the join screen, for as long as the host's page stayed open. It was not a
transient glitch and not a relay problem to shrug at — it was the roster's duplicate-name
rule doing exactly what it was written to do, against a player it should have recognised.

`HostRoster.isNameActive` freed a name when its holder had been reported gone, and a
departure is a notice. Notices are lost. A tab that closes does not get to choose whether
the relays carried the news before the new connection arrived, and this room runs on
public relays that fail visibly in the console — two of five were refusing writes or
erroring in the session that surfaced this. When the notice was late or lost, the seat
stayed held, the returning player was refused as an impostor, and `NameRejected` was
terminal: the client gave up and showed a dead end. Reproduced in two lines — a client
that stops and rejoins under its own name, with the host in no way having misbehaved —
and it failed even when the transport was told to report the departure, which is the
detail that shows the rule was wrong rather than merely unlucky.

So the client now says who it is. `ClientIdentity` keeps a random id in `localStorage`,
the `Join` message carries it, and a name already held by the *same browser* is free
again. That is evidence the room asked for rather than inferred, and it is what makes a
refresh work without depending on anything outside the two tabs. `localStorage` and not
`sessionStorage` is the whole point: the failure being fixed is the one where the tab's
storage is destroyed. Scoped per browser rather than per tab, because a player who
refreshes, or opens the room twice, is one player either way.

The id is also held in a module variable, which is a requirement and not a cache. The
join is re-sent until the host answers it, so a client minting per call would be seated
by the first attempt and then told it was an impostor by its own retry — turning a
transient relay hiccup into a permanent lockout rather than a delayed one. Caught by
reading what the retry loop does, not by the refresh test, which passes either way.

What this deliberately does not do is remove the duplicate-name rule. Two people under
one name are still the same person in every answer and every score, and the second is
still refused — a second browser has a different id, which is the only thing separating
that case from a refresh. `HostDuplicateNames.test.ts` now says so at every call site
rather than assuming it, because a test that used the same browser for both "players"
would have quietly stopped testing either case; the one that failed after this change is
how the distinction is known to be real rather than assumed.

The trade-off is that a name is now held against a browser rather than a connection, so
clearing site data mid-game loses the seat the same way closing the tab does. That is
the old behaviour, not a new one: the seat was already kept for a player who vanished.

## 2026-10-01 — the pace is the host's, and a client is shown it rather than let to try it
`pace` moved into `LobbyState` and out through `PublicLobbyState`, so the room's answer
travels to every client rather than living in the lobby screen. That is the whole of the
mechanism and it is the reason for it: a settings card that a client can press but that
shows a number the room is not playing is worse than no card, and the only way a client
can be shown the truth is to be told it.

A client cannot set the pace, and there is no `SetPace` client message at all, which is
the guarantee rather than a consequence of one — `RoomPace.test.ts` asserts
`isClientMessage({type:'SetPace'})` is false, so the absence is checked at the gate every
message passes rather than by calling a method a client does not have. A test that
asserted the host merely ignored the request would still have passed if a client could
ask and the host chose not to answer, which is a different and much weaker thing to
promise. `Session.setPace` is a no-op on the client for the same reason: the UI has one
handler and the role decides what it means.

The buttons are `disabled` for a client rather than drawn in a new variant, and the card
is not hidden. Both halves matter. A setting a player cannot see is a setting they
cannot agree to play, so the numbers stay; and `disabled` is already the rule that puts
the not-allowed cursor and the half opacity on, so a variant would have been a second
spelling of a state the button already has, on a control that genuinely ignores its
press and should say so to the browser rather than only to the eye.

This reverses an earlier decision, and the earlier one is worth keeping for a moment.
The buttons were first made live for clients, showing a local preview of what the other
pace would mean, on the reasoning that a setting nobody can look at is a setting nobody
can agree to. That was half right and reached the wrong end: once the pace is in the
public state, a client is *shown* the room's answer without pressing anything, so the
preview was solving a problem the state had already solved — and it introduced a real
bug to do it. Keying the preview on the pace it was pressed *against* looked equivalent
and was not: a client previewing Fast against a room on Standard, then the host choosing
Standard, leaves the room's value unchanged, so the comparison still matched and the
stale preview survived, showing Fast in a room playing Standard. That is the exact
failure the state move exists to prevent, produced by the workaround for it.

The lesson is about ordering rather than about either mechanism. A local preview and an
authoritative value are the same feature at two different maturities, and building the
first made the second's absence felt like a gap. It is better to move the value to the
host and let it travel, and only then decide what a client who cannot change it should
be allowed to do — which turned out to be: read it.

## 2026-10-01 — a screen's containers go in one row or one column, and never two of three
`Screen` no longer fits as many containers as the width allows. It had one track of
`auto-fit`, which has exactly two answers for a row of three: three across, or two
across with the third below. Nothing in between is expressible, because fitting a
track is a per-track question and this is a question about the row — and the in-between
case is the one nobody chose. Two cards sharing a row read as the pair the screen is
about, with the third left over underneath, and on the lobby that is the room code
beside the settings with the character picker orphaned below them.

So the frame is one container per row by default, and a media query opens the row once
the window is wide enough for all of them. This is the file's first width query, and the
older decision that it had none — along with the test that asserted as much — is
reversed. "The direction comes from the width, not from the caller" still holds; what
changed is that the width is now compared against the whole set rather than fitted one
container at a time.

The row opens at three columns of `--Layout-ColumnMinWidth`, not three of
`--Layout-ContainerMaxWidth`, and the difference is whether the game works on a laptop.
The cap is how wide one container may grow, which is the readable line length; nothing
said a column in a row of three had to reach it. Measuring against the cap put the
threshold at 1536px, which is wider than most laptops, so a room of three sat in a
single column on a 1440 screen with the space for all three plainly there. It is now
1056px.

That token is the width the row is *measured* at and nothing constrains the tracks to
it, which is the second half of that change and was got wrong first. The tracks are
`minmax(0, 1fr)`, and putting the 320px floor on them was actively harmful: `auto-fit`
fits tracks at their minimum and divides the remainder between them, so on a window wide
enough for four tracks a 320px floor produced three columns of about 342px and threw the
fourth away — narrower than the readable line length, and shrinking as the window grew.
A `0` floor makes the tracks for the containers alone and lets them share the frame, and
the frame's own `max-width` is what stops a column passing the cap: at three across it
can be no wider than 480px however wide the window is.

So the cap and the floor are on opposite sides of the mechanism and neither is redundant.
`--Layout-ColumnMinWidth` is only ever read by the arithmetic in the test now, which is
also why it is honest to describe it as the point below which a row is not worth having:
a column that opens a row is by definition as narrow as the row allows.

`--Layout-ColumnMinWidth` is a new token and the threshold deliberately is not one. A
media query condition does not resolve `var()` at all — that is a rule of the language,
not of a tool, and `calc()` around a `var()` is no different, which the build confirmed
by refusing to minify the first two attempts. So the number is a literal in the
stylesheet, and the arithmetic it stands for lives in the token's comment. What keeps
that duplication from drifting is `Scripts/ScreenLayout.test.ts`, which recomputes the
threshold from the tokens and compares, so a change to any of the four values fails the
suite instead of quietly leaving a room that opens at a width its columns no longer fit
into. A token for the total was written and removed: nothing could read it, and a token
nothing reads is a number that looks load-bearing and is not.

`auto-fit` did not go away, it moved inside the query, and it is doing a different job
there. A fixed count of tracks leaves an empty one at the end of the entry screen's two,
so the wordmark and the card of fields sit against the left with the gap on the wrong
side; `auto-fit` collapses the empty track and the two share the row, which is what
`justify-content: center` is then free to centre. So the query decides how many fit and
`auto-fit` decides how the ones that are there share the width — neither doing the
other's job, which is what was wrong when `auto-fit` was asked to do both. Inside the
query a third container therefore always has a track of its own rather than pushing one
out of the row, so nothing there can arrive at two either.

One limit is worth recording, because it is the kind that looks like a passing test. The
assertions in `ScreenLayout.test.ts` read the stylesheet and work out what the two rules
add up to; happy-dom does not lay out a grid, so nothing in the suite has watched a
browser put three containers in a row. The property "one per row or three across, never
two" is therefore asserted as arithmetic over the declarations and not as a rendered
result, and a rule that computes the right answer for the wrong reason would pass. There
is no layout engine in the project's dependencies and adding one is a dependency decision
rather than a testing detail.

The query measures the window and the frame is drawn inside the page's own margin, so
the threshold carries two margins' worth of padding. Leaving them out opens the row
exactly two margins too late, and on a window that has only just cleared the row's
width that is the whole difference between three across and one.

The two widths that showed the old behaviour were 800, 1050 and 1700, and they are
pinned in the test rather than left as a description: `rowCountAt` works the stylesheet's
two answers out at a given width, so "one per row or three across" is asserted as a
number instead of as a claim about a declaration. It is also swept from 320 to 2560 in
one-pixel steps, because the failure was a *range* and not a width — the whole band
between one column and the full row used to answer two — and a test that sampled three
widths would have passed against the layout it was written for. Every other assertion in
that file checks a declaration, which is why this one does not: a frame with a perfectly
good `auto-fit` on it still managed two of three.

## 2026-10-01 — the pace is a readout on the Banner, and the Banner grew a value
The lobby's settings container is a `LobbyCategory` like the other two, titled
"Настройки", so the room code, the pace and the character all read as three parts of
one screen. The wordmark already names the game on the entry screen, and a card
headed by the same name inside the room would be a fourth statement of it. The
`Separator` opens the body of the card rather than splitting it, so "Параметры" names
the pace buttons and the three waits as one thing — the buttons do not set a different
kind of thing from the numbers, they set the numbers. Its three lines are
`Banner variant="Muted"` with a
`value`, which is the sample markup that was asked for and no more: a `Banner` is
already a mark, a wording and a fill, and a second component drawing the same three
things in grey would have been that component with a different name.

`value` is a prop rather than a child, because the figure has to be at the far end
of the row and `justify-content` is the alignment variant's business. Pushed with
`margin-left: auto` on the value itself, which is why a value is never paired with
`align="Center"`. The three lines are muted rather than a border around each: a
column of hairline frames reads as a form to fill in, and this is a readout.

The pace is local state inside `LobbyPace` and nothing else, so it is not yet wired
to the durations the host runs the game on. `GameConfig.paces` is where that lands:
`Standard` is written from `timing` rather than as three numbers of its own, so the
pace shown and the pace played cannot drift apart once the host reads it. Adding a
third pace means adding a key there and a label in `Strings.lobby.settings`, and
nothing else — the two buttons are generated from the same union.

The pace buttons are a `Stack direction="Horizontal" fill="Even"`, and getting there took
three answers, two of which were wrong in ways worth not repeating.

`justify="Center"` was the first: the buttons were the width of their own words and
the pair sat in the middle of the card. That answers "where does the leftover width
go" for a row that does not fill, and it is the only thing it does — `justify-content`
moves children around inside a row, and cannot widen one. So the space stayed outside
the buttons, which was the opposite of what was wanted.

`fill="Even"` as a `fit-content` grid row was the second, and it did equalise the two.
It was also wrong about which side of the question it answered, and it was given a
`Stack` prop for a question one row had asked. Flex distributes free space by each
child's own size, so a grid with equal tracks can size to the widest child and divide
it evenly where a flex row cannot; that much was real, and the primitive did not need
to know it. The `fit-content` was the invention. A row that shrink-wraps has no free
space left to divide, so the buttons ended up sized to the text again.

What was actually wanted is `flex: 1 1 0` on the children, which is where the space
goes *inside* them, and it needs no new layout mode at all. `fill="Even"` stayed as
the name for it, with `Content` left as the default so nothing else in the app moved.
The `0` basis is the part that cannot be dropped: at `auto` the shares are in
proportion to each word and "Быстро" is narrower than "Обычно" again.
`min-width: 0` goes with it, since a flex item's floor is its own content and one long
word would otherwise push the row past the card.

`Scripts/StackLayout.test.ts` reads the stylesheet with `node:fs` for the reason
`ScreenLayout.test.ts` does: happy-dom does not lay out a flex row, so a rendered
`Stack` asserts nothing about the one thing `fill` exists to decide. It also holds
`justify` and `align` to their own meanings, since folding the fill into either of
them is what turned this into a second and contradictory property.

The buttons are "Обычно" and "Быстро", offered in that order, and the room starts on
the first. Adjectives rather than names for the game, because a card already headed
"Настройки" that also offers "Стандартная игра" names the same thing twice. The
declined one is `Button variant="Muted"`: nothing filled, in the neutral greys. Not
`Ghost`, whose accent text is a deliberate decision for a button that is the only one
of its kind, and not `Secondary`, whose cyan is a different act rather than the same
act declined — a pair where one of the two says "the other one" in a second hue
reads as two offers rather than as one choice.

## 2026-10-01 — the accent is the player's tint, and it was cut back to two steps
Picking a tint repaints the interface in that hue, and it is kept in `localStorage` unlike the character,
which stays in `sessionStorage` because that is identity and this is taste. `AccentProvider` writes onto
`:root`, where `Tokens.css` declared its fallbacks, so the join screen and the gallery wear it too.

It began as a four-step ramp per tint and is now two, because the things that would have used the rest
stopped using it. The primary button is fixed gold, the create-room button fixed cyan, the focus ring
fixed cyan, the picker's hover and selection border fixed gold, and the host's crown and the local
player's chip fixed gold. `--Color-Room-Yellow` names that last group: four marks that all say something
the whole room would agree on, so none of them follows the viewer's own tint. A crown in the accent named
whoever was looking at the screen as the host.

So five of the eight steps were written and read by nothing, and `--Color-Accent-Tint` went with them
once the icon button's hover moved to the room's yellow. What is left is the tint for headings and the ink
step for a score and the ghost button. `AccentProvider.test.tsx` asserts the written list is exactly three
names, so a fourth cannot quietly accumulate.

The ink step survives a measurement rather than a preference. At the raw tint the best of the eight manages
3.54 against white, so anything drawn as body text or as a meaningful line needs the hue taken darker.
`Accents.test.ts` holds both the ink pairings and the fact that no tint passes as body text on its own, so
the step cannot become redundant unnoticed.

Two things were tried and taken back. The cursors were tinted, which needed the colour baked into the data
URL because `cursor` takes a URL and nothing else; they are black again and `Cursors.ts` went with them.
And the headings were set in the raw tint on request, where five of the eight miss the 3:1 large-text bar
— that cost is written into the test that names them rather than left to be discovered.

The picker hover is scoped away from the chosen cell. A hover rule carrying two classes outranks the single
class giving the chosen cell its fill, so hovering the current choice washed the fill out and the row lost
the one thing marking it.

## 2026-10-01 — the idle sway belongs to the page, not to a character
The game's name now rocks on the same idle movement the characters do, and it does so
through the same code: `Design/Primitives/Sway` holds the roll and the keyframes, and
`Character` composes them onto its own node instead of defining them. A row of characters
is only interesting because no two of them agree, and that comes from the roll rather than
from the drawing — so a second copy of the movement would have been one movement that had
quietly forked, free to drift from the first the next time either was tuned.

`--Character-Motion-*` is now `--Sway-*`, and the four stepped timing keywords are shared
rather than listed twice, so the sway and a character's arrival snap the same set of ways.
`Character`'s own hook is left with what is genuinely a character's: where it arrives from
and how it is cocked when it gets there. The squash, the duration and the idle belong to
the primitive, which is what keeps every reaction and every resting pose the same movement.

The amplitudes are absolute pixels rather than a share of the subject's own size, so a
character and the game's name swing the same distance. They are the same movement at
different sizes; a movement that scaled with its subject would be a second one wearing the
first's numbers.

`Wordmark.test.tsx` exists because those values are written from JavaScript onto a node: a
change that stopped writing them would leave a wordmark that is present, correctly
coloured, and perfectly still, and nothing else in the suite would notice.

## 2026-10-01 — a screen aligns its containers in two separate ways
`Screen` grew an `align` prop beside its `vertical` one, and the two are different
questions. `vertical` is where the whole set of containers sits in the viewport; `align` is
how those containers line up with one another inside it.

The wordmark is a third of the height of the card of fields beside it, and aligned by the
top edge it floated beside the middle of the menu rather than sitting in the middle of it.
So the entry screen asks for `align="Center"` and the lobby keeps `align="Start"`, where
the containers are one another's continuation and their first lines lining up is the thing
being read.

`align-content` and `align-items` are what separate the two, and keeping them apart is the
point rather than a detail: conflating them would mean a screen could not centre itself
without also centring every container in it, and the lobby could not sit at its top.

It does nothing once the containers have wrapped into one column, since each is then the
only thing in its own row, so this is purely a question about the side-by-side arrangement.

## 2026-10-01 — the screens lay themselves out, and `Screen` is the frame that does it
A screen's containers now sit side by side when there is room and stack when there is not,
from a width the screen never asks about. `Design/Primitives/Screen` is that frame, and
every screen is one. It is not a `Stack`: a `Stack` is a direction the caller has chosen,
and this one takes the direction from the width, so a screen written once is correct on a
phone and on a desktop and nothing in `Screens/` reads the window.

The cap on a row is the frame's own width rather than a breakpoint, and that is the whole
mechanism. `auto-fit` fits as many tracks as the frame is wide, so a frame sized for
`--Layout-ColumnsMax` cannot hold a fourth, and a fifth container wraps to a new line by
itself. One, two or three is decided by the room available; three is the most anything in
the game needs. `--Layout-ColumnsMax` is a token rather than a bare 3 in a stylesheet
because a layout rule written as a number is a rule nobody can find again.

A grid rather than a wrapping flex row, and the reason is `align-content`. A flex row wraps
into lines too, but it cannot say where those lines sit when the set is shorter than the
viewport — which is the one thing a screen does decide for itself, as `vertical="Center"`
for the entry screen and `"Top"` for the lobby. Grid can say it, so grid is what is used.
`align-content` rather than a centred column, so a screen taller than the viewport stays at
the top and scrolls instead of being pushed off its own top edge.

Three things were wrong on the way and are worth not getting wrong again.

`#root` asked for a viewport of its own and so did the frame, so every screen was a
viewport plus `#root`'s padding taller than the page it sat in and scrolled whether it fit
or not. The frame now takes the height `#root` has left with `flex: 1 0 auto`, which grows
into the room and never shrinks below its own content.

Grid stretches its items to their row, so a card beside the wordmark was pulled to the
wordmark's height with its own content sitting at the top of a box sized for something
else. It read as padding nobody had set. `align-items: start` gives every container the
height of what is in it, and the rows still pack.

`--Layout-ContentPadding` was both the page's margin and a card's inner padding, so making
the screen's margin larger made every card's padding larger with it. They are now
`--Layout-ScreenPadding` and `--Layout-ContentPadding`, on the grounds the tokens file
already gives for `--Color-Accent-Ink`: reaching past the named token is how the next
control ends up wearing a value meant for something else.

`--Layout-ContentMaxWidth` is now `--Layout-ContainerMaxWidth`, the same 480 describing one
container rather than the whole page. The page was a single fixed column when it was named
for the content; a screen can lay several out across now, and a name that reads as
per-page is how the next person makes it one again.

The wordmark went back to the fixed gold rather than the accent, on the same grounds as the
primary button and the host's crown: the name of the game should look the same to everyone
in the room rather than wear one player's taste.

`Scripts/ScreenLayout.test.ts` reads the stylesheet with `node:fs`, because none of this is
visible to a test runner: happy-dom does not lay out a grid, resolve a `minmax`, or match a
width query, so a rendered `Screen` asserts nothing about the one thing it exists to decide.

One thing was left alone on purpose. `ReviewScreen` can have ten answer cards, and they now
wrap three across like everything else, but how a review screen should deal with ten of
them is a design question rather than a layout one.

## 2026-10-01 — the glyph field ships a list of seeds and fades in no more
The field rolls from one of eight fixed seeds rather than a fresh one per load. Every
seed gives a valid arrangement, but a good half of them are lopsided enough to be worth looking
at before shipping, and these eight were: the same wallpaper for everyone playing instead of a
different one per visit. One is still chosen per load, so two players are not looking at the
same margins and neither is looking at an arrangement nobody has seen. `Core/Random.ts` keeps
the seeded generator, since a roll that ignored its seed would leave the list describing fields
nobody can get back.

The seed is no longer logged, and `?seed=` is gone with it. Both existed so an arrangement could
be reported and rolled again, which was the point of seeding it at all; once the seeds were
chosen by looking at them and written into the source, the reporting was the only thing left
holding the mechanism together. `GlyphField.test.tsx` now holds the list to its arrangements
instead: eight seeds, eight different fields, each one a full band.

The marks also stopped fading in. The arrival was staggered per mark, and at forty-four marks a
band it stretched towards a second, which read as a delay on load rather than as a page settling.
Wallpaper is printed, not faded up, so a mark is at its own opacity from the first paint and only
the drift animation is left.

Rolling takes the generator as an argument, the way `randomLook` already took its randomness, so
the roll stays free of ambient state and can be tested. Both bands come from one seed and one
sequence rather than two, so an arrangement is a single thing; they still hold different marks,
because the second is rolled from where the first stopped.

The slots also moved: they used to sit half a step in from each end of the band, which bunched the
marks into the visible middle and left the top and bottom thinner than the rest. They now span the
band edge to band edge. The band is already pulled past both screen edges by `--Glyph-Overscan`, so
a slot on the band's own end lands well off screen, which is what carries the field past the top
and the bottom rather than stopping at them.

## 2026-10-01 — a button pops, and two pops are not the same note
`Design/Sounds/SoundBank.ts` plays `Pop.ogg` on press. `Button`, `IconButton`, and both rows of
the character picker call `playSound('Pop')`, so a press anywhere on the interface answers with
the same sound; the picker rows play it directly rather than through a prop because the press is
the event, not a property of the drawing inside the cell.

One element per clip name, replayed from `currentTime = 0`. Clicking faster than the clip lasts
cuts it off rather than queueing a second copy behind it: a button pressed twice is two presses,
not a burst. A refused `play()` promise is swallowed, because a browser blocking playback before
the first gesture is not a fault to report at the press.

Each press also lands on a different pitch, re-rolled within a major third of the recorded one.
The clip is one recorded note, and replaying it verbatim makes two presses in a row read as a stuck
sample rather than as two hands.

Twelve per cent of playback rate was not enough, and neither was a spread of one, which is to say
the variation was inaudible at any width tried: `playbackRate` is reset by the media element when
loading finishes, so the rate written before `play()` was gone before anything was heard. Web Audio
replaced it, where `detune` belongs to a per-press source node and is not a property of the clip
that a later load can overwrite. Detuning also keeps the length, which varying the rate does not, so
a wide shift no longer drags the sound out as well.

A fifth was too much in the other direction: every press read as a deliberate joke on the clip rather
than as the same sound. A major third is still two notes rather than one wobbling.

Nothing is loaded on the first press. `preloadSounds()` runs from `main.tsx`: the context opens
suspended, which is legal and is exactly why the fetch and decode can happen before any gesture, and
by the time anything can be pressed the buffer is in memory. A press that still beats its own load
plays when the decode lands rather than being dropped.

Preloading was not on its own enough, and the reason is that a context only starts running inside a
gesture, and the browser then spends its first moments bringing up an audio thread that did not exist
before. That first press paid for the thread and for the sound, so the button moved and the pop
arrived afterwards. `preloadSounds` now arms the context on the page's first `pointerdown` or
`keydown` anywhere rather than on the button: to the browser it is the same gesture, and it nearly
always happens first. The listeners are attached only while suspended and removed on the first one to
land, so an untouched page holds nothing.

The bank stays silent where there is no Web Audio at all, which happy-dom found by throwing
`AudioContext is not defined` through four screen tests. A sound is an addition to a press and never
a condition of it.

Both are props' business rather than the design system's: `Button` and `IconButton` take
`sound?: SoundName | false` for a control that has to be silent, and nothing else passes one.

## 2026-10-01 — the player name lives in localStorage, saved on entering a room
The name used to sit in `sessionStorage` and be written on every keystroke, which meant it
died with the tab and a returning player retyped it. It is now `localStorage`, so it outlives
the tab, and it is written on `onJoin` and `onCreate` rather than on change. Saving per
keystroke made the stored value the last thing typed, which is not the same as the name a
player committed to: half a name survived a closed tab and came back as the suggestion.
Entering a room is the moment the name becomes real, and both buttons write it, so the stored
name is always one the player has used. The trade-off is that two tabs of one browser share a
name, and the host already treats a re-joining known name as the same seat, so the second tab
rejoins the first rather than duplicating it. The look stays in `sessionStorage`, where the
tab scoping matters more: it is only a starting point the host may override, so two players
sharing a device should not both come back as the same character.

## 2026-10-01 — a script that names the comments which only repeat the code
`npm run comments` (`Scripts/CommentAudit.ts`) walks `Source/`, joins each run of `//`
lines into one paragraph so a sentence is judged whole, and reports every comment that
shares little with the code beneath it. Three verdicts, and the split is the point: `noisy`
is safe to delete, `stale` is an unresolved question or a hedge and needs a decision rather
than a deletion, `kept` is everything else. `stale` exits non-zero so it can gate a commit.

Nothing is rewritten. The judgement that separates "restates the code" from "records a
decision the code cannot express" — why Google's STUN is unreachable from here, why a
trystero action has to exist on both peers — is not mechanical, so the script proposes and a
person disposes.

The signals are phrase-level rather than token-level: `Step 1:`, `@param`, `// Define the…`,
a question mark, "might need". A token-overlap rule (does the comment repeat the words in the
next line?) catches the rest. Both were tuned against false positives, and two of the earliest
were instructive: `we'?ll` matched the word "well", and judging `//` lines one at a time read
the middle of a paragraph as its own comment and flagged load-bearing rationale as noise.

`eslint.config.js` now sets `parserOptions.tsconfigRootDir`. An Agent Manager worktree inside
the repo carries a second `tsconfig.json`, which made `eslint` ambiguous about the project
root and failed every file with a parsing error. The worktree is now ignored as well.

## 2026-10-01 — the audit was reading about half the comments
A sample of twenty comments taken across files the audit called clean found `Reducer.ts`
carrying a four-line `@param`/`@returns` block that no run had ever reported. The collector
handled `//` lines and, for `/** */`, recorded a placeholder and moved on. Every docstring in
the codebase had been invisible. Doc comments are now read as text, gutter `*` stripped, and
seventeen more findings appeared — the `@param` restatements in `Scoring.ts`,
`PublicState.ts` and `Reducer.ts`, and a run of one-line docstrings that say the method's own
name back to you (`/** Start the host session with a room code and host name */`).

Reading them raised two more faults. A `//` behind code on its own line annotates the code
before it, so comparing it to the line after was the wrong reference; and two adjacent inline
annotations were being welded into one paragraph, which attached the merged text to the wrong
line and hid the signal entirely. Trailing comments are now marked and never merged, and are
compared against their own line.

CSS stayed out of the default run, so the claim that it was clean was untested. It now has the
same lookback for the selector above, and `--css` finds nothing across all twenty stylesheets:
`GlyphField.module.css`, `Pop.module.css` and `Tokens.css` are design rationale, and the one
borderline case, `/* Container for the whole gallery */` on `.Root`, shares no words with the
selector and so cannot be caught by any overlap rule. It stays a judgement call and stays in.

So the honest limit of this tool: it finds restatement, not redundancy. `/* Container for the
whole gallery */` on `.Root` adds nothing and no regex will say so, because deciding it needs
to know what `.Root` is for. That is the class of comment this cannot catch, and it is not
empty.

## 2026-10-01 — one word is enough to match, but only against a class
The audit needed `/* Padding */` above `.PaddingXs` and `/** Final ranking. */` above
`FinalScreen`, and caught neither: the first because the overlap rule required two words
before it would compare anything, the second because its one matching word out of two is 0.5 and
the bar was 0.6.

Lowering the bar to 0.5 was tried and reverted. It produced nine findings, and at least three
were wrong: a test comment explaining why two answers group, a test comment naming the case
being checked, and `pointsForGroupSize`'s own docstring, which reads "Points awarded to each
player in a group of the given size" precisely because the summary line above it had said
"for a group" and lost the per-player distinction. A rule that condemns its own corrections is
not buying recall, it is buying noise. The bar stays at 0.6.

The single-word rule went in, scoped to CSS class selectors. The same word above a custom
property is not the same thing: `/* Layout */` above `--Layout-ContentMaxWidth` heads a block
of tokens in a file three hundred lines long and earns its place, while `/* Padding */` above
`.PaddingXs` restates a class. Probing both confirmed it fires on the first and stays off the
second.

It also reports zero findings today, which is the honest state of this: the rules are
prospective. The comments they would have caught were already gone, removed by hand.

## 2026-10-01 — the three open questions in the comments, answered instead of deleted
The audit found three comments that were asking something rather than stating it. A question
cannot be deleted without answering it first, so each was answered where it stood.

`Grouping.ts` listed Russian endings and said "we might need more, but this is a start." It now
says what the list actually guarantees: the first match wins, so longer endings come first,
and words of four characters or fewer are never touched. What it does not promise is coverage,
so nothing claims a coverage the list does not have.

`ClientSession.submitAnswer` asked whether a send with no `playerId` should be ignored or
waited for. It is dropped, and now says why that is safe rather than why it was a coin toss:
the host cannot start a round until its roster has players, and every rostered player already
has an id, so a client that has reached Writing always holds one.

`Protocol.isHostMessage` said it trusted the state and could check more. It keeps trusting. The
state is written by the host rather than by a peer, so a host that sends a malformed one has
broken its own room and a client has nothing better to fall back on; walking every field on
every message would cost per message and protect nothing.

Two findings are declined and left standing, and both are the same limitation rather than a
judgement about the comment. `Transport.sendToHost` is annotated "Send a message to the host.
Clients only; a host has no host to send to." The tool reads the second sentence as restating
`sendToHost`, but a correct comment on that method has to say who may call it, and every way of
saying that contains the word "host". The overlap rule cannot separate a constraint from a
restatement when the constraint and the method name share a subject.

`GameState.ts` annotates `scores` as "scores for this round" directly above `cumulativeScores`,
which is the only thing telling the two fields apart. The tool no longer reports it — comparing
a trailing comment against the code before it rather than after turned out to be the correct
reference, and the annotation stopped looking like restatement once judged that way.

Both are the class this cannot catch: the comment is short, correct, and repeats the name it
sits on because the name is not enough on its own.

## 2026-10-01 — sixteen comments deleted, and one correction among them
The narration went: `// Step 1: lowercase` and its four siblings in `Normalization.ts`, the
`// Initialize the matrix` pair in `Grouping.ts`, four `// Define the…` headers, `// Set up
incoming message handler` and its two children, and `// Extract component name from path`.

The `Normalization.ts` docstring listed the five steps it was about to perform, so it was the
same text twice. It now states what normalization is for and keeps only the two parts that
are decisions rather than mechanics: the 'ё' fold, and punctuation becoming a space so that
"а,б" splits into two words instead of fusing into "аб". Both were checked against the code,
not written from memory; an earlier draft of that comment claimed "don't" and "dont" normalize
together, and they do not — they become "don t" and "dont".

Files are shorter now, which matters because `max-lines` skips comments and had left the count
looking worse than it was.

## 2026-09-30 вЂ” happy-dom as a dev dependency for the app smoke test
`vitest` runs in a node environment by default, so nothing rendered the app itself. A
blank page passes every unit test, because the logic modules are tested in isolation.
`happy-dom` provides a DOM for `Source/App/App.test.tsx`, which renders `<App />` once and
asserts that real content appears. It caught a bug where the join screen was not rendered
at all: a wrapper component declared as `function Wrapper(children: ComponentChildren)`
lost its children, leaving only the sibling background on the page. The same code works
when the children are taken from a props object, which is the convention used everywhere
else in the codebase. dev-only, not shipped to the browser.

## 2026-09-30 вЂ” the paper overlay shifts a CSS custom property, set from the ref
`design.md` forbids inline styles, but a value that changes every second cannot be a
static class. `PaperBackground` writes `--Overlay-TextureX` / `--Overlay-TextureY` onto
its own node through a ref, and the stylesheet consumes them in a `transform`. The
component API stays closed: callers pass nothing and cannot restyle it. A seamless
texture tiles, so the layer is oversized by `--Overlay-ShiftMax` and any offset stays
seamless, and only one axis moves per step so the drift reads as a slow sway.

A looping 138 MB ProRes clip was replaced with a 185 KB seamless JPEG. The image is small
enough not to compress, costs one request instead of decoding a video every second, and
the same look comes from moving it by hand.

## 2026-09-30 вЂ” the character art is inlined as components, not used as image files
The nine drawings arrived as SVGs with a coloured body and black linework. Tinting needs the
body to be a fill rather than baked pixels, so each drawing is now a Preact component in
`Source/Design/Characters/` whose body paths read `var(--Character-Tint)`. The alternative
was keeping them as `.svg` files and tinting with a CSS mask, but a mask cannot keep the
black linework on top of the tint, so that needed a second ink-only copy of every file. One
file per character with a plain `fill` is smaller, has no `Ink/` folder, and needs no extra
CSS per character.

## 2026-09-30 вЂ” the host remembers who each name is, so a returning player keeps their character
A player closes the tab and comes back to the lobby, and the character must still be theirs.
Nothing may be stored in the browser, and `sessionStorage` dies with the tab anyway, so the
name is the only handle that survives: the host keeps `name -> playerId` in `HostRoster` and
a player re-joining under a known name reclaims that seat, with the character the host
already had. The look a client arrives with is deliberately ignored for a known player,
since it was rolled again on their side. This also means a returning player keeps their
scores, and a reload no longer adds a duplicate to the roster. The trade-off is that two
people who pick the same name are treated as one player, which is accepted for a party game
that has no accounts.

## 2026-09-30 вЂ” the character picker lives in the lobby, and is frozen once play starts
Picking a character needs to be changeable while people are still arriving, so the picker is
part of `LobbyScreen` rather than the join screen. `SET_LOOK` is ignored by the reducer
outside the Lobby phase, which freezes everyone's face for the game: a player cannot swap
characters mid-round, and the scoreboards stay meaningful. The picker is hidden until the
host has told the client which character it kept, so it never shows a character the rest of
the room is not seeing.

## 2026-09-30 вЂ” the character catalogue lives in Core, and its labels travel as a prop
`CharacterId`, `CharacterColor` and `PlayerLook` are in `Core` because `Design` renders them,
`Game` stores them and `Network` carries them, and `Core` is the only layer all three may
import. `Design` may not import `Content`, so the picker's display names arrive as a
`labels` prop rather than being read from `Strings` directly.

## 2026-09-30 вЂ” the picker sizes its characters from the cell, not from a token
The character grid was three columns of a fixed 96px, so on a narrow phone three drawings
overflowed the column and pushed the panel's padding off the page. Two things were wrong
together: the grid used a bare `1fr`, whose floor is `min-content`, so a column cannot shrink
under its contents however narrow the screen is; and the drawing inside it had a fixed pixel
size. The columns are now `minmax(0, 1fr)`, and `Character` and `ColorSwatch` gained a `Fill`
size that takes its width from the cell and derives the height with `aspect-ratio`. The
drawings are square on a 512 viewBox, so that keeps them round at any width without a media
query. The tint row is `auto-fill` with a floor of a comfortable target, so the discs wrap on
a phone and spread on a wide screen rather than all eight squeezing onto one row.

## 2026-09-30 вЂ” one pop, keyed on everything, rippling across a row
A character reacts to three things: it turns up, it changes tint, it is chosen. All three run one
`Pop`, keyed on the character, its tint and a pulse count, and all three are the same movement.
There are no variants, and getting there is the lesson: it went through two nested pops, then two
variants of one pop, and both were worse than having none.

The two nested pops were wrong because remounting the outer one always recreates the inner, so
changing tint also replayed the reaction. The two variants fixed that but needed the variant to be
chosen from the previous look, because recomputing it every render changed the pop's key, and since
the roster re-renders whenever anyone joins, every player popped whenever anyone else did. That
needed a ref holding the previous trigger, and it was the most complex thing in the component for
no visible gain. One pop has none of that: the key is the trigger, and the trigger is everything
that should make it play.

A variant that grew from zero width looked fine in the picker and was wrong in the roster, where a
row of small characters flashed to nothing on every change and read as a rendering fault. So the
pop only ever squashes the height. There is now no `scale: 0` anywhere in it, which is worth
knowing before anyone adds one back for effect.

Reaction is a count rather than a flag. A flag also changes when a character is *deselected*, so
the character that lost the choice popped as though it had been picked; a count that only goes up
reacts on every click, repeats included, and leaves deselection alone. The picker keeps that count
per character, so a click raises only the character clicked.

A row ripples: the pop waits `--Pop-Stagger` per position via `--Pop-Index`, which `PlayerChip`,
`ScoreRow` and the picker grid all pass. The index is set from a ref callback rather than an
effect, and that is the whole ripple. An effect runs after the first paint, by which point the
animation has already begun, and a custom property changed mid-animation is too late to affect the
delay it was supposed to set, so every character animated at once with no wait. A ref callback runs
during the commit, before the browser has painted anything, so the delay is in place before the
animation exists.

`Character.test.tsx` covers the mechanism rather than the pixels, since a pop that stopped
replaying would look like a working app that had quietly stopped reacting. It checks that the
element is rebuilt when the trigger changes, that five re-renders in a row leave the same element
in place, and that the vertical offset stays negative across repeated mounts. Those values are
written from an effect, so a test has to wrap the render in `act` to flush it. What the pop
animates is left to the stylesheet and its own comment, since the test runner rewrites plain CSS
imports to an empty module and reading the raw file out of a test is not worth the fight. The
scoreboard passes `moving={false}`, because those rows re-order as scores land and a sway on top of
that movement is noise.
## 2026-09-30 вЂ” phase transitions and round scoring split out of the session and the actions
`HostSession` and `Game/GameActions.ts` passed the 150-line limit once the roster grew. The
rules about when a phase may end now live in `Network/HostPhases.ts`, and the rejection rule
and totals arithmetic in `Game/RoundScoring.ts`. This is a move, not a change: the same
transitions are still the only things that can trigger each other.

## 2026-09-30 вЂ” the tint row shows discs, not the artwork again
The character grid already draws all nine at full size, so repeating that artwork eight more
times for the tints made the row heavy and harder to scan than the choice needs. `ColorSwatch`
renders the tint as a plain disc instead, reading the same `--Character-Tint` custom property
the characters use, so the palette still lives in one place. Picking a tint now reports the
tint alone rather than a character-and-tint pair, because the character is already fixed by
the grid above; the character is still shown wearing the chosen tint, so the result of the
choice is visible.

## 2026-09-30 — the picker strip is a window of characters you can hold and flick
The cast became one scrolling row with the chosen character in the middle and the rest muted,
instead of one large preview beside a swatch block. The row is capped at `--Character-Strip-Visible`
cells, deliberately not a whole number, so the neighbours at the edges are cut off and it reads
as continuing rather than as a fixed set of three. Two new tokens carry the size: `--Size-Character-Strip`
for the cell and `--Character-Strip-Visible` for the window.

The row follows the pointer only after the pointer has rested on it for `HoldMs` in `UseHoldGesture.ts`,
and moving before that cancels the hold. Without the hold the drag steals ordinary taps and finger
swipes, which on a phone are the natural way to use a carousel. On release the row keeps travelling
at the speed it had and slows out (`UseMomentum`), and the cells' scroll-snap catches it and pulls
it onto a character: the throw decides how far, the snap decides where it lands.

Two things the gesture got wrong the first time, both found by using it. Pointer capture on
pointerdown retargets the click that ends the gesture to the capturing element, so the character
buttons could never be pressed at all; the move and release listeners live on the window instead.
And blank space at each end of the row, added so the first and last character could reach the
centre, meant the row kept travelling into empty space; without it the scroller's own limits clamp
the ends and those two characters sit against the edge.

## 2026-09-30 — the character you were last wearing survives a reload
`App` rolled a random look once per page load, so every reload reshuffled the face. `LookStorage`
keeps the look in `sessionStorage`, the same place and for the same reason as the player name: a
per-tab store means two players sharing a device do not come back as the same character. The saved
look is the one the host has confirmed rather than the one that was clicked, because the host keeps
a returning player's character and may already have refused a replacement, and the next reload should
not offer a face nobody in the room has. The host remains the authority; this only changes the
starting point.

Two things about the gesture were wrong and only showed up when it was actually used. A sharp
flick is usually over before `HoldMs` has passed, so it cancelled the hold and then did nothing at
all; movement now also starts the drag when the pointer is already moving faster than
`FlickSpeed`, since a flick has made its intent clear before it is quick. And the speed used to
throw the row was measured between the last two pointermove events, which browsers coalesce, so
the faster the flick the more likely the gap and the slower it read. `SpeedTracker` now measures
from the most recent gap long enough to divide by, and `UseMomentum` decays per unit of time rather
than per frame, so the coast lasts the same length on a 120Hz screen as on a 60Hz one. Both are
covered by `MotionSample.test.ts`.

The lobby's hint under the heading ("Можно менять, пока игра не началась") was removed along with
`Strings.lobby.characterHint`. The picker says what it does by being a strip of the cast, and the
hint repeated what the room code and the Start button already imply.

## 2026-09-30 — the picker is three rows, and there is no carousel
The scrolling strip is gone. It needed a drag to reveal most of the cast, it needed a hold before
the drag would even register, and it put the character and the tint in the same horizontal space so
neither read as the decision it was. What is there now is the chosen character large at the top,
the whole cast under it, and the whole palette under that. The two rows are the same shape: nine
equal square tracks each, lining up column for column, so they read as one kind of control and a
choice can be found by counting. Seven files went with the strip (`CharacterStrip`, `MotionSample`
and its test, `UseCenterCharacter`, `UseDragScroll`, `UseHoldGesture`, `UseMomentum`), along with
the two `--Opacity-*` tokens and `--Size-Character-Strip`, which only the strip used. The new
`--Size-Character-Preview` sets how big the drawing at the top is.

## 2026-09-30 — a ninth tint, Lemon
The palette ran red, orange, green, blue, purple, pink and brown, and Amber is orange enough that
nothing in it was plainly yellow. `--Color-Character-Lemon` is the gap, and it is the darkest of the
set on purpose: mid-tone so the black ink stays readable on top, and deep enough to hold the same
weight against the paper as the others. Nine tints for nine characters is what lets the two rows be
the same shape, and `Core/Characters.test.ts` holds that equality so the next tenth character or
tint does not quietly break the layout.

## 2026-09-30 — eight characters, named, in two rows of four
Character4 is gone and Lemon with it. The cast is now Butterfly, Explosion, Daisy, Ghost, Mask,
Hat, Heart and Star, and the ids were renamed to match the drawings rather than left as
`Character1`…`Character9` with a hole in it: an id is shared vocabulary between Core, the
network and the design system, and `Ghost` says what the thing is at every one of those. The art
files are named the same way. The palette is back to eight tints, which is what lets both rows of
the picker be a full four by four with no trailing gap; `Core/Characters.test.ts` holds that, so a
ninth character or tint now fails rather than leaving an empty cell.

The chosen character at the top of the picker lost its border and its surface: it is a preview of
one drawing, not a control, and the frame around it was a box the player could try to press. The
tint swatches are squares rather than discs, and the disc's own outline is now a `Circle` variant
rather than part of the base, because a circle with a border inside a bordered square read as two
frames around one swatch. Only the button is an outline now.

The margin glyph field lives in its own module, `Design/Backgrounds`, not with `Design/Overlays`:`nOverlays/PaperBackground` is a texture blended over the live interface, while the field is a backdrop`nsitting under it, and keeping them apart is what makes that stacking order obvious. The field's`nparallax is a single shared custom property multiplied by each mark's own depth in the stylesheet, so`nthere is no per-mark JavaScript, and both bands are exactly the width the content column leaves`nover, which keeps the centre clear by construction rather than by a margin.

The field's parallax is smoothed in one `requestAnimationFrame` loop (`GlyphParallaxDriver.ts`) rather`non discrete writes per event, easing toward the target by real elapsed time with the delta clamped, so the`nfield follows the pointer with weight instead of snapping to it. Events only move the target.`nMarks are now several times the base size token and a band holds eight of them rather than"fourteen;"the bands clip the overflow, so a mark reads as wallpaper seen through the screen margin.

The glyph field is an overlay after all, and `Design/Backgrounds` is gone: it sits above the
interface and below the paper texture (z-index 2 and 3), so the marks multiply under the same
paper as everything else rather than sitting behind the page. Its marks are symbols only, no
letters, because letters at that size read as words and the centre column has to stay free of
text. They are laid out in even slots with jitter rather than scattered, so the bands are filled
without holes while still looking laid out by hand.

The field's parallax is deliberately faint: 28px of pointer travel and an eighth of the page
scroll, so marks answer the pointer rather than follow it. Opacity has two axes, a token ceiling and
a per-mark share of it, because tone alone left a band reading as one flat value.

Marks are drawn at one of three fixed pixel sizes (`--Glyph-Size-Small/Medium/Large`) rather
at a random multiple of a base token, so a mark is exactly as big on every screen and at every zoom
level and the field does not scale with the window.

A mark's size is divided by `--Glyph-Zoom`, read each frame as device pixel ratio against the
ratio the field started at, times the visual viewport's pinch scale. The size tokens are
therefore the size a mark appears at on screen, and it holds that size at any browser or pinch zoom.

Marks are anchored to the outer edge of their band and mirrored for the right one, rather than
scattered across the whole band: a mark is much wider than a band, so what decides whether it
reaches the text is which side its ink falls on. Bands now hold 44 marks.

Doubling the marks needed two things pulled back with them, and both are the
density rather than the count. The jitter was a share of the band, so at half the
slot step it spanned four slots and dropped marks on top of each other; it is now
a share of the step, which keeps the arrangement the same shape at any density and
still lets a mark cross into its neighbour's slot. And the appear stagger is per
mark, so at the old twenty-two milliseconds the field took about a second to
arrive, which reads as a delay rather than as a page settling; it is now twelve,
under half a second for forty-four.

The field compensates for pinch zoom only, not for browser zoom. Browser zoom is not readable from a`page, so inferring it from the device pixel ratio at load made the field depend on`the zoom the page happened to open at, and the same URL looked different per device.`nPinch is reported by the visual viewport and is the same everywhere.

Each glyph band is `--Glyph-BandWidth` (15%) of the viewport from its outer edge, rather than the
leftover space beside the content column. The band is therefore the same shape and density on a phone
and on a desktop instead of spreading thinner the wider the screen gets, and the middle seventy per
cent is free for the game. Below 50rem the two bands would meet, so the field steps aside.

## 2026-09-30 - a room that would not connect, in four separate causes
Players on two different networks sat on "connecting to the room" forever. Four things were wrong
at once, and only the last of them was the actual blocker.

Trystero's default ICE servers are `stun.l.google.com` and `stun1.l.google.com`, which a Russian
network cannot reach without a VPN. Two peers behind different NATs need a server-reflexive
candidate from a STUN server that answers, so ICE never leaves `checking`, no peer is ever
connected, and no message is ever exchanged. `Network/Signaling.ts` now passes an explicit
`rtcConfig.iceServers`: `stun.cloudflare.com` and `stun.miwifi.com`, replacing the defaults rather
than extending them, because trystero spreads `rtcConfig` after its own list and so a supplied
`iceServers` overrides it outright.

No TURN server is hardcoded. Public ones are rate limited or shut down without warning, so a dead
one would be worse than none: the room would fail slowly and only on the networks that need it. A
deploy supplies `VITE_TURN_URL`, `VITE_TURN_USERNAME` and `VITE_TURN_CREDENTIAL`, and all three
must be present or none are used, since a TURN entry missing its credentials fails in a way that
reads as a network fault.

`Network/Diagnostics.ts` reported every relay as `absent` forever. It looked for a `socket` field
on each socket-table entry, but trystero's `getRelaySockets()` maps a relay URL straight to its
live `WebSocket`. Every entry therefore read as undefined, so a fully working relay and a dead
one printed the same word, and the log claimed there was no signaling at all while some of it was
up. The diagnostics also now name each relay once when it opens, when it cannot be reached, and
when trystero has retired it: the library gives a relay up permanently once its reconnect backoff
runs out, roughly two minutes after a transient failure, which is why the page kept waiting on a
relay that was never coming back.

`ClientSession` logged "host is reachable, sending the join now" on every retry whether or not a
host existed, because the retry timer called the same flush as the handshake callback and the
flush never checked. The transport then dropped the send. Every one of those lines meant the
opposite of what it said. `Transport` now exposes `isHostAddressable()`, and a join that cannot go
out says it is being held back.

The relay list keeps `relay.damus.io` and `nostr.wine` even though both refused a WebSocket
handshake from the network this was measured on, because they work elsewhere and three live relays
is the floor worth keeping. The `redundancy: 3` that used to sit next to them was removed: trystero
applies redundancy only when it chooses relays from its own defaults and ignores it entirely once
`urls` is supplied, so it had never done anything.

A mark's centre is placed thirty to seventy per cent of a band width beyond the screen edge, so marks lean out`of the screen rather than sitting inside the band. Since a mark is far wider than a band, this is what`keeps the middle clear: density falls off inward on its own, with no fade and no clipping.

A mark's placement off the screen edge is a share of `--Glyph-EdgeReach`, which shrinks as the
screen narrows while the band width grows. The two cancel: a desktop mark is placed near the edge
and reaches into the wide margin, a phone mark is placed further off screen and only its edge
comes in, so the middle stays clear where there is least room for it.

The field has no viewport-dependent sizing left. The band is a fixed 15% of the screen on each`side, a mark is a fixed 26vw wide, and a mark's placement off the edge is a share of its own`width rather than of the band. One size for every mark, since rolling a size per mark read as a mixture`rather than a pattern; the variety is position, tone, rotation and weight.

Scroll leans the field by a bounded amount (600px of scroll is the full lean) rather than by a share of`the page, so scrolling cannot walk the marks into the middle of the screen. The band stays put at fifteen per cent on each side.

Scrolling writes a spread value rather than moving the field along the pointer axes. The two bands read`it in opposite directions, so scrolling pushes each one further from the middle and reading down the`page opens the centre up instead of filling it. Capped at 34px over 600px of scroll.

Marks are rolled between two size tokens (13vw and 26vw) rather than all at one width, weighted low so the
small ones fill the corners and gaps. A mark's width is worked out once on its wrapper as a custom`property, because the mark and the rule positioning it are both in widths of the mark and must not`disagree about its size.

The drawn cursors in `Design/Cursors` ship on a device that has a pointer, and not otherwise.
`--Cursor-Default`, `--Cursor-Pointer` and `--Cursor-NotAllowed` are the platform's own keywords
in `:root`, and are only replaced with the drawn images inside `@media (hover: hover) and (pointer:
fine)`. Deciding this in the token rather than per component is what keeps it in one place: a
component that writes `cursor: var(--Cursor-Pointer)` gets the finger on a desktop and the system
hand on a phone without knowing which kind of device it is on. `hover: hover` alone is not enough,
because a touchscreen laptop reports that it hovers while still being driven by touch, and its
player should not get a drawn arrow they cannot aim with a finger.

The drawn cursors are applied through `cursor` on the body, which `cursor` inherits from, rather
than through a `cursor` set per component. That is what makes the arrow reach text, cards and
images that no component styles at all. Links and fields are then the two that opt back out, a link
to the pointer and a field to the I-beam, since the arrow points at neither.

Each image is followed by a hotspot and then by the keyword it replaces, so a missing or
undecodable SVG leaves the platform cursor rather than an invisible pointer. The hotspot values were
measured from the paths' own geometry rather than assumed at the top-left corner, which the art
does not use.

A character chosen in one room is kept for the next room in the same tab, not only across a
reload. The look a session starts from was held in `App` as state that never changed, so a room
closed and reopened in the same tab started from whatever was rolled when the page loaded, and
only reloading the page read the stored look back. The confirmed look is now reported up to `App`
as well as written to `sessionStorage`, which is what the host does with a change: the session keeps
the character, and the app keeps the one to offer next time.

The look is not read from storage on every render. Storage stays the answer to "what did this device
last wear", read once at load, and the live value is state, because reading it per render would make
a room that opened a moment later depend on whether anything had written since.

The glyph field follows the page scroll and nothing else. The pointer is not read at all: no
`pointermove` listener, and the shared offset is written from the scroll position on the animation
frame rather than moved by an event, so neither a mouse nor a finger dragging or panning the screen
can pull the marks around. A touch that scrolls moves the field exactly as a wheel does, and a touch
that does not scroll does not move it. What is left is one vertical spread, read the same way by
both bands, so scrolling carries the field down the page with the content instead of sliding the two
bands apart across it. The driver no longer exposes a target to aim at, and `--Glyph-OffsetX` and
`--Glyph-OffsetY` are gone with it. With the pointer gone the parallax carries a mark a couple of
hundred pixels, so it catches up four times faster than a pointer-follow needed and the travel is
scaled by a depth that now runs past one, which is what separates the layers from each other: a
shallow mark barely answers a scroll and a deep one crosses a good share of the viewport.

The marks are sized as a share of the viewport with a floor under it, and there is no breakpoint. A
bare share empties the margins out on a phone, where sixteen per cent is a mark no bigger than the
text behind it, and a second rule per screen size would fix that by making a mark jump size twice on
the way past the breakpoint: once on entering the narrow case and once on leaving it. `max` gives the
floor without the step, so the field is one continuous arrangement and a resize moves the marks to
the same relative place rather than somewhere new. The bands are left at fifteen per cent at every
size, because a mark is placed from the band's outer screen edge and the band is only the area it is
laid out in: widening the bands on a narrow screen would widen those boxes without moving anything
inside them.

The connecting screen is the info screen, not a banner of its own. It is the same situation a moment
earlier: the game is not here yet, one sentence says so, one button gets the player unstuck. What
differs is the mark and the button's word, both passed into the shared screen rather than branched
inside it: the mark says it is still waiting rather than that something has gone wrong, and the
button is `Отмена` because it gives up the wait. `Ок` would be promising an outcome on a screen
that has not settled anything. The plank's mark is a prop rather than one shape per variant, because
the mark is the only part of a note that ever has to say more than the words, and four shapes would
make a set of notes read as a set of statuses. A `Loading` mark turns one whole revolution over
`--Duration-Spin` on `--Easing-Smooth`, the one easing token that is symmetric about its middle: the
others each suit a movement with a beginning and an end, and a loop built from one of them hitches
at the seam where a fast pass hands over to a slow one.

The scrollbar answers the pointer the way an icon button does: quiet at rest, accent on hover, and
with no border on it. It is the one piece of the interface the browser paints rather than the game,
and left alone it is the only grey on the page belonging to neither the palette nor the paper. The
arrangement is the icon button's rather than a new one, and the resting values are read off that
button's own tokens so the two cannot drift apart. Accent at rest would spend the room's gold on
something that is not being acted on. The track is transparent rather than a colour of its own,
because the paper texture covers the viewport and anything opaque painted there is a hole in it. Only
the resting colour reaches Firefox, which reads `scrollbar-color` and has no hover state for a bar
at all. Both the standard `scrollbar-color` pair and the `::-webkit-scrollbar`
pseudo-elements are written: the first is what a browser reads and the second is the only way to get a
borderless rounded thumb anywhere, and each is ignored where it is not understood. `scrollbar-width`
is left at `auto` rather than `thin`, which is load-bearing rather than an omission: in Chrome
anything but `auto` on that property makes the browser discard the `::-webkit-scrollbar` rules for
the element altogether, so `thin` was throwing away the width, the borderless thumb and the rounded
ends and leaving a stock bar. A device with no
pointer gets no bar at all, since there is nothing to drag one with and it would be a permanent strip
of accent down the side of the page.

The cards are divided by `Separator`, a full-width hairline with a word in it, in the lobby between
the room code and the roster and in the picker between the chosen character and the rows of choices.
The word is optional: without one it carries the `separator` role and is a boundary, and with one it
is not, because a labelled rule announces the name of a line rather than the name of the part below
it. Each run of the rule is a flex child rather than a border on the word, because a border there
would make the word a pixel taller than the row and shift everything under it, and because two runs
either side of a word are what makes it one rule rather than two. The label carries the card's own
surface behind it, since the card is what has to show through the gap.

The two separators are spaced by the same gap because the roster's outer stack now uses the picker's
gap and the chips keep their tighter one on an inner stack. A separator takes its spacing from
whatever it sits in, so leaving the roster packed tight gave two rules dividing the same two things
at different distances from each other, which is worse than either spacing on its own. The roster
moved into its own file because adding the rule to the screen pushed it past the line limit, and it
was already a self-contained part with a single caller.

A name is cut with an ellipsis wherever it is drawn, never wrapped: in the roster chip, on a score
row, on an answer card and in a title. A name is whatever someone typed, and on a narrow phone a long
one either made the row two lines tall, pushed the marks and the controls off the end of it, or
stretched the card. The four declarations that make a cut are shared as `Truncate`, one CSS module
composed into all five rules, because the reason for each of them is the same everywhere and the one
that is easy to leave out decides whether any of the rest does anything: a flex item refuses to
shrink below its contents by default, so without `min-width: 0` the ellipsis is never reached. The
`Title` variant of `Text` also has to become a block, since it is a span and an inline box ignores
`overflow` entirely. The word on a separator is cut for the same reason and by the same rule, with
the line given `flex: 1 1 0` so they are the ones that give way: a word that wrapped would push the
two runs apart and turn one rule into two lines and a paragraph. An answer is the exception and wraps
rather than being cut, because a cut answer is a hidden answer, and the name beside it is what gives
way instead. The cut is in the drawing only, so a name stays whole in the data and in the accessible
name of the control that would remove it.

## 2026-10-01 — the screen's margin is two margins, not one

`--Layout-ScreenPadding` is now `--Layout-ScreenPaddingVertical` and
`--Layout-ScreenPaddingHorizontal`, at `--Space-2xl` and `--Space-Lg`. They were one number
because the page's margin is one thing, and it is two: down the page there is nothing but margin
and the large step is what gives a top-aligned screen any room at all, while across the page the
container is already centred and the margin is only what keeps a wide container off the edge. At
64px a side it spent more room on the gap between the container and the frame of the page than
between the containers themselves, which is margin nobody was reading.

## 2026-10-01 — every page fades in, on the body, while it renders

One fade for every screen, declared once in `Screen` and applied by `usePageEnter` to the body rather
than to a screen or to `#root`: the marks and the paper are fixed layers of the viewport, and only an
opacity on an ancestor of a fixed element reaches them, so a fade anywhere else arrives without the
two backgrounds and reads as content drawn onto an already-lit page. The gallery calls the hook
itself, since it brings its own frame rather than a `Screen`. Two decisions inside the hook are the
whole of it. The class is applied during render and not in an effect, because an effect runs after the
browser has painted the new page lit and only then takes it back to nothing — that was the blink on
every page change. And it is applied once per screen rather than once per render, because a screen
re-renders as often as its data changes, and a countdown or a vote would have the page pulsing under
the player's hands. It is removed and put back rather than left on, since an animation only runs when
its name is newly applied. Its own `--Duration-PageEnter` rather than one of the three durations,
because a whole page arriving at the speed of a button answering a touch reads as a flash.

## 2026-10-02 — the theme card bank lies flat, and the cards lean towards nothing

The bank was a ring of panels: one `perspective` on the row, and each card turned by an angle measured from where it sat on the screen (`CardTurn.ts`, `UseCardTurns.ts`, `--Perspective-ThemeCards`, `--Angle-ThemeCardYaw`, `--Angle-ThemeCardPitch`). It needed a measurement per card on every window resize, and what it bought was six cards that had to be looked at rather than read. A pointer tilt on top of it, leaning the card towards the cursor, was tried and dropped for the same reason and for a second one: the sway already animates `transform` on the card's own node, so any lean written there holds for one frame and then stops. The arrangement that survives without the measuring is kept — cards of one width, three across, the fourth wrapping — and the card keeps its own idle sway, which is the lean the design already had.
