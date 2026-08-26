# Wrenchify

Bilingual desktop application for auto repair shop management. Built with Electron, Vue 3, TypeScript, and Naive UI.

## Features

- Customer, vehicle, quote, work order, payment, and settings management
- Bilingual UI (Italian / Spanish)
- Local SQLite database with manual backup/restore
- Dark-mode-first Beta Industrial theme

## Tech Stack

- **Frontend framework:** Vue 3 (Composition API, `<script setup>`)
- **Desktop shell:** Electron
- **Build tool:** electron-vite
- **UI library:** Naive UI
- **State management:** Pinia
- **Routing:** Vue Router
- **Icons:** Lucide Vue Next
- **Testing:** Vitest (unit), Playwright (e2e)
- **Database:** better-sqlite3

## Getting Started

Requirements:

- Node.js 20+
- pnpm

Install dependencies:

```bash
pnpm install
```

Run the app in development mode:

```bash
pnpm dev
```

Run unit tests:

```bash
pnpm test:unit
```

Run type checking:

```bash
pnpm typecheck
```

Build for production:

```bash
pnpm build
```

## Project Structure

```text
src/
  main/              # Electron main process
  preload/           # Electron preload scripts
  renderer/          # Vue application
    components/      # Vue components
      industrial/    # Beta Industrial theme components
    composables/     # Vue composables (e.g. useTheme)
    layouts/         # Application layouts
    router.ts        # Vue Router configuration
    stores/          # Pinia stores
    styles/tokens/   # CSS design token files
    theme/           # Naive UI theme overrides
    views/           # Page-level view components
  shared/            # Shared types and utilities
  i18n/              # Internationalization messages
tests/
  unit/              # Vitest unit tests
  e2e/               # Playwright end-to-end tests
design/              # Design system source files
```

## Theme System

Wrenchify uses the **Beta Industrial** design system. All visual values are expressed as CSS custom properties so the theme can evolve from a single source of truth.

- Tokens live in `src/renderer/styles/tokens/`
- Naive UI overrides live in `src/renderer/theme/betaIndustrial.ts`
- Reusable industrial components live in `src/renderer/components/industrial/`

See [`docs/THEME.md`](docs/THEME.md) for the full theme usage guide.

## License

MIT
