'use client';

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';

/**
 * Example component showing complete integration
 * Frontend → Backend → Scraper → AI → Display
 */
export default function ProductPriceIntelligence() {
  const [productInput, setProductInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const { loading, error, priceData, addProductAndFetchPrices } = useProductPrices();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!productInput.trim()) {
      alert('Please enter a product name');
      return;
    }

    try {
      await addProductAndFetchPrices(productInput, urlInput);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Product Price Intelligence</h1>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            placeholder="e.g., iPhone 15 Pro"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Product URL (Optional)
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Fetching Prices...' : 'Get Price Intelligence'}
        </button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800 font-medium">
            Analyzing prices across platforms...
          </p>
          <p className="text-sm text-blue-600 mt-2">
            This may take 10-30 seconds
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {priceData && !loading && (
        <div className="space-y-6">
          {/* AI Recommendation Banner */}
          {priceData.aiRecommendation && (
            <div className={`rounded-lg p-6 ${
              priceData.aiRecommendation.recommendation === 'Buy Now' 
                ? 'bg-green-50 border-2 border-green-300'
                : 'bg-yellow-50 border-2 border-yellow-300'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    AI Recommendation: {priceData.aiRecommendation.recommendation}
                  </h3>
                  <p className="text-sm font-medium text-gray-700">
                    Best Platform: {priceData.aiRecommendation.bestPlatform}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold ${
                  priceData.aiRecommendation.recommendation === 'Buy Now'
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}>
                  {priceData.aiRecommendation.recommendation}
                </div>
              </div>
              <p className="text-gray-800">
                {priceData.aiRecommendation.summary}
              </p>
            </div>
          )}

          {/* Price Comparison Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-bold">Price Comparison</h3>
              <p className="text-sm text-gray-600">
                Potential Savings: {priceData.comparison.savings} {priceData.prices[0]?.currency || 'USD'}
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Platform</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {priceData.prices && priceData.prices.map((price, index) => (
                  <tr 
                    key={index}
                    className={index === 0 ? 'bg-green-50' : ''}
                  >
                    <td className="px-6 py-4 font-medium">
                      {price.platform}
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-lg font-bold">
                      {price.currency} {price.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(price.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold mb-2">Product Details</h4>
            <p className="text-sm">
              <span className="font-medium">Name:</span> {priceData.product.name}
            </p>
            {priceData.product.url && (
              <p className="text-sm">
                <span className="font-medium">URL:</span>{' '}
                <a href={priceData.product.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {priceData.product.url}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
