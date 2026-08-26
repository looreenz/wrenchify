# i18n (Internationalization) Specification

## Purpose

Bilingual UI support (Italian and Spanish) with runtime language switching. All user-facing strings MUST be externalized to translation dictionaries.

## ADDED Requirements

### Requirement: Translation Dictionaries (FR-080)

The system MUST maintain two JSON dictionary files:
- `src/i18n/it.json` — Italian translations
- `src/i18n/es.json` — Spanish translations

Both files MUST have identical key structures. Every key present in one file MUST exist in the other.

#### Scenario: Key parity

- GIVEN it.json has key "customers.title" = "Clienti"
- WHEN es.json is checked
- THEN es.json MUST have key "customers.title" = "Clientes"

#### Scenario: Nested key structure

- GIVEN the dictionary files
- WHEN they are loaded
- THEN keys are organized by domain: `customers.*`, `vehicles.*`, `quotes.*`, `workOrders.*`, `payments.*`, `timeline.*`, `settings.*`, `backup.*`, `common.*`

### Requirement: vue-i18n Integration (FR-081)

The system MUST use vue-i18n with the Composition API. All components MUST use `$t('key')` or `useI18n().t('key')` for translatable strings. No hardcoded UI strings allowed.

#### Scenario: Component uses translation

- GIVEN a button component with label "Save"
- WHEN the component renders in Italian
- THEN the button shows "Salva" (from it.json key "common.save")
- WHEN switched to Spanish
- THEN the button shows "Guardar" (from es.json key "common.save")

### Requirement: Runtime Language Switching (FR-082)

The system MUST allow switching languages at runtime without restarting the app. The active locale is stored in the Pinia settings store and synced to the `settings` table.

#### Scenario: Switch language from settings

- GIVEN the UI is in Italian
- WHEN the user changes language to Spanish in settings and saves
- THEN all visible UI strings update to Spanish immediately
- AND the i18n locale is set to 'es'
- AND the settings table default_language is updated to 'es'

#### Scenario: Persist language across restarts

- GIVEN the user set language to Spanish
- WHEN the app is closed and reopened
- THEN the UI loads in Spanish

### Requirement: Locale Initialization (FR-083)

On app startup, the system MUST read `default_language` from the settings table and set the vue-i18n locale accordingly. If no setting exists (first launch), default to 'it'.

#### Scenario: First launch default

- GIVEN no settings exist (fresh install)
- WHEN the app starts
- THEN the locale is set to 'it' (Italian)

#### Scenario: Subsequent launch

- GIVEN settings has default_language = 'es'
- WHEN the app starts
- THEN the locale is set to 'es' (Spanish)

### Requirement: Fallback Behavior (FR-084)

If a translation key is missing in the active locale, the system MUST fall back to the key itself (not crash, not show blank). A console warning MUST be logged.

#### Scenario: Missing key fallback

- GIVEN it.json is missing key "common.experimental"
- WHEN a component renders `$t('common.experimental')` in Italian
- THEN the text "common.experimental" is displayed (the key itself)
- AND a console warning is logged

## Constraints

- Only 2 locales supported: 'it' and 'es' (no dynamic locale addition in MVP)
- Dictionary files: flat or nested JSON, loaded at app startup
- No pluralization rules needed for MVP (Italian and Spanish have simple plural forms, handled manually in strings if needed)
- No date/number formatting via i18n — use native JS Intl APIs with the active locale
- Customer preferred_language is stored but NOT used for UI rendering in MVP (reserved for future document generation)
- All Naive UI component labels and placeholders MUST be overridden with translated strings

## Dependencies

- `app-settings`: default_language setting drives locale initialization and switching
- `customer-management`: preferred_language field stored for future use
- Vue 3 + vue-i18n: runtime dependency for translation
- Pinia: settings store holds the active locale reactively
