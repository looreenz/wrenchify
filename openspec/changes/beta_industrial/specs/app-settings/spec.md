# Delta for App Settings

## ADDED Requirements

### Requirement: Settings View Theme Conformance (AS-T01)

The settings view MUST use design tokens from the theme-system. Form inputs MUST follow the industrial port styling (dark background, slate border, orange focus border).

#### Scenario: Settings form uses theme tokens

- GIVEN the settings view renders
- WHEN inspecting computed styles
- THEN the form background uses `var(--bi-surface-container)`, inputs use `var(--bi-surface-container-lowest)`, and all text uses `var(--bi-on-surface)`

#### Scenario: Settings save button uses primary styling

- GIVEN the settings form shows a Save button
- WHEN rendered
- THEN the button uses `--bi-primary-container` background with `--bi-on-primary` text and meets 52px touch target
