# Delta for Customer Management

## ADDED Requirements

### Requirement: Customer Views Theme Conformance (CM-T01)

All customer management views (list, form, detail) MUST use design tokens from the theme-system for colors, typography, spacing, and borders. Zero hardcoded color values SHALL exist in customer view files.

#### Scenario: Customer list uses theme tokens

- GIVEN the customer list view renders
- WHEN inspecting computed styles
- THEN background uses `var(--bi-surface)`, text uses `var(--bi-on-surface)`, and borders use `var(--bi-outline)`

#### Scenario: Customer form inputs styled as industrial ports

- GIVEN the customer create/edit form renders
- WHEN an input field is displayed
- THEN it has a dark background (`--bi-surface-container-lowest`), 1px slate border, and on focus the border becomes 2px `--bi-primary-container`

#### Scenario: Customer delete uses hazard button

- GIVEN the customer detail view shows a delete action
- WHEN the delete button renders
- THEN it uses the `HazardButton` component with striped hover pattern
