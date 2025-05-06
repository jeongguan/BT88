import os
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import time
import logging
import sys
from firebase_utils import (
    initialize_firebase, get_stock_ref, 
    update_metadata, is_update_needed, get_index_collection
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'logs/stock_update.log'), mode='a', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Ensure logs directory exists
os.makedirs(os.path.join(os.path.dirname(__file__), 'logs'), exist_ok=True)

def fetch_stock_data(symbol, period="5y", interval="1d", force_update=False):
    """Fetch stock data and save to Firestore"""
    logging.info(f"Processing symbol: {symbol}")
    
    # Initialize Firestore
    db = initialize_firebase()
    
    # Check if update is needed
    if not force_update and not is_update_needed(db, symbol):
        logging.info(f"Skipping {symbol}: Data is up-to-date")
        print(f"Skipping {symbol}: Data is up-to-date")
        return True
            
    # Fetch data
    try:
        logging.info(f"Fetching data for {symbol}...")
        print(f"Fetching data for {symbol}...")
        
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval)
        except Exception as ticker_error:
            logging.error(f"Error in yfinance API for {symbol}: {str(ticker_error)}")
            raise
        
        if data.empty:
            logging.error(f"No data received for {symbol}")
            raise Exception(f"No data received for {symbol}")
            
        # Format data for Firestore
        data = data.reset_index()
        
        # Convert DataFrame to a list of dictionaries for Firestore
        # Format dates to strings to ensure serialization
        data_dict = data.rename(columns={
            'Date': 'date',
            'Open': 'open', 
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        }).to_dict('records')
        
        # Process dates for JSON serialization
        for record in data_dict:
            if isinstance(record['date'], pd.Timestamp):
                record['date'] = record['date'].isoformat()
        
        # Write to Firestore
        stock_ref = get_stock_ref(db, symbol)
        stock_ref.set({
            'symbol': symbol,
            'data': data_dict,
            'updated_at': datetime.now().isoformat()
        })
        
        # Update metadata
        update_metadata(db, symbol)
        
        print(f"✓ Successfully saved data for {symbol} to Firestore")
        return True
        
    except Exception as e:
        print(f"Error fetching {symbol}: {str(e)}")
        logging.error(f"Error fetching {symbol}: {str(e)}")
        return False

# Command line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch stock data and store in Firestore')
    parser.add_argument('symbol', help='Stock symbol to fetch')
    parser.add_argument('--period', default='5y', help='Data period (default: 5y)')
    parser.add_argument('--interval', default='1d', help='Data interval (default: 1d)')
    parser.add_argument('--force', action='store_true', help='Force update regardless of last update time')
    
    args = parser.parse_args()
    
    success = fetch_stock_data(
        symbol=args.symbol,
        period=args.period,
        interval=args.interval,
        force_update=args.force
    )
    
    sys.exit(0 if success else 1)
