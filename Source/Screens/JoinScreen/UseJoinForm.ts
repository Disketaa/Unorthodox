import { useState } from "preact/hooks";
import { GameConfig } from "@/Game";

export interface JoinFormErrors {
  /** True once the player has pressed a button and something was still missing. */
  showErrors: boolean;
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

/**
 * Validation for the entry form.
 *
 * The buttons stay enabled and validate on click. A disabled button cannot
 * explain itself, so the player presses it and only then sees which field is
 * empty, which is the usual pattern and reads better on a phone.
 */
export function useJoinForm(name: string, roomCode: string): JoinFormHandlers {
  const [showErrors, setShowErrors] = useState(false);
  const nameMissing = name.trim().length === 0;
  const codeValid = roomCode.length === GameConfig.limits.roomCodeLength;

  function attempt(valid: boolean, continueTo: () => void): void {
    if (valid) {
      continueTo();
      return;
    }
    setShowErrors(true);
  }

  return {
    errors: { showErrors, nameMissing, codeValid },
    submitJoin: (continueTo) => attempt(!nameMissing && codeValid, continueTo),
    submitCreate: (continueTo) => attempt(!nameMissing, continueTo),
  };
}
