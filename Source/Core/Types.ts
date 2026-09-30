export type PlayerId = string;
export type GroupId = string;

export type Result<T> =
  { success: true; value: T } | { success: false; error: string };

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

// Types for Content
export type Topic = string;

// We'll define the Strings interface with the known parts.
export interface Strings {
  lobby: {
    startButton: string;
  };
  writing: {
    timeUp: string;
  };
  // We'll add other sections as we learn about them.
  // Using Record<string, never> to ensure these objects have no properties
  reviewing: Record<string, never>;
  scores: Record<string, never>;
  final: Record<string, never>;
}

// We'll also define the Topics type as an array of strings.
export type Topics = Topic[];
