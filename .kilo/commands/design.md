# Design System Usage Guide

This document describes how to create designs using the Unorthodox design system.

## Core Principles

1. **No Magic Numbers**: All values must come from design tokens in `Source/Design/Tokens.css`.
2. **No Inline Styles**: Styles must be defined in CSS modules, never in JSX `style` props.
3. **No Direct className Props**: Components must accept variant/size props and map them to internal class names.
4. **Strict Typing**: No `any` type, no type assertions (`as`), use proper TypeScript interfaces.
5. **Module Boundaries**: Import only through module indices (`@/Design/Primitives`, `@/Design/Components`), never subdirectories.
6. **Encapsulation**: Each component lives in its own folder with TSX, CSS module, Gallery, and index.ts.

## Design Tokens

All design decisions are derived from tokens in `Source/Design/Tokens.css`:

- **Colors**: `--Color-*` (primitive and semantic)
- **Spacing**: `--Space-*` (Xs, Sm, Md, Lg, Xl)
- **Radius**: `--Radius-*` (None, Sm, Md, Lg, Full)
- **Typography**: 
  - Font families: `--FontFamily-Body`, `--FontFamily-Display`, `--FontFamily-Mono`
  - Sizes: `--FontSize-*` (H1, H2, H3, Body, Caption, Mono)
- **Duration**: `--Duration-*` (Fast, Medium, Slow)
- **Easing**: `--Easing-*` (Linear, EaseIn, EaseOut, EaseInOut)

## Creating a New Component

### 1. Primitive Components (in `Source/Design/Primitives`)

Primitives are the lowest-level UI elements (Box, Stack, Text, Spacer).

**File Structure**:
```
Source/Design/Primitives/
  ComponentName/
    ComponentName.tsx
    ComponentName.module.css
    ComponentName.Gallery.tsx
    index.ts
```

**Example: Button Primitive** (`Source/Design/Primitives/Button/Button.tsx`):
```tsx
import { ComponentChildren } from "preact";
import styles from "./Button.module.css";

export type ButtonVariant = "Primary" | "Secondary" | "Ghost";
export type ButtonSize = "Small" | "Medium" | "Large";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children?: ComponentChildren;
}

export function Button({
  variant = "Primary",
  size = "Medium",
  disabled = false,
  loading = false,
  onClick,
  children,
}: ButtonProps) {
  const classes = `${styles.Root} ${styles[`Variant${variant}`]} ${styles[`Size${size}`]}`;
  return (
    <button
      class={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? "..." : children}
    </button>
  );
}
```

**CSS Module** (`Button.module.css`):
```css
.Root {
  /* Base styles from tokens */
  font-family: var(--FontFamily-Body);
  border-radius: var(--Radius-Md);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--Space-Sm) var(--Space-Md);
  font-size: var(--FontSize-Body);
  transition: background-color var(--Duration-Medium) var(--Easing-EaseInOut);
}

/* Variants */
.VariantPrimary {
  background-color: var(--Color-Primary-Default);
  color: var(--Color-Text-OnPrimary);
}
.VariantPrimary:hover:not(:disabled) {
  background-color: var(--Color-Primary-Hover);
}
.VariantSecondary {
  background-color: var(--Color-Secondary-Default);
  color: var(--Color-Text-OnSecondary);
}
.VariantGhost {
  background-color: transparent;
  color: var(--Color-Text-Default);
  border: 1px solid var(--Color-Border-Default);
}

/* Sizes */
.SizeSmall { padding: var(--Space-Xs) var(--Space-Sm); font-size: var(--FontSize-Caption); }
.SizeMedium { padding: var(--Space-Sm) var(--Space-Md); font-size: var(--FontSize-Body); }
.SizeLarge { padding: var(--Space-Md) var(--Space-Lg); font-size: var(--FontSize-Body); }

/* Disabled */
.VariantPrimary:disabled,
.VariantSecondary:disabled,
.VariantGhost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Gallery** (`Button.Gallery.tsx`):
```tsx
import { Button } from "./Button";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function ButtonGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Button Variants</Text>
      <Stack direction="Horizontal" gap="Sm">
        <Button variant="Primary" onClick={() => {}}>Primary</Button>
        <Button variant="Secondary" onClick={() => {}}>Secondary</Button>
        <Button variant="Ghost" onClick={() => {}}>Ghost</Button>
      </Stack>
      {/* ...sizes and states... */}
    </Stack>
  );
}
```

**Index** (`Button/index.ts`):
```ts
export * from "./Button";
```

### 2. Component Components (in `Source/Design/Components`)

Components are higher-level, domain-specific UI elements (Card, PlayerChip, etc.).

Follow the same structure as primitives, but they may compose primitives and other components.

**Example: Card Component** (`Source/Design/Components/Card/Card.tsx`):
```tsx
import { ComponentChildren } from "preact";
import { Box } from "@/Design/Primitives";
import styles from "./Card.module.css";

export type CardVariant = "Elevated" | "Outlined";

export interface CardProps {
  variant?: CardVariant;
  children?: ComponentChildren;
}

export function Card({ variant = "Elevated", children }: CardProps) {
  return (
    <Box
      padding="Md"
      variant={variant} // Assuming Box supports variant via class mapping
    >
      {children}
    </Box>
  );
}
```

Note: In practice, Card might directly apply styles or use Box with appropriate props.

### 3. Component Composition

- Use primitives (`Box`, `Stack`, `Text`, `Spacer`) as building blocks.
- Import primitives via `@/Design/Primitives`.
- Import other components via `@/Design/Components`.
- Never import from subdirectories (e.g., `@/Design/Primitives/Button` is forbidden).

### 4. Styling Rules

- All styling must be in `.module.css` files.
- Reference tokens using `var(--token-name)`.
- Never use hardcoded values for colors, spacing, radii, etc.
- For component variations, create modifier classes (e.g., `.VariantPrimary`).

### 5. Type Safety

- Define explicit TypeScript interfaces for props.
- Use `ComponentChildren` from "preact" for children props.
- Avoid `any` and type assertions.
- Use proper event typing (e.g., `event.currentTarget.value` instead of `e.target as HTMLInputElement`).

### 6. Gallery Requirements

- Every component must have a `.Gallery.tsx` file.
- Galleries showcase all variants, sizes, and states.
- Galleries are imported via `import.meta.glob` in `Source/Dev/ComponentGallery/GalleryPage.tsx`.
- Galleries must use the component's public API only.

### 7. Module Exports

- Each component folder must have an `index.ts` that exports the component.
- The top-level `Source/Design/Primitives/index.ts` and `Source/Design/Components/index.ts` export all primitives/components.
- This allows imports like `import { Button } from "@/Design/Primitives"`.

## Validation

After creating or modifying components, run:

```bash
npm run lint        # ESLint checks
npx tsc --noEmit    # TypeScript type check
npm run build       # Vite build
```

All must pass with zero errors/warnings.

## Example Workflow

1. Create folder: `Source/Design/Components/NewComponent`
2. Add `NewComponent.tsx`, `NewComponent.module.css`, `NewComponent.Gallery.tsx`, `index.ts`
3. Implement component using tokens and primitives
4. Add gallery showcasing all variants
5. Run validation commands
6. If successful, component is ready for use

## Important Notes

- The design system is immutable; never modify tokens directly for one-off values.
- If you need a new token, add it to `Tokens.css` following the existing pattern.
- Always prefer composition over creating new low-level primitives.
- Keep components focused and reusable.
