import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'thought_click.db'));

export const initDB = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            cover_image TEXT,
            background_image TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS thoughts (
            id TEXT PRIMARY KEY,
            board_id TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT,
            x REAL NOT NULL,
            y REAL NOT NULL,
            color TEXT,
            width REAL,
            height REAL,
            metadata TEXT, -- JSON string
            created_at INTEGER NOT NULL,
            FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS connections (
            id TEXT PRIMARY KEY,
            board_id TEXT NOT NULL,
            from_id TEXT NOT NULL,
            to_id TEXT NOT NULL,
            FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE,
            FOREIGN KEY (from_id) REFERENCES thoughts (id) ON DELETE CASCADE,
            FOREIGN KEY (to_id) REFERENCES thoughts (id) ON DELETE CASCADE
        );
    `);

    // Ensure width and height columns exist (for existing databases)
    try {
        db.exec('ALTER TABLE thoughts ADD COLUMN width REAL');
        db.exec('ALTER TABLE thoughts ADD COLUMN height REAL');
    } catch (e) {
        // Columns might already exist
    }

    console.log('Thought.Click Database initialized');
};

export default db;
