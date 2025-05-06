import logging
import sys
import os
from datetime import datetime
from fetch_stock_data import fetch_stock_data
from firebase_utils import initialize_firebase, batch_update_stocks

# Import stock lists from existing file
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from js.dti_stock_lists import (
    nifty50Stocks, 
    niftyNext50Stocks, 
    ftse100Stocks, 
    usStocks
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'logs/batch_processor.log'), mode='a', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Ensure logs directory exists
os.makedirs(os.path.join(os.path.dirname(__file__), 'logs'), exist_ok=True)

def get_stock_list(index_name):
    """Get the list of stocks for a given index"""
    stock_lists = {
        'nifty50': nifty50Stocks,
        'niftyNext50': niftyNext50Stocks,
        'ftse100': ftse100Stocks,
        'us_stocks': usStocks
    }
    
    return stock_lists.get(index_name, [])

def process_batch(index_name, force_update=False, period="5y", interval="1d"):
    """Process all stocks in an index and store in Firestore"""
    logging.info(f"Starting batch process for {index_name}")
    print(f"Starting batch process for {index_name}")
    
    db = initialize_firebase()
    stocks = get_stock_list(index_name)
    
    if not stocks:
        error_msg = f"No stocks found for index: {index_name}"
        logging.error(error_msg)
        print(error_msg)
        return {'success': [], 'failed': [], 'error': error_msg}
    
    results = {
        'success': [],
        'failed': []
    }
    
    total = len(stocks)
    logging.info(f"Processing {total} stocks from {index_name}")
    print(f"Processing {total} stocks from {index_name}")
    
    for i, symbol in enumerate(stocks):
        print(f"Processing [{i+1}/{total}]: {symbol}")
        success = fetch_stock_data(
            symbol=symbol, 
            period=period, 
            interval=interval, 
            force_update=force_update
        )
        
        if success:
            results['success'].append(symbol)
        else:
            results['failed'].append(symbol)
    
    # Store batch results in Firestore
    batch_ref = db.collection('batch_results').document()
    batch_ref.set({
        'index': index_name,
        'timestamp': datetime.now().isoformat(),
        'total': total,
        'success_count': len(results['success']),
        'failed_count': len(results['failed']),
        'failed_symbols': results['failed']
    })
    
    logging.info(f"Batch process completed. Success: {len(results['success'])}, Failed: {len(results['failed'])}")
    print(f"Batch process completed. Success: {len(results['success'])}, Failed: {len(results['failed'])}")
    
    return results

# Command line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Process stocks in batch and store in Firestore')
    parser.add_argument('index', choices=['nifty50', 'niftyNext50', 'ftse100', 'us_stocks'],
                        help='Index to process')
    parser.add_argument('--period', default='5y', help='Data period (default: 5y)')
    parser.add_argument('--interval', default='1d', help='Data interval (default: 1d)')
    parser.add_argument('--force', action='store_true', help='Force update regardless of last update time')
    
    args = parser.parse_args()
    
    results = process_batch(
        index_name=args.index,
        period=args.period,
        interval=args.interval,
        force_update=args.force
    )
    
    # Exit with error code if any failures
    sys.exit(0 if not results['failed'] else 1)
