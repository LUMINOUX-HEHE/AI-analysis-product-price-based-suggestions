const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DatabaseManager {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.dbPath = null;
  }

  async connect() {
    try {
      // Initialize SQL.js
      this.SQL = await initSqlJs();
      
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, '../../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.dbPath = process.env.DB_PATH || path.join(dataDir, 'products.db');
      
      // Load existing database or create new one
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
      } else {
        this.db = new this.SQL.Database();
      }
      
      console.log('SQLite Database connected successfully');
      this.initializeSchema();
      this.saveToFile(); // Save initial state
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  initializeSchema() {
    try {
      // Create products table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // Create price_history table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          platform TEXT NOT NULL,
          price REAL NOT NULL,
          currency TEXT DEFAULT 'USD',
          timestamp TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);

      // Create indexes for faster queries
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_product_id ON price_history(product_id)
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_timestamp ON price_history(timestamp)
      `);

      console.log('Database schema initialized');
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  query(sql, params = []) {
    try {
      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        const result = [];
        while (stmt.step()) {
          result.push(stmt.getAsObject());
        }
        stmt.free();
        return result;
      } 
      // For INSERT/UPDATE/DELETE queries
      else {
        const stmt = this.db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();
        
        this.saveToFile(); // Persist changes immediately
        
        // Return result with last inserted ID
        return this.db;
      }
    } catch (error) {
      console.error('Query execution failed:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  saveToFile() {
    try {
      if (this.db && this.dbPath) {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
      }
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  close() {
    if (this.db) {
      this.saveToFile();
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

module.exports = new DatabaseManager();
