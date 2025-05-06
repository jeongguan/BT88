/**
 * DTI Backtester - Stock Lists Module
 * Contains all stock and market index lists used by the application
 * 
 * This module implements dynamic loading of stock lists from JSON files,
 * with fallback to embedded data when running in a local file environment.
 */

// Create DTIStockLists module
window.DTIStockLists = (function() {
    // Cache for loaded stock lists
    const stockListCache = {};
    
    // Registry of available stock lists
    let registry = null;
    
    // Detect if we're running in a local file environment (file://)
    const isLocalFileEnvironment = window.location.protocol === 'file:';
    
    // Flag to track initialization
    let initialized = false;
    let initPromise = null;
    
    // Embedded stock lists (used as defaults and fallbacks)
    // Indian Market Stock Lists
    const embeddedLists = {
        nifty50: [
            { name: "Adani Enterprises", symbol: "ADANIENT.NS" },
            { name: "UPL", symbol: "UPL.NS" },
            { name: "Wipro", symbol: "WIPRO.NS" }
        ],
        
        niftyNext50: [
            { name: "Tata Power", symbol: "TATAPOWER.NS" },
            { name: "Zydus Lifesciences", symbol: "ZYDUSLIFE.NS" }
        ],
        
        niftyMidcap150: [
            { name: "Aditya Birla Capital", symbol: "ABCAPITAL.NS" },
            { name: "Tata Teleservices", symbol: "TTML.NS" }
        ],
        
        // UK Market Stock Lists
        ftse250: [
            { name: "3i Infrastructure", symbol: "3IN.L" },
            { name: "Spectris", symbol: "SXS.L" },
            { name: "Spire Healthcare Group", symbol: "SPI.L" },
            { name: "SSP Group", symbol: "SSPG.L" },
            { name: "St. James's Place", symbol: "STJ.L" }
        ],
        
        ftse100: [
            { name: "3i", symbol: "III.L" },
            { name: "Admiral Group", symbol: "ADM.L" },
            { name: "WPP", symbol: "WPP.L" },
            { name: "Stellantis", symbol: "STLA" }
        ],
        
        // US Market Stock Lists
        usMidCap: [
            { name: "Helix Energy Solutions Group, Inc.", symbol: "HLX" },
            { name: "Energy Fuels Inc", symbol: "UUUU" },
            { name: "Fulcrum Therapeutics, Inc.", symbol: "FULC" },
            { name: "enCore Energy Corp.", symbol: "EU" }
        ],
        
        usSmallCap: [
            { name: "ATAI Life Sciences N.V.", symbol: "ATAI" },
            { name: "Masterbeat Corp", symbol: "MSTO" }
        ],
        
        usStocks: [
            { name: "Microsoft Corporation", symbol: "MSFT" },
            { name: "Transportation and Logistics Systems, Inc.", symbol: "TLSS" },
            { name: "Medical Care Technologies Inc.", symbol: "MDCE" },
            { name: "CN Energy Group Inc.", symbol: "CNEY" },
            { name: "EyeCity.com, Inc.", symbol: "ICTY" },
            { name: "eWorld Companies, Inc.", symbol: "EWRC" },
            { name: "LogicMark, Inc.", symbol: "LGMK" }
        ],
        
        // Market Indices List
        indices: [
            { name: "Nifty 50 Index", symbol: "^NSEI" },
            { name: "S&P 500 Index", symbol: "^GSPC" },
            { name: "FTSE 100 Index", symbol: "^FTSE" },
            { name: "Bank Nifty Index", symbol: "^NSEBANK" }
        ]
    };
    
    // Embedded registry that mirrors our registry.json
    const embeddedRegistry = {
        version: "1.0",
        lastUpdated: "2025-05-03",
        lists: [
            {
                id: "nifty50",
                name: "Nifty 50",
                region: "India",
                file: "nifty50.json"
            },
            {
                id: "niftyNext50",
                name: "Nifty Next 50",
                region: "India",
                file: "niftyNext50.json"
            },
            {
                id: "niftyMidcap150",
                name: "Nifty Midcap 150",
                region: "India",
                file: "niftyMidcap150.json"
            },
            {
                id: "ftse100",
                name: "FTSE 100",
                region: "UK",
                file: "ftse100.json"
            },
            {
                id: "ftse250",
                name: "FTSE 250",
                region: "UK",
                file: "ftse250.json"
            },
            {
                id: "usMidCap",
                name: "US Mid Cap",
                region: "US",
                file: "usMidCap.json"
            },
            {
                id: "usSmallCap",
                name: "US Small Cap",
                region: "US",
                file: "usSmallCap.json"
            },
            {
                id: "usStocks",
                name: "US Stocks",
                region: "US",
                file: "usStocks.json"
            },
            {
                id: "indices",
                name: "Market Indices",
                region: "Global",
                file: "indices.json"
            }
        ]
    };
    
    // Initialize using embedded data if in local file environment
    function useEmbeddedData() {
        console.log("Using embedded stock lists (local file environment detected)");
        initialized = true;
        registry = embeddedRegistry;
        
        // Pre-populate cache with embedded lists
        Object.keys(embeddedLists).forEach(listId => {
            stockListCache[listId] = embeddedLists[listId];
        });
        
        return Promise.resolve(true);
    }
    
    /**
     * Initialize the module by loading the registry
     * @returns {Promise} Promise that resolves when registry is loaded
     */
    function initialize() {
        if (initPromise) {
            return initPromise;
        }
        
        // If we're in a local file environment, use embedded data
        if (isLocalFileEnvironment) {
            initPromise = useEmbeddedData();
            return initPromise;
        }
        
        // Otherwise, try to load from JSON files
        initPromise = fetch('js/stock-lists/registry.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load stock list registry');
                }
                return response.json();
            })
            .then(data => {
                registry = data;
                initialized = true;
                console.log('Stock list registry loaded successfully');
                return true;
            })
            .catch(error => {
                console.error('Error loading stock list registry:', error);
                // Fall back to embedded data on error
                return useEmbeddedData();
            });
        
        return initPromise;
    }
    
    /**
     * Load a stock list from its JSON file or use embedded data
     * @param {string} listId - ID of the stock list to load
     * @returns {Promise<Array>} Promise that resolves with the stock list
     */
    async function loadStockList(listId) {
        // Check cache first
        if (stockListCache[listId]) {
            return stockListCache[listId];
        }
        
        // Ensure initialization
        await initialize();
        
        // If in local file environment, return embedded data
        if (isLocalFileEnvironment) {
            return embeddedLists[listId] || [];
        }
        
        // Find list info in registry
        const listInfo = registry.lists.find(list => list.id === listId);
        if (!listInfo) {
            console.warn(`Stock list "${listId}" not found in registry`);
            return embeddedLists[listId] || [];
        }
        
        try {
            const response = await fetch(`js/stock-lists/${listInfo.file}`);
            if (!response.ok) {
                throw new Error(`Failed to load stock list: ${listInfo.file}`);
            }
            
            const stockList = await response.json();
            
            // Cache the result
            stockListCache[listId] = stockList;
            
            return stockList;
        } catch (error) {
            console.error(`Error loading stock list "${listId}":`, error);
            // Fall back to embedded data
            stockListCache[listId] = embeddedLists[listId] || [];
            return stockListCache[listId];
        }
    }
    
    /**
     * Get combined stock lists for various scan types
     * @param {string} scanType - Type of scan to perform
     * @returns {Promise<Array>} Promise that resolves with combined stock list
     */
    async function getStocksForScanType(scanType) {
        // If in local file environment, return embedded combined lists directly
        if (isLocalFileEnvironment) {
            switch(scanType) {
                case 'all':
                    return [
                        ...embeddedLists.nifty50,
                        ...embeddedLists.niftyNext50,
                        ...embeddedLists.niftyMidcap150,
                        ...embeddedLists.ftse100,
                        ...embeddedLists.ftse250,
                        ...embeddedLists.usStocks,
                        ...embeddedLists.usSmallCap,
                        ...embeddedLists.usMidCap
                    ];
                case 'indian':
                    return [
                        ...embeddedLists.nifty50,
                        ...embeddedLists.niftyNext50,
                        ...embeddedLists.niftyMidcap150
                    ];
                case 'uk':
                    return [
                        ...embeddedLists.ftse100,
                        ...embeddedLists.ftse250
                    ];
                case 'us':
                    return [
                        ...embeddedLists.usStocks,
                        ...embeddedLists.usSmallCap,
                        ...embeddedLists.usMidCap
                    ];
                default:
                    return [];
            }
        }
        
        // Otherwise, load lists as needed
        let combinedList = [];
        
        switch(scanType) {
            case 'all':
                // Load all stock lists except indices
                await Promise.all([
                    loadStockList('nifty50'),
                    loadStockList('niftyNext50'),
                    loadStockList('niftyMidcap150'),
                    loadStockList('ftse100'),
                    loadStockList('ftse250'),
                    loadStockList('usStocks'),
                    loadStockList('usSmallCap'),
                    loadStockList('usMidCap')
                ]).then(lists => {
                    combinedList = lists.flat();
                });
                break;
                
            case 'indian':
                await Promise.all([
                    loadStockList('nifty50'),
                    loadStockList('niftyNext50'),
                    loadStockList('niftyMidcap150')
                ]).then(lists => {
                    combinedList = lists.flat();
                });
                break;
                
            case 'uk':
                await Promise.all([
                    loadStockList('ftse100'),
                    loadStockList('ftse250')
                ]).then(lists => {
                    combinedList = lists.flat();
                });
                break;
                
            case 'us':
                await Promise.all([
                    loadStockList('usStocks'),
                    loadStockList('usSmallCap'),
                    loadStockList('usMidCap')
                ]).then(lists => {
                    combinedList = lists.flat();
                });
                break;
                
            default:
                combinedList = [];
        }
        
        return combinedList;
    }
    
    // Pre-load the registry to speed up first access
    initialize();
    
    // Public API with both async and sync methods for backward compatibility
    return {
        // Async API (preferred for new code)
        // ------------------------------
        
        // Load a stock list by ID
        loadStockList,
        
        // Get combined stock lists for scan types
        getStocksForScanType,
        
        // Get all stock lists asynchronously
        getAllStockListsAsync: async function() {
            const lists = {};
            const listIds = Object.keys(embeddedLists);
            
            await Promise.all(listIds.map(async id => {
                lists[id] = await loadStockList(id);
            }));
            
            return lists;
        },
        
        // Get registry information
        getRegistry: async function() {
            await initialize();
            return registry;
        },
        
        // Clear the cache (useful for testing or forcing a refresh)
        clearCache: function() {
            if (isLocalFileEnvironment) {
                console.log("Cache clearing skipped in local file environment");
                return;
            }
            
            Object.keys(stockListCache).forEach(key => {
                delete stockListCache[key];
            });
            console.log('Stock list cache cleared');
        },
        
        // Sync API (for backward compatibility)
        // ------------------------------
        
        // Stock list getters (return cached data or embedded lists)
        getNifty50Stocks: function() { 
            return stockListCache.nifty50 || embeddedLists.nifty50; 
        },
        getNiftyNext50Stocks: function() { 
            return stockListCache.niftyNext50 || embeddedLists.niftyNext50; 
        },
        getNiftyMidcap150Stocks: function() { 
            return stockListCache.niftyMidcap150 || embeddedLists.niftyMidcap150; 
        },
        getFTSE100Stocks: function() { 
            return stockListCache.ftse100 || embeddedLists.ftse100; 
        },
        getFTSE250Stocks: function() { 
            return stockListCache.ftse250 || embeddedLists.ftse250; 
        },
        getUSMidCapStocks: function() { 
            return stockListCache.usMidCap || embeddedLists.usMidCap; 
        },
        getUSSmallCapStocks: function() { 
            return stockListCache.usSmallCap || embeddedLists.usSmallCap; 
        },
        getUSStocks: function() { 
            return stockListCache.usStocks || embeddedLists.usStocks; 
        },
        getMarketIndices: function() { 
            return stockListCache.indices || embeddedLists.indices; 
        },
        
        // Get all stock lists synchronously (from cache or embedded)
        getAllStockLists: function() {
            return {
                nifty50: stockListCache.nifty50 || embeddedLists.nifty50,
                niftyNext50: stockListCache.niftyNext50 || embeddedLists.niftyNext50,
                niftyMidcap150: stockListCache.niftyMidcap150 || embeddedLists.niftyMidcap150,
                ftse100: stockListCache.ftse100 || embeddedLists.ftse100,
                ftse250: stockListCache.ftse250 || embeddedLists.ftse250,
                usMidCap: stockListCache.usMidCap || embeddedLists.usMidCap,
                usSmallCap: stockListCache.usSmallCap || embeddedLists.usSmallCap,
                usStocks: stockListCache.usStocks || embeddedLists.usStocks,
                indices: stockListCache.indices || embeddedLists.indices
            };
        },
        
        // Get stock list by ID synchronously (from cache or embedded)
        getStockListById: function(listId) {
            return stockListCache[listId] || embeddedLists[listId] || [];
        },
        
        // Init method for eagerly loading all stock lists
        preloadAllStockLists: async function() {
            await initialize();
            
            if (isLocalFileEnvironment) {
                console.log("All stock lists preloaded (using embedded data)");
                return;
            }
            
            const listIds = Object.keys(embeddedLists);
            await Promise.all(listIds.map(id => loadStockList(id)));
            console.log('All stock lists preloaded');
        },
        
        // Expose whether we're in a local file environment (for debugging)
        isLocalFileEnvironment: isLocalFileEnvironment
    };
})();

// Make DTIStockLists available globally
window.DTIStockLists = DTIStockLists;

// Preload all stock lists to ensure backward compatibility
document.addEventListener('DOMContentLoaded', function() {
    // Delay slightly to allow other scripts to initialize
    setTimeout(function() {
        DTIStockLists.preloadAllStockLists().catch(error => {
            console.warn('Error preloading stock lists:', error);
        });
    }, 100);
});