# Wrenchify - Agent Instructions

## Project Overview

Wrenchify is a bilingual (Italian/Spanish) desktop application for auto repair shop management. Built with Electron, Vue 3, and TypeScript.

## Tech Stack

- **Desktop**: Electron 33+
- **Frontend**: Vue 3 (Composition API) + Pinia
- **UI Library**: Naive UI
- **Database**: SQLite via better-sqlite3 (main process, sync API)
- **i18n**: vue-i18n (IT/ES)
- **Build Tool**: electron-vite
- **Testing**: Vitest (unit), Playwright (e2e)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # App entry point
│   ├── backup.ts   # Auto-backup logic
│   └── ipc/        # IPC handlers
├── preload/        # Preload scripts (context bridge)
│   └── index.ts    # Exposes API to renderer
├── renderer/       # Vue 3 frontend
│   ├── components/ # Reusable components
│   ├── composables/# Vue composables
│   ├── stores/     # Pinia stores
│   ├── views/      # Page components
│   ├── router.ts   # Vue Router config
│   └── App.vue     # Root component
├── shared/         # Shared types and utilities
│   ├── types.ts    # TypeScript interfaces
│   └── calcTotals.ts
├── db/             # Database layer
│   ├── connection.ts
│   ├── migrations/
│   └── repositories/
└── i18n/           # Translations
    ├── it.json
    └── es.json
```

## Architecture Patterns

### Electron IPC Pattern
- **Main process**: Owns database connection, handles all DB operations
- **Preload**: Exposes API via `contextBridge.exposeInMainWorld('wrenchifyAPI', api)`
- **Renderer**: Calls API methods, never imports DB directly

### Repository Pattern
- Each entity has its own repository in `src/db/repositories/`
- Repositories export functions (not classes)
- All DB access goes through repositories

### Composables
- Use Vue 3 Composition API
- Prefix with `use` (e.g., `useTheme`, `useAutoUpdater`)
- Keep them focused and reusable

## Code Conventions

### TypeScript
- **Strict mode**: Always enabled
- **Explicit return types**: Required for all functions
- **No `any`**: Use proper types or `unknown`
- **Interfaces over types**: For object shapes

### Vue Components
- **Composition API**: Always use `<script setup lang="ts">`
- **Naive UI components**: Import from `naive-ui` (NButton, NCard, etc.)
- **Props**: Define with `defineProps<T>()` using TypeScript
- **Emits**: Define with `defineEmits<T>()`

### Naming
- **Files**: PascalCase for components (e.g., `QuoteDetail.vue`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE (rarely used)
- **Types/Interfaces**: PascalCase

### i18n
- **Keys**: Nested by feature (e.g., `quote.message.greeting`)
- **Languages**: Italian (it) and Spanish (es)
- **Usage**: `{{ $t('key') }}` in templates, `t('key')` in script
- **Customer language**: Use `customer.preferred_language` for customer-facing messages

## Database Conventions

### Schema
- **Tables**: snake_case (e.g., `work_orders`)
- **Columns**: snake_case (e.g., `created_at`)
- **Timestamps**: ISO-8601 text format (SQLite best practice)
- **Foreign keys**: Use `ON DELETE CASCADE` for owned entities, `ON DELETE RESTRICT` for billing history

### Migrations
- Located in `src/db/migrations/`
- Named with timestamp prefix (e.g., `001_initial.sql`)
- Run automatically on app startup

## Testing

### Unit Tests
- **Framework**: Vitest
- **Location**: `tests/unit/**/*.test.ts`
- **Run**: `pnpm test:unit`
- **Pattern**: Test repositories and shared utilities, not Vue components (unless necessary)

### E2E Tests
- **Framework**: Playwright
- **Location**: `tests/e2e/**/*.spec.ts`
- **Run**: `pnpm test:e2e`

### Pre-test Hook
- `pnpm rebuild better-sqlite3` runs before tests
- `electron-rebuild` runs after tests

## Build & Distribution

### Development
```bash
pnpm dev          # Start dev server with hot reload
pnpm typecheck    # TypeScript type checking
```

### Production Build
```bash
pnpm run build    # Build with electron-vite
pnpm dist:mac     # Build DMG for macOS (arm64)
pnpm dist:linux   # Build AppImage for Linux (arm64)
pnpm dist:win     # Build installer for Windows
```

### Cross-architecture Build
```bash
# Build for x86_64 (from arm64 Mac)
npx electron-builder --linux --x64
npx electron-builder --mac --x64
```

### Publishing
```bash
# Create GitHub release with assets
gh release create v0.1.0 dist/*.AppImage dist/*.dmg --title "v0.1.0" --notes "Release notes"
```

## Auto-Update

- **Configured**: electron-updater with GitHub publish
- **Check frequency**: On app start (5s delay) + every 4 hours
- **autoDownload**: false (user must click "Download update")
- **Disabled in dev**: When `NODE_ENV === 'development'`
- **Platforms**: Mac (DMG), Windows (NSIS), Linux (AppImage)

## Important Decisions

### No Code Signing
- Unsigned builds for now
- macOS Gatekeeper will warn users
- Windows SmartScreen may block
- Linux AppImage works without signing

### VAT Calculation
- **Parts**: VAT applied to customer_price
- **Labor**: NO VAT (only parts are taxed)
- **Formula**: `customer_total = parts_with_vat + labor_cost`

### Customer Message Format
- Conversational tone
- Uses customer's `preferred_language` (not UI language)
- Personalized greeting with first name only
- Format: greeting → intro → work → parts → labor → total → notes → closing

### Data Location
- **macOS**: `~/Library/Application Support/wrenchify/shop.sqlite`
- **Windows**: `%APPDATA%/wrenchify/shop.sqlite`
- **Linux**: `~/.local/share/wrenchify/shop.sqlite`
- **Portable mode**: If `./wrenchify-data/shop.sqlite` exists next to executable, use that

## Common Tasks

### Add New Entity
1. Create migration in `src/db/migrations/`
2. Add types in `src/shared/types.ts` (Entity, EntityCreate, EntityUpdate, EntityFilter)
3. Create repository in `src/db/repositories/`
4. Add IPC handlers in `src/main/ipc/handlers.ts`
5. Expose in preload `src/preload/index.ts`
6. Create Pinia store in `src/renderer/stores/`
7. Create views in `src/renderer/views/`
8. Add i18n keys in `src/i18n/it.json` and `src/i18n/es.json`

### Add New IPC Method
1. Add handler in `src/main/ipc/handlers.ts`
2. Expose in `src/preload/index.ts`
3. Add type in `src/shared/types.ts` under `WrenchifyAPI`

### Add Translation Key
1. Add to `src/i18n/it.json` (Italian)
2. Add to `src/i18n/es.json` (Spanish)
3. Use in template: `{{ $t('feature.key') }}`
4. Use in script: `t('feature.key')`

## Gotchas

- **better-sqlite3 native module**: Must be rebuilt for Electron version
  - `pnpm rebuild better-sqlite3` or `electron-rebuild -f -w better-sqlite3`
- **Test failures**: Pre-existing NODE_MODULE_VERSION mismatch with better-sqlite3
  - Run `pnpm pretest` before tests to rebuild native modules
- **Auto-update in dev**: Disabled when `NODE_ENV === 'development'`
- **Linux AppImage**: Auto-update only works when running from AppImage file (not extracted)

## Commit Convention

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

No "Co-Authored-By" or AI attribution in commits.

## Response Guidelines

- Match user's language (Spanish/Italian/English)
- Keep responses concise by default
- Ask at most one question at a time
- Verify claims before stating them
- Propose alternatives with tradeoffs when relevant
