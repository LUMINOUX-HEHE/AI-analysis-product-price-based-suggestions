const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const scraperService = require('../services/scraperService');
const ollamaService = require('../services/ollamaService');

class ProductController {
  // Add a new product and trigger scraper
  async addProduct(req, res) {
    try {
      console.log('\n[ProductController] ======== ADD PRODUCT ========');
      console.log('[ProductController] Request body:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[ProductController] Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { name, url } = req.body;
      console.log('[ProductController] Adding product:', { name, url });

      // Check if product already exists
      let product = Product.findByName(name);
      console.log('[ProductController] Existing product check:', product ? 'Found' : 'Not found');
      
      if (!product) {
        console.log('[ProductController] Creating new product in database...');
        const productId = Product.create(name, url);
        console.log('[ProductController] Product created with ID:', productId);
        product = Product.findById(productId);
        console.log('[ProductController] Product retrieved after creation:', product);
        
        if (!product) {
          throw new Error(`Failed to retrieve created product with ID: ${productId}`);
        }
      }

      // Trigger scraper in the background (non-blocking)
      // The scraper will send data back to /scrape endpoint when done
      console.log('[ProductController] Triggering scraper for product:', product.name);
      scraperService.scrapeProduct(product)
        .then(result => {
          console.log('[ProductController] ✓ Scraper triggered successfully:', result);
        })
        .catch(error => {
          console.error('[ProductController] ✗ Scraper error:', error);
        });

      res.status(201).json({
        success: true,
        message: 'Product added successfully. Scraper triggered to fetch prices.',
        data: product,
        note: 'Price data will be available shortly. Use /get-prices to retrieve results.'
      });
    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add product',
        error: error.message
      });
    }
  }

  // Get latest prices for a product across all platforms with AI analysis
  async getLatestPrices(req, res) {
    try {
      console.log('\n[ProductController] ======== GET LATEST PRICES ========');
      const { productId, productName } = req.query;
      console.log('[ProductController] Query params:', { productId, productName });

      if (!productId && !productName) {
        return res.status(400).json({
          success: false,
          message: 'Product ID or product name is required'
        });
      }

      let product;
      if (productId) {
        product = await Product.findById(parseInt(productId));
      } else {
        product = await Product.findByName(productName);
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const prices = Product.getLatestPrices(product.id);
      console.log('[ProductController] Latest prices fetched:', prices.length, 'entries');
      
      const history = Product.getPriceHistory(product.id, null, 30);
      console.log('[ProductController] Price history fetched:', history.length, 'entries');

      // Get AI-powered analysis from Ollama Mistral
      console.log('[ProductController] Requesting AI analysis from Ollama...');
      let aiAnalysis = null;
      try {
        aiAnalysis = await ollamaService.analyzePrices(product, prices, history);
        console.log('[ProductController] ✓ AI analysis completed:', aiAnalysis.recommendation);
      } catch (aiError) {
        console.error('[ProductController] ✗ AI analysis error:', aiError.message);
        aiAnalysis = {
          error: 'AI analysis unavailable',
          message: aiError.message
        };
      }

      res.json({
        success: true,
        data: {
          product,
          prices,
          comparison: {
            lowestPrice: prices.length > 0 ? prices[0].price : null,
            highestPrice: prices.length > 0 ? prices[prices.length - 1].price : null,
            platformCount: prices.length,
            savings: prices.length > 0 ? (prices[prices.length - 1].price - prices[0].price).toFixed(2) : 0
          },
          aiRecommendation: aiAnalysis,
          priceHistory: history.slice(0, 10) // Include recent history for charts
        }
      });
    } catch (error) {
      console.error('Get prices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get prices',
        error: error.message
      });
    }
  }

  // Get price history for a product
  async getPriceHistory(req, res) {
    try {
      const { productId, productName, platform, limit } = req.query;

      if (!productId && !productName) {
        return res.status(400).json({
          success: false,
          message: 'Product ID or product name is required'
        });
      }

      let product;
      if (productId) {
        product = await Product.findById(parseInt(productId));
      } else {
        product = await Product.findByName(productName);
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const history = await Product.getPriceHistory(
        product.id,
        platform,
        limit ? parseInt(limit) : 100
      );

      res.json({
        success: true,
        data: {
          product,
          history,
          count: history.length
        }
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get price history',
        error: error.message
      });
    }
  }

  // Receive scraped data from scraper service
  async receiveScrapedData(req, res) {
    try {
      console.log('\n[ProductController] ======== RECEIVE SCRAPED DATA ========');
      console.log('[ProductController] Scraped data received:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[ProductController] Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { productName, productUrl, platform, price, currency } = req.body;

      // Find or create product
      let product = Product.findByName(productName);
      console.log('[ProductController] Product lookup:', product ? `Found ID ${product.id}` : 'Not found, creating...');
      
      if (!product) {
        const productId = Product.create(productName, productUrl);
        console.log('[ProductController] Product created with ID:', productId);
        product = Product.findById(productId);
      }

      // Add price to history
      console.log('[ProductController] Adding price to history:', { platform, price, currency });
      Product.addPriceHistory(product.id, platform, price, currency);
      console.log('[ProductController] ✓ Price saved to database');

      res.json({
        success: true,
        message: 'Price data received and stored successfully',
        data: {
          productId: product.id,
          productName,
          platform,
          price,
          currency
        }
      });
    } catch (error) {
      console.error('Scrape endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process scraped data',
        error: error.message
      });
    }
  }

  // AI Summary endpoint (placeholder for future AI integration)
  async getAISummary(req, res) {
    try {
      const { productId, productName } = req.query;

      if (!productId && !productName) {
        return res.status(400).json({
          success: false,
          message: 'Product ID or product name is required'
        });
      }

      let product;
      if (productId) {
        product = await Product.findById(parseInt(productId));
      } else {
        product = await Product.findByName(productName);
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get price data for AI analysis
      const prices = await Product.getLatestPrices(product.id);
      const history = await Product.getPriceHistory(product.id, null, 30);

      res.json({
        success: true,
        message: 'AI summary endpoint - Ready for integration',
        data: {
          product,
          currentPrices: prices,
          recentHistory: history,
          // Placeholder for AI-generated insights
          aiInsights: {
            status: 'pending',
            message: 'AI integration coming soon',
            recommendation: 'Endpoint ready for AI service connection'
          }
        }
      });
    } catch (error) {
      console.error('AI summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI summary',
        error: error.message
      });
    }
  }

  // Get all products
  async getAllProducts(req, res) {
    try {
      const products = await Product.getAll();
      
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();
