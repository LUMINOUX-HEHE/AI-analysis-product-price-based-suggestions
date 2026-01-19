"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { ExternalLink, TrendingDown, TrendingUp as TrendingUpIcon, AlertCircle, Loader2, Search } from "lucide-react";

// Dynamically import the chart component to avoid Webpack/SSR issues
const PriceChart = dynamic(() => import("@/components/PriceChart"), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-gray-500">Loading chart...</div>
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Product {
  id: number;
  name: string;
  url: string;
  created_at: string;
  prices?: any[];
  comparison?: any;
  aiRecommendation?: any;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [productInput, setProductInput] = useState<string>("");
  const [addingProduct, setAddingProduct] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load all products on mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Poll for prices if none available
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedProduct && (!priceData || priceData.length === 0)) {
      interval = setInterval(() => {
        fetchProductPrices(selectedProduct.id);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedProduct, priceData]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Dashboard] Fetching all products...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      console.log('[Dashboard] Products fetched:', data);
      
      if (data.success) {
        setProducts(data.data || []);
        
        // Auto-select first product if available
        if (data.data && data.data.length > 0 && !selectedProduct) {
          selectProduct(data.data[0]);
        }
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching products:', err);
      setError('Failed to connect to backend. Make sure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = async (product: Product) => {
    console.log('[Dashboard] Selecting product:', product.name);
    setSelectedProduct(product);
    await fetchProductPrices(product.id);
  };

  const fetchProductPrices = async (productId: number) => {
    try {
      setLoadingPrices(true);
      console.log('[Dashboard] Fetching prices for product:', productId);
      
      const response = await fetch(`${API_BASE_URL}/get-prices?productId=${productId}`);
      const data = await response.json();
      
      console.log('[Dashboard] Price data:', data);
      
      if (data.success && data.data) {
        // Format price history for chart
        const history = data.data.priceHistory || [];
        const chartData = history.map((item: any) => ({
          date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          [item.platform.toLowerCase()]: item.price,
          timestamp: item.timestamp
        }));
        
        setPriceData(chartData);
        
        // Update selected product with latest price info
        setSelectedProduct(prev => {
          if (!prev) return null;
          return {
            ...prev,
            prices: data.data.prices || [],
            comparison: data.data.comparison || {},
            aiRecommendation: data.data.aiRecommendation || null
          };
        });
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching prices:', err);
    } finally {
      setLoadingPrices(false);
    }
  };

  const addNewProduct = async () => {
    if (!productInput.trim()) {
      alert('Please enter a product name');
      return;
    }
    
    try {
      setAddingProduct(true);
      setStatusMessage('Adding product...');
      console.log('[Dashboard] Adding new product:', productInput);
      console.log('[Dashboard] API URL:', `${API_BASE_URL}/add-product`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_BASE_URL}/add-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: productInput,
          url: `https://www.amazon.com/s?k=${encodeURIComponent(productInput)}`
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('[Dashboard] Response status:', response.status);
      const data = await response.json();
      console.log('[Dashboard] Add product response:', data);
      
      if (data.success) {
        setStatusMessage('✅ Product added! Scraper is running...');
        setProductInput("");
        
        // Refresh product list immediately, then again shortly
        await fetchAllProducts();
        
        setTimeout(() => {
          setStatusMessage(null);
          fetchAllProducts();
        }, 10000);
      } else {
        setStatusMessage(null);
        alert('⚠️ ' + (data.message || 'Failed to add product'));
      }
    } catch (err) {
      console.error('[Dashboard] Error adding product:', err);
      setStatusMessage(null);
      
      if (err instanceof Error && err.name === 'AbortError') {
        alert('❌ Request timed out. The backend might be slow or not responding.');
      } else {
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert('❌ Network error: ' + errorMessage + '\n\nMake sure the backend server is running on port 3001.');
      }
    } finally {
      setAddingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 lg:px-12 bg-[#0a0a0a] flex items-center justify-center">
        <Header />
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 lg:px-12 bg-[#0a0a0a]">
        <Header />
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-red-500 mb-2">Connection Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={fetchAllProducts}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 lg:px-12 bg-[#0a0a0a]">
      <Header />
      
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Price Dashboard</h1>
            <p className="text-gray-400">
              {products.length > 0 
                ? `Monitoring ${products.length} product${products.length > 1 ? 's' : ''}`
                : 'No products yet. Add one to start tracking!'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 flex items-center px-4 bg-[#141414] border border-border rounded-xl">
              <Search className="text-gray-500 mr-2" size={18} />
              <input 
                type="text" 
                placeholder="Product name..."
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNewProduct()}
                className="bg-transparent border-none focus:outline-none py-2.5 text-white placeholder:text-gray-600 w-48"
              />
            </div>
            <button 
              onClick={addNewProduct}
              disabled={addingProduct || !productInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              {addingProduct ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Adding...
                </>
              ) : (
                '+ Add Product'
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-400 text-sm flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            {statusMessage}
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-[#141414] border border-border rounded-3xl p-12 text-center">
            <AlertCircle className="text-gray-600 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
            <p className="text-gray-400 mb-6">Add a product above to start tracking prices!</p>
          </div>
        ) : (
          <>
            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#141414] border border-border rounded-3xl p-6 lg:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-semibold">
                    Price Trends {selectedProduct && `(${selectedProduct.name})`}
                  </h3>
                  {loadingPrices && (
                    <Loader2 className="animate-spin text-blue-500" size={20} />
                  )}
                </div>
                
                {priceData.length > 0 ? (
                  <PriceChart data={priceData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <AlertCircle className="mx-auto mb-3" size={32} />
                      <p>No price data available yet.</p>
                      <p className="text-sm mt-2">The scraper is fetching prices...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#141414] border border-border rounded-3xl p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Recommendation</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {selectedProduct?.aiRecommendation 
                      ? 'Based on historical data and current analysis' 
                      : 'AI analysis will appear when price data is available'}
                  </p>
                  
                  {selectedProduct?.aiRecommendation && !selectedProduct.aiRecommendation.error ? (
                    <div className={`${
                      selectedProduct.aiRecommendation.recommendation === 'Buy Now' 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-yellow-500/10 border-yellow-500/20'
                    } border rounded-2xl p-4 flex items-start gap-4 mb-4`}>
                      {selectedProduct.aiRecommendation.recommendation === 'Buy Now' ? (
                        <TrendingDown className="text-green-500 mt-1" size={24} />
                      ) : (
                        <TrendingUpIcon className="text-yellow-500 mt-1" size={24} />
                      )}
                      <div>
                        <h4 className={`font-bold ${
                          selectedProduct.aiRecommendation.recommendation === 'Buy Now' 
                            ? 'text-green-500' 
                            : 'text-yellow-500'
                        }`}>
                          {selectedProduct.aiRecommendation.recommendation}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedProduct.aiRecommendation.summary || 'No summary available'}
                        </p>
                        {selectedProduct.aiRecommendation.bestPlatform && (
                          <p className="text-xs text-gray-500 mt-2">
                            Best on: <span className="text-blue-400">{selectedProduct.aiRecommendation.bestPlatform}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : selectedProduct?.aiRecommendation?.error ? (
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-2xl p-4">
                      <p className="text-sm text-gray-400">
                        AI analysis unavailable. {selectedProduct.aiRecommendation.message || 'Ollama might not be running.'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-2xl p-4">
                      <Loader2 className="animate-spin text-gray-500 mb-2" size={20} />
                      <p className="text-sm text-gray-400">Waiting for price data...</p>
                    </div>
                  )}
                </div>

                {selectedProduct?.comparison && (
                  <div className="pt-6 border-t border-border mt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Lowest Price</span>
                        <span className="font-semibold text-green-500">
                          ${selectedProduct.comparison.lowestPrice || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Highest Price</span>
                        <span className="font-semibold text-red-500">
                          ${selectedProduct.comparison.highestPrice || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">You Save</span>
                        <span className="font-bold text-blue-500">
                          ${selectedProduct.comparison.savings || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#141414] border border-border rounded-3xl p-6 lg:p-8">
              <h3 className="text-xl font-semibold mb-6">Tracked Products</h3>
              <div className="space-y-4">
                {products.map((product: Product) => (
                  <div 
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-border hover:border-gray-600 bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Added {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <button className="text-blue-500 hover:text-blue-400 text-sm font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}