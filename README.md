# Wrenchify

Auto repair shop management for small businesses. A bilingual (Italian/Spanish) desktop application designed for independent mechanics.

## Features

- **Customer & Vehicle Management** - Complete records with service history
- **Quotes** - Generate quotes with automatic VAT calculation
- **Work Orders** - Track repairs with status and time tracking
- **Payments** - Record partial or full payments with multiple methods
- **Customer Messages** - Generate conversational messages in the customer's preferred language
- **Automatic Backup** - Automatic and manual backup support
- **Bilingual** - Interface in Italian and Spanish
- **Auto-Updates** - Automatic detection and download of new versions

## System Requirements

- **macOS**: 10.15+ (arm64 or x64)
- **Windows**: 10+ (x64)
- **Linux**: Ubuntu 18.04+, Fedora 32+, Debian 10+ (x64 or arm64)

## Installation

### From GitHub Releases

1. Download the installer for your platform from [Releases](https://github.com/looreenz/wrenchify/releases)
   - **macOS**: `Wrenchify-*.dmg`
   - **Windows**: `Wrenchify-*.exe`
   - **Linux**: `Wrenchify-*.AppImage`

2. Install or run:
   - **macOS**: Open the DMG and drag to Applications
   - **Windows**: Run the installer
   - **Linux**: `chmod +x Wrenchify-*.AppImage && ./Wrenchify-*.AppImage`

### Code Signing Notice

The application is currently not digitally signed:
- **macOS**: May show a Gatekeeper warning. Right-click → Open the first time
- **Windows**: SmartScreen may show a warning. Click "More info" → "Run anyway"
- **Linux**: Works without issues

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/looreenz/wrenchify.git
cd wrenchify

# Install dependencies
pnpm install

# Start development mode
pnpm dev
```

### Main Commands

```bash
# Development
pnpm dev                    # Start app with hot reload

# Testing
pnpm test                   # Run unit tests
pnpm test:coverage          # Tests with coverage report

# Build
pnpm build                  # Build for production
pnpm build:mac              # Build for macOS (dmg)
pnpm build:win              # Build for Windows (exe)
pnpm build:linux            # Build for Linux (AppImage)

# Cross-architecture build (from macOS)
npx electron-builder --linux --x64    # Linux x64 from Mac ARM
npx electron-builder --mac --x64      # macOS x64 from Mac ARM

# Type checking
pnpm typecheck              # Verify TypeScript types
```

## Architecture

### Project Structure

```
wrenchify/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Entry point
│   │   ├── backup.ts      # Backup logic
│   │   └── ipc/           # IPC handlers
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # Bridge between main and renderer
│   ├── renderer/          # Vue 3 frontend
│   │   ├── components/    # Reusable components
│   │   ├── composables/   # Vue composables
│   │   ├── stores/        # Pinia stores
│   │   ├── views/         # Page views
│   │   └── router.ts      # Route configuration
│   ├── shared/            # Shared types and utilities
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── calcTotals.ts  # Total calculations
│   ├── db/                # Database layer
│   │   ├── connection.ts  # SQLite connection
│   │   ├── migrations/    # SQL migrations
│   │   └── repositories/  # Entity repositories
│   └── i18n/              # Translations
│       ├── it.json        # Italian
│       └── es.json        # Spanish
├── tests/                 # Tests
│   ├── unit/              # Unit tests (Vitest)
│   └── e2e/               # End-to-end tests (Playwright)
└── electron-builder.yml   # Build configuration
```

### Patterns Used

- **IPC Pattern**: Main process handles DB, renderer calls via preload
- **Repository Pattern**: Per-entity repositories with exported functions
- **Composition API**: Vue 3 with `<script setup lang="ts">`
- **Pinia Stores**: Reactive state management by domain

## Technologies

- **Electron 33** - Desktop framework
- **Vue 3** - Frontend framework (Composition API)
- **TypeScript** - Strict typing
- **Pinia** - State management
- **Naive UI** - UI components
- **better-sqlite3** - SQLite database
- **vue-i18n** - Internationalization
- **electron-vite** - Build tool
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Database Structure

### Main Tables

- **customers** - Customers with contact info and preferred language
- **vehicles** - Vehicles associated with customers
- **quotes** - Quotes with items and calculations
- **work_orders** - Work orders with statuses
- **payments** - Recorded payments
- **settings** - Application settings

### VAT Calculation

- **Parts**: VAT applied to customer price
- **Labor**: No VAT (only cost is charged)
- **Formula**: `customer_total = parts_with_vat + labor_cost`

## Contributing

This is a personal project, but if you have suggestions or find bugs:

1. Open an issue describing the problem
2. For code contributions, open a PR with a clear description of changes

## License

MIT

## Credits

Developed by Lorenzo to help independent auto repair shops manage their work efficiently.
