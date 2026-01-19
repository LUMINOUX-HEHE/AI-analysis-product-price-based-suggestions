const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { body } = require('express-validator');

// Validation middleware
const addProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid URL format')
];

const scrapeDataValidation = [
  body('productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('platform')
    .trim()
    .notEmpty()
    .withMessage('Platform is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
];

// Routes
router.post('/add-product', addProductValidation, productController.addProduct);
router.get('/get-prices', productController.getLatestPrices);
router.get('/get-history', productController.getPriceHistory);
router.post('/scrape', scrapeDataValidation, productController.receiveScrapedData);
router.get('/ai-summary', productController.getAISummary);
router.get('/products', productController.getAllProducts);

module.exports = router;
