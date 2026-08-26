# Delta for Quoting

## ADDED Requirements

### Requirement: Quote Views Theme Conformance (QT-T01)

All quote views (list, form, detail) MUST use design tokens from the theme-system. Quote status indicators MUST use `StatusLamp` components with appropriate colors per status.

| Status | Lamp Color |
|--------|-----------|
| draft | `--bi-tertiary` (#c3c7cb) |
| accepted | `#4ade80` (emerald) |
| rejected | `--bi-error` (#ffb4ab) |
| converted | `--bi-primary-container` (#ff6b00) |

#### Scenario: Quote list with status lamps

- GIVEN the quote list renders with 4 quotes in different statuses
- WHEN each row displays its status
- THEN a `StatusLamp` with the status-appropriate color appears next to the status text

#### Scenario: Quote form uses theme tokens

- GIVEN the quote create/edit form renders
- WHEN inspecting computed styles
- THEN all colors, borders, and spacing reference theme-system CSS variables
