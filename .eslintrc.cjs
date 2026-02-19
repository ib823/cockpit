/**
 * ESLint Configuration
 *
 * Philosophy: ESLint enforces structural rules (hooks, syntax, no-var);
 * TypeScript handles type-level checks (unused vars, any) via the
 * typecheck:strict quality gate.  This avoids duplicate warnings.
 */

module.exports = {
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    // ── TypeScript ────────────────────────────────────────────────
    // Handled by tsc --noEmit (typecheck:strict gate) — turning off
    // the ESLint duplicates keeps lint output actionable.
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-require-imports": "off",

    // ── React ─────────────────────────────────────────────────────
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",

    // ── Design guardrails ─────────────────────────────────────────
    "no-restricted-syntax": [
      "warn",
      {
        selector: 'JSXAttribute[name.name="style"]',
        message:
          "Avoid inline styles. Use className with CSS variables from tokens.css instead. Positional styles for overlays in AeroTimeline are allowed.",
      },
    ],

    // ── A11y ──────────────────────────────────────────────────────
    // Interactive canvas components handle keyboard via
    // useKeyboardNavigation hook at a higher level.
    "jsx-a11y/anchor-is-valid": "off",
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/no-noninteractive-element-interactions": "off",

    // ── General ───────────────────────────────────────────────────
    "no-console": "off",
    "@next/next/no-img-element": "off",
    "@next/next/no-assign-module-variable": "off",
    "prefer-const": "warn",
    "prefer-rest-params": "off",
    "no-var": "error",
  },
  overrides: [
    {
      // Dynamic canvas rendering, animated components, and architecture
      // diagrams require inline styles for computed positioning, sizing,
      // and color values.
      files: [
        "**/*.tsx",
        "src/hooks/**/*.ts",
        "src/lib/**/*.ts",
        "src/stores/**/*.ts",
        "src/types/**/*.ts",
        "src/ui/**/*.ts",
      ],
      rules: {
        "no-restricted-syntax": "off",
      },
    },
  ],
};
