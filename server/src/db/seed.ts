import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Manual seeding. The server also seeds automatically on first start when the data file is missing.
// Safe by default: an existing data file is never touched unless --force is given (it is backed up first).
async function main() {
  const force = process.argv.includes('--force');
  // Loading the database auto-seeds a missing file; createdOnInit tells us whether that just happened.
  const { DB_FILE_PATH, db } = await import('./database.js');
  const existed = !db.createdOnInit;

  if (!existed) {
    console.log(`Seeded new data file: ${DB_FILE_PATH}`);
    return;
  }
  if (!force) {
    console.log(`Data file already exists, leaving it untouched: ${DB_FILE_PATH}`);
    console.log('Re-run with "npm run seed -- --force" to back it up and reseed.');
    return;
  }

  const backup = `${DB_FILE_PATH}.bak-${Date.now()}`;
  fs.copyFileSync(DB_FILE_PATH, backup);
  console.log(`Backed up existing data to ${backup}`);
  db.seedInitialData();
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
