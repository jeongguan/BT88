#!/bin/bash

# BT88 Deployment Script
# This script automates the deployment process for BT88 to Firebase and Render.com

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   BT88 Deployment Script   ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"
MISSING_PREREQS=false

if ! command_exists node; then
  echo -e "${RED}✗ Node.js is not installed. Please install Node.js v14 or higher.${NC}"
  MISSING_PREREQS=true
else
  NODE_VERSION=$(node -v | cut -d 'v' -f 2)
  echo -e "${GREEN}✓ Node.js ${NODE_VERSION} is installed.${NC}"
fi

if ! command_exists npm; then
  echo -e "${RED}✗ npm is not installed. Please install npm.${NC}"
  MISSING_PREREQS=true
else
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓ npm ${NPM_VERSION} is installed.${NC}"
fi

if ! command_exists python3; then
  echo -e "${RED}✗ Python 3 is not installed. Please install Python 3.7 or higher.${NC}"
  MISSING_PREREQS=true
else
  PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
  echo -e "${GREEN}✓ Python ${PYTHON_VERSION} is installed.${NC}"
fi

if ! command_exists pip3; then
  echo -e "${RED}✗ pip3 is not installed. Please install pip3.${NC}"
  MISSING_PREREQS=true
else
  PIP_VERSION=$(pip3 --version | awk '{print $2}')
  echo -e "${GREEN}✓ pip ${PIP_VERSION} is installed.${NC}"
fi

if ! command_exists firebase; then
  echo -e "${RED}✗ Firebase CLI is not installed. Please install it using 'npm install -g firebase-tools'.${NC}"
  MISSING_PREREQS=true
else
  FIREBASE_VERSION=$(firebase --version)
  echo -e "${GREEN}✓ Firebase CLI ${FIREBASE_VERSION} is installed.${NC}"
fi

if [ "$MISSING_PREREQS" = true ]; then
  echo -e "\n${RED}Please install the missing prerequisites and try again.${NC}"
  exit 1
fi

# Check for Firebase service account key
if [ ! -f "./backend/serviceAccountKey.json" ]; then
  echo -e "\n${RED}Firebase service account key not found.${NC}"
  echo -e "${YELLOW}Please place your serviceAccountKey.json file in the 'backend' directory.${NC}"
  
  read -p "Do you want to continue without the service account key? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment canceled. Please add the service account key and try again.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Firebase service account key found.${NC}"
fi

# Ask whether to deploy backend, frontend, or both
echo -e "\n${YELLOW}What would you like to deploy?${NC}"
echo "1) Backend to Render.com"
echo "2) Frontend to Firebase"
echo "3) Both"
read -p "Enter your choice (1-3): " deploy_choice

# Install dependencies
install_backend_deps() {
  echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
  cd backend || { echo -e "${RED}Backend directory not found!${NC}"; exit 1; }
  npm install
  pip3 install -r requirements.txt
  cd ..
  echo -e "${GREEN}✓ Backend dependencies installed.${NC}"
}

# Deploy backend to Render.com (manual instructions since Render doesn't have a CLI)
deploy_backend() {
  echo -e "\n${YELLOW}Preparing backend deployment...${NC}"
  
  echo -e "\n${BLUE}Manual steps for Render.com deployment:${NC}"
  echo -e "1. Go to ${BLUE}https://dashboard.render.com/${NC} and sign in."
  echo -e "2. Click 'New Web Service' and connect your GitHub repository."
  echo -e "3. Configure the service with these settings:"
  echo -e "   - Name: ${BLUE}bt88-backend${NC}"
  echo -e "   - Root Directory: ${BLUE}backend${NC}"
  echo -e "   - Build Command: ${BLUE}npm install && pip install -r requirements.txt${NC}"
  echo -e "   - Start Command: ${BLUE}node server.js${NC}"
  echo -e "4. Set environment variables:"
  echo -e "   - ${BLUE}NODE_ENV: production${NC}"
  echo -e "5. Add the Secret File for serviceAccountKey.json"
  
  read -p "Press Enter once you've deployed the backend on Render.com, or type 'skip' to continue: " backend_status
  
  if [ "$backend_status" != "skip" ]; then
    read -p "Enter the deployed backend URL (e.g., https://bt88-backend.onrender.com): " backend_url
    
    # Update Firebase configuration with the correct API URL
    if [ -n "$backend_url" ]; then
      echo -e "\n${YELLOW}Updating frontend configuration with backend URL...${NC}"
      # Use sed to replace the API URL in firebase-config.js
      sed -i '' "s|https://bt88-backend.onrender.com|$backend_url|g" ./public/js/firebase-config.js || {
        echo -e "${RED}Failed to update API URL in firebase-config.js${NC}"
        echo -e "${YELLOW}Please manually update the API URL in public/js/firebase-config.js${NC}"
      }
      echo -e "${GREEN}✓ API URL updated in frontend configuration.${NC}"
    else
      echo -e "${YELLOW}No backend URL provided. You may need to manually update the API URL in public/js/firebase-config.js${NC}"
    fi
  fi
}

# Deploy frontend to Firebase
deploy_frontend() {
  echo -e "\n${YELLOW}Deploying frontend to Firebase...${NC}"
  
  # Check if Firebase project is initialized
  if [ ! -f "./firebase.json" ]; then
    echo -e "${YELLOW}Firebase project not initialized. Initializing now...${NC}"
    firebase login
    firebase init hosting
  fi
  
  # Deploy to Firebase
  firebase deploy --only hosting
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend deployed successfully to Firebase.${NC}"
  else
    echo -e "${RED}✗ Frontend deployment failed. Please check the error messages above.${NC}"
  fi
}

# Execute deployment based on user choice
case $deploy_choice in
  1)
    install_backend_deps
    deploy_backend
    ;;
  2)
    deploy_frontend
    ;;
  3)
    install_backend_deps
    deploy_backend
    deploy_frontend
    ;;
  *)
    echo -e "${RED}Invalid choice. Deployment canceled.${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment process completed!   ${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Test your deployed application"
echo -e "2. Verify data is being correctly stored in Firestore"
echo -e "3. Check that stock data can be fetched from the backend API"
echo -e "\n${BLUE}For more information, refer to the README.md file.${NC}"
