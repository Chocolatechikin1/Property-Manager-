// backend/server.ts
import express from 'express';
//import type { Request, Response } from 'express';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
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
    rent_received: number; //boolean represented as 0 or 1
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
        rent_received INTEGER, // 0 or 1
        notes TEXT
    )`);

    db.get("SELECT COUNT(*) AS count FROM properties", (err: Error | null, row: { count: number }) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO properties (address, tenant_name, rent_received, notes) VALUES (?, ?, ?, ?)");
            stmt.run("123 Maple Street", "John Doe", 0, "Needs new air filter.");
            stmt.run("456 Oak Avenue", "Jane Smith", 1, "Lease up in 3 months.");
            stmt.finalize();
        }
    });
});

// --- API ROUTES ---

// GET: Fetch all properties
app.get('/api/properties', (req: ExpressRequest, res: ExpressResponse) => {
    db.all("SELECT * FROM properties", [], (err: Error | null, rows: Property[]) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST: Add a new property
app.post('/api/properties', (req: ExpressRequest, res: ExpressResponse) => {
    const { address, tenant_name, notes }: Partial<Property> = req.body;
    
    db.run(
        `INSERT INTO properties (address, tenant_name, rent_received, notes) VALUES (?, ?, ?, ?)`,
        [address, tenant_name, 0, notes || ''], // Default rent_received to 0 (false)
        function (this: sqlite3.RunResult, err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            // Return the auto-generated ID so the frontend can use it immediately
            res.json({ id: this.lastID, message: 'Property added successfully' });
        }
    );
});

// PATCH: Update a property (rent status or notes)
app.patch('/api/properties/:id', (req: ExpressRequest, res: ExpressResponse) => {
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

// DELETE: Remove a property
app.delete('/api/properties/:id', (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;

    db.run(
        `DELETE FROM properties WHERE id = ?`,
        id,
        function (this: sqlite3.RunResult, err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Property deleted successfully', changes: this.changes });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});