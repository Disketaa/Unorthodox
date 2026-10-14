import { ComponentChildren, createContext } from 'preact';
import { useContext, useMemo, useRef } from 'preact/hooks';

/** The deep end of a command the shallow end cannot reach: the answer field can send, but the
 * button that ends the phase is drawn by the room around it and has no way down there. */
export interface AnswerFlush {
  /** The field offering to send what it holds, re-offered on every render it is willing to, and
   * withdrawn with nothing when it goes away. */
  publish: (send?: () => void) => void;
  /** Asking the field to send now, if it has something it has not. Nothing at all when the field
   * is not on screen, which is every phase but the writing one. */
  flush: () => void;
}

const Nothing: AnswerFlush = { publish: () => {}, flush: () => {} };

const AnswerFlushContext = createContext<AnswerFlush>(Nothing);

/** Lets a screen below offer a command to the room above it, without either knowing the other's
 * name. A ref rather than a prop, because the field is four components below the room. */
export function AnswerFlushProvider({
  children,
}: {
  children: ComponentChildren;
}): ComponentChildren {
  const held = useRef<(() => void) | undefined>(undefined);
  // Built once and never rebuilt. A new object each render gives every screen below a new `flush`,
  // so a screen that withdraws its handler on the way out would do it every render rather than on
  // the way down, and whether a press found a handler would come down to the order of two effects.
  const value = useMemo<AnswerFlush>(
    () => ({
      publish: (send) => {
        held.current = send;
      },
      flush: () => held.current?.(),
    }),
    []
  );
  return <AnswerFlushContext.Provider value={value}>{children}</AnswerFlushContext.Provider>;
}

/** The answer field's side of it, which offers to send rather than sending on its own. */
export function useAnswerFlush(): AnswerFlush {
  return useContext(AnswerFlushContext);
}
