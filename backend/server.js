const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Check if serviceAccountKey.json exists, if not create a placeholder
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.warn('Warning: serviceAccountKey.json not found. Please add your Firebase credentials.');
  const placeholderKey = {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "your-private-key-id",
    "private_key": "your-private-key",
    "client_email": "your-client-email",
    "client_id": "your-client-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "your-cert-url"
  };
  fs.writeFileSync(serviceAccountPath, JSON.stringify(placeholderKey, null, 2));
}

// Initialize Firebase Admin
let db;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Helper function to determine collection for a symbol
function getCollectionForSymbol(symbol) {
  if (symbol.endsWith('.NS')) {
    return 'nifty50';
  } else if (symbol.endsWith('.L')) {
    return 'ftse100';
  } else {
    return 'us_stocks';
  }
}

// API Routes

// Get stock data by symbol
app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const collection = getCollectionForSymbol(symbol);
    
    if (!db) {
      return res.status(500).json({ error: 'Firebase not initialized' });
    }
    
    const doc = await db.collection(collection).doc(symbol).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Stock data not found' });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get stock data in CSV format (for compatibility with existing code)
app.get('/api/stocks/:symbol/csv', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const collection = getCollectionForSymbol(symbol);
    
    if (!db) {
      return res.status(500).json({ error: 'Firebase not initialized' });
    }
    
    const doc = await db.collection(collection).doc(symbol).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Stock data not found' });
    }
    
    // Convert Firestore data to CSV
    const stockData = doc.data();
    const csvHeader = 'date,open,high,low,close,volume\n';
    const csvRows = stockData.data.map(row => 
      `${row.date},${row.open},${row.high},${row.low},${row.close},${row.volume}`
    ).join('\n');
    
    res.set('Content-Type', 'text/csv');
    res.send(csvHeader + csvRows);
  } catch (error) {
    console.error('Error fetching stock data as CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available stocks by index
app.get('/api/stocks/index/:indexName', async (req, res) => {
  try {
    const indexName = req.params.indexName;
    
    if (!db) {
      return res.status(500).json({ error: 'Firebase not initialized' });
    }
    
    const snapshot = await db.collection(indexName).get();
    const symbols = snapshot.docs.map(doc => doc.id);
    
    res.json({ index: indexName, symbols });
  } catch (error) {
    console.error('Error fetching index symbols:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a single stock
app.post('/api/update/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  const forceUpdate = req.body.forceUpdate === true;
  
  const options = {
    scriptPath: __dirname,
    args: [symbol]
  };
  
  if (forceUpdate) {
    options.args.push('--force');
  }
  
  PythonShell.run('fetch_stock_data.py', options)
    .then(results => {
      console.log('Python script results:', results);
      res.json({ success: true, message: `Stock ${symbol} updated successfully`, results });
    })
    .catch(err => {
      console.error('Error running Python script:', err);
      res.status(500).json({ error: err.message });
    });
});

// Update an entire index
app.post('/api/update/index/:indexName', (req, res) => {
  const indexName = req.params.indexName;
  const forceUpdate = req.body.forceUpdate === true;
  
  const options = {
    scriptPath: __dirname,
    args: [indexName]
  };
  
  if (forceUpdate) {
    options.args.push('--force');
  }
  
  PythonShell.run('batch_processor.py', options)
    .then(results => {
      console.log('Batch process results:', results);
      res.json({ success: true, message: `Index ${indexName} updated successfully`, results });
    })
    .catch(err => {
      console.error('Error running batch process:', err);
      res.status(500).json({ error: err.message });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
