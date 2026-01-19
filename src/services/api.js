// Frontend API Service for Product Price Intelligence Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ProductAPI {
  /**
   * Add a new product and trigger price scraping
   * @param {string} productName - Product name
   * @param {string} productUrl - Optional product URL
   * @returns {Promise} Product data and scraper status
   */
  static async addProduct(productName, productUrl = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/add-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName,
          url: productUrl || undefined
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add product');
      }

      return data;
    } catch (error) {
      console.error('Add product error:', error);
      throw error;
    }
  }

  /**
   * Get latest prices with AI recommendation for a product
   * @param {number|string} identifier - Product ID or name
   * @param {boolean} useId - Whether identifier is ID or name
   * @returns {Promise} Product prices, comparison, and AI recommendation
   */
  static async getPricesWithAI(identifier, useId = true) {
    try {
      const param = useId ? `productId=${identifier}` : `productName=${encodeURIComponent(identifier)}`;
      const response = await fetch(`${API_BASE_URL}/get-prices?${param}`);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get prices');
      }

      return data;
    } catch (error) {
      console.error('Get prices error:', error);
      throw error;
    }
  }

  /**
   * Get price history for charts
   * @param {number|string} identifier - Product ID or name
   * @param {boolean} useId - Whether identifier is ID or name
   * @param {string} platform - Optional platform filter
   * @param {number} limit - Number of records
   * @returns {Promise} Price history data
   */
  static async getPriceHistory(identifier, useId = true, platform = null, limit = 50) {
    try {
      let url = `${API_BASE_URL}/get-history?`;
      url += useId ? `productId=${identifier}` : `productName=${encodeURIComponent(identifier)}`;
      
      if (platform) {
        url += `&platform=${platform}`;
      }
      
      url += `&limit=${limit}`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get price history');
      }

      return data;
    } catch (error) {
      console.error('Get price history error:', error);
      throw error;
    }
  }

  /**
   * Get all products
   * @returns {Promise} List of all products
   */
  static async getAllProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get products');
      }

      return data;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }

  /**
   * Check backend health
   * @returns {Promise} Health status
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Poll for price data until available
   * Useful after adding a product to wait for scraper results
   * @param {number|string} identifier - Product ID or name
   * @param {boolean} useId - Whether identifier is ID or name
   * @param {number} maxAttempts - Maximum polling attempts
   * @param {number} interval - Polling interval in ms
   * @returns {Promise} Price data when available
   */
  static async pollForPrices(identifier, useId = true, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.getPricesWithAI(identifier, useId);
        
        // Check if we have price data
        if (result.data && result.data.prices && result.data.prices.length > 0) {
          return result;
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`Poll attempt ${attempt + 1} failed:`, error);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Timeout waiting for price data');
  }
}

export default ProductAPI;
