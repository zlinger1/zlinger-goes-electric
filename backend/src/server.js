import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import tabsRouter from './routes/tabs.js';
import digestsRouter from './routes/digests.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/tabs', tabsRouter);
app.use('/api/digests', digestsRouter);

// Serve dashboard static files
const dashboardPath = path.join(__dirname, '../../dashboard/dist');
app.use('/dashboard', express.static(dashboardPath));
app.get('/dashboard/*', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║        TabMemory Server               ║
╚═══════════════════════════════════════╝

Server running on http://localhost:${PORT}
Dashboard: http://localhost:${PORT}/dashboard
API: http://localhost:${PORT}/api

Press Ctrl+C to stop
  `);
});
