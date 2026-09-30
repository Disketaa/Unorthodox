import { PlayerLook, isPlayerLook } from '@/Core';

/**
 * The last look this device wore, kept in sessionStorage so a reload keeps it.
 *
 * sessionStorage rather than localStorage, for the same reason the player name
 * uses it: it is scoped to one tab, so two players sharing a device do not both
 * come back as the same character. A look is only a starting point anyway, and
 * the host decides what everyone actually sees.
 */
const LookStorageKey = 'unorthodox.look';

/** The stored look, or nothing if there is none or it no longer makes sense. */
export function loadLook(): PlayerLook | undefined {
  try {
    const raw = sessionStorage.getItem(LookStorageKey);
    if (raw === null) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    return isPlayerLook(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Remembers a look so the next reload starts from it. Storage may be unavailable. */
export function saveLook(look: PlayerLook): void {
  try {
    sessionStorage.setItem(LookStorageKey, JSON.stringify(look));
  } catch {
    // Private mode or a full quota: the look then lasts for the tab only.
  }
}
