# Delta for App Settings

## ADDED Requirements

### Requirement: VAT Rate Setting (FR-064)

The system MUST store a `vat_rate` setting seeded with default "0.21" (21%). The settings form MUST provide a number input: min 0, max 1, step 0.01.

| Key | Default Value | Description |
|-----|--------------|-------------|
| vat_rate | "0.21" | Global VAT rate applied to all new documents |

Changing vat_rate MUST NOT retroactively affect existing documents (each document snapshots vat_rate at creation).

#### Scenario: First launch seeds vat_rate

- GIVEN the settings table has no vat_rate key
- WHEN the app initializes
- THEN vat_rate "0.21" is inserted

#### Scenario: Update VAT rate

- GIVEN current vat_rate is 0.21
- WHEN the user changes it to 0.22 and saves
- THEN vat_rate updates to "0.22" and new documents use 0.22

#### Scenario: Validate VAT rate range

- GIVEN the settings form is open
- WHEN the user enters vat_rate as 1.5
- THEN the form shows: "VAT rate must be between 0 and 1"
