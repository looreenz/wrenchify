# Beta Industrial Theme Usage Guide

This guide explains how to use and extend the Beta Industrial design system in Wrenchify.

## Overview

Beta Industrial is a dark-mode-first design system optimized for workshop environments. It combines:

- A tokenized CSS variable architecture
- Naive UI `GlobalThemeOverrides` for component internals
- Three custom industrial components: `StatusLamp`, `IndustrialCard`, and `HazardButton`

## Token Files

All design tokens are CSS custom properties loaded globally via `src/renderer/styles/theme.css`.

| File | Purpose |
|------|---------|
| `styles/tokens/colors.css` | 51 color tokens + semantic aliases (`--bi-bg`, `--bi-text`, `--bi-border`) |
| `styles/tokens/typography.css` | System font stacks and typography tokens |
| `styles/tokens/spacing.css` | 8px grid spacing and 52px touch target |
| `styles/tokens/borders.css` | Border radius and border shorthand tokens |

## Color Tokens

Use semantic aliases for common cases:

```css
.my-component {
  background-color: var(--bi-bg);
  color: var(--bi-text);
  border: var(--bi-border-thin);
}
```

Use specific tokens for status, branding, or surface hierarchy:

```css
.my-card {
  background-color: var(--bi-surface-container);
  border: 1px solid var(--bi-outline-variant);
}

.my-success-text {
  color: var(--bi-success);
}
```

## Typography Tokens

All text uses system fonts only. No external font files are loaded.

```css
.headline {
  font: var(--bi-headline-md);
}

.data-point {
  font: var(--bi-data-mono);
}

.label {
  font: var(--bi-label-bold);
  letter-spacing: var(--bi-label-bold-letter-spacing);
  text-transform: uppercase;
}
```

## Spacing Tokens

Spacing is based on an 8px grid:

```css
.card {
  padding: var(--bi-space-3);   /* 24px */
  gap: var(--bi-space-2);       /* 16px */
}

.button {
  min-height: var(--bi-touch-target); /* 52px */
}
```

## Border Tokens

```css
.panel {
  border-radius: var(--bi-radius-lg);
  border: var(--bi-border-thin);
}

.input:focus {
  outline: var(--bi-border-active);
}
```

## Naive UI Integration

Naive UI component internals are themed through `src/renderer/theme/betaIndustrial.ts` and applied in `App.vue` via `n-config-provider`. Most components will pick up the correct colors automatically.

When writing scoped styles, prefer CSS variables over Naive UI theme classes for values that the override object does not expose.

## Custom Components

### StatusLamp

A glowing status indicator. Always pair with a text label.

```vue
<StatusLamp
  color="var(--bi-success)"
  size="sm"
  label="Paid"
  :pulse="true"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | required | CSS color or variable used for the lamp and glow |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Lamp diameter |
| `label` | `string` | `undefined` | Text label rendered next to the lamp |
| `pulse` | `boolean` | `false` | Enables a pulsing animation |

### IndustrialCard

A bordered container with a mono uppercase header separated by a 1px rule.

```vue
<IndustrialCard title="Work Order">
  <template #header-actions>
    <n-button size="small" type="primary">Add</n-button>
  </template>
  <p>Card body content</p>
</IndustrialCard>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Header title rendered in mono uppercase |
| `noBorder` | `boolean` | `false` | Removes the outer border |

**Slots:**

- `default` — card body
- `title` — overrides the `title` prop
- `header-actions` — actions rendered in the header

### HazardButton

Destructive action button with a yellow/black diagonal striped hover pattern.

```vue
<HazardButton size="small" @click="handleDelete">
  Delete
</HazardButton>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `disabled` | `boolean` | `false` | Disables the button at 50% opacity |

## Migration Rules

When creating or updating views:

1. **No hardcoded hex or rgba values** in `src/renderer/views/`, `src/renderer/layouts/`, or `src/renderer/components/` (except `styles/tokens/colors.css`).
2. Use `var(--bi-*)` tokens for colors, spacing, typography, and borders.
3. Keep styles in `<style scoped>` blocks.
4. Use `IndustrialCard` for grouped content with a header.
5. Use `StatusLamp` for status indicators.
6. Use `HazardButton` for irreversible destructive actions.
7. Keep interactive elements at least 52px tall.

## Hardcoded Color Audit

Run the audit with:

```bash
grep -rE '#[0-9a-fA-F]{3,8}|rgba?\s*\(' src/renderer/views/ src/renderer/layouts/ src/renderer/components/
```

The only valid matches should be inside `src/renderer/styles/tokens/colors.css`.

## Adding New Tokens

If a new token is needed:

1. Add it to the appropriate file in `src/renderer/styles/tokens/`.
2. Update `src/renderer/theme/betaIndustrial.ts` if Naive UI components need to consume it.
3. Document it in this guide.
4. Prefer reusing existing tokens before creating new ones.
