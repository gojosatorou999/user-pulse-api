const Database = require('better-sqlite3');
const db = new Database('expenses.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT DEFAULT (DATE('now')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Set default budget if not exists
const defaultBudget = db.prepare('SELECT value FROM settings WHERE key = ?').get('monthly_budget');
if (!defaultBudget) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('monthly_budget', '5000');
}

// Migrations: Ensure new columns exist for existing databases
try {
  db.exec('ALTER TABLE expenses ADD COLUMN description TEXT');
} catch (e) {
  // Column might already exist
}

try {
  db.exec("ALTER TABLE expenses ADD COLUMN date TEXT DEFAULT (DATE('now'))");
} catch (e) {
  // Column might already exist
}

module.exports = db;
