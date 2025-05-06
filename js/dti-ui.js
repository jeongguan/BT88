/**
 * DTI Backtester - UI Module
 * Handles all UI components, charts, visualizations, and user interactions
 */


/**
 * Helper function to get currency symbol based on stock or market
 * @param {string} symbolOrMarket - Stock symbol or market index name
 * @returns {string} - Currency symbol
 */
function getCurrencySymbolForDisplay(symbolOrMarket) {
    if (typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol) {
        return TradeCore.getCurrencySymbol(symbolOrMarket);
    }
    
    // Fallback logic if TradeCore is not available
    if (typeof symbolOrMarket === 'string') {
        if (symbolOrMarket === 'ftse100' || symbolOrMarket.endsWith('.L')) {
            return '£';
        } else if (symbolOrMarket === 'usStocks' || !symbolOrMarket.includes('.')) {
            return '$';
        }
    }
    
    // Default to Indian Rupee
    return '₹';
}

// Create DTIUI module
const DTIUI = (function() {
    /**
     * Create a scan type selector for multi-index scanning
     * @returns {HTMLElement} The scan type selector element
     */
    function createScanTypeSelector() {
        const scanTypeSelectorDiv = document.createElement('div');
        scanTypeSelectorDiv.className = 'parameter-group';
        
        const scanTypeLabel = document.createElement('label');
        scanTypeLabel.htmlFor = 'scan-type-selector';
        scanTypeLabel.textContent = 'Scan Type';
        
        const scanTypeSelect = document.createElement('select');
        scanTypeSelect.id = 'scan-type-selector';
        
        // Add scan type options
        const scanTypes = [
            { value: 'current', text: 'Current Index Only' },
            { value: 'indian', text: 'All Indian Stocks (Nifty)' },
            { value: 'uk', text: 'All UK Stocks (FTSE)' },
            { value: 'us', text: 'All US Stocks' },
            { value: 'all', text: 'All Global Stocks' }
        ];
        
        scanTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.text;
            scanTypeSelect.appendChild(option);
        });
        
        // Add event listener for scan type change
        scanTypeSelect.addEventListener('change', function() {
            updateBatchButtonText();
            
            // Show/hide index selector based on scan type
            const indexSelectorDiv = document.getElementById('index-selector').parentNode;
            const stockSelectorDiv = document.getElementById('stock-selector').parentNode;
            
            if (this.value === 'current') {
                indexSelectorDiv.style.display = 'block';
                stockSelectorDiv.style.display = 'block';
            } else {
                indexSelectorDiv.style.display = 'block';
                stockSelectorDiv.style.display = 'none';
            }
            
            // Show notification for multi-index scans
            if (this.value !== 'current') {
                DTIBacktester.utils.showNotification(`Multi-index scan selected: ${this.options[this.selectedIndex].text}`, 'info');
            }
        });
        
        scanTypeSelectorDiv.appendChild(scanTypeLabel);
        scanTypeSelectorDiv.appendChild(scanTypeSelect);
        
        // Add help text
        const helpText = document.createElement('span');
        helpText.className = 'form-hint';
        helpText.textContent = 'Select which indices to scan for trading opportunities';
        scanTypeSelectorDiv.appendChild(helpText);
        
        return scanTypeSelectorDiv;
    }
    
    /**
     * Get stocks for the selected scan type
     * @returns {Array} Combined list of stocks based on scan type
     */
    function getStocksForSelectedScanType() {
        const scanTypeSelector = document.getElementById('scan-type-selector');
        if (!scanTypeSelector) return DTIData.getCurrentStockListSync() || [];
        
        const scanType = scanTypeSelector.value;
        const stockLists = DTIData.getStockLists() || {};
        
        // Create empty arrays if any list is undefined
        const safeList = (list) => Array.isArray(list) ? list : [];
        
        switch(scanType) {
            case 'current':
                return DTIData.getCurrentStockListSync() || [];
            case 'indian':
                return [
                    ...safeList(stockLists.nifty50),
                    ...safeList(stockLists.niftyNext50),
                    ...safeList(stockLists.niftyMidcap150)
                ];
            case 'uk':
                return [
                    ...safeList(stockLists.ftse100),
                    ...safeList(stockLists.ftse250)
                ];
            case 'us':
                return [
                    ...safeList(stockLists.usMidCap),
                    ...safeList(stockLists.usStocks),
                    ...safeList(stockLists.usSmallCap)
                ];
                
            case 'all':
                return [
                    ...safeList(stockLists.nifty50),
                    ...safeList(stockLists.niftyNext50),
                    ...safeList(stockLists.niftyMidcap150),
                    ...safeList(stockLists.ftse100),
                    ...safeList(stockLists.ftse250),
                    ...safeList(stockLists.usMidCap),
                    ...safeList(stockLists.usStocks),
                    ...safeList(stockLists.usSmallCap)
                ];
            default:
                return DTIData.getCurrentStockListSync() || [];
        }
    }
    
    /**
     * Update batch button text based on scan type
     */
    function updateBatchButtonText() {
        const batchButton = document.getElementById('batch-process-btn');
        if (!batchButton) return;
        
        const scanTypeSelector = document.getElementById('scan-type-selector');
        if (!scanTypeSelector) return;
        
        const scanType = scanTypeSelector.value;
        let buttonText = '';
        
        switch(scanType) {
            case 'current':
                const indexName = 
                    DTIBacktester.currentStockIndex === 'nifty50' ? 'Nifty 50' : 
                    DTIBacktester.currentStockIndex === 'niftyNext50' ? 'DEFLATION' : 
                    DTIBacktester.currentStockIndex === 'niftyMidcap150' ? 'Nifty Midcap 150' :
                    DTIBacktester.currentStockIndex === 'ftse100' ? 'FTSE 100' :
                    DTIBacktester.currentStockIndex === 'ftse250' ? 'FTSE 250' :
                    DTIBacktester.currentStockIndex === 'usSmallCap' ? 'US SmallCap Stocks' :
                    DTIBacktester.currentStockIndex === 'usMidCap' ? 'US MidCap Stocks' :    
                    DTIBacktester.currentStockIndex === 'usStocks' ? 'US Stocks' :
                    DTIBacktester.currentStockIndex === 'indices' ? 'Market Indices' : 'Nifty 50';
                buttonText = `Scan All ${indexName}`;
                break;
            case 'indian':
                buttonText = 'Scan All Indian Stocks';
                break;
            case 'uk':
                buttonText = 'Scan All UK Stocks';
                break;
            case 'us':
                buttonText = 'Scan All US Stocks';
                break;
            case 'all':
                buttonText = 'Scan All Global Stocks';
                break;
            default:
                buttonText = 'Scan Selected Stocks';
        }
        
        batchButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
            ${buttonText}
        `;
    }

    /**
     * Initialize the stock selector UI
     */
    function initStockSelector() {
        // Create scan type selector first (new addition)
        const scanTypeSelector = createScanTypeSelector();
        
        // Create index selector element
        const indexSelectorDiv = document.createElement('div');
        indexSelectorDiv.className = 'parameter-group';
        
        const indexLabel = document.createElement('label');
        indexLabel.htmlFor = 'index-selector';
        indexLabel.textContent = 'Select Stock Index';
        
        const indexSelect = document.createElement('select');
        indexSelect.id = 'index-selector';
        
        // Add index options
        const niftyOption = document.createElement('option');
        niftyOption.value = 'nifty50';
        niftyOption.textContent = 'ETF (US)';
        niftyOption.selected = true;
        indexSelect.appendChild(niftyOption);
        
        // Add DEFLATION option
        const niftyNextOption = document.createElement('option');
        niftyNextOption.value = 'niftyNext50';
        niftyNextOption.textContent = 'DEFLATION';
        indexSelect.appendChild(niftyNextOption);
        
        const ftseOption = document.createElement('option');
        ftseOption.value = 'ftse100';
        ftseOption.textContent = 'LSE (UK)';
        indexSelect.appendChild(ftseOption);

        const ftse250Option = document.createElement('option');
        ftse250Option.value = 'ftse250';
        ftse250Option.textContent = '400 (US)';
        indexSelect.appendChild(ftse250Option);

        const niftyMidcapOption = document.createElement('option');
        niftyMidcapOption.value = 'niftyMidcap150';
        niftyMidcapOption.textContent = 'ETF (UK)';
        indexSelect.appendChild(niftyMidcapOption);

        const usSmallCapOption = document.createElement('option');
        usSmallCapOption.value = 'usSmallCap';
        usSmallCapOption.textContent = 'US SmallCap Stocks';
        indexSelect.appendChild(usSmallCapOption);

        const usMidCapOption = document.createElement('option');
        usMidCapOption.value = 'usMidCap';
        usMidCapOption.textContent = 'US MidCap Stocks';
        indexSelect.appendChild(usMidCapOption);

        const usStocksOption = document.createElement('option');
        usStocksOption.value = 'usStocks';
        usStocksOption.textContent = 'US Stocks (NYSE/NASDAQ)';
        indexSelect.appendChild(usStocksOption);
        

        const indicesOption = document.createElement('option');
        indicesOption.value = 'indices';
        indicesOption.textContent = 'Market Indices';
        indexSelect.appendChild(indicesOption);
        
        // Add event listener for index change
        indexSelect.addEventListener('change', function() {
            DTIBacktester.currentStockIndex = this.value;
            updateStockSelector();
            updateBatchButtonText(); // Update batch button text when index changes
            
            // Update index tabs if they exist
            const indexTabs = document.querySelectorAll('.index-tab');
            indexTabs.forEach(tab => {
                if (tab.getAttribute('data-index') === DTIBacktester.currentStockIndex) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // Show relevant content
            const indexContents = document.querySelectorAll('.index-content');
            indexContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const selectedContent = document.getElementById(`${DTIBacktester.currentStockIndex}-content`);
            if (selectedContent) {
                selectedContent.style.display = 'block';
            }
        });
        
        indexSelectorDiv.appendChild(indexLabel);
        indexSelectorDiv.appendChild(indexSelect);
        
        // Create stock selector element
        const stockSelectorDiv = document.createElement('div');
        stockSelectorDiv.className = 'parameter-group';
        
        const label = document.createElement('label');
        label.htmlFor = 'stock-selector';
        label.textContent = 'Select Stock';
        
        const select = document.createElement('select');
        select.id = 'stock-selector';
        
        stockSelectorDiv.appendChild(label);
        stockSelectorDiv.appendChild(select);
        
        // Populate the stock selector
        populateStockSelector(select);
        
        // Create fetch button
        const fetchButton = document.createElement('button');
        fetchButton.id = 'fetch-data-btn';
        fetchButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Fetch Stock Data
        `;
        fetchButton.style.marginTop = '10px';
        
        // Add event listener for fetch button
        fetchButton.addEventListener('click', async function() {
            const symbol = select.value;
            
            if (!symbol) {
                DTIBacktester.utils.showNotification('Please select a stock first', 'warning');
                return;
            }
            
            // Prevent multiple clicks
            if (DTIBacktester.isProcessing) {
                DTIBacktester.utils.showNotification('Data fetching in progress, please wait', 'info');
                return;
            }
            
            DTIBacktester.isProcessing = true;
            
            // Show loading state
            this.disabled = true;
            this.innerHTML = `
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
                Fetching Data...
            `;
            
            try {
                // Get period from selector
                const periodSelector = document.getElementById('period-selector');
                const period = periodSelector ? periodSelector.value : '5y';
                
                // Find stock name for notification
                // Use the synchronous version to ensure we have an array, not a Promise
                let stockList = [];
                try {
                    stockList = DTIData.getCurrentStockListSync() || [];
                    // Ensure stockList is an array
                    if (!Array.isArray(stockList)) {
                        console.warn("Stock list is not an array, falling back to empty array");
                        stockList = [];
                    }
                } catch (listError) {
                    console.error("Error getting stock list:", listError);
                    stockList = [];
                }
            
                // Add debug logging to help identify issues
                console.log("Stock list loaded, length:", stockList ? stockList.length : 0);
                console.log("Looking for symbol:", symbol);
                
                // Handle potential null/undefined stockList gracefully
                let selectedStock = null;
                if (Array.isArray(stockList)) {
                    selectedStock = stockList.find(stock => stock.symbol === symbol);
                    if (selectedStock) {
                        console.log("Found stock:", selectedStock.name);
                    } else {
                        console.warn("Stock with symbol '" + symbol + "' not found in list");
                    }
                } else {
                    console.error("Stock list is not an array:", stockList);
                }

                const stockName = selectedStock ? selectedStock.name : symbol;
                
                // Fetch stock data 
                const data = await DTIData.fetchStockData(symbol, period);
                
                if (!data) {
                    throw new Error(`Failed to fetch stock data for ${stockName} (${symbol})`);
                }
                
                // Ensure we have enough data
                if (!data.length || data.length < 30) {
                    throw new Error(`Insufficient data for ${stockName} (${symbol}). Need at least 30 data points for analysis.`);
                }
                
                // Convert to CSV
                const csvString = DTIData.arrayToCSV(data);
                
                // Create a Blob and File object
                const blob = new Blob([csvString], { type: 'text/csv' });
                const file = new File([blob], `${symbol}.csv`, { type: 'text/csv' });
                
                // Create a FileList-like object
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                // Set the file input's files
                const fileInput = document.getElementById('csv-upload');
                fileInput.files = dataTransfer.files;
                
                // Trigger the file change event
                const event = new Event('change');
                fileInput.dispatchEvent(event);
                
                // Run the backtest
                document.getElementById('process-btn').click();
                
                // Show detailed success notification
                DTIBacktester.utils.showNotification(`Data for ${stockName} loaded successfully (${data.length - 1} data points)`, 'success');
                
                // Add extra logging for debugging
                console.log(`Successfully processed ${stockName} (${symbol}) with ${data.length - 1} data points`);
                
            } catch (error) {
                console.error('Error processing data:', error);
                DTIBacktester.utils.showNotification(`Error: ${error.message}`, 'error');
            } finally {
                // Reset button state
                this.disabled = false;
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Fetch Stock Data
                `;
                DTIBacktester.isProcessing = false;
            }
        });
        
        stockSelectorDiv.appendChild(fetchButton);
        
        // Add the period selector
        const periodDiv = document.createElement('div');
        periodDiv.className = 'parameter-group';
        
        const periodLabel = document.createElement('label');
        periodLabel.htmlFor = 'period-selector';
        periodLabel.textContent = 'Data Period';
        
        const periodSelect = document.createElement('select');
        periodSelect.id = 'period-selector';
        
        // Add period options
        const periods = [
            { value: '1mo', text: '1 Month' },
            { value: '3mo', text: '3 Months' },
            { value: '6mo', text: '6 Months' },
            { value: '1y', text: '1 Year' },
            { value: '2y', text: '2 Years' },
            { value: '5y', text: '5 Years' },
            { value: 'max', text: 'Max Available' }
        ];
        
        periods.forEach(period => {
            const option = document.createElement('option');
            option.value = period.value;
            option.textContent = period.text;
            if (period.value === '5y') {
                option.selected = true;
            }
            periodSelect.appendChild(option);
        });
        
        periodDiv.appendChild(periodLabel);
        periodDiv.appendChild(periodSelect);
        
        // Append elements to the Data Import section
        const dataImportSection = document.querySelector('.parameters-section:last-child');
        
        // Add scan type selector first, then index selector, then stock selector
        dataImportSection.prepend(stockSelectorDiv);
        dataImportSection.prepend(indexSelectorDiv);
        dataImportSection.prepend(scanTypeSelector); // New addition
        dataImportSection.insertBefore(periodDiv, stockSelectorDiv.nextSibling);
        
        // Add batch process button
        addBatchProcessButton();
        
        // Create status indicator
        const statusDiv = document.createElement('div');
        statusDiv.id = 'data-fetch-status';
        statusDiv.className = 'csv-info';
        statusDiv.style.display = 'none';
        statusDiv.style.marginTop = '10px';
        
        dataImportSection.appendChild(statusDiv);
        
        // Add spinner animation style
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            @keyframes rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spinner {
                animation: rotate 1s linear infinite;
            }
        `;
        document.head.appendChild(spinnerStyle);
    }

    /**
     * Helper function to populate the stock selector based on current index
     * @param {HTMLElement} selectElement - The select element to populate
     */
    function populateStockSelector(selectElement) {
        // Clear existing options
        selectElement.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a stock...';
        selectElement.appendChild(defaultOption);
        
        // Get current stock list
        let stockList = [];
        try {
            stockList = DTIData.getCurrentStockListSync() || [];
            if (!Array.isArray(stockList)) {
                console.warn('Stock list is not an array:', stockList);
                stockList = [];
            }
        } catch (error) {
            console.error('Error getting stock list:', error);
        }
        
        // Add stocks from the current index
        if (stockList && stockList.length > 0) {
            stockList.forEach(stock => {
                const option = document.createElement('option');
                option.value = stock.symbol;
                option.textContent = stock.name;
                selectElement.appendChild(option);
            });
        } else {
            console.warn('No stocks available for current index');
            // Add a fallback option to indicate no stocks
            const noStocksOption = document.createElement('option');
            noStocksOption.disabled = true;
            noStocksOption.textContent = 'No stocks available';
            selectElement.appendChild(noStocksOption);
        }
    }

    /**
     * Update the stock selector when the index changes
     */
    function updateStockSelector() {
        const stockSelector = document.getElementById('stock-selector');
        if (stockSelector) {
            populateStockSelector(stockSelector);
        }
        
        // Update batch process button text
        updateBatchButtonText();
        
        // Clear any previous opportunities
        const opportunitiesContainer = document.getElementById('buying-opportunities');
        if (opportunitiesContainer) {
            opportunitiesContainer.innerHTML = `
                <h3 class="card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                        <line x1="3" y1="22" x2="21" y2="22"></line>
                    </svg>
                    Current Buying Opportunities
                </h3>
                <p class="no-opportunities">No active buying opportunities found. Try adjusting parameters or running a full scan.</p>
            `;
        }
    }

    /**
     * Add a "Batch Process" button
     */
    function addBatchProcessButton() {
        // Create button
        const batchButton = document.createElement('button');
        batchButton.id = 'batch-process-btn';
        const indexName = 
	    DTIBacktester.currentStockIndex === 'nifty50' ? 'Nifty 50' : 
	    DTIBacktester.currentStockIndex === 'niftyNext50' ? 'DEFLATION' : 
	    DTIBacktester.currentStockIndex === 'niftyMidcap150' ? 'Nifty Midcap 150' :
	    DTIBacktester.currentStockIndex === 'ftse100' ? 'FTSE 100' :
	    DTIBacktester.currentStockIndex === 'ftse250' ? 'FTSE 250' :
	    DTIBacktester.currentStockIndex === 'usStocks' ? 'US Stocks' :
        DTIBacktester.currentStockIndex === 'usSmallCap' ? 'US SmallCap Stocks' :
        DTIBacktester.currentStockIndex === 'usMidCap' ? 'US MidCap Stocks' :
	    DTIBacktester.currentStockIndex === 'indices' ? 'Market Indices' : 'Nifty 50';            
        batchButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
            Scan All ${indexName}
        `;
        batchButton.style.marginTop = '10px';
        batchButton.style.backgroundColor = '#673ab7';
        
        // Add event listener
        batchButton.addEventListener('click', async function() {
            if (DTIBacktester.isProcessing) {
                DTIBacktester.utils.showNotification('Scan already in progress, please wait', 'info');
                return;
            }
            
            this.disabled = true;
            
            // Get scan type and update text accordingly
            const scanTypeSelector = document.getElementById('scan-type-selector');
            const scanType = scanTypeSelector ? scanTypeSelector.value : 'current';
            const scanTypeName = scanTypeSelector ? scanTypeSelector.options[scanTypeSelector.selectedIndex].text : 'Current Index';
            
            // Override the stock list in DTIData temporarily for multi-index scan
            const originalGetCurrentStockList = DTIData.getCurrentStockList;
            
            if (scanType !== 'current') {
                // Override the getCurrentStockList method for multi-index scanning
                DTIData.getCurrentStockList = getStocksForSelectedScanType;
                DTIBacktester.utils.showNotification(`Preparing to scan ${scanTypeName}...`, 'info');
            }
            
            // Set button loading state
            this.innerHTML = `
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
                Processing ${scanTypeName}...
            `;
            
            try {
                // Store original index for restoration after scan
                const originalIndex = DTIBacktester.currentStockIndex;
                
                // Perform the batch scan
                await DTIData.fetchAllStocksData();
                
                // Restore original getCurrentStockList method
                if (scanType !== 'current') {
                    DTIData.getCurrentStockList = originalGetCurrentStockList;
                    DTIBacktester.currentStockIndex = originalIndex;
                }
                
                // Update the UI to show the scan completed for the selected scan type
                DTIBacktester.utils.showNotification(`${scanTypeName} scan completed with ${DTIBacktester.activeTradeOpportunities.length} opportunities found`, 'success');
            } catch (error) {
                console.error('Error in batch processing:', error);
                DTIBacktester.utils.showNotification('Error processing stocks: ' + error.message, 'error');
                
                // Restore original getCurrentStockList method on error
                if (scanType !== 'current') {
                    DTIData.getCurrentStockList = originalGetCurrentStockList;
                }
            } finally {
                this.disabled = false;
                // Update button text after scan
                updateBatchButtonText();
            }
        });
        
        // Add batch status indicator
        const batchStatus = document.createElement('div');
        batchStatus.id = 'batch-status';
        batchStatus.className = 'batch-status';
        batchStatus.style.display = 'none';
        
        // Append button to the UI
        const dataImportSection = document.querySelector('.parameters-section:last-child');
        if (dataImportSection) {
            dataImportSection.appendChild(batchButton);
            dataImportSection.appendChild(batchStatus);
        }
    }
    
    /**
     * Create buying opportunities section if it doesn't exist
     */
    function createBuyingOpportunitiesSection() {
        // Create container if it doesn't exist
        if (!document.getElementById('buying-opportunities')) {
            const opportunitiesSection = document.createElement('div');
            opportunitiesSection.className = 'card buying-opportunities-section';
            opportunitiesSection.id = 'buying-opportunities';
            opportunitiesSection.innerHTML = `
                <h3 class="card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                        <line x1="3" y1="22" x2="21" y2="22"></line>
                    </svg>
                    Current Buying Opportunities
                </h3>
                <p class="no-opportunities">No active buying opportunities found. Try adjusting parameters or running a full scan.</p>
            `;
            
            // Add to main content, after backtest results
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.appendChild(opportunitiesSection);
            }
        }
    }
    
    /**
     * Helper to get index display name from stock symbol
     * @param {string} symbol - Stock symbol
     * @returns {string} - Index display name
     */
    function getIndexDisplayNameFromSymbol(symbol) {
        if (!symbol) return 'Unknown';
        
        if (symbol.endsWith('.NS')) {
            if (DTIData.getStockLists().nifty50.some(stock => stock.symbol === symbol)) {
                return 'Nifty 50';
            } else if (DTIData.getStockLists().niftyNext50.some(stock => stock.symbol === symbol)) {
                return 'DEFLATION';
            } else if (DTIData.getStockLists().niftyMidcap150.some(stock => stock.symbol === symbol)) {
                return 'Nifty Midcap 150';
            }
            return 'India';
        } else if (symbol.endsWith('.L')) {
            if (DTIData.getStockLists().ftse100.some(stock => stock.symbol === symbol)) {
                return 'FTSE 100';
            } else if (DTIData.getStockLists().ftse250.some(stock => stock.symbol === symbol)) {
                return 'FTSE 250';
            }
            return 'UK';
        } else if (!symbol.includes('.')) {
            return 'US Stocks';
        }
        
        return 'Unknown';
    }
    
    /**
     * Get appropriate CSS class based on win rate
     * @param {number} winRate - Win rate percentage
     * @param {number} totalTrades - Total number of trades
     * @returns {string} - CSS class name for styling
     */
    function getWinRateClass(winRate, totalTrades) {
        if (!totalTrades || totalTrades < 3) {
            return 'insufficient-data';
        }
        
        if (winRate > 75) {
            return 'high-win-rate';
        } else if (winRate >= 50) {
            return 'moderate-win-rate';
        } else {
            return 'low-win-rate';
        }
    }
    
    /**
     * Get human-readable conviction level label
     * @param {string} convictionLevel - Conviction level code 
     * @returns {string} - Human-readable label
     */
    function getConvictionLabel(convictionLevel) {
        switch (convictionLevel) {
            case 'high-conviction':
                return 'High Conviction (>75% Win Rate)';
            case 'moderate-conviction':
                return 'Moderate Conviction (50-75% Win Rate)';
            case 'low-conviction':
                return 'Low Conviction (<50% Win Rate)';
            case 'insufficient-data':
            default:
                return 'Insufficient Historical Data (<3 trades)';
        }
    }
    
    /**
     * Display active trade opportunities with conviction level categorization
     */
    function displayBuyingOpportunities() {
        const opportunitiesContainer = document.getElementById('buying-opportunities');
        
        // Get scan type for display
        const scanTypeSelector = document.getElementById('scan-type-selector');
        const scanType = scanTypeSelector ? scanTypeSelector.value : 'current';
        const scanTypeName = scanTypeSelector && scanType !== 'current' 
            ? scanTypeSelector.options[scanTypeSelector.selectedIndex].text 
            : (DTIBacktester.currentStockIndex === 'nifty50' ? 'Nifty 50' : 
               DTIBacktester.currentStockIndex === 'niftyNext50' ? 'DEFLATION' : 
               DTIBacktester.currentStockIndex === 'niftyMidcap150' ? 'Nifty Midcap 150' :
               DTIBacktester.currentStockIndex === 'ftse100' ? 'FTSE 100' :
               DTIBacktester.currentStockIndex === 'ftse250' ? 'FTSE 250' :
               DTIBacktester.currentStockIndex === 'usSmallCap' ? 'US SmallCap Stocks' :
               DTIBacktester.currentStockIndex === 'usMidCap' ? 'US MidCap Stocks' :
               DTIBacktester.currentStockIndex === 'usStocks' ? 'US Stocks' :
               DTIBacktester.currentStockIndex === 'indices' ? 'Market Indices' : 'Nifty 50');
        
        // Create styles for conviction level categories if not already added
        if (!document.getElementById('conviction-styles')) {
            const styles = document.createElement('style');
            styles.id = 'conviction-styles';
            styles.textContent = `
                .conviction-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    border-radius: 8px;
                }
                
                .conviction-title {
                    display: flex;
                    align-items: center;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: #1e293b;
                }
                
                .conviction-badge {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                
                .high-conviction {
                    background-color: rgba(16, 185, 129, 0.1);
                    border-left: 4px solid rgb(16, 185, 129);
                }
                
                .high-conviction .conviction-badge {
                    background-color: rgb(16, 185, 129);
                }
                
                .moderate-conviction {
                    background-color: rgba(245, 158, 11, 0.1);
                    border-left: 4px solid rgb(245, 158, 11);
                }
                
                .moderate-conviction .conviction-badge {
                    background-color: rgb(245, 158, 11);
                }
                
                .low-conviction {
                    background-color: rgba(239, 68, 68, 0.1);
                    border-left: 4px solid rgb(239, 68, 68);
                }
                
                .low-conviction .conviction-badge {
                    background-color: rgb(239, 68, 68);
                }
                
                .insufficient-data {
                    background-color: rgba(99, 102, 241, 0.1);
                    border-left: 4px solid rgb(99, 102, 241);
                }
                
                .insufficient-data .conviction-badge {
                    background-color: rgb(99, 102, 241);
                }
                
                .win-rate-indicator {
                    display: flex;
                    align-items: center;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed rgba(0, 0, 0, 0.1);
                }
                
                .win-rate-label {
                    font-size: 12px;
                    color: #64748b;
                    margin-right: 5px;
                }
                
                .win-rate-value {
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .high-win-rate {
                    color: rgb(16, 185, 129);
                }
                
                .moderate-win-rate {
                    color: rgb(245, 158, 11);
                }
                
                .low-win-rate {
                    color: rgb(239, 68, 68);
                }
                
                .insufficient-data {
                    color: rgb(99, 102, 241);
                }
                
                .timeframe-divider {
                    font-size: 13px;
                    font-weight: 500;
                    margin: 12px 0;
                    padding-bottom: 4px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    color: #64748b;
                }
                
                .opportunity-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 15px;
                }
                
                @media (max-width: 768px) {
                    .opportunity-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        if (!opportunitiesContainer || DTIBacktester.activeTradeOpportunities.length === 0) {
            if (opportunitiesContainer) {
                opportunitiesContainer.innerHTML = `
                    <h3 class="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                            <line x1="3" y1="22" x2="21" y2="22"></line>
                        </svg>
                        ${scanType !== 'current' ? 'Multi-Index Scan: ' : ''}${scanTypeName} Buying Opportunities
                    </h3>
                    <p class="no-opportunities">No active buying opportunities found. Try adjusting parameters or running a full scan.</p>
                `;
            }
            return;
        }
        
        // Get current date for comparison
        const currentDate = new Date();
        
        // Group opportunities by conviction level
        const highConviction = DTIBacktester.activeTradeOpportunities.filter(
            opp => opp.winRate > 75 && opp.totalTrades >= 3
        );
        
        const moderateConviction = DTIBacktester.activeTradeOpportunities.filter(
            opp => opp.winRate >= 50 && opp.winRate <= 75 && opp.totalTrades >= 3
        );
        
        const lowConviction = DTIBacktester.activeTradeOpportunities.filter(
            opp => opp.winRate < 50 && opp.totalTrades >= 3
        );
        
        const insufficientData = DTIBacktester.activeTradeOpportunities.filter(
            opp => opp.totalTrades < 3
        );
        
        // Function to sort by date (newest first)
        const sortByDate = (a, b) => b.trade.signalDate - a.trade.signalDate;
        
        // Sort each conviction level by date
        highConviction.sort(sortByDate);
        moderateConviction.sort(sortByDate);
        lowConviction.sort(sortByDate);
        insufficientData.sort(sortByDate);
        
        // Further group by timeframe within each conviction level
        // Last 7 days, 7-14 days, 14-28 days
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const twoWeeksAgo = new Date(currentDate);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const fourWeeksAgo = new Date(currentDate);
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        // Function to create HTML for each opportunity card
        const createOpportunityCard = (opportunity, index) => {
            const { stock, trade, winRate, totalTrades } = opportunity;
            const entryDate = new Date(trade.entryDate).toLocaleDateString();
            const days = trade.holdingDays;
            const currentPrice = trade.currentPrice ? trade.currentPrice.toFixed(2) : 'N/A';
            const entryPrice = trade.entryPrice ? trade.entryPrice.toFixed(2) : 'N/A';
            const plPercentClass = trade.currentPlPercent >= 0 ? 'positive' : 'negative';
            const plPercent = trade.currentPlPercent ? trade.currentPlPercent.toFixed(2) : '0.00';
            
            // Get index display name for multi-index scan
            const indexDisplay = scanType !== 'current' ? 
                `<span class="stock-index-badge">${getIndexDisplayNameFromSymbol(stock.symbol)}</span>` : '';
            
            // Get the appropriate currency symbol for this specific stock
            const stockCurrencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
                TradeCore.getCurrencySymbol(stock.symbol) : 
                getCurrencySymbolForDisplay(DTIBacktester.currentStockIndex);
            
            // Get win rate class for styling
            const winRateClass = getWinRateClass(winRate, totalTrades);
            
            return `
                <div class="opportunity-card" style="opacity: 0; transform: translateY(20px);" data-index="${index}">
                    <div class="opportunity-header">
                        <div class="stock-name">${stock.name}${indexDisplay}</div>
                        <div class="stock-symbol ${DTIBacktester.currentStockIndex}">${stock.symbol}</div>
                    </div>
                    <div class="opportunity-details">
                        <div class="detail-row">
                            <span class="detail-label">Entry Date:</span>
                            <span class="detail-value">${entryDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Days Open:</span>
                            <span class="detail-value">${days}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Entry Price:</span>
                            <span class="detail-value">${stockCurrencySymbol}${entryPrice}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Current Price:</span>
                            <span class="detail-value">${stockCurrencySymbol}${currentPrice}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">P/L:</span>
                            <span class="detail-value ${plPercentClass}">${plPercent}%</span>
                        </div>
                        <div class="win-rate-indicator">
                            <span class="win-rate-label">Win Rate:</span>
                            <span class="win-rate-value ${winRateClass}">${winRate.toFixed(1)}% (${totalTrades} trades)</span>
                        </div>
                    </div>
                    <div class="opportunity-actions">
                        <button class="view-details-btn" data-symbol="${stock.symbol}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            View Details
                        </button>
                        <button class="take-trade-btn" data-symbol="${stock.symbol}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Take a Trade
                        </button>
                    </div>
                </div>
            `;
        };
        
        // Function to create a timeframe section within a conviction level
        const createTimeframeSection = (opportunities, timeframeLabel, timeframeFilter) => {
            const filteredOpps = opportunities.filter(timeframeFilter);
            
            if (filteredOpps.length === 0) return '';
            
            return `
                <div class="timeframe-divider">${timeframeLabel} (${filteredOpps.length})</div>
                <div class="opportunity-cards">
                    ${filteredOpps.map((opp, idx) => createOpportunityCard(opp, idx)).join('')}
                </div>
            `;
        };
        
        // Function to create a conviction level section
        const createConvictionSection = (opportunities, convictionLevel) => {
            if (opportunities.length === 0) return '';
            
            // Define timeframe filters
            const lastWeekFilter = opp => opp.trade.signalDate >= oneWeekAgo;
            const last2WeeksFilter = opp => opp.trade.signalDate >= twoWeeksAgo && opp.trade.signalDate < oneWeekAgo;
            const last4WeeksFilter = opp => opp.trade.signalDate >= fourWeeksAgo && opp.trade.signalDate < twoWeeksAgo;
            
            return `
                <div class="conviction-section ${convictionLevel}">
                    <h4 class="conviction-title">
                        <span class="conviction-badge"></span>
                        ${getConvictionLabel(convictionLevel)} (${opportunities.length})
                    </h4>
                    
                    ${createTimeframeSection(opportunities, 'Signals from Last 7 Days', lastWeekFilter)}
                    ${createTimeframeSection(opportunities, 'Signals from 7-14 Days Ago', last2WeeksFilter)}
                    ${createTimeframeSection(opportunities, 'Signals from 14-28 Days Ago', last4WeeksFilter)}
                </div>
            `;
        };
        
        // Create HTML content with conviction level categorization
        let html = `
            <h3 class="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                    <line x1="3" y1="22" x2="21" y2="22"></line>
                </svg>
                ${scanType !== 'current' ? 'Multi-Index Scan: ' : ''}${scanTypeName} Buying Opportunities (${DTIBacktester.activeTradeOpportunities.length})
            </h3>
        `;
        
        // Add scan summary if multi-index scan
        if (scanType !== 'current') {
            const indexCounts = {};
            
            // Count opportunities by index
            DTIBacktester.activeTradeOpportunities.forEach(opp => {
                const indexName = getIndexDisplayNameFromSymbol(opp.stock.symbol);
                indexCounts[indexName] = (indexCounts[indexName] || 0) + 1;
            });
            
            // Create summary HTML
            html += `<div class="scan-summary">`;
            
            Object.keys(indexCounts).forEach(indexName => {
                html += `<span class="index-tag">${indexName}: ${indexCounts[indexName]}</span>`;
            });
            
            html += `</div>`;
            
            // Add style for scan summary if not already added
            if (!document.getElementById('scan-summary-styles')) {
                const style = document.createElement('style');
                style.id = 'scan-summary-styles';
                style.textContent = `
                    .scan-summary {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-bottom: 15px;
                        padding: 8px 12px;
                        background: rgba(99, 102, 241, 0.08);
                        border-radius: 6px;
                    }
                    .index-tag {
                        background: rgba(99, 102, 241, 0.15);
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        color: #4f46e5;
                        font-weight: 500;
                    }
                    .stock-index-badge {
                        display: inline-block;
                        font-size: 11px;
                        padding: 2px 6px;
                        border-radius: 4px;
                        background: rgba(99, 102, 241, 0.1);
                        color: #4f46e5;
                        margin-left: 6px;
                        vertical-align: middle;
                    }
                    .opportunity-card {
                        position: relative;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Add each conviction level section
        html += createConvictionSection(highConviction, 'high-conviction');
        html += createConvictionSection(moderateConviction, 'moderate-conviction');
        html += createConvictionSection(lowConviction, 'low-conviction');
        html += createConvictionSection(insufficientData, 'insufficient-data');
        
        // Display on the page
        opportunitiesContainer.innerHTML = html;
        
        // Animate cards appearing with staggered timing
        const cards = opportunitiesContainer.querySelectorAll('.opportunity-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50 * index); // Stagger the animations
        });
        
        // Add event listeners to the "View Details" buttons
        const viewButtons = opportunitiesContainer.querySelectorAll('.view-details-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                // Find the selected stock in the dropdown
                const stockSelector = document.getElementById('stock-selector');
                if (stockSelector) {
                    stockSelector.value = symbol;
                    // Fetch and display data for this stock
                    document.getElementById('fetch-data-btn').click();
                }
            });
        });
        
        // Add event listeners to the "Take a Trade" buttons
        const takeTradeButtons = opportunitiesContainer.querySelectorAll('.take-trade-btn');
        takeTradeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const symbol = this.getAttribute('data-symbol');
                const opportunity = DTIBacktester.activeTradeOpportunities.find(opp => opp.stock.symbol === symbol);
                
                if (opportunity) {
                    // Open the trade modal with the opportunity data
                    if (typeof window.openTradeModal === 'function') {
                        const modalData = {
                            name: opportunity.stock.name,
                            symbol: opportunity.stock.symbol,
                            currentPrice: opportunity.trade.currentPrice,
                            winRate: opportunity.winRate,
                            totalTrades: opportunity.totalTrades
                        };
                        window.openTradeModal(modalData);
                    } else {
                        console.error('Trade modal function not found. Make sure trade-modal.js is loaded.');
                        DTIBacktester.utils.showNotification('Trade entry is not available. Please make sure all required scripts are loaded.', 'error');
                    }
                }
            });
        });
        
        // Update active trades count in the navigation
        DTIBacktester.updateActiveTradesCount();
    }
    
    /**
     * Create and update charts with enhanced interactive features
     * @param {Array} dates - Array of date strings
     * @param {Array} prices - Array of price values
     * @param {Array} dti - Array of DTI values
     * @param {Object} sevenDayDTIData - Object containing 7-day DTI data
     */
    function createCharts(dates, prices, dti, sevenDayDTIData) {
        // Clear existing charts
        if (DTIBacktester.priceChart) DTIBacktester.priceChart.destroy();
        if (DTIBacktester.dtiChart) DTIBacktester.dtiChart.destroy();
        if (DTIBacktester.sevenDayDTIChart) DTIBacktester.sevenDayDTIChart.destroy();
        
        const daily7DayDTI = sevenDayDTIData.daily7DayDTI;
        
        // Get trades for chart markers
        const enable7DayDTI = document.getElementById('enable-weekly-dti').checked;
        const trades = DTIBacktest.backtest(dates, prices, dti, sevenDayDTIData);
        
        // Generate trade markers and metadata
        const {
            entryMarkers,
            exitMarkers,
            tradeConnections,
            tradeProfitLoss,
            tradeMetadata
        } = DTIBacktest.generateTradeMarkers(dates, prices, trades);
        
        // Create horizontal line at zero for DTI and entry threshold line
        const zeroLine = Array(dates.length).fill(0);
        const entryThresholdLine = Array(dates.length).fill(parseFloat(document.getElementById('entry-threshold').value));
        
        // Get warm-up period info
        const warmupInfo = DTIBacktester.warmupInfo || { enabled: false };
        
        // Calculate price percentage changes to enhance visualization
        const pricePercentageChange = prices.map((price, i) => {
            if (i === 0) return 0;
            return ((price - prices[i-1]) / prices[i-1]) * 100;
        });
        
        // Store trade data globally for click interactions
        DTIBacktester.tradeData = trades;
        
        // Common chart options with enhanced styling and interactive features
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0.3, // Smoother curves
                    borderWidth: 2.5
                },
                point: {
                    radius: 0,
                    hitRadius: 10,
                    hoverRadius: 5
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        maxRotation: 0,
                        color: '#64748b',
                        font: {
                            size: 10,
                            weight: '500'
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                // Zoom plugin configuration
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'shift',
                        threshold: 10
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(37, 99, 235, 0.2)',
                            borderColor: 'rgba(37, 99, 235, 0.4)',
                            borderWidth: 1
                        }
                    },
                    limits: {
                        x: {min: 'original', max: 'original'}
                    }
                },
                // Crosshair plugin configuration
                crosshair: {
                    line: {
                        color: 'rgba(100, 116, 139, 0.3)',
                        width: 1,
                        dashPattern: [5, 5]
                    },
                    sync: {
                        enabled: true,
                        group: 'dti-charts',
                        suppressTooltips: false
                    },
                    zoom: {
                        enabled: false
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(17, 24, 39, 0.85)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 6,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderWidth: 1,
                    boxPadding: 5,
                    usePointStyle: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            const date = new Date(tooltipItems[0].label);
                            return date.toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric'
                            });
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const datasetIndex = context.datasetIndex;
                            
                            // If this is an entry or exit point
                            if (datasetIndex === 1 || datasetIndex === 2) {
                                const tradeData = tradeMetadata[index];
                                if (!tradeData) return '';
                                
                                // Get currency symbol based on current index
                                const currencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
                                    TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex) : 
                                    (DTIBacktester.currentStockIndex === 'ftse100' || DTIBacktester.currentStockIndex === 'ftse250' ? '£' : 
                                     DTIBacktester.currentStockIndex === 'usStocks' ? '$' : '₹');
                                
                                if (tradeData.type === 'entry') {
                                    return [
                                        `Entry: ${currencySymbol}${tradeData.price.toFixed(2)}`,
                                        `Date: ${DTIBacktester.utils.formatDate(tradeData.date)}`,
                                        `Holding Period: ${tradeData.holdingDays} days`,
                                        `Result: ${tradeData.plPercent.toFixed(2)}%`,
                                        ``, // Empty line for spacing
                                        `Click for details`
                                    ];
                                } else {
                                    return [
                                        `Exit: ${currencySymbol}${tradeData.price.toFixed(2)}`,
                                        `Date: ${DTIBacktester.utils.formatDate(tradeData.date)}`,
                                        `Exit Reason: ${tradeData.exitReason}`,
                                        `P/L: ${tradeData.plPercent.toFixed(2)}%`,
                                        ``,
                                        `Click for details`
                                    ];
                                }
                            }
                            
                            // Enhanced tooltips for regular data points
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            
                            if (label === 'Price') {
                                // Get currency symbol
                                const currencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
                                    TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex) : 
                                    (DTIBacktester.currentStockIndex === 'ftse100' || DTIBacktester.currentStockIndex === 'ftse250' ? '£' : 
                                     DTIBacktester.currentStockIndex === 'usStocks' ? '$' : '₹');
                                
                                // Calculate percent change from previous day if available
                                let percentChange = '';
                                if (index > 0 && pricePercentageChange[index]) {
                                    const change = pricePercentageChange[index];
                                    percentChange = ` (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`;
                                }
                                
                                // Add DTI value for this day
                                const dtiValue = dti[index] ? dti[index].toFixed(2) : 'N/A';
                                const sevenDayValue = daily7DayDTI[index] ? daily7DayDTI[index].toFixed(2) : 'N/A';
                                
                                return [
                                    `${label}: ${currencySymbol}${value.toFixed(2)}${percentChange}`,
                                    `DTI: ${dtiValue}`,
                                    `7-Day DTI: ${sevenDayValue}`
                                ];
                            }
                            
                            // For DTI charts, add corresponding price
                            if (label === 'Daily DTI' || label === '7-Day DTI') {
                                const priceValue = prices[index];
                                const currencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
                                    TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex) : 
                                    (DTIBacktester.currentStockIndex === 'ftse100' || DTIBacktester.currentStockIndex === 'ftse250' ? '£' : 
                                     DTIBacktester.currentStockIndex === 'usStocks' ? '$' : '₹');
                                
                                return [
                                    `${label}: ${value.toFixed(2)}`,
                                    `Price: ${currencySymbol}${priceValue.toFixed(2)}`
                                ];
                            }
                            
                            // Default formatting for other datasets
                            return `${label}: ${value !== null ? value.toFixed(2) : 'N/A'}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                // Enhanced annotation plugin configuration
                annotation: {
                    annotations: warmupInfo.enabled ? {
                        warmupBox: {
                            type: 'box',
                            xMin: 0,
                            xMax: dates.findIndex(d => new Date(d) >= warmupInfo.endDate),
                            backgroundColor: 'rgba(203, 213, 225, 0.15)',
                            borderColor: 'rgba(148, 163, 184, 0.5)',
                            borderWidth: 1,
                            borderDash: [4, 4],
                            label: {
                                display: true,
                                content: 'Warm-up Period (6 months)',
                                position: 'start',
                                backgroundColor: 'rgba(148, 163, 184, 0.7)',
                                color: '#1e293b',
                                padding: 6,
                                font: {
                                    size: 11,
                                    weight: 'bold'
                                }
                            }
                        }
                    } : {}
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        };
        
        // Create Enhanced Price Chart with dynamic background and professional styling
        const priceCtx = document.getElementById('price-chart').getContext('2d');
        
        // Create gradient for price chart fill
        const priceGradientFill = priceCtx.createLinearGradient(0, 300, 0, 0);
        priceGradientFill.addColorStop(0, 'rgba(37, 99, 235, 0.01)');
        priceGradientFill.addColorStop(0.3, 'rgba(37, 99, 235, 0.1)');
        priceGradientFill.addColorStop(0.6, 'rgba(37, 99, 235, 0.18)');
        priceGradientFill.addColorStop(1, 'rgba(37, 99, 235, 0.25)');
        
        DTIBacktester.priceChart = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: priceGradientFill,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointHoverBorderColor: 'white',
                    pointHoverBorderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    z: 1
                }, {
                    label: 'Entry Point',
                    data: entryMarkers,
                    backgroundColor: 'rgba(16, 185, 129, 1)',
                    borderColor: 'white',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointStyle: DTIBacktest.customEntryPointStyle,
                    showLine: false,
                    pointHoverRadius: 10,
                    z: 10  // Make sure points appear above lines
                }, {
                    label: 'Exit Point',
                    data: exitMarkers,
                    backgroundColor: 'rgba(239, 68, 68, 1)',
                    borderColor: 'white',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointStyle: DTIBacktest.customExitPointStyle,
                    showLine: false,
                    pointHoverRadius: 10,
                    z: 10  // Make sure points appear above lines
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)',
                            drawBorder: false,
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            callback: function(value) {
                                // Get currency symbol
                                const currencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
                                    TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex) : 
                                    (DTIBacktester.currentStockIndex === 'ftse100' || DTIBacktester.currentStockIndex === 'ftse250' ? '£' : 
                                     DTIBacktester.currentStockIndex === 'usStocks' ? '$' : '₹');
                                
                                return currencySymbol + value.toFixed(2);
                            },
                            color: '#64748b',
                            font: {
                                size: 10,
                                weight: '500'
                            },
                            padding: 8
                        }
                    }
                },
                // Enhanced interaction for price chart
                interaction: {
                    mode: 'index',
                    intersect: false,
                    axis: 'x'
                },
                plugins: {
                    ...commonOptions.plugins,
                    // Custom crosshair
                    crosshair: {
                        line: {
                            color: 'rgba(100, 116, 139, 0.3)',
                            width: 1,
                            dashPattern: [5, 5]
                        },
                        sync: {
                            enabled: true,
                            group: 'dti-charts'
                        },
                        zoom: {
                            enabled: false
                        }
                    },
                    legend: {
                        ...commonOptions.plugins.legend,
                        position: 'top',
                        align: 'end',
                        labels: {
                            ...commonOptions.plugins.legend.labels,
                            padding: 15,
                            color: '#334155',
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                }
            }
        });
        
        // Create Enhanced Daily DTI Chart
        const dtiCtx = document.getElementById('dti-chart').getContext('2d');
        
        // Create gradient for DTI chart
        const dtiGradientFill = dtiCtx.createLinearGradient(0, 300, 0, 0);
        dtiGradientFill.addColorStop(0, 'rgba(139, 92, 246, 0)');
        dtiGradientFill.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)');
        dtiGradientFill.addColorStop(1, 'rgba(139, 92, 246, 0.15)');
        
        DTIBacktester.dtiChart = new Chart(dtiCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily DTI',
                    data: dti,
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: dtiGradientFill,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgba(139, 92, 246, 1)',
                    pointHoverBorderColor: 'white',
                    pointHoverBorderWidth: 2,
                    fill: true,
                    tension: 0.3
                }, {
                    label: 'Zero Line',
                    data: zeroLine,
                    borderColor: 'rgba(14, 165, 233, 0.7)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }, {
                    label: 'Entry Threshold',
                    data: entryThresholdLine,
                    borderColor: 'rgba(245, 158, 11, 0.7)',
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)',
                            drawBorder: false,
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0);
                            },
                            color: '#64748b',
                            font: {
                                size: 10,
                                weight: '500'
                            },
                            padding: 8
                        }
                    }
                }
            }
        });
        
        // Create Enhanced 7-Day DTI Chart
        const sevenDayDTICtx = document.getElementById('weekly-dti-chart').getContext('2d');
        
        // Create gradient for 7-day DTI chart
        const sevenDayDTIGradientFill = sevenDayDTICtx.createLinearGradient(0, 300, 0, 0);
        sevenDayDTIGradientFill.addColorStop(0, 'rgba(14, 165, 233, 0)');
        sevenDayDTIGradientFill.addColorStop(0.5, 'rgba(14, 165, 233, 0.08)');
        sevenDayDTIGradientFill.addColorStop(1, 'rgba(14, 165, 233, 0.15)');
        
        DTIBacktester.sevenDayDTIChart = new Chart(sevenDayDTICtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: '7-Day DTI',
                    data: daily7DayDTI,
                    borderColor: 'rgba(14, 165, 233, 1)',
                    backgroundColor: sevenDayDTIGradientFill,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgba(14, 165, 233, 1)',
                    pointHoverBorderColor: 'white',
                    pointHoverBorderWidth: 2,
                    fill: true,
                    stepped: 'middle'  // Enhanced step visualization
                }, {
                    label: 'Zero Line',
                    data: zeroLine,
                    borderColor: 'rgba(16, 185, 129, 0.7)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }, {
                    label: 'Entry Threshold',
                    data: entryThresholdLine,
                    borderColor: 'rgba(245, 158, 11, 0.7)',
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)',
                            drawBorder: false,
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0);
                            },
                            color: '#64748b',
                            font: {
                                size: 10,
                                weight: '500'
                            },
                            padding: 8
                        }
                    }
                }
            }
        });
        
        // Add chart sync for zoom and pan
        syncChartsZoom([DTIBacktester.priceChart, DTIBacktester.dtiChart, DTIBacktester.sevenDayDTIChart]);
        
        // Add click handlers for trade points
        addTradePointClickHandlers();
        
        // Apply chart shadow effect to all chart canvases
        const chartCanvases = document.querySelectorAll('.chart-wrapper canvas');
        chartCanvases.forEach(canvas => {
            canvas.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))';
        });
        
        // Add chart controls if not already added
        if (!document.querySelector('.chart-controls-container') && typeof DTIChartControls !== 'undefined') {
            DTIChartControls.addChartControls();
        }
        
        // Restore any saved annotations
        restoreAnnotations();
    }
    
    /**
     * Synchronize zoom and pan across multiple charts
     * @param {Array} charts - Array of Chart.js instances
     */
    function syncChartsZoom(charts) {
        if (!charts || charts.length <= 1) return;
        
        // For each chart, attach zoom and pan events
        charts.forEach(mainChart => {
            if (!mainChart || !mainChart.options || !mainChart.options.plugins || !mainChart.options.plugins.zoom) {
                return;
            }
            
            // Override the zoom callback to sync all charts
            const originalZoom = mainChart.options.plugins.zoom.zoom.onZoom;
            mainChart.options.plugins.zoom.zoom.onZoom = function(context) {
                if (originalZoom) originalZoom(context);
                
                // Get the new scale
                const newScale = mainChart.scales.x;
                
                // Apply the same scale to all other charts
                charts.forEach(otherChart => {
                    if (otherChart !== mainChart) {
                        otherChart.zoomScale('x', {
                            min: newScale.min,
                            max: newScale.max
                        }, 'none');
                        otherChart.update('none');
                    }
                });
            };
            
            // Override the pan callback to sync all charts
            const originalPan = mainChart.options.plugins.zoom.pan.onPan;
            mainChart.options.plugins.zoom.pan.onPan = function(context) {
                if (originalPan) originalPan(context);
                
                // Get the new scale
                const newScale = mainChart.scales.x;
                
                // Apply the same scale to all other charts
                charts.forEach(otherChart => {
                    if (otherChart !== mainChart) {
                        otherChart.zoomScale('x', {
                            min: newScale.min,
                            max: newScale.max
                        }, 'none');
                        otherChart.update('none');
                    }
                });
            };
        });
    }
    
    /**
     * Add click handlers for trade entry/exit points
     */
    function addTradePointClickHandlers() {
        // Add click handler for price chart
        const priceCanvas = document.getElementById('price-chart');
        if (priceCanvas && DTIBacktester.priceChart) {
            priceCanvas.onclick = function(evt) {
                const points = DTIBacktester.priceChart.getElementsAtEventForMode(
                    evt, 
                    'nearest', 
                    { intersect: true }, 
                    false
                );
                
                if (points.length > 0) {
                    const firstPoint = points[0];
                    const datasetIndex = firstPoint.datasetIndex;
                    const index = firstPoint.index;
                    
                    // Check if it's an entry or exit point (datasets 1 and 2)
                    if (datasetIndex === 1 || datasetIndex === 2) {
                        const trades = DTIBacktester.tradeData;
                        if (!trades || trades.length === 0) return;
                        
                        // Find the matching trade
                        const selectedDate = DTIBacktester.priceChart.data.labels[index];
                        
                        let selectedTrade;
                        for (const trade of trades) {
                            if (trade.entryDate === selectedDate || trade.exitDate === selectedDate) {
                                selectedTrade = trade;
                                break;
                            }
                        }
                        
                        if (selectedTrade && typeof DTIChartControls !== 'undefined') {
                            DTIChartControls.showTradeDetails(selectedTrade);
                        }
                    }
                }
            };
        }
    }
    
    /**
     * Restore saved annotations from previous session
     */
    function restoreAnnotations() {
        if (!DTIBacktester.annotations) return;
        
        for (const id in DTIBacktester.annotations) {
            const annotation = DTIBacktester.annotations[id];
            let chart;
            
            // Find the matching chart
            switch (annotation.chartId) {
                case 'price-chart':
                    chart = DTIBacktester.priceChart;
                    break;
                case 'dti-chart':
                    chart = DTIBacktester.dtiChart;
                    break;
                case 'weekly-dti-chart':
                    chart = DTIBacktester.sevenDayDTIChart;
                    break;
                default:
                    continue;
            }
            
            // Skip if chart is not available
            if (!chart) continue;
            
            // Find nearest data point
            let dataIndex = -1;
            for (let i = 0; i < chart.data.labels.length; i++) {
                if (chart.data.labels[i] === annotation.xValue) {
                    dataIndex = i;
                    break;
                }
            }
            
            if (dataIndex === -1) continue;
            
            // Initialize annotation plugin if needed
            if (!chart.options.plugins.annotation) {
                chart.options.plugins.annotation = {
                    annotations: {}
                };
            }
            
            // Add annotation
            chart.options.plugins.annotation.annotations[id] = {
                type: 'point',
                xValue: annotation.xValue,
                yValue: annotation.yValue,
                backgroundColor: 'rgba(255, 99, 132, 1)',
                borderColor: 'white',
                borderWidth: 2,
                radius: 6,
                content: annotation.text,
                label: {
                    display: true,
                    content: annotation.text,
                    position: 'top',
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    color: 'white',
                    padding: 6,
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            };
        }
        
        // Update charts
        if (DTIBacktester.priceChart) DTIBacktester.priceChart.update();
        if (DTIBacktester.dtiChart) DTIBacktester.dtiChart.update();
        if (DTIBacktester.sevenDayDTIChart) DTIBacktester.sevenDayDTIChart.update();
    }
    
    /**
     * Display trade statistics
     * @param {Array} trades - Array of trade objects
     */
    function displayStatistics(trades) {
        // Filter out active trades (those without exit info)
        const completedTrades = trades.filter(trade => trade.exitDate && trade.exitReason);
        
        const totalTrades = completedTrades.length;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalProfit = 0;
        let avgHoldingDays = 0;
        
        let takeProfitCount = 0;
        let stopLossCount = 0;
        let timeExitCount = 0;
        let endOfDataCount = 0;
        
        completedTrades.forEach(trade => {
            // Count winning/losing trades
            if (trade.plPercent > 0) {
                winningTrades++;
            } else {
                losingTrades++;
            }
            
            // Calculate total profit
            totalProfit += trade.plPercent;
            
            // Calculate holding period
            const entryDate = new Date(trade.entryDate);
            const exitDate = new Date(trade.exitDate);
            const holdingDays = Math.floor((exitDate - entryDate) / (24 * 60 * 60 * 1000));
            avgHoldingDays += holdingDays;
            
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
        
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(2) : 0;
        const avgProfit = totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : 0;
        avgHoldingDays = totalTrades > 0 ? (avgHoldingDays / totalTrades).toFixed(1) : 0;
        
        // Update statistics card
        const statsContainer = document.getElementById('statistics');
        
        if (totalTrades === 0) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">0</div>
                    <div class="stat-label">Total Trades</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">0%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">0%</div>
                    <div class="stat-label">Avg. Profit/Trade</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">0%</div>
                    <div class="stat-label">Total Return</div>
                </div>
            `;
            return;
        }
        
        // Add success/danger classes based on outcomes
        const winRateClass = winRate >= 50 ? 'success' : '';
        const avgProfitClass = avgProfit > 0 ? 'success' : avgProfit < 0 ? 'danger' : '';
        const totalReturnClass = totalProfit > 0 ? 'success' : totalProfit < 0 ? 'danger' : '';
        
        // Get conviction level based on win rate
        const convictionLevel = DTIBacktest.getConvictionLevel(parseFloat(winRate), totalTrades);
        const convictionClass = 
            convictionLevel === 'high-conviction' ? 'high-win-rate' :
            convictionLevel === 'moderate-conviction' ? 'moderate-win-rate' :
            convictionLevel === 'low-conviction' ? 'low-win-rate' : 'insufficient-data';
        
        // Create HTML for each type of exit
        const exitTypesHTML = `
            <div class="stat-item">
                <div class="stat-value">${takeProfitCount}</div>
                <div class="stat-label">Target Hits <span class="positive">(${Math.round(takeProfitCount/totalTrades*100)}%)</span></div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stopLossCount}</div>
                <div class="stat-label">Stop Losses <span class="negative">(${Math.round(stopLossCount/totalTrades*100)}%)</span></div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${timeExitCount}</div>
                <div class="stat-label">Time Exits <span>(${Math.round(timeExitCount/totalTrades*100)}%)</span></div>
            </div>
        `;
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalTrades}</div>
                <div class="stat-label">Total Trades</div>
            </div>
            <div class="stat-item ${winRateClass}">
                <div class="stat-value ${convictionClass}">${winRate}%</div>
                <div class="stat-label">Win Rate (${winningTrades}/${totalTrades})</div>
            </div>
            <div class="stat-item ${avgProfitClass}">
                <div class="stat-value ${avgProfit > 0 ? 'positive' : avgProfit < 0 ? 'negative' : ''}">${avgProfit}%</div>
                <div class="stat-label">Avg. Profit/Trade</div>
            </div>
            <div class="stat-item ${totalReturnClass}">
                <div class="stat-value ${totalProfit > 0 ? 'positive' : totalProfit < 0 ? 'negative' : ''}">${totalProfit.toFixed(2)}%</div>
                <div class="stat-label">Total Return</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgHoldingDays}</div>
                <div class="stat-label">Avg. Holding Days</div>
            </div>
            ${exitTypesHTML}
        `;
        
        // Add conviction level badge if not already present
        if (!document.querySelector('.conviction-indicator')) {
            const convictionHTML = `
                <div class="conviction-indicator ${convictionLevel}">
                    <span class="conviction-badge"></span>
                    <span class="conviction-text">${getConvictionLabel(convictionLevel)}</span>
                </div>
            `;
            
            // Add to statistics section
            const statsCard = document.querySelector('.stats-card');
            if (statsCard) {
                const convictionDiv = document.createElement('div');
                convictionDiv.className = 'conviction-wrapper';
                convictionDiv.innerHTML = convictionHTML;
                
                // Insert at the top of the stats card
                statsCard.insertBefore(convictionDiv, statsCard.firstChild);
                
                // Add styles if not already added
                if (!document.getElementById('conviction-indicator-style')) {
                    const style = document.createElement('style');
                    style.id = 'conviction-indicator-style';
                    style.textContent = `
                        .conviction-wrapper {
                            margin-bottom: 15px;
                            padding-bottom: 15px;
                            border-bottom: 1px solid rgba(0,0,0,0.05);
                        }
                        .conviction-indicator {
                            display: flex;
                            align-items: center;
                            padding: 10px 15px;
                            border-radius: 6px;
                            margin-top: 5px;
                        }
                        .conviction-badge {
                            display: inline-block;
                            width: 10px;
                            height: 10px;
                            border-radius: 50%;
                            margin-right: 8px;
                        }
                        .conviction-text {
                            font-size: 14px;
                            font-weight: 600;
                        }
                        .high-conviction {
                            background-color: rgba(16, 185, 129, 0.1);
                            border-left: 3px solid rgb(16, 185, 129);
                        }
                        .high-conviction .conviction-badge {
                            background-color: rgb(16, 185, 129);
                        }
                        .high-conviction .conviction-text {
                            color: rgb(16, 185, 129);
                        }
                        .moderate-conviction {
                            background-color: rgba(245, 158, 11, 0.1);
                            border-left: 3px solid rgb(245, 158, 11);
                        }
                        .moderate-conviction .conviction-badge {
                            background-color: rgb(245, 158, 11);
                        }
                        .moderate-conviction .conviction-text {
                            color: rgb(245, 158, 11);
                        }
                        .low-conviction {
                            background-color: rgba(239, 68, 68, 0.1);
                            border-left: 3px solid rgb(239, 68, 68);
                        }
                        .low-conviction .conviction-badge {
                            background-color: rgb(239, 68, 68);
                        }
                        .low-conviction .conviction-text {
                            color: rgb(239, 68, 68);
                        }
                        .insufficient-data {
                            background-color: rgba(99, 102, 241, 0.1);
                            border-left: 3px solid rgb(99, 102, 241);
                        }
                        .insufficient-data .conviction-badge {
                            background-color: rgb(99, 102, 241);
                        }
                        .insufficient-data .conviction-text {
                            color: rgb(99, 102, 241);
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        } else {
            // Update existing conviction indicator
            const convictionIndicator = document.querySelector('.conviction-indicator');
            convictionIndicator.className = `conviction-indicator ${convictionLevel}`;
            convictionIndicator.querySelector('.conviction-text').textContent = getConvictionLabel(convictionLevel);
        }
        
        // Add animation to the stats cards
        const statItems = statsContainer.querySelectorAll('.stat-item');
        statItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100 + (index * 50));
        });
    }
    
/**
 * Display trades table
 * @param {Array} trades - Array of trade objects
 */
function displayTrades(trades) {
    // Filter out active trades for the table
    const completedTrades = trades.filter(trade => trade.exitDate && trade.exitReason);
    
    const tbody = document.querySelector('#trades-table tbody');
    tbody.innerHTML = '';
    
    if (completedTrades.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" class="no-data">No completed trades found with current parameters</td>';
        tbody.appendChild(row);
        return;
    }
    
    // Get the currency symbol based on the current index first
    let defaultCurrencySymbol = '$';
    if (typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol && DTIBacktester.currentStockIndex) {
        defaultCurrencySymbol = TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex);
    }
    
    // Sort trades by entry date
    completedTrades.sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));
    
    completedTrades.forEach((trade, index) => {
        const row = document.createElement('tr');
        
        // Create exit reason tag
        let exitTagClass = '';
        switch(trade.exitReason) {
            case 'Take Profit':
                exitTagClass = 'tp-tag';
                break;
            case 'Stop Loss':
                exitTagClass = 'sl-tag';
                break;
            case 'Time Exit':
                exitTagClass = 'time-tag';
                break;
            case 'End of Data':
                exitTagClass = 'end-tag';
                break;
        }
        
        // Use the default currency symbol from the current index
        const tradeCurrencySymbol = defaultCurrencySymbol;

        row.innerHTML = `
            <td>${DTIBacktester.utils.formatDate(trade.entryDate)}</td>
            <td>${tradeCurrencySymbol}${trade.entryPrice.toFixed(2)}</td>
            <td>${trade.entryDTI.toFixed(2)}</td>
            <td>${trade.entry7DayDTI ? trade.entry7DayDTI.toFixed(2) : 'N/A'}</td>
            <td>${DTIBacktester.utils.formatDate(trade.exitDate)}</td>
            <td>${tradeCurrencySymbol}${trade.exitPrice.toFixed(2)}</td>
            <td class="${trade.plPercent >= 0 ? 'positive' : 'negative'}">${trade.plPercent.toFixed(2)}%</td>
            <td><span class="exit-tag ${exitTagClass}">${trade.exitReason}</span></td>
        `;
        
        // Add row animation
        row.style.opacity = '0';
        tbody.appendChild(row);
        
        setTimeout(() => {
            row.style.transition = 'opacity 0.3s ease';
            row.style.opacity = '1';
        }, 30 * index);
    });
    
    // If there's an active trade, show it
    const activeTrade = trades.find(trade => !trade.exitDate || !trade.exitReason);
    if (activeTrade) {
        const row = document.createElement('tr');
        row.className = 'active-trade-row';
        
        // Use the same default currency symbol for active trade
        const activeTradeCurrencySymbol = defaultCurrencySymbol;

        row.innerHTML = `
            <td>${DTIBacktester.utils.formatDate(activeTrade.entryDate)}</td>
            <td>${activeTradeCurrencySymbol}${activeTrade.entryPrice.toFixed(2)}</td>
            <td>${activeTrade.entryDTI.toFixed(2)}</td>
            <td>${activeTrade.entry7DayDTI ? activeTrade.entry7DayDTI.toFixed(2) : 'N/A'}</td>
            <td colspan="4" class="active-trade-cell">
                <div class="active-trade-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ACTIVE TRADE (${activeTrade.holdingDays} days) - Current P/L: 
                    <span class="${activeTrade.currentPlPercent >= 0 ? 'positive' : 'negative'}">${activeTrade.currentPlPercent ? activeTrade.currentPlPercent.toFixed(2) : '0.00'}%</span>
                </div>
            </td>
        `;
        
        // Add row with animation after a delay
        row.style.opacity = '0';
        tbody.appendChild(row);
        
        setTimeout(() => {
            row.style.transition = 'opacity 0.5s ease, background-color 0.5s ease';
            row.style.opacity = '1';
            row.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
        }, completedTrades.length * 30 + 100);
    }
}

    /**
     * Update all charts after parameter changes
     */
    function updateChartsAfterParameterChange() {
        // Check if we have charts and data to update
        if (!DTIBacktester.priceChart || !DTIBacktester.dtiChart || !DTIBacktester.sevenDayDTIChart) {
            return;
        }
        
        // Get the current data
        const dates = DTIBacktester.priceChart.data.labels;
        const prices = DTIBacktester.priceChart.data.datasets[0].data;
        
        // Get parameters for DTI calculation
        const r = parseInt(document.getElementById('r').value);
        const s = parseInt(document.getElementById('s').value);
        const u = parseInt(document.getElementById('u').value);
        
        // Calculate new DTI values
        const high = prices; // We don't have separate high values, use price as approximation
        const low = prices;  // We don't have separate low values, use price as approximation
        const dti = DTIIndicators.calculateDTI(high, low, r, s, u);
        const sevenDayDTIData = DTIIndicators.calculate7DayDTI(dates, high, low, r, s, u);
        
        // Run backtest with new parameters
        const daily7DayDTI = sevenDayDTIData.daily7DayDTI;
        const trades = DTIBacktest.backtest(dates, prices, dti, sevenDayDTIData);
        
        // Generate new trade markers
        const {
            entryMarkers,
            exitMarkers,
            tradeConnections,
            tradeProfitLoss,
            tradeMetadata
        } = DTIBacktest.generateTradeMarkers(dates, prices, trades);
        
        // Calculate new threshold line based on the entry threshold parameter
        const entryThresholdLine = Array(dates.length).fill(parseFloat(document.getElementById('entry-threshold').value));
        
        // Update price chart
        if (DTIBacktester.priceChart) {
            // Update entry/exit markers
            DTIBacktester.priceChart.data.datasets[1].data = entryMarkers;
            DTIBacktester.priceChart.data.datasets[2].data = exitMarkers;
            DTIBacktester.priceChart.update();
        }
        
        // Update DTI chart
        if (DTIBacktester.dtiChart) {
            // Update DTI values
            DTIBacktester.dtiChart.data.datasets[0].data = dti;
            // Update threshold line
            DTIBacktester.dtiChart.data.datasets[2].data = entryThresholdLine;
            DTIBacktester.dtiChart.update();
        }
        
        // Update 7-day DTI chart
        if (DTIBacktester.sevenDayDTIChart) {
            // Update 7-day DTI values
            DTIBacktester.sevenDayDTIChart.data.datasets[0].data = daily7DayDTI;
            // Update threshold line
            DTIBacktester.sevenDayDTIChart.data.datasets[2].data = entryThresholdLine;
            DTIBacktester.sevenDayDTIChart.update();
        }
        
        // Store updated trade data for interactions
        DTIBacktester.tradeData = trades;
        
        // Update statistics and trades table
        if (typeof DTIUI !== 'undefined') {
            DTIUI.displayStatistics(trades);
            DTIUI.displayTrades(trades);
        }
    }

    /**
     * Initialize parameter change listeners
     */
    function initParameterChangeListeners() {
        // Get all parameter input elements
        const parameterInputs = document.querySelectorAll('#r, #s, #u, #entry-threshold, #take-profit, #stop-loss, #max-days, #enable-weekly-dti');
        
        // Add change event listeners
        parameterInputs.forEach(input => {
            input.addEventListener('change', function() {
                // Validate parameters first
                const validation = DTIBacktest.validateParameters();
                if (!validation.isValid) {
                    // Show error message
                    DTIBacktester.utils.showNotification('Invalid parameters: ' + validation.errors.join(', '), 'error');
                    return;
                }
                
                // Update charts with new parameters
                updateChartsAfterParameterChange();
                
                // Show success message
                DTIBacktester.utils.showNotification('Charts updated with new parameters', 'success');
            });
        });
    }

    /**
     * Adds chart control UI elements to the page
     */
    function addChartControls() {
        // Create chart controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'chart-controls-container';
        controlsContainer.innerHTML = `
            <div class="chart-controls">
                <div class="control-group date-range-controls">
                    <span class="control-label">Time Range:</span>
                    <button class="range-btn" data-range="1m">1M</button>
                    <button class="range-btn" data-range="3m">3M</button>
                    <button class="range-btn" data-range="6m">6M</button>
                    <button class="range-btn" data-range="1y">1Y</button>
                    <button class="range-btn active" data-range="all">All</button>
                </div>
                
                <div class="control-group visibility-controls">
                    <span class="control-label">Display:</span>
                    <label class="toggle-control">
                        <input type="checkbox" data-series="price" checked>
                        <span class="toggle-label">Price</span>
                    </label>
                    <label class="toggle-control">
                        <input type="checkbox" data-series="entries" checked>
                        <span class="toggle-label">Entries</span>
                    </label>
                    <label class="toggle-control">
                        <input type="checkbox" data-series="exits" checked>
                        <span class="toggle-label">Exits</span>
                    </label>
                </div>
                
                <div class="control-group button-controls">
                    <button class="control-btn reset-zoom-btn" title="Reset Zoom">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                            <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                            <path d="M12 14v3"></path>
                        </svg>
                        Reset Zoom
                    </button>
                    
                    <button class="control-btn export-chart-btn" title="Export Chart">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export Chart
                    </button>
                    
                    <button class="control-btn annotate-btn" title="Add Annotation">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        Annotate
                    </button>
                </div>
            </div>
        `;
        
        // Add the control panel to the page
        const chartContainer = document.querySelector('.chart-section');
        if (chartContainer) {
            chartContainer.prepend(controlsContainer);
        } else {
            // Fallback: Add to the first chart wrapper
            const firstChartWrapper = document.querySelector('.chart-wrapper');
            if (firstChartWrapper) {
                firstChartWrapper.parentNode.insertBefore(controlsContainer, firstChartWrapper);
            }
        }
        
        // Add CSS for chart controls
        const style = document.createElement('style');
        style.textContent = `
            .chart-controls-container {
                margin-bottom: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .chart-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                padding: 12px 15px;
                align-items: center;
                justify-content: space-between;
            }
            
            .control-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .control-label {
                font-size: 12px;
                font-weight: 500;
                color: #64748b;
                margin-right: 4px;
            }
            
            .range-btn {
                background: #f1f5f9;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: 500;
                color: #475569;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .range-btn:hover {
                background: #e2e8f0;
            }
            
            .range-btn.active {
                background: #3b82f6;
                color: white;
            }
            
            .toggle-control {
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
            }
            
            .toggle-label {
                font-size: 12px;
                color: #475569;
            }
            
            .control-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                background: #f1f5f9;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: 500;
                color: #475569;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .control-btn:hover {
                background: #e2e8f0;
            }
            
            .control-btn svg {
                width: 14px;
                height: 14px;
            }
            
            .export-chart-btn {
                background-color: #10b981;
                color: white;
            }
            
            .export-chart-btn:hover {
                background-color: #059669;
            }
            
            .annotate-btn {
                background-color: #8b5cf6;
                color: white;
            }
            
            .annotate-btn:hover {
                background-color: #7c3aed;
            }
            
            /* Trade detail modal styles */
            .trade-detail-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }
            
            .trade-detail-modal.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .modal-content {
                background: white;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                transform: translateY(20px);
                transition: transform 0.3s;
            }
            
            .trade-detail-modal.visible .modal-content {
                transform: translateY(0);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .modal-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
            }
            
            .close-modal {
                background: none;
                border: none;
                cursor: pointer;
                color: #64748b;
                padding: 5px;
            }
            
            .close-modal:hover {
                color: #1e293b;
            }
            
            .trade-details {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .detail-group {
                margin-bottom: 10px;
            }
            
            .detail-label {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 4px;
            }
            
            .detail-value {
                font-size: 14px;
                font-weight: 500;
                color: #1e293b;
            }
            
            .detail-value.positive {
                color: #10b981;
            }
            
            .detail-value.negative {
                color: #ef4444;
            }
            
            .trade-chart-mini {
                margin-top: 15px;
                height: 200px;
                width: 100%;
            }
            
            /* Annotation tooltip */
            .annotation-tooltip {
                position: absolute;
                background: white;
                border-radius: 4px;
                padding: 8px 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                font-size: 12px;
                pointer-events: none;
                z-index: 100;
                display: none;
            }
            
            /* Highlight mode for annotations */
            .annotation-mode .chart-wrapper {
                cursor: crosshair !important;
                position: relative;
            }
            
            .annotation-mode .chart-wrapper::after {
                content: 'Click on chart to add annotation';
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(139, 92, 246, 0.9);
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
        
        // Add the trade detail modal
        const tradeDetailModal = document.createElement('div');
        tradeDetailModal.className = 'trade-detail-modal';
        tradeDetailModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Trade Details</h3>
                    <button class="close-modal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="trade-details">
                    <!-- Trade details will be inserted here -->
                </div>
                <div class="trade-chart-mini">
                    <canvas id="trade-detail-chart"></canvas>
                </div>
            </div>
        `;
        document.body.appendChild(tradeDetailModal);
        
        // Add annotation tooltip
        const annotationTooltip = document.createElement('div');
        annotationTooltip.className = 'annotation-tooltip';
        document.body.appendChild(annotationTooltip);
        
        // Initialize chart controls
        initChartControls();
    }

    /**
     * Initialize chart control event handlers
     */
    function initChartControls() {
        // Date range buttons
        const rangeButtons = document.querySelectorAll('.range-btn');
        rangeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                rangeButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart date range
                const range = this.getAttribute('data-range');
                updateChartDateRange(range);
            });
        });
        
        // Toggle visibility checkboxes
        const toggleControls = document.querySelectorAll('.visibility-controls input[type="checkbox"]');
        toggleControls.forEach(toggle => {
            toggle.addEventListener('change', function() {
                const series = this.getAttribute('data-series');
                const visible = this.checked;
                toggleChartSeries(series, visible);
            });
        });
        
        // Reset zoom button
        const resetZoomBtn = document.querySelector('.reset-zoom-btn');
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', function() {
                resetChartZoom();
            });
        }
        
        // Export chart button
        const exportChartBtn = document.querySelector('.export-chart-btn');
        if (exportChartBtn) {
            exportChartBtn.addEventListener('click', function() {
                exportChartAsImage();
            });
        }
        
        // Annotation button
        const annotateBtn = document.querySelector('.annotate-btn');
        if (annotateBtn) {
            annotateBtn.addEventListener('click', function() {
                toggleAnnotationMode();
            });
        }
        
        // Close modal button
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                const modal = document.querySelector('.trade-detail-modal');
                modal.classList.remove('visible');
            });
        }
        
        // Close modal when clicking outside
        const modal = document.querySelector('.trade-detail-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('visible');
                }
            });
        }
    }

/**
 * Update charts based on selected date range
 * @param {string} range - Date range (1m, 3m, 6m, 1y, all)
 */
function updateChartDateRange(range) {
    if (!DTIBacktester.priceChart || !DTIBacktester.dtiChart || !DTIBacktester.sevenDayDTIChart) {
        console.log("Charts not available");
        return;
    }
    
    const charts = [
        DTIBacktester.priceChart, 
        DTIBacktester.dtiChart, 
        DTIBacktester.sevenDayDTIChart
    ];
    
    // Get all data points
    const allDates = DTIBacktester.priceChart.data.labels;
    if (!allDates || allDates.length === 0) {
        console.log("No date data available");
        return;
    }
    
    // If 'all' is selected, explicitly reset scales on all charts
    if (range === 'all') {
        charts.forEach(chart => {
            if (chart.options && chart.options.scales && chart.options.scales.x) {
                // Explicitly remove min/max constraints
                chart.options.scales.x.min = undefined;
                chart.options.scales.x.max = undefined;
                chart.update();
            }
        });
        
        // Also try the resetZoom method as backup
        charts.forEach(chart => {
            if (chart.resetZoom) {
                chart.resetZoom();
            }
        });
        
        DTIBacktester.utils.showNotification('Showing all available data', 'success');
        return;
    }
    
    // Get the last date in the dataset
    const lastDateStr = allDates[allDates.length - 1];
    const lastDate = new Date(lastDateStr);
    
    // Calculate start date based on range
    let startDate;
    switch(range) {
        case '1m':
            startDate = new Date(lastDate);
            startDate.setMonth(lastDate.getMonth() - 1);
            break;
        case '3m':
            startDate = new Date(lastDate);
            startDate.setMonth(lastDate.getMonth() - 3);
            break;
        case '6m':
            startDate = new Date(lastDate);
            startDate.setMonth(lastDate.getMonth() - 6);
            break;
        case '1y':
            startDate = new Date(lastDate);
            startDate.setFullYear(lastDate.getFullYear() - 1);
            break;
        default:
            console.log("Invalid range:", range);
            return;
    }
    
    // Find indices for start and end dates (use numeric indices for Chart.js)
    let startIndex = -1;
    for (let i = 0; i < allDates.length; i++) {
        const currentDate = new Date(allDates[i]);
        if (currentDate >= startDate) {
            startIndex = i;
            break;
        }
    }
    
    if (startIndex === -1) {
        startIndex = 0; // If no date matches, start from beginning
    }
    
    // Update all charts with the new min and max values
    charts.forEach(chart => {
        // Get chart options
        if (!chart.options) {
            console.log("Chart options not available");
            return;
        }
        
        // Set min and max for x-axis
        if (!chart.options.scales) chart.options.scales = {};
        if (!chart.options.scales.x) chart.options.scales.x = {};
        
        chart.options.scales.x.min = startIndex;
        chart.options.scales.x.max = allDates.length - 1;
        
        // Update the chart with animation
        chart.update();
    });
    
    DTIBacktester.utils.showNotification(`Chart range updated to ${range.toUpperCase()}`, 'success');
}

    /**
     * Toggle visibility of chart data series
     * @param {string} series - Series name (price, entries, exits)
     * @param {boolean} visible - Whether the series should be visible
     */
    function toggleChartSeries(series, visible) {
        if (!DTIBacktester.priceChart) return;
        
        switch(series) {
            case 'price':
                DTIBacktester.priceChart.data.datasets[0].hidden = !visible;
                break;
            case 'entries':
                // Find entry points dataset
                const entryDataset = DTIBacktester.priceChart.data.datasets.find(
                    d => d.label === 'Entry Point'
                );
                if (entryDataset) {
                    entryDataset.hidden = !visible;
                }
                break;
            case 'exits':
                // Find exit points dataset
                const exitDataset = DTIBacktester.priceChart.data.datasets.find(
                    d => d.label === 'Exit Point'
                );
                if (exitDataset) {
                    exitDataset.hidden = !visible;
                }
                break;
        }
        
        DTIBacktester.priceChart.update();
    }

    /**
     * Reset zoom level on all charts
     */
    function resetChartZoom() {
        if (DTIBacktester.priceChart && DTIBacktester.priceChart.resetZoom) {
            DTIBacktester.priceChart.resetZoom();
        }
        
        if (DTIBacktester.dtiChart && DTIBacktester.dtiChart.resetZoom) {
            DTIBacktester.dtiChart.resetZoom();
        }
        
        if (DTIBacktester.sevenDayDTIChart && DTIBacktester.sevenDayDTIChart.resetZoom) {
            DTIBacktester.sevenDayDTIChart.resetZoom();
        }
        
        // Set all range buttons to default state
        const rangeButtons = document.querySelectorAll('.range-btn');
        rangeButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.range-btn[data-range="all"]').classList.add('active');
        
        DTIBacktester.utils.showNotification('Chart zoom reset', 'info');
    }

    /**
     * Export the price chart as an image
     */
    function exportChartAsImage() {
        if (!DTIBacktester.priceChart) return;
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = 'dti-price-chart.png';
        
        // Convert chart canvas to data URL
        const dataUrl = document.getElementById('price-chart').toDataURL('image/png');
        link.href = dataUrl;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        DTIBacktester.utils.showNotification('Chart exported as image', 'success');
    }

    /**
     * Toggle annotation mode for adding chart annotations
     */
    function toggleAnnotationMode() {
        const body = document.body;
        const isAnnotationMode = body.classList.contains('annotation-mode');
        
        if (isAnnotationMode) {
            // Exit annotation mode
            body.classList.remove('annotation-mode');
            removeAnnotationListeners();
            DTIBacktester.utils.showNotification('Annotation mode disabled', 'info');
        } else {
            // Enter annotation mode
            body.classList.add('annotation-mode');
            addAnnotationListeners();
            DTIBacktester.utils.showNotification('Click on chart to add annotation', 'info');
        }
    }

    /**
     * Add event listeners for annotation mode
     */
    function addAnnotationListeners() {
        const priceChartCanvas = document.getElementById('price-chart');
        const dtiChartCanvas = document.getElementById('dti-chart');
        const sevenDayChartCanvas = document.getElementById('weekly-dti-chart');
        
        [priceChartCanvas, dtiChartCanvas, sevenDayChartCanvas].forEach(canvas => {
            if (canvas) {
                canvas.addEventListener('click', handleAnnotationClick);
            }
        });
    }

    /**
     * Remove event listeners for annotation mode
     */
    function removeAnnotationListeners() {
        const priceChartCanvas = document.getElementById('price-chart');
        const dtiChartCanvas = document.getElementById('dti-chart');
        const sevenDayChartCanvas = document.getElementById('weekly-dti-chart');
        
        [priceChartCanvas, dtiChartCanvas, sevenDayChartCanvas].forEach(canvas => {
            if (canvas) {
                canvas.removeEventListener('click', handleAnnotationClick);
            }
        });
    }

    /**
     * Handle click on chart when in annotation mode
     * @param {Event} event - Click event
     */
    function handleAnnotationClick(event) {
        // Identify which chart was clicked
        const canvas = event.currentTarget;
        let chart;
        
        if (canvas.id === 'price-chart') {
            chart = DTIBacktester.priceChart;
        } else if (canvas.id === 'dti-chart') {
            chart = DTIBacktester.dtiChart;
        } else if (canvas.id === 'weekly-dti-chart') {
            chart = DTIBacktester.sevenDayDTIChart;
        } else {
            return;
        }
        
        // Get click position relative to the chart
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Get data point nearest to click
        const point = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true)[0];
        if (!point) return;
        
        // Get data value at that point
        const dataIndex = point.index;
        const dateValue = chart.data.labels[dataIndex];
        
        // Ask user for annotation text
        const annotationText = prompt('Enter annotation text:');
        if (!annotationText) return;
        
        // Add annotation to chart
        addChartAnnotation(chart, dataIndex, dateValue, annotationText);
        
        // Exit annotation mode
        document.body.classList.remove('annotation-mode');
        removeAnnotationListeners();
        
        DTIBacktester.utils.showNotification('Annotation added', 'success');
    }

    /**
     * Add an annotation to a chart
     * @param {Chart} chart - Chart.js instance
     * @param {number} dataIndex - Index of data point
     * @param {string} dateValue - Date value
     * @param {string} text - Annotation text
     */
    function addChartAnnotation(chart, dataIndex, dateValue, text) {
        // Initialize annotations array if needed
        if (!chart.options.plugins.annotation) {
            chart.options.plugins.annotation = {
                annotations: {}
            };
        }
        
        // Generate unique ID for the annotation
        const id = 'annotation_' + Date.now();
        
        // Get y value for positioning
        const yValue = chart.data.datasets[0].data[dataIndex];
        
        // Create annotation object
        chart.options.plugins.annotation.annotations[id] = {
            type: 'point',
            xValue: dateValue,
            yValue: yValue,
            backgroundColor: 'rgba(255, 99, 132, 1)',
            borderColor: 'white',
            borderWidth: 2,
            radius: 6,
            content: text,
            label: {
                display: true,
                content: text,
                position: 'top',
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                color: 'white',
                padding: 6,
                font: {
                    size: 12,
                    weight: 'bold'
                }
            }
        };
        
        // Save annotations for persistence
        if (!DTIBacktester.annotations) {
            DTIBacktester.annotations = {};
        }
        
        DTIBacktester.annotations[id] = {
            chartId: chart.canvas.id,
            xValue: dateValue,
            yValue: yValue,
            text: text
        };
        
        // Update the chart
        chart.update();
    }

    /**
     * Display trade details in a modal
     * @param {Object} trade - Trade object
     */
    function showTradeDetails(trade) {
        if (!trade) return;
        
        const modal = document.querySelector('.trade-detail-modal');
        const detailsContainer = modal.querySelector('.trade-details');
        
        // Format date
        const formatDate = date => {
            return new Date(date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };
        
        // Get currency symbol
        const currencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
            TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex) : 
            (DTIBacktester.currentStockIndex === 'ftse100' || DTIBacktester.currentStockIndex === 'ftse250' ? '£' : 
             DTIBacktester.currentStockIndex === 'usStocks' ? '$' : '₹');
        
        // Calculate holding period
        const entryDate = new Date(trade.entryDate);
        const exitDate = trade.exitDate ? new Date(trade.exitDate) : new Date();
        const holdingDays = Math.floor((exitDate - entryDate) / (1000 * 60 * 60 * 24));
        
        // Populate details
        detailsContainer.innerHTML = `
            <div class="detail-group">
                <div class="detail-label">Entry Date</div>
                <div class="detail-value">${formatDate(trade.entryDate)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Entry Price</div>
                <div class="detail-value">${currencySymbol}${trade.entryPrice.toFixed(2)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Entry DTI</div>
                <div class="detail-value">${trade.entryDTI.toFixed(2)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">7-Day DTI at Entry</div>
                <div class="detail-value">${trade.entry7DayDTI ? trade.entry7DayDTI.toFixed(2) : 'N/A'}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Exit Date</div>
                <div class="detail-value">${trade.exitDate ? formatDate(trade.exitDate) : 'Active Trade'}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Exit Price</div>
                <div class="detail-value">${trade.exitPrice ? currencySymbol + trade.exitPrice.toFixed(2) : currencySymbol + trade.currentPrice.toFixed(2) + ' (Current)'}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">P/L</div>
                <div class="detail-value ${(trade.plPercent || trade.currentPlPercent) >= 0 ? 'positive' : 'negative'}">
                    ${trade.plPercent ? trade.plPercent.toFixed(2) : trade.currentPlPercent.toFixed(2)}%
                </div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Holding Period</div>
                <div class="detail-value">${holdingDays} days</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Exit Reason</div>
                <div class="detail-value">${trade.exitReason || 'Active Trade'}</div>
            </div>
        `;
        
        // Show modal
        modal.classList.add('visible');
        
        // Create mini chart of trade
        createTradeDetailChart(trade);
    }

    /**
     * Create a mini chart showing just the trade period
     * @param {Object} trade - Trade object
     */
    function createTradeDetailChart(trade) {
        // Clean up existing chart
        if (window.tradeDetailChart) {
            window.tradeDetailChart.destroy();
        }
        
        // Get the data for this trade period
        const allDates = DTIBacktester.priceChart.data.labels;
        const allPrices = DTIBacktester.priceChart.data.datasets[0].data;
        
        const entryIndex = allDates.indexOf(trade.entryDate);
        const exitIndex = trade.exitDate ? allDates.indexOf(trade.exitDate) : allDates.length - 1;
        
        if (entryIndex === -1) return;
        
        // Get a few days before and after for context
        const buffer = Math.min(10, Math.floor((exitIndex - entryIndex) / 2));
        const startIndex = Math.max(0, entryIndex - buffer);
        const endIndex = Math.min(allDates.length - 1, exitIndex + buffer);
        
        const dates = allDates.slice(startIndex, endIndex + 1);
        const prices = allPrices.slice(startIndex, endIndex + 1);
        
        // Create entry and exit markers
        const entryMarker = Array(dates.length).fill(null);
        entryMarker[entryIndex - startIndex] = prices[entryIndex - startIndex];
        
        const exitMarker = Array(dates.length).fill(null);
        if (trade.exitDate && exitIndex !== -1) {
            exitMarker[exitIndex - startIndex] = prices[exitIndex - startIndex];
        }
        
        // Create chart
        const ctx = document.getElementById('trade-detail-chart').getContext('2d');
        
        window.tradeDetailChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true
                }, {
                    label: 'Entry',
                    data: entryMarker,
                    backgroundColor: 'rgba(16, 185, 129, 1)',
                    borderColor: 'white',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointStyle: 'circle',
                    showLine: false
                }, {
                    label: 'Exit',
                    data: exitMarker,
                    backgroundColor: 'rgba(239, 68, 68, 1)',
                    borderColor: 'white',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointStyle: 'circle',
                    showLine: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 5,
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                // Get currency symbol
                                const currencySymbol = typeof TradeCore !== 'undefined' && TradeCore.getCurrencySymbol ? 
                                    TradeCore.getCurrencySymbol(DTIBacktester.currentStockIndex) : 
                                    (DTIBacktester.currentStockIndex === 'ftse100' || DTIBacktester.currentStockIndex === 'ftse250' ? '£' : 
                                     DTIBacktester.currentStockIndex === 'usStocks' ? '$' : '₹');
                                
                                return currencySymbol + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true
                    }
                }
            }
        });
    }
    
    // Return public API
    return {
        initStockSelector,
        populateStockSelector,
        updateStockSelector,
        createBuyingOpportunitiesSection,
        displayBuyingOpportunities,
        createCharts,
        displayStatistics,
        displayTrades,
        addChartControls,
        updateChartsAfterParameterChange,
        initParameterChangeListeners,
        showTradeDetails,
        getStocksForSelectedScanType,
        getConvictionLabel
    };
})();

// Make DTIUI available globally
window.DTIUI = DTIUI;

// Export chart controls functions to global scope
window.DTIChartControls = {
    addChartControls: DTIUI.addChartControls,
    showTradeDetails: DTIUI.showTradeDetails
};

// Export chart helper functions
window.DTIChartHelpers = {
    updateChartsAfterParameterChange: DTIUI.updateChartsAfterParameterChange,
    initParameterChangeListeners: DTIUI.initParameterChangeListeners
};

// Attach UI initialization to the DTIBacktester init
// Override the existing stubs with full implementations
DTIBacktester.initStockSelector = function() {
    DTIUI.initStockSelector();
};

DTIBacktester.createBuyingOpportunitiesSection = function() {
    DTIUI.createBuyingOpportunitiesSection();
};

// Add properties for chart interactivity
DTIBacktester.tradeData = []; // Stores trade data for interactions
DTIBacktester.annotations = {}; // Stores chart annotations

// Initialize parameter change listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof DTIChartHelpers !== 'undefined') {
        DTIChartHelpers.initParameterChangeListeners();
    }
});

// Extend DTIBacktester initialization with chart controls
const originalInit = DTIBacktester.init || function() {};
DTIBacktester.init = function() {
    // Call original init function
    originalInit.apply(this, arguments);
    
    // Add chart controls if needed
    if (typeof DTIChartControls !== 'undefined') {
        DTIChartControls.addChartControls();
    }
};