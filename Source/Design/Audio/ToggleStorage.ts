export interface ToggleStorage {
  /** The stored choice, or the default where there is none. */
  load(): boolean;
  /** Remembers the choice, if it can be remembered. */
  save(on: boolean): void;
}

/** A remembered on-or-off choice, written as words rather than a boolean so a half-written value
 * cannot read as an answer. Only the exact word counts: anything else is not a choice this made
 * and falls back to the default. */
export function makeToggleStorage(key: string, fallback: boolean): ToggleStorage {
  return {
    load: () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored === 'on') return true;
        if (stored === 'off') return false;
        return fallback;
      } catch {
        return fallback;
      }
    },
    save: (on: boolean) => {
      try {
        localStorage.setItem(key, on ? 'on' : 'off');
      } catch {
        // Private mode or a full quota: the choice then lasts for the page only.
      }
    },
  };
}
