require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./lib/db'); // Turso client
const authMiddleware = require('./middleware/auth');
const applicationsRoutes = require('./routes/applications');
const componentsRoutes = require('./routes/components');
const usersRoutes = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow frontend access
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API Aplikasi Buat Satu Aplikasi Enterprise berjalan.' });
});

// Authentication and Multi-tenant Middleware
app.use(authMiddleware); // Apply to all API routes

// API Routes
app.use('/api/applications', applicationsRoutes);
app.use('/api/components', componentsRoutes);
app.use('/api/users', usersRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  // Database connection check (optional, Turso client connects on first query)
  try {
    await db.execute('SELECT 1');
    console.log('Koneksi database Turso berhasil.');
  } catch (error) {
    console.error('Koneksi database Turso gagal:', error.message);
    process.exit(1); // Exit if DB connection fails
  }
});

module.exports = app;