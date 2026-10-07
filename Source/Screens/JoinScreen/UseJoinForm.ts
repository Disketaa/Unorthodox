import { useState } from 'preact/hooks';
import { GameConfig } from '@/Game';

export interface JoinFormErrors {
  /** True once the player has pressed join and the name was still missing. */
  showNameError: boolean;
  /** True once the player has pressed join and the code was still wrong. */
  showCodeError: boolean;
  nameMissing: boolean;
  codeValid: boolean;
}

export interface JoinFormHandlers {
  errors: JoinFormErrors;
  /** Run when the player presses join, continuing only if the form is valid. */
  submitJoin: (continueTo: () => void) => void;
  /** Run when the player presses create, which only needs a name. */
  submitCreate: (continueTo: () => void) => void;
}

/** Validation for the entry form. The buttons stay enabled and validate on click. A disabled
 * button cannot explain itself, so the player presses it and only then sees which field is
 * empty. Each button reveals only the messages for the fields it requires. */
export function useJoinForm(name: string, roomCode: string): JoinFormHandlers {
  const [showNameError, setShowNameError] = useState(false);
  const [showCodeError, setShowCodeError] = useState(false);
  const nameMissing = name.trim().length === 0;
  const codeValid = roomCode.length === GameConfig.limits.roomCodeLength;

  function attempt(valid: boolean, reveal: () => void, continueTo: () => void): void {
    if (valid) {
      continueTo();
      return;
    }
    reveal();
  }

  return {
    errors: { showNameError, showCodeError, nameMissing, codeValid },
    submitJoin: (continueTo) =>
      attempt(
        !nameMissing && codeValid,
        () => {
          setShowNameError(true);
          setShowCodeError(true);
        },
        continueTo
      ),
    submitCreate: (continueTo) =>
      attempt(!nameMissing, () => setShowNameError(true), continueTo),
  };
}
