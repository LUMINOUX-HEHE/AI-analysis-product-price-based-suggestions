const h2 = require('h2-node');
require('dotenv').config();

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await h2.createConnection({
        host: 'localhost',
        user: process.env.H2_DB_USER || 'sa',
        password: process.env.H2_DB_PASSWORD || '',
        database: process.env.H2_DB_PATH || './data/products',
        mode: 'embedded'
      });

      console.log('H2 Database connected successfully');
      await this.initializeSchema();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async initializeSchema() {
    try {
      // Create products table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create price_history table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          platform VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);

      // Create index for faster queries
      await this.connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_product_id ON price_history(product_id)
      `);

      await this.connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_timestamp ON price_history(timestamp)
      `);

      console.log('Database schema initialized');
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      return await this.connection.execute(sql, params);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
      console.log('Database connection closed');
    }
  }
}

module.exports = new Database();
