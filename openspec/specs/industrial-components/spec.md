# Industrial Components Specification

## Purpose

Custom UI components that embody the beta_industrial aesthetic — status lamps, industrial cards, and hazard action buttons. These components extend Naive UI's base library with workshop-specific visual patterns.

## Requirements

### Requirement: Status Lamp Component (IC-001)

The system MUST provide a `StatusLamp` component that renders a small, high-saturation circle with a CSS `box-shadow` glow effect in the same color. The lamp MUST appear to "emit light" against the dark background.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `color` | string | yes | CSS color value for the lamp |
| `size` | `'sm' \| 'md' \| 'lg'` | no | Default `'md'` (12px) |
| `label` | string | no | Text displayed next to the lamp |
| `pulse` | boolean | no | Enable pulsing animation |

Sizes: `sm` = 8px, `md` = 12px, `lg` = 16px.

The glow MUST use `box-shadow: 0 0 {size}px {color}` to create an intense, focused emission.

#### Scenario: Green status lamp

- GIVEN a work order with status "completed"
- WHEN `<StatusLamp color="#4ade80" label="Completed" />` renders
- THEN a green glowing circle appears next to "Completed" text

#### Scenario: Lamp without label

- GIVEN `<StatusLamp color="#ff6b00" />` renders
- WHEN no label prop is provided
- THEN only the glowing circle is rendered (no text)

#### Scenario: Pulsing lamp for active states

- GIVEN `<StatusLamp color="#FDE047" pulse />` renders
- WHEN the pulse prop is true
- THEN the glow intensity oscillates via CSS animation

### Requirement: Industrial Card Component (IC-002)

The system MUST provide an `IndustrialCard` component with a distinct header section separated by a 1px horizontal rule. The header MUST use monospace font (`var(--bi-font-mono)`) to evoke stamped metal plates.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | yes | Header text (rendered in mono, uppercase) |
| `subtitle` | string | no | Secondary header text |

The card MUST have:
- Background: `var(--bi-surface-container)`
- Border: `var(--bi-border-thin)`
- Radius: `var(--bi-radius-lg)` (0.5rem)
- Header text: `var(--bi-font-mono)`, `var(--bi-label-bold)` weight, uppercase transform
- Content area: default slot, no font restrictions

#### Scenario: Card with header separation

- GIVEN `<IndustrialCard title="VEHICLE SPECS">` with body content
- WHEN rendered
- THEN the title appears in monospace uppercase, separated from body by a 1px rule

#### Scenario: Card in dark context

- GIVEN the card renders on `--bi-surface` background
- WHEN inspected
- THEN the card background is `--bi-surface-container` (visibly lighter than page)

### Requirement: Hazard Action Button (IC-003)

The system MUST provide a `HazardButton` component for irreversible/destructive actions. On hover, the button MUST display a diagonal striped "hazard" pattern (yellow/black) to signal danger.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | string | yes | Button text |
| `disabled` | boolean | no | Disable interaction |

Default state: `--bi-error` background with `--bi-on-error` text.
Hover state: diagonal striped pattern using `--bi-hazard-yellow` and `--bi-charcoal-black` (45° angle, 8px stripe width).
The button MUST meet `--bi-touch-target` minimum height (52px).

#### Scenario: Default hazard button

- GIVEN `<HazardButton label="Delete Customer" />` renders
- WHEN not hovered
- THEN it shows a red background with light text

#### Scenario: Hazard hover pattern

- GIVEN the user hovers over a `HazardButton`
- WHEN the pointer enters the button area
- THEN the background transitions to diagonal yellow/black stripes

#### Scenario: Disabled hazard button

- GIVEN `<HazardButton label="Delete" disabled />` renders
- WHEN the user attempts to click
- THEN no action fires and the button appears dimmed (opacity 0.5)

### Requirement: Component Accessibility (IC-004)

All industrial components MUST maintain WCAG 2.1 AA contrast ratios against their intended backgrounds. Status lamps MUST NOT be the sole indicator of state — they MUST be paired with text labels or shape differences in contexts where color blindness could cause misinterpretation.

#### Scenario: Contrast ratio compliance

- GIVEN `--bi-on-surface` (#dae2fd) text on `--bi-surface` (#0b1326) background
- WHEN contrast ratio is calculated
- THEN the ratio is ≥ 4.5:1 (AA normal text)

#### Scenario: Lamp not sole indicator

- GIVEN a list of work orders with status lamps
- WHEN a user cannot distinguish lamp colors
- THEN the status text label next to each lamp still conveys the status

## Constraints

- Components are Vue 3 SFCs using `<script setup lang="ts">`
- All colors reference CSS variables from theme-system (TS-001)
- No inline styles — all styling via `<style scoped>` or CSS modules
- Components MUST accept standard HTML attributes via `v-bind="$attrs"`

## Dependencies

- `theme-system`: all color, typography, spacing, and border tokens
- Naive UI: base component patterns (buttons, cards)
