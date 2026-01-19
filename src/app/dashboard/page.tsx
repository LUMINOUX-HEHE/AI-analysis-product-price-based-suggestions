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
  const [searchTerm, setSearchTerm] = useState<string>("");

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
    <div className="min-h-screen pt-20 bg-[#0a0a0a] text-white">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Sidebar - Product List */}
        <div className="w-80 border-r border-border bg-[#0d0d0d] flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold mb-4">Your Products</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Find a product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-border rounded-lg text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {products.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-gray-500 text-sm italic">No products tracked yet.</p>
              </div>
            ) : (
              products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                <button
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                      : 'border-transparent hover:bg-[#151515]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-semibold text-sm line-clamp-2 transition-colors ${
                      selectedProduct?.id === product.id ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${product.prices && product.prices.length > 0 ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                      {product.prices && product.prices.length > 0 ? 'Analyzed' : 'Scraping...'}
                    </span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          
          <div className="p-4 bg-[#0a0a0a] border-t border-border mt-auto">
            <button 
              onClick={() => setProductInput("")} 
              className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all"
            >
              Configure Alerts
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 pb-32">
            {/* Top Bar with Add Product */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  {selectedProduct ? 'Product Insights' : 'Overview'}
                </h1>
                <p className="text-gray-400 text-sm">
                  {selectedProduct ? `Detailed analysis for ${selectedProduct.name}` : `Monitoring ${products.length} items across platforms`}
                </p>
              </div>
              
              <div className="relative group w-full sm:w-80">
                <input 
                  type="text" 
                  placeholder="Paste product name or URL..."
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewProduct()}
                  className="w-full pl-4 pr-32 py-3 bg-[#111] border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
                />
                <button 
                  onClick={addNewProduct}
                  disabled={addingProduct || !productInput.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                >
                  {addingProduct ? <Loader2 size={14} className="animate-spin" /> : <TrendingUpIcon size={14} />}
                  Track
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </div>
                <p className="text-blue-400 text-sm font-medium">{statusMessage}</p>
              </div>
            )}

            {!selectedProduct ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center border border-border shadow-2xl">
                  <AlertCircle size={40} className="text-gray-600" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h2 className="text-2xl font-bold text-gray-200">No Product Selected</h2>
                  <p className="text-gray-500">
                    Select a product from the sidebar or add a new one to see real-time price intelligence and AI recommendations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Data Column */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#111] border border-border rounded-2xl p-6 shadow-sm hover:border-gray-700 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Lowest Price</span>
                        <div className="p-1.5 bg-green-500/10 rounded-lg"><TrendingDown size={14} className="text-green-500" /></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-green-500">
                          {selectedProduct.comparison?.lowestPrice ? `₹${selectedProduct.comparison.lowestPrice}` : '---'}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 capitalize">on {selectedProduct.comparison?.lowestPlatform || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#111] border border-border rounded-2xl p-6 shadow-sm hover:border-gray-700 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Max Potential Savings</span>
                        <div className="p-1.5 bg-blue-500/10 rounded-lg"><TrendingUpIcon size={14} className="text-blue-500" /></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-blue-500">
                          {selectedProduct.comparison?.savings ? `₹${selectedProduct.comparison.savings}` : '₹0'}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">compared to market max</span>
                      </div>
                    </div>

                    <div className="bg-[#111] border border-border rounded-2xl p-6 shadow-sm hover:border-gray-700 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Latest Update</span>
                        <div className="p-1.5 bg-purple-500/10 rounded-lg"><Loader2 size={14} className="text-purple-500" /></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-bold">Just Now</span>
                        <span className="text-[10px] text-gray-500 mt-1">Auto-refresh active</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Chart */}
                  <div className="bg-[#111] border border-border rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8">
                       {loadingPrices && <Loader2 className="animate-spin text-blue-500 opacity-50" size={24} />}
                    </div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                      <h3 className="text-xl font-bold tracking-tight">Price Trend Analysis</h3>
                    </div>
                    
                    <div className="h-[350px]">
                      {priceData.length > 0 ? (
                        <PriceChart data={priceData} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                          <div className="animate-pulse bg-gray-800 h-2 w-48 rounded"></div>
                          <div className="animate-pulse bg-gray-800 h-2 w-32 rounded"></div>
                          <p className="text-sm font-medium">Scraping latest market data...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All Platforms Comparison */}
                  <div className="bg-[#111] border border-border rounded-[2rem] p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold tracking-tight">Market Comparison</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProduct.prices?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-[#161616] border border-border rounded-2xl hover:border-blue-500/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                              item.platform === 'Amazon' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-600/10 text-blue-400'
                            }`}>
                              {item.platform[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-tight">{item.platform}</p>
                              <p className="text-lg font-bold">₹{item.price}</p>
                            </div>
                          </div>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      ))}
                      {!selectedProduct.prices?.length && (
                        <p className="text-gray-600 italic text-sm text-center col-span-2 py-4">Waiting for scraper results...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI & Insights Column */}
                <div className="lg:col-span-4 space-y-6">
                  {/* AI Prediction Card */}
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden shadow-blue-500/10">
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/20 w-fit rounded-full text-xs font-bold uppercase tracking-wider">
                        <TrendingUpIcon size={12} />
                        AI Prediction
                      </div>
                      
                      {selectedProduct.aiRecommendation ? (
                        <>
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Market Recommendation</h4>
                            <div className="flex items-baseline gap-2">
                              <h2 className="text-4xl font-black">{selectedProduct.aiRecommendation.recommendation}</h2>
                              <span className="text-xs font-bold px-2 py-0.5 bg-white/20 rounded-md">
                                {selectedProduct.aiRecommendation.confidence || '85%'} Confidence
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm leading-relaxed font-medium text-blue-50 opacity-90 italic">
                               "{selectedProduct.aiRecommendation.summary}"
                            </p>
                            {selectedProduct.aiRecommendation.why && (
                              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Key Insight</p>
                                <p className="text-xs font-semibold">{selectedProduct.aiRecommendation.why}</p>
                              </div>
                            )}
                          </div>
                          <div className="pt-2 flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/30"></div>
                            <span className="text-[10px] font-bold uppercase opacity-40">Insight generated by Mistral AI</span>
                            <div className="flex-1 h-px bg-white/30"></div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4 py-8 text-center bg-white/5 rounded-2xl border border-white/10">
                          <Loader2 className="animate-spin mx-auto opacity-50" size={32} />
                          <p className="text-sm font-medium opacity-80">Synthesizing market trends...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Consistency */}
                  <div className="bg-[#111] border border-border rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-lg font-bold">Analysis Quality</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-2">
                          <span className="text-gray-400">AI Confidence Score</span>
                          <span className="text-blue-400">{selectedProduct.aiRecommendation?.confidence || '0%'}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                            style={{ width: selectedProduct.aiRecommendation?.confidence || '0%' }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-900/50 rounded-2xl border border-border/50">
                        <p className="text-xs text-gray-400 leading-relaxed italic">
                          {selectedProduct.aiRecommendation?.recommendation === 'Strong Buy' 
                            ? "Market analysis indicates this is a historical low or significantly below average. High recommendation to proceed."
                            : selectedProduct.aiRecommendation?.recommendation === 'Wait for Sale'
                            ? "Current trends suggest a price drop is likely within the next period based on seasonal volatility."
                            : "Standard market price detected. Comparative analysis shows stable trends across most platforms."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recently Viewed */}
                  <div className="bg-[#111] border border-border rounded-[2rem] p-8 hidden lg:block">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-4">Quick Tip</h3>
                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                      <p className="text-xs text-blue-400/80 leading-relaxed">
                        Add more products to see cross-category price trends and get comprehensive market insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

