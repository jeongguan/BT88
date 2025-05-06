/**
 * DTI Backtester - Backtesting Module
 * Handles backtesting logic, trade signal generation, and performance analysis
 */

// Create DTIBacktest module
const DTIBacktest = (function() {
    /**
     * Modified backtest function that detects active trades
     * @param {Array} dates - Array of date strings
     * @param {Array} prices - Close prices
     * @param {Array} dti - DTI values
     * @param {Object} sevenDayDTIData - 7-day DTI data
     * @returns {Object} - Object containing completed trades and active trade
     */
    function backtestWithActiveDetection(dates, prices, dti, sevenDayDTIData) {
        // Validate inputs
        if (!dates || !prices || !dti || !sevenDayDTIData || 
            dates.length !== prices.length || dates.length !== dti.length) {
            console.error('Invalid inputs for backtesting');
            return { completedTrades: [], activeTrade: null };
        }
        
        // Get trading parameters from UI
        const entryThreshold = parseFloat(document.getElementById('entry-threshold').value);
        const takeProfitPercent = parseFloat(document.getElementById('take-profit').value);
        const stopLossPercent = parseFloat(document.getElementById('stop-loss').value);
        const maxHoldingDays = parseInt(document.getElementById('max-days').value);
        const enable7DayDTI = document.getElementById('enable-weekly-dti').checked;
        
        const daily7DayDTI = sevenDayDTIData.daily7DayDTI;
        const sevenDayData = sevenDayDTIData.sevenDayData;
        const sevenDayDTI = sevenDayDTIData.sevenDayDTI;
        
        // Calculate the earliest allowed trade date (6 months after the first date)
        const firstDate = new Date(dates[0]);
        const earliestAllowableDate = new Date(firstDate);
        earliestAllowableDate.setMonth(firstDate.getMonth() + 6);
        
        let completedTrades = [];
        let activeTrade = null;
        let previousTradeCompleted = false; // Flag to track if we've completed a trade
        
        // Store the warm-up period info for visualization
        DTIBacktester.warmupInfo = {
            startDate: firstDate,
            endDate: earliestAllowableDate,
            enabled: true
        };
        
        for (let i = 1; i < dti.length; i++) {
            const currentDate = dates[i];
            const currentPrice = prices[i];
            const currentDTI = dti[i];
            const previousDTI = dti[i-1];
            
            // Get current and previous 7-day DTI values
            const current7DayDTI = daily7DayDTI[i];
            
            // Find previous 7-day period's DTI
            let previous7DayDTI = null;
            let currentPeriodIndex = -1;
            
            // Find which 7-day period the current day belongs to
            for (let p = 0; p < sevenDayData.length; p++) {
                if (i >= sevenDayData[p].startIndex && i <= sevenDayData[p].endIndex) {
                    currentPeriodIndex = p;
                    break;
                }
            }
            
            // Get previous 7-day period's DTI if available
            if (currentPeriodIndex > 0) {
                previous7DayDTI = sevenDayDTI[currentPeriodIndex - 1];
            }
            
            // If we have an active trade, check exit conditions
            if (activeTrade) {
                // Calculate holding period in days
                const entryDateObj = new Date(activeTrade.entryDate);
                const currentDateObj = new Date(currentDate);
                const holdingDays = Math.floor((currentDateObj - entryDateObj) / (24 * 60 * 60 * 1000));
                
                // Calculate profit/loss percentage
                const plPercent = (currentPrice - activeTrade.entryPrice) / activeTrade.entryPrice * 100;
                
                // Update current price and P/L in the active trade
                activeTrade.currentPrice = currentPrice;
                activeTrade.currentPlPercent = plPercent;
                activeTrade.holdingDays = holdingDays;
                
                // Check exit conditions: take profit, stop loss, or time-based exit
                if (plPercent >= takeProfitPercent) {
                    // Take profit exit
                    activeTrade.exitDate = currentDate;
                    activeTrade.exitPrice = currentPrice;
                    activeTrade.plPercent = plPercent;
                    activeTrade.exitReason = 'Take Profit';
                    
                    completedTrades.push({...activeTrade});
                    activeTrade = null;
                    previousTradeCompleted = true;
                } else if (plPercent <= -stopLossPercent) {
                    // Stop loss exit
                    activeTrade.exitDate = currentDate;
                    activeTrade.exitPrice = currentPrice;
                    activeTrade.plPercent = plPercent;
                    activeTrade.exitReason = 'Stop Loss';
                    
                    completedTrades.push({...activeTrade});
                    activeTrade = null;
                    previousTradeCompleted = true;
                } else if (holdingDays >= maxHoldingDays) {
                    // Time-based exit (max days elapsed)
                    activeTrade.exitDate = currentDate;
                    activeTrade.exitPrice = currentPrice;
                    activeTrade.plPercent = plPercent;
                    activeTrade.exitReason = 'Time Exit';
                    
                    completedTrades.push({...activeTrade});
                    activeTrade = null;
                    previousTradeCompleted = true;
                }
            } else {
                // If no active trade, check entry conditions
                let sevenDayConditionMet = true;
                
                // If 7-day DTI filter is enabled, check if current 7-day period's DTI is improving
                if (enable7DayDTI && previous7DayDTI !== null) {
                    sevenDayConditionMet = current7DayDTI > previous7DayDTI;
                }
                
                // Current date must be at least 6 months after the start of the dataset
                const currentDateObj = new Date(currentDate);
                
                // Entry conditions:
                // 1. DTI should be below entry threshold (default -40)
                // 2. Current DTI should be higher than previous DTI (improving)
                // 3. 7-day DTI condition should be met (if enabled)
                // 4. Either no trades yet or previous trade has been completed
                // 5. Current date must be after the warm-up period (6 months)
                if (currentDTI < entryThreshold && 
                    currentDTI > previousDTI && 
                    sevenDayConditionMet && 
                    (completedTrades.length === 0 || previousTradeCompleted) &&
                    currentDateObj >= earliestAllowableDate) {
                    // Enter new trade
                    activeTrade = {
                        entryDate: currentDate,
                        entryPrice: currentPrice,
                        currentPrice: currentPrice,
                        entryDTI: currentDTI,
                        entry7DayDTI: current7DayDTI,
                        currentPlPercent: 0,
                        holdingDays: 0,
                        signalDate: new Date(currentDate)
                    };
                    
                    previousTradeCompleted = false; // Reset flag since we're in a new trade
                }
            }
        }
        
        // If we still have an active trade at the end of the data, keep it as is
        // for active trades detection (do not close it)
        
        return {
            completedTrades: completedTrades,
            activeTrade: activeTrade
        };
    }
    
    /**
     * Original backtest function for backward compatibility
     * @param {Array} dates - Array of date strings
     * @param {Array} prices - Close prices
     * @param {Array} dti - DTI values
     * @param {Object} sevenDayDTIData - 7-day DTI data
     * @returns {Array} - Array of all trades (completed and active)
     */
    function backtest(dates, prices, dti, sevenDayDTIData) {
        const result = backtestWithActiveDetection(dates, prices, dti, sevenDayDTIData);
        return [...result.completedTrades, ...(result.activeTrade ? [result.activeTrade] : [])];
    }
    
    /**
     * Calculate performance metrics for a set of trades
     * @param {Array} trades - Array of trade objects
     * @returns {Object} - Performance metrics including win rate
     */
    function calculatePerformanceMetrics(trades) {
        if (!trades || trades.length === 0) {
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                avgProfit: 0,
                totalReturn: 0,
                profitFactor: 0,
                maxDrawdown: 0,
                avgHoldingPeriod: 0,
                takeProfitCount: 0,
                stopLossCount: 0,
                timeExitCount: 0,
                endOfDataCount: 0,
                convictionLevel: 'insufficient-data' // Default conviction level when no data
            };
        }
        
        // Filter out active trades (those without exit info)
        const completedTrades = trades.filter(trade => trade.exitDate && trade.exitReason);
        
        let winningTrades = 0;
        let losingTrades = 0;
        let totalProfit = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let totalHoldingDays = 0;
        let takeProfitCount = 0;
        let stopLossCount = 0;
        let timeExitCount = 0;
        let endOfDataCount = 0;
        
        // Calculate equity curve for drawdown
        let peak = 0;
        let drawdown = 0;
        let maxDrawdown = 0;
        let equityCurve = [100]; // Start with $100
        
        completedTrades.forEach((trade, index) => {
            // Count winning/losing trades
            if (trade.plPercent > 0) {
                winningTrades++;
                grossProfit += trade.plPercent;
            } else {
                losingTrades++;
                grossLoss += Math.abs(trade.plPercent);
            }
            
            // Calculate total profit
            totalProfit += trade.plPercent;
            
            // Update equity curve
            const equityChange = equityCurve[equityCurve.length - 1] * (1 + (trade.plPercent / 100));
            equityCurve.push(equityChange);
            
            // Update peak and calculate drawdown
            if (equityChange > peak) {
                peak = equityChange;
            }
            
            if (peak > 0) {
                drawdown = (peak - equityChange) / peak * 100;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
            
            // Calculate holding period
            const entryDate = new Date(trade.entryDate);
            const exitDate = new Date(trade.exitDate);
            const holdingDays = Math.floor((exitDate - entryDate) / (24 * 60 * 60 * 1000));
            totalHoldingDays += holdingDays;
            
            // Count exit reasons
            switch(trade.exitReason) {
                case 'Take Profit':
                    takeProfitCount++;
                    break;
                case 'Stop Loss':
                    stopLossCount++;
                    break;
                case 'Time Exit':
                    timeExitCount++;
                    break;
                case 'End of Data':
                    endOfDataCount++;
                    break;
            }
        });
        
        const totalTrades = completedTrades.length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
        const avgProfit = totalTrades > 0 ? (totalProfit / totalTrades) : 0;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? Infinity : 0;
        const avgHoldingPeriod = totalTrades > 0 ? (totalHoldingDays / totalTrades) : 0;
        
        // Determine conviction level based on win rate and trade count
        let convictionLevel = 'insufficient-data';
        if (totalTrades >= 3) {
            if (winRate > 75) {
                convictionLevel = 'high-conviction';
            } else if (winRate >= 50) {
                convictionLevel = 'moderate-conviction';
            } else {
                convictionLevel = 'low-conviction';
            }
        }
        
        return {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            avgProfit,
            totalReturn: totalProfit,
            profitFactor,
            maxDrawdown,
            avgHoldingPeriod,
            takeProfitCount,
            stopLossCount,
            timeExitCount,
            endOfDataCount,
            equityCurve,
            convictionLevel
        };
    }
    
    /**
     * Custom entry point style (arrow up in circle) for chart
     * @param {Object} context - Chart.js drawing context
     */
    function customEntryPointStyle(context) {
        const ctx = context.chart.ctx;
        const x = context.x;
        const y = context.y;
        const radius = context.raw ? Math.max(6, Math.min(10, Math.abs(context.raw / 50))) : 6;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 1)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrow up
        ctx.beginPath();
        ctx.moveTo(x, y - radius/2);
        ctx.lineTo(x, y + radius/2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - radius/2, y);
        ctx.lineTo(x, y - radius/2);
        ctx.lineTo(x + radius/2, y);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    /**
     * Custom exit point style (circle with x) for chart
     * @param {Object} context - Chart.js drawing context
     */
    function customExitPointStyle(context) {
        const ctx = context.chart.ctx;
        const x = context.x;
        const y = context.y;
        const radius = context.raw ? Math.max(6, Math.min(10, Math.abs(context.raw / 50))) : 6;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 1)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw X
        ctx.beginPath();
        ctx.moveTo(x - radius/2, y - radius/2);
        ctx.lineTo(x + radius/2, y + radius/2);
        ctx.moveTo(x + radius/2, y - radius/2);
        ctx.lineTo(x - radius/2, y + radius/2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    /**
     * Generate trade markers for charts
     * @param {Array} dates - Array of date strings
     * @param {Array} prices - Close prices
     * @param {Array} trades - Array of trade objects
     * @returns {Object} - Chart markers and metadata
     */
    function generateTradeMarkers(dates, prices, trades) {
        // Initialize arrays for markers
        const entryMarkers = Array(dates.length).fill(null);
        const exitMarkers = Array(dates.length).fill(null);
        const tradeConnections = [];
        const tradeProfitLoss = [];
        const tradeMetadata = [];
        
        // Process each trade
        trades.forEach(trade => {
            // Only mark completed trades on the chart
            if (trade.exitDate && trade.exitReason) {
                const entryIndex = dates.indexOf(trade.entryDate);
                const exitIndex = dates.indexOf(trade.exitDate);
                
                if (entryIndex !== -1 && exitIndex !== -1) {
                    // Store entry/exit points
                    entryMarkers[entryIndex] = prices[entryIndex];
                    exitMarkers[exitIndex] = prices[exitIndex];
                    
                    // Store trade data for tooltips
                    tradeMetadata[entryIndex] = {
                        type: 'entry',
                        price: trade.entryPrice,
                        date: trade.entryDate,
                        plPercent: trade.plPercent,
                        holdingDays: Math.floor((new Date(trade.exitDate) - new Date(trade.entryDate)) / (1000 * 60 * 60 * 24))
                    };
                    
                    tradeMetadata[exitIndex] = {
                        type: 'exit',
                        price: trade.exitPrice,
                        date: trade.exitDate,
                        plPercent: trade.plPercent,
                        exitReason: trade.exitReason
                    };
                    
                    // Generate connection line data
                    const connectionData = generateConnectionLine(entryIndex, exitIndex, prices, trade.plPercent);
                    tradeConnections.push(...connectionData);
                    
                    // Store if trade was profit or loss for coloring
                    for (let i = entryIndex; i <= exitIndex; i++) {
                        tradeProfitLoss[i] = trade.plPercent;
                    }
                }
            }
        });
        
        return {
            entryMarkers,
            exitMarkers,
            tradeConnections,
            tradeProfitLoss,
            tradeMetadata
        };
    }
    
    /**
     * Generate connection line between entry and exit points
     * @param {number} startIdx - Entry index
     * @param {number} endIdx - Exit index
     * @param {Array} prices - Price data
     * @param {number} plPercent - Profit/loss percentage
     * @returns {Array} - Connection line data
     */
    function generateConnectionLine(startIdx, endIdx, prices, plPercent) {
        const line = [];
        
        // Generate points for the line
        for (let i = startIdx; i <= endIdx; i++) {
            line.push({
                x: i,
                y: prices[i],
                plPercent: plPercent
            });
        }
        
        return line;
    }
    
    /**
     * Get conviction level based on win rate and trade count
     * @param {number} winRate - Win rate percentage 
     * @param {number} totalTrades - Total number of trades
     * @returns {string} - Conviction level (high-conviction, moderate-conviction, low-conviction, insufficient-data)
     */
    function getConvictionLevel(winRate, totalTrades) {
        if (!totalTrades || totalTrades < 3) {
            return 'insufficient-data';
        }
        
        if (winRate > 75) {
            return 'high-conviction';
        } else if (winRate >= 50) {
            return 'moderate-conviction';
        } else {
            return 'low-conviction';
        }
    }
    
    /**
     * Validate trading parameters
     * @returns {Object} - Validation results
     */
    function validateParameters() {
        const r = parseInt(document.getElementById('r').value);
        const s = parseInt(document.getElementById('s').value);
        const u = parseInt(document.getElementById('u').value);
        const entryThreshold = parseFloat(document.getElementById('entry-threshold').value);
        const takeProfitPercent = parseFloat(document.getElementById('take-profit').value);
        const stopLossPercent = parseFloat(document.getElementById('stop-loss').value);
        const maxHoldingDays = parseInt(document.getElementById('max-days').value);
        
        const errors = [];
        
        if (isNaN(r) || r <= 0) {
            errors.push('EMA Period (r) must be a positive number');
        }
        
        if (isNaN(s) || s <= 0) {
            errors.push('EMA Period (s) must be a positive number');
        }
        
        if (isNaN(u) || u <= 0) {
            errors.push('EMA Period (u) must be a positive number');
        }
        
        if (isNaN(entryThreshold)) {
            errors.push('Entry Threshold must be a number');
        }
        
        if (isNaN(takeProfitPercent) || takeProfitPercent <= 0) {
            errors.push('Take Profit must be a positive number');
        }
        
        if (isNaN(stopLossPercent) || stopLossPercent <= 0) {
            errors.push('Stop Loss must be a positive number');
        }
        
        if (isNaN(maxHoldingDays) || maxHoldingDays <= 0) {
            errors.push('Max Holding Period must be a positive number');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Find optimal parameters using a simple grid search
     * @param {Array} dates - Array of date strings
     * @param {Array} prices - Close prices
     * @param {Object} paramRanges - Parameter ranges to test
     * @returns {Object} - Optimal parameters and results
     */
    function findOptimalParameters(dates, high, low, close, paramRanges) {
        // Default parameter ranges if not provided
        const ranges = paramRanges || {
            r: [7, 14, 21],
            s: [5, 10, 15],
            u: [3, 5, 7],
            entryThreshold: [-50, -40, -30],
            takeProfitPercent: [5, 8, 10],
            stopLossPercent: [3, 5, 7],
            maxHoldingDays: [15, 30, 45]
        };
        
        let bestResult = {
            params: null,
            metrics: {
                totalReturn: -Infinity,
                winRate: 0,
                profitFactor: 0
            }
        };
        
        let results = [];
        
        // Generate all combinations of parameters
        for (const r of ranges.r) {
            for (const s of ranges.s) {
                for (const u of ranges.u) {
                    for (const entryThreshold of ranges.entryThreshold) {
                        for (const takeProfitPercent of ranges.takeProfitPercent) {
                            for (const stopLossPercent of ranges.stopLossPercent) {
                                for (const maxHoldingDays of ranges.maxHoldingDays) {
                                    // Calculate DTI with current parameters
                                    const dti = DTIIndicators.calculateDTI(high, low, r, s, u);
                                    const sevenDayDTIData = DTIIndicators.calculate7DayDTI(dates, high, low, r, s, u);
                                    
                                    // Set UI parameters temporarily
                                    const origR = document.getElementById('r').value;
                                    const origS = document.getElementById('s').value;
                                    const origU = document.getElementById('u').value;
                                    const origEntryThreshold = document.getElementById('entry-threshold').value;
                                    const origTakeProfit = document.getElementById('take-profit').value;
                                    const origStopLoss = document.getElementById('stop-loss').value;
                                    const origMaxDays = document.getElementById('max-days').value;
                                    
                                    document.getElementById('r').value = r;
                                    document.getElementById('s').value = s;
                                    document.getElementById('u').value = u;
                                    document.getElementById('entry-threshold').value = entryThreshold;
                                    document.getElementById('take-profit').value = takeProfitPercent;
                                    document.getElementById('stop-loss').value = stopLossPercent;
                                    document.getElementById('max-days').value = maxHoldingDays;
                                    
                                    // Run backtest with current parameters
                                    const { completedTrades } = backtestWithActiveDetection(dates, close, dti, sevenDayDTIData);
                                    
                                    // Calculate metrics
                                    const metrics = calculatePerformanceMetrics(completedTrades);
                                    
                                    // Store this result
                                    results.push({
                                        params: {
                                            r, s, u, entryThreshold, takeProfitPercent, stopLossPercent, maxHoldingDays
                                        },
                                        metrics
                                    });
                                    
                                    // Update best result if this is better
                                    // Using a simple scoring system: totalReturn * winRate * profitFactor
                                    const currentScore = metrics.totalReturn * (metrics.winRate / 100) * metrics.profitFactor;
                                    const bestScore = bestResult.metrics.totalReturn * (bestResult.metrics.winRate / 100) * bestResult.metrics.profitFactor;
                                    
                                    if (currentScore > bestScore && metrics.totalTrades >= 5) {
                                        bestResult = {
                                            params: {
                                                r, s, u, entryThreshold, takeProfitPercent, stopLossPercent, maxHoldingDays
                                            },
                                            metrics
                                        };
                                    }
                                    
                                    // Restore original parameters
                                    document.getElementById('r').value = origR;
                                    document.getElementById('s').value = origS;
                                    document.getElementById('u').value = origU;
                                    document.getElementById('entry-threshold').value = origEntryThreshold;
                                    document.getElementById('take-profit').value = origTakeProfit;
                                    document.getElementById('stop-loss').value = origStopLoss;
                                    document.getElementById('max-days').value = origMaxDays;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return {
            bestResult,
            allResults: results
        };
    }
    
    // Return public API
    return {
        backtestWithActiveDetection,
        backtest,
        calculatePerformanceMetrics,
        customEntryPointStyle,
        customExitPointStyle,
        generateTradeMarkers,
        validateParameters,
        findOptimalParameters,
        getConvictionLevel
    };
})();

// Make DTIBacktest available globally
window.DTIBacktest = DTIBacktest;