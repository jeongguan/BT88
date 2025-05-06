/**
 * DTI Backtester - Enhanced Trade UI Module
 * Handles trade management UI rendering, visualizations, and user interactions
 * Added: Import/Export UI functionality for all trades
 */

// Create TradeUI module
const TradeUI = (function() {
    // Private variables for charts and visualizations
    let equityChart = null;
    let drawdownChart = null;
    let plDistributionChart = null;
    let winLossPieChart = null;
    let monthlyPerformanceChart = null;
    let marketComparisonChart = null;
    let sizeVsReturnChart = null;
    let holdingTimeChart = null;
    let calendarHeatmap = null;

    /**
     * Initialize the trade UI
     */
    function init() {
        console.log("TradeUI initializing...");
        
        // Only initialize if we're on the trades page
        if (!isTradesPage()) {
            console.log("Not on trades page - skipping UI initialization");
            return;
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Render initial UI
        renderTrades();
        updateStatistics();
        
        // Initialize new analytics components
        initializeAnalytics();
        
        // Add page load animations
        addPageLoadAnimations();
        
        // Initialize import/export components
        initializeImportExportUI();
        
        console.log("TradeUI initialized successfully");
    }
    
    /**
     * Check if current page is the trades page
     * @returns {boolean} - True if on trades page
     */
    function isTradesPage() {
        return document.getElementById('active-trades-container') !== null;
    }
    
    /**
     * Initialize analytics UI components
     */
    function initializeAnalytics() {
        renderEquityCurve();
        renderDrawdownChart();
        renderPLDistribution();
        renderWinLossPieChart();
        renderMonthlyPerformance();
        renderMarketComparison();
        renderTradeSizeVsReturn();
        renderHoldingPeriodAnalysis();
        renderAdvancedMetricsCards();
        initializeCalendarHeatmap();
    }
    
    /**
     * Set up event listeners for the UI
     */
    function setupEventListeners() {
        // Setup tab switching for trade history
        setupTabSwitching();
        
        // Close Trade Dialog
        setupCloseTradeDialog();
        
        // Edit Trade Dialog
        setupEditTradeDialog();
        
        // Delete Trade Dialog
        setupDeleteTradeDialog();
        
        // Clear History Dialog
        setupClearHistoryDialog();
        
        // Export History Button
        setupExportButton();
        
        // Setup import/export functionality
        setupImportExportEvents();
        
        // Listen for trade events from TradeCore
        setupTradeEventListeners();
        
        // Analytics time period switcher
        setupAnalyticsTimeFilter();
        
        // Setup tabs for analytics
        setupAnalyticsTabs();
    }
    
    /**
     * Setup analytics time period filter
     */
    function setupAnalyticsTimeFilter() {
        const timeFilterSelect = document.getElementById('analytics-time-filter');
        if (timeFilterSelect) {
            timeFilterSelect.addEventListener('change', function() {
                // Refresh all charts with the new time period
                refreshAllCharts();
            });
        }
    }
    
    /**
     * Setup tabs for analytics
     */
    function setupAnalyticsTabs() {
        const tabs = document.querySelectorAll('.analytics-tab');
        const tabContents = document.querySelectorAll('.analytics-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show the selected tab content
                const tabId = this.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                    
                    // Trigger resize event to fix Chart.js responsive issues
                    window.dispatchEvent(new Event('resize'));
                }
            });
        });
    }
    
    /**
     * Refresh all charts and visualizations
     */
    function refreshAllCharts() {
        renderEquityCurve();
        renderDrawdownChart();
        renderPLDistribution();
        renderWinLossPieChart();
        renderMonthlyPerformance();
        renderMarketComparison();
        renderTradeSizeVsReturn();
        renderHoldingPeriodAnalysis();
        renderAdvancedMetricsCards();
        // Calendar heatmap is refreshed based on year selection
    }
    
    /**
     * Setup tab switching for trade history
     */
    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.trade-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show the selected tab content
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    /**
     * Setup close trade dialog
     */
    function setupCloseTradeDialog() {
        const dialog = document.getElementById('close-trade-dialog');
        if (!dialog) return;
        
        // Setup close button
        const closeBtn = document.getElementById('close-dialog-x');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('close-dialog-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup confirm button
        const confirmBtn = document.getElementById('close-dialog-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                handleTradeClose();
            });
        }
        
        // Close on background click
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                dialog.classList.remove('active');
            }
        });
        
        // Add escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dialog.classList.contains('active')) {
                dialog.classList.remove('active');
            }
        });
    }
    
    /**
     * Setup edit trade dialog
     */
    function setupEditTradeDialog() {
        const dialog = document.getElementById('edit-trade-dialog');
        if (!dialog) {
            console.log("Edit trade dialog not found, will be created dynamically");
            createEditTradeDialog();
            return;
        }
        
        // Setup close button
        const closeBtn = document.getElementById('edit-dialog-x');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('edit-dialog-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup confirm button
        const confirmBtn = document.getElementById('edit-dialog-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                handleTradeEdit();
            });
        }
        
        // Close on background click
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                dialog.classList.remove('active');
            }
        });
        
        // Add escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dialog.classList.contains('active')) {
                dialog.classList.remove('active');
            }
        });
    }
    
    /**
     * Create edit trade dialog dynamically if it doesn't exist in the HTML
     */
    function createEditTradeDialog() {
        const dialogOverlay = document.createElement('div');
        dialogOverlay.id = 'edit-trade-dialog';
        dialogOverlay.className = 'dialog-overlay';
        
        dialogOverlay.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3 class="dialog-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit Trade
                    </h3>
                    <button class="dialog-close" id="edit-dialog-x" aria-label="Close dialog">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="trade-info">
                        <h4 id="edit-stock-name">Stock Name</h4>
                        <div class="trade-details">
                            <div class="detail-row">
                                <span class="detail-label">Entry Date:</span>
                                <span id="edit-entry-date" class="detail-value">-</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Current P/L:</span>
                                <span id="edit-current-pl" class="detail-value">-</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="parameter-group">
                        <label for="edit-entry-price-input">Entry Price</label>
                        <input type="number" id="edit-entry-price-input" step="0.01" min="0">
                        <span class="form-hint" id="edit-entry-price-hint">Current: -</span>
                    </div>
                    
                    <div class="parameter-group">
                        <label for="edit-stop-loss">Stop Loss Price</label>
                        <input type="number" id="edit-stop-loss" step="0.01" min="0">
                        <span class="form-hint" id="edit-stop-loss-hint">Current: -</span>
                    </div>
                    
                    <div class="parameter-group">
                        <label for="edit-target">Target Price</label>
                        <input type="number" id="edit-target" step="0.01" min="0">
                        <span class="form-hint" id="edit-target-hint">Current: -</span>
                    </div>
                    
                    <div class="parameter-group">
                        <label for="edit-square-off-date">Square Off Date</label>
                        <input type="date" id="edit-square-off-date">
                        <span class="form-hint" id="edit-square-off-hint">Current: -</span>
                    </div>
                    
                    <div class="parameter-group">
                        <label for="edit-notes">Notes (Optional)</label>
                        <textarea id="edit-notes" rows="3" placeholder="Add any notes or observations about this trade"></textarea>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button id="edit-dialog-cancel" class="btn-secondary">Cancel</button>
                    <button id="edit-dialog-confirm" class="btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Save Changes
                    </button>
                </div>
            </div>
        `;
        
        // Append to the body
        document.body.appendChild(dialogOverlay);
        
        // Set up event listeners
        setupEditTradeDialog();
    }
    
    /**
     * Setup delete trade dialog
     */
    function setupDeleteTradeDialog() {
        const dialog = document.getElementById('delete-trade-dialog');
        if (!dialog) {
            console.log("Delete trade dialog not found, will be created dynamically");
            createDeleteTradeDialog();
            return;
        }
        
        // Setup close button
        const closeBtn = document.getElementById('delete-dialog-x');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('delete-dialog-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup confirm button
        const confirmBtn = document.getElementById('delete-dialog-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                handleTradeDelete();
            });
        }
        
        // Close on background click
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                dialog.classList.remove('active');
            }
        });
        
        // Add escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dialog.classList.contains('active')) {
                dialog.classList.remove('active');
            }
        });
    }
    
    /**
     * Create delete trade dialog dynamically if it doesn't exist in the HTML
     */
    function createDeleteTradeDialog() {
        const dialogOverlay = document.createElement('div');
        dialogOverlay.id = 'delete-trade-dialog';
        dialogOverlay.className = 'dialog-overlay';
        
        dialogOverlay.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3 class="dialog-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete Trade
                    </h3>
                    <button class="dialog-close" id="delete-dialog-x" aria-label="Close dialog">&times;</button>
                </div>
                <div class="dialog-body">
                    <p>Are you sure you want to delete this trade? This action cannot be undone.</p>
                    <div id="delete-trade-info" class="trade-info">
                        <div class="detail-row">
                            <span class="detail-label">Stock:</span>
                            <span id="delete-stock-name" class="detail-value">-</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Entry Date:</span>
                            <span id="delete-entry-date" class="detail-value">-</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Investment:</span>
                            <span id="delete-investment" class="detail-value">-</span>
                        </div>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button id="delete-dialog-cancel" class="btn-secondary">Cancel</button>
                    <button id="delete-dialog-confirm" class="btn-danger">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete Trade
                    </button>
                </div>
            </div>
        `;
        
        // Append to the body
        document.body.appendChild(dialogOverlay);
        
        // Set up event listeners
        setupDeleteTradeDialog();
    }
    
    /**
     * Setup clear history dialog
     */
    function setupClearHistoryDialog() {
        const dialog = document.getElementById('clear-history-dialog');
        if (!dialog) return;
        
        // Setup close button
        const closeBtn = document.getElementById('clear-dialog-x');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('clear-dialog-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
            });
        }
        
        // Setup confirm button
        const confirmBtn = document.getElementById('clear-dialog-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                // Set loading state
                this.disabled = true;
                this.innerHTML = `
                    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                    Clearing History...
                `;
                
                // Small delay for better UX
                setTimeout(() => {
                    TradeCore.clearTradeHistory();
                    dialog.classList.remove('active');
                    
                    // Reset button state
                    this.disabled = false;
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete All History
                    `;
                }, 500);
            });
        }
        
        // Setup trigger button
        const clearHistoryBtn = document.getElementById('btn-clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', function() {
                dialog.classList.add('active');
            });
        }
        
        // Close on background click
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                dialog.classList.remove('active');
            }
        });
        
        // Add escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dialog.classList.contains('active')) {
                dialog.classList.remove('active');
            }
        });
    }
    
    /**
     * Initialize import/export UI components
     */
    function initializeImportExportUI() {
        // Create import dialog if it doesn't exist
        createImportTradesDialog();
        
        // Ensure necessary buttons exist in the trade actions section
        addImportExportButtons();
    }
    
    /**
     * Add import/export buttons to the UI if they don't exist
     */
    function addImportExportButtons() {
        const tradeActions = document.querySelector('.trade-actions');
        
        if (tradeActions) {
            // Check if import button already exists
            if (!document.getElementById('btn-import-trades')) {
                const importButton = document.createElement('button');
                importButton.id = 'btn-import-trades';
                importButton.className = 'btn-primary';
                importButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Import Trades
                `;
                
                // Insert import button after export button
                tradeActions.insertBefore(importButton, document.getElementById('btn-clear-history'));
            }
            
            // Check if export all button already exists
            if (!document.getElementById('btn-export-all-trades')) {
                const exportAllButton = document.createElement('button');
                exportAllButton.id = 'btn-export-all-trades';
                exportAllButton.className = 'btn-secondary';
                exportAllButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export All Trades
                `;
                
                // Insert export all button before export history button
                const exportHistoryBtn = document.getElementById('btn-export-history');
                if (exportHistoryBtn) {
                    tradeActions.insertBefore(exportAllButton, exportHistoryBtn);
                } else {
                    // Fallback - add as first button
                    tradeActions.insertBefore(exportAllButton, tradeActions.firstChild);
                }
            }
        }
    }
    
    /**
     * Create import trades dialog
     */
    function createImportTradesDialog() {
        // Check if dialog already exists
        if (document.getElementById('import-trades-dialog')) return;
        
        const dialogOverlay = document.createElement('div');
        dialogOverlay.id = 'import-trades-dialog';
        dialogOverlay.className = 'dialog-overlay';
        
        dialogOverlay.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3 class="dialog-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Import Trades
                    </h3>
                    <button class="dialog-close" id="import-dialog-x" aria-label="Close dialog">&times;</button>
                </div>
                <div class="dialog-body">
                    <p>Import trades from a JSON file. This will allow you to restore your trades if you clear your browser data.</p>
                    
                    <div class="file-upload-container">
                        <label for="import-file-input" class="file-upload-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <span>Choose File</span>
                        </label>
                        <input type="file" id="import-file-input" accept=".json" style="display: none;">
                        <span id="selected-filename">No file selected</span>
                    </div>
                    
                    <div id="import-preview" class="import-preview" style="display: none;">
                        <h4>File Preview</h4>
                        <div class="preview-stats">
                            <div class="preview-stat">
                                <span class="preview-label">Total Trades:</span>
                                <span id="preview-total" class="preview-value">0</span>
                            </div>
                            <div class="preview-stat">
                                <span class="preview-label">Active Trades:</span>
                                <span id="preview-active" class="preview-value">0</span>
                            </div>
                            <div class="preview-stat">
                                <span class="preview-label">Closed Trades:</span>
                                <span id="preview-closed" class="preview-value">0</span>
                            </div>
                            <div class="preview-stat">
                                <span class="preview-label">Export Date:</span>
                                <span id="preview-date" class="preview-value">-</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="import-options">
                        <h4>Import Options</h4>
                        <div class="radio-option">
                            <input type="radio" id="import-mode-merge" name="import-mode" value="merge" checked>
                            <label for="import-mode-merge">Merge with existing trades (update existing, add new)</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" id="import-mode-add" name="import-mode" value="add">
                            <label for="import-mode-add">Add all as new trades (avoids conflicts)</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" id="import-mode-replace" name="import-mode" value="replace">
                            <label for="import-mode-replace">Replace all trades</label>
                        </div>
                        <div class="checkbox-option" id="keep-active-container" style="margin-left: 25px; margin-top: 8px;">
                            <input type="checkbox" id="keep-active-trades" name="keep-active-trades" checked>
                            <label for="keep-active-trades">Keep current active trades</label>
                        </div>
                    </div>
                    
                    <div id="import-status" class="import-status" style="display: none;">
                        <div class="status-message" id="import-status-message"></div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="import-progress"></div>
                        </div>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button id="import-dialog-cancel" class="btn-secondary">Cancel</button>
                    <button id="import-dialog-confirm" class="btn-primary" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Import Trades
                    </button>
                </div>
            </div>
        `;
        
        // Append to the body
        document.body.appendChild(dialogOverlay);
        
        // Set up dialog event listeners
        setupImportDialog();
    }
    
    /**
     * Setup import dialog event listeners
     */
    function setupImportDialog() {
        const dialog = document.getElementById('import-trades-dialog');
        if (!dialog) return;
        
        const fileInput = document.getElementById('import-file-input');
        const selectedFilename = document.getElementById('selected-filename');
        const importPreview = document.getElementById('import-preview');
        const confirmBtn = document.getElementById('import-dialog-confirm');
        const keepActiveContainer = document.getElementById('keep-active-container');
        
        // Setup file input change event
        if (fileInput) {
            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (!file) {
                    selectedFilename.textContent = 'No file selected';
                    importPreview.style.display = 'none';
                    confirmBtn.disabled = true;
                    return;
                }
                
                selectedFilename.textContent = file.name;
                
                // Parse and preview the file
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        
                        // Validate data format
                        if (!jsonData.metadata || !jsonData.trades || !Array.isArray(jsonData.trades)) {
                            throw new Error('Invalid file format');
                        }
                        
                        // Display preview
                        document.getElementById('preview-total').textContent = jsonData.trades.length;
                        document.getElementById('preview-active').textContent = jsonData.trades.filter(t => t.status === 'active').length;
                        document.getElementById('preview-closed').textContent = jsonData.trades.filter(t => t.status !== 'active').length;
                        
                        // Format date
                        const exportDate = new Date(jsonData.metadata.exportDate);
                        document.getElementById('preview-date').textContent = isNaN(exportDate) ? 
                            jsonData.metadata.exportDate : 
                            exportDate.toLocaleString();
                        
                        // Show preview and enable import button
                        importPreview.style.display = 'block';
                        confirmBtn.disabled = false;
                    } catch (error) {
                        console.error('Error parsing import file:', error);
                        selectedFilename.textContent = 'Error: Invalid JSON file format';
                        importPreview.style.display = 'none';
                        confirmBtn.disabled = true;
                    }
                };
                
                reader.readAsText(file);
            });
        }
        
        // Setup import mode change event
        const radioButtons = document.querySelectorAll('input[name="import-mode"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                // Only show keep active trades option for replace mode
                keepActiveContainer.style.display = this.value === 'replace' ? 'block' : 'none';
            });
        });
        
        // Setup close button
        const closeBtn = document.getElementById('import-dialog-x');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
                resetImportDialog();
            });
        }
        
        // Setup cancel button
        const cancelBtn = document.getElementById('import-dialog-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                dialog.classList.remove('active');
                resetImportDialog();
            });
        }
        
        // Setup confirm button
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                handleTradeImport();
            });
        }
        
        // Close on background click
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                dialog.classList.remove('active');
                resetImportDialog();
            }
        });
        
        // Add escape key handler
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dialog.classList.contains('active')) {
                dialog.classList.remove('active');
                resetImportDialog();
            }
        });
    }
    
    /**
     * Reset import dialog to initial state
     */
    function resetImportDialog() {
        const fileInput = document.getElementById('import-file-input');
        const selectedFilename = document.getElementById('selected-filename');
        const importPreview = document.getElementById('import-preview');
        const confirmBtn = document.getElementById('import-dialog-confirm');
        const importStatus = document.getElementById('import-status');
        const progress = document.getElementById('import-progress');
        
        // Reset file input
        if (fileInput) fileInput.value = '';
        
        // Reset text
        if (selectedFilename) selectedFilename.textContent = 'No file selected';
        
        // Hide preview and status
        if (importPreview) importPreview.style.display = 'none';
        if (importStatus) importStatus.style.display = 'none';
        
        // Reset progress
        if (progress) progress.style.width = '0%';
        
        // Disable import button
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Import Trades
            `;
        }
        
        // Set merge mode as default
        const mergeMode = document.getElementById('import-mode-merge');
        if (mergeMode) mergeMode.checked = true;
        
        // Hide keep active option by default
        const keepActiveContainer = document.getElementById('keep-active-container');
        if (keepActiveContainer) keepActiveContainer.style.display = 'none';
        
        // Check the keep active checkbox by default
        const keepActive = document.getElementById('keep-active-trades');
        if (keepActive) keepActive.checked = true;
    }
    
    /**
     * Handle trade import
     */
    function handleTradeImport() {
        const dialog = document.getElementById('import-trades-dialog');
        const fileInput = document.getElementById('import-file-input');
        const importStatus = document.getElementById('import-status');
        const statusMessage = document.getElementById('import-status-message');
        const progress = document.getElementById('import-progress');
        const confirmBtn = document.getElementById('import-dialog-confirm');
        
        // Get selected file
        const file = fileInput.files[0];
        if (!file) {
            TradeCore.showNotification('No file selected for import', 'error');
            return;
        }
        
        // Get import options
        const modeElement = document.querySelector('input[name="import-mode"]:checked');
        const keepActiveElement = document.getElementById('keep-active-trades');
        
        const mode = modeElement ? modeElement.value : 'merge';
        const keepActive = keepActiveElement ? keepActiveElement.checked : true;
        
        // Show import status
        importStatus.style.display = 'block';
        statusMessage.textContent = 'Reading import file...';
        progress.style.width = '10%';
        
        // Disable confirm button during import
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            Importing...
        `;
        
        // Read the file
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Update progress
                statusMessage.textContent = 'Validating import data...';
                progress.style.width = '30%';
                
                // Short delay to show progress
                setTimeout(() => {
                    try {
                        // Update progress
                        statusMessage.textContent = 'Importing trades...';
                        progress.style.width = '60%';
                        
                        // Import the trades
                        const results = TradeCore.importTradesFromJSON(jsonData, {
                            mode: mode,
                            keepActive: keepActive
                        });
                        
                        // Update progress to complete
                        statusMessage.textContent = 'Import completed successfully!';
                        progress.style.width = '100%';
                        
                        // Show result summary
                        setTimeout(() => {
                            if (results.error) {
                                statusMessage.textContent = `Error: ${results.error}`;
                                statusMessage.style.color = 'var(--danger-color)';
                            } else {
                                statusMessage.textContent = `Import complete: Added ${results.added}, Updated ${results.updated}`;
                                
                                // Close dialog after short delay
                                setTimeout(() => {
                                    dialog.classList.remove('active');
                                    resetImportDialog();
                                    
                                    // Refresh UI
                                    renderTrades();
                                    updateStatistics();
                                    refreshAllCharts();
                                }, 1500);
                            }
                        }, 500);
                    } catch (importError) {
                        console.error('Error during import:', importError);
                        statusMessage.textContent = `Error: ${importError.message}`;
                        statusMessage.style.color = 'var(--danger-color)';
                        progress.style.width = '100%';
                        progress.style.backgroundColor = 'var(--danger-color)';
                        
                        // Reset confirm button
                        confirmBtn.disabled = false;
                        confirmBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Retry Import
                        `;
                    }
                }, 300);
            } catch (parseError) {
                console.error('Error parsing import file:', parseError);
                statusMessage.textContent = 'Error: Invalid JSON file format';
                statusMessage.style.color = 'var(--danger-color)';
                progress.style.width = '100%';
                progress.style.backgroundColor = 'var(--danger-color)';
                
                // Reset confirm button
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Import Trades
                `;
            }
        };
        
        reader.onerror = function() {
            console.error('Error reading file');
            statusMessage.textContent = 'Error reading file';
            statusMessage.style.color = 'var(--danger-color)';
            progress.style.width = '100%';
            progress.style.backgroundColor = 'var(--danger-color)';
            
            // Reset confirm button
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Retry Import
            `;
        };
        
        reader.readAsText(file);
    }
    
    /**
     * Setup export button
     */
    function setupExportButton() {
        const exportBtn = document.getElementById('btn-export-history');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                // Check if we have trades to export
                const closedTrades = TradeCore.getTrades('closed');
                if (closedTrades.length === 0) {
                    TradeCore.showNotification('No trade history to export', 'info');
                    return;
                }
                
                // Show loading state
                this.disabled = true;
                this.innerHTML = `
                    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                    Generating CSV...
                `;
                
                // Small delay for better UX
                setTimeout(() => {
                    try {
                        // Generate CSV
                        const blob = TradeCore.exportTradeHistoryCSV();
                        
                        if (blob) {
                            // Create download link
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            
                            link.setAttribute('href', url);
                            link.setAttribute('download', `dti_trades_history_${TradeCore.formatDateForFilename(new Date())}.csv`);
                            link.style.visibility = 'hidden';
                            
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            TradeCore.showNotification(`Exported ${closedTrades.length} trade records successfully`, 'success');
                        }
                    } catch (error) {
                        console.error("Error exporting trade history:", error);
                        TradeCore.showNotification('Error exporting trade history: ' + error.message, 'error');
                    } finally {
                        // Reset button state
                        this.disabled = false;
                        this.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export Trade History
                        `;
                    }
                }, 500);
            });
        }
    }
    
    /**
     * Setup import/export events
     */
    function setupImportExportEvents() {
        // Setup export all trades button
        const exportAllBtn = document.getElementById('btn-export-all-trades');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', function() {
                handleExportAllTrades();
            });
        }
        
        // Setup import trades button
        const importBtn = document.getElementById('btn-import-trades');
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                openImportDialog();
            });
        }
    }
    
    /**
     * Handle export all trades
     */
    function handleExportAllTrades() {
        const exportBtn = document.getElementById('btn-export-all-trades');
        
        // Check if we have trades to export
        const allTrades = TradeCore.getTrades('all');
        if (allTrades.length === 0) {
            TradeCore.showNotification('No trades to export', 'info');
            return;
        }
        
        // Show loading state
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = `
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Exporting...
            `;
        }
        
        // Small delay for better UX
        setTimeout(() => {
            try {
                // Generate JSON
                const blob = TradeCore.exportAllTradesJSON();
                
                if (blob) {
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    
                    const activeTrades = TradeCore.getTrades('active').length;
                    const closedTrades = TradeCore.getTrades('closed').length;
                    
                    link.setAttribute('href', url);
                    link.setAttribute('download', `dti_all_trades_${TradeCore.formatDateForFilename(new Date())}.json`);
                    link.style.visibility = 'hidden';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    TradeCore.showNotification(`Exported ${allTrades.length} trades (${activeTrades} active, ${closedTrades} closed)`, 'success');
                }
            } catch (error) {
                console.error("Error exporting all trades:", error);
                TradeCore.showNotification('Error exporting trades: ' + error.message, 'error');
            } finally {
                // Reset button state
                if (exportBtn) {
                    exportBtn.disabled = false;
                    exportBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export All Trades
                    `;
                }
            }
        }, 500);
    }
    
    /**
     * Open import dialog
     */
    function openImportDialog() {
        const dialog = document.getElementById('import-trades-dialog');
        if (!dialog) {
            console.error("Import dialog not found");
            createImportTradesDialog();
            return openImportDialog(); // Retry after creation
        }
        
        // Reset dialog state
        resetImportDialog();
        
        // Show dialog
        dialog.classList.add('active');
    }
    
    /**
     * Listen for trade events from TradeCore
     */
    function setupTradeEventListeners() {
        // Listen for trade events from TradeCore
        document.addEventListener('tradeAdded', function(e) {
            console.log("Trade added event received:", e.detail);
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
        
        document.addEventListener('tradeClosed', function(e) {
            console.log("Trade closed event received:", e.detail);
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
        
        document.addEventListener('tradeEdited', function(e) {
            console.log("Trade edited event received:", e.detail);
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
        
        document.addEventListener('tradeDeleted', function(e) {
            console.log("Trade deleted event received:", e.detail);
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
        
        document.addEventListener('historyCleared', function() {
            console.log("History cleared event received");
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
        
        document.addEventListener('tradesUpdated', function() {
            console.log("Trades updated event received");
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
        
        // Listen for import event 
        document.addEventListener('tradesImported', function(e) {
            console.log("Trades imported event received:", e.detail);
            renderTrades();
            updateStatistics();
            refreshAllCharts();
        });
    }
    
    /**
     * Handle trade close action
     */
    function handleTradeClose() {
        const tradeId = TradeCore.getSelectedTradeId();
        if (!tradeId) {
            console.error("No trade selected for closing");
            return;
        }
        
        const exitPriceInput = document.getElementById('close-trade-price');
        const reasonSelect = document.getElementById('close-trade-reason');
        const notesInput = document.getElementById('close-trade-notes');
        const confirmButton = document.getElementById('close-dialog-confirm');
        
        if (!exitPriceInput || !reasonSelect) {
            console.error("Required close trade form elements not found");
            TradeCore.showNotification('Error: Could not find form elements', 'error');
            return;
        }
        
        const exitPrice = parseFloat(exitPriceInput.value);
        const reason = reasonSelect.value;
        const notes = notesInput ? notesInput.value : '';
        
        if (isNaN(exitPrice) || exitPrice <= 0) {
            // Add error styling
            exitPriceInput.classList.add('error');
            const formHint = exitPriceInput.nextElementSibling;
            if (formHint) {
                formHint.textContent = 'Please enter a valid exit price';
                formHint.classList.add('error-hint');
            } else {
                // Create a hint if it doesn't exist
                const hint = document.createElement('span');
                hint.className = 'form-hint error-hint';
                hint.textContent = 'Please enter a valid exit price';
                exitPriceInput.parentNode.insertBefore(hint, exitPriceInput.nextSibling);
            }
            return;
        }
        
        // Set loading state
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.innerHTML = `
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Closing Trade...
            `;
        }
        
        // Add a small delay for better UX
        setTimeout(() => {
            try {
                // Close the trade
                const success = TradeCore.closeTrade(tradeId, exitPrice, reason, notes);
                
                if (success) {
                    // Close dialog
                    const closeTradeDialog = document.getElementById('close-trade-dialog');
                    if (closeTradeDialog) {
                        closeTradeDialog.classList.remove('active');
                    }
                    
                    // Refresh all charts
                    refreshAllCharts();
                }
            } catch (error) {
                console.error("Error closing trade:", error);
                TradeCore.showNotification('Error closing trade: ' + error.message, 'error');
                
                // Reset button state
                if (confirmButton) {
                    confirmButton.disabled = false;
                    confirmButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"></path>
                            <path d="M3 15h10"></path>
                            <polyline points="17 8 22 12 17 16"></polyline>
                        </svg>
                        Close Trade
                    `;
                }
            }
        }, 500);
    }
    
    /**
     * Handle trade edit action
     */
    function handleTradeEdit() {
        const tradeId = TradeCore.getSelectedTradeId();
        if (!tradeId) {
            console.error("No trade selected for editing");
            return;
        }
        
        const entryPriceInput = document.getElementById('edit-entry-price-input');
        const stopLossInput = document.getElementById('edit-stop-loss');
        const targetInput = document.getElementById('edit-target');
        const squareOffDateInput = document.getElementById('edit-square-off-date');
        const notesInput = document.getElementById('edit-notes');
        const confirmButton = document.getElementById('edit-dialog-confirm');
        
        if (!entryPriceInput || !stopLossInput || !targetInput || !squareOffDateInput) {
            console.error("Required edit trade form elements not found");
            TradeCore.showNotification('Error: Could not find form elements', 'error');
            return;
        }
        
        const entryPrice = parseFloat(entryPriceInput.value);
        const stopLossPrice = parseFloat(stopLossInput.value);
        const targetPrice = parseFloat(targetInput.value);
        const squareOffDate = squareOffDateInput.value ? new Date(squareOffDateInput.value) : null;
        const notes = notesInput ? notesInput.value : '';
        
        // Validate inputs
        let isValid = true;
        
        if (isNaN(entryPrice) || entryPrice <= 0) {
            entryPriceInput.classList.add('error');
            document.getElementById('edit-entry-price-hint').classList.add('error-hint');
            document.getElementById('edit-entry-price-hint').textContent = 'Please enter a valid entry price';
            isValid = false;
        } else {
            entryPriceInput.classList.remove('error');
            document.getElementById('edit-entry-price-hint').classList.remove('error-hint');
        }
        
        if (isNaN(stopLossPrice) || stopLossPrice <= 0) {
            stopLossInput.classList.add('error');
            document.getElementById('edit-stop-loss-hint').classList.add('error-hint');
            document.getElementById('edit-stop-loss-hint').textContent = 'Please enter a valid stop loss price';
            isValid = false;
        } else {
            stopLossInput.classList.remove('error');
            document.getElementById('edit-stop-loss-hint').classList.remove('error-hint');
        }
        
        if (isNaN(targetPrice) || targetPrice <= 0) {
            targetInput.classList.add('error');
            document.getElementById('edit-target-hint').classList.add('error-hint');
            document.getElementById('edit-target-hint').textContent = 'Please enter a valid target price';
            isValid = false;
        } else {
            targetInput.classList.remove('error');
            document.getElementById('edit-target-hint').classList.remove('error-hint');
        }
        
        if (!squareOffDate || isNaN(squareOffDate.getTime())) {
            squareOffDateInput.classList.add('error');
            document.getElementById('edit-square-off-hint').classList.add('error-hint');
            document.getElementById('edit-square-off-hint').textContent = 'Please enter a valid date';
            isValid = false;
        } else {
            squareOffDateInput.classList.remove('error');
            document.getElementById('edit-square-off-hint').classList.remove('error-hint');
        }
        
        if (!isValid) {
            return;
        }
        
        // Set loading state
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.innerHTML = `
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Saving Changes...
            `;
        }
        
        // Prepare updated data
        const updatedData = {
            entryPrice: entryPrice,
            stopLossPrice: stopLossPrice,
            targetPrice: targetPrice,
            squareOffDate: squareOffDate,
            notes: notes
        };
        
        // Add a small delay for better UX
        setTimeout(() => {
            try {
                // Edit the trade
                const success = TradeCore.editTrade(tradeId, updatedData);
                
                if (success) {
                    // Close dialog
                    const editTradeDialog = document.getElementById('edit-trade-dialog');
                    if (editTradeDialog) {
                        editTradeDialog.classList.remove('active');
                    }
                    
                    // Refresh all charts
                    refreshAllCharts();
                }
            } catch (error) {
                console.error("Error editing trade:", error);
                TradeCore.showNotification('Error editing trade: ' + error.message, 'error');
                
                // Reset button state
                if (confirmButton) {
                    confirmButton.disabled = false;
                    confirmButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Save Changes
                    `;
                }
            }
        }, 500);
    }
    
    /**
     * Handle trade delete action
     */
    function handleTradeDelete() {
        const tradeId = TradeCore.getSelectedTradeId();
        if (!tradeId) {
            console.error("No trade selected for deletion");
            return;
        }
        
        const confirmButton = document.getElementById('delete-dialog-confirm');
        
        // Set loading state
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.innerHTML = `
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Deleting...
            `;
        }
        
        // Add a small delay for better UX
        setTimeout(() => {
            try {
                // Delete the trade
                const success = TradeCore.deleteTrade(tradeId);
                
                if (success) {
                    // Close dialog
                    const deleteTradeDialog = document.getElementById('delete-trade-dialog');
                    if (deleteTradeDialog) {
                        deleteTradeDialog.classList.remove('active');
                    }
                    
                    // Refresh all charts
                    refreshAllCharts();
                }
            } catch (error) {
                console.error("Error deleting trade:", error);
                TradeCore.showNotification('Error deleting trade: ' + error.message, 'error');
                
                // Reset button state
                if (confirmButton) {
                    confirmButton.disabled = false;
                    confirmButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete Trade
                    `;
                }
            }
        }, 500);
    }
    
    /**
     * Open the close trade dialog for a specific trade
     * @param {string} tradeId - ID of the trade to close
     */
    function openCloseTradeDialog(tradeId) {
        const trade = TradeCore.getTradeById(tradeId);
        if (!trade) {
            console.error("Trade not found:", tradeId);
            return;
        }
        
        // Set the selected trade ID
        TradeCore.setSelectedTradeId(tradeId);
        
        const dialog = document.getElementById('close-trade-dialog');
        if (!dialog) {
            console.error("Close trade dialog not found");
            return;
        }
        
        const exitPriceInput = document.getElementById('close-trade-price');
        const reasonSelect = document.getElementById('close-trade-reason');
        const notesInput = document.getElementById('close-trade-notes');
        
        if (!exitPriceInput || !reasonSelect) {
            console.error("Dialog form elements not found");
            return;
        }
        
        // Clear any error styling
        exitPriceInput.classList.remove('error');
        const formHint = exitPriceInput.nextElementSibling;
        if (formHint && formHint.classList.contains('error-hint')) {
            formHint.textContent = '';
            formHint.classList.remove('error-hint');
        }
        
        // Reset confirm button
        const confirmButton = document.getElementById('close-dialog-confirm');
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"></path>
                    <path d="M3 15h10"></path>
                    <polyline points="17 8 22 12 17 16"></polyline>
                </svg>
                Close Trade
            `;
        }
        
        // Pre-fill with current price
        exitPriceInput.value = trade.currentPrice.toFixed(2);
        
        // Set exit reason based on current P&L
        if (trade.currentPLPercent >= trade.takeProfitPercent) {
            reasonSelect.value = 'Target Reached';
        } else if (trade.currentPLPercent <= -trade.stopLossPercent) {
            reasonSelect.value = 'Stop Loss Hit';
        } else {
            reasonSelect.value = 'Manual Exit';
        }
        
        // Pre-fill notes if they exist
        if (notesInput) {
            notesInput.value = trade.notes || '';
        }
        
        // Update dialog title with stock name
        const dialogTitle = dialog.querySelector('.dialog-title');
        if (dialogTitle) {
            dialogTitle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"></path>
                    <path d="M3 15h10"></path>
                    <polyline points="17 8 22 12 17 16"></polyline>
                </svg>
                Close Trade: ${trade.stockName}
            `;
        }
        
        // Show P&L info in the dialog
        const dialogBody = dialog.querySelector('.dialog-body');
        if (dialogBody) {
            const plInfoElement = dialogBody.querySelector('.pl-info');
            if (plInfoElement) {
                // Update existing P&L info
                plInfoElement.innerHTML = `
                    <div class="trade-pl-info ${trade.currentPLPercent >= 0 ? 'positive' : 'negative'}">
                        Current P&L: ${trade.currentPLPercent.toFixed(2)}% (${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.currentPLValue.toFixed(2)})
                    </div>
                `;
            } else {
                // Create P&L info element if it doesn't exist
                const plInfo = document.createElement('div');
                plInfo.className = 'pl-info';
                plInfo.innerHTML = `
                    <div class="trade-pl-info ${trade.currentPLPercent >= 0 ? 'positive' : 'negative'}">
                        Current P&L: ${trade.currentPLPercent.toFixed(2)}% (${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.currentPLValue.toFixed(2)})
                    </div>
                `;
                dialogBody.insertBefore(plInfo, dialogBody.firstChild);
            }
        }
        
        // Show dialog with animation
        dialog.classList.add('active');
        
        // Focus on exit price input
        setTimeout(() => {
            exitPriceInput.focus();
            exitPriceInput.select();
        }, 300);
    }
    
    /**
     * Open the edit trade dialog for a specific trade
     * @param {string} tradeId - ID of the trade to edit
     */
    function openEditTradeDialog(tradeId) {
        const trade = TradeCore.getTradeById(tradeId);
        if (!trade) {
            console.error("Trade not found:", tradeId);
            return;
        }
        
        // Set the selected trade ID
        TradeCore.setSelectedTradeId(tradeId);
        
        // Make sure dialog exists
        let dialog = document.getElementById('edit-trade-dialog');
        if (!dialog) {
            createEditTradeDialog();
            dialog = document.getElementById('edit-trade-dialog');
        }
        
        if (!dialog) {
            console.error("Edit trade dialog not found");
            return;
        }
        
        // Get form elements
        const entryPriceInput = document.getElementById('edit-entry-price-input');
        const stopLossInput = document.getElementById('edit-stop-loss');
        const targetInput = document.getElementById('edit-target');
        const squareOffDateInput = document.getElementById('edit-square-off-date');
        const notesInput = document.getElementById('edit-notes');
        
        if (!entryPriceInput || !stopLossInput || !targetInput || !squareOffDateInput) {
            console.error("Dialog form elements not found");
            return;
        }
        
        // Clear any error styling
        entryPriceInput.classList.remove('error');
        stopLossInput.classList.remove('error');
        targetInput.classList.remove('error');
        squareOffDateInput.classList.remove('error');
        
        const entryPriceHint = document.getElementById('edit-entry-price-hint');
        const stopLossHint = document.getElementById('edit-stop-loss-hint');
        const targetHint = document.getElementById('edit-target-hint');
        const squareOffHint = document.getElementById('edit-square-off-hint');
        
        if (entryPriceHint) {
            entryPriceHint.classList.remove('error-hint');
            entryPriceHint.textContent = `Current: ${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.entryPrice.toFixed(2)}`;
        }
        
        if (stopLossHint) {
            stopLossHint.classList.remove('error-hint');
            stopLossHint.textContent = `Current: ${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.stopLossPrice.toFixed(2)}`;
        }
        
        if (targetHint) {
            targetHint.classList.remove('error-hint');
            targetHint.textContent = `Current: ${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.targetPrice.toFixed(2)}`;
        }
        
        if (squareOffHint) {
            squareOffHint.classList.remove('error-hint');
            squareOffHint.textContent = `Current: ${TradeCore.formatDate(trade.squareOffDate)}`;
        }
        
        // Reset confirm button
        const confirmButton = document.getElementById('edit-dialog-confirm');
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save Changes
            `;
        }
        
        // Update stock info
        const stockNameElement = document.getElementById('edit-stock-name');
        const entryDateElement = document.getElementById('edit-entry-date');
        const currentPLElement = document.getElementById('edit-current-pl');
        
        if (stockNameElement) stockNameElement.textContent = trade.stockName;
        if (entryDateElement) entryDateElement.textContent = TradeCore.formatDate(trade.entryDate);
        
        if (currentPLElement) {
            currentPLElement.textContent = `${trade.currentPLPercent.toFixed(2)}%`;
            currentPLElement.className = `detail-value ${trade.currentPLPercent >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Pre-fill form with current values
        entryPriceInput.value = trade.entryPrice.toFixed(2);
        stopLossInput.value = trade.stopLossPrice.toFixed(2);
        targetInput.value = trade.targetPrice.toFixed(2);
        
        // Format date for the date input (YYYY-MM-DD)
        const squareOffDate = new Date(trade.squareOffDate);
        const formattedDate = squareOffDate.toISOString().split('T')[0];
        squareOffDateInput.value = formattedDate;
        
        // Pre-fill notes if they exist
        if (notesInput) {
            notesInput.value = trade.notes || '';
        }
        
        // Update dialog title with stock name
        const dialogTitle = dialog.querySelector('.dialog-title');
        if (dialogTitle) {
            dialogTitle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Trade: ${trade.stockName}
            `;
        }
        
        // Show dialog with animation
        dialog.classList.add('active');
        
        // Focus on entry price input
        setTimeout(() => {
            entryPriceInput.focus();
            entryPriceInput.select();
        }, 300);
    }
    
    /**
     * Open the delete trade dialog for a specific trade
     * @param {string} tradeId - ID of the trade to delete
     */
    function openDeleteTradeDialog(tradeId) {
        const trade = TradeCore.getTradeById(tradeId);
        if (!trade) {
            console.error("Trade not found:", tradeId);
            return;
        }
        
        // Set the selected trade ID
        TradeCore.setSelectedTradeId(tradeId);
        
        // Make sure dialog exists
        let dialog = document.getElementById('delete-trade-dialog');
        if (!dialog) {
            createDeleteTradeDialog();
            dialog = document.getElementById('delete-trade-dialog');
        }
        
        if (!dialog) {
            console.error("Delete trade dialog not found");
            return;
        }
        
        // Reset confirm button
        const confirmButton = document.getElementById('delete-dialog-confirm');
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete Trade
            `;
        }
        
        // Update trade info in the dialog
        const stockNameElement = document.getElementById('delete-stock-name');
        const entryDateElement = document.getElementById('delete-entry-date');
        const investmentElement = document.getElementById('delete-investment');
        
        if (stockNameElement) stockNameElement.textContent = trade.stockName;
        if (entryDateElement) entryDateElement.textContent = TradeCore.formatDate(trade.entryDate);
        if (investmentElement) investmentElement.textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.investmentAmount.toFixed(2)}`;
        
        // Update dialog title
        const dialogTitle = dialog.querySelector('.dialog-title');
        if (dialogTitle) {
            dialogTitle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete Trade: ${trade.stockName}
            `;
        }
        
        // Show dialog with animation
        dialog.classList.add('active');
    }
    
    /**
     * Add page load animations
     */
    function addPageLoadAnimations() {
        // Animate statistics cards
        const statCards = document.querySelectorAll('.statistic-card');
        if (statCards.length > 0) {
            statCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 + (index * 50));
            });
        }
        
        // Animate card elements
        const cards = document.querySelectorAll('.card');
        if (cards.length > 0) {
            cards.forEach((card, index) => {
                if (index > 0) { // Skip the first card (statistics) as it's handled separately
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 300 + (index * 100));
                }
            });
        }
        
        // Animate chart containers
        const chartContainers = document.querySelectorAll('.chart-container');
        if (chartContainers.length > 0) {
            chartContainers.forEach((container, index) => {
                container.style.opacity = '0';
                container.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0)';
                }, 400 + (index * 80));
            });
        }
    }
    
    /**
     * Render active trades and trade history
     */
    function renderTrades() {
        renderActiveTrades();
        renderTradeHistory();
    }
    
    /**
     * Render active trades with enhanced UI
     */
    function renderActiveTrades() {
        const container = document.getElementById('active-trades-container');
        const noActiveTradesMsg = document.getElementById('no-active-trades');
        
        if (!container || !noActiveTradesMsg) {
            console.log("Active trades container elements not found - likely not on trades page");
            return;
        }
        
        const activeTrades = TradeCore.getTrades('active');
        
        if (activeTrades.length === 0) {
            noActiveTradesMsg.style.display = 'block';
            // Remove any existing trade cards
            const existingCards = container.querySelectorAll('.trade-card');
            existingCards.forEach(card => card.remove());
            return;
        }
        
        // Hide empty state message
        noActiveTradesMsg.style.display = 'none';
        
        // Remove any existing trade cards
        const existingCards = container.querySelectorAll('.trade-card');
        existingCards.forEach(card => card.remove());
        
        // Get the template
        const template = document.getElementById('active-trade-template');
        if (!template) {
            console.error("Active trade card template not found");
            return;
        }
        
        // Create cards for each active trade
        activeTrades.forEach((trade, index) => {
            try {
                // Clone the template
                const card = template.content.cloneNode(true).querySelector('.trade-card');
                
                // Set trade ID
                card.dataset.tradeId = trade.id;
                
                // Add animation delay for staggered entry
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                // Stock info
                card.querySelector('.stock-name').textContent = trade.stockName;
                card.querySelector('.stock-symbol').textContent = trade.symbol;
                
                // P&L Status
                const plElement = card.querySelector('.current-pl');
                const plValue = trade.currentPLPercent || 0;
                plElement.textContent = `${plValue.toFixed(2)}%`;
                
                if (plValue > 0) {
                    plElement.classList.add('positive');
                    card.classList.add('profit');
                    card.classList.remove('active', 'loss');
                    card.querySelector('.trade-status').className = 'trade-status status-profit';
                    card.querySelector('.trade-status').textContent = 'Profit';
                } else if (plValue < 0) {
                    plElement.classList.add('negative');
                    card.classList.add('loss');
                    card.classList.remove('active', 'profit');
                    card.querySelector('.trade-status').className = 'trade-status status-loss';
                    card.querySelector('.trade-status').textContent = 'Loss';
                }
                
                // Entry info
                card.querySelector('.entry-date').textContent = TradeCore.formatDate(trade.entryDate);
                card.querySelector('.entry-price').textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.entryPrice.toFixed(2)}`;
                card.querySelector('.current-price').textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.currentPrice.toFixed(2)}`;
                card.querySelector('.investment').textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.investmentAmount.toFixed(2)}`;
                card.querySelector('.shares').textContent = trade.shares.toLocaleString();
                card.querySelector('.current-value').textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.currentValue.toFixed(2)}`;
                card.querySelector('.stop-loss').textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.stopLossPrice.toFixed(2)}`;
                card.querySelector('.target').textContent = `${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.targetPrice.toFixed(2)}`;
                card.querySelector('.holding-days').textContent = `${trade.holdingDays} days`;
                card.querySelector('.square-off-date').textContent = TradeCore.formatDate(trade.squareOffDate);
                
                // Days remaining
                const daysRemaining = Math.max(0, Math.floor((trade.squareOffDate - new Date()) / (1000 * 60 * 60 * 24)));
                card.querySelector('.days-remaining').textContent = daysRemaining;
                
                // Close button event
                const closeBtn = card.querySelector('.btn-close-trade');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function() {
                        openCloseTradeDialog(trade.id);
                    });
                }
                
                // Edit button event
                const editBtn = card.querySelector('.btn-edit-trade');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        openEditTradeDialog(trade.id);
                    });
                }
                
                // Delete button event
                const deleteBtn = card.querySelector('.btn-delete-trade');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        openDeleteTradeDialog(trade.id);
                    });
                }
                
                // Add the card to the container with animation
                container.appendChild(card);
                
                // Trigger animation after a short delay (staggered)
                setTimeout(() => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50 * index); // Stagger the animations
            } catch (error) {
                console.error("Error rendering trade card:", error, trade);
                TradeCore.showNotification('Error displaying a trade card', 'error');
            }
        });
    }
    
    /**
     * Render trade history tables with enhanced UI
     */
    function renderTradeHistory() {
        // Check if we have trade history elements
        const noTradeHistory = document.getElementById('no-trade-history');
        const tradesHistoryTable = document.getElementById('trades-history-table');
        const noWinningTrades = document.getElementById('no-winning-trades');
        const winningTradesTable = document.getElementById('winning-trades-table');
        const noLosingTrades = document.getElementById('no-losing-trades');
        const losingTradesTable = document.getElementById('losing-trades-table');
        
        if (!noTradeHistory || !tradesHistoryTable) {
            console.log("Trade history elements not found - likely not on trades page");
            return;
        }
        
        const closedTrades = TradeCore.getTrades('closed');
        
        if (closedTrades.length === 0) {
            noTradeHistory.style.display = 'block';
            tradesHistoryTable.style.display = 'none';
            
            if (noWinningTrades && winningTradesTable) {
                noWinningTrades.style.display = 'block';
                winningTradesTable.style.display = 'none';
            }
            
            if (noLosingTrades && losingTradesTable) {
                noLosingTrades.style.display = 'block';
                losingTradesTable.style.display = 'none';
            }
            return;
        }
        
        // Populate all trades table
        noTradeHistory.style.display = 'none';
        tradesHistoryTable.style.display = 'block';
        
        const allTableBody = document.getElementById('history-table-body');
        if (allTableBody) {
            allTableBody.innerHTML = '';
            
            closedTrades.forEach((trade, index) => {
                const row = createTradeHistoryRow(trade);
                
                // Add animation for each row
                row.style.opacity = '0';
                allTableBody.appendChild(row);
                
                // Trigger animation after a short delay (staggered)
                setTimeout(() => {
                    row.style.transition = 'opacity 0.3s ease';
                    row.style.opacity = '1';
                }, 30 * index); // Stagger the animations
            });
        }
        
        // Populate winning trades table
        if (noWinningTrades && winningTradesTable) {
            const winningTrades = closedTrades.filter(trade => trade.plPercent > 0);
            
            if (winningTrades.length === 0) {
                noWinningTrades.style.display = 'block';
                winningTradesTable.style.display = 'none';
            } else {
                noWinningTrades.style.display = 'none';
                winningTradesTable.style.display = 'block';
                
                const winningTableBody = document.getElementById('winning-table-body');
                if (winningTableBody) {
                    winningTableBody.innerHTML = '';
                    
                    winningTrades.forEach((trade, index) => {
                        const row = createTradeHistoryRow(trade);
                        
                        // Add animation for each row
                        row.style.opacity = '0';
                        winningTableBody.appendChild(row);
                        
                        // Trigger animation after a short delay (staggered)
                        setTimeout(() => {
                            row.style.transition = 'opacity 0.3s ease';
                            row.style.opacity = '1';
                        }, 30 * index); // Stagger the animations
                    });
                }
            }
        }
        
        // Populate losing trades table
        if (noLosingTrades && losingTradesTable) {
            const losingTrades = closedTrades.filter(trade => trade.plPercent <= 0);
            
            if (losingTrades.length === 0) {
                noLosingTrades.style.display = 'block';
                losingTradesTable.style.display = 'none';
            } else {
                noLosingTrades.style.display = 'none';
                losingTradesTable.style.display = 'block';
                
                const losingTableBody = document.getElementById('losing-table-body');
                if (losingTableBody) {
                    losingTableBody.innerHTML = '';
                    
                    losingTrades.forEach((trade, index) => {
                        const row = createTradeHistoryRow(trade);
                        
                        // Add animation for each row
                        row.style.opacity = '0';
                        losingTableBody.appendChild(row);
                        
                        // Trigger animation after a short delay (staggered)
                        setTimeout(() => {
                            row.style.transition = 'opacity 0.3s ease';
                            row.style.opacity = '1';
                        }, 30 * index); // Stagger the animations
                    });
                }
            }
        }
    }
    
    /**
     * Create a table row for a closed trade with enhanced UI
     * @param {Object} trade - Trade object
     * @returns {HTMLTableRowElement} - Table row element
     */
    function createTradeHistoryRow(trade) {
        const row = document.createElement('tr');
        
        // Calculate holding period
        const holdingDays = Math.floor((trade.exitDate - trade.entryDate) / (1000 * 60 * 60 * 24));
        
        // Create exit reason tag class
        let exitTagClass = '';
        switch(trade.exitReason) {
            case 'Take Profit':
            case 'Target Reached':
                exitTagClass = 'tp-tag';
                break;
            case 'Stop Loss Hit':
            case 'Stop Loss':
                exitTagClass = 'sl-tag';
                break;
            case 'Time Exit':
                exitTagClass = 'time-tag';
                break;
            default:
                exitTagClass = 'end-tag';
                break;
        }
        
        // Create cells
        try {
            row.innerHTML = `
                <td>${trade.stockName} <span class="stock-symbol">${trade.symbol}</span></td>
                <td>${TradeCore.formatDate(trade.entryDate)}</td>
                <td>${TradeCore.formatDate(trade.exitDate)}</td>
                <td>${holdingDays} days</td>
                <td>${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.investmentAmount.toFixed(2)}</td>
                <td class="${trade.plPercent > 0 ? 'positive' : 'negative'}">${trade.plPercent.toFixed(2)}%</td>
                <td class="${trade.plValue > 0 ? 'positive' : 'negative'}">${trade.currencySymbol || TradeCore.CURRENCY_SYMBOL}${trade.plValue.toFixed(2)}</td>
                <td><span class="exit-tag ${exitTagClass}">${trade.exitReason}</span></td>
            `;
        } catch (error) {
            console.error("Error creating trade history row:", error, trade);
            row.innerHTML = '<td colspan="8">Error displaying trade</td>';
        }
        
        return row;
    }
    
    /**
     * Create a statistics card for a specific currency
     * @param {Object} stats - Statistics for this currency
     * @param {string} currencySymbol - Currency symbol
     * @returns {HTMLElement} - Statistics card element
     */
    function createCurrencyStatCard(stats, currencySymbol) {
        const statCard = document.createElement('div');
        statCard.className = 'currency-stat-card';
        
        statCard.innerHTML = `
            <div class="currency-header">
                <h4 class="currency-title">${currencySymbol} Markets</h4>
            </div>
            <div class="currency-stats-grid">
                <div class="statistic-card">
                    <div class="statistic-value">${stats.totalActive}</div>
                    <div class="statistic-label">Active Trades</div>
                </div>
                <div class="statistic-card">
                    <div class="statistic-value">${currencySymbol}${stats.totalInvested.toFixed(2)}</div>
                    <div class="statistic-label">Total Invested</div>
                </div>
                <div class="statistic-card ${stats.openPLPercent > 0 ? 'success' : (stats.openPLPercent < 0 ? 'danger' : '')}">
                    <div class="statistic-value ${stats.openPLPercent >= 0 ? 'positive' : 'negative'}">${stats.openPLPercent.toFixed(2)}%</div>
                    <div class="statistic-label">Open P&L</div>
                </div>
                <div class="statistic-card">
                    <div class="statistic-value">${stats.totalClosed}</div>
                    <div class="statistic-label">Closed Trades</div>
                </div>
                <div class="statistic-card ${stats.winRate >= 50 ? 'success' : ''}">
                    <div class="statistic-value ${stats.winRate >= 50 ? 'positive' : ''}">${stats.winRate.toFixed(2)}%</div>
                    <div class="statistic-label">Win Rate</div>
                </div>
                <div class="statistic-card ${stats.avgProfit > 0 ? 'success' : (stats.avgProfit < 0 ? 'danger' : '')}">
                    <div class="statistic-value ${stats.avgProfit > 0 ? 'positive' : (stats.avgProfit < 0 ? 'negative' : '')}">${stats.avgProfit.toFixed(2)}%</div>
                    <div class="statistic-label">Avg Profit/Trade</div>
                </div>
            </div>
        `;
        
        return statCard;
    }
    
    /**
     * Update trading statistics with enhanced UI and currency distinction
     */
    function updateStatistics() {
        // Get the trading statistics container
        const statsContainer = document.getElementById('trading-statistics');
        if (!statsContainer) {
            console.log("Trading statistics container not found - likely not on trades page");
            return;
        }
        
        // Clear the existing statistics
        statsContainer.innerHTML = '';
        
        // Get the currency-specific statistics
        const currencyStats = TradeCore.getTradeStatisticsByCurrency();
        
        // If there are no currency-specific stats, use the overall stats
        if (Object.keys(currencyStats.currencies).length === 0) {
            renderOverallStatistics(statsContainer, currencyStats.overall);
            return;
        }
        
        // Add currency sections
        for (const currencySymbol in currencyStats.currencies) {
            const currencyStatCard = createCurrencyStatCard(
                currencyStats.currencies[currencySymbol], 
                currencySymbol
            );
            statsContainer.appendChild(currencyStatCard);
        }

        // Add animations to statistics cards
        const statCards = document.querySelectorAll('.statistic-card');
        if (statCards.length > 0) {
            statCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 + (index * 30));
            });
        }
    }
    
    /**
     * Render overall statistics (legacy style, for backward compatibility)
     * @param {HTMLElement} container - Container to render statistics in
     * @param {Object} stats - Overall statistics
     */
    function renderOverallStatistics(container, stats) {
        container.innerHTML = `
            <div class="statistic-card">
                <div class="statistic-value" id="active-trade-count">${stats.totalActive}</div>
                <div class="statistic-label">Active Trades</div>
            </div>
            <div class="statistic-card">
                <div class="statistic-value" id="total-invested">${TradeCore.CURRENCY_SYMBOL}${stats.totalInvested.toFixed(2)}</div>
                <div class="statistic-label">Total Invested</div>
            </div>
            <div class="statistic-card ${stats.openPLPercent > 0 ? 'success' : (stats.openPLPercent < 0 ? 'danger' : '')}">
                <div class="statistic-value ${stats.openPLPercent >= 0 ? 'positive' : 'negative'}" id="open-pl">${stats.openPLPercent.toFixed(2)}%</div>
                <div class="statistic-label">Open P&L</div>
            </div>
            <div class="statistic-card">
                <div class="statistic-value" id="closed-trades-count">${stats.totalClosed}</div>
                <div class="statistic-label">Closed Trades</div>
            </div>
            <div class="statistic-card ${stats.winRate >= 50 ? 'success' : ''}">
                <div class="statistic-value ${stats.winRate >= 50 ? 'positive' : ''}" id="win-rate">${stats.winRate.toFixed(2)}%</div>
                <div class="statistic-label">Win Rate</div>
            </div>
            <div class="statistic-card ${stats.avgProfit > 0 ? 'success' : (stats.avgProfit < 0 ? 'danger' : '')}">
                <div class="statistic-value ${stats.avgProfit > 0 ? 'positive' : (stats.avgProfit < 0 ? 'negative' : '')}" id="avg-profit">${stats.avgProfit.toFixed(2)}%</div>
                <div class="statistic-label">Avg Profit/Trade</div>
            </div>
        `;
    }
    
    /**
     * Render advanced metrics cards
     */
    function renderAdvancedMetricsCards() {
        const advancedMetricsContainer = document.getElementById('advanced-metrics-container');
        if (!advancedMetricsContainer) return;
        
        const metrics = TradeCore.getAdvancedMetrics();
        const streakInfo = metrics.streakInfo;
        
        advancedMetricsContainer.innerHTML = `
            <div class="metrics-row">
                <div class="metric-card ${metrics.sharpeRatio >= 1 ? 'success' : metrics.sharpeRatio >= 0 ? 'neutral' : 'danger'}">
                    <div class="metric-title">Sharpe Ratio</div>
                    <div class="metric-value">${metrics.sharpeRatio.toFixed(2)}</div>
                    <div class="metric-desc">Risk-adjusted return (higher is better)</div>
                </div>
                
                <div class="metric-card ${metrics.maxDrawdown < 10 ? 'success' : metrics.maxDrawdown < 20 ? 'neutral' : 'danger'}">
                    <div class="metric-title">Max Drawdown</div>
                    <div class="metric-value">${metrics.maxDrawdown.toFixed(2)}%</div>
                    <div class="metric-desc">Largest drop from peak (${metrics.maxDrawdownDuration} days)</div>
                </div>
                
                <div class="metric-card ${metrics.profitFactor >= 2 ? 'success' : metrics.profitFactor >= 1 ? 'neutral' : 'danger'}">
                    <div class="metric-title">Profit Factor</div>
                    <div class="metric-value">${metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}</div>
                    <div class="metric-desc">Gross profit / gross loss</div>
                </div>
            </div>
            
            <div class="metrics-row">
                <div class="metric-card ${metrics.expectancy > 0 ? 'success' : 'danger'}">
                    <div class="metric-title">Expectancy</div>
                    <div class="metric-value">${metrics.expectancy.toFixed(2)}%</div>
                    <div class="metric-desc">Expected profit per trade</div>
                </div>
                
                <div class="metric-card ${metrics.avgTradeDuration < 10 ? 'success' : metrics.avgTradeDuration < 20 ? 'neutral' : 'warning'}">
                    <div class="metric-title">Avg Hold Time</div>
                    <div class="metric-value">${metrics.avgTradeDuration.toFixed(1)} days</div>
                    <div class="metric-desc">Average holding period</div>
                </div>
                
                <div class="metric-card ${metrics.annualizedReturn > 15 ? 'success' : metrics.annualizedReturn > 0 ? 'neutral' : 'danger'}">
                    <div class="metric-title">Annualized Return</div>
                    <div class="metric-value">${metrics.annualizedReturn.toFixed(2)}%</div>
                    <div class="metric-desc">Return normalized to yearly basis</div>
                </div>
            </div>
            
            <div class="metrics-row">
                <div class="metric-card ${streakInfo.currentStreak.type === 'win' ? 'success' : streakInfo.currentStreak.type === 'loss' ? 'danger' : 'neutral'}">
                    <div class="metric-title">Current Streak</div>
                    <div class="metric-value">${streakInfo.currentStreak.count} ${streakInfo.currentStreak.type === 'win' ? 'Wins' : 'Losses'}</div>
                    <div class="metric-desc">Most recent consecutive results</div>
                </div>
                
                <div class="metric-card success">
                    <div class="metric-title">Longest Win Streak</div>
                    <div class="metric-value">${streakInfo.longestWinStreak}</div>
                    <div class="metric-desc">Most consecutive winning trades</div>
                </div>
                
                <div class="metric-card danger">
                    <div class="metric-title">Longest Loss Streak</div>
                    <div class="metric-value">${streakInfo.longestLossStreak}</div>
                    <div class="metric-desc">Most consecutive losing trades</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render equity curve chart
     */
    function renderEquityCurve() {
        const container = document.getElementById('equity-curve-chart');
        if (!container) return;
        
        const data = TradeCore.getEquityCurveData();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="no-data-message">No trade data available for equity curve</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (equityChart) {
            equityChart.destroy();
        }
        
        // Prepare data
        const labels = data.map(d => new Date(d.date).toLocaleDateString());
        const equityData = data.map(d => d.equityPercent);
        
        // Create chart
        const ctx = container.getContext('2d');
        equityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Growth (%)',
                    data: equityData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Growth: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render drawdown chart
     */
    function renderDrawdownChart() {
        const container = document.getElementById('drawdown-chart');
        if (!container) return;
        
        const data = TradeCore.getDrawdownChartData();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="no-data-message">No trade data available for drawdown chart</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (drawdownChart) {
            drawdownChart.destroy();
        }
        
        // Prepare data
        const labels = data.map(d => new Date(d.date).toLocaleDateString());
        const drawdownData = data.map(d => -d.drawdown); // Negative to show drawdown going down
        
        // Create chart
        const ctx = container.getContext('2d');
        drawdownChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Drawdown (%)',
                    data: drawdownData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Drawdown: ${Math.abs(context.parsed.y).toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Math.abs(value) + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render P&L distribution histogram
     */
    function renderPLDistribution() {
        const container = document.getElementById('pl-distribution-chart');
        if (!container) return;
        
        const { bins, counts } = TradeCore.getPLDistributionData();
        
        if (bins.length === 0) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for P&L distribution</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (plDistributionChart) {
            plDistributionChart.destroy();
        }
        
        // Prepare bin labels
        const binLabels = bins.map((bin, i) => {
            return `${bin}% to ${bin + 5}%`;
        });
        
        // Prepare color array based on whether bin is positive or negative
        const colors = bins.map(bin => bin < 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)');
        const borderColors = bins.map(bin => bin < 0 ? 'rgb(220, 38, 38)' : 'rgb(22, 163, 74)');
        
        // Create chart
        const ctx = container.getContext('2d');
        plDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Number of Trades',
                    data: counts,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `Trades: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Profit/Loss Range'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Trades'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render win/loss pie chart
     */
    function renderWinLossPieChart() {
        const container = document.getElementById('win-loss-pie-chart');
        if (!container) return;
        
        const data = TradeCore.getWinLossPieChartData();
        
        if (data.data.length === 0 || data.data.every(d => d === 0)) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for win/loss breakdown</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (winLossPieChart) {
            winLossPieChart.destroy();
        }
        
        // Create chart
        const ctx = container.getContext('2d');
        winLossPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: data.colors,
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render monthly performance chart
     */
    function renderMonthlyPerformance() {
        const container = document.getElementById('monthly-performance-chart');
        if (!container) return;
        
        const data = TradeCore.getMonthlyPerformanceData();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for monthly performance</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (monthlyPerformanceChart) {
            monthlyPerformanceChart.destroy();
        }
        
        // Prepare data
        const labels = data.map(d => `${d.monthName} ${d.year}`);
        const performanceData = data.map(d => d.totalPL);
        const colors = performanceData.map(val => val >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        
        // Create chart
        const ctx = container.getContext('2d');
        monthlyPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly P&L (%)',
                    data: performanceData,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const monthData = data[context.dataIndex];
                                return [
                                    `P&L: ${value.toFixed(2)}%`,
                                    `Trades: ${monthData.trades}`,
                                    `Win Rate: ${monthData.winRate.toFixed(2)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render market comparison chart
     */
    function renderMarketComparison() {
        const container = document.getElementById('market-comparison-chart');
        if (!container) return;
        
        const data = TradeCore.getPerformanceByMarket();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for market comparison</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (marketComparisonChart) {
            marketComparisonChart.destroy();
        }
        
        // Prepare data
        const labels = data.map(d => d.name);
        const plData = data.map(d => d.avgPL);
        const tradeCountData = data.map(d => d.trades);
        const winRateData = data.map(d => d.winRate);
        
        // Determine colors based on avgPL
        const colors = plData.map(pl => pl >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        
        // Create chart
        const ctx = container.getContext('2d');
        marketComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Average P&L (%)',
                        data: plData,
                        backgroundColor: colors,
                        borderColor: colors.map(c => c.replace('0.7', '1')),
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Win Rate (%)',
                        data: winRateData,
                        type: 'line',
                        borderColor: 'rgba(99, 102, 241, 0.8)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const datasetLabel = context.dataset.label;
                                const value = context.parsed.y;
                                
                                if (datasetLabel === 'Average P&L (%)') {
                                    return `Avg P&L: ${value.toFixed(2)}%`;
                                } else if (datasetLabel === 'Win Rate (%)') {
                                    return `Win Rate: ${value.toFixed(2)}%`;
                                }
                                
                                return `${datasetLabel}: ${value}`;
                            },
                            afterBody: function(tooltipItems) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                const marketData = data[dataIndex];
                                return [`Total Trades: ${marketData.trades}`, `Currency: ${marketData.currency}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Average P&L (%)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y1: {
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Win Rate (%)'
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render trade size vs return scatter plot
     */
    function renderTradeSizeVsReturn() {
        const container = document.getElementById('size-vs-return-chart');
        if (!container) return;
        
        const data = TradeCore.getTradeSizeVsReturnData();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for size vs return analysis</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (sizeVsReturnChart) {
            sizeVsReturnChart.destroy();
        }
        
        // Prepare data
        const scatterData = data.map(d => ({
            x: d.size,
            y: d.return,
            stockName: d.stockName,
            symbol: d.symbol,
            exitDate: d.exitDate,
            holdingDays: d.holdingDays,
            currency: d.currencySymbol
        }));
        
        // Group data by currency
        const groupedByCurrency = {};
        scatterData.forEach(point => {
            if (!groupedByCurrency[point.currency]) {
                groupedByCurrency[point.currency] = [];
            }
            groupedByCurrency[point.currency].push(point);
        });
        
        // Create datasets for each currency
        const datasets = [];
        const colors = {
            '$': 'rgba(16, 185, 129, 0.7)',  // US
            '£': 'rgba(99, 102, 241, 0.7)',  // UK
            '₹': 'rgba(245, 158, 11, 0.7)'   // India
        };
        
        Object.keys(groupedByCurrency).forEach(currency => {
            datasets.push({
                label: `${currency} Trades`,
                data: groupedByCurrency[currency],
                backgroundColor: colors[currency] || 'rgba(156, 163, 175, 0.7)',
                borderColor: (colors[currency] || 'rgba(156, 163, 175, 0.7)').replace('0.7', '1'),
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            });
        });
        
        // Create chart
        const ctx = container.getContext('2d');
        sizeVsReturnChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `${point.stockName} (${point.symbol})`,
                                    `Investment: ${point.currency}${point.x.toFixed(2)}`,
                                    `Return: ${point.y.toFixed(2)}%`,
                                    `Holding: ${point.holdingDays} days`,
                                    `Exit: ${new Date(point.exitDate).toLocaleDateString()}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Investment Amount'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Return (%)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render holding period analysis chart
     */
    function renderHoldingPeriodAnalysis() {
        const container = document.getElementById('holding-period-chart');
        if (!container) return;
        
        const holdingStats = TradeCore.getHoldingPeriodStats();
        
        // Check if we have data
        const hasData = holdingStats.shortTerm.count > 0 || 
                         holdingStats.mediumTerm.count > 0 || 
                         holdingStats.longTerm.count > 0;
                         
        if (!hasData) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for holding period analysis</div>';
            return;
        }
        
        // Clear previous chart if it exists
        if (holdingTimeChart) {
            holdingTimeChart.destroy();
        }
        
        // Prepare data
        const labels = ['Short Term (0-7 days)', 'Medium Term (8-21 days)', 'Long Term (22+ days)'];
        const countData = [
            holdingStats.shortTerm.count,
            holdingStats.mediumTerm.count,
            holdingStats.longTerm.count
        ];
        const plData = [
            holdingStats.shortTerm.avgPL,
            holdingStats.mediumTerm.avgPL,
            holdingStats.longTerm.avgPL
        ];
        const winRateData = [
            holdingStats.shortTerm.winRate,
            holdingStats.mediumTerm.winRate,
            holdingStats.longTerm.winRate
        ];
        
        // Create bar colors based on P&L values
        const colors = plData.map(pl => pl >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        
        // Create chart
        const ctx = container.getContext('2d');
        holdingTimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Average P&L (%)',
                        data: plData,
                        backgroundColor: colors,
                        borderColor: colors.map(c => c.replace('0.7', '1')),
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Win Rate (%)',
                        data: winRateData,
                        type: 'line',
                        borderColor: 'rgba(99, 102, 241, 0.8)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const datasetIndex = context.datasetIndex;
                                
                                if (datasetIndex === 0) {
                                    return `Average P&L: ${value.toFixed(2)}%`;
                                } else if (datasetIndex === 1) {
                                    return `Win Rate: ${value.toFixed(2)}%`;
                                }
                                
                                return `${context.dataset.label}: ${value}`;
                            },
                            afterBody: function(tooltipItems) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                return [`Trade Count: ${countData[dataIndex]}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Average P&L (%)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y1: {
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Win Rate (%)'
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Initialize calendar heatmap for daily performance
     */
    function initializeCalendarHeatmap() {
        const container = document.getElementById('calendar-heatmap');
        if (!container) return;
        
        // Get current year
        const currentYear = new Date().getFullYear();
        
        // Create year selector
        const yearSelector = document.createElement('div');
        yearSelector.className = 'calendar-year-selector';
        yearSelector.innerHTML = `
            <button class="year-nav prev-year">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <span class="current-year">${currentYear}</span>
            <button class="year-nav next-year">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        `;
        
        container.appendChild(yearSelector);
        
        // Create heatmap container
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'heatmap-container';
        container.appendChild(heatmapContainer);
        
        // Create legend
        const legend = document.createElement('div');
        legend.className = 'heatmap-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--danger-color);"></div>
                <div class="legend-label">Loss</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #f5f5f5;"></div>
                <div class="legend-label">No Trades</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: var(--success-color);"></div>
                <div class="legend-label">Profit</div>
            </div>
        `;
        container.appendChild(legend);
        
        // Render initial heatmap
        renderCalendarHeatmap(currentYear);
        
        // Add event listeners for year navigation
        const prevYearBtn = container.querySelector('.prev-year');
        const nextYearBtn = container.querySelector('.next-year');
        const yearDisplay = container.querySelector('.current-year');
        
        prevYearBtn.addEventListener('click', function() {
            const currentYearValue = parseInt(yearDisplay.textContent);
            const newYear = currentYearValue - 1;
            yearDisplay.textContent = newYear;
            renderCalendarHeatmap(newYear);
        });
        
        nextYearBtn.addEventListener('click', function() {
            const currentYearValue = parseInt(yearDisplay.textContent);
            const newYear = currentYearValue + 1;
            if (newYear <= new Date().getFullYear()) {
                yearDisplay.textContent = newYear;
                renderCalendarHeatmap(newYear);
            }
        });
    }
    
    /**
     * Render calendar heatmap for a specific year
     * @param {number} year - Year to display
     */
    function renderCalendarHeatmap(year) {
        const container = document.querySelector('.heatmap-container');
        if (!container) return;
        
        // Get heatmap data for the year
        const heatmapData = TradeCore.getCalendarHeatmapData(year);
        
        // Clear existing content
        container.innerHTML = '';
        
        // Check if we have enough data
        if (heatmapData.length === 0) {
            container.innerHTML = '<div class="no-data-message">No trade data available for this year</div>';
            return;
        }
        
        // Group data by month
        const monthsData = {};
        for (let month = 0; month < 12; month++) {
            monthsData[month] = [];
        }
        
        heatmapData.forEach(day => {
            const date = new Date(day.dateObj);
            const month = date.getMonth();
            monthsData[month].push(day);
        });
        
        // Get month names
        const monthNames = Array.from({length: 12}, (_, i) => 
            new Date(year, i, 1).toLocaleString('default', { month: 'short' }));
        
        // Create month columns
        monthNames.forEach((monthName, monthIndex) => {
            const monthColumn = document.createElement('div');
            monthColumn.className = 'month-column';
            
            // Month header
            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.textContent = monthName;
            monthColumn.appendChild(monthHeader);
            
            // Get days in month
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            
            // Create day cells
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, monthIndex, day);
                const dateString = date.toISOString().split('T')[0];
                
                const dayCell = document.createElement('div');
                dayCell.className = 'day-cell';
                
                // Find data for this day
                const dayData = heatmapData.find(d => d.date === dateString);
                
                if (dayData && dayData.trades > 0) {
                    // Calculate color based on value
                    const value = dayData.value;
                    let color;
                    
                    if (value > 0) {
                        // Green gradient for profits
                        const intensity = Math.min(1, value / 10); // Cap at 10% for full intensity
                        color = `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
                    } else if (value < 0) {
                        // Red gradient for losses
                        const intensity = Math.min(1, Math.abs(value) / 10); // Cap at 10% for full intensity
                        color = `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
                    } else {
                        // Neutral for zero
                        color = '#e5e7eb';
                    }
                    
                    dayCell.style.backgroundColor = color;
                    
                    // Add tooltip data
                    dayCell.setAttribute('data-date', date.toLocaleDateString());
                    dayCell.setAttribute('data-trades', dayData.trades);
                    dayCell.setAttribute('data-value', dayData.value.toFixed(2) + '%');
                    
                    // Add tooltip event listeners
                    dayCell.addEventListener('mouseover', showTooltip);
                    dayCell.addEventListener('mouseout', hideTooltip);
                } else {
                    // No trades this day
                    dayCell.style.backgroundColor = '#f5f5f5';
                }
                
                monthColumn.appendChild(dayCell);
            }
            
            container.appendChild(monthColumn);
        });
    }
    
    /**
     * Show tooltip for calendar heatmap cell
     * @param {Event} e - Mouse event
     */
    function showTooltip(e) {
        const cell = e.target;
        const date = cell.getAttribute('data-date');
        const trades = cell.getAttribute('data-trades');
        const value = cell.getAttribute('data-value');
        
        if (!date || !trades || !value) return;
        
        // Create tooltip
        let tooltip = document.getElementById('heatmap-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'heatmap-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Set content
        tooltip.innerHTML = `
            <div class="tooltip-date">${date}</div>
            <div class="tooltip-trades">Trades: ${trades}</div>
            <div class="tooltip-value">P&L: ${value}</div>
        `;
        
        // Position tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10 + window.scrollY}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + window.scrollX}px`;
        
        // Show tooltip
        tooltip.style.display = 'block';
    }
    
    /**
     * Hide tooltip for calendar heatmap cell
     */
    function hideTooltip() {
        const tooltip = document.getElementById('heatmap-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    /**
     * Render exit reason analysis
     */
    function renderExitReasonAnalysis() {
        const container = document.getElementById('exit-reason-container');
        if (!container) return;
        
        const exitReasons = TradeCore.getExitReasonBreakdown();
        
        if (exitReasons.length === 0) {
            container.innerHTML = '<div class="no-data-message">No closed trades available for exit reason analysis</div>';
            return;
        }
        
        // Create a table for exit reason analysis
        container.innerHTML = `
            <table class="exit-reason-table">
                <thead>
                    <tr>
                        <th>Exit Reason</th>
                        <th>Count</th>
                        <th>% of Trades</th>
                        <th>Avg P&L</th>
                        <th>Win Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${exitReasons.map(reason => `
                        <tr>
                            <td>
                                <span class="exit-tag ${getExitTagClass(reason.reason)}">${reason.reason}</span>
                            </td>
                            <td>${reason.count}</td>
                            <td>${reason.percentage.toFixed(1)}%</td>
                            <td class="${reason.avgPL >= 0 ? 'positive' : 'negative'}">${reason.avgPL.toFixed(2)}%</td>
                            <td>${reason.winRate.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    /**
     * Get the CSS class for an exit reason tag
     * @param {string} reason - Exit reason
     * @returns {string} - CSS class
     */
    function getExitTagClass(reason) {
        switch(reason) {
            case 'Target Reached':
            case 'Take Profit':
                return 'tp-tag';
            case 'Stop Loss Hit':
            case 'Stop Loss':
                return 'sl-tag';
            case 'Time Exit':
                return 'time-tag';
            default:
                return 'end-tag';
        }
    }

    /**
     * Add CSS styles for import/export UI functionality
     */
    function addImportExportStyles() {
        const styleElement = document.getElementById('import-export-styles');
        if (styleElement) return;  // Styles already added
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'import-export-styles';
        style.textContent = `
            /* Import Dialog Styles */
            .file-upload-container {
                margin: 20px 0;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .file-upload-label {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                background-color: var(--primary-color);
                color: white;
                padding: 10px 20px;
                border-radius: var(--radius);
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 8px;
            }
            
            .file-upload-label:hover {
                background-color: var(--primary-dark);
                transform: translateY(-2px);
            }
            
            #selected-filename {
                font-size: 14px;
                color: var(--text-secondary);
                margin-top: 5px;
            }
            
            .import-preview {
                background-color: var(--primary-lightest);
                border-radius: var(--radius);
                padding: 15px;
                margin: 15px 0;
            }
            
            .import-preview h4 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 16px;
                color: var(--primary-color);
            }
            
            .preview-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                gap: 12px;
            }
            
            .preview-stat {
                display: flex;
                flex-direction: column;
            }
            
            .preview-label {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .preview-value {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-color);
            }
            
            .import-options {
                margin: 20px 0;
            }
            
            .import-options h4 {
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 16px;
                color: var(--primary-color);
            }
            
            .radio-option, .checkbox-option {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .radio-option input, .checkbox-option input {
                margin-right: 8px;
            }
            
            .import-status {
                margin-top: 20px;
            }
            
            .status-message {
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .progress-bar {
                height: 8px;
                background-color: var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background-color: var(--primary-color);
                width: 0%;
                transition: width 0.3s ease;
            }
        `;
        
        // Add to head
        document.head.appendChild(style);
    }
    
    // Return public API
    return {
        init,
        renderActiveTrades,
        renderTradeHistory,
        updateStatistics,
        openCloseTradeDialog,
        openEditTradeDialog,
        openDeleteTradeDialog,
        openImportDialog,
        
        // Analytics methods
        renderEquityCurve,
        renderDrawdownChart,
        renderPLDistribution,
        renderWinLossPieChart,
        renderMonthlyPerformance,
        renderMarketComparison,
        renderTradeSizeVsReturn,
        renderHoldingPeriodAnalysis,
        renderAdvancedMetricsCards,
        renderExitReasonAnalysis,
        refreshAllCharts
    };
})();

// Initialize the trade UI
document.addEventListener('DOMContentLoaded', function() {
    // Add import/export styles
    TradeUI.addImportExportStyles ? TradeUI.addImportExportStyles() : null;
    
    // Initialize UI
    TradeUI.init();
});

// Add spinner animation for loading states
const spinnerStyle = document.createElement('style');
spinnerStyle.innerHTML = `
    @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .spinner {
        animation: rotate 1s linear infinite;
    }
    .error {
        border-color: var(--danger-color) !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
    }
    .error-hint {
        color: var(--danger-color) !important;
    }
    .trade-pl-info {
        margin: 8px 0 16px;
        padding: 10px;
        border-radius: var(--radius-sm);
        font-weight: 500;
    }
    .trade-pl-info.positive {
        background-color: var(--success-light);
        color: var(--success-color);
    }
    .trade-pl-info.negative {
        background-color: var(--danger-light);
        color: var(--danger-color);
    }
`;

document.head.appendChild(spinnerStyle);