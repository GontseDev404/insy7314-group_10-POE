import sqlite3 from "sqlite3";
import { open } from "sqlite";


const dbPromise = open({
    filename: "securepay.db",
    driver: sqlite3.Database
});


(async () => {
    const db = await dbPromise;

    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      full_name TEXT,
      password_hash TEXT,
      created_at TEXT
    )
  `);

    await db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      beneficiary_name TEXT,
      swift TEXT,
      iban TEXT,
      amount REAL,
      currency TEXT,
      reference TEXT,
      status TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
})();

export default dbPromise;
