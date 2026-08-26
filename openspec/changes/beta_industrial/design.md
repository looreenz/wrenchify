# Design: Beta Industrial Theme Implementation

## Technical Approach

Single-pass CSS variable token system layered over Naive UI's `darkTheme` with custom overrides. No external fonts, no Tailwind, no CSS-in-JS. The token files define the visual vocabulary; `n-config-provider` propagates it into every Naive UI component. Views are migrated incrementally by replacing hardcoded hex values with `var(--bi-*)` references.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Token file organization | Single file vs. per-category files | Per-category (`colors.css`, `typography.css`, `spacing.css`, `borders.css`) | Easier to locate and modify tokens; matches DESIGN.md structure |
| CSS variable naming | BEM (`--bi-color-primary`) vs. flat (`--bi-primary`) | Flat namespace `--bi-{name}` | Matches spec TS-001; shorter references; no ambiguity with only ~55 tokens |
| Naive UI base theme | Light + overrides vs. `darkTheme` + overrides | `darkTheme` as base | Dark mode is the only theme; `darkTheme` provides correct dark defaults for all 40+ Naive UI components we'd otherwise override manually |
| Theme injection | CSS-only vs. composable + `n-config-provider` | Composable returning theme object, applied in App.vue | Naive UI components ignore CSS variables for internal styling (e.g., NDataTable stripes, NInput focus); must use `themeOverrides` for those |
| Custom component location | `components/industrial/` vs. flat `components/` | `components/industrial/` subdirectory | Separates theme-specific components from existing `LineItemsEditor.vue`; clear ownership |
| Scoped vs. global styles in views | Keep scoped vs. move to global | Keep `<style scoped>`, reference CSS variables | Preserves component isolation; CSS variables cascade from `:root` regardless of scoping |

## Data Flow

```
DESIGN.md (source of truth)
    │
    ├──→ tokens/colors.css ──→ :root CSS custom properties
    ├──→ tokens/typography.css ─┘
    ├──→ tokens/spacing.css ────┘
    ├──→ tokens/borders.css ────┘
    │
    └──→ theme/betaIndustrial.ts ──→ GlobalThemeOverrides object
                                        │
    App.vue ──→ n-config-provider(:theme="darkTheme", :theme-overrides) ──→ All Naive UI components
              ──→ import 'styles/theme.css' ──→ :root variables available to all views
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/renderer/styles/tokens/colors.css` | Create | 51 color tokens + semantic aliases (`--bi-bg`, `--bi-text`, `--bi-border`) |
| `src/renderer/styles/tokens/typography.css` | Create | Font stacks, 7 size/weight/line-height tokens |
| `src/renderer/styles/tokens/spacing.css` | Create | 8px grid tokens + touch target |
| `src/renderer/styles/tokens/borders.css` | Create | Radius + border tokens |
| `src/renderer/styles/theme.css` | Create | Barrel import of all token files |
| `src/renderer/theme/betaIndustrial.ts` | Create | `GlobalThemeOverrides` object mapping CSS var values to Naive UI tokens |
| `src/renderer/composables/useTheme.ts` | Create | Returns `{ theme, themeOverrides }` for `n-config-provider` |
| `src/renderer/components/industrial/StatusLamp.vue` | Create | Glowing status indicator |
| `src/renderer/components/industrial/IndustrialCard.vue` | Create | Card with mono header + 1px rule |
| `src/renderer/components/industrial/HazardButton.vue` | Create | Destructive action button with striped hover |
| `src/renderer/App.vue` | Modify | Wrap `<router-view>` in `<n-config-provider>`, import `theme.css`, replace body hardcoded colors |
| `src/renderer/index.ts` | Modify | Import `theme.css` (global styles entry point) |
| `src/renderer/layouts/MainLayout.vue` | Modify | Replace hardcoded colors, swap logo to dark-theme variant |
| `src/renderer/views/customers/CustomerList.vue` | Modify | Replace `#fff` table bg, hardcoded spacing with tokens |
| `src/renderer/views/customers/CustomerForm.vue` | Modify | Replace `#fff` form bg, `8px` radius with tokens |
| `src/renderer/views/vehicles/VehicleList.vue` | Modify | Same pattern as CustomerList |
| `src/renderer/views/vehicles/VehicleForm.vue` | Modify | Same pattern as CustomerForm |
| `src/renderer/views/vehicles/VehicleTimeline.vue` | Modify | Replace hardcoded colors with tokens |
| `src/renderer/views/quotes/QuoteList.vue` | Modify | Replace hardcoded colors, add StatusLamp for quote status |
| `src/renderer/views/quotes/QuoteDetail.vue` | Modify | Replace hardcoded colors with tokens |
| `src/renderer/views/quotes/QuoteForm.vue` | Modify | Replace hardcoded colors with tokens |
| `src/renderer/views/work-orders/WorkOrderList.vue` | Modify | Replace `#fff`, add StatusLamp for payment status |
| `src/renderer/views/work-orders/WorkOrderForm.vue` | Modify | Replace hardcoded colors with tokens |
| `src/renderer/views/work-orders/PaymentSection.vue` | Modify | Replace hardcoded colors with tokens |
| `src/renderer/views/settings/SettingsView.vue` | Modify | Replace hardcoded colors with tokens |
| `src/renderer/components/LineItemsEditor.vue` | Modify | Replace `#f9f9f9` row bg with `--bi-surface-container` |

## Interfaces / Contracts

### Token Structure (colors.css)

```css
:root {
  /* Surface */
  --bi-surface: #0b1326;
  --bi-surface-dim: #0b1326;
  --bi-surface-bright: #31394d;
  --bi-surface-container-lowest: #060e20;
  --bi-surface-container-low: #131b2e;
  --bi-surface-container: #171f33;
  --bi-surface-container-high: #222a3d;
  --bi-surface-container-highest: #2d3449;

  /* Primary */
  --bi-primary: #ffb693;
  --bi-primary-container: #ff6b00;
  --bi-on-primary: #561f00;
  --bi-on-primary-container: #572000;

  /* ... remaining 40+ tokens from DESIGN.md ... */

  /* Semantic aliases */
  --bi-bg: var(--bi-surface);
  --bi-text: var(--bi-on-surface);
  --bi-border: var(--bi-outline);
}
```

### Theme Provider (useTheme.ts)

```typescript
import { darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#ff6b00',
    primaryColorHover: '#ff8533',
    primaryColorPressed: '#cc5500',
    primaryColorSuppl: '#ffb693',
    errorColor: '#ffb4ab',
    warningColor: '#FDE047',
    successColor: '#4ade80',
    textColorBase: '#dae2fd',
    textColor1: '#dae2fd',       // primary text
    textColor2: '#b9c7e0',       // secondary text
    textColor3: '#a98a7d',       // disabled text
    bodyColor: '#0b1326',        // page background
    cardColor: '#171f33',        // container background
    modalColor: '#171f33',
    popoverColor: '#222a3d',
    tableColor: '#171f33',
    inputColor: '#131b2e',
    actionColor: '#222a3d',
    hoverColor: 'rgba(255, 107, 0, 0.09)',
    borderColor: '#a98a7d',
    dividerColor: '#334155',
    borderRadius: '4px',
    borderRadiusSmall: '2px',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', monospace",
    heightMedium: '52px'         // touch target
  },
  Button: {
    fontWeightStrong: '700'
  },
  DataTable: {
    thColor: '#222a3d',
    tdColor: '#171f33',
    thTextColor: '#dae2fd',
    tdTextColor: '#dae2fd',
    borderColor: '#334155',
    borderRadius: '4px'
  },
  Input: {
    color: '#131b2e',
    borderHover: '#ff6b00',
    borderFocus: '#ff6b00',
    boxShadowFocus: '0 0 0 2px rgba(255, 107, 0, 0.2)'
  },
  Menu: {
    color: '#0b1326',
    itemColorActive: '#222a3d',
    itemColorActiveHover: '#2d3449',
    itemTextColor: '#dae2fd',
    itemTextColorActive: '#ff6b00',
    itemIconColor: '#dae2fd',
    itemIconColorActive: '#ff6b00'
  }
}

export function useTheme() {
  return {
    theme: darkTheme,
    themeOverrides
  }
}
```

### StatusLamp Component

```vue
<template>
  <span class="status-lamp" :class="[`size-${size}`, { pulse }]" :style="lampStyle">
    <span v-if="label" class="lamp-label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
  pulse?: boolean
}>(), {
  size: 'md',
  pulse: false
})

const sizeMap = { sm: 8, md: 12, lg: 16 }

const lampStyle = computed(() => ({
  '--lamp-color': props.color,
  '--lamp-size': `${sizeMap[props.size]}px`,
  '--lamp-glow': `${sizeMap[props.size]}px`
}))
</script>

<style scoped>
.status-lamp {
  display: inline-flex;
  align-items: center;
  gap: var(--bi-space-1);
}

.status-lamp::before {
  content: '';
  width: var(--lamp-size);
  height: var(--lamp-size);
  border-radius: 9999px;
  background-color: var(--lamp-color);
  box-shadow: 0 0 var(--lamp-glow) var(--lamp-color);
  flex-shrink: 0;
}

.lamp-label {
  font-family: var(--bi-font-sans);
  font-size: var(--bi-data-mono-size);
  color: var(--bi-text);
}

.pulse::before {
  animation: lamp-pulse 2s ease-in-out infinite;
}

@keyframes lamp-pulse {
  0%, 100% { box-shadow: 0 0 var(--lamp-glow) var(--lamp-color); opacity: 1; }
  50% { box-shadow: 0 0 calc(var(--lamp-glow) * 2) var(--lamp-color); opacity: 0.7; }
}
</style>
```

## Migration Sequence

| Phase | What | Rationale |
|-------|------|-----------|
| 1 | Token files + `theme.css` + `useTheme.ts` | Foundation — no visual changes, just infrastructure |
| 2 | `App.vue` + `index.ts` (import theme.css, add n-config-provider) | Activates theme globally; Naive UI components switch to dark |
| 3 | `MainLayout.vue` | Sidebar is visible on every page; highest visual impact, validates theme works end-to-end |
| 4 | `CustomerList.vue` + `CustomerForm.vue` | Simplest views; establishes migration pattern for all others |
| 5 | `VehicleList.vue` + `VehicleForm.vue` + `VehicleTimeline.vue` | Same patterns as customers; adds IndustrialCard wrapping for vehicles |
| 6 | `QuoteList.vue` + `QuoteDetail.vue` + `QuoteForm.vue` | Adds StatusLamp integration for quote status |
| 7 | `WorkOrderList.vue` + `WorkOrderForm.vue` + `PaymentSection.vue` + `LineItemsEditor.vue` | Most complex; StatusLamp for payment status, mono fonts for numeric data |
| 8 | `SettingsView.vue` | Simplest view; final cleanup |
| 9 | Custom components (`StatusLamp`, `IndustrialCard`, `HazardButton`) | Built alongside phases 6-7 where they're first needed |

Each phase is independently deployable. Views not yet migrated will look inconsistent (dark Naive UI chrome + white view backgrounds) but remain functional.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Token CSS file correctness | Verify all 51 colors present in `colors.css` via snapshot test |
| Unit | `useTheme()` composable | Assert returns `darkTheme` + overrides with expected keys |
| Unit | Custom components (StatusLamp, IndustrialCard, HazardButton) | Mount with props, assert rendered classes/styles |
| Integration | `n-config-provider` wrapping | Render App.vue, verify NButton picks up primary color |
| E2E | Visual smoke test per phase | Playwright screenshot comparison after each migration phase |
| Audit | Zero hardcoded colors | `grep -rE '#[0-9a-fA-F]{3,8}' src/renderer/views/ src/renderer/layouts/` returns zero matches (excluding comments) |

## Migration / Rollout

No data migration required. This is a purely visual change.

**Rollback**: Each phase is a separate commit. Reverting the `App.vue` change (Phase 2) disables the entire theme — views fall back to their existing scoped styles. Token files and composables are inert until imported.

**Feature flag**: Not needed. The theme is applied unconditionally. If a toggle is desired later, `useTheme()` can return `null` for the theme prop to fall back to Naive UI defaults.

## Open Questions

- [ ] Dark-theme logo assets: `wrenchify-dark-theme-transparent.png` and `logo-dark-theme-transparent.png` exist in `assets/` — confirm these are production-ready or need replacement
- [ ] NDataTable striped rows: Naive UI's built-in `striped` prop may conflict with custom row hover colors — needs visual testing
- [ ] HazardButton striped hover: CSS `repeating-linear-gradient` implementation needs cross-platform verification (Electron Chromium vs. browser)
