/**
 * API client for DTI Stock data
 */
const DTIAPI = (function() {
  // API Base URL - change this when deploying to production
  let API_BASE_URL = 'http://localhost:3000/api';
  
  // Cache for storing API responses
  const cache = {};
  const CACHE_DURATION = 3600000; // 1 hour in milliseconds
  
  /**
   * Clear the API cache
   */
  function clearCache() {
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log('API cache cleared');
  }
  
  /**
   * Check if we have a valid cached response
   */
  function getFromCache(cacheKey) {
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp) < CACHE_DURATION) {
      console.log(`Using cached data for ${cacheKey}`);
      return cache[cacheKey].data;
    }
    return null;
  }
  
  /**
   * Store response in cache
   */
  function storeInCache(cacheKey, data) {
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: data
    };
  }
  
  return {
    /**
     * Update the API base URL
     * @param {string} newBaseUrl - New base URL for the API
     */
    setBaseUrl: function(newBaseUrl) {
      console.log(`Updating API base URL from ${API_BASE_URL} to ${newBaseUrl}`);
      if (newBaseUrl) {
        API_BASE_URL = newBaseUrl;
        clearCache(); // Clear cache when changing base URL
      }
    },
    
    /**
     * Fetch stock data from the API
     * @param {string} symbol - Stock symbol
     * @param {boolean} useCSV - Whether to request CSV format
     * @return {Promise} - Promise resolving to stock data
     */
    fetchStockData: async function(symbol, useCSV = false) {
      const cacheKey = `stock-${symbol}-${useCSV ? 'csv' : 'json'}`;
      
      // Check cache first
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch from API if not in cache
      try {
        const endpoint = useCSV ? 
          `${API_BASE_URL}/stocks/${symbol}/csv` : 
          `${API_BASE_URL}/stocks/${symbol}`;
          
        console.log(`Fetching data from ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        let result;
        if (useCSV) {
          result = await response.text();
        } else {
          result = await response.json();
        }
        
        // Store in cache
        storeInCache(cacheKey, result);
        
        return result;
      } catch (error) {
        console.error('Error fetching stock data:', error);
        throw error;
      }
    },
    
    /**
     * Get available symbols for an index
     * @param {string} indexName - Name of the index
     * @return {Promise} - Promise resolving to array of symbols
     */
    getIndexSymbols: async function(indexName) {
      const cacheKey = `index-${indexName}`;
      
      // Check cache first
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/stocks/index/${indexName}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const json = await response.json();
        
        // Store in cache
        storeInCache(cacheKey, json.symbols);
        
        return json.symbols;
      } catch (error) {
        console.error('Error fetching index symbols:', error);
        throw error;
      }
    },
    
    /**
     * Trigger an update for a stock
     * @param {string} symbol - Stock symbol
     * @param {boolean} forceUpdate - Whether to force update
     * @return {Promise} - Promise resolving to update result
     */
    updateStock: async function(symbol, forceUpdate = false) {
      try {
        const response = await fetch(`${API_BASE_URL}/update/${symbol}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ forceUpdate })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Clear cache for this symbol
        delete cache[`stock-${symbol}-json`];
        delete cache[`stock-${symbol}-csv`];
        
        return await response.json();
      } catch (error) {
        console.error('Error updating stock:', error);
        throw error;
      }
    },
    
    /**
     * Trigger an update for an entire index
     * @param {string} indexName - Name of the index
     * @param {boolean} forceUpdate - Whether to force update
     * @return {Promise} - Promise resolving to update result
     */
    updateIndex: async function(indexName, forceUpdate = false) {
      try {
        const response = await fetch(`${API_BASE_URL}/update/index/${indexName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ forceUpdate })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Clear cache for this index
        delete cache[`index-${indexName}`];
        
        return await response.json();
      } catch (error) {
        console.error('Error updating index:', error);
        throw error;
      }
    },
    
    /**
     * Check API health
     * @return {Promise} - Promise resolving to health check result
     */
    checkHealth: async function() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error checking API health:', error);
        throw error;
      }
    }
  };
})();
