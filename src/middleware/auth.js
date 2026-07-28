// middleware/auth.js - JWT Authentication
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        // Unauthenticated for demo/testing. Assign demo user.
        req.user = { id: 1, role: 'admin', name: 'Demo User', tenant_id: 'default_tenant' }; // Added tenant_id for multi-tenant
        return next();
    }
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        // Ensure tenant_id exists, default if not provided in token
        if (!req.user.tenant_id) {
            req.user.tenant_id = 'default_tenant';
        }
        next();
    } catch(e) {
        res.status(401).json({ error: 'Unauthorized', message: e.message });
    }
};