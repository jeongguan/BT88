import time
import json
import os
from fetch_stock_data import fetch_stock_data
from stock_lists import get_stock_list

# Configuration
MAX_RETRIES = 3
DELAY_BETWEEN_STOCKS = 1  # seconds

def process_batch(index_name, force_update=False):
    """Process all stocks in a given index"""
    stocks = get_stock_list(index_name)
    
    if not stocks:
        print(f"No stocks found for index: {index_name}")
        return
        
    total = len(stocks)
    success_count = 0
    failure_count = 0
    
    print(f"Starting batch process for {index_name} ({total} stocks)")
    
    for i, stock in enumerate(stocks):
        print(f"Processing {i+1}/{total}: {stock}")
        
        # Add delay to avoid rate limiting
        if i > 0:
            time.sleep(DELAY_BETWEEN_STOCKS)
            
        success = fetch_stock_data(stock, force_update=force_update)
        
        if success:
            success_count += 1
        else:
            failure_count += 1
            # Retry logic could be added here
            
    print(f"\nBatch processing complete for {index_name}:")
    print(f"Total symbols: {total}")
    print(f"Successfully processed: {success_count}")
    print(f"Failed: {failure_count}")
    
    return {
        "total": total,
        "success": success_count,
        "failed": failure_count
    }
    
def process_all_indices(force_update=False):
    """Process all stock indices"""
    indices = ["nifty50", "niftyNext50", "niftyMidcap150", 
              "ftse100", "ftse250", "usStocks"]
    
    results = {}
    
    for index in indices:
        print(f"\n{'='*50}")
        print(f"Processing index: {index}")
        print(f"{'='*50}\n")
        
        result = process_batch(index, force_update)
        results[index] = result
        
        # Add delay between indices
        time.sleep(3)
        
    print("\nAll indices processed")
    return results
    
if __name__ == "__main__":
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        index_name = sys.argv[1]
        force_update = len(sys.argv) > 2 and sys.argv[2].lower() == "force"
        process_batch(index_name, force_update)
    else:
        # Process all indices
        process_all_indices()