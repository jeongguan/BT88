/**
 * Firebase configuration for the BT88 application
 * This file initializes Firebase services for the frontend
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (only if not already initialized)
if (!window.firebase) {
  console.warn('Firebase SDK not loaded. Make sure to include the Firebase SDK in your HTML.');
} else {
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    console.log('Firebase already initialized');
  }
}

// Add a function to update the API URL based on environment
function setupAPIEnvironment() {
  // Check for environment - production vs development
  const isProduction = window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('127.0.0.1');
  
  // Update API base URL based on environment
  if (typeof DTIAPI !== 'undefined') {
    if (isProduction) {
      // Production API URL - update this with your Render.com URL
      DTIAPI.setBaseUrl('https://bt88-backend.onrender.com/api');
    } else {
      // Development API URL - local server
      DTIAPI.setBaseUrl('http://localhost:3000/api');
    }
    
    console.log('API environment configured:', isProduction ? 'Production' : 'Development');
  } else {
    console.warn('DTIAPI not available. Make sure to load dti-api.js before firebase-config.js');
  }
}

// Set up environment when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAPIEnvironment);
} else {
  // DOM already loaded, run setup immediately
  setupAPIEnvironment();
}
