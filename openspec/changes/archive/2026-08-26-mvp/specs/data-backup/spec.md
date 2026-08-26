# Data Backup Specification

## Purpose

Protect user data through automatic SQLite file backups on app close and manual export/restore operations. Single-file database makes backup trivial — copy the file.

## ADDED Requirements

### Requirement: Auto-Backup on Close (FR-070)

The system MUST copy the SQLite database file to a backup directory every time the app closes. The system MUST retain only the last 3 backups, deleting older ones.

Backup naming: `shop_data_YYYY-MM-DD_HH-MM-SS.sqlite`

#### Scenario: Auto-backup creates copy

- GIVEN the app is running with database at `userData/wrenchify.sqlite`
- WHEN the user closes the app
- THEN a copy is created at `userData/backups/shop_data_2026-08-26_14-30-00.sqlite`

#### Scenario: Retain only last 3 backups

- GIVEN 3 backups already exist in the backup directory
- WHEN a new auto-backup is created on close
- THEN the oldest backup is deleted, leaving exactly 3 backups (the 2 previous + the new one)

#### Scenario: Backup directory creation

- GIVEN the backup directory does not exist
- WHEN the app closes for the first time
- THEN the backup directory is created and the backup file is saved

### Requirement: Manual Export (FR-071)

The system MUST provide a button that opens a "Save As" dialog, allowing the user to choose a destination for a manual backup copy.

#### Scenario: Export to chosen location

- GIVEN the user clicks "Export Database"
- WHEN the user selects `/Users/lore/Desktop/my_backup.sqlite` in the save dialog
- THEN the current SQLite file is copied to that location

#### Scenario: Cancel export

- GIVEN the save dialog is open
- WHEN the user clicks Cancel
- THEN no file is created and no error is shown

### Requirement: Manual Restore (FR-072)

The system MUST provide a button that opens a file picker, allowing the user to select a backup file to restore. The system MUST show a confirmation dialog warning that current data will be replaced.

#### Scenario: Restore with confirmation

- GIVEN the user clicks "Restore Database" and selects a backup file
- WHEN the confirmation dialog appears showing "This will replace all current data. Continue?"
- AND the user clicks "Confirm"
- THEN the current SQLite file is replaced with the selected backup file
- AND the app reloads the database

#### Scenario: Cancel restore

- GIVEN the confirmation dialog is shown
- WHEN the user clicks "Cancel"
- THEN no data is replaced and the app continues normally

#### Scenario: Invalid file selected

- GIVEN the user selects a file that is not a valid SQLite database
- WHEN the restore is attempted
- THEN the system shows an error: "Invalid database file" and does NOT replace the current database

### Requirement: Backup Location (FR-073)

Auto-backups MUST be stored in `{app.getPath('userData')}/backups/`. The backup directory path MUST be discoverable (shown in settings or about screen).

#### Scenario: Backup path display

- GIVEN the user opens the settings screen
- WHEN the backup section is visible
- THEN the backup directory path is displayed (e.g., "/Users/lore/Library/Application Support/wrenchify/backups/")

## Constraints

- Backup is a file copy operation (no SQL dump) — relies on WAL checkpoint completing before copy
- Auto-backup runs in the Electron main process on `before-quit` event
- WAL mode: a checkpoint MUST be forced before copying to ensure all data is in the main database file
- Restore replaces the file — the app MUST close and reopen the database connection after restore
- Maximum 3 auto-backups retained (FIFO deletion)
- Manual exports are NOT counted toward the 3-backup limit

## Dependencies

- `app-settings`: backup path could be configurable in future (not in MVP)
- Electron main process: backup operations run in main process (file system access)
- better-sqlite3: WAL checkpoint before file copy
