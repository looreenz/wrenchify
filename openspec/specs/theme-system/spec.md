# Theme System Specification

## Purpose

CSS variable-based design token system with Naive UI integration. Provides the visual foundation for the beta_industrial theme — dark mode default, high contrast, industrial brutalism aesthetic optimized for workshop environments.

## Requirements

### Requirement: Color Token System (TS-001)

The system MUST expose all colors from DESIGN.md as CSS custom properties on `:root`. Token names MUST follow the pattern `--bi-{color-name}`.

| Token | Value | Usage |
|-------|-------|-------|
| `--bi-surface` | `#0b1326` | Page background |
| `--bi-surface-container` | `#171f33` | Card/panel backgrounds |
| `--bi-surface-container-high` | `#222a3d` | Elevated containers |
| `--bi-on-surface` | `#dae2fd` | Primary text |
| `--bi-primary` | `#ffb693` | Primary actions |
| `--bi-primary-container` | `#ff6b00` | Beta Orange — CTAs |
| `--bi-on-primary` | `#561f00` | Text on primary |
| `--bi-error` | `#ffb4ab` | Error states |
| `--bi-outline` | `#a98a7d` | Borders |
| `--bi-hazard-yellow` | `#FDE047` | Warning indicators |

All 51 colors from DESIGN.md MUST be mapped. Semantic aliases (`--bi-bg`, `--bi-text`, `--bi-border`) MUST reference base tokens.

#### Scenario: Token availability

- GIVEN the app loads `theme.css`
- WHEN any component references `var(--bi-primary-container)`
- THEN it resolves to `#ff6b00`

#### Scenario: Semantic alias consistency

- GIVEN `--bi-bg` is aliased to `--bi-surface`
- WHEN `--bi-surface` changes value
- THEN `--bi-bg` reflects the same change

### Requirement: Typography Token System (TS-002)

The system MUST define typography tokens using **system font stacks only**. No external font loading.

| Token | Stack |
|-------|-------|
| `--bi-font-sans` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` |
| `--bi-font-mono` | `ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', monospace` |

Size/weight/line-height tokens MUST match DESIGN.md values:

| Token | Size | Weight | Line-height |
|-------|------|--------|-------------|
| `--bi-display-lg` | 48px | 700 | 56px |
| `--bi-headline-lg` | 32px | 700 | 40px |
| `--bi-headline-md` | 24px | 600 | 32px |
| `--bi-body-lg` | 18px | 400 | 28px |
| `--bi-body-md` | 16px | 400 | 24px |
| `--bi-label-bold` | 14px | 700 | 20px |
| `--bi-data-mono` | 14px | 400 | 20px |

#### Scenario: Sans-serif text rendering

- GIVEN a heading uses `font-family: var(--bi-font-sans)`
- WHEN rendered on macOS
- THEN it renders in SF Pro (via `-apple-system`)

#### Scenario: Monospace data alignment

- GIVEN a data column uses `font-family: var(--bi-font-mono)`
- WHEN displaying numeric values "1234" and "5678"
- THEN digits align vertically (monospaced rendering)

### Requirement: Spacing Token System (TS-003)

The system MUST define spacing tokens on an 8px grid.

| Token | Value | Usage |
|-------|-------|-------|
| `--bi-space-1` | 8px | Tight gaps |
| `--bi-space-2` | 16px | Default gaps |
| `--bi-space-3` | 24px | Gutters |
| `--bi-space-5` | 40px | Desktop margins |
| `--bi-touch-target` | 52px | Minimum touch/click target |

All interactive elements MUST have a minimum hit area of `var(--bi-touch-target)`.

#### Scenario: Touch target compliance

- GIVEN any button or interactive element
- WHEN measured for hit area
- THEN height is ≥ 52px

### Requirement: Border and Radius Tokens (TS-004)

The system MUST define border and radius tokens matching DESIGN.md.

| Token | Value |
|-------|-------|
| `--bi-radius-sm` | 0.125rem |
| `--bi-radius` | 0.25rem |
| `--bi-radius-md` | 0.375rem |
| `--bi-radius-lg` | 0.5rem |
| `--bi-border-thin` | 1px solid var(--bi-outline) |
| `--bi-border-active` | 2px solid var(--bi-primary-container) |

#### Scenario: Container border rendering

- GIVEN an industrial card uses `var(--bi-border-thin)`
- WHEN rendered
- THEN it shows a 1px border using the outline color

### Requirement: Naive UI Theme Integration (TS-005)

The system MUST provide a Naive UI theme override object that maps beta_industrial tokens to Naive UI's `GlobalThemeOverrides`. The theme MUST be applied via `n-config-provider` wrapping the root component.

#### Scenario: Naive UI button theming

- GIVEN the theme provider wraps the app
- WHEN an `n-button` with `type="primary"` renders
- THEN its background uses `--bi-primary-container` (#ff6b00)

#### Scenario: Naive UI input theming

- GIVEN an `n-input` renders
- WHEN it receives focus
- THEN its border changes to `var(--bi-border-active)`

### Requirement: View Migration Contract (TS-006)

All views MUST replace hardcoded color values with CSS variable references. After migration, zero hardcoded hex colors SHALL exist in view or layout files (excluding `theme.css` and token files).

#### Scenario: Zero hardcoded colors audit

- GIVEN all views have been migrated
- WHEN searching `src/renderer/views/` and `src/renderer/layouts/` for hex color patterns
- THEN zero matches are found

#### Scenario: Dark mode default

- GIVEN the app launches
- WHEN no theme preference is stored
- THEN the UI renders with charcoal backgrounds (`--bi-surface: #0b1326`) and light text (`--bi-on-surface: #dae2fd`)

## Constraints

- System fonts only — no `@fontsource` packages, no `@font-face` declarations
- CSS custom properties only — no CSS-in-JS, no Tailwind
- Dark mode is the only theme (light theme deferred)
- Token files are the single source of truth for design values

## Dependencies

- Naive UI `n-config-provider` API for theme overrides
- DESIGN.md as the authoritative token reference
