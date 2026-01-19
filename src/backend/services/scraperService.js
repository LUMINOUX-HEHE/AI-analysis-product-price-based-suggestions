const { spawn } = require('child_process');
const path = require('path');

class ScraperService {
  constructor() {
    this.scraperPath = path.join(__dirname, '../../../run_scraper.py');
    // Use the virtual environment Python executable
    const venvPython = path.join(__dirname, '../../../.venv/Scripts/python.exe');
    this.pythonCommand = process.env.PYTHON_COMMAND || venvPython;
    this.scraperTimeout = 60000; // 60 seconds
  }

  /**
   * Trigger the Python scraper to fetch prices for a product
   * @param {Object} product - Product object with name and url
   * @returns {Promise<Object>} Scraping result
   */
  async scrapeProduct(product) {
    return new Promise((resolve, reject) => {
      try {
        console.log('\n[ScraperService] ======== TRIGGERING PYTHON SCRAPER ========');
        console.log('[ScraperService] Product:', product.name);
        console.log('[ScraperService] Python command:', this.pythonCommand);
        console.log('[ScraperService] Scraper path:', this.scraperPath);
        
        const args = [
          this.scraperPath,
          '--product-name', product.name,
          '--endpoint', 'http://localhost:3001/api/scrape'
        ];

        // Don't pass product URL since scraper searches by name
        // If needed, you can add --amazon-url or --flipkart-url for specific URLs

        console.log('[ScraperService] Spawning process with args:', args);
        const scraperProcess = spawn(this.pythonCommand, args, {
          cwd: path.dirname(this.scraperPath)
        });
        console.log('[ScraperService] Scraper process spawned, PID:', scraperProcess.pid);

        let outputData = '';
        let errorData = '';

        scraperProcess.stdout.on('data', (data) => {
          outputData += data.toString();
          console.log('[ScraperService] [STDOUT]', data.toString().trim());
        });

        scraperProcess.stderr.on('data', (data) => {
          errorData += data.toString();
          console.error('[ScraperService] [STDERR]', data.toString().trim());
        });

        scraperProcess.on('close', (code) => {
          console.log('[ScraperService] Scraper process exited with code:', code);
          if (code === 0) {
            console.log('[ScraperService] ✓ Scraper completed successfully');
            resolve({
              success: true,
              message: 'Scraper triggered successfully',
              output: outputData,
              productName: product.name
            });
          } else {
            console.error(`Scraper exited with code ${code}`);
            resolve({
              success: false,
              message: `Scraper exited with code ${code}`,
              error: errorData,
              productName: product.name
            });
          }
        });

        scraperProcess.on('error', (error) => {
          console.error('Failed to start scraper:', error);
          reject({
            success: false,
            message: 'Failed to start scraper',
            error: error.message
          });
        });

        // Set timeout
        const timeout = setTimeout(() => {
          scraperProcess.kill();
          reject({
            success: false,
            message: 'Scraper timeout',
            error: 'Scraper took too long to complete'
          });
        }, this.scraperTimeout);

        scraperProcess.on('close', () => {
          clearTimeout(timeout);
        });

      } catch (error) {
        console.error('Error triggering scraper:', error);
        reject({
          success: false,
          message: 'Error triggering scraper',
          error: error.message
        });
      }
    });
  }

  /**
   * Alternative: Trigger scraper via HTTP if it's running as a service
   * This is useful if the Python scraper is set up as a Flask/FastAPI service
   */
  async scrapeProductViaHttp(product) {
    try {
      const axios = require('axios');
      const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:5000';

      const response = await axios.post(`${scraperUrl}/scrape`, {
        productName: product.name,
        productUrl: product.url
      }, {
        timeout: this.scraperTimeout
      });

      return {
        success: true,
        message: 'Scraper triggered via HTTP',
        data: response.data
      };
    } catch (error) {
      console.error('HTTP scraper request failed:', error);
      return {
        success: false,
        message: 'HTTP scraper request failed',
        error: error.message
      };
    }
  }

  /**
   * Check if Python and required packages are available
   */
  async checkScraperAvailability() {
    return new Promise((resolve) => {
      const checkProcess = spawn(this.pythonCommand, ['--version']);

      checkProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            available: true,
            python: this.pythonCommand,
            scraperPath: this.scraperPath
          });
        } else {
          resolve({
            available: false,
            python: this.pythonCommand,
            scraperPath: this.scraperPath,
            error: 'Python not found or not configured correctly'
          });
        }
      });

      checkProcess.on('error', (error) => {
        resolve({
          available: false,
          python: this.pythonCommand,
          scraperPath: this.scraperPath,
          error: error.message
        });
      });
    });
  }

  /**
   * Wait for scraper to send data back to /scrape endpoint
   * This is a helper method to track scraping progress
   */
  async waitForScraperData(productId, timeout = 60000) {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    return new Promise((resolve) => {
      const checkData = setInterval(async () => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= timeout) {
          clearInterval(checkData);
          resolve({
            success: false,
            message: 'Timeout waiting for scraper data',
            elapsed
          });
        }

        // In a real implementation, you would check the database
        // to see if new price data has been added for this product
        // For now, we'll just resolve after a reasonable time
      }, checkInterval);
    });
  }
}

module.exports = new ScraperService();
