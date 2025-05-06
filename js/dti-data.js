/**
 * DTI Backtester - Data Module
 * Handles data management, fetching, and processing
 * 
 * Dependencies:
 * - dti-stock-lists.js must be loaded before this file
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
     * Load data from local CSV file
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Array|null>} - CSV data or null if not available
     */
    async function loadLocalCSV(symbol) {
        try {
            // Determine which folder to look in based on symbol
            let folder = '';
            if (symbol.endsWith('.NS')) {
                folder = 'nifty50'; // Or use logic to determine correct Indian index
            } else if (symbol.endsWith('.L')) {
                folder = 'ftse100'; // Or use logic for UK stocks
            } else {
                folder = 'us_stocks';
            }
            
            // Use relative path to avoid CORS issues
            const csvPath = `./DATA/${folder}/${symbol}.csv`;
            
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
            
            if (csvData && csvData.length > 0) {
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
            
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=${interval}&includePrePost=false`;
            
            const response = await fetch(proxyUrl + yahooUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
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
                    Data fetched successfully for ${symbol}
                </div>
            `;
                
                // Hide after 3 seconds
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 3000);
            }
            
            const processedData = processYahooFinanceData(data);
            
            // Store in cache
            dataCache.set(cacheKey, processedData);
            
            return processedData;
            
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
                
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchStockData(symbol, period, interval, retryCount + 1);
            }
            
            DTIBacktester.utils.showNotification(`Failed to fetch data for ${symbol}: ${error.message}`, 'error');
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
     * Clear data cache
     * Useful for freeing memory after large scans
     */
    function clearDataCache() {
        dataCache.clear();
        console.log("Data cache cleared");
        DTIBacktester.utils.showNotification("Data cache cleared", "info");
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
        loadLocalCSV,
        arrayToCSV,
        processStockCSV,
        fetchAllStocksData,
        processCSV,
        detectCSVFormat,
        clearDataCache,
        
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