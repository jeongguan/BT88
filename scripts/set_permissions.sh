#!/bin/bash
# set_permissions.sh - Makes the scripts executable

# Set working directory to script location
cd "$(dirname "$0")"
SCRIPTS_DIR="$(pwd)"

# Make scripts executable
echo "Setting executable permissions on scripts..."
chmod +x "$SCRIPTS_DIR/setup.sh"
chmod +x "$SCRIPTS_DIR/update_stocks.sh"
chmod +x "$SCRIPTS_DIR/set_permissions.sh"

echo "Permissions set successfully!"
