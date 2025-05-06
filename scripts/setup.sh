#!/bin/bash
# setup.sh - Sets up the environment for the Stock Data Retrieval system

# Set working directory to script location
cd "$(dirname "$0")/.."
BASE_DIR="$(pwd)"

echo "Setting up Stock Data Retrieval system..."

# Create necessary directories
echo "Creating directories..."
mkdir -p $BASE_DIR/DATA/nifty50
mkdir -p $BASE_DIR/DATA/niftyNext50
mkdir -p $BASE_DIR/DATA/niftyMidcap150
mkdir -p $BASE_DIR/DATA/ftse100
mkdir -p $BASE_DIR/DATA/ftse250
mkdir -p $BASE_DIR/DATA/us_stocks
mkdir -p $BASE_DIR/python/logs

# Create empty metadata file
echo "{\"symbols\": {}}" > $BASE_DIR/DATA/metadata.json

# Ensure virtual environment exists
VENV_DIR="$BASE_DIR/python/venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment and install dependencies
echo "Activating virtual environment and installing dependencies..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$BASE_DIR/python/requirements.txt"

# Set execute permissions on scripts
chmod +x $BASE_DIR/scripts/update_stocks.sh

# Replace dti-data.js with the fixed version
if [ -f "$BASE_DIR/js/dti-data-fixed.js" ]; then
    echo "Backing up original dti-data.js..."
    cp $BASE_DIR/js/dti-data.js $BASE_DIR/js/dti-data.js.bak
    
    echo "Installing fixed dti-data.js file..."
    cp $BASE_DIR/js/dti-data-fixed.js $BASE_DIR/js/dti-data.js
fi

echo "Setup completed successfully!"
