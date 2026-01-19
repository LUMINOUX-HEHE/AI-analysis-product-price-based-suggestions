const axios = require('axios');

class OllamaService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'mistral';
  }

  /**
   * Generate AI-powered price analysis and recommendations
   * @param {Object} product - Product information
   * @param {Array} prices - Current prices across platforms
   * @param {Array} history - Price history data
   * @returns {Object} AI-generated insights
   */
  async analyzePrices(product, prices, history) {
    console.log('\n[OllamaService] ======== AI ANALYSIS REQUEST ========');
    console.log('[OllamaService] Product:', product.name);
    console.log('[OllamaService] Current prices count:', prices?.length || 0);
    console.log('[OllamaService] History count:', history?.length || 0);
    
    try {
      if (!prices || prices.length === 0) {
        console.log('[OllamaService] No prices available, using default recommendation');
        return this.getDefaultRecommendation();
      }

      console.log('[OllamaService] Building prompt for AI analysis...');
      const prompt = this.buildPrompt(product, prices, history);
      console.log('[OllamaService] Prompt length:', prompt.length, 'characters');
      
      console.log('[OllamaService] Calling Ollama API:', this.ollamaUrl);
      const response = await this.callOllama(prompt);
      console.log('[OllamaService] Raw response received, length:', response?.length || 0);
      
      console.log('[OllamaService] Parsing AI response...');
      const result = this.parseResponse(response, prices);
      console.log('[OllamaService] \u2713 Analysis complete:', result.recommendation);
      
      return result;
    } catch (error) {
      console.error('[OllamaService] \u2717 AI Analysis failed:', error.message);
      console.log('[OllamaService] Using default recommendation as fallback');
      return this.getDefaultRecommendation();
    }
  }

  /**
   * Build a structured prompt for Ollama Mistral
   */
  buildPrompt(product, prices, history) {
    const priceInfo = prices.map(p => 
      `- ${p.platform}: ${p.currency} ${p.price}`
    ).join('\n');

    let historyInfo = '';
    if (history && history.length > 0) {
      const recentPrices = history.slice(0, 10);
      historyInfo = '\n\nRecent Price History:\n' + recentPrices.map(h => 
        `- ${h.platform}: ${h.currency} ${h.price} (${new Date(h.timestamp).toLocaleDateString()})`
      ).join('\n');
    }

    const lowestPrice = Math.min(...prices.map(p => p.price));
    const highestPrice = Math.max(...prices.map(p => p.price));
    const priceDifference = highestPrice - lowestPrice;

    return `You are a professional retail analyst and price intelligence expert. Analyze the following product data and provide a strategic recommendation.

Product: ${product.name}

Current Market Prices:
${priceInfo}

Highest Price: ${prices[0].currency} ${highestPrice}
Lowest Price: ${prices[0].currency} ${lowestPrice}
Price Gap: ${prices[0].currency} ${priceDifference.toFixed(2)}
${historyInfo}

Strategic Tasks:
1. Identify the BEST_PLATFORM based on total value.
2. Provide a RECOMMENDATION: Choose from: "Strong Buy", "Buy Now", "Wait for Sale", or "Avoid".
3. Provide a CONFIDENCE: Percentage (0-100%).
4. Provide a SUMMARY: A precise 2-sentence market analysis.
5. Provide a WHY: One clear bullet point explaining the primary reason for the recommendation.

Format your response EXACTLY as follows:
BEST_PLATFORM: [platform name]
RECOMMENDATION: [Action category]
CONFIDENCE: [Percentage]%
SUMMARY: [Analysis]
WHY: [Reason]`;
  }

  /**
   * Call Ollama API with the prompt
   */
  async callOllama(prompt) {
    try {
      console.log('[OllamaService] Sending request to Ollama...');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40
        }
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[OllamaService] \u2713 Ollama responded successfully');
      return response.data.response;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('[OllamaService] \u2717 Ollama is not running!');
        throw new Error('Ollama is not running. Please start it with: ollama run mistral');
      }
      console.error('[OllamaService] \u2717 Ollama API error:', error.message);
      throw error;
    }
  }

  /**
   * Parse Ollama's response into structured data
   */
  parseResponse(response, prices) {
    try {
      const bestPlatformMatch = response.match(/BEST_PLATFORM:\s*(.+?)(?:\n|$)/i);
      const recommendationMatch = response.match(/RECOMMENDATION:\s*(.+?)(?:\n|$)/i);
      const confidenceMatch = response.match(/CONFIDENCE:\s*(.+?)(?:\n|$)/i);
      const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?:\n|$)/is);
      const whyMatch = response.match(/WHY:\s*(.+?)(?:\n|$)/is);

      const bestPlatform = bestPlatformMatch ? bestPlatformMatch[1].trim() : this.findCheapestPlatform(prices);
      const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'Buy Now';
      const confidence = confidenceMatch ? confidenceMatch[1].trim() : '85%';
      const summary = summaryMatch ? summaryMatch[1].trim() : this.getDefaultSummary(prices);
      const why = whyMatch ? whyMatch[1].trim() : 'Current market lowest price.';

      return {
        bestPlatform,
        recommendation,
        confidence,
        summary,
        why,
        analysisDate: new Date().toISOString(),
        rawResponse: response
      };
    } catch (error) {
      console.error('Error parsing Ollama response:', error);
      return this.getDefaultRecommendation(prices);
    }
  }

  /**
   * Find the platform with the lowest price
   */
  findCheapestPlatform(prices) {
    if (!prices || prices.length === 0) return 'N/A';
    return prices.reduce((min, p) => p.price < min.price ? p : min).platform;
  }

  /**
   * Generate a default summary when AI is unavailable
   */
  getDefaultSummary(prices) {
    if (!prices || prices.length === 0) {
      return 'No pricing data available yet. Please wait for the scraper to fetch prices.';
    }

    const lowestPrice = Math.min(...prices.map(p => p.price));
    const highestPrice = Math.max(...prices.map(p => p.price));
    const cheapestPlatform = this.findCheapestPlatform(prices);
    const savingsAmount = (highestPrice - lowestPrice).toFixed(2);

    return `Based on current prices, ${cheapestPlatform} offers the best deal. You can save ${prices[0].currency} ${savingsAmount} compared to the highest price. Consider buying from ${cheapestPlatform} to get the best value.`;
  }

  /**
   * Get default recommendation when AI is unavailable
   */
  getDefaultRecommendation(prices = []) {
    return {
      bestPlatform: prices.length > 0 ? this.findCheapestPlatform(prices) : 'N/A',
      recommendation: 'Buy Now',
      confidence: '70%',
      summary: this.getDefaultSummary(prices),
      why: 'Lowest price currently detected in the market.',
      analysisDate: new Date().toISOString(),
      aiAvailable: false
    };
  }

  /**
   * Check if Ollama is running and accessible
   */
  async checkOllamaStatus() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      
      const hasModel = response.data.models.some(m => m.name.includes(this.model));
      
      return {
        available: true,
        modelLoaded: hasModel,
        url: this.ollamaUrl,
        model: this.model
      };
    } catch (error) {
      return {
        available: false,
        modelLoaded: false,
        url: this.ollamaUrl,
        model: this.model,
        error: error.message
      };
    }
  }
}

module.exports = new OllamaService();
