import json
import os

# Base path to stock lists
BASE_PATH = "/Users/DSJP/Desktop/CODE/BT"

# Add logging
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/DSJP/Desktop/CODE/BT/python/logs/stock_update.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def get_stock_list(index_name):
    """Get a list of stock symbols for a given index"""
    try:
        # Try to load from JSON file first (compatible with JS implementation)
        json_path = os.path.join(BASE_PATH, "js", "stock-lists", f"{index_name}.json")
        
        logging.info(f"Looking for stock list at: {json_path}")
        
        if os.path.exists(json_path):
            logging.info(f"Found {index_name}.json file")
            with open(json_path, 'r') as f:
                stock_data = json.load(f)
                symbols = [stock['symbol'] for stock in stock_data]
                logging.info(f"Loaded {len(symbols)} symbols from {index_name}.json")
                return symbols
        else:
            logging.error(f"File not found: {json_path}")
        
        # Fallback to hardcoded lists if JSON not available
        stock_lists = {
            "nifty50": [
                "ADANIENT.NS", "APOLLOHOSP.NS", "ASIANPAINT.NS",
                # Add all stocks here
            ],
            "ftse100": [
                "BARC.L", "HSBA.L", "BP.L",
                # Add all stocks here
            ],
            "usStocks": [
                "AAPL", "MSFT", "GOOGL", 
                # Add all stocks here
            ]
            # Add other indices
        }
        
        return stock_lists.get(index_name, [])
        
    except Exception as e:
        print(f"Error loading stock list for {index_name}: {e}")
        return []