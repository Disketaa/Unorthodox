/** A stable id for this browser, so the room can tell a returning player from an impostor. A
 * name alone can only say "somebody using this name is here", so the room waits for the old
 * connection to be reported gone — and notices are lost, leaving that name locked out for good. */
const ClientIdKey = 'unorthodox.clientId';

/** Held for the page, so one load never answers with two different ids. */
let minted: string | null = null;

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** This browser's id, minted on first use and kept from then on. Held in a module variable as
 * well as in storage, and that is a requirement rather than a cache: the join is re-sent until
 * answered, so a new id per call would be refused by its own retry. */
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

/** Drop the stored id, so the next call mints a different one. For tests standing in for a
 * second browser: two players under one name are the case this id exists to tell apart, and a
 * test cannot give them separate browsers any other way. */
export function forgetClientId(): void {
  minted = null;
  try {
    localStorage.removeItem(ClientIdKey);
  } catch {
    // Nothing to forget if storage was never available.
  }
}
