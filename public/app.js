require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multi-tenant middleware
const tenantMiddleware = (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(400).json({ message: 'Header "x-tenant-id" wajib.' });
    }
    req.tenantId = tenantId;
    next();
};
app.use(tenantMiddleware);

// Auth middleware (placeholder)
const authMiddleware = (req, res, next) => {
    // In a real app, validate JWT or session
    // For now, mock user data and created_by
    req.user = {
        id: 'mock_user_123',
        name: 'Admin Platform',
        email: 'admin@platform.com',
        role: 'admin'
    };
    next();
};
app.use(authMiddleware);

// Database schema initialization
async function initDb() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                app_name TEXT NOT NULL,
                description TEXT,
                status TEXT,
                created_by TEXT,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                deployment_url TEXT
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                component_name TEXT NOT NULL,
                type TEXT,
                description TEXT,
                reusability_score INTEGER
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL
            );
        `);
        console.log('Skema database siap.');
    } catch (e) {
        console.error('Gagal inisialisasi database:', e);
        process.exit(1);
    }
}

// --- Routes ---

// Aplikasi (Applications)
app.get('/api/applications', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    try {
        const result = await db.execute({
            sql: `SELECT * FROM applications WHERE tenant_id = ? LIMIT ? OFFSET ?`,
            args: [req.tenantId, parseInt(limit), offset]
        });
        const totalResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM applications WHERE tenant_id = ?`,
            args: [req.tenantId]
        });
        const total = totalResult.rows[0].count;

        res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (e) {
        console.error('Gagal ambil aplikasi:', e);
        res.status(500).json({ message: 'Gagal ambil aplikasi.' });
    }
});

app.get('/api/applications/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM applications WHERE id = ? AND tenant_id = ?`,
            args: [req.params.id, req.tenantId]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch (e) {
        console.error('Gagal ambil aplikasi:', e);
        res.status(500).json({ message: 'Gagal ambil aplikasi.' });
    }
});

app.post('/api/applications', async (req, res) => {
    const { app_name, description, status, deployment_url } = req.body;
    if (!app_name) {
        return res.status(400).json({ message: 'Nama Aplikasi wajib.' });
    }
    try {
        const result = await db.execute({
            sql: `INSERT INTO applications (tenant_id, app_name, description, status, created_by, deployment_url) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [req.tenantId, app_name, description, status, req.user.name, deployment_url]
        });
        res.status(201).json({ id: result.lastInsertRowid, message: 'Aplikasi berhasil dibuat.' });
    } catch (e) {
        console.error('Gagal buat aplikasi:', e);
        res.status(500).json({ message: 'Gagal buat aplikasi.' });
    }
});

app.put('/api/applications/:id', async (req, res) => {
    const { app_name, description, status, deployment_url } = req.body;
    if (!app_name) {
        return res.status(400).json({ message: 'Nama Aplikasi wajib.' });
    }
    try {
        const result = await db.execute({
            sql: `UPDATE applications SET app_name = ?, description = ?, status = ?, last_updated = CURRENT_TIMESTAMP, deployment_url = ? WHERE id = ? AND tenant_id = ?`,
            args: [app_name, description, status, deployment_url, req.params.id, req.tenantId]
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan atau tidak ada perubahan.' });
        }
        res.json({ message: 'Aplikasi berhasil diperbarui.' });
    } catch (e) {
        console.error('Gagal perbarui aplikasi:', e);
        res.status(500).json({ message: 'Gagal perbarui aplikasi.' });
    }
});

app.delete('/api/applications/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `DELETE FROM applications WHERE id = ? AND tenant_id = ?`,
            args: [req.params.id, req.tenantId]
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' });
        }
        res.status(204).send(); // No content
    } catch (e) {
        console.error('Gagal hapus aplikasi:', e);
        res.status(500).json({ message: 'Gagal hapus aplikasi.' });
    }
});

// Komponen (Components)
app.get('/api/components', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    try {
        const result = await db.execute({
            sql: `SELECT * FROM components WHERE tenant_id = ? LIMIT ? OFFSET ?`,
            args: [req.tenantId, parseInt(limit), offset]
        });
        const totalResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM components WHERE tenant_id = ?`,
            args: [req.tenantId]
        });
        const total = totalResult.rows[0].count;

        res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (e) {
        console.error('Gagal ambil komponen:', e);
        res.status(500).json({ message: 'Gagal ambil komponen.' });
    }
});

app.get('/api/components/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT * FROM components WHERE id = ? AND tenant_id = ?`,
            args: [req.params.id, req.tenantId]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Komponen tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch (e) {
        console.error('Gagal ambil komponen:', e);
        res.status(500).json({ message: 'Gagal ambil komponen.' });
    }
});

app.post('/api/components', async (req, res) => {
    const { component_name, type, description, reusability_score } = req.body;
    if (!component_name) {
        return res.status(400).json({ message: 'Nama Komponen wajib.' });
    }
    try {
        const result = await db.execute({
            sql: `INSERT INTO components (tenant_id, component_name, type, description, reusability_score) VALUES (?, ?, ?, ?, ?)`,
            args: [req.tenantId, component_name, type, description, reusability_score]
        });
        res.status(201).json({ id: result.lastInsertRowid, message: 'Komponen berhasil dibuat.' });
    } catch (e) {
        console.error('Gagal buat komponen:', e);
        res.status(500).json({ message: 'Gagal buat komponen.' });
    }
});

app.put('/api/components/:id', async (req, res) => {
    const { component_name, type, description, reusability_score } = req.body;
    if (!component_name) {
        return res.status(400).json({ message: 'Nama Komponen wajib.' });
    }
    try {
        const result = await db.execute({
            sql: `UPDATE components SET component_name = ?, type = ?, description = ?, reusability_score = ? WHERE id = ? AND tenant_id = ?`,
            args: [component_name, type, description, reusability_score, req.params.id, req.tenantId]
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Komponen tidak ditemukan atau tidak ada perubahan.' });
        }
        res.json({ message: 'Komponen berhasil diperbarui.' });
    } catch (e) {
        console.error('Gagal perbarui komponen:', e);
        res.status(500).json({ message: 'Gagal perbarui komponen.' });
    }
});

app.delete('/api/components/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: `DELETE FROM components WHERE id = ? AND tenant_id = ?`,
            args: [req.params.id, req.tenantId]
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Komponen tidak ditemukan.' });
        }
        res.status(204).send(); // No content
    } catch (e) {
        console.error('Gagal hapus komponen:', e);
        res.status(500).json({ message: 'Gagal hapus komponen.' });
    }
});

// Pengguna Platform (Users)
app.get('/api