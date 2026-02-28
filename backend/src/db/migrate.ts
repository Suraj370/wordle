/**
 * Simple migration runner.
 * Reads all .sql files from migrations/ in lexicographic order and executes them.
 * Idempotent — uses IF NOT EXISTS / CREATE OR REPLACE wherever possible.
 */
import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, closeDb } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run(): Promise<void> {
  const db = getDb();
  const migrationsDir = join(__dirname, 'migrations');

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    console.log(`  → ${file}`);
    await db.query(sql);
  }

  console.log('Migrations complete.');
  await closeDb();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
