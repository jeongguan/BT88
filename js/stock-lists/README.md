# DTI Backtester - Stock Lists

This directory contains the stock list data in JSON format for the DTI Backtester application.

## Overview

The stock lists were previously hardcoded in the JavaScript file. This new structure separates the data from the code, providing multiple benefits:

1. **Improved Performance**: Stock lists can be loaded asynchronously when needed.
2. **Better Maintainability**: Lists can be updated without modifying the core application code.
3. **Scalability**: The system can handle much larger stock lists without performance degradation.
4. **Caching**: Browser can cache the stock list files for faster loading.

## File Structure

- `registry.json` - Contains metadata about all available stock lists
- `nifty50.json` - Stocks in the Nifty 50 index (India)
- `niftyNext50.json` - Stocks in the Nifty Next 50 index (India)
- `niftyMidcap150.json` - Stocks in the Nifty Midcap 150 index (India)
- `ftse100.json` - Stocks in the FTSE 100 index (UK)
- `ftse250.json` - Stocks in the FTSE 250 index (UK)
- `usMidCap.json` - US Mid Cap stocks
- `usSmallCap.json` - US Small Cap stocks
- `usStocks.json` - General US stocks
- `indices.json` - Various market indices

## Stock List Format

Each stock list is an array of objects with the following structure:

```json
[
  {
    "name": "Stock Name",
    "symbol": "STOCK.SYMBOL"
  },
  ...
]
```

- `name`: Display name of the stock
- `symbol`: Trading symbol used to fetch data from Yahoo Finance
  - Indian stocks use the `.NS` suffix (NSE)
  - UK stocks use the `.L` suffix (London)
  - US stocks have no suffix
  - Indices like S&P 500 use `^GSPC` format

## How to Update Stock Lists

### Adding Stocks to an Existing List

1. Open the appropriate JSON file (e.g., `nifty50.json` for Nifty 50 stocks)
2. Add new stock entries to the array
3. Ensure the JSON is valid (no trailing commas, proper quotes, etc.)
4. Save the file

Example:

```json
[
  { "name": "Existing Stock", "symbol": "EXISTING.NS" },
  { "name": "New Stock", "symbol": "NEW.NS" }
]
```

### Adding a New Stock List

1. Create a new JSON file in this directory (e.g., `newList.json`)
2. Populate it with stock data in the same format as existing files
3. Update the `registry.json` file to include the new list:

```json
{
  "lists": [
    ...,
    {
      "id": "newListId",
      "name": "New List Display Name",
      "region": "Region Name",
      "file": "newList.json"
    }
  ]
}
```

4. If needed, update the UI to include the new list in dropdowns/selectors

## Performance Considerations

- Keep JSON files properly formatted with minimal whitespace
- Consider splitting very large lists (1000+ stocks) into multiple files
- The application implements caching to avoid loading the same list multiple times

## Troubleshooting

If you encounter issues with the stock lists:

1. Check browser console for error messages
2. Verify that all JSON files are properly formatted
3. Clear browser cache to ensure the latest files are loaded
4. Check that `registry.json` is correctly referencing all list files
