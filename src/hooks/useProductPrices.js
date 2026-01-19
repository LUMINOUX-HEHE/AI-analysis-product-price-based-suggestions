'use client';

import { useState, useCallback } from 'react';
import ProductAPI from './api';

/**
 * Custom hook for product price intelligence
 * Provides easy-to-use methods for frontend components
 */
export function useProductPrices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [products, setProducts] = useState([]);

  /**
   * Add a product and wait for price data
   */
  const addProductAndFetchPrices = useCallback(async (productName, productUrl = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Add product (triggers scraper)
      const addResult = await ProductAPI.addProduct(productName, productUrl);
      
      if (!addResult.success) {
        throw new Error(addResult.message);
      }

      const productId = addResult.data.id;

      // Step 2: Poll for price data (scraper results)
      const pricesResult = await ProductAPI.pollForPrices(productId, true, 30, 2000);

      setPriceData(pricesResult.data);
      setLoading(false);
      
      return pricesResult.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get prices for an existing product
   */
  const fetchPrices = useCallback(async (identifier, useId = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ProductAPI.getPricesWithAI(identifier, useId);
      setPriceData(result.data);
      setLoading(false);
      return result.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Load all products
   */
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ProductAPI.getAllProducts();
      setProducts(result.data || []);
      setLoading(false);
      return result.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get price history for charts
   */
  const fetchHistory = useCallback(async (identifier, useId = true, platform = null, limit = 50) => {
    try {
      const result = await ProductAPI.getPriceHistory(identifier, useId, platform, limit);
      return result.data;
    } catch (err) {
      console.error('Fetch history error:', err);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    priceData,
    products,
    addProductAndFetchPrices,
    fetchPrices,
    loadProducts,
    fetchHistory
  };
}

/**
 * Hook for backend health check
 */
export function useBackendHealth() {
  const [healthy, setHealthy] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const result = await ProductAPI.checkHealth();
      setHealthy(result.success);
      return result;
    } catch (err) {
      setHealthy(false);
      throw err;
    } finally {
      setChecking(false);
    }
  }, []);

  return { healthy, checking, checkHealth };
}
