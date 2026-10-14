import { useEffect, useRef } from 'preact/hooks';
import { playSound } from '../../Sounds';

/** What the card sounds when it crosses over, once per crossing and never both ways. A card one
 * player wrote is struck by the host pressing it, and the press sounds it; a card several wrote
 * is struck by the round, with no press anywhere near it. */
export function useDeclinedSound(declined: boolean, pressedIt: boolean): void {
  const wasDeclined = useRef(declined);
  useEffect(() => {
    if (wasDeclined.current === declined) return;
    wasDeclined.current = declined;
    // Whoever pressed has already heard the card go off, so this stands down for them; everyone
    // else was told by the board rather than by their own finger, and this is what they hear.
    if (pressedIt) return;
    playSound(declined ? 'Break' : 'Pop');
  }, [declined, pressedIt]);
}

/** A control turning up is the ordinary press note and not the break: nothing has been struck
 * yet. A board where the one thing that arrives with a sound is the card coming over says the
 * answer mattered and the invitation did not, which is backwards. */
export function useRevealedSound(revealed: boolean): void {
  const wasRevealed = useRef(revealed);
  useEffect(() => {
    if (wasRevealed.current === revealed) return;
    wasRevealed.current = revealed;
    if (revealed) playSound('Pop');
  }, [revealed]);
}
