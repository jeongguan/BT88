# BT88 Trading Application

A web application for backtesting trading strategies using the Directional Trend Index (DTI) indicator on historical stock data. The application now uses Firebase for frontend hosting and Render.com for the backend API.

## Project Structure

```
BT88/
├── backend/                       # Backend Node.js + Python server
│   ├── firebase_utils.py          # Firebase Firestore utilities
│   ├── fetch_stock_data.py        # Stock data fetching scripts
│   ├── batch_processor.py         # Batch processing utilities
│   ├── requirements.txt           # Python dependencies
│   ├── package.json               # Node.js dependencies
│   ├── server.js                  # Express API server
│   └── serviceAccountKey.json     # Firebase service account (not committed)
│
├── public/                        # Frontend files for Firebase hosting
│   ├── index.html                 # Main application HTML
│   ├── styles.css                 # CSS styles
│   ├── js/                        # JavaScript files
│   │   ├── dti-api.js             # API client for backend
│   │   ├── dti-data.js            # Data handling (modified for API)
│   │   ├── firebase-config.js     # Firebase configuration
│   │   └── ... (other JS files)   # Additional scripts
│
├── firebase.json                  # Firebase configuration
├── render.yaml                    # Render.com deployment configuration
└── .gitignore                     # Git ignore file
```

## Prerequisites

1. Node.js (v14+) and npm
2. Python 3.7+ with pip
3. Firebase account
4. Render.com account
5. Git

## Setup Instructions

### 1. Firebase Setup

1. **Create a Firebase project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup instructions
   - Enable Firestore database in your project

2. **Set up Firebase Authentication** (optional):
   - Go to Authentication > Get Started
   - Enable Email/Password sign-in method

3. **Generate a Firebase Service Account key**:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `backend/serviceAccountKey.json`

### 2. Backend Setup (Local Development)

1. **Install Node.js dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the backend server**:
   ```bash
   node server.js
   ```
   The server will run on http://localhost:3000 by default.

### 3. Frontend Setup (Local Development)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase hosting**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Specify `public` as your public directory
   - Configure as a single-page app: Yes
   - Set up automatic builds and deploys: No

4. **Test locally**:
   ```bash
   firebase serve
   ```
   The frontend will be available at http://localhost:5000

### 4. Deployment

#### Backend Deployment (Render.com)

1. **Create a new Web Service on Render.com**:
   - Sign up/login to [Render.com](https://render.com/)
   - Go to Dashboard > New > Web Service
   - Connect your GitHub repository
   - Set the Root Directory to `backend`
   - Set the Build Command: `npm install && pip install -r requirements.txt`
   - Set the Start Command: `node server.js`
   - Add environment variables:
     - `NODE_ENV`: `production`

2. **Add Firebase Service Account to Render.com**:
   - Create a secret file for `serviceAccountKey.json`
   - Add the content of your Firebase Service Account JSON

#### Frontend Deployment (Firebase)

1. **Update API URL**:
   - Edit `public/js/firebase-config.js` and update the production API URL with your Render.com endpoint.

2. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## Using the Application

1. **Stock Data Management**:
   - The application now fetches stock data via the backend API
   - Stock data is stored in Firestore collections based on index (nifty50, ftse100, us_stocks)
   - Data is fetched from Yahoo Finance and cached in Firestore

2. **Backtesting**:
   - Upload CSV files or use pre-loaded stock data
   - Adjust DTI parameters (r, s, u)
   - Set trading rules (entry threshold, take profit, stop loss, max days)
   - Run backtest to see performance metrics and trade details

3. **Active Trading Opportunities**:
   - Scan stock indices for current trading opportunities
   - View and manage active trades

## Troubleshooting

1. **Firebase Deployment Issues**:
   - Check Firebase console for error messages
   - Verify that `firebase.json` is correctly set up
   - Confirm you have the correct permissions for the project

2. **Backend API Connection Issues**:
   - Verify the API URL in `firebase-config.js`
   - Check CORS settings in the backend
   - Inspect the browser console for network errors

3. **Data Loading Issues**:
   - Check browser console for API errors
   - Verify Firestore rules allow read/write access
   - Confirm that the Firebase service account has proper permissions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
