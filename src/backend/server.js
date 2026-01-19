const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const productRoutes = require('./routes/productRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Product Price Intelligence API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', productRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await db.connect();
    
    app.listen(PORT, () => {
      console.log(`
========================================
  Product Price Intelligence Backend
========================================
  Server: http://localhost:${PORT}
  Health: http://localhost:${PORT}/health
  Environment: ${process.env.NODE_ENV || 'development'}
========================================
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      await db.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT received, closing server...');
      await db.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
