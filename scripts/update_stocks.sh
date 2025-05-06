#!/bin/bash
# update_stocks.sh - Updates stock data for selected indices

# Set working directory to script location
cd "$(dirname "$0")/.."
BASE_DIR="$(pwd)"

# Activate virtual environment
VENV_DIR="$BASE_DIR/python/venv"
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Check if index is provided
if [ "$1" ]; then
    INDEX="$1"
    FORCE=""
    
    # Check if force flag is provided
    if [ "$2" = "force" ]; then
        FORCE="force"
    fi
    
    echo "Updating stock data for $INDEX..."
    python "$BASE_DIR/python/batch_processor.py" "$INDEX" "$FORCE"
else
    echo "Updating stock data for all indices..."
    python "$BASE_DIR/python/batch_processor.py"
fi

echo "Stock data update completed at $(date)"
