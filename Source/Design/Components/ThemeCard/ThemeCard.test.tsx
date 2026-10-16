// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { ThemeCard } from './ThemeCard';
import { Accents, ThemeId, ThemeIds, themeAccent } from '@/Core';

/** The card as one role sees it, mounted with its effects flushed. */
function card(
  theme: ThemeId = 'Internet',
  index?: number,
  waiting = false,
  spent?: number,
  rounds = 10,
  mult?: number
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  // The accent and the sway are both written from effects, so the card is mounted inside
  // `act`: without it the write has not happened yet and the card reads as having no colour
  // and no movement at all.
  act(() => {
    render(
      <ThemeCard
        theme={theme}
        name="Астерия"
        index={index}
        waiting={waiting}
        spent={spent}
        rounds={rounds}
        mult={mult}
      />,
      container
    );
  });
  const button = container.querySelector('button');
  if (button === null) {
    throw new Error('no card rendered');
  }
  // The number rather than the first hidden node: the corner initial, the grain and the tick
  // row are hidden too. The figure is the hidden node whose text is a digit, which is the mark
  // and nothing else.
  const mark = [...container.querySelectorAll('[aria-hidden="true"]')].find((node) =>
    /^\d$/.test(node.textContent ?? '')
  );
  return { container, button, mark };
}

describe('one theme card', () => {
  it('is a button, because a card you can point at has to be one', () => {
    // A `div` with a hover on it is a control the browser cannot focus and cannot announce.
    expect(card().button.type).toBe('button');
    expect(card().button.disabled).toBe(false);
  });

  it('hides every decoration on the card, so the name is all that is announced', () => {
    // The number is a mark on the panel, not part of its name, and read out as one the theme
    // would be announced as "one, Астерия". The corner roll, the grain and the tick row
    // carry nothing at all, and ten ticks read out as a burst of punctuation. All of them are
    // `aria-hidden`, so what the DOM still holds is not what is read — the name is the only
    // thing on the card that is.
    const { container, mark } = card();
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')];
    expect(hidden).toHaveLength(4);
    expect(hidden.map((node) => node.textContent).join('')).toBe('1');
    expect(container.textContent).toBe('1Астерия');
  });

  it("carries the room's roll in the corner, as the player sees it", () => {
    // The roll is the one thing on the card that says what the room's roll is rather than which
    // theme the card is РІР‚— the name says that, and six rolls are six cards. Taken from the room
    // rather than from the catalogue, so it is the same on every screen in it. A card with no
    // roll is plain and shows nothing, which is a real answer rather than a card wearing a
    // number that belongs to no round.
    const roll = card(undefined, undefined, false, undefined, 10, 1.5);
    const corner = roll.button.querySelectorAll('[aria-hidden="true"]')[0];
    expect(corner?.getAttribute('aria-hidden')).toBe('true');
    expect(corner?.textContent).toBe('1.5x');
    const plain = card();
    expect(plain.button.querySelectorAll('[aria-hidden="true"]')[0]?.textContent).toBe('');
  });

  it('writes its own accent onto itself rather than taking the colour as a prop', () => {
    // A caller that passed the colour could pass the wrong one, and two cards of one bank
    // wearing two colours would be a mistake nothing could see.
    const { button } = card('Nature');
    const accent = themeAccent('Nature');
    expect(button.style.getPropertyValue('--ThemeCard-Wash')).toBe(accent.wash);
    expect(button.style.getPropertyValue('--ThemeCard-Ink')).toBe(accent.ink);
  });

  it('washes in a colour that belongs to the palette, never a new one', () => {
    // Every wash and ink is one of the eight measured accents, so nothing new had to be
    // picked and nothing is unmeasured.
    const palette = Object.values(Accents);
    ThemeIds.forEach((theme) => {
      expect(palette).toContain(themeAccent(theme));
    });
  });

  it('keeps the name readable on its own wash, which a raw tint would not be', () => {
    // The ink step is what can be read on the wash; the raw tint behind a name fails
    // contrast in every one of the eight, which is why the wash is the pale one.
    expect(themeAccent('Internet').ink).not.toBe(themeAccent('Internet').tint);
  });

  it('gives every theme a tint of its own, since the palette is that size', () => {
    // The palette holds exactly as many tints as there are themes, and a ninth theme that was
    // the union of all the others had no colour to be: it was a mode, not a card. Sharing a tint
    // is what the fallback is for now, and a file that names one the palette does not have still
    // reads rather than breaking the build.
    const used = new Set(ThemeIds.map((theme) => themeAccent(theme)));
    expect(used.size).toBe(ThemeIds.length);
  });
});

describe("a card that is not this player's to press", () => {
  it('is still a button, since the bank is being read while it waits', () => {
    // `disabled` would take the card out of the tab order and kill the hover with it, and the
    // hover is how a card says which theme it is. Held back and announced instead.
    expect(card(undefined, undefined, true).button.disabled).toBe(false);
  });

  it('is announced as unpressable rather than left looking live', () => {
    expect(card(undefined, undefined, true).button.getAttribute('aria-disabled')).toBe('true');
    expect(card().button.getAttribute('aria-disabled')).toBeNull();
  });

  it('does not pick, so a press on a card of another player goes nowhere', () => {
    const picked: ThemeId[] = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(
        <ThemeCard
          theme="Nature"
          name="Р СџРЎР‚Р С‘РЎР‚Р С•Р Т‘Р В°"
          waiting
          onPick={(t) => picked.push(t)}
        />,
        container
      );
    });
    const button = container.querySelector('button');
    if (button === null) {
      throw new Error('no card rendered');
    }
    act(() => {
      button.click();
    });
    expect(picked).toEqual([]);
  });

  it('picks when the turn comes round, off the same card', () => {
    const picked: ThemeId[] = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(
        <ThemeCard
          theme="Nature"
          name="Р СџРЎР‚Р С‘РЎР‚Р С•Р Т‘Р В°"
          onPick={(t) => picked.push(t)}
        />,
        container
      );
    });
    const button = container.querySelector('button');
    if (button === null) {
      throw new Error('no card rendered');
    }
    act(() => {
      button.click();
    });
    expect(picked).toEqual(['Nature']);
  });
});

describe('a card whose theme has nothing left', () => {
  it('is held back and taken off the bank, once every round is spent', () => {
    // Held back like a card on somebody else's turn, since both say the card is not on offer,
    // and marked apart from it because a card with nothing left is not to be read either. The
    // last round still counts: a theme with nine of ten spent has one left to play.
    expect(card('Internet', 1, false, 10).button.className).toContain('Waiting');
    expect(card('Internet', 1, false, 10).button.className).toContain('SpentOut');
    expect(card('Internet', 1, false, 9).button.className).not.toContain('SpentOut');
    // One round left is still a round: it is an ordinary card, on the turn and pressable.
    expect(card('Internet', 1, false, 9).button.className).not.toContain('Waiting');
  });

  it('is muted and refused even when the turn is this playerРІР‚в„ўs', () => {
    // The turn says whose card to press, not whether the theme has anything left to give.
    expect(card('Internet', 1, false, 10, 10).button.className).toContain('SpentOut');
    expect(card('Internet', 1, false, 10, 10).button.getAttribute('aria-disabled')).toBe(
      'true'
    );
  });

  it('takes no press, so the room cannot play a theme it has finished', () => {
    const picked: ThemeId[] = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(
        <ThemeCard
          theme="Nature"
          name="Р СџРЎР‚Р С‘РЎР‚Р С•Р Т‘Р В°"
          spent={10}
          onPick={(t) => picked.push(t)}
        />,
        container
      );
    });
    const button = container.querySelector('button');
    if (button === null) {
      throw new Error('no card rendered');
    }
    act(() => {
      button.click();
    });
    expect(picked).toEqual([]);
  });
});

describe("the card the room's own roll is on", () => {
  it('is drawn the way a pointer on it would draw it, since that is what the roll is', () => {
    const swept = document.createElement('div');
    document.body.appendChild(swept);
    act(() => {
      render(<ThemeCard theme="Nature" name="Р СџРЎР‚Р С‘РЎР‚Р С•Р Т‘Р В°" swept />, swept);
    });
    expect(swept.querySelector('button')?.className).toContain('Swept');
  });

  it('takes no press, since the room is the seat choosing here rather than this one', () => {
    const picked: ThemeId[] = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(
        <ThemeCard
          theme="Nature"
          name="Р СџРЎР‚Р С‘РЎР‚Р С•Р Т‘Р В°"
          swept
          onPick={(t) => picked.push(t)}
        />,
        container
      );
    });
    const button = container.querySelector('button');
    if (button === null) {
      throw new Error('no card rendered');
    }
    act(() => {
      button.click();
    });
    expect(picked).toEqual([]);
  });
});

describe('a card the round has enchanted', () => {
  it('wears the glint, and a card left alone does not', () => {
    // The round enchants some of the bank or none of it, so a card with nothing on it has to
    // read as plain rather than as a finish too faint to see. Nothing is rendered at all when
    // there is no modifier, rather than a node left transparent over every card.
    const shine = document.createElement('div');
    document.body.appendChild(shine);
    act(() => {
      render(
        <ThemeCard theme="Р вЂўР Т‘Р В°" name="Р вЂўР Т‘Р В°" modifiers={['Enchanted']} />,
        shine
      );
    });
    expect(shine.querySelector('[class*="Glint"]')).not.toBeNull();
    expect(card().container.querySelector('[class*="Glint"]')).toBeNull();
  });

  it('hides the glint, since a shine is not part of the card being read', () => {
    // The name is the only thing announced on a theme card, and a second hidden tile that is
    // not announced either is still a node read out of the DOM by anything walking it.
    const shine = document.createElement('div');
    document.body.appendChild(shine);
    act(() => {
      render(
        <ThemeCard theme="Р вЂўР Т‘Р В°" name="Р вЂўР Т‘Р В°" modifiers={['Enchanted']} />,
        shine
      );
    });
    const glint = shine.querySelector('[class*="Glint"]');
    expect(glint?.getAttribute('aria-hidden')).toBe('true');
    expect(glint?.textContent).toBe('');
  });

  it('is still the same card underneath, since nothing about it changed', () => {
    // The enchantment is a finish over the surface and not a different surface: it takes no
    // class of its own, so a bank reads as six cards with some of them shining.
    const classes = (props: { modifiers?: readonly 'Enchanted'[] }) => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      act(() => {
        render(<ThemeCard theme="Р вЂўР Т‘Р В°" name="Р вЂўР Т‘Р В°" {...props} />, host);
      });
      return host.querySelector('button')?.className;
    };
    expect(classes({ modifiers: ['Enchanted'] })).toBe(classes({}));
  });
});

describe("the card's number", () => {
  it('shows where the card sits in the bank, counted from one', () => {
    // The six in front of a player are numbered one to six whatever they are; a number out
    // of the catalogue would read as a fact about the theme the room has not agreed on.
    expect(card('Internet', 1).mark?.textContent).toBe('1');
    expect(card('Nature', 6).mark?.textContent).toBe('6');
  });

  it('draws one figure, not a sentence of them', () => {
    // A single number is the panel's substance; anything more behind the name competes with
    // it, and the name is what the card is for.
    expect(card().mark?.textContent?.length).toBe(1);
  });

  it('is a single text node, so the browser is not laying out a hundred boxes', () => {
    expect(card().mark?.children).toHaveLength(0);
  });
});
