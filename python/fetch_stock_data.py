import os
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import time
import json
import logging
import sys

# Configure logging if not already configured
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/Users/DSJP/Desktop/CODE/BT/python/logs/stock_update.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )

# Configuration
DATA_DIR = "/Users/DSJP/Desktop/CODE/BT/DATA"
METADATA_FILE = os.path.join(DATA_DIR, "metadata.json")

def fetch_stock_data(symbol, period="5y", interval="1d", force_update=False):
    """Fetch stock data and save as CSV"""
    logging.info(f"Processing symbol: {symbol}")
    
    # Determine index folder
    index_folder = get_index_folder(symbol)
    logging.info(f"Using index folder: {index_folder}")
    
    os.makedirs(os.path.join(DATA_DIR, index_folder), exist_ok=True)
    logging.info(f"Created/verified directory: {os.path.join(DATA_DIR, index_folder)}")
    
    # File path
    file_path = os.path.join(DATA_DIR, index_folder, f"{symbol}.csv")
    logging.info(f"Target file path: {file_path}")
    
    # Check if file exists and if update is needed
    if not force_update and os.path.exists(file_path):
        logging.info(f"File exists for {symbol}, checking if update needed")
        if not is_update_needed(symbol):
            logging.info(f"Skipping {symbol}: Data is up-to-date")
            print(f"Skipping {symbol}: Data is up-to-date")
            return True
            
    # Fetch data
    try:
        logging.info(f"Fetching data for {symbol}...")
        print(f"Fetching data for {symbol}...")
        
        try:
            ticker = yf.Ticker(symbol)
            logging.info(f"Created ticker object for {symbol}")
            data = ticker.history(period=period, interval=interval)
            logging.info(f"Retrieved history data for {symbol}, rows: {len(data) if not data.empty else 0}")
        except Exception as ticker_error:
            logging.error(f"Error in yfinance API for {symbol}: {str(ticker_error)}")
            raise
        
        if data.empty:
            logging.error(f"No data received for {symbol}")
            raise Exception(f"No data received for {symbol}")
            
        # Format data for CSV
        data = data.reset_index()
        # Format columns to match existing structure
        data = data.rename(columns={
            'Date': 'date',
            'Open': 'open', 
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        })
        
        # Save to CSV
        data.to_csv(file_path, index=False)
        
        # Update metadata
        update_metadata(symbol)
        
        print(f"✓ Successfully saved data for {symbol}")
        return True
        
    except Exception as e:
        print(f"Error fetching {symbol}: {str(e)}")
        return False
        
def get_index_folder(symbol):
    """Determine which index folder the symbol belongs to"""
    # Add logic to determine correct folder based on symbol
    if symbol.endswith('.NS'):
        folder = "nifty50"  # Or other Indian indices
    elif symbol.endswith('.L'):
        folder = "ftse100"  # Or ftse250
    else:
        folder = "us_stocks"  # Default for US stocks
        
    logging.info(f"Mapped symbol {symbol} to folder {folder}")
    return folder
        
def update_metadata(symbol):
    """Update the last update time in metadata"""
    try:
        metadata = {}
        if os.path.exists(METADATA_FILE):
            with open(METADATA_FILE, 'r') as f:
                metadata = json.load(f)
                
        # Update timestamp
        if 'symbols' not in metadata:
            metadata['symbols'] = {}
            
        metadata['symbols'][symbol] = {
            'last_updated': datetime.now().isoformat(),
            'status': 'success'
        }
        
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
            
    except Exception as e:
        print(f"Error updating metadata: {e}")
        
def is_update_needed(symbol: str) -> bool:
    """Check if symbol needs updating based on metadata and market hours"""
    try:
        if not os.path.exists(METADATA_FILE):
            return True
            
        with open(METADATA_FILE, 'r') as f:
            metadata = json.load(f)
            
        if 'symbols' not in metadata or symbol not in metadata['symbols']:
            return True
            
        last_updated = datetime.fromisoformat(metadata['symbols'][symbol]['last_updated'])
        now = datetime.now()
        
        # If data was updated in the last 30 minutes, don't update again
        if now - last_updated < timedelta(minutes=30):
            logging.info(f"Skipping update for {symbol}: Last updated {last_updated}, less than 30 minutes ago")
            return False
        
        # Check market hours for US stocks
        if not symbol.endswith('.L') and not symbol.endswith('.NS'):  # US stock
            # Convert to Eastern Time
            # This is a simplified check. For more accurate results, 
            # you might want to use pytz or dateutil libraries.
            et_hour = (now.hour - 5) % 24  # Approximate ET conversion
            
            # If it's a US stock and it's before 5 PM ET, don't update
            # unless the data is from yesterday or earlier
            if et_hour < 17 and last_updated.date() == now.date():
                logging.info(f"Skipping update for US stock {symbol}: Market may still be open or recently closed")
                return False
        
        # Data needs updating
        logging.info(f"Update needed for {symbol}: Last updated {last_updated}")
        return True
        
    except Exception as e:
        logging.error(f"Error checking if update needed: {e}")
        return True
        
# Example usage
if __name__ == "__main__":
    symbol = "AAPL"
    fetch_stock_data(symbol)