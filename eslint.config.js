import js from "@eslint/js";
import tseslint from "typescript-eslint";
import checkFile from "eslint-plugin-check-file";
import prettier from "eslint-config-prettier";
import { commentPlugin } from "./Scripts/CommentRules.js";

// Agent Manager worktrees hold their own tsconfig inside the repo, so the
// default "walk up from cwd" root is ambiguous and every file fails to parse.
const rootDir = import.meta.dirname;

const deepImport = {
  regex: "^@/(?!Design/(Primitives|Components)$)[^/]+/.+",
  message:
    "Import through the module index: '@/Module'. For the design system, only '@/Design/Primitives' and '@/Design/Components' are allowed.",
};
const trysteroBan = {
  group: ["trystero", "trystero/*"],
  message: "Trystero is allowed only in Source/Network.",
};
const ban = (...modules) => ({
  group: modules.flatMap((m) => [`@/${m}`, `@/${m}/**`]),
  message: `This layer cannot import: ${modules.join(", ")}.`,
});
const layer = (folder, banned, { allowTrystero = false } = {}) => ({
  files: [`Source/${folder}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      { patterns: [deepImport, ban(...banned), ...(allowTrystero ? [] : [trysteroBan])] },
    ],
  },
});

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".kilo", "Source/Design/Tokens/Tokens.css"] },
  { languageOptions: { parserOptions: { tsconfigRootDir: rootDir } } },
  // The tooling under Scripts/ is Node, not browser code, so it gets the Node globals and keeps
  // the same no-console rule the rest of the tree has.
  {
    files: ["Scripts/**/*.{js,mjs}"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
    rules: { "no-console": "off" },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // General rules for Source/ only
  {
    files: ["Source/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile, comments: commentPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "no-console": "error",
      "max-lines": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 40, skipBlankLines: true, skipComments: true }],
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: "Only named exports." },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: "variable", format: ["camelCase", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "function", format: ["camelCase"] },
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "objectLiteralProperty", modifiers: ["requiresQuotes"], format: null },
        { selector: "objectLiteralProperty", format: ["camelCase", "PascalCase"] },
      ],
      "check-file/filename-naming-convention": [
        "error",
        { "Source/**/*.{ts,tsx}": "PASCAL_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": ["error", { "Source/**/": "PASCAL_CASE" }],
      "comments/max-lines": "error",
      "comments/no-trailing": "error",
      "comments/no-block-in-ts": "error",
      "comments/form": "error",
      "comments/shape": "error",
      "comments/no-split": "error",
    },
  },

  // Tests keep room for prose: an expectation table with a note per row is the clearest form.
  // The one-style rule stays, because a second dialect is what the rule exists to prevent.
  {
    files: ["Source/**/*.test.{ts,tsx}"],
    rules: {
      "comments/max-lines": "off",
    },
  },

  // In .tsx components — functions in PascalCase
  {
    files: ["Source/**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: "variable", format: ["camelCase", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "objectLiteralProperty", modifiers: ["requiresQuotes"], format: null },
        { selector: "objectLiteralProperty", format: ["camelCase", "PascalCase"] },
      ],
    },
  },

  // Exceptions for file names
  {
    files: ["Source/**/index.ts", "Source/App/main.tsx"],
    rules: { "check-file/filename-naming-convention": "off" },
  },

  // Module boundaries
  layer("Core", ["Content", "Game", "Network", "Design", "Screens", "App"]),
  layer("Content", ["Game", "Network", "Design", "Screens", "App"]),
  layer("Game", ["Content", "Network", "Design", "Screens", "App"]),
  layer("Network", ["Content", "Design", "Screens", "App"], { allowTrystero: true }),
  layer("Design", ["Content", "Game", "Network", "Screens", "App"]),
  layer("Screens", ["Network", "App"]),
  layer("Dev", ["Network"]),

  // Game — pure logic
  {
    files: ["Source/Game/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error", "window", "document", "localStorage", "setTimeout", "setInterval", "performance",
      ],
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: "Pass time as an argument." },
        { object: "Math", property: "random", message: "Pass randomness as an argument." },
      ],
    },
  },
);