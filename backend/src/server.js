const express = require('express');
const path = require('path');
const cors = require('cors');
const oauthConfig = require('./config/oauth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/**
 * Instagram OAuth Integration Backend Server
 *
 * Express application that:
 * - Serves frontend static files
 * - Handles Instagram OAuth 2.0 flow
 * - Provides API endpoints for Instagram integration
 */

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from frontend/public directory
const frontendPath = path.join(__dirname, '../../frontend/public');
app.use(express.static(frontendPath));
console.log(`Serving static files from: ${frontendPath}`);

// Mount route handlers
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = oauthConfig.port;
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Instagram OAuth Integration Server');
  console.log('='.repeat(60));
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Environment: ${oauthConfig.nodeEnv}`);
  console.log(`Redirect URI: ${oauthConfig.redirectUri}`);
  console.log('='.repeat(60));
  console.log('\nEndpoints:');
  console.log(`  - Frontend:              http://localhost:${PORT}/`);
  console.log(`  - Connect Instagram:     http://localhost:${PORT}/auth/instagram`);
  console.log(`  - OAuth Callback:        http://localhost:${PORT}/auth/instagram/callback`);
  console.log(`  - API Health:            http://localhost:${PORT}/api/health`);
  console.log(`  - API User Info:         http://localhost:${PORT}/api/me`);
  if (oauthConfig.nodeEnv === 'development') {
    console.log(`  - Debug Tokens:          http://localhost:${PORT}/api/tokens`);
  }
  console.log('='.repeat(60));
  console.log('\nReady to accept connections!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});
