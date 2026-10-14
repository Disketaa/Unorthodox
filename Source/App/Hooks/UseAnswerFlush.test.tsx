// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { useEffect } from 'preact/hooks';
import { AnswerFlushProvider, useAnswerFlush } from './UseAnswerFlush';

/** A field offering to send, and a button above asking it to. Neither can reach the other, which
 * is the whole reason this bridge exists. */
function bridge(sent: string[], label = 'sent', withdraw = true) {
  const Field = () => {
    const flush = useAnswerFlush();
    flush.publish(() => sent.push(label));
    useEffect(() => () => withdraw && flush.publish(), [withdraw, flush]);
    return null;
  };
  const Skip = () => {
    const flush = useAnswerFlush();
    return <button type="button" onClick={flush.flush} />;
  };
  return { Field, Skip };
}

function mount(children: preact.ComponentChildren): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  act(() => render(children, root));
  return root;
}

describe('a screen offering a command to the room above it', () => {
  it('runs what the field offered when the room asks', () => {
    const sent: string[] = [];
    const { Field, Skip } = bridge(sent);
    mount(
      <AnswerFlushProvider>
        <Field />
        <Skip />
      </AnswerFlushProvider>
    );
    act(() => document.querySelectorAll('button')[0]?.click());
    expect(sent).toEqual(['sent']);
  });

  it('sends nothing when there is no field on screen to ask', () => {
    // Every phase but writing has no answer field, and the skip button is drawn in all of them, so
    // pressing it with nothing offered is the button's normal path rather than an error.
    mount(
      <AnswerFlushProvider>
        <SkipOnly />
      </AnswerFlushProvider>
    );
    expect(() => document.querySelectorAll('button')[0]?.click()).not.toThrow();
  });

  it('sends nothing once the field has gone, rather than the round it belonged to', () => {
    // The handler belongs to the round that wrote it. Left behind, pressing skip in the next round
    // sends the previous round's answer again — into the round now on screen, under a topic a round
    // old, so the room is shown a card nobody wrote and this browser does not recognise its own.
    const sent: string[] = [];
    const { Field, Skip } = bridge(sent, 'stale');
    const root = mount(
      <AnswerFlushProvider>
        <Field />
        <Skip />
      </AnswerFlushProvider>
    );
    act(() =>
      render(
        <AnswerFlushProvider>
          <Skip />
        </AnswerFlushProvider>,
        root
      )
    );
    act(() => root.querySelector('button')?.click());
    expect(sent).toEqual([]);
  });

  it('presses the field as it is now, not as it was when the room last looked', () => {
    // Offered while rendering rather than in an effect, so a handler closed over an older draft
    // cannot be the one the button presses: the room would flush the answer as it was three
    // keystrokes ago, which is the answer the player was trying not to send.
    const sent: string[] = [];
    const { Field, Skip } = bridge(sent);
    const root = mount(
      <AnswerFlushProvider>
        <Field />
        <Skip />
      </AnswerFlushProvider>
    );
    sent.length = 0;
    act(() => root.querySelector('button')?.click());
    expect(sent).toEqual(['sent']);
  });
});

function SkipOnly() {
  const flush = useAnswerFlush();
  return <button type="button" onClick={flush.flush} />;
}
