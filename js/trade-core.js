/**
 * DTI Backtester - Enhanced Trade Core Module
 * Handles core trade management functionality, data operations, and advanced analytics
 * Added: Import/Export functionality for all trades
 */

// Create TradeCore module
const TradeCore = (function() {
    // Private variables
    let allTrades = [];
    let activeTrades = [];
    let closedTrades = [];
    let selectedTradeId = null;
    let equityCurveData = null; // Cached equity curve data
    let drawdownData = null; // Cached drawdown data

    // Constants
    const LOCAL_STORAGE_KEY = 'dti_backtester_trades';
    const DATA_VERSION = '1.0.0'; // For versioning the exported data format
    
    /**
     * Get currency symbol based on market index or stock symbol
     * @param {string} market - Market index name or stock symbol
     * @returns {string} - Currency symbol
     */
    function getCurrencySymbol(market) {
        // If a specific market index is provided
        if (market === 'usStocks') return '$';
        if (market === 'ftse100') return '£';
        if (market === 'nifty50' || market === 'niftyNext50' || market === 'indices') return '₹';
        
        // If a stock symbol is provided
        if (typeof market === 'string' && market.includes('.')) {
            if (market.endsWith('.L')) return '£';  // London Stock Exchange
            if (market.includes('.NS')) return '₹'; // National Stock Exchange (India)
            return '₹'; // Default for other exchanges with dots
        }
        
        // If no dot in symbol, assume US market
        if (typeof market === 'string' && !market.includes('.')) return '$';
        
        // If nothing specified, check the global setting
        if (typeof DTIBacktester !== 'undefined' && DTIBacktester.currentStockIndex) {
            return getCurrencySymbol(DTIBacktester.currentStockIndex);
        }
        
        // Fallback default
        return '₹';
    }
    
    // For backward compatibility, we keep CURRENCY_SYMBOL as a property but make it use the function
    const CURRENCY_SYMBOL = getCurrencySymbol();
    
    const PRICE_UPDATE_INTERVAL = 60000; // Update prices every 60 seconds
    const MAX_RETRIES = 3; // Maximum retries for fetching data
    
    /**
     * Initialize the trade management system
     */
    function init() {
        console.log("TradeCore initializing...");
        
        // Load trades from storage
        loadTradesFromStorage();
        
        // Ensure all trades have a currency symbol
        allTrades.forEach(trade => {
            if (!trade.currencySymbol) {
                // Deduce market from symbol suffix
                if (trade.symbol.endsWith('.L')) {
                    trade.currencySymbol = '£'; // FTSE
                } else if (trade.symbol.includes('.NS')) {
                    trade.currencySymbol = '₹'; // NSE
                } else if (!trade.symbol.includes('.')) {
                    trade.currencySymbol = '$'; // US market (no dot)
                } else {
                    trade.currencySymbol = '₹'; // Default
                }
            }
        });
        
        // Save updated trades if needed
        if (allTrades.some(trade => !('currencySymbol' in trade))) {
            saveTradestoStorage();
        }
        
        // Set up periodic price updates if we're on the trades page
        if (isTradesPage()) {
            const updateInterval = setInterval(updatePrices, PRICE_UPDATE_INTERVAL);
            
            // Clean up the interval when navigating away
            window.addEventListener('beforeunload', function() {
                clearInterval(updateInterval);
            });
        }
        
        console.log(`Initialized with ${allTrades.length} trades (${activeTrades.length} active, ${closedTrades.length} closed)`);
    }
    
    /**
     * Check if current page is the trades page
     * @returns {boolean} - True if on trades page
     */
    function isTradesPage() {
        return document.getElementById('active-trades-container') !== null;
    }
    
    /**
     * Load trades from localStorage with improved error handling
     */
    function loadTradesFromStorage() {
        const storedTrades = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedTrades) {
            try {
                allTrades = JSON.parse(storedTrades);
                
                // Convert date strings back to Date objects
                allTrades.forEach(trade => {
                    try {
                        trade.entryDate = new Date(trade.entryDate);
                        trade.squareOffDate = new Date(trade.squareOffDate);
                        if (trade.exitDate) {
                            trade.exitDate = new Date(trade.exitDate);
                        }
                    } catch (dateError) {
                        console.warn("Error parsing date for trade:", dateError, trade);
                        // Use fallback values if date parsing fails
                        if (!(trade.entryDate instanceof Date)) trade.entryDate = new Date();
                        if (!(trade.squareOffDate instanceof Date)) {
                            trade.squareOffDate = new Date();
                            trade.squareOffDate.setDate(trade.squareOffDate.getDate() + 30); // Default to 30 days
                        }
                    }
                });
                
                // Sort trades with active ones first, then by date (newest first)
                allTrades.sort((a, b) => {
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (a.status !== 'active' && b.status === 'active') return 1;
                    return b.entryDate - a.entryDate;
                });
                
                // Separate active and closed trades
                activeTrades = allTrades.filter(trade => trade.status === 'active');
                closedTrades = allTrades.filter(trade => trade.status !== 'active');
                
                console.log(`Loaded ${allTrades.length} trades (${activeTrades.length} active, ${closedTrades.length} closed)`);
            } catch (error) {
                console.error('Error parsing trades from storage:', error);
                showNotification('Error loading trades from storage. Some data may be lost.', 'error');
                
                // Initialize empty arrays if there was an error
                allTrades = [];
                activeTrades = [];
                closedTrades = [];
            }
        } else {
            console.log("No trades found in storage");
        }
    }
    
    /**
     * Save trades to localStorage with error handling
     * @returns {boolean} - True if save was successful
     */
    function saveTradestoStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTrades));
            
            // Clear cached analytics data
            equityCurveData = null;
            drawdownData = null;
            
            return true;
        } catch (error) {
            console.error('Error saving trades to storage:', error);
            showNotification('Error saving trade data. Please check browser storage settings.', 'error');
            return false;
        }
    }
    
    /**
     * Update current prices for active trades
     * Uses Yahoo Finance API via CORS proxy
     */
    async function updatePrices() {
        if (activeTrades.length === 0) return;
        
        const updateStatusElement = document.getElementById('price-update-status');
        if (updateStatusElement) {
            updateStatusElement.textContent = 'Updating prices...';
            updateStatusElement.style.display = 'block';
            
            // Add a small animation to indicate updating
            updateStatusElement.style.opacity = '0.7';
            setTimeout(() => {
                updateStatusElement.style.opacity = '1';
            }, 300);
        }
        
        // Group symbols for batch request
        const symbols = [...new Set(activeTrades.map(trade => trade.symbol))];
        let updatedCount = 0;
        let errorCount = 0;
        
        try {
            for (const symbol of symbols) {
                const trades = activeTrades.filter(trade => trade.symbol === symbol);
                if (trades.length === 0) continue;
                
                try {
                    const price = await fetchCurrentPrice(symbol);
                    
                    if (price) {
                        // Update all trades with this symbol
                        trades.forEach(trade => {
                            trade.currentPrice = price;
                            // Make sure currency symbol is preserved when updating
                            if (!trade.currencySymbol) {
                                // For backward compatibility - add symbol if missing
                                trade.currencySymbol = getCurrencySymbol(
                                    trade.symbol.endsWith('.L') ? 'ftse100' : 
                                    (trade.symbol.includes('.NS') ? 'nifty50' : 
                                    (trade.symbol.includes('.') ? 'nifty50' : 'usStocks'))
                                );
                            }
                            updateTradeStatus(trade);
                        });
                        
                        updatedCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Error updating price for ${symbol}:`, error);
                    errorCount++;
                }
            }
            
            // Refresh the UI only if we got updates
            if (updatedCount > 0) {
                // Save to storage
                saveTradestoStorage();
                
                // Trigger UI update event
                const event = new CustomEvent('tradesUpdated');
                document.dispatchEvent(event);
                
                // Clear cached analytics data
                equityCurveData = null;
                drawdownData = null;
                
                if (updateStatusElement) {
                    updateStatusElement.textContent = `Prices updated successfully (${updatedCount}/${symbols.length})`;
                    updateStatusElement.style.color = 'var(--success-color)';
                    
                    // Hide after 3 seconds
                    setTimeout(() => {
                        updateStatusElement.style.opacity = '0';
                        setTimeout(() => {
                            updateStatusElement.style.display = 'none';
                            updateStatusElement.style.opacity = '1';
                            updateStatusElement.style.color = '';
                        }, 300);
                    }, 3000);
                }
            } else if (errorCount > 0) {
                if (updateStatusElement) {
                    updateStatusElement.textContent = `Error updating prices (${errorCount}/${symbols.length})`;
                    updateStatusElement.style.color = 'var(--danger-color)';
                    
                    // Hide after 3 seconds
                    setTimeout(() => {
                        updateStatusElement.style.opacity = '0';
                        setTimeout(() => {
                            updateStatusElement.style.display = 'none';
                            updateStatusElement.style.opacity = '1';
                            updateStatusElement.style.color = '';
                        }, 300);
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error in price update process:', error);
            
            if (updateStatusElement) {
                updateStatusElement.textContent = 'Error updating prices';
                updateStatusElement.style.color = 'var(--danger-color)';
                
                // Hide after 3 seconds
                setTimeout(() => {
                    updateStatusElement.style.opacity = '0';
                    setTimeout(() => {
                        updateStatusElement.style.display = 'none';
                        updateStatusElement.style.opacity = '1';
                        updateStatusElement.style.color = '';
                    }, 300);
                }, 3000);
            }
        }
    }
    
    /**
     * Fetch current price for a symbol with retry logic
     * @param {string} symbol - Stock symbol
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<number|null>} - Current price or null if error
     */
    async function fetchCurrentPrice(symbol, retryCount = 0) {
        try {
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m&includePrePost=false`;
            
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
            
            const result = data.chart.result[0];
            const quote = result.indicators.quote[0];
            const lastValidIndex = findLastValidIndex(quote.close);
            
            if (lastValidIndex === -1) {
                throw new Error('No valid price data found');
            }
            
            return quote.close[lastValidIndex];
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            
            // Implement retry logic
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying fetch for ${symbol} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchCurrentPrice(symbol, retryCount + 1);
            }
            
            // Return the last known price if all retries fail
            const trade = activeTrades.find(t => t.symbol === symbol);
            return trade ? trade.currentPrice : null;
        }
    }
    
    /**
     * Find the last valid (non-null) index in an array
     * @param {Array} array - Array to search
     * @returns {number} - Last valid index or -1 if none found
     */
    function findLastValidIndex(array) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i] !== null && array[i] !== undefined) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * Update a trade's status based on current price and conditions
     * @param {Object} trade - Trade object to update
     */
    function updateTradeStatus(trade) {
        if (trade.status !== 'active') return;
        
        const currentDate = new Date();
        const currentPrice = trade.currentPrice;
        
        // Calculate current P&L
        trade.currentPLPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
        trade.currentPLValue = (trade.shares * currentPrice) - (trade.shares * trade.entryPrice);
        trade.currentValue = trade.shares * currentPrice;
        
        // Calculate holding days
        const holdingDays = Math.floor((currentDate - trade.entryDate) / (1000 * 60 * 60 * 24));
        trade.holdingDays = holdingDays;
        
        // Check for auto-exit conditions
        
        // 1. Check for stop loss hit
        if (currentPrice <= trade.stopLossPrice) {
            closeTradeAutomatically(trade, 'Stop Loss Hit', currentPrice);
            return;
        }
        
        // 2. Check for target hit
        if (currentPrice >= trade.targetPrice) {
            closeTradeAutomatically(trade, 'Target Reached', currentPrice);
            return;
        }
        
        // 3. Check for square-off date
        if (currentDate >= trade.squareOffDate) {
            closeTradeAutomatically(trade, 'Time Exit', currentPrice);
            return;
        }
    }
    
    /**
     * Close a trade automatically based on exit conditions
     * @param {Object} trade - Trade to close
     * @param {string} reason - Exit reason
     * @param {number} exitPrice - Exit price
     */
    function closeTradeAutomatically(trade, reason, exitPrice) {
        trade.status = 'closed';
        trade.exitDate = new Date();
        trade.exitPrice = exitPrice;
        trade.exitReason = reason;
        trade.plPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
        trade.plValue = (trade.shares * exitPrice) - (trade.shares * trade.entryPrice);
        
        // Move from active to closed
        activeTrades = activeTrades.filter(t => t.id !== trade.id);
        closedTrades.push(trade);
        
        // Sort both arrays
        activeTrades.sort((a, b) => b.entryDate - a.entryDate);
        closedTrades.sort((a, b) => b.exitDate - a.exitDate);
        
        // Update storage
        saveTradestoStorage();
        
        // Trigger UI update event
        const event = new CustomEvent('tradeClosed', { detail: { tradeId: trade.id } });
        document.dispatchEvent(event);
        
        // Show notification with different icon based on profit/loss
        if (trade.plPercent >= 0) {
            showNotification(`Trade closed: ${trade.stockName} (${reason}) with profit of ${trade.plPercent.toFixed(2)}%`, 'success');
        } else {
            showNotification(`Trade closed: ${trade.stockName} (${reason}) with loss of ${Math.abs(trade.plPercent).toFixed(2)}%`, 'error');
        }
    }
    
    /**
     * Add a new trade
     * @param {Object} tradeData - New trade data
     * @returns {string|null} - ID of the new trade or null if error
     */
    function addNewTrade(tradeData) {
        try {
            // Generate a unique ID
            const tradeId = 'trade_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            
            // Determine the currency symbol based on the stock symbol
            const currencySymbol = tradeData.currencySymbol || getCurrencySymbol(tradeData.symbol);
            
            // Create new trade object
            const newTrade = {
                id: tradeId,
                status: 'active',
                stockName: tradeData.stockName,
                symbol: tradeData.symbol,
                entryDate: tradeData.entryDate || new Date(),
                entryPrice: tradeData.entryPrice,
                currentPrice: tradeData.entryPrice,
                investmentAmount: tradeData.investmentAmount,
                shares: tradeData.investmentAmount / tradeData.entryPrice,
                currentValue: Math.floor(tradeData.investmentAmount / tradeData.entryPrice) * tradeData.entryPrice,
                stopLossPrice: tradeData.stopLossPrice,
                targetPrice: tradeData.targetPrice,
                stopLossPercent: tradeData.stopLossPercent,
                takeProfitPercent: tradeData.takeProfitPercent,
                squareOffDate: new Date(tradeData.squareOffDate),
                holdingDays: 0,
                currentPLPercent: 0,
                currentPLValue: 0,
                currencySymbol: currencySymbol, // Store the currency symbol
                notes: tradeData.notes || ''
            };
            
            // Add to arrays
            allTrades.push(newTrade);
            activeTrades.push(newTrade);
            
            // Sort arrays
            activeTrades.sort((a, b) => b.entryDate - a.entryDate);
            
            // Save to storage
            const saved = saveTradestoStorage();
            if (!saved) {
                console.error("Failed to save new trade to storage");
                showNotification('Trade added but there was an error saving to storage', 'warning');
            }
            
            // Trigger event
            const event = new CustomEvent('tradeAdded', { detail: { tradeId: tradeId } });
            document.dispatchEvent(event);
            
            // Show notification
            showNotification(`New trade added: ${newTrade.shares} shares of ${newTrade.stockName}`, 'success');
            
            // Update active trades count in navigation if we're on the backtester page
            updateCountBadges();
            
            return tradeId;
        } catch (error) {
            console.error("Error adding new trade:", error, tradeData);
            showNotification(`Error adding trade: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Edit an existing trade
     * @param {string} tradeId - ID of the trade to edit
     * @param {Object} updatedData - Updated trade data
     * @returns {boolean} - True if successful
     */
    function editTrade(tradeId, updatedData) {
        try {
            // Find the trade in the active trades array
            const tradeIndex = activeTrades.findIndex(t => t.id === tradeId);
            if (tradeIndex === -1) {
                console.error("Trade not found for editing:", tradeId);
                return false;
            }
            
            const trade = activeTrades[tradeIndex];
            
            // Store original values for notification
            const originalEntryPrice = trade.entryPrice;
            const originalStopLoss = trade.stopLossPrice;
            const originalTarget = trade.targetPrice;
            const originalSquareOffDate = trade.squareOffDate;
            
            // Update entry price and recalculate related values if provided
            if (updatedData.entryPrice !== undefined) {
                trade.entryPrice = updatedData.entryPrice;
                
                
                // Recalculate current value and P&L
                trade.currentValue = trade.shares * trade.currentPrice;
                trade.currentPLPercent = ((trade.currentPrice - updatedData.entryPrice) / updatedData.entryPrice) * 100;
                trade.currentPLValue = (trade.shares * trade.currentPrice) - (trade.shares * updatedData.entryPrice);
                
                // Update stop loss and target percentages
                if (updatedData.stopLossPrice !== undefined) {
                    trade.stopLossPercent = ((updatedData.entryPrice - updatedData.stopLossPrice) / updatedData.entryPrice) * 100;
                } else {
                    // If only entry price is updated, recalculate stopLossPercent
                    trade.stopLossPercent = ((updatedData.entryPrice - trade.stopLossPrice) / updatedData.entryPrice) * 100;
                }
                
                if (updatedData.targetPrice !== undefined) {
                    trade.takeProfitPercent = ((updatedData.targetPrice - updatedData.entryPrice) / updatedData.entryPrice) * 100;
                } else {
                    // If only entry price is updated, recalculate takeProfitPercent
                    trade.takeProfitPercent = ((trade.targetPrice - updatedData.entryPrice) / updatedData.entryPrice) * 100;
                }
            }
            
            // Update allowed fields
            if (updatedData.stopLossPrice !== undefined) {
                trade.stopLossPrice = updatedData.stopLossPrice;
                // Recalculate stopLossPercent if stopLossPrice changed
                trade.stopLossPercent = ((trade.entryPrice - updatedData.stopLossPrice) / trade.entryPrice) * 100;
            }
            
            if (updatedData.targetPrice !== undefined) {
                trade.targetPrice = updatedData.targetPrice;
                // Recalculate takeProfitPercent if targetPrice changed
                trade.takeProfitPercent = ((updatedData.targetPrice - trade.entryPrice) / trade.entryPrice) * 100;
            }
            
            if (updatedData.squareOffDate !== undefined) {
                trade.squareOffDate = new Date(updatedData.squareOffDate);
            }
            
            if (updatedData.notes !== undefined) {
                trade.notes = updatedData.notes;
            }
            
            // Update the trade in all arrays
            const allTradeIndex = allTrades.findIndex(t => t.id === tradeId);
            if (allTradeIndex !== -1) {
                allTrades[allTradeIndex] = trade;
            }
            
            // Save to storage
            const saved = saveTradestoStorage();
            
            // Check if the trade status needs updating based on new settings
            updateTradeStatus(trade);
            
            // Trigger UI update event
            const event = new CustomEvent('tradeEdited', { detail: { tradeId: tradeId } });
            document.dispatchEvent(event);
            
            // Show notification
            showNotification(`Trade updated: ${trade.stockName}`, 'success');
            
            return true;
        } catch (error) {
            console.error("Error editing trade:", error);
            showNotification('Error editing trade: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Delete a trade completely
     * @param {string} tradeId - ID of the trade to delete
     * @returns {boolean} - True if successful
     */
    function deleteTrade(tradeId) {
        try {
            // Find the trade
            const trade = allTrades.find(t => t.id === tradeId);
            if (!trade) {
                console.error("Trade not found for deletion:", tradeId);
                return false;
            }
            
            // Store trade info for notification
            const tradeInfo = {
                name: trade.stockName,
                status: trade.status
            };
            
            // Remove from all arrays
            allTrades = allTrades.filter(t => t.id !== tradeId);
            
            if (trade.status === 'active') {
                activeTrades = activeTrades.filter(t => t.id !== tradeId);
            } else {
                closedTrades = closedTrades.filter(t => t.id !== tradeId);
            }
            
            // Save to storage
            const saved = saveTradestoStorage();
            
            // Trigger UI update event
            const event = new CustomEvent('tradeDeleted', { detail: { tradeId: tradeId } });
            document.dispatchEvent(event);
            
            // Show notification
            showNotification(`Trade deleted: ${tradeInfo.name}`, 'info');
            
            // Update badges
            updateCountBadges();
            
            return true;
        } catch (error) {
            console.error("Error deleting trade:", error);
            showNotification('Error deleting trade: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Close a trade manually
     * @param {string} tradeId - ID of the trade to close
     * @param {number} exitPrice - Exit price
     * @param {string} reason - Exit reason
     * @param {string} notes - Optional notes
     * @returns {boolean} - True if successful
     */
    function closeTrade(tradeId, exitPrice, reason, notes) {
        try {
            const trade = activeTrades.find(t => t.id === tradeId);
            if (!trade) {
                console.error("Trade not found:", tradeId);
                return false;
            }
            
            // Update trade
            trade.status = 'closed';
            trade.exitDate = new Date();
            trade.exitPrice = exitPrice;
            trade.exitReason = reason;
            trade.notes = notes ? notes : trade.notes;
            trade.plPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
            trade.plValue = (trade.shares * exitPrice) - (trade.shares * trade.entryPrice);
            
            // Move from active to closed
            activeTrades = activeTrades.filter(t => t.id !== tradeId);
            closedTrades.push(trade);
            
            // Sort both arrays
            activeTrades.sort((a, b) => b.entryDate - a.entryDate);
            closedTrades.sort((a, b) => b.exitDate - a.exitDate);
            
            // Save to storage
            const saved = saveTradestoStorage();
            
            // Trigger UI update event
            const event = new CustomEvent('tradeClosed', { detail: { tradeId: tradeId } });
            document.dispatchEvent(event);
            
            // Show notification
            if (trade.plPercent >= 0) {
                showNotification(`Trade closed: ${trade.stockName} with profit of ${trade.plPercent.toFixed(2)}%`, 'success');
            } else {
                showNotification(`Trade closed: ${trade.stockName} with loss of ${Math.abs(trade.plPercent).toFixed(2)}%`, 'error');
            }
            
            // Update badges
            updateCountBadges();
            
            return true;
        } catch (error) {
            console.error("Error closing trade:", error);
            showNotification('Error closing trade: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Clear all trade history (closed trades)
     * @returns {boolean} - True if successful
     */
    function clearTradeHistory() {
        try {
            // Keep only active trades
            allTrades = [...activeTrades];
            closedTrades = [];
            
            // Clear cached analytics data
            equityCurveData = null;
            drawdownData = null;
            
            // Save to storage
            const saved = saveTradestoStorage();
            
            // Trigger UI update event
            const event = new CustomEvent('historyCleared');
            document.dispatchEvent(event);
            
            showNotification('Trade history cleared successfully', 'success');
            
            return true;
        } catch (error) {
            console.error("Error clearing trade history:", error);
            showNotification('Error clearing trade history: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Generate CSV export of trade history
     * @returns {Blob|null} - CSV blob or null if error
     */
    function exportTradeHistoryCSV() {
        try {
            // Create CSV content
            const headers = ['Stock', 'Symbol', 'Entry Date', 'Entry Price', 'Exit Date', 'Exit Price', 
                            'Holding Days', 'Investment', 'Shares', 'P/L %', 'P/L Value', 'Exit Reason', 'Notes', 'Currency'];
            
            let csvContent = headers.join(',') + '\n';
            
            closedTrades.forEach(trade => {
                const holdingDays = Math.floor((trade.exitDate - trade.entryDate) / (1000 * 60 * 60 * 24));
                
                const row = [
                    trade.stockName,
                    trade.symbol,
                    formatDate(trade.entryDate),
                    trade.entryPrice.toFixed(2),
                    formatDate(trade.exitDate),
                    trade.exitPrice.toFixed(2),
                    holdingDays,
                    trade.investmentAmount.toFixed(2),
                    trade.shares,
                    trade.plPercent.toFixed(2),
                    trade.plValue.toFixed(2),
                    trade.exitReason,
                    trade.notes || '',
                    trade.currencySymbol || CURRENCY_SYMBOL // Include currency in export
                ].map(cell => `"${cell}"`);
                
                csvContent += row.join(',') + '\n';
            });
            
            // Create a Blob
            return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        } catch (error) {
            console.error("Error generating CSV:", error);
            showNotification('Error generating CSV export: ' + error.message, 'error');
            return null;
        }
    }

    /**
     * Export all trades (active and closed) as JSON
     * @returns {Blob|null} - JSON blob or null if error
     */
    function exportAllTradesJSON() {
        try {
            // Create the export object with metadata
            const exportData = {
                metadata: {
                    version: DATA_VERSION,
                    exportDate: new Date().toISOString(),
                    tradeCount: allTrades.length,
                    activeCount: activeTrades.length,
                    closedCount: closedTrades.length
                },
                trades: allTrades
            };
            
            // Create a formatted JSON string
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Create a Blob
            return new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        } catch (error) {
            console.error("Error generating JSON export:", error);
            showNotification('Error generating JSON export: ' + error.message, 'error');
            return null;
        }
    }

    /**
     * Import trades from JSON data
     * @param {string|Object} jsonData - JSON string or parsed object
     * @param {Object} options - Import options
     * @param {string} options.mode - 'replace' (replace all trades), 'add' (add all as new), or 'merge' (update existing, add new)
     * @param {boolean} options.keepActive - Whether to keep current active trades when in replace mode
     * @returns {Object} - Import results with counts
     */
    function importTradesFromJSON(jsonData, options = { mode: 'merge', keepActive: true }) {
        try {
            // Parse the data if it's a string
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Validate data structure
            if (!validateImportData(data)) {
                throw new Error('Invalid import data format');
            }
            
            // Extract the trades
            const importedTrades = data.trades;
            
            // Initialize result counters
            const results = {
                added: 0,
                updated: 0,
                skipped: 0,
                errors: 0,
                total: importedTrades.length
            };
            
            // Process based on import mode
            if (options.mode === 'replace') {
                // Backup active trades if needed
                const currentActiveTrades = options.keepActive ? [...activeTrades] : [];
                
                // Replace all trades with imported ones
                allTrades = importedTrades.map(prepareTrade);
                
                // Add back active trades if requested
                if (options.keepActive && currentActiveTrades.length > 0) {
                    // Find trade IDs to avoid duplicates
                    const importedIds = new Set(allTrades.map(t => t.id));
                    
                    // Add only non-duplicate active trades
                    currentActiveTrades.forEach(trade => {
                        if (!importedIds.has(trade.id)) {
                            allTrades.push(trade);
                            results.kept = (results.kept || 0) + 1;
                        }
                    });
                }
                
                results.added = importedTrades.length;
            } else if (options.mode === 'add') {
                // Add all imported trades with new IDs (to avoid collisions)
                importedTrades.forEach(trade => {
                    // Generate new ID
                    const newId = 'trade_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    const newTrade = { ...prepareTrade(trade), id: newId };
                    
                    // Add to all trades
                    allTrades.push(newTrade);
                    results.added++;
                });
            } else { // 'merge' mode (default)
                // Create a map of existing trades by ID for quick lookup
                const existingTradesMap = new Map(allTrades.map(trade => [trade.id, trade]));
                
                // Process each imported trade
                importedTrades.forEach(importedTrade => {
                    try {
                        const processedTrade = prepareTrade(importedTrade);
                        
                        // Check if the trade already exists
                        if (existingTradesMap.has(processedTrade.id)) {
                            // Update existing trade
                            const index = allTrades.findIndex(t => t.id === processedTrade.id);
                            if (index !== -1) {
                                allTrades[index] = processedTrade;
                                results.updated++;
                            } else {
                                // This shouldn't happen, but handle it
                                allTrades.push(processedTrade);
                                results.added++;
                            }
                        } else {
                            // Add as new trade
                            allTrades.push(processedTrade);
                            results.added++;
                        }
                    } catch (tradeError) {
                        console.error("Error processing imported trade:", tradeError, importedTrade);
                        results.errors++;
                    }
                });
            }
            
            // Separate into active and closed trades
            activeTrades = allTrades.filter(trade => trade.status === 'active');
            closedTrades = allTrades.filter(trade => trade.status !== 'active');
            
            // Sort trades with active ones first, then by date (newest first)
            allTrades.sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                
                if (a.status === 'active') {
                    return b.entryDate - a.entryDate;
                } else {
                    return b.exitDate - a.exitDate;
                }
            });
            
            // Save to storage
            const saved = saveTradestoStorage();
            if (!saved) {
                throw new Error('Failed to save imported trades to storage');
            }
            
            // Clear cached analytics data
            equityCurveData = null;
            drawdownData = null;
            
            // Trigger UI update event
            const event = new CustomEvent('tradesImported', { detail: { results } });
            document.dispatchEvent(event);
            
            // Update badges
            updateCountBadges();
            
            // Show notification
            const message = `Import successful: Added ${results.added}, Updated ${results.updated}, ${results.errors > 0 ? 'Errors: ' + results.errors : ''}`;
            showNotification(message, 'success');
            
            return results;
        } catch (error) {
            console.error("Error importing trades:", error);
            showNotification('Error importing trades: ' + error.message, 'error');
            return { error: error.message, total: 0, added: 0, updated: 0, errors: 1 };
        }
    }
    
    /**
     * Validate the import data structure
     * @param {Object} data - Import data to validate
     * @returns {boolean} - True if data is valid
     */
    function validateImportData(data) {
        // Check that we have an object with metadata and trades array
        if (!data || typeof data !== 'object') return false;
        if (!data.metadata || typeof data.metadata !== 'object') return false;
        if (!Array.isArray(data.trades)) return false;
        
        // Check version compatibility
        if (data.metadata.version && !isVersionCompatible(data.metadata.version, DATA_VERSION)) {
            console.warn(`Import data version (${data.metadata.version}) might not be compatible with current version (${DATA_VERSION})`);
            // We still continue, this is just a warning
        }
        
        // Validate at least some of the trades are valid
        if (data.trades.length === 0) return false;
        
        // Basic validation of the first trade to make sure it has required fields
        const sampleTrade = data.trades[0];
        const requiredFields = ['stockName', 'symbol', 'entryPrice', 'status'];
        
        for (const field of requiredFields) {
            if (!(field in sampleTrade)) {
                console.error(`Required field missing in imported trade: ${field}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if import version is compatible with current version
     * @param {string} importVersion - Version from import
     * @param {string} currentVersion - Current version
     * @returns {boolean} - True if versions are compatible
     */
    function isVersionCompatible(importVersion, currentVersion) {
        // Simple version check - just compare major versions
        const importMajor = importVersion.split('.')[0];
        const currentMajor = currentVersion.split('.')[0];
        
        return importMajor === currentMajor;
    }
    
    /**
     * Prepare an imported trade by fixing dates and ensuring required fields
     * @param {Object} trade - Imported trade to prepare
     * @returns {Object} - Processed trade ready for use
     */
    function prepareTrade(trade) {
        const processedTrade = { ...trade };
        
        // Convert date strings to Date objects
        if (typeof processedTrade.entryDate === 'string') {
            processedTrade.entryDate = new Date(processedTrade.entryDate);
        }
        
        if (typeof processedTrade.squareOffDate === 'string') {
            processedTrade.squareOffDate = new Date(processedTrade.squareOffDate);
        }
        
        if (processedTrade.exitDate && typeof processedTrade.exitDate === 'string') {
            processedTrade.exitDate = new Date(processedTrade.exitDate);
        }
        
        // Ensure trade has all required fields
        if (!processedTrade.currencySymbol) {
            processedTrade.currencySymbol = getCurrencySymbol(processedTrade.symbol);
        }
        
        // Validate and fix numerical values
        const numericFields = [
            'entryPrice', 'stopLossPrice', 'targetPrice', 'investmentAmount',
            'shares', 'currentPrice', 'currentValue'
        ];
        
        numericFields.forEach(field => {
            if (processedTrade[field] !== undefined) {
                processedTrade[field] = parseFloat(processedTrade[field]);
                if (isNaN(processedTrade[field])) {
                    // Use defaults for missing required numeric fields
                    if (field === 'entryPrice') processedTrade[field] = 0;
                    else if (field === 'shares') processedTrade[field] = 0;
                    else if (field === 'investmentAmount') processedTrade[field] = 0;
                    // Other fields can be undefined
                }
            }
        });
        
        // Ensure proper values for active trades
        if (processedTrade.status === 'active') {
            if (!processedTrade.currentPrice || isNaN(processedTrade.currentPrice)) {
                processedTrade.currentPrice = processedTrade.entryPrice;
            }
            
            // Recalculate current value and P&L
            processedTrade.currentValue = processedTrade.shares * processedTrade.currentPrice;
            processedTrade.currentPLPercent = ((processedTrade.currentPrice - processedTrade.entryPrice) / processedTrade.entryPrice) * 100;
            processedTrade.currentPLValue = (processedTrade.shares * processedTrade.currentPrice) - (processedTrade.shares * processedTrade.entryPrice);
            
            // Calculate holding days
            const holdingDays = Math.floor((new Date() - processedTrade.entryDate) / (1000 * 60 * 60 * 24));
            processedTrade.holdingDays = Math.max(0, holdingDays);
        }
        
        return processedTrade;
    }
    
    /**
     * Update active trades count badge
     */
    function updateCountBadges() {
        // Check if we have the badge element
        const badge = document.getElementById('active-trades-count');
        if (badge) {
            badge.textContent = activeTrades.length;
            badge.style.display = activeTrades.length > 0 ? 'inline-flex' : 'none';
        }
    }
    
    /**
     * Format date for display
     * @param {Date|string} dateInput - Date to format
     * @returns {string} - Formatted date string
     */
    function formatDate(dateInput) {
        if (!dateInput) return 'N/A';
        
        try {
            // Handle different input types
            let date;
            if (dateInput instanceof Date) {
                date = dateInput;
            } else if (typeof dateInput === 'string') {
                date = new Date(dateInput);
            } else {
                return String(dateInput); // Return as string if not a recognized format
            }
            
            // Verify it's a valid date
            if (isNaN(date.getTime())) {
                return String(dateInput); // Return original value as string if invalid date
            }
            
            return date.toLocaleDateString();
        } catch (error) {
            console.warn("Error formatting date:", error, dateInput);
            return String(dateInput); // Fallback to string representation
        }
    }
    
    /**
     * Format date for filenames
     * @param {Date} date - Date to format
     * @returns {string} - Formatted date string for filenames
     */
    function formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}${month}${day}`;
    }
    
    /**
     * Show a notification message
     * @param {string} message - Message to show
     * @param {string} type - Notification type (success, error, info)
     */
    function showNotification(message, type = 'info') {
        // Check if we're in a window context with DOM
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        
        // Check if there's a global notification function
        if (typeof window.showNotification === 'function' && 
            window.showNotification !== showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Log the message to the console
        console.log(`Notification (${type}): ${message}`);
        
        // Look for notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add appropriate icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>`;
                break;
            case 'error':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>`;
                break;
            case 'warning':
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>`;
                break;
            default: // info
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="12" y1="16" x2="12" y2="16"></line>
                    </svg>`;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${message}</div>
        `;
        
        // Add to notification container
        container.appendChild(notification);
        
        // Add entrance animation
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(40px)';
        
        setTimeout(() => {
            notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(40px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    /**
     * Get trade statistics
     * @returns {Object} - Trade statistics
     */
    function getTradeStatistics() {
        // Calculate various trade statistics
        const totalActive = activeTrades.length;
        const totalClosed = closedTrades.length;
        const totalInvested = activeTrades.reduce((sum, trade) => sum + trade.investmentAmount, 0);
        
        // Calculate open P&L
        let openPLPercent = 0;
        let openPLValue = 0;
        if (activeTrades.length > 0) {
            const totalCurrentValue = activeTrades.reduce((sum, trade) => sum + trade.currentValue, 0);
            const totalInitialValue = activeTrades.reduce((sum, trade) => sum + (trade.entryPrice * trade.shares), 0);
            openPLPercent = ((totalCurrentValue - totalInitialValue) / totalInitialValue) * 100;
            openPLValue = totalCurrentValue - totalInitialValue;
        }
        
        // Win rate, profit factor, etc.
        let winningTrades = 0;
        let losingTrades = 0;
        let totalClosedProfit = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        
        closedTrades.forEach(trade => {
            if (trade.plPercent > 0) {
                winningTrades++;
                grossProfit += trade.plPercent;
            } else {
                losingTrades++;
                grossLoss += Math.abs(trade.plPercent);
            }
            totalClosedProfit += trade.plPercent;
        });
        
        const winRate = totalClosed > 0 ? (winningTrades / totalClosed * 100) : 0;
        const avgProfit = totalClosed > 0 ? (totalClosedProfit / totalClosed) : 0;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? Infinity : 0;
        
        return {
            totalActive,
            totalClosed,
            totalInvested,
            openPLPercent,
            openPLValue,
            winningTrades,
            losingTrades,
            winRate,
            avgProfit,
            totalClosedProfit,
            profitFactor
        };
    }
    
    /**
     * Group trades by currency and calculate statistics for each group
     * @returns {Object} - Object with statistics grouped by currency
     */
    function getTradeStatisticsByCurrency() {
        // Get the unique currencies from all trades
        const uniqueCurrencies = [...new Set([
            ...activeTrades.map(trade => trade.currencySymbol || CURRENCY_SYMBOL),
            ...closedTrades.map(trade => trade.currencySymbol || CURRENCY_SYMBOL)
        ])];
        
        // Initialize result object
        const result = {
            overall: getTradeStatistics(),  // Keep overall stats for backward compatibility
            currencies: {}
        };
        
        // Calculate stats for each currency
        uniqueCurrencies.forEach(currency => {
            // Filter trades by this currency
            const currencyActiveTrades = activeTrades.filter(trade => 
                (trade.currencySymbol || CURRENCY_SYMBOL) === currency);
            
            const currencyClosedTrades = closedTrades.filter(trade => 
                (trade.currencySymbol || CURRENCY_SYMBOL) === currency);
            
            // Calculate various trade statistics
            const totalActive = currencyActiveTrades.length;
            const totalClosed = currencyClosedTrades.length;
            const totalInvested = currencyActiveTrades.reduce((sum, trade) => sum + trade.investmentAmount, 0);
            
            // Calculate open P&L
            let openPLPercent = 0;
            let openPLValue = 0;
            if (currencyActiveTrades.length > 0) {
                const totalCurrentValue = currencyActiveTrades.reduce((sum, trade) => sum + trade.currentValue, 0);
                const totalInitialValue = currencyActiveTrades.reduce((sum, trade) => 
                    sum + (trade.entryPrice * trade.shares), 0);
                    
                openPLPercent = ((totalCurrentValue - totalInitialValue) / totalInitialValue) * 100;
                openPLValue = totalCurrentValue - totalInitialValue;
            }
            
            // Win rate, profit factor, etc.
            let winningTrades = 0;
            let losingTrades = 0;
            let totalClosedProfit = 0;
            let grossProfit = 0;
            let grossLoss = 0;
            
            currencyClosedTrades.forEach(trade => {
                if (trade.plPercent > 0) {
                    winningTrades++;
                    grossProfit += trade.plPercent;
                } else {
                    losingTrades++;
                    grossLoss += Math.abs(trade.plPercent);
                }
                totalClosedProfit += trade.plPercent;
            });
            
            const winRate = totalClosed > 0 ? (winningTrades / totalClosed * 100) : 0;
            const avgProfit = totalClosed > 0 ? (totalClosedProfit / totalClosed) : 0;
            const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? Infinity : 0;
            
            // Store the statistics for this currency
            result.currencies[currency] = {
                currencySymbol: currency,
                totalActive,
                totalClosed,
                totalInvested,
                openPLPercent,
                openPLValue,
                winningTrades,
                losingTrades,
                winRate,
                avgProfit,
                totalClosedProfit,
                profitFactor
            };
        });
        
        return result;
    }
    
    /**
     * Get all trades (optionally filtered)
     * @param {string} status - Filter by status ('active', 'closed', 'all')
     * @param {boolean} profitable - Filter by profitability (true = profitable, false = losing, undefined = all)
     * @returns {Array} - Array of filtered trades
     */
    function getTrades(status = 'all', profitable = undefined) {
        let result = [];
        
        switch (status) {
            case 'active':
                result = [...activeTrades];
                break;
            case 'closed':
                result = [...closedTrades];
                break;
            case 'all':
            default:
                result = [...allTrades];
                break;
        }
        
        // Further filter by profitability if specified
        if (profitable !== undefined && status !== 'active') {
            if (profitable) {
                result = result.filter(trade => trade.plPercent > 0);
            } else {
                result = result.filter(trade => trade.plPercent <= 0);
            }
        }
        
        return result;
    }
    
    /**
     * Get all trades grouped by currency
     * @param {string} status - Filter by status ('active', 'closed', 'all')
     * @returns {Object} - Object with trades grouped by currency
     */
    function getTradesByCurrency(status = 'all') {
        // Get all trades based on status
        const trades = getTrades(status);
        
        // Group trades by currency
        const groupedTrades = {};
        
        trades.forEach(trade => {
            const currency = trade.currencySymbol || CURRENCY_SYMBOL;
            
            if (!groupedTrades[currency]) {
                groupedTrades[currency] = [];
            }
            
            groupedTrades[currency].push(trade);
        });
        
        return groupedTrades;
    }
    
    /**
     * Get a single trade by ID
     * @param {string} tradeId - Trade ID
     * @returns {Object|null} - Trade object or null if not found
     */
    function getTradeById(tradeId) {
        return allTrades.find(trade => trade.id === tradeId) || null;
    }
    
    /**
     * Set the currently selected trade ID
     * @param {string} tradeId - Trade ID to select
     */
    function setSelectedTradeId(tradeId) {
        selectedTradeId = tradeId;
    }
    
    /**
     * Get the currently selected trade ID
     * @returns {string|null} - Selected trade ID
     */
    function getSelectedTradeId() {
        return selectedTradeId;
    }

    /**
     * Calculate the Sharpe ratio for closed trades
     * @param {number} riskFreeRate - Annual risk-free rate (default: 0.02 = 2%)
     * @returns {number} - Sharpe ratio
     */
    function getSharpeRatio(riskFreeRate = 0.02) {
        if (closedTrades.length === 0) return 0;
        
        // Calculate average daily return rate
        const avgDailyReturn = closedTrades.reduce((sum, trade) => {
            const holdingDays = Math.max(1, Math.floor((trade.exitDate - trade.entryDate) / (1000 * 60 * 60 * 24)));
            // Convert percentage to daily rate
            const dailyReturnRate = (Math.pow(1 + (trade.plPercent / 100), 1 / holdingDays) - 1) * 100;
            return sum + dailyReturnRate;
        }, 0) / closedTrades.length;
        
        // Calculate daily return standard deviation
        const dailyReturns = closedTrades.map(trade => {
            const holdingDays = Math.max(1, Math.floor((trade.exitDate - trade.entryDate) / (1000 * 60 * 60 * 24)));
            return (Math.pow(1 + (trade.plPercent / 100), 1 / holdingDays) - 1) * 100;
        });
        
        const variance = dailyReturns.reduce((sum, dailyReturn) => {
            return sum + Math.pow(dailyReturn - avgDailyReturn, 2);
        }, 0) / dailyReturns.length;
        
        const stdDeviation = Math.sqrt(variance);
        
        // Daily risk-free rate
        const dailyRiskFreeRate = (Math.pow(1 + riskFreeRate, 1/365) - 1) * 100;
        
        // Calculate Sharpe ratio (annualized)
        const annualizationFactor = Math.sqrt(252); // Trading days in a year
        const sharpeRatio = ((avgDailyReturn - dailyRiskFreeRate) / stdDeviation) * annualizationFactor;
        
        return isNaN(sharpeRatio) ? 0 : sharpeRatio;
    }
    
    /**
     * Calculate the maximum drawdown
     * @returns {Object} - Object with max drawdown percentage and duration
     */
    function getMaxDrawdown() {
        if (closedTrades.length === 0) {
            return { percentage: 0, durationDays: 0, startDate: null, endDate: null };
        }
        
        // We need to sort trades by exit date to calculate the equity curve
        const sortedTrades = [...closedTrades].sort((a, b) => a.exitDate - b.exitDate);
        
        // Calculate running equity curve
        let peak = 0;
        let maxDrawdown = 0;
        let currentDrawdown = 0;
        let drawdownStartDate = null;
        let drawdownEndDate = null;
        let maxDrawdownStartDate = null;
        let maxDrawdownEndDate = null;
        let currentEquity = 0;
        
        sortedTrades.forEach(trade => {
            currentEquity += trade.plValue;
            
            if (currentEquity > peak) {
                // New equity peak
                peak = currentEquity;
                drawdownStartDate = trade.exitDate;
                currentDrawdown = 0;
            } else {
                // In drawdown
                currentDrawdown = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
                
                if (currentDrawdown > maxDrawdown) {
                    maxDrawdown = currentDrawdown;
                    maxDrawdownStartDate = drawdownStartDate;
                    maxDrawdownEndDate = trade.exitDate;
                }
            }
        });
        
        // Calculate drawdown duration in days
        const durationDays = maxDrawdownStartDate && maxDrawdownEndDate ? 
            Math.floor((maxDrawdownEndDate - maxDrawdownStartDate) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
            percentage: maxDrawdown,
            durationDays: durationDays,
            startDate: maxDrawdownStartDate,
            endDate: maxDrawdownEndDate
        };
    }
    
    /**
     * Calculate the expectancy per trade
     * @returns {number} - Expectancy (average P&L per trade)
     */
    function getExpectancy() {
        if (closedTrades.length === 0) return 0;
        
        const winRate = getTradeStatistics().winRate / 100;
        const averageWin = closedTrades.filter(t => t.plPercent > 0).reduce((sum, t) => sum + t.plPercent, 0) / 
                          (closedTrades.filter(t => t.plPercent > 0).length || 1);
        const averageLoss = closedTrades.filter(t => t.plPercent <= 0).reduce((sum, t) => sum + Math.abs(t.plPercent), 0) / 
                           (closedTrades.filter(t => t.plPercent <= 0).length || 1);
        
        // Expectancy formula: (Win Rate × Average Win) - (Loss Rate × Average Loss)
        return (winRate * averageWin) - ((1 - winRate) * averageLoss);
    }
    
    /**
     * Get winning and losing streaks
     * @returns {Object} - Streak information
     */
    function getStreakInfo() {
        if (closedTrades.length === 0) {
            return {
                currentStreak: { type: 'none', count: 0 },
                longestWinStreak: 0,
                longestLossStreak: 0,
                averageWinStreak: 0,
                averageLossStreak: 0
            };
        }
        
        // Sort trades by exit date
        const sortedTrades = [...closedTrades].sort((a, b) => a.exitDate - b.exitDate);
        
        let currentStreakType = null;
        let currentStreakCount = 0;
        let longestWinStreak = 0;
        let longestLossStreak = 0;
        let winStreaks = [];
        let lossStreaks = [];
        
        sortedTrades.forEach(trade => {
            const isProfitable = trade.plPercent > 0;
            
            if (currentStreakType === null) {
                // First trade
                currentStreakType = isProfitable ? 'win' : 'loss';
                currentStreakCount = 1;
            } else if ((currentStreakType === 'win' && isProfitable) || 
                       (currentStreakType === 'loss' && !isProfitable)) {
                // Continuing the streak
                currentStreakCount++;
            } else {
                // Streak broken, record the previous streak
                if (currentStreakType === 'win') {
                    winStreaks.push(currentStreakCount);
                    longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
                } else {
                    lossStreaks.push(currentStreakCount);
                    longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
                }
                
                // Start new streak
                currentStreakType = isProfitable ? 'win' : 'loss';
                currentStreakCount = 1;
            }
        });
        
        // Record the final streak
        if (currentStreakType === 'win') {
            winStreaks.push(currentStreakCount);
            longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
        } else if (currentStreakType === 'loss') {
            lossStreaks.push(currentStreakCount);
            longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
        }
        
        // Calculate average streak lengths
        const averageWinStreak = winStreaks.length > 0 ? 
            winStreaks.reduce((sum, streak) => sum + streak, 0) / winStreaks.length : 0;
        
        const averageLossStreak = lossStreaks.length > 0 ? 
            lossStreaks.reduce((sum, streak) => sum + streak, 0) / lossStreaks.length : 0;
        
        return {
            currentStreak: { type: currentStreakType, count: currentStreakCount },
            longestWinStreak,
            longestLossStreak,
            averageWinStreak,
            averageLossStreak
        };
    }
    
    /**
     * Calculate trade by holding period statistics
     * @returns {Object} - Stats grouped by holding period
     */
    function getHoldingPeriodStats() {
        if (closedTrades.length === 0) {
            return {
                shortTerm: { count: 0, avgPL: 0, winRate: 0 },
                mediumTerm: { count: 0, avgPL: 0, winRate: 0 },
                longTerm: { count: 0, avgPL: 0, winRate: 0 }
            };
        }
        
        // Group trades by holding period
        // Short term: 0-7 days
        // Medium term: 8-21 days
        // Long term: 22+ days
        const shortTerm = closedTrades.filter(t => {
            const holdingDays = Math.floor((t.exitDate - t.entryDate) / (1000 * 60 * 60 * 24));
            return holdingDays <= 7;
        });
        
        const mediumTerm = closedTrades.filter(t => {
            const holdingDays = Math.floor((t.exitDate - t.entryDate) / (1000 * 60 * 60 * 24));
            return holdingDays > 7 && holdingDays <= 21;
        });
        
        const longTerm = closedTrades.filter(t => {
            const holdingDays = Math.floor((t.exitDate - t.entryDate) / (1000 * 60 * 60 * 24));
            return holdingDays > 21;
        });
        
        // Calculate statistics for each group
        function calcStats(trades) {
            if (trades.length === 0) {
                return { count: 0, avgPL: 0, winRate: 0 };
            }
            
            const avgPL = trades.reduce((sum, t) => sum + t.plPercent, 0) / trades.length;
            const winCount = trades.filter(t => t.plPercent > 0).length;
            const winRate = (winCount / trades.length) * 100;
            
            return {
                count: trades.length,
                avgPL,
                winRate
            };
        }
        
        return {
            shortTerm: calcStats(shortTerm),
            mediumTerm: calcStats(mediumTerm),
            longTerm: calcStats(longTerm)
        };
    }
    
    /**
     * Get data for equity curve chart
     * @returns {Array} - Array of data points for equity curve chart
     */
    function getEquityCurveData() {
        // Return cached data if available
        if (equityCurveData) return equityCurveData;
        
        if (closedTrades.length === 0) {
            return [];
        }
        
        // Sort trades by exit date
        const sortedTrades = [...closedTrades].sort((a, b) => a.exitDate - b.exitDate);
        
        let equityCurve = [
            {
                date: sortedTrades[0].entryDate,
                equity: 0,
                equityPercent: 0
            }
        ];
        
        let runningTotal = 0;
        let initialInvestment = closedTrades.reduce((sum, t) => sum + t.investmentAmount, 0);
        
        sortedTrades.forEach(trade => {
            runningTotal += trade.plValue;
            
            equityCurve.push({
                date: trade.exitDate,
                equity: runningTotal,
                equityPercent: (runningTotal / initialInvestment) * 100
            });
        });
        
        // Add active trades to the equity curve if they exist
        if (activeTrades.length > 0) {
            // Sort active trades by entry date
            const sortedActiveTrades = [...activeTrades].sort((a, b) => a.entryDate - b.entryDate);
            
            // Add active trade current performance to the equity curve
            sortedActiveTrades.forEach(trade => {
                runningTotal += trade.currentPLValue;
                
                equityCurve.push({
                    date: new Date(), // Current date for active trades
                    equity: runningTotal,
                    equityPercent: (runningTotal / initialInvestment) * 100,
                    isActive: true
                });
            });
        }
        
        // Cache the result
        equityCurveData = equityCurve;
        
        return equityCurve;
    }
    
    /**
     * Get data for drawdown chart
     * @returns {Array} - Array of data points for drawdown chart
     */
    function getDrawdownChartData() {
        // Return cached data if available
        if (drawdownData) return drawdownData;
        
        if (closedTrades.length === 0) {
            return [];
        }
        
        const equityCurve = getEquityCurveData();
        
        let peak = 0;
        let drawdownSeries = [];
        
        // Calculate drawdown at each point
        equityCurve.forEach(point => {
            if (point.equity > peak) {
                peak = point.equity;
                drawdownSeries.push({
                    date: point.date,
                    drawdown: 0
                });
            } else {
                const drawdownPercent = peak !== 0 ? ((peak - point.equity) / peak) * 100 : 0;
                drawdownSeries.push({
                    date: point.date,
                    drawdown: drawdownPercent
                });
            }
        });
        
        // Cache the result
        drawdownData = drawdownSeries;
        
        return drawdownSeries;
    }
    
    /**
     * Get P&L distribution data for histogram
     * @returns {Object} - P&L distribution data
     */
    function getPLDistributionData() {
        if (closedTrades.length === 0) {
            return {
                bins: [],
                counts: []
            };
        }
        
        // Define bins for P&L distribution (-50% to +50% in 5% increments)
        const binSize = 5;
        const minBin = -50;
        const maxBin = 50;
        const numBins = Math.ceil((maxBin - minBin) / binSize);
        
        let bins = Array(numBins).fill().map((_, i) => minBin + (i * binSize));
        let counts = Array(numBins).fill(0);
        
        // Count trades in each bin
        closedTrades.forEach(trade => {
            // Find the appropriate bin
            const binIndex = Math.min(
                numBins - 1,
                Math.max(
                    0,
                    Math.floor((trade.plPercent - minBin) / binSize)
                )
            );
            
            counts[binIndex]++;
        });
        
        return {
            bins,
            counts
        };
    }
    
    /**
     * Generate calendar heatmap data
     * @param {number} year - The year to generate data for (defaults to current year)
     * @returns {Object} - Calendar heatmap data
     */
    function getCalendarHeatmapData(year = new Date().getFullYear()) {
        // Initialize result object with dates and values
        const result = {};
        
        // Loop through the entire year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        // Initialize calendar with 0 values
        for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
            const dateKey = formatDateISO(day);
            result[dateKey] = {
                trades: 0,
                value: 0,
                date: new Date(day)
            };
        }
        
        // Add closed trade data to the calendar
        closedTrades.forEach(trade => {
            if (trade.exitDate.getFullYear() === year) {
                const dateKey = formatDateISO(trade.exitDate);
                
                if (result[dateKey]) {
                    result[dateKey].trades += 1;
                    result[dateKey].value += trade.plPercent;
                }
            }
        });
        
        // Convert to array for easier consumption
        const calendarData = Object.keys(result).map(date => ({
            date,
            trades: result[date].trades,
            value: result[date].trades > 0 ? result[date].value / result[date].trades : 0,
            totalValue: result[date].value,
            dateObj: result[date].date
        }));
        
        return calendarData;
    }
    
    /**
     * Format date to ISO format YYYY-MM-DD
     * @param {Date} date - Date to format
     * @returns {string} - Formatted date string
     */
    function formatDateISO(date) {
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Get monthly performance data
     * @returns {Array} - Monthly performance data
     */
    function getMonthlyPerformanceData() {
        if (closedTrades.length === 0) {
            return [];
        }
        
        // Get the range of dates
        const dates = closedTrades.map(t => t.exitDate);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        // Initialize the monthly performance array
        const monthlyPerformance = [];
        
        // Loop through each month in the range
        for (let year = minDate.getFullYear(); year <= maxDate.getFullYear(); year++) {
            const startMonth = (year === minDate.getFullYear()) ? minDate.getMonth() : 0;
            const endMonth = (year === maxDate.getFullYear()) ? maxDate.getMonth() : 11;
            
            for (let month = startMonth; month <= endMonth; month++) {
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0); // Last day of month
                
                // Filter trades for this month
                const tradesInMonth = closedTrades.filter(trade => 
                    trade.exitDate >= startDate && trade.exitDate <= endDate);
                
                if (tradesInMonth.length > 0) {
                    const totalPL = tradesInMonth.reduce((sum, trade) => sum + trade.plPercent, 0);
                    const avgPL = totalPL / tradesInMonth.length;
                    const winCount = tradesInMonth.filter(t => t.plPercent > 0).length;
                    const winRate = tradesInMonth.length > 0 ? (winCount / tradesInMonth.length) * 100 : 0;
                    
                    monthlyPerformance.push({
                        year,
                        month,
                        monthName: new Date(year, month, 1).toLocaleString('default', { month: 'short' }),
                        trades: tradesInMonth.length,
                        totalPL,
                        avgPL,
                        winRate
                    });
                } else {
                    // Add month with zero data
                    monthlyPerformance.push({
                        year,
                        month,
                        monthName: new Date(year, month, 1).toLocaleString('default', { month: 'short' }),
                        trades: 0,
                        totalPL: 0,
                        avgPL: 0,
                        winRate: 0
                    });
                }
            }
        }
        
        return monthlyPerformance;
    }
    
    /**
     * Get trade exit reason breakdown
     * @returns {Array} - Exit reason breakdown data
     */
    function getExitReasonBreakdown() {
        if (closedTrades.length === 0) {
            return [];
        }
        
        // Count trades by exit reason
        const exitReasons = {};
        
        closedTrades.forEach(trade => {
            const reason = trade.exitReason || 'Unknown';
            
            if (!exitReasons[reason]) {
                exitReasons[reason] = {
                    reason,
                    count: 0,
                    totalPL: 0,
                    wins: 0,
                    losses: 0
                };
            }
            
            exitReasons[reason].count++;
            exitReasons[reason].totalPL += trade.plPercent;
            
            if (trade.plPercent > 0) {
                exitReasons[reason].wins++;
            } else {
                exitReasons[reason].losses++;
            }
        });
        
        // Convert to array and calculate averages
        return Object.values(exitReasons).map(item => ({
            ...item,
            avgPL: item.count > 0 ? item.totalPL / item.count : 0,
            winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
            percentage: (item.count / closedTrades.length) * 100
        }));
    }
    
    /**
     * Get advanced trading metrics
     * @returns {Object} - Complete set of trading metrics
     */
    function getAdvancedMetrics() {
        const basicStats = getTradeStatistics();
        const sharpeRatio = getSharpeRatio();
        const maxDrawdown = getMaxDrawdown();
        const expectancy = getExpectancy();
        const streakInfo = getStreakInfo();
        const holdingPeriodStats = getHoldingPeriodStats();
        
        // Calculate average trade duration
        let avgTradeDuration = 0;
        if (closedTrades.length > 0) {
            const totalDuration = closedTrades.reduce((sum, trade) => {
                const duration = Math.floor((trade.exitDate - trade.entryDate) / (1000 * 60 * 60 * 24));
                return sum + duration;
            }, 0);
            avgTradeDuration = totalDuration / closedTrades.length;
        }
        
        // Calculate annualized return
        let annualizedReturn = 0;
        if (closedTrades.length > 0) {
            const firstTradeDate = new Date(Math.min(...closedTrades.map(t => t.entryDate)));
            const lastTradeDate = new Date(Math.max(...closedTrades.map(t => t.exitDate)));
            const tradingPeriodDays = Math.max(1, Math.floor((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24)));
            const totalReturn = closedTrades.reduce((sum, t) => sum + t.plPercent, 0);
            
            // Annualize the return
            annualizedReturn = ((1 + (totalReturn / 100)) ** (365 / tradingPeriodDays) - 1) * 100;
        }
        
        return {
            ...basicStats,
            sharpeRatio,
            maxDrawdown: maxDrawdown.percentage,
            maxDrawdownDuration: maxDrawdown.durationDays,
            expectancy,
            streakInfo,
            holdingPeriodStats,
            avgTradeDuration,
            annualizedReturn,
            riskRewardRatio: basicStats.avgProfit / (basicStats.totalClosed - basicStats.winningTrades > 0 ? 
                               Math.abs(closedTrades.filter(t => t.plPercent <= 0).reduce((sum, t) => sum + t.plPercent, 0) / 
                               (basicStats.totalClosed - basicStats.winningTrades)) : 1)
        };
    }
    
    /**
     * Get data for win/loss pie chart
     * @returns {Object} - Pie chart data
     */
    function getWinLossPieChartData() {
        const stats = getTradeStatistics();
        
        return {
            labels: ['Winning Trades', 'Losing Trades'],
            data: [stats.winningTrades, stats.losingTrades],
            colors: ['var(--success-color)', 'var(--danger-color)']
        };
    }
    
    /**
     * Get performance comparison data by market
     * @returns {Array} - Performance data by market
     */
    function getPerformanceByMarket() {
        if (closedTrades.length === 0) {
            return [];
        }
        
        // Group trades by market (currency symbol)
        const markets = {};
        
        closedTrades.forEach(trade => {
            const currency = trade.currencySymbol || CURRENCY_SYMBOL;
            const marketName = currency === '$' ? 'US Market' : 
                             currency === '£' ? 'UK Market' : 
                             currency === '₹' ? 'India Market' : 'Other';
            
            if (!markets[marketName]) {
                markets[marketName] = {
                    name: marketName,
                    currency,
                    trades: 0,
                    totalPL: 0,
                    wins: 0,
                    losses: 0
                };
            }
            
            markets[marketName].trades++;
            markets[marketName].totalPL += trade.plPercent;
            
            if (trade.plPercent > 0) {
                markets[marketName].wins++;
            } else {
                markets[marketName].losses++;
            }
        });
        
        // Convert to array and calculate additional metrics
        return Object.values(markets).map(market => ({
            ...market,
            avgPL: market.trades > 0 ? market.totalPL / market.trades : 0,
            winRate: market.trades > 0 ? (market.wins / market.trades) * 100 : 0,
            percentage: (market.trades / closedTrades.length) * 100
        }));
    }
    
    /**
     * Get trade size vs. return correlation data
     * @returns {Array} - Scatter plot data points
     */
    function getTradeSizeVsReturnData() {
        if (closedTrades.length === 0) {
            return [];
        }
        
        return closedTrades.map(trade => ({
            size: trade.investmentAmount,
            return: trade.plPercent,
            symbol: trade.symbol,
            stockName: trade.stockName,
            exitDate: trade.exitDate,
            holdingDays: Math.floor((trade.exitDate - trade.entryDate) / (1000 * 60 * 60 * 24)),
            currencySymbol: trade.currencySymbol || CURRENCY_SYMBOL
        }));
    }
    
    // Return public API
    return {
        init,
        loadTradesFromStorage,
        updatePrices,
        addNewTrade,
        editTrade,
        deleteTrade,
        closeTrade,
        clearTradeHistory,
        exportTradeHistoryCSV,
        updateCountBadges,
        getTradeStatistics,
        getTradeStatisticsByCurrency,
        getTrades,
        getTradesByCurrency,
        getTradeById,
        setSelectedTradeId,
        getSelectedTradeId,
        showNotification,
        formatDate,
        formatDateForFilename,
        CURRENCY_SYMBOL,
        getCurrencySymbol,
        
        // New export/import functions
        exportAllTradesJSON,
        importTradesFromJSON,
        
        // Advanced metrics methods
        getSharpeRatio,
        getMaxDrawdown,
        getExpectancy,
        getStreakInfo,
        getHoldingPeriodStats,
        getAdvancedMetrics,
        
        // Visualization data methods
        getEquityCurveData,
        getDrawdownChartData,
        getPLDistributionData,
        getCalendarHeatmapData,
        getMonthlyPerformanceData,
        getExitReasonBreakdown,
        getWinLossPieChartData,
        getPerformanceByMarket,
        getTradeSizeVsReturnData
    };
})();

// Initialize the trade core
document.addEventListener('DOMContentLoaded', TradeCore.init);

// Make the addNewTrade function available globally for the trade modal
window.addNewTrade = TradeCore.addNewTrade;

// Make the showNotification function available globally
window.showNotification = TradeCore.showNotification;