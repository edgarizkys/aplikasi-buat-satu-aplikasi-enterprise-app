// controllers/applicationController.js
const { tursoClient } = require('../config/database');

// Get all applications with pagination
exports.getAllApplications = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const result = await tursoClient.execute({
            sql: 'SELECT id, app_name, description, status, created_by, last_updated, deployment_url FROM applications WHERE tenant_id = ? LIMIT ? OFFSET ?',
            args: [tenantId, limit, offset]
        });
        
        const countResult = await tursoClient.execute({
            sql: 'SELECT COUNT(*) as total FROM applications WHERE tenant_id = ?',
            args: [tenantId]
        });
        
        const total = countResult.rows[0].total;

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        console.error("Error fetching applications:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Get single application by ID
exports.getApplicationById = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;
        
        const result = await tursoClient.execute({
            sql: 'SELECT id, app_name, description, status, created_by, last_updated, deployment_url FROM applications WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (e) {
        console.error("Error fetching application by ID:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Create new application
exports.createApplication = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { app_name, description, status, created_by, deployment_url } = req.body;
        const last_updated = new Date().toISOString(); // Set current timestamp

        if (!app_name || !created_by) {
            return res.status(400).json({ success: false, message: 'Nama Aplikasi dan Dibuat Oleh wajib diisi.' });
        }
        
        const result = await tursoClient.execute({
            sql: `INSERT INTO applications (tenant_id, app_name, description, status, created_by, last_updated, deployment_url) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, app_name, description, status || 'draft', created_by, last_updated, deployment_url]
        });
        
        res.status(201).json({
            success: true,
            data: { 
                id: Number(result.lastInsertRowid), 
                tenant_id: tenantId,
                app_name, 
                description, 
                status: status || 'draft', 
                created_by, 
                last_updated, 
                deployment_url 
            }
        });
    } catch (e) {
        console.error("Error creating application:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Update application by ID
exports.updateApplication = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;
        const { app_name, description, status, created_by, deployment_url } = req.body;
        const last_updated = new Date().toISOString(); // Update timestamp on modification

        const existingApp = await tursoClient.execute({
            sql: 'SELECT id FROM applications WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (existingApp.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
        }

        const result = await tursoClient.execute({
            sql: `UPDATE applications SET app_name = ?, description = ?, status = ?, created_by = ?, last_updated = ?, deployment_url = ? 
                  WHERE id = ? AND tenant_id = ?`,
            args: [app_name, description, status, created_by, last_updated, deployment_url, id, tenantId]
        });
        
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan atau tidak ada perubahan.' });
        }

        res.json({
            success: true,
            message: 'Aplikasi berhasil diperbarui.',
            data: { id: Number(id), app_name, description, status, created_by, last_updated, deployment_url }
        });
    } catch (e) {
        console.error("Error updating application:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Delete application by ID
exports.deleteApplication = async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
        const { id } = req.params;

        const existingApp = await tursoClient.execute({
            sql: 'SELECT id FROM applications WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });

        if (existingApp.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
        }
        
        const result = await tursoClient.execute({
            sql: 'DELETE FROM applications WHERE id = ? AND tenant_id = ?',
            args: [id, tenantId]
        });
        
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan.' });
        }
        
        res.json({
            success: true,
            message: 'Aplikasi berhasil dihapus.'
        });
    } catch (e) {
        console.error("Error deleting application:", e.message);
        res.status(500).json({ error: e.message });
    }
};