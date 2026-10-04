export type PlayerId = string;
export type GroupId = string;

export type Result<T> =
  { success: true; value: T } | { success: false; error: string };

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export type Topic = string;

/**
 * Every piece of UI text, so no screen carries a string literal of its own.
 *
 * The sections with no copy yet are typed as `Record<string, never>`, which is what forces a
 * screen asking for one to be a compile error rather than an empty label at runtime. Adding a
 * section means adding it here first.
 */
export interface Strings {
  lobby: {
    startButton: string;
  };
  writing: {
    timeUp: string;
  };
  reviewing: Record<string, never>;
  scores: Record<string, never>;
  final: Record<string, never>;
}

export type Topics = Topic[];
