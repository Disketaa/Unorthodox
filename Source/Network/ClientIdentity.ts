/**
 * A stable id for this browser, so the room can tell a returning player from an
 * impostor.
 *
 * The name is not enough on its own. It is the only handle the room keeps, which is
 * why a player who refreshes is meant to get their seat back — but a name alone cannot
 * say "the same person came back", only "somebody using this name is here", and the
 * room has been resolving that by waiting for the old connection to be reported gone.
 *
 * Which is a notice, and notices are lost. A tab that closes does not get to choose
 * whether the relays carried the news before the new connection arrived, and when one
 * is late or a relay is refusing writes the seat stays held: the returning player is
 * refused as an impostor and that name can never sit down again, in that room, for as
 * long as the host's page lives.
 *
 * So the client says who it is instead, and the room believes a name whose holder
 * answers with the same id. `localStorage` rather than `sessionStorage` precisely
 * because it has to survive the reload that is the whole problem; scoped per browser
 * rather than per tab because a player who refreshes, or opens the room in a second
 * tab, is the same player either way.
 */
const ClientIdKey = 'unorthodox.clientId';

/** Held for the page, so one load never answers with two different ids. */
let minted: string | null = null;

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * This browser's id, minted on first use and kept from then on.
 *
 * Held in a module variable as well as in storage, and that is not a cache but a
 * requirement: the join is re-sent until the host answers, so a client that minted a
 * new id per call would sit down and then be told it was an impostor by its own retry.
 *
 * A browser that refuses to store it keeps a per-load id, which is not fatal — that
 * player is then treated as an impostor after a refresh exactly as before, so refusing
 * storage is the old behaviour rather than a new way to be locked out.
 */
export function clientId(): string {
  if (minted !== null) {
    return minted;
  }
  try {
    const stored = localStorage.getItem(ClientIdKey);
    if (stored !== null) {
      minted = stored;
      return minted;
    }
    minted = randomId();
    localStorage.setItem(ClientIdKey, minted);
    return minted;
  } catch {
    minted = randomId();
    return minted;
  }
}

/**
 * Drop the stored id, so the next call mints a different one.
 *
 * For tests standing in for a second browser or a second device: two players under one
 * name are the case this id exists to tell apart, and a test cannot give them separate
 * browsers any other way.
 */
export function forgetClientId(): void {
  minted = null;
  try {
    localStorage.removeItem(ClientIdKey);
  } catch {
    // Nothing to forget if storage was never available.
  }
}
