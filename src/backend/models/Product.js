const db = require('../config/database');

class Product {
  static create(name, url = null) {
    try {
      db.query(
        'INSERT INTO products (name, url) VALUES (?, ?)',
        [name, url]
      );
      // Immediately query to get the inserted product
      const result = db.query("SELECT * FROM products WHERE name = ? ORDER BY id DESC LIMIT 1", [name]);
      return result[0] ? result[0].id : null;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  static findById(id) {
    try {
      const result = db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );
      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to find product: ${error.message}`);
    }
  }

  static findByName(name) {
    try {
      const result = db.query(
        'SELECT * FROM products WHERE name = ?',
        [name]
      );
      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to find product: ${error.message}`);
    }
  }

  static getAll() {
    try {
      const result = db.query('SELECT * FROM products ORDER BY created_at DESC');
      return result;
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  static addPriceHistory(productId, platform, price, currency = 'USD') {
    try {
      db.query(
        'INSERT INTO price_history (product_id, platform, price, currency) VALUES (?, ?, ?, ?)',
        [productId, platform, price, currency]
      );
    } catch (error) {
      throw new Error(`Failed to add price history: ${error.message}`);
    }
  }

  static getLatestPrices(productId) {
    try {
      const result = db.query(`
        SELECT 
          ph.platform,
          ph.price,
          ph.currency,
          ph.timestamp
        FROM price_history ph
        INNER JOIN (
          SELECT platform, MAX(timestamp) as max_timestamp
          FROM price_history
          WHERE product_id = ?
          GROUP BY platform
        ) latest ON ph.platform = latest.platform AND ph.timestamp = latest.max_timestamp
        WHERE ph.product_id = ?
        ORDER BY ph.price ASC
      `, [productId, productId]);
      return result;
    } catch (error) {
      throw new Error(`Failed to get latest prices: ${error.message}`);
    }
  }

  static getPriceHistory(productId, platform = null, limit = 100) {
    try {
      let query = `
        SELECT platform, price, currency, timestamp
        FROM price_history
        WHERE product_id = ?
      `;
      const params = [productId];

      if (platform) {
        query += ' AND platform = ?';
        params.push(platform);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const result = db.query(query, params);
      return result;
    } catch (error) {
      throw new Error(`Failed to get price history: ${error.message}`);
    }
  }
}

module.exports = Product;
