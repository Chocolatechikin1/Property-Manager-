// backend/server.ts
import express from 'express';
import type { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Type Definitions
interface Property {
    id?: number;
    address: string;
    tenant_name: string;
    rent_received: number; // SQLite uses 0/1 for booleans
    notes: string;
}

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err: Error | null) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to the SQLite database.');
});

// Create Table and Seed Data
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT,
        tenant_name TEXT,
        rent_received BOOLEAN,
        notes TEXT
    )`);

    // Insert sample data if the table is empty
    db.get("SELECT COUNT(*) AS count FROM properties", (err: Error | null, row: { count: number }) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO properties (address, tenant_name, rent_received, notes) VALUES (?, ?, ?, ?)");
            stmt.run("123 Maple Street", "John Doe", 0, "Needs new air filter.");
            stmt.run("456 Oak Avenue", "Jane Smith", 1, "Lease up in 3 months.");
            stmt.finalize();
        }
    });
});

// API Routes

// GET: Fetch all properties
app.get('/api/properties', (req: Request, res: Response) => {
    db.all("SELECT * FROM properties", [], (err: Error | null, rows: Property[]) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// PATCH: Update a property (rent status or notes)
app.patch('/api/properties/:id', (req: Request, res: Response) => {
    const { rent_received, notes }: Partial<Property> = req.body;
    const { id } = req.params;

    db.run(
        `UPDATE properties SET rent_received = ?, notes = ? WHERE id = ?`,
        [rent_received, notes, id],
        function (this: sqlite3.RunResult, err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Property updated successfully', changes: this.changes });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});