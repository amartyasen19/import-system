const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databasePath = path.resolve(__dirname, "../../database/database.sqlite");
const databaseDirectory = path.dirname(databasePath);

fs.mkdirSync(databaseDirectory, { recursive: true });

const schema = `
  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    total_records INTEGER DEFAULT 0,
    valid_records INTEGER DEFAULT 0,
    invalid_records INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    status TEXT DEFAULT 'PENDING'
      CHECK(status IN ('PENDING', 'AUTHORIZED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id)
  );
`;

const connect = () => {
  const db = new Database(databasePath);
  try {
    db.pragma("foreign_keys = ON");
    db.exec(schema);
    return db;
  } catch (error) {
    try {
      db.close();
    } catch {
      // Keep the original SQLite error for the recovery check.
    }
    throw error;
  }
};

let db;

try {
  db = connect();
} catch (error) {
  if (!["SQLITE_CORRUPT", "SQLITE_NOTADB"].includes(error.code)) {
    throw error;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${databasePath}.corrupt-${timestamp}`;

  try {
    if (fs.existsSync(databasePath)) {
      fs.renameSync(databasePath, backupPath);
    }

    for (const suffix of ["-wal", "-shm"]) {
      const sidecarPath = `${databasePath}${suffix}`;
      if (fs.existsSync(sidecarPath)) {
        fs.renameSync(sidecarPath, `${backupPath}${suffix}`);
      }
    }
  } catch (archiveError) {
    throw new Error(
      `SQLite database is corrupt and could not be backed up: ${archiveError.message}`
    );
  }

  console.warn(`Corrupt SQLite database backed up to ${backupPath}`);
  db = connect();
}

console.log("SQLite database connected successfully");

module.exports = db;
