import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { readdir, readFile } from 'fs/promises'

let db: Database.Database | null = null

export function getDatabasePath(): string {
  const userData = app.getPath('userData')
  return join(userData, 'wrenchify_data.sqlite')
}

export async function initializeDatabase(): Promise<Database.Database> {
  if (db) {
    return db
  }

  const dbPath = getDatabasePath()
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  await runMigrations(db)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function setDatabase(database: Database.Database): void {
  db = database
}

function getMigrationsDirectory(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'db/migrations')
  }
  return join(app.getAppPath(), 'src/db/migrations')
}

async function runMigrations(database: Database.Database): Promise<void> {
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const migrationsDir = getMigrationsDirectory()
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const appliedRows = database.prepare('SELECT filename FROM migrations').all() as { filename: string }[]
  const applied = new Set(appliedRows.map((row) => row.filename))

  for (const file of files) {
    if (applied.has(file)) {
      continue
    }

    const sql = await readFile(join(migrationsDir, file), 'utf-8')
    const migration = database.transaction(() => {
      database.exec(sql)
      database.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file)
    })

    migration()
    console.log(`[db] Applied migration: ${file}`)
  }
}
