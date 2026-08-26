# App Settings Specification

## Purpose

Global application configuration stored in a settings table. Settings affect quoting calculations, UI language, and display preferences.

## ADDED Requirements

### Requirement: Settings Data Model (FR-060)

The system MUST store settings as key-value pairs in a `settings` table:

| Field | Type | Constraint |
|-------|------|-----------|
| key | TEXT | PK |
| value | TEXT | REQUIRED |
| updated_at | TEXT | ISO 8601, auto-updated |

Default settings seeded on first launch:

| Key | Default Value | Description |
|-----|--------------|-------------|
| hourly_rate | "45.00" | Default hourly labor rate (EUR) |
| default_language | "it" | UI language: 'it' or 'es' |
| shop_name | "" | Shop display name |
| currency | "EUR" | Currency code |

#### Scenario: First launch seeding

- GIVEN the settings table is empty (first app launch)
- WHEN the app initializes
- THEN all 4 default settings are inserted

#### Scenario: Read setting value

- GIVEN hourly_rate is "45.00"
- WHEN the quoting module reads hourly_rate
- THEN it receives the string "45.00" (parsed to float by the consumer)

### Requirement: Settings Form (FR-061)

The system MUST provide a settings form with typed inputs for each setting:
- hourly_rate: number input, min 0, step 0.01
- default_language: dropdown ('Italiano', 'Español')
- shop_name: text input, max 100 chars
- currency: dropdown (EUR fixed for MVP)

#### Scenario: Update hourly rate

- GIVEN current hourly_rate is 45.00
- WHEN the user changes it to 50.00 and clicks Save
- THEN hourly_rate is updated to "50.00" and the change applies immediately

#### Scenario: Validate hourly rate

- GIVEN the settings form is open
- WHEN the user enters hourly_rate as -10
- THEN the form shows a validation error: "Hourly rate must be 0 or greater"

### Requirement: Immediate Effect (FR-062)

Settings changes MUST apply immediately without requiring an app restart. The Pinia settings store MUST reactively propagate changes.

#### Scenario: Language switch

- GIVEN the UI is in Italian
- WHEN the user changes default_language to 'es' and saves
- THEN all UI strings switch to Spanish immediately (no restart)

#### Scenario: Hourly rate in new quotes

- GIVEN hourly_rate was just changed from 45 to 50
- WHEN the user creates a new quote
- THEN the quote's hourly_rate defaults to 50.00 (but can be overridden per quote)
- AND existing quotes retain their own hourly_rate values

### Requirement: Settings Persistence (FR-063)

Settings MUST persist in the SQLite database and survive app restarts.

#### Scenario: Restart persistence

- GIVEN the user set shop_name to "Autofficina Rossi"
- WHEN the app is closed and reopened
- THEN shop_name is still "Autofficina Rossi"

## Constraints

- Key-value storage: simple schema, no nested structures
- hourly_rate: stored as string, parsed to float by consumers, MUST be ≥ 0
- default_language: restricted to 'it' or 'es'
- currency: fixed to 'EUR' for MVP (dropdown disabled or single-option)
- No validation on shop_name beyond max length
- Settings are global — not per-user (single-user app)

## Dependencies

- `quoting`: hourly_rate used as default when creating quotes (can be overridden per quote)
- `work-order-management`: hourly_rate used as default when creating work orders (can be overridden per work order)
- `i18n`: default_language drives the active locale
- `vehicle-timeline`: currency used for cost display formatting
