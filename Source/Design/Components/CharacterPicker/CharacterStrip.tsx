import { CharacterColor, CharacterId, CharacterIds } from '@/Core';
import { ComponentChildren, RefObject } from 'preact';
import { useRef } from 'preact/hooks';
import { Character } from '../Character';
import { useCenterCharacter } from './UseCenterCharacter';
import { DragScroll, useDragScroll } from './UseDragScroll';
import styles from './CharacterPicker.module.css';

export interface CharacterStripProps {
  character: CharacterId;
  color: CharacterColor;
  /** Names for the character buttons. */
  labels: Readonly<Record<CharacterId, string>>;
  /** Accessible label for a button that picks a character. */
  describe: (name: string) => string;
  pulse: number;
  onPick: (character: CharacterId) => void;
}

/**
 * Every character in one scrolling row.
 *
 * The chosen one sits in the middle at full strength and the rest fade back, so
 * the row answers "who am I" without a separate preview and the neighbours show
 * what stepping sideways would give. The row scrolls to the chosen character
 * whenever it changes, which is also what keeps a click that picked a
 * neighbouring character honest: the one you clicked arrives in the middle.
 */
export function CharacterStrip({
  character,
  color,
  labels,
  describe,
  pulse,
  onPick,
}: CharacterStripProps) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(track);
  useCenterCharacter(track, character);

  return (
    <CharacterTrack track={track} drag={drag}>
      {CharacterIds.map((id, index) => (
        <CharacterCell
          key={id}
          id={id}
          index={index}
          color={color}
          chosen={id === character}
          pulse={id === character ? pulse : undefined}
          label={describe(labels[id])}
          onPick={onPick}
          suppressClick={drag.suppressClick}
        />
      ))}
    </CharacterTrack>
  );
}

interface CharacterTrackProps {
  track: RefObject<HTMLDivElement>;
  drag: DragScroll;
  children: ComponentChildren;
}

/**
 * The scroller the characters sit in.
 *
 * Split out so the strip reads as a list of characters and the gestures read as
 * one thing. While the row is being dragged it stops snapping, because snapping
 * under the pointer fights the drag rather than helping it.
 */
function CharacterTrack({ track, drag, children }: CharacterTrackProps) {
  const classes = drag.dragging
    ? `${styles.Characters} ${styles.CharactersDragging}`
    : styles.Characters;

  return (
    <div
      class={classes}
      ref={track}
      role="group"
      onPointerDown={drag.onPointerDown}
      onPointerUp={drag.onPointerUp}
    >
      {children}
    </div>
  );
}

interface CharacterCellProps {
  id: CharacterId;
  index: number;
  color: CharacterColor;
  chosen: boolean;
  pulse: number | undefined;
  label: string;
  onPick: (character: CharacterId) => void;
  /** True when this click came out of a drag and must not choose anything. */
  suppressClick: () => boolean;
}

/** One character in the row, at full strength when it is the chosen one. */
function CharacterCell({
  id,
  index,
  color,
  chosen,
  pulse,
  label,
  onPick,
  suppressClick,
}: CharacterCellProps) {
  const classes = chosen
    ? `${styles.Character} ${styles.CharacterChosen}`
    : styles.Character;

  const pick = () => {
    if (!suppressClick()) {
      onPick(id);
    }
  };

  return (
    <button
      type="button"
      data-character={id}
      class={classes}
      onClick={pick}
      aria-pressed={chosen}
      aria-label={label}
    >
      <Character
        character={id}
        color={color}
        size="Fill"
        index={index}
        pulse={pulse}
      />
    </button>
  );
}
