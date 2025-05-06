/**
 * DTI Backtester - Data Module (Enhanced for Phase 2)
 * Handles data management, fetching, and processing
 * 
 * Dependencies:
 * - dti-stock-lists.js must be loaded before this file
 */

// Create DTIData module
window.DTIData = (function() {
    // Data caching with timestamp and metadata
    const DataCache = {
        cache: new Map(),
        
        // Get data from cache
        get(key) {
            if (!this.cache.has(key)) return null;
            
            const cachedData = this.cache.get(key);
            // Check if data is stale (older than 24 hours)
            if (Date.now() - cachedData.timestamp > 24 * 60 * 60 * 1000) {
                // Data is stale, trigger background refresh
                this.refreshData(key);
                // Return stale data while refresh happens in background
                return cachedData.data;
            }
            
            return cachedData.data;
        },
        
        // Store data in cache
        set(key, data, source = 'unknown') {
            this.cache.set(key, {
                data: data,
                timestamp: Date.now(),
                source: source
            });
        },
        
        // Background refresh for stale data
        async refreshData(key) {
            // Extract symbol and params from key
            const [symbol, period, interval] = key.split('_');
            
            console.log(`Background refreshing data for ${symbol}...`);
            
            try {
                // Attempt to fetch fresh data (bypassing cache)
                const freshData = await fetchStockData(symbol, period, interval, 0, true);
                
                if (freshData) {
                    console.log(`Successfully refreshed data for ${symbol}`);
                    this.set(key, freshData);
                }
            } catch (error) {
                console.warn(`Background refresh failed for ${symbol}:`, error);
                // Keep using stale data, no need to update cache
            }
        },
        
        // Get cache stats
        getStats() {
            let csvCount = 0;
            let apiCount = 0;
            let total = 0;
            
            this.cache.forEach(entry => {
                total++;
                if (entry.source === 'csv') csvCount++;
                else if (entry.source === 'api') apiCount++;
            });
            
            return {
                total,
                csvCount,
                apiCount,
                otherCount: total - csvCount - apiCount
            };
        },
        
        // Clear cache
        clear() {
            this.cache.clear();
            console.log("Data cache cleared");
        }
    };
    
    // Constants
    const MAX_RETRIES = 3;
    const CONCURRENT_REQUESTS_LIMIT = 2; // Limit for concurrent API requests
    
    // Debugging flag
    let DEBUG_MODE = false;
    
    /**
     * Toggle debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    function setDebugMode(enabled) {
        DEBUG_MODE = enabled;
        console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
        
        // Create or remove the debug panel
        if (enabled) {
            createDebugPanel();
        } else {
            const existingPanel = document.getElementById('dti-debug-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
        }
    }
    
    /**
     * Create a debug panel for diagnosing issues
     */
    function createDebugPanel() {
        // Remove any existing panel
        const existingPanel = document.getElementById('dti-debug-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Create the panel
        const panel = document.createElement('div');
        panel.id = 'dti-debug-panel';
        panel.className = 'dti-debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 400px;
            max-height: 400px;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid #555;
            padding-bottom: 5px;
        `;
        header.innerHTML = `
            <h3 style="margin: 0; color: #4caf50;">DTI Debug Panel</h3>
            <div>
                <button id="debug-close-btn" style="background: #f44336; border: none; color: white; padding: 2px 5px; border-radius: 3px; cursor: pointer;">X</button>
            </div>
        `;
        panel.appendChild(header);
        
        // Create content area
        const content = document.createElement('div');
        content.id = 'debug-content';
        content.style.cssText = `
            flex: 1;
            overflow: auto;
        `;
        panel.appendChild(content);
        
        // Create controls
        const controls = document.createElement('div');
        controls.style.cssText = `
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid #555;
            display: flex;
            gap: 5px;
        `;
        controls.innerHTML = `
            <input type="text" id="debug-symbol" placeholder="Symbol (e.g., AAPL)" style="flex: 1; padding: 5px;">
            <button id="debug-test-csv-btn" style="background: #2196f3; border: none; color: white; padding: 5px; border-radius: 3px; cursor: pointer;">Test CSV</button>
            <button id="debug-clear-btn" style="background: #ff9800; border: none; color: white; padding: 5px; border-radius: 3px; cursor: pointer;">Clear</button>
        `;
        panel.appendChild(controls);
        
        // Add to the page
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('debug-close-btn').addEventListener('click', () => {
            setDebugMode(false);
        });
        
        document.getElementById('debug-clear-btn').addEventListener('click', () => {
            document.getElementById('debug-content').innerHTML = '';
        });
        
        document.getElementById('debug-test-csv-btn').addEventListener('click', () => {
            const symbol = document.getElementById('debug-symbol').value;
            if (symbol) {
                testCSVAccess(symbol);
            } else {
                logDebug('Please enter a symbol', 'error');
            }
        });
        
        // Show initial info
        logDebug('Debug panel initialized. Cache stats: ' + JSON.stringify(DataCache.getStats()), 'info');
    }
    
    /**
     * Log a message to the debug panel
     * @param {string} message - Message to log
     * @param {string} level - Log level (info, warning, error, success)
     */
    function logDebug(message, level = 'info') {
        if (!DEBUG_MODE) return;
        
        const content = document.getElementById('debug-content');
        if (!content) return;
        
        const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
        const colorMap = {
            info: '#2196f3',
            warning: '#ff9800',
            error: '#f44336',
            success: '#4caf50'
        };
        
        const logItem = document.createElement('div');
        logItem.style.cssText = `
            margin-bottom: 5px;
            padding: 3px;
            border-left: 3px solid ${colorMap[level] || '#ccc'};
            padding-left: 5px;
            font-size: 11px;
        `;
        logItem.innerHTML = `<span style="color: #aaa;">[${timestamp}]</span> <span style="color: ${colorMap[level] || '#fff'}">${message}</span>`;
        
        content.appendChild(logItem);
        content.scrollTop = content.scrollHeight;
    }
    
    /**
     * Test file access for a specific symbol
     * @param {string} symbol - Symbol to test
     */
    async function testCSVAccess(symbol) {
        logDebug(`Testing CSV access for ${symbol}...`, 'info');
        
        // Determine the folder based on symbol
        let folder = determineSymbolFolder(symbol);
        logDebug(`Determined folder: ${folder}`, 'info');
        
        // Try multiple path formats
        const paths = [
            `./DATA/${folder}/${symbol}.csv`,
            `/DATA/${folder}/${symbol}.csv`,
            `../DATA/${folder}/${symbol}.csv`,
            `/Users/soonjeongguan/Desktop/Repository/BT/DATA/${folder}/${symbol}.csv`
        ];
        
        let success = false;
        
        for (const path of paths) {
            try {
                logDebug(`Trying path: ${path}`, 'info');
                
                const response = await fetchWithTimeout(path, {
                    timeout: 3000,
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    const text = await response.text();
                    const lines = text.trim().split('\n');
                    logDebug(`Success! Found ${lines.length} lines of data at ${path}`, 'success');
                    
                    // Show a sample of the data
                    if (lines.length > 1) {
                        logDebug(`Headers: ${lines[0]}`, 'info');
                        if (lines.length > 2) {
                            logDebug(`First data row: ${lines[1]}`, 'info');
                        }
                    }
                    
                    success = true;
                    break;
                } else {
                    logDebug(`Failed to access ${path}: ${response.status} ${response.statusText}`, 'warning');
                }
            } catch (error) {
                logDebug(`Error accessing ${path}: ${error.message}`, 'error');
            }
        }
        
        if (!success) {
            logDebug(`Failed to access CSV file for ${symbol} with any path`, 'error');
            
            // Try to check if directory exists
            try {
                const dirPath = `/Users/soonjeongguan/Desktop/Repository/BT/DATA/${folder}`;
                const response = await fetchWithTimeout(dirPath, { timeout: 1000 });
                logDebug(`Directory check: ${response.ok ? 'Exists' : 'Not found'}`, 'info');
            } catch (error) {
                logDebug(`Directory check failed: ${error.message}`, 'warning');
            }
        }
        
        return success;
    }
    
    /**
     * Fetch with timeout
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} - Promise that resolves to the fetch result
     */
    function fetchWithTimeout(url, options = {}) {
        const { timeout = 8000, ...fetchOptions } = options;
        
        return Promise.race([
            fetch(url, fetchOptions),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
            )
        ]);
    }
    
    /**
     * Determine folder for a symbol
     * @param {string} symbol - Stock symbol
     * @returns {string} - Folder name
     */
    function determineSymbolFolder(symbol) {
        // More comprehensive symbol mapping
        if (symbol.endsWith('.NS')) {
            // Indian stocks
            if (symbol.startsWith('NIFTY') || symbol.includes('NSEI')) {
                return 'nifty50'; // Index values
            }
            
            // Check current stock lists to determine exact index folder
            const allStockLists = DTIStockLists.getAllStockLists();
            
            if (allStockLists) {
                if (allStockLists.nifty50 && allStockLists.nifty50.some(s => s.symbol === symbol)) {
                    return 'nifty50';
                }
                if (allStockLists.niftyNext50 && allStockLists.niftyNext50.some(s => s.symbol === symbol)) {
                    return 'niftyNext50';
                }
                if (allStockLists.niftyMidcap150 && allStockLists.niftyMidcap150.some(s => s.symbol === symbol)) {
                    return 'niftyMidcap150';
                }
            }
            
            // Default to nifty50 if we can't determine
            return 'nifty50';
        } 
        else if (symbol.endsWith('.L')) {
            // UK stocks
            const allStockLists = DTIStockLists.getAllStockLists();
            
            if (allStockLists) {
                if (allStockLists.ftse100 && allStockLists.ftse100.some(s => s.symbol === symbol)) {
                    return 'ftse100';
                }
                if (allStockLists.ftse250 && allStockLists.ftse250.some(s => s.symbol === symbol)) {
                    return 'ftse250';
                }
            }
            
            // Default
            return 'ftse100';
        } 
        else {
            // US stocks or others
            const allStockLists = DTIStockLists.getAllStockLists();
            
            if (allStockLists) {
                if (allStockLists.usStocks && allStockLists.usStocks.some(s => s.symbol === symbol)) {
                    return 'us_stocks';
                }
                if (allStockLists.usSmallCap && allStockLists.usSmallCap.some(s => s.symbol === symbol)) {
                    return 'us_small_cap';
                }
                if (allStockLists.usMidCap && allStockLists.usMidCap.some(s => s.symbol === symbol)) {
                    return 'us_mid_cap';
                }
            }
            
            // Default
            return 'us_stocks';
        }
    }
    
    /**
     * Get the current stock list based on selection
     * @returns {Promise<Array>} Promise resolving to list of stock objects
     */
    async function getCurrentStockList() {
        try {
            // Get stock list using async API
            return await DTIStockLists.loadStockList(DTIBacktester.currentStockIndex);
        } catch (error) {
            console.error('Error loading current stock list:', error);
            // Fallback to sync API in case of error
            return DTIStockLists.getStockListById(DTIBacktester.currentStockIndex);
        }
    }
    
    /**
     * Sync version of getCurrentStockList for backward compatibility
     * @returns {Array} List of stock objects
     */
    function getCurrentStockListSync() {
        try {
            const stockList = DTIStockLists.getStockListById(DTIBacktester.currentStockIndex);
            // Ensure we return an array
            if (!Array.isArray(stockList)) {
                console.warn('Stock list is not an array, returning empty array');
                return [];
            }
            return stockList;
        } catch (error) {
            console.error('Error getting stock list:', error);
            return [];
        }
    }
    
    /**
     * Get stock lists for multi-index scan
     * @param {string} scanType - Type of scan to perform
     * @returns {Promise<Array>} Promise resolving to combined list of stock objects
     */
    async function getStocksForScanType(scanType) {
        if (typeof DTIUI !== 'undefined' && DTIUI.getStocksForSelectedScanType) {
            return DTIUI.getStocksForSelectedScanType();
        }
        
        if (scanType === 'current') {
            return await getCurrentStockList();
        } else {
            return await DTIStockLists.getStocksForScanType(scanType);
        }
    }
    
    /**
     * Sync version of getStocksForScanType for backward compatibility
     * @param {string} scanType - Type of scan to perform
     * @returns {Array} Combined list of stock objects
     */
    function getStocksForScanTypeSync(scanType) {
        try {
            if (typeof DTIUI !== 'undefined' && DTIUI.getStocksForSelectedScanType) {
                const result = DTIUI.getStocksForSelectedScanType();
                return Array.isArray(result) ? result : [];
            }
            
            if (scanType === 'current') {
                return getCurrentStockListSync();
            } else {
                const syncLists = DTIStockLists.getAllStockLists() || {};
                
                // Helper function to ensure we're working with arrays
                const safeList = (list) => Array.isArray(list) ? list : [];
                
                switch(scanType) {
                    case 'all':
                        return [
                            ...safeList(syncLists.nifty50),
                            ...safeList(syncLists.niftyNext50),
                            ...safeList(syncLists.niftyMidcap150),
                            ...safeList(syncLists.ftse100),
                            ...safeList(syncLists.ftse250),
                            ...safeList(syncLists.usStocks),
                            ...safeList(syncLists.usSmallCap),
                            ...safeList(syncLists.usMidCap)
                        ];
                    case 'indian':
                        return [
                            ...safeList(syncLists.nifty50),
                            ...safeList(syncLists.niftyNext50),
                            ...safeList(syncLists.niftyMidcap150)
                        ];
                    case 'uk':
                        return [
                            ...safeList(syncLists.ftse100),
                            ...safeList(syncLists.ftse250)
                        ];
                    case 'us':
                        return [
                            ...safeList(syncLists.usStocks),
                            ...safeList(syncLists.usSmallCap),
                            ...safeList(syncLists.usMidCap)
                        ];
                    default:
                        return [];
                }
            }
        } catch (error) {
            console.error('Error in getStocksForScanTypeSync:', error);
            return [];
        }
    }
    
    /**
     * Helper function to deduplicate stocks in combined lists
     * @param {Array} stockList - Combined list of stock objects
     * @returns {Array} Deduplicated list of stock objects
     */
    function deduplicateStocks(stockList) {
        const symbolSet = new Set();
        const uniqueStocks = [];
        
        for (const stock of stockList) {
            if (!symbolSet.has(stock.symbol)) {
                symbolSet.add(stock.symbol);
                uniqueStocks.push(stock);
            }
        }
        
        return uniqueStocks;
    }
    
    /**
     * Enhanced function to load data from local CSV file
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Array|null>} - CSV data or null if not available
     */
    async function loadLocalCSV(symbol, bypassCache = false) {
        try {
            if (DEBUG_MODE) {
                logDebug(`Attempting to load CSV for ${symbol}`, 'info');
            }
            
            // Determine folder based on symbol
            const folder = determineSymbolFolder(symbol);
            
            // Try multiple path formats to handle different server configurations
            const possiblePaths = [
                `./DATA/${folder}/${symbol}.csv`,
                `/DATA/${folder}/${symbol}.csv`,
                `../DATA/${folder}/${symbol}.csv`,
                `/Users/soonjeongguan/Desktop/Repository/BT/DATA/${folder}/${symbol}.csv`
            ];
            
            // Try each path until one works
            for (const path of possiblePaths) {
                try {
                    if (DEBUG_MODE) {
                        logDebug(`Trying path: ${path}`, 'info');
                    }
                    
                    const response = await fetchWithTimeout(path, { 
                        timeout: 5000,
                        cache: bypassCache ? 'no-cache' : 'default',
                        headers: bypassCache ? { 'Cache-Control': 'no-cache' } : {}
                    });
                    
                    if (response.ok) {
                        if (DEBUG_MODE) {
                            logDebug(`Successfully loaded from: ${path}`, 'success');
                        }
                        
                        const csvText = await response.text();
                        return parseCSVText(csvText, symbol);
                    }
                } catch (pathError) {
                    if (DEBUG_MODE) {
                        logDebug(`Failed to load from path ${path}: ${pathError.message}`, 'warning');
                    }
                    // Continue to next path
                }
            }
            
            // All paths failed
            if (DEBUG_MODE) {
                logDebug(`All paths failed for ${symbol}`, 'error');
            }
            
            return null;
        } catch (error) {
            console.warn(`Error in loadLocalCSV for ${symbol}:`, error);
            if (DEBUG_MODE) {
                logDebug(`Error in loadLocalCSV: ${error.message}`, 'error');
            }
            return null;
        }
    }
    
    /**
     * Parse CSV text into a structured format
     * @param {string} csvText - Raw CSV text
     * @param {string} symbol - Stock symbol for debugging
     * @returns {Array|null} - Parsed data or null if invalid
     */
    function parseCSVText(csvText, symbol) {
        try {
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                if (DEBUG_MODE) {
                    logDebug(`CSV for ${symbol} contains insufficient data (${lines.length} lines)`, 'error');
                }
                return null;
            }
            
            // Parse headers
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Validate required columns
            const requiredColumns = ['date', 'open', 'high', 'low', 'close'];
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            
            if (missingColumns.length > 0) {
                if (DEBUG_MODE) {
                    logDebug(`CSV for ${symbol} missing required columns: ${missingColumns.join(', ')}`, 'error');
                }
                return null;
            }
            
            // Extract column indices
            const dateIndex = headers.indexOf('date');
            const openIndex = headers.indexOf('open');
            const highIndex = headers.indexOf('high');
            const lowIndex = headers.indexOf('low');
            const closeIndex = headers.indexOf('close');
            
            // Parse data rows
            const data = [headers];
            let validRows = 0;
            let invalidRows = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) {
                    invalidRows++;
                    continue; // Skip empty lines
                }
                
                const values = line.split(',');
                
                // Skip rows with insufficient data
                if (values.length <= Math.max(dateIndex, openIndex, highIndex, lowIndex, closeIndex)) {
                    invalidRows++;
                    continue;
                }
                
                // Validate the date
                const dateStr = values[dateIndex];
                if (!dateStr) {
                    invalidRows++;
                    continue;
                }
                
                // Try to parse numeric values
                try {
                    const open = parseFloat(values[openIndex]);
                    const high = parseFloat(values[highIndex]);
                    const low = parseFloat(values[lowIndex]);
                    const close = parseFloat(values[closeIndex]);
                    
                    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
                        invalidRows++;
                        continue;
                    }
                    
                    // Valid row
                    data.push(values);
                    validRows++;
                } catch (error) {
                    invalidRows++;
                    continue;
                }
            }
            
            // Log statistics if in debug mode
            if (DEBUG_MODE) {
                logDebug(`CSV parsing for ${symbol}: ${validRows} valid, ${invalidRows} invalid rows`, 'info');
            }
            
            // Check if we have enough valid data
            if (validRows < 5) {
                if (DEBUG_MODE) {
                    logDebug(`CSV for ${symbol} contains too few valid rows (${validRows})`, 'error');
                }
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Error parsing CSV:', error);
            if (DEBUG_MODE) {
                logDebug(`Error parsing CSV: ${error.message}`, 'error');
            }
            return null;
        }
    }
    
    /**
     * Fetch historical data from local CSV first, fallback to Yahoo Finance API
     * @param {string} symbol - Stock symbol
     * @param {string} period - Time period (e.g. '5y')
     * @param {string} interval - Data interval (e.g. '1d')
     * @param {number} retryCount - Current retry attempt
     * @param {boolean} bypassCache - Whether to bypass the cache
     * @returns {Promise<Array>} - Array of price data
     */
    async function fetchStockData(symbol, period = '5y', interval = '1d', retryCount = 0, bypassCache = false) {
        // Check cache first (unless bypassing)
        const cacheKey = `${symbol}_${period}_${interval}`;
        if (!bypassCache) {
            const cachedData = DataCache.get(cacheKey);
            if (cachedData) {
                if (DEBUG_MODE) {
                    logDebug(`Retrieved ${symbol} from cache`, 'info');
                }
                return cachedData;
            }
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
            if (DEBUG_MODE) {
                logDebug(`Attempting to load ${symbol} from local CSV`, 'info');
            }
            
            const csvData = await loadLocalCSV(symbol, bypassCache);
            
            if (csvData && csvData.length > 0) {
                // Update status on success
                if (statusElement) {
                    statusElement.innerHTML = `
                        <div class="data-fetch-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Data loaded from local CSV for ${symbol}
                        </div>
                    `;
                    
                    // Hide after 3 seconds
                    setTimeout(() => {
                        statusElement.style.display = 'none';
                    }, 3000);
                }
                
                if (DEBUG_MODE) {
                    logDebug(`Successfully loaded ${symbol} from local CSV (${csvData.length} rows)`, 'success');
                }
                
                // Store in cache
                DataCache.set(cacheKey, csvData, 'csv');
                
                return csvData;
            }
            
            // If local CSV not available, fallback to Yahoo Finance API
            if (DEBUG_MODE) {
                logDebug(`Local CSV not available for ${symbol}, falling back to API`, 'warning');
            } else {
                console.log(`Local CSV not available for ${symbol}, fetching from API...`);
            }
            
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=${interval}&includePrePost=false`;
            
            const response = await fetchWithTimeout(proxyUrl + yahooUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                timeout: 10000 // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error('No data received from Yahoo Finance');
            }
            
            // Update status on success
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="data-fetch-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Data fetched from API for ${symbol}
                </div>
            `;
                
                // Hide after 3 seconds
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 3000);
            }
            
            if (DEBUG_MODE) {
                logDebug(`Successfully fetched ${symbol} from API`, 'success');
            }
            
            const processedData = processYahooFinanceData(data);
            
            // Store in cache
            DataCache.set(cacheKey, processedData, 'api');
            
            // Also save to local file system if possible (would require server-side script)
            if (typeof saveDataToCSV === 'function') {
                saveDataToCSV(symbol, processedData).catch(error => {
                    console.warn(`Failed to save data for ${symbol} to CSV:`, error);
                });
            }
            
            return processedData;
            
        } catch (error) {
            console.error('Error fetching stock data:', error);
            
            if (DEBUG_MODE) {
                logDebug(`Error fetching ${symbol}: ${error.message}`, 'error');
            }
            
            // Update status on error
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="data-fetch-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Error fetching data for ${symbol}: ${error.message}
                    </div>
                `;
            }
            
            // Implement retry logic
            if (retryCount < MAX_RETRIES) {
                if (DEBUG_MODE) {
                    logDebug(`Retrying ${symbol} (${retryCount + 1}/${MAX_RETRIES})`, 'warning');
                } else {
                    console.log(`Retrying fetch for ${symbol} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                }
                
                // Update status to show retry
                if (statusElement) {
                    statusElement.innerHTML = `
                        <div class="data-fetch-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            Retrying data fetch for ${symbol} (${retryCount + 1}/${MAX_RETRIES})...
                        </div>
                    `;
                }
                
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchStockData(symbol, period, interval, retryCount + 1, bypassCache);
            }
            
            // Show notification
            if (typeof DTIBacktester !== 'undefined' && 
                typeof DTIBacktester.utils !== 'undefined' && 
                typeof DTIBacktester.utils.showNotification === 'function') {
                DTIBacktester.utils.showNotification(`Failed to fetch data for ${symbol}: ${error.message}`, 'error');
            }
            
            return null;
        }
    }
    
    /**
     * Process Yahoo Finance data into CSV format
     * @param {Object} yahooData - Yahoo Finance API response
     * @returns {Array} - Array of price data
     */
    function processYahooFinanceData(yahooData) {
        const result = yahooData.chart.result[0];
        const quotes = result.indicators.quote[0];
        const timestamps = result.timestamp;
        
        // Create CSV data
        let csvData = [
            ['date', 'open', 'high', 'low', 'close', 'volume']
        ];
        
        for (let i = 0; i < timestamps.length; i++) {
            const date = new Date(timestamps[i] * 1000);
            const dateString = date.toISOString().split('T')[0];
            
            // Skip points with null/undefined values
            if (quotes.open[i] === null || quotes.high[i] === null || 
                quotes.low[i] === null || quotes.close[i] === null) {
                continue;
            }
            
            csvData.push([
                dateString,
                quotes.open[i],
                quotes.high[i],
                quotes.low[i],
                quotes.close[i],
                quotes.volume[i]
            ]);
        }
        
        return csvData;
    }
    
    /**
     * Convert array data to CSV string
     * @param {Array} data - Array of data
     * @returns {string} - CSV string
     */
    function arrayToCSV(data) {
        return data.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Process CSV data for a single stock
     * @param {Array} data - CSV data
     * @param {Object} stock - Stock object
     * @returns {Object|null} - Processed stock data or null if error
     */
    function processStockCSV(data, stock) {
        try {
            if (!data || data.length < 2) {
                if (DEBUG_MODE) {
                    logDebug(`Invalid data for ${stock.symbol}: Less than 2 rows`, 'error');
                }
                return null;
            }
            
            // Extract columns
            const headers = data[0];
            const dateIndex = headers.indexOf('date');
            const openIndex = headers.indexOf('open');
            const highIndex = headers.indexOf('high');
            const lowIndex = headers.indexOf('low');
            const closeIndex = headers.indexOf('close');
            
            if (dateIndex === -1 || openIndex === -1 || highIndex === -1 || 
                lowIndex === -1 || closeIndex === -1) {
                if (DEBUG_MODE) {
                    logDebug(`Missing required columns in data for ${stock.symbol}`, 'error');
                } else {
                    console.error('Missing required columns in data');
                }
                return null;
            }
            
            // Process data rows
            let parsedData = [];
            let invalidRows = 0;
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                
                if (!row || row.length <= Math.max(dateIndex, openIndex, highIndex, lowIndex, closeIndex)) {
                    invalidRows++;
                    continue;
                }
                
                const dateStr = row[dateIndex];
                if (!dateStr) {
                    invalidRows++;
                    continue;
                }
                
                const dateObj = new Date(dateStr);
                const openVal = parseFloat(row[openIndex]);
                const highVal = parseFloat(row[highIndex]);
                const lowVal = parseFloat(row[lowIndex]);
                const closeVal = parseFloat(row[closeIndex]);
                
                if (isNaN(openVal) || isNaN(highVal) || isNaN(lowVal) || isNaN(closeVal)) {
                    invalidRows++;
                    continue;
                }
                
                parsedData.push({
                    date: dateObj,
                    dateStr: dateStr,
                    open: openVal,
                    high: highVal,
                    low: lowVal,
                    close: closeVal
                });
            }
            
            if (DEBUG_MODE && invalidRows > 0) {
                logDebug(`${stock.symbol}: Skipped ${invalidRows} invalid rows of ${data.length - 1} total`, 'warning');
            }
            
            // Sort data chronologically
            parsedData.sort((a, b) => a.date - b.date);
            
            // Extract sorted arrays
            const dates = parsedData.map(item => item.dateStr);
            const open = parsedData.map(item => item.open);
            const high = parsedData.map(item => item.high);
            const low = parsedData.map(item => item.low);
            const close = parsedData.map(item => item.close);
            
            // Get DTI parameters
            const r = parseInt(document.getElementById('r').value);
            const s = parseInt(document.getElementById('s').value);
            const u = parseInt(document.getElementById('u').value);
            
            // Calculate daily DTI - calling function from DTI indicators module
            const dti = DTIIndicators.calculateDTI(high, low, r, s, u);
            const sevenDayDTIData = DTIIndicators.calculate7DayDTI(dates, high, low, r, s, u);
            
            // Run backtest with active trade detection - calling from backtest module
            const { completedTrades, activeTrade } = DTIBacktest.backtestWithActiveDetection(dates, close, dti, sevenDayDTIData);
            
            // Calculate performance metrics including win rate for this stock
            const metrics = DTIBacktest.calculatePerformanceMetrics(completedTrades);
            
            return {
                stock: stock,
                dates: dates,
                close: close,
                dti: dti,
                sevenDayDTIData: sevenDayDTIData,
                trades: completedTrades,
                activeTrade: activeTrade,
                metrics: metrics  // Store metrics including win rate
            };
        } catch (error) {
            if (DEBUG_MODE) {
                logDebug(`Error processing ${stock.symbol}: ${error.message}`, 'error');
            } else {
                console.error('Error processing stock data:', error);
            }
            return null;
        }
    }
    
    /**
     * Process stocks in batches with a throttled approach
     * @param {Array} stockList - List of stocks to process
     * @param {function} progressCallback - Callback to update progress
     * @param {string} period - Time period
     * @returns {Promise<Array>} - Array of processed stock data
     */
    async function processStocksBatch(stockList, progressCallback, period = '5y') {
        const processedData = [];
        let successCount = 0;
        let errorCount = 0;
        let totalProcessed = 0;
        let csvCount = 0;
        let apiCount = 0;
        
        // Process stocks in batches to avoid overwhelming the API
        const batchSize = CONCURRENT_REQUESTS_LIMIT;
        const batches = [];
        
        // Split the stock list into batches
        for (let i = 0; i < stockList.length; i += batchSize) {
            batches.push(stockList.slice(i, i + batchSize));
        }
        
        if (DEBUG_MODE) {
            logDebug(`Processing ${stockList.length} stocks in ${batches.length} batches`, 'info');
        }
        
        // Process each batch sequentially
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            if (DEBUG_MODE) {
                logDebug(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} stocks)`, 'info');
            }
            
            const batchPromises = batch.map(stock => 
                fetchStockData(stock.symbol, period)
                .then(data => {
                    if (!data || data.length <= 1) {
                        errorCount++;
                        if (DEBUG_MODE) {
                            logDebug(`No valid data for ${stock.symbol}`, 'error');
                        }
                        return null;
                    }
                    
                    // Check if data came from CSV or API
                    const cacheKey = `${stock.symbol}_${period}_1d`;
                    const cacheEntry = DataCache.cache.get(cacheKey);
                    if (cacheEntry) {
                        if (cacheEntry.source === 'csv') csvCount++;
                        else if (cacheEntry.source === 'api') apiCount++;
                    }
                    
                    const parsed = processStockCSV(data, stock);
                    if (parsed) {
                        successCount++;
                        if (DEBUG_MODE) {
                            logDebug(`Successfully processed ${stock.symbol}`, 'success');
                        }
                        return parsed;
                    } else {
                        errorCount++;
                        if (DEBUG_MODE) {
                            logDebug(`Failed to process ${stock.symbol}`, 'error');
                        }
                        return null;
                    }
                })
                .catch(error => {
                    if (DEBUG_MODE) {
                        logDebug(`Error with ${stock.symbol}: ${error.message}`, 'error');
                    } else {
                        console.error(`Error processing ${stock.name}:`, error);
                    }
                    errorCount++;
                    return null;
                })
                .finally(() => {
                    totalProcessed++;
                    if (progressCallback) {
                        progressCallback(totalProcessed, stockList.length, successCount, errorCount);
                    }
                })
            );
            
            // Wait for all promises in the batch to resolve
            const batchResults = await Promise.all(batchPromises);
            
            // Add valid results to the processed data array
            batchResults.forEach(result => {
                if (result) {
                    processedData.push(result);
                }
            });
            
            // Add a small delay between batches to avoid overwhelming the API
            if (batchIndex < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        if (DEBUG_MODE) {
            logDebug(`Batch processing complete: ${successCount} successful, ${errorCount} failed`, 'info');
            logDebug(`Data sources: ${csvCount} from CSV, ${apiCount} from API`, 'info');
        }
        
        return processedData;
    }
    
    /**
     * Fetch data for all stocks in the current index or selected scan type
     * @returns {Promise} Promise that resolves when all data is fetched
     */
    async function fetchAllStocksData() {
        // Prevent multiple runs
        if (DTIBacktester.isProcessing) {
            DTIBacktester.utils.showNotification('Scan already in progress, please wait', 'info');
            return Promise.reject(new Error('Process already running'));
        }
        
        DTIBacktester.isProcessing = true;
        
        // Get the selected period from the dropdown
        const periodSelector = document.getElementById('period-selector');
        const period = periodSelector ? periodSelector.value : '5y';
        
        // Check for scan type selector (for multi-index scans)
        const scanTypeSelector = document.getElementById('scan-type-selector');
        const scanType = scanTypeSelector ? scanTypeSelector.value : 'current';
        
        // Get stock list based on scan type
        let stockList;
        try {
            if (scanType === 'current') {
                stockList = await getCurrentStockList();
            } else {
                stockList = await getStocksForScanType(scanType);
                // Deduplicate in case there are overlapping stocks
                stockList = deduplicateStocks(stockList);
            }
        } catch (error) {
            console.error('Error getting stock list:', error);
            // Fallback to sync methods
            if (scanType === 'current') {
                stockList = getCurrentStockListSync();
            } else {
                stockList = getStocksForScanTypeSync(scanType);
                // Deduplicate in case there are overlapping stocks
                stockList = deduplicateStocks(stockList);
            }
        }
        
        // Get display name for the current scan
        let scanDisplayName;
        if (scanType === 'current') {
            scanDisplayName = 
                DTIBacktester.currentStockIndex === 'nifty50' ? 'Nifty 50' : 
                DTIBacktester.currentStockIndex === 'niftyNext50' ? 'Nifty Next 50' : 
                DTIBacktester.currentStockIndex === 'niftyMidcap150' ? 'Nifty Midcap 150' : 
                DTIBacktester.currentStockIndex === 'ftse100' ? 'FTSE 100' :
                DTIBacktester.currentStockIndex === 'ftse250' ? 'FTSE 250' :
                DTIBacktester.currentStockIndex === 'usSmallCap' ? 'US Small Cap' :
                DTIBacktester.currentStockIndex === 'usMidCap' ? 'US Mid Cap' :
                DTIBacktester.currentStockIndex === 'usStocks' ? 'US Stocks' :
                DTIBacktester.currentStockIndex === 'indices' ? 'Market Indices' : 'Selected Stocks';
        } else {
            scanDisplayName = scanTypeSelector.options[scanTypeSelector.selectedIndex].text;
        }
        
        // Show batch processing status
        const statusDiv = document.getElementById('batch-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div>Processing ${scanDisplayName} (${stockList.length} stocks): 0/${stockList.length}</div>
                <div class="progress-bar"><div class="progress" style="width: 0%"></div></div>
            `;
            statusDiv.style.display = 'block';
        }
        
        // Clear previous active trade opportunities
        DTIBacktester.activeTradeOpportunities = [];
        DTIBacktester.allStocksData = [];
        
        // Process stocks with progress updates
        return new Promise(async (resolve, reject) => {
            try {
                // Create a progress callback function
                const updateProgress = (processed, total, successes, errors) => {
                    if (statusDiv) {
                        const percentComplete = Math.round((processed / total) * 100);
                        statusDiv.innerHTML = `
                            <div>Processing ${scanDisplayName} (${stockList.length} stocks): ${processed}/${total}</div>
                            <div class="progress-bar"><div class="progress" style="width: ${percentComplete}%"></div></div>
                            <div style="margin-top: 8px; font-size: 12px;">
                                ${successes} succeeded, ${errors} failed, ${processed} processed
                            </div>
                        `;
                    }
                };
                
                // Process stocks in batches
                const processedData = await processStocksBatch(stockList, updateProgress, period);
                
                // Store the stock data
                DTIBacktester.allStocksData = processedData;
                
                // Extract active trade opportunities with win rate data
                processedData.forEach(data => {
                    if (data.activeTrade) {
                        DTIBacktester.activeTradeOpportunities.push({
                            stock: data.stock,
                            trade: data.activeTrade,
                            data: data,
                            winRate: data.metrics ? data.metrics.winRate : 0,
                            totalTrades: data.metrics ? data.metrics.totalTrades : 0
                        });
                    }
                });
                
                // Update status when complete
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="batch-complete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Completed processing ${processedData.length} of ${stockList.length} stocks
                        </div>
                        <div class="progress-bar"><div class="progress" style="width: 100%"></div></div>
                        <div style="margin-top: 8px; font-size: 12px; display: flex; justify-content: space-between;">
                            <span>${processedData.length} stocks processed successfully</span>
                            <span>${DTIBacktester.activeTradeOpportunities.length} active trading opportunities found</span>
                        </div>
                    `;
                }
                
                // Display active trade opportunities
                if (typeof DTIUI !== 'undefined' && DTIUI.displayBuyingOpportunities) {
                    DTIUI.displayBuyingOpportunities();
                }
                
                // Get cache stats
                const stats = DataCache.getStats();
                if (DEBUG_MODE) {
                    logDebug(`Scan complete: ${stats.csvCount} from CSV, ${stats.apiCount} from API`, 'success');
                }
                
                // Reset processing flag
                DTIBacktester.isProcessing = false;
                
                // Show notification
                DTIBacktester.utils.showNotification(
                    `Scan complete: Found ${DTIBacktester.activeTradeOpportunities.length} opportunities in ${processedData.length} stocks`, 
                    'success'
                );
                
                resolve(DTIBacktester.allStocksData);
            } catch (error) {
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="batch-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            Error in batch processing: ${error.message}
                        </div>
                    `;
                }
                
                // Reset processing flag
                DTIBacktester.isProcessing = false;
                
                // Show notification
                DTIBacktester.utils.showNotification(`Scan failed: ${error.message}`, 'error');
                
                reject(error);
            }
        });
    }
    
    /**
     * Process CSV data from a file upload
     * @param {Object} results - Papa Parse results
     */
    function processCSV(results) {
        // Prevent multiple processing
        if (DTIBacktester.isProcessing) {
            DTIBacktester.utils.showNotification('Processing in progress, please wait', 'info');
            return;
        }
        
        DTIBacktester.isProcessing = true;
        
        // Show loading indicator for process button
        const processBtn = document.getElementById('process-btn');
        const originalBtnText = processBtn.innerHTML;
        
        processBtn.disabled = true;
        processBtn.innerHTML = `
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
            Processing...
        `;
        
        try {
            const data = results.data;
            
            // Check if data is empty
            if (!data || data.length < 2) {
                throw new Error('CSV file appears to be empty or invalid');
            }
            
            // Detect CSV format
            const formatInfo = detectCSVFormat(data);
            
            // Display CSV format info
            const csvInfoElement = document.getElementById('csv-info');
            csvInfoElement.style.display = 'block';
            csvInfoElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <div>
                        <strong>CSV Format:</strong> ${formatInfo.format === 'new' ? 'New Format' : 'Original Format'}<br>
                        <strong>Columns:</strong> ${formatInfo.headers.join(', ')}
                    </div>
                </div>
            `;
            
            // Extract columns
            let parsedData = [];
            
            // Skip header row and process data
            for (let i = 1; i < data.length; i++) {
                if (!data[i] || !Array.isArray(data[i])) {
                    continue; // Skip invalid rows
                }
                
                if (data[i].length <= Math.max(formatInfo.dateIndex, formatInfo.openIndex, formatInfo.highIndex, formatInfo.lowIndex, formatInfo.closeIndex)) {
                    continue; // Skip rows with insufficient columns
                }
                
                // Convert strings to numbers, handling possible invalid data
                const dateStr = data[i][formatInfo.dateIndex];
                
                if (!dateStr) continue; // Skip rows without a date
                
                // Special handling for date format like "22-Apr-25"
                let dateObj;
                if (typeof dateStr === 'string' && dateStr.includes('-')) {
                    // Handle format like "22-Apr-25"
                    const dateParts = dateStr.split('-');
                    if (dateParts.length === 3) {
                        const day = parseInt(dateParts[0], 10);
                        const month = DTIBacktester.utils.parseMonth(dateParts[1]);
                        // Handle 2-digit year, assume 20xx
                        let year = parseInt(dateParts[2], 10);
                        if (year < 100) {
                            year += 2000;
                        }
                        
                        // Create date object
                        dateObj = new Date(year, month, day);
                    } else {
                        dateObj = new Date(dateStr);
                    }
                } else {
                    dateObj = new Date(dateStr);
                }
                
                // Try to parse numeric values, handling strings that might have commas
                const openVal = DTIBacktester.utils.parseFloatSafe(data[i][formatInfo.openIndex]);
                const highVal = DTIBacktester.utils.parseFloatSafe(data[i][formatInfo.highIndex]);
                const lowVal = DTIBacktester.utils.parseFloatSafe(data[i][formatInfo.lowIndex]);
                const closeVal = DTIBacktester.utils.parseFloatSafe(data[i][formatInfo.closeIndex]);
                
                if (isNaN(openVal) || isNaN(highVal) || isNaN(lowVal) || isNaN(closeVal)) {
                    console.log(`Skipping row ${i} due to invalid numeric data:`, {
                        open: data[i][formatInfo.openIndex],
                        high: data[i][formatInfo.highIndex],
                        low: data[i][formatInfo.lowIndex],
                        close: data[i][formatInfo.closeIndex]
                    });
                    continue; // Skip rows with invalid numeric data
                }
                
                parsedData.push({
                    date: dateObj,
                    dateStr: dateStr,
                    open: openVal,
                    high: highVal,
                    low: lowVal,
                    close: closeVal
                });
            }
            
            // Sort data chronologically
            parsedData.sort((a, b) => a.date - b.date);
            
            // Extract sorted arrays
            const dates = parsedData.map(item => item.dateStr);
            const open = parsedData.map(item => item.open);
            const high = parsedData.map(item => item.high);
            const low = parsedData.map(item => item.low);
            const close = parsedData.map(item => item.close);
            
            // Check if we have enough data points
            if (dates.length < 30) {
                throw new Error('Not enough valid data points found in CSV. Please ensure you have at least 30 valid rows.');
            }
            
            // Get parameters for DTI calculation
            const r = parseInt(document.getElementById('r').value);
            const s = parseInt(document.getElementById('s').value);
            const u = parseInt(document.getElementById('u').value);
            
            // Calculate daily DTI - using DTIIndicators module
            const dti = DTIIndicators.calculateDTI(high, low, r, s, u);
            
            // Calculate 7-day DTI - using DTIIndicators module
            const sevenDayDTIData = DTIIndicators.calculate7DayDTI(dates, high, low, r, s, u);
            
            // Run backtest - using DTIBacktest module
            const { completedTrades, activeTrade } = DTIBacktest.backtestWithActiveDetection(dates, close, dti, sevenDayDTIData);
            const allTrades = [...completedTrades];
            if (activeTrade) allTrades.push(activeTrade);
            
            // Calculate performance metrics including win rate
            const metrics = DTIBacktest.calculatePerformanceMetrics(completedTrades);
            
            // Add metrics to backtester data for reference
            DTIBacktester.currentMetrics = metrics;
            
            // Display results with animation using DTIUI module
            setTimeout(() => {
                if (typeof DTIUI !== 'undefined') {
                    DTIUI.createCharts(dates, close, dti, sevenDayDTIData);
                    DTIUI.displayStatistics(allTrades);
                    DTIUI.displayTrades(allTrades);
                }
                
                // Show success notification
                DTIBacktester.utils.showNotification(`Backtest completed with ${completedTrades.length} trades`, 'success');
            }, 200);
        } catch (error) {
            console.error('Error processing CSV:', error);
            DTIBacktester.utils.showNotification('Error processing CSV file: ' + error.message, 'error');
        } finally {
            // Reset button state
            setTimeout(() => {
                processBtn.disabled = false;
                processBtn.innerHTML = originalBtnText;
                DTIBacktester.isProcessing = false;
            }, 500);
        }
    }
    
    /**
     * Detect CSV format and extract data
     * @param {Array} data - CSV data
     * @returns {Object} - Format information
     */
    function detectCSVFormat(data) {
        if (!data || data.length < 2) {
            throw new Error('CSV file appears to be empty or invalid');
        }
        
        const headers = data[0].map(h => (h || '').toString().trim().toLowerCase());
        const formatInfo = { headers: headers };
        
        console.log("Detected headers:", headers);
        
        // For the new format with named columns
        if (headers.includes('open') || headers.includes('high') || headers.includes('low') || 
            headers.includes('close') || headers.includes('ltp')) {
            formatInfo.format = 'new';
            
            // Find indices with fallbacks for different possible names
            formatInfo.dateIndex = headers.indexOf('date');
            formatInfo.openIndex = headers.indexOf('open');
            formatInfo.highIndex = headers.indexOf('high');
            formatInfo.lowIndex = headers.indexOf('low');
            
            // Try both 'close' and 'ltp' for closing price
            if (headers.indexOf('close') !== -1) {
                formatInfo.closeIndex = headers.indexOf('close');
            } else if (headers.indexOf('ltp') !== -1) {
                formatInfo.closeIndex = headers.indexOf('ltp');
            } else {
                // Default to the 7th column (index 6) if 'close' is not found
                formatInfo.closeIndex = 6;
            }
        } 
        // Original format with fixed positions
        else if (headers.length >= 6) {
            formatInfo.format = 'original';
            formatInfo.dateIndex = 1;  // Date in second column
            formatInfo.openIndex = 2;  // Open in third column
            formatInfo.highIndex = 3;  // High in fourth column
            formatInfo.lowIndex = 4;   // Low in fifth column
            formatInfo.closeIndex = 5; // Close in sixth column
        } 
        else {
            throw new Error('Unrecognized CSV format. Please ensure your data includes date, open, high, low, close columns.');
        }
        
        console.log("Format detection results:", {
            format: formatInfo.format,
            dateIndex: formatInfo.dateIndex,
            openIndex: formatInfo.openIndex,
            highIndex: formatInfo.highIndex,
            lowIndex: formatInfo.lowIndex,
            closeIndex: formatInfo.closeIndex
        });
        
        return formatInfo;
    }
    
    /**
     * Create a testing interface for verifying CSV access
     */
    function createDataTester() {
        const panel = document.createElement('div');
        panel.id = 'dti-data-tester';
        panel.className = 'dti-data-tester';
        panel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            width: 400px;
            max-height: 500px;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid #555;
            padding-bottom: 5px;
        `;
        header.innerHTML = `
            <h3 style="margin: 0; color: #4caf50;">CSV Integration Tester</h3>
            <div>
                <button id="tester-close-btn" style="background: #f44336; border: none; color: white; padding: 2px 5px; border-radius: 3px; cursor: pointer;">X</button>
            </div>
        `;
        panel.appendChild(header);
        
        // Create content area
        const content = document.createElement('div');
        content.id = 'tester-content';
        content.style.cssText = `
            flex: 1;
            overflow: auto;
        `;
        content.innerHTML = `
            <div style="margin-bottom: 10px;">
                <p>This tool verifies CSV file access and integration.</p>
                <p>Enter a stock symbol below to test:</p>
            </div>
        `;
        panel.appendChild(content);
        
        // Create controls
        const controls = document.createElement('div');
        controls.style.cssText = `
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid #555;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        controls.innerHTML = `
            <div style="display: flex; gap: 5px;">
                <input type="text" id="tester-symbol" placeholder="Symbol (e.g., AAPL)" style="flex: 1; padding: 5px;">
                <button id="tester-run-btn" style="background: #2196f3; border: none; color: white; padding: 5px; border-radius: 3px; cursor: pointer;">Run Test</button>
            </div>
            <div>
                <button id="tester-debug-btn" style="background: #ff9800; border: none; color: white; padding: 5px; border-radius: 3px; cursor: pointer; width: 100%;">Toggle Debug Mode</button>
            </div>
        `;
        panel.appendChild(controls);
        
        // Add to the page
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('tester-close-btn').addEventListener('click', () => {
            panel.remove();
        });
        
        document.getElementById('tester-run-btn').addEventListener('click', async () => {
            const symbol = document.getElementById('tester-symbol').value;
            if (!symbol) return;
            
            const result = await testSymbolIntegration(symbol);
            displayTestResults(result);
        });
        
        document.getElementById('tester-debug-btn').addEventListener('click', () => {
            setDebugMode(!DEBUG_MODE);
        });
        
        /**
         * Test the CSV integration for a symbol
         * @param {string} symbol - Stock symbol to test
         */
        async function testSymbolIntegration(symbol) {
            const results = {
                symbol,
                tests: []
            };
            
            document.getElementById('tester-content').innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100px;">
                    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                    <span style="margin-left: 10px;">Testing integration for ${symbol}...</span>
                </div>
            `;
            
            // Test 1: Check folder determination
            const folder = determineSymbolFolder(symbol);
            results.tests.push({
                name: 'Folder Determination',
                passed: Boolean(folder),
                details: `Determined folder: ${folder}`
            });
            
            // Test 2: Test CSV file access
            let csvData = null;
            try {
                // Clear cache to ensure we're testing actual file access
                DataCache.cache.delete(`${symbol}_5y_1d`);
                
                // Attempt to load CSV
                csvData = await loadLocalCSV(symbol, true);
                
                results.tests.push({
                    name: 'CSV File Access',
                    passed: Boolean(csvData && csvData.length > 1),
                    details: csvData 
                        ? `Successfully loaded CSV file with ${csvData.length} rows` 
                        : 'Failed to load CSV file'
                });
            } catch (error) {
                results.tests.push({
                    name: 'CSV File Access',
                    passed: false,
                    details: `Error: ${error.message}`
                });
            }
            
            // Test 3: CSV parsing
            if (csvData && csvData.length > 1) {
                try {
                    // Create a mock stock object
                    const mockStock = { symbol, name: symbol };
                    
                    // Process the CSV data
                    const processed = processStockCSV(csvData, mockStock);
                    
                    results.tests.push({
                        name: 'CSV Processing',
                        passed: Boolean(processed),
                        details: processed
                            ? `Successfully processed ${processed.dates.length} data points`
                            : 'Failed to process CSV data'
                    });
                } catch (error) {
                    results.tests.push({
                        name: 'CSV Processing',
                        passed: false,
                        details: `Error: ${error.message}`
                    });
                }
            } else {
                results.tests.push({
                    name: 'CSV Processing',
                    passed: false,
                    details: 'Skipped (CSV file not loaded)'
                });
            }
            
            // Test 4: Full data fetch flow (including fallback to API if needed)
            try {
                // Clear cache again
                DataCache.cache.delete(`${symbol}_5y_1d`);
                
                // Fetch data
                const data = await fetchStockData(symbol);
                
                // Check data source
                const cacheEntry = DataCache.cache.get(`${symbol}_5y_1d`);
                const source = cacheEntry ? cacheEntry.source : 'unknown';
                
                results.tests.push({
                    name: 'Complete Fetch Flow',
                    passed: Boolean(data && data.length > 1),
                    details: data
                        ? `Successfully fetched data with ${data.length} rows from ${source}`
                        : 'Failed to fetch data'
                });
            } catch (error) {
                results.tests.push({
                    name: 'Complete Fetch Flow',
                    passed: false,
                    details: `Error: ${error.message}`
                });
            }
            
            return results;
        }
        
        /**
         * Display test results
         * @param {Object} results - Test results
         */
        function displayTestResults(results) {
            const content = document.getElementById('tester-content');
            
            // Calculate overall status
            const totalTests = results.tests.length;
            const passedTests = results.tests.filter(test => test.passed).length;
            const overallStatus = passedTests === totalTests ? 'success' : (passedTests > 0 ? 'partial' : 'failed');
            
            let html = `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 5px 0;">Test Results for ${results.symbol}</h4>
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
                        <div style="width: 15px; height: 15px; border-radius: 50%; background-color: ${
                            overallStatus === 'success' ? '#4caf50' : 
                            overallStatus === 'partial' ? '#ff9800' : '#f44336'
                        };"></div>
                        <span>${passedTests}/${totalTests} tests passed</span>
                    </div>
                </div>
            `;
            
            // Table of test results
            html += '<table style="width: 100%; border-collapse: collapse;">';
            html += '<tr style="border-bottom: 1px solid #555;"><th style="text-align: left; padding: 5px;">Test</th><th style="text-align: center; padding: 5px;">Status</th></tr>';
            
            for (const test of results.tests) {
                html += `
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 5px;">${test.name}</td>
                        <td style="padding: 5px; text-align: center;">
                            <span style="
                                display: inline-block;
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background-color: ${test.passed ? '#4caf50' : '#f44336'};
                            "></span>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #555;">
                        <td colspan="2" style="padding: 5px; font-size: 11px; color: #aaa;">${test.details}</td>
                    </tr>
                `;
            }
            
            html += '</table>';
            
            // Recommendations
            if (overallStatus !== 'success') {
                html += `
                    <div style="margin-top: 15px; padding: 10px; background-color: rgba(255, 152, 0, 0.2); border-radius: 3px;">
                        <h4 style="margin: 0 0 5px 0; color: #ff9800;">Recommendations</h4>
                        <ul style="margin: 0; padding-left: 20px;">
                `;
                
                if (!results.tests[0].passed) {
                    html += '<li>Check if the symbol formatting is correct</li>';
                }
                
                if (!results.tests[1].passed) {
                    html += `
                        <li>Verify that the CSV file exists at /DATA/${determineSymbolFolder(results.symbol)}/${results.symbol}.csv</li>
                        <li>Check file permissions on the CSV file</li>
                        <li>Ensure the web server is configured to serve files from the DATA directory</li>
                    `;
                }
                
                if (!results.tests[2].passed && results.tests[1].passed) {
                    html += `
                        <li>Verify that the CSV file has the correct format with date, open, high, low, close columns</li>
                        <li>Check if the CSV file has enough valid rows</li>
                    `;
                }
                
                html += `
                        </ul>
                    </div>
                `;
            }
            
            content.innerHTML = html;
        }
        
        return panel;
    }
    
    // Add CSS for debug panel animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinner {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
    
    // Return public API
    return {
        // Debug and testing tools
        setDebugMode,
        createDebugPanel,
        createDataTester,
        testCSVAccess,
        
        // Data cache methods
        getCacheStats: () => DataCache.getStats(),
        clearCache: () => DataCache.clear(),
        
        // Async methods
        getCurrentStockList,
        getStocksForScanType,
        
        // Sync methods for backward compatibility
        getCurrentStockListSync,
        getStocksForScanTypeSync,
        
        // Other methods
        fetchStockData,
        loadLocalCSV,
        arrayToCSV,
        processStockCSV,
        fetchAllStocksData,
        processCSV,
        detectCSVFormat,
        
        // Stock lists exposed for access by other modules
        getStockLists() {
            return DTIStockLists.getAllStockLists();
        },
        
        async getStockListsAsync() {
            return await DTIStockLists.getAllStockListsAsync();
        }
    };
})();

// Make DTIData available globally
window.DTIData = DTIData;

// Auto-add debug button to UI
document.addEventListener('DOMContentLoaded', () => {
    // Create debug toggle button
    const debugBtn = document.createElement('button');
    debugBtn.id = 'toggle-debug-btn';
    debugBtn.innerHTML = 'Debug';
    debugBtn.className = 'debug-button';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        padding: 5px 10px;
        background-color: #2196f3;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        z-index: 9998;
    `;
    
    debugBtn.addEventListener('click', () => {
        DTIData.setDebugMode(true);
    });
    
    document.body.appendChild(debugBtn);
    
    // Create test button
    const testBtn = document.createElement('button');
    testBtn.id = 'data-test-btn';
    testBtn.innerHTML = 'Test CSV';
    testBtn.className = 'test-button';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 80px;
        padding: 5px 10px;
        background-color: #ff9800;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        z-index: 9998;
    `;
    
    testBtn.addEventListener('click', () => {
        DTIData.createDataTester();
    });
    
    document.body.appendChild(testBtn);
});
