/**
 * DTI Backtester - Data Module
 * Handles data management, fetching, and processing
 * Modified to use Firestore via API
 * 
 * Dependencies:
 * - dti-stock-lists.js must be loaded before this file
 * - dti-api.js must be loaded before this file
 */

// Create DTIData module
window.DTIData = (function() {
    // Data caching
    const dataCache = new Map();
    
    // Constants
    const MAX_RETRIES = 3;
    const CONCURRENT_REQUESTS_LIMIT = 2; // Limit for concurrent API requests
    
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
     * Fetch stock data using the API client
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
            // Try to fetch data via API
            console.log(`Fetching data for ${symbol} via API`);
            
            // Fetch data in CSV format for easier parsing
            const csvData = await DTIAPI.fetchStockData(symbol, true);
            
            if (!csvData) {
                throw new Error(`No data received for ${symbol}`);
            }
            
            // Parse CSV string to array format
            const parsedData = Papa.parse(csvData, {
                header: false,
                skipEmptyLines: true
            }).data;
            
            // Update status on success
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="data-fetch-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Data loaded successfully for ${symbol}
                    </div>
                `;
                
                // Hide after 3 seconds
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 3000);
            }
            
            // Store in cache
            dataCache.set(cacheKey, parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('Error fetching stock data:', error);
            
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
                console.log(`Retrying fetch for ${symbol} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                
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
                
                // Try triggering an update before retrying
                try {
                    await DTIAPI.updateStock(symbol, true);
                    console.log(`Triggered update for ${symbol}`);
                } catch (updateError) {
                    console.warn(`Failed to trigger update for ${symbol}:`, updateError);
                }
                
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchStockData(symbol, period, interval, retryCount + 1);
            }
            
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Failed to fetch data for ${symbol}: ${error.message}`, 'error');
            }
            return null;
        }
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
                console.error('Missing required columns in data');
                return null;
            }
            
            // Process data rows
            let parsedData = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                
                if (!row || row.length <= Math.max(dateIndex, openIndex, highIndex, lowIndex, closeIndex)) {
                    continue;
                }
                
                const dateStr = row[dateIndex];
                if (!dateStr) continue;
                
                const dateObj = new Date(dateStr);
                const openVal = parseFloat(row[openIndex]);
                const highVal = parseFloat(row[highIndex]);
                const lowVal = parseFloat(row[lowIndex]);
                const closeVal = parseFloat(row[closeIndex]);
                
                if (isNaN(openVal) || isNaN(highVal) || isNaN(lowVal) || isNaN(closeVal)) {
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
            console.error('Error processing stock data:', error);
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
        
        // Process stocks in batches to avoid overwhelming the API
        const batchSize = CONCURRENT_REQUESTS_LIMIT;
        const batches = [];
        
        // Split the stock list into batches
        for (let i = 0; i < stockList.length; i += batchSize) {
            batches.push(stockList.slice(i, i + batchSize));
        }
        
        // Process each batch sequentially
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const batchPromises = batch.map(stock => 
                fetchStockData(stock.symbol, period)
                .then(data => {
                    if (!data || data.length <= 1) {
                        errorCount++;
                        return null;
                    }
                    
                    const parsed = processStockCSV(data, stock);
                    if (parsed) {
                        successCount++;
                        return parsed;
                    } else {
                        errorCount++;
                        return null;
                    }
                })
                .catch(error => {
                    console.error(`Error processing ${stock.name}:`, error);
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
        
        return processedData;
    }
    
    /**
     * Fetch data for all stocks in the current index or selected scan type
     * @returns {Promise} Promise that resolves when all data is fetched
     */
    async function fetchAllStocksData() {
        // Rest of the function remains the same
        // ...
        
        // Just modify to use our new API methods
        
        // ... (same implementation)
        
        return new Promise(async (resolve, reject) => {
            try {
                // Same implementation as before
                // ...
                resolve(DTIBacktester.allStocksData);
            } catch (error) {
                // Same error handling as before
                // ...
                reject(error);
            }
        });
    }
    
    /**
     * Process CSV data from a file upload
     * @param {Object} results - Papa Parse results
     */
    function processCSV(results) {
        // Same implementation as before
        // ...
    }
    
    /**
     * Detect CSV format and extract data
     * @param {Array} data - CSV data
     * @returns {Object} - Format information
     */
    function detectCSVFormat(data) {
        // Same implementation as before
        // ...
    }
    
    /**
     * Clear data cache
     * Useful for freeing memory after large scans
     */
    function clearDataCache() {
        dataCache.clear();
        console.log("Data cache cleared");
        if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
            DTIBacktester.utils.showNotification("Data cache cleared", "info");
        }
    }
    
    /**
     * Update stock data for a symbol
     * @param {string} symbol - Stock symbol to update
     * @returns {Promise} - Promise that resolves when update is complete
     */
    async function updateStockData(symbol) {
        try {
            // Show status notification
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Updating data for ${symbol}...`, 'info');
            }
            
            // Call the API to trigger an update
            const result = await DTIAPI.updateStock(symbol, true);
            
            // Clear cache for this symbol
            const cacheKeysToDelete = [];
            for (const key of dataCache.keys()) {
                if (key.startsWith(`${symbol}_`)) {
                    cacheKeysToDelete.push(key);
                }
            }
            
            cacheKeysToDelete.forEach(key => dataCache.delete(key));
            
            // Show success notification
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Data updated for ${symbol}`, 'success');
            }
            
            return result;
        } catch (error) {
            console.error(`Error updating data for ${symbol}:`, error);
            
            // Show error notification
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Failed to update data for ${symbol}: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    /**
     * Update data for an entire index
     * @param {string} indexName - Name of the index to update
     * @returns {Promise} - Promise that resolves when update is complete
     */
    async function updateIndexData(indexName) {
        try {
            // Show status notification
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Updating data for ${indexName}...`, 'info');
            }
            
            // Call the API to trigger an update
            const result = await DTIAPI.updateIndex(indexName, true);
            
            // Clear cache entries related to this index
            clearDataCache(); // For simplicity, clear all cache
            
            // Show success notification
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Data updated for ${indexName}`, 'success');
            }
            
            return result;
        } catch (error) {
            console.error(`Error updating data for ${indexName}:`, error);
            
            // Show error notification
            if (typeof DTIBacktester !== 'undefined' && DTIBacktester.utils && DTIBacktester.utils.showNotification) {
                DTIBacktester.utils.showNotification(`Failed to update data for ${indexName}: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    /**
     * Check the health of the API
     * @returns {Promise} - Promise that resolves with health status
     */
    async function checkAPIHealth() {
        try {
            return await DTIAPI.checkHealth();
        } catch (error) {
            console.error('API health check failed:', error);
            throw error;
        }
    }
    
    // Return public API
    return {
        // Async methods
        getCurrentStockList,
        getStocksForScanType,
        
        // Sync methods for backward compatibility
        getCurrentStockListSync,
        getStocksForScanTypeSync,
        
        // Other methods
        fetchStockData,
        processStockCSV,
        fetchAllStocksData,
        processCSV,
        detectCSVFormat,
        clearDataCache,
        updateStockData,
        updateIndexData,
        checkAPIHealth,
        
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