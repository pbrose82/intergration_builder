/**
 * Debug Helper Script
 * This script helps diagnose authentication issues by adding monitoring and logging
 */

(function() {
    // Create a debug console div
    function setupDebugConsole() {
        // Check if we're in debug mode
        const urlParams = new URLSearchParams(window.location.search);
        const debug = urlParams.get('debug');
        
        if (debug !== 'true') return;
        
        console.log('Debug mode enabled');
        
        // Create debug console
        const debugConsole = document.createElement('div');
        debugConsole.id = 'debugConsole';
        debugConsole.style.position = 'fixed';
        debugConsole.style.bottom = '10px';
        debugConsole.style.left = '10px';
        debugConsole.style.width = '400px';
        debugConsole.style.maxHeight = '300px';
        debugConsole.style.overflowY = 'auto';
        debugConsole.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        debugConsole.style.color = '#00ff00';
        debugConsole.style.fontFamily = 'monospace';
        debugConsole.style.fontSize = '12px';
        debugConsole.style.padding = '10px';
        debugConsole.style.borderRadius = '5px';
        debugConsole.style.zIndex = '9999';
        
        // Add header
        const header = document.createElement('div');
        header.innerHTML = '<b>Authentication Debug Console</b>';
        header.style.marginBottom = '8px';
        header.style.borderBottom = '1px solid #666';
        header.style.paddingBottom = '5px';
        debugConsole.appendChild(header);
        
        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.position = 'absolute';
        clearBtn.style.top = '8px';
        clearBtn.style.right = '10px';
        clearBtn.style.backgroundColor = '#333';
        clearBtn.style.color = '#fff';
        clearBtn.style.border = 'none';
        clearBtn.style.borderRadius = '3px';
        clearBtn.style.padding = '2px 8px';
        clearBtn.style.fontSize = '10px';
        clearBtn.style.cursor = 'pointer';
        
        clearBtn.addEventListener('click', function() {
            const logArea = document.getElementById('debugLogArea');
            if (logArea) {
                logArea.innerHTML = '';
            }
        });
        
        header.appendChild(clearBtn);
        
        // Add log area
        const logArea = document.createElement('div');
        logArea.id = 'debugLogArea';
        logArea.style.marginTop = '5px';
        debugConsole.appendChild(logArea);
        
        // Add to body
        document.body.appendChild(debugConsole);
        
        // Log initial information
        logDebug('Debug console initialized');
        logDebug('User agent: ' + navigator.userAgent);
        logDebug('URL: ' + window.location.href);
        
        // Monitor jQuery availability
        if (typeof $ === 'undefined') {
            logDebug('WARNING: jQuery not loaded', 'error');
        } else {
            logDebug('jQuery version: ' + $.fn.jquery, 'info');
        }
        
        // Check for authentication elements
        setTimeout(checkAuthElements, 1000);
    }
    
    // Log to debug console
    window.logDebug = function(message, type = 'log') {
        const logArea = document.getElementById('debugLogArea');
        if (!logArea) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.style.marginBottom = '3px';
        entry.style.wordBreak = 'break-word';
        
        // Color based on type
        if (type === 'error') {
            entry.style.color = '#ff5555';
        } else if (type === 'warning') {
            entry.style.color = '#ffaa00';
        } else if (type === 'success') {
            entry.style.color = '#55ff55';
        } else if (type === 'info') {
            entry.style.color = '#55aaff';
        }
        
        entry.textContent = `[${timestamp}] ${message}`;
        logArea.appendChild(entry);
        
        // Auto-scroll to bottom
        logArea.scrollTop = logArea.scrollHeight;
        
        // Also log to console
        console.log(`[DEBUG] ${message}`);
    };
    
    // Check for authentication elements
    function checkAuthElements() {
        const authBtn = document.getElementById('authenticateBtn');
        const validateBtn = document.getElementById('validateHubspotBtn');
        const fetchFieldsBtn = document.getElementById('fetchFieldsBtn');
        
        if (authBtn) {
            logDebug('Found authentication button', 'info');
            
            // Add event listener to monitor clicks
            authBtn.addEventListener('click', function() {
                logDebug('Authentication button clicked', 'info');
                
                // Check values
                const tenantId = document.getElementById('alchemyTenantId');
                const email = document.getElementById('alchemyEmail');
                const password = document.getElementById('alchemyPassword');
                
                if (tenantId) {
                    logDebug('Tenant ID: ' + (tenantId.value ? 'provided' : 'missing'), tenantId.value ? 'info' : 'warning');
                }
                
                if (email) {
                    logDebug('Email: ' + (email.value ? 'provided' : 'missing'), email.value ? 'info' : 'warning');
                }
                
                if (password) {
                    logDebug('Password: ' + (password.value ? 'provided' : 'missing'), password.value ? 'info' : 'warning');
                }
            });
        } else {
            logDebug('Authentication button not found', 'warning');
        }
        
        if (validateBtn) {
            logDebug('Found HubSpot validate button', 'info');
        }
        
        if (fetchFieldsBtn) {
            logDebug('Found fetch fields button', 'info');
        }
        
        // Monitor AJAX requests
        monitorAjaxRequests();
    }
    
    // Monitor AJAX requests
    function monitorAjaxRequests() {
        if (typeof $ !== 'undefined') {
            $(document).ajaxSend(function(event, jqXHR, settings) {
                logDebug(`AJAX request to: ${settings.url}`, 'info');
            });
            
            $(document).ajaxSuccess(function(event, jqXHR, settings, data) {
                logDebug(`AJAX success: ${settings.url}`, 'success');
                
                // Log authentication success
                if (settings.url === '/authenticate-alchemy' && data && data.status === 'success') {
                    logDebug('Authentication succeeded!', 'success');
                }
            });
            
            $(document).ajaxError(function(event, jqXHR, settings, error) {
                logDebug(`AJAX error: ${settings.url} - ${error}`, 'error');
                
                try {
                    const response = JSON.parse(jqXHR.responseText);
                    logDebug(`Response message: ${response.message || 'No message'}`, 'error');
                } catch (e) {
                    // Not JSON response
                }
            });
            
            logDebug('AJAX monitoring enabled', 'info');
        } else {
            // Use XMLHttpRequest monitoring as fallback
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function(method, url) {
                this._url = url;
                originalOpen.apply(this, arguments);
            };
            
            XMLHttpRequest.prototype.send = function() {
                logDebug(`XHR request to: ${this._url}`, 'info');
                
                this.addEventListener('load', function() {
                    if (this.status >= 200 && this.status < 300) {
                        logDebug(`XHR success: ${this._url}`, 'success');
                        
                        // Log authentication success
                        if (this._url === '/authenticate-alchemy') {
                            try {
                                const response = JSON.parse(this.responseText);
                                if (response && response.status === 'success') {
                                    logDebug('Authentication succeeded!', 'success');
                                }
                            } catch (e) {
                                // Not JSON response
                            }
                        }
                    } else {
                        logDebug(`XHR error: ${this._url} - ${this.status}`, 'error');
                    }
                });
                
                originalSend.apply(this, arguments);
            };
            
            logDebug('XHR monitoring enabled', 'info');
        }
        
        // Monitor fetch API
        const originalFetch = window.fetch;
        window.fetch = function() {
            const url = arguments[0];
            const options = arguments[1] || {};
            
            logDebug(`Fetch request to: ${url}`, 'info');
            
            return originalFetch.apply(this, arguments)
                .then(function(response) {
                    const clonedResponse = response.clone();
                    
                    if (response.ok) {
                        logDebug(`Fetch success: ${url}`, 'success');
                        
                        // Log authentication success
                        if (url === '/authenticate-alchemy') {
                            clonedResponse.json().then(data => {
                                if (data && data.status === 'success') {
                                    logDebug('Authentication succeeded!', 'success');
                                }
                            }).catch(() => {
                                // Not JSON response
                            });
                        }
                    } else {
                        logDebug(`Fetch error: ${url} - ${response.status}`, 'error');
                    }
                    
                    return response;
                })
                .catch(function(error) {
                    logDebug(`Fetch exception: ${url} - ${error.message}`, 'error');
                    throw error;
                });
        };
        
        logDebug('Fetch API monitoring enabled', 'info');
    }
    
    // Initialize when DOM is ready
    function init() {
        setupDebugConsole();
    }
    
    // Set up initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
