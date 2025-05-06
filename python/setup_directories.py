#!/usr/bin/env python3
import os
import json

def setup_directory_structure():
    """Create all necessary directories and files for the Stock Data Retrieval system."""
    # Base paths
    base_dir = "/Users/DSJP/Desktop/CODE/BT"
    data_dir = os.path.join(base_dir, "DATA")
    
    print("Setting up directory structure for Stock Data Retrieval...")
    
    # Create DATA subdirectories
    for folder in ["nifty50", "niftyNext50", "niftyMidcap150", "ftse100", "ftse250", "us_stocks"]:
        folder_path = os.path.join(data_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        print(f"✓ Created directory: {folder_path}")
    
    # Create logs directory
    logs_dir = os.path.join(base_dir, "python", "logs")
    os.makedirs(logs_dir, exist_ok=True)
    print(f"✓ Created logs directory: {logs_dir}")
    
    # Create scripts directory if it doesn't exist
    scripts_dir = os.path.join(base_dir, "scripts")
    os.makedirs(scripts_dir, exist_ok=True)
    print(f"✓ Created scripts directory: {scripts_dir}")
    
    # Create empty metadata.json file
    metadata_path = os.path.join(data_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump({"symbols": {}}, f, indent=2)
    print(f"✓ Created metadata file: {metadata_path}")
    
    print("\nDirectory structure setup complete!")
    
    # Return paths for reference
    return {
        "base_dir": base_dir,
        "data_dir": data_dir,
        "logs_dir": logs_dir,
        "scripts_dir": scripts_dir,
        "metadata_path": metadata_path
    }

if __name__ == "__main__":
    setup_directory_structure()
