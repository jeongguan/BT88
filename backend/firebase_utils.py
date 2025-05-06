import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from datetime import datetime, timedelta

# Initialize Firebase
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()

# Get Firestore document reference for a stock
def get_stock_ref(db, symbol):
    """Get a reference to the appropriate Firestore document for a stock symbol"""
    index_collection = get_index_collection(symbol)
    return db.collection(index_collection).document(symbol)

# Determine which collection a symbol belongs to
def get_index_collection(symbol):
    """Determine which collection the symbol belongs to (equivalent to get_index_folder)"""
    if symbol.endswith('.NS'):
        collection = "nifty50"  # Or other Indian indices
    elif symbol.endswith('.L'):
        collection = "ftse100"  # Or ftse250
    else:
        collection = "us_stocks"  # Default for US stocks
    return collection

# Update metadata
def update_metadata(db, symbol):
    """Update the last update time in metadata collection"""
    try:
        metadata_ref = db.collection('metadata').document('symbols')
        metadata_ref.set({
            symbol: {
                'last_updated': datetime.now().isoformat(),
                'status': 'success'
            }
        }, merge=True)
    except Exception as e:
        print(f"Error updating metadata: {e}")

# Check if update is needed
def is_update_needed(db, symbol):
    """Check if symbol needs updating based on metadata and market hours"""
    try:
        metadata_ref = db.collection('metadata').document('symbols')
        metadata_doc = metadata_ref.get()
        
        if not metadata_doc.exists:
            return True
            
        metadata_dict = metadata_doc.to_dict() or {}
        if 'symbols' not in metadata_dict or symbol not in metadata_dict.get('symbols', {}):
            return True
            
        symbol_data = metadata_dict.get('symbols', {}).get(symbol, {})
        if 'last_updated' not in symbol_data:
            return True
            
        last_updated = datetime.fromisoformat(symbol_data.get('last_updated', '2000-01-01T00:00:00'))
        now = datetime.now()
        
        # If data was updated in the last 30 minutes, don't update again
        if now - last_updated < timedelta(minutes=30):
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
                return False
        
        # Data needs updating
        return True
        
    except Exception as e:
        print(f"Error checking if update needed: {e}")
        return True
        
# Batch operations for efficient updates
def batch_update_stocks(db, symbols_data):
    """Update multiple stocks in a batch operation"""
    batch = db.batch()
    
    for symbol, data in symbols_data.items():
        stock_ref = get_stock_ref(db, symbol)
        batch.set(stock_ref, data)
    
    # Commit the batch
    batch.commit()
