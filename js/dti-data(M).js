/**
 * DTI Backtester - Data Module (modified for CSV files)
 * Handles data management, fetching, and processing
 */

window.DTIData = (function() {
    // Data caching
    const dataCache = new Map();
    
    // Constants
    const MAX_RETRIES = 3;
    const CONCURRENT_REQUESTS_LIMIT = 2;
    
    /**
     * Get the current stock list based on selection
     * (unchanged from original)
     */
    async function getCurrentStockList() {
        // Original code...
    }
    
    // Other unchanged methods...
    
    /**
     * Fetch historical data from local CSV first, fallback to Yahoo Finance API
     * @param {string} symbol - Stock symbol
     * @param {string} period - Time period (e.g. '5y')
     * @param {string} interval - Data interval (e.g. '1d')
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Array>} - Array of price data
     */
    async function fetchStockData(symbol, period = '5y', interval = '1d', retryCount = 0) {
        // Check cache first
        const cacheKey = `${symbol}_${period}_${interval}`;
        if (dataCache.has(cacheKey)) {
            return dataCache.get(cacheKey);
        }
        
        // Update status element
        const statusElement = document.getElementById('data-fetch-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="data-fetch-loading">
                    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                    Fetching data for ${symbol}...
                </div>
            `;
            statusElement.style.display = 'block';
        }
        
        try {
            // First try to load from local CSV
            const csvData = await loadLocalCSV(symbol);
            
            if (csvData) {
                // Update status on success
                if (statusElement) {
                    statusElement.innerHTML = `
                        <div class="data-fetch-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Data loaded from local storage for ${symbol}
                        </div>
                    `;
                    
                    // Hide after 3 seconds
                    setTimeout(() => {
                        statusElement.style.display = 'none';
                    }, 3000);
                }
                
                // Store in cache
                dataCache.set(cacheKey, csvData);
                
                return csvData;
            }
            
            // If local CSV not available, fallback to Yahoo Finance API
            console.log(`Local CSV not available for ${symbol}, fetching from API...`);
            
            // Original Yahoo Finance fetch code...
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=${interval}&includePrePost=false`;
            
            const response = await fetch(proxyUrl + yahooUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            // Rest of original API fetch code...
            
        } catch (error) {
            console.error('Error fetching stock data:', error);
            
            // Update status on error
            // Original error handling code...
            
            // Retry logic
            // Original retry logic...
        }
    }
    
    /**
     * Load data from local CSV file
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Array|null>} - CSV data or null if not available
     */
    async function loadLocalCSV(symbol) {
        try {
            // Determine which folder to look in based on symbol
            let folder = '';
            if (symbol.endsWith('.NS')) {
                folder = 'nifty50/'; // Or use logic to determine correct Indian index
            } else if (symbol.endsWith('.L')) {
                folder = 'ftse100/'; // Or use logic for UK stocks
            } else {
                folder = 'us_stocks/';
            }
            
            const csvPath = `/DATA/${folder}${symbol}.csv`;
            
            // Fetch the CSV file
            const response = await fetch(csvPath);
            
            if (!response.ok) {
                // File doesn't exist or other error
                return null;
            }
            
            const csvText = await response.text();
            
            // Parse CSV
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',');
            const data = [headers];
            
            for (let i = 1; i < lines.length; i++) {
                data.push(lines[i].split(','));
            }
            
            return data;
        } catch (error) {
            console.warn(`Error loading local CSV for ${symbol}:`, error);
            return null;
        }
    }
    
    // Other functions remain the same...
    
    // Return public API
    return {
        // Existing methods...
        fetchStockData,
        loadLocalCSV,
        // Other methods...
    };
})();