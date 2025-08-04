// Wait for sanitizer to be ready - event-driven approach
async function waitForSanitizer() {
    if (window.BetterLooksmaxSanitizer) {
        return true;
    }
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.error('Critical: Sanitizer failed to load after 5 seconds');
            reject(new Error('Sanitizer initialization failed'));
        }, 5000);
        
        const checkSanitizer = () => {
            if (window.BetterLooksmaxSanitizer) {
                clearTimeout(timeout);
                resolve(true);
            } else {
                requestAnimationFrame(checkSanitizer);
            }
        };
        checkSanitizer();
    });
}

// StyleManager class for efficient CSS management
class StyleManager {
    constructor() {
        this.styleSheet = null;
        this.customProperties = new Map();
        this.pendingUpdates = new Map();
        this.updateScheduled = false;
        this.createStyleSheet();
    }

    createStyleSheet() {
        if (!this.styleSheet && document.head) {
            const style = document.createElement('style');
            style.id = 'better-looksmax-styles';
            document.head.appendChild(style);
            this.styleSheet = style.sheet;
        }
    }

    updateRule(selector, properties) {
        this.pendingUpdates.set(selector, properties);
        this.scheduleUpdate();
    }

    scheduleUpdate() {
        if (this.updateScheduled) return;
        
        this.updateScheduled = true;
        requestAnimationFrame(() => {
            this.flushUpdates();
            this.updateScheduled = false;
        });
    }

    flushUpdates() {
        for (const [selector, properties] of this.pendingUpdates) {
            this.applyRule(selector, properties);
        }
        this.pendingUpdates.clear();
    }

    applyRule(selector, properties) {
        if (!this.styleSheet) return;

        // Find existing rule
        const rules = Array.from(this.styleSheet.cssRules);
        const existingRule = rules.find(rule => rule.selectorText === selector);

        if (existingRule) {
            // Update existing rule
            Object.assign(existingRule.style, properties);
        } else {
            // Create new rule
            const ruleText = `${selector} { ${Object.entries(properties)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ')} }`;
            try {
                this.styleSheet.insertRule(ruleText);
            } catch (error) {
                console.warn('Failed to insert CSS rule:', ruleText, error);
            }
        }
    }

    setCustomProperty(name, value) {
        this.customProperties.set(name, value);
        document.documentElement.style.setProperty(`--bl-${name}`, value);
    }

    getCustomProperty(name) {
        return this.customProperties.get(name);
    }

    removeRule(selector) {
        if (!this.styleSheet) return;

        const rules = Array.from(this.styleSheet.cssRules);
        const ruleIndex = rules.findIndex(rule => rule.selectorText === selector);
        
        if (ruleIndex !== -1) {
            this.styleSheet.deleteRule(ruleIndex);
        }
    }

    clear() {
        if (this.styleSheet) {
            // Clear all rules
            while (this.styleSheet.cssRules.length > 0) {
                this.styleSheet.deleteRule(0);
            }
        }
        this.customProperties.clear();
        this.pendingUpdates.clear();
    }
}

// Import performance utilities (scoped to avoid conflicts)
var contentPerformanceUtils = null;
var contentStyleManager = null;
var contentEventManager = null;

// Initialize performance utilities when available
function initPerformanceUtils() {
    if (window.BetterLooksmaxPerformance && !contentPerformanceUtils) {
        contentPerformanceUtils = window.BetterLooksmaxPerformance;
        contentStyleManager = new StyleManager();
        contentEventManager = new contentPerformanceUtils.EventManager();
        console.log('[Content] Performance utilities initialized');
    }
}

// Try to initialize immediately or wait for performance utils
if (window.BetterLooksmaxPerformance) {
    initPerformanceUtils();
} else {
    // Wait for performance utils to load
    const checkForUtils = () => {
        if (window.BetterLooksmaxPerformance) {
            initPerformanceUtils();
        } else {
            setTimeout(checkForUtils, 100);
        }
    };
    checkForUtils();
}

// Cache DOM elements (fallback for when performance utils aren't loaded)
let cachedStyleElement = null;
let cachedThemeElement = null;

// Apply CSS function with StyleManager integration
function applyCustomCSS(css) {
    // Security check: Block CSS if sanitizer is not available
    if (!window.BetterLooksmaxSanitizer) {
        console.error('Security: CSS sanitizer not loaded, blocking CSS application');
        return;
    }

    // ALWAYS sanitize CSS before applying (defense in depth - even if pre-sanitized)
    const sanitizedCSS = window.BetterLooksmaxSanitizer.sanitizeCSS(css || '');
    
    // Use StyleManager if available, otherwise fallback to old method
    if (contentStyleManager) {
        contentStyleManager.clear();
        
        // Parse and apply CSS rules through StyleManager
        try {
            // For simple CSS application, create a temporary style element
            // TODO: Parse CSS and use updateRule method for better performance
            const tempStyle = document.getElementById('custom-css') || document.createElement('style');
            tempStyle.id = 'custom-css';
            tempStyle.textContent = sanitizedCSS;
            
            if (!tempStyle.parentNode && document.head) {
                document.head.appendChild(tempStyle);
            }
        } catch (error) {
            console.error('Error applying CSS through StyleManager:', error);
            // Fallback to old method
            applyCustomCSSFallback(sanitizedCSS);
        }
    } else {
        applyCustomCSSFallback(sanitizedCSS);
    }
}

// Fallback CSS application method
function applyCustomCSSFallback(sanitizedCSS) {
    if (!cachedStyleElement) {
        cachedStyleElement = document.getElementById('custom-css');
        if (!cachedStyleElement && document.head) {
            cachedStyleElement = document.createElement('style');
            cachedStyleElement.id = 'custom-css';
            document.head.appendChild(cachedStyleElement);
        }
    }
    if (cachedStyleElement) {
        cachedStyleElement.textContent = sanitizedCSS;
    }
}

// Wrapper for safe CSS application with sanitizer check
async function safeApplyCustomCSS(css) {
    await waitForSanitizer();
    applyCustomCSS(css);
}

// Use the cross-browser API wrapper
const contentBrowserAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
                          (typeof browser !== 'undefined') ? browser : chrome;

// Central message routing system for all extension features with enhanced security
class MessageRouter {
    constructor() {
        this.featureHandlers = new Map();
        this.sessionNonce = window.SecurityUtils ? window.SecurityUtils.createSessionNonce() : null;
        this.sessionNonces = new Map(); // Track used nonces
        this.messageTimestamps = new Map(); // Track message timestamps
        this.rateLimiter = null;
        this.setupRateLimiter();
        this.setupMainListener();
        this.startNonceCleanup();
    }
    
    // Setup rate limiting for message handling
    setupRateLimiter() {
        if (window.SecurityUtils) {
            // Allow max 20 messages per second to prevent flooding
            this.rateLimiter = window.SecurityUtils.createRateLimiter(
                this.processMessage.bind(this),
                20,  // max messages
                1000 // per second
            );
        }
    }
    
    // Cleanup old nonces periodically
    startNonceCleanup() {
        setInterval(() => {
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            for (const [nonce, timestamp] of this.sessionNonces.entries()) {
                if (timestamp < fiveMinutesAgo) {
                    this.sessionNonces.delete(nonce);
                }
            }
        }, 5 * 60 * 1000);
    }
    
    // Validate message nonce and timestamp
    validateNonce(request) {
        // Skip nonce validation for legacy messages (backward compatibility)
        if (!request.nonce) {
            return true; // Allow legacy messages for now
        }
        
        // Check if nonce was already used
        if (this.sessionNonces.has(request.nonce)) {
            console.warn('Rejected: Nonce already used');
            return false;
        }
        
        // Validate timestamp (must be within 5 minutes)
        if (request.timestamp) {
            const age = Date.now() - request.timestamp;
            if (age > 5 * 60 * 1000 || age < -30000) { // Allow 30 sec clock skew
                console.warn('Rejected: Message timestamp out of range');
                return false;
            }
        }
        
        // Store nonce to prevent replay
        this.sessionNonces.set(request.nonce, Date.now());
        return true;
    }
    
    // Register a feature handler
    registerFeature(featureName, handler) {
        this.featureHandlers.set(featureName, handler);
        console.log(`[MessageRouter] Registered handler for ${featureName}`);
    }
    
    // Send message to popup to update state with security nonce
    notifyPopup(setting, enabled) {
        contentBrowserAPI.runtime.sendMessage({
            type: 'updatePopupState',
            setting: setting,
            enabled: enabled,
            nonce: window.SecurityUtils ? window.SecurityUtils.generateNonce() : null,
            timestamp: Date.now()
        }).catch(() => {
            // Ignore errors if popup is not open
        });
    }
    
    // Main message listener with comprehensive routing
    setupMainListener() {
        contentBrowserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Multi-layer security validation
            
            // 1. Validate sender exists and has ID
            if (!sender || !sender.id) {
                console.warn('Rejected: No sender ID');
                return false;
            }
            
            // 2. Validate sender ID matches extension ID
            if (contentBrowserAPI.runtime.id && sender.id !== contentBrowserAPI.runtime.id) {
                console.warn('Rejected: Sender ID mismatch');
                return false;
            }
            
            // 3. Validate sender is from extension context (not web page)
            if (sender.url && window.SecurityUtils) {
                // Messages from extension pages must have extension protocol
                if (!window.SecurityUtils.isExtensionContext(sender.url)) {
                    // If not from extension context, validate it's from allowed site
                    if (sender.tab && sender.tab.url) {
                        if (!window.SecurityUtils.isAllowedOrigin(sender.tab.url)) {
                            console.warn('Rejected: Invalid sender origin:', sender.tab.url);
                            return false;
                        }
                    } else {
                        console.warn('Rejected: Non-extension sender without valid tab');
                        return false;
                    }
                }
            }
            
            // 4. Validate nonce and timestamp
            if (!this.validateNonce(request)) {
                return false;
            }
            
            // 5. Validate message structure
            if (window.SecurityUtils && !window.SecurityUtils.validateMessage(request)) {
                console.warn('Rejected: Invalid message structure');
                return false;
            }
            
            // 6. Apply rate limiting if available
            if (this.rateLimiter) {
                const result = this.rateLimiter(request, sender, sendResponse);
                if (result === null) {
                    console.warn('Rejected: Rate limit exceeded');
                    return false;
                }
                return result;
            }
            
            // If validation passed, process the message
            return this.processMessage(request, sender, sendResponse);
        });
    }
    
    // Process validated messages
    processMessage(request, sender, sendResponse) {
        const { MESSAGE_TYPES, SETTINGS_KEYS } = window.BetterLooksmaxMessages || {};
        
        // Handle different message types
        switch (request.type) {
            case 'applyCSS':
                applyCustomCSS(request.css);
                break;
                
            case MESSAGE_TYPES?.SETTING_CHANGED:
            case 'SETTING_CHANGED':
                this.handleSettingChanged(request);
                break;
                
            case MESSAGE_TYPES?.REQUEST_STATE:
            case 'REQUEST_STATE':
                this.handleStateRequest(request, sendResponse);
                return true; // Keep message channel open for async response
                
            case 'toggleTimer':
                const timerElement = document.getElementById('siteTimer');
                if (timerElement) {
                    timerElement.style.display = request.enabled ? 'block' : 'none';
                }
                break;
                
            default:
                console.log(`[MessageRouter] Unhandled message type: ${request.type}`);
        }
        
        return false;
    }
    
    // Handle setting changes and forward to appropriate feature handlers
    handleSettingChanged(request) {
        const { setting, enabled } = request;
        console.log(`[MessageRouter] Setting changed: ${setting} = ${enabled}`);
        
        // Forward to registered feature handlers
        this.featureHandlers.forEach((handler, featureName) => {
            try {
                handler({
                    type: window.BetterLooksmaxMessages.MESSAGE_TYPES.SETTING_CHANGED,
                    setting: setting,
                    enabled: enabled
                });
            } catch (error) {
                console.error(`[MessageRouter] Error forwarding to ${featureName}:`, error);
            }
        });
        
        // Also trigger custom events for features that prefer event listeners
        const event = new CustomEvent('betterLooksmaxSettingChanged', {
            detail: { setting, enabled }
        });
        document.dispatchEvent(event);
    }
    
    // Handle state requests from popup
    handleStateRequest(request, sendResponse) {
        // Collect current state from all registered features
        const currentState = {};
        
        // Get state from storage
        contentBrowserAPI.storage.local.get([
            'greyFilter', 'publicMode', 'nsfwFilter', 'opFilter', 'timerEnabled',
            'filenameScrambling', 'metadataRemoval', 'isGreyUsersHidden', 'isPublicMode'
        ], (result) => {
            Object.assign(currentState, result);
            sendResponse({ state: currentState });
        });
    }
}

// Initialize the message router
const messageRouter = new MessageRouter();

// Expose router for feature scripts to register with
window.BetterLooksmaxRouter = messageRouter;

// Storage cache to avoid repeated calls
let settingsCache = null;
let cacheTimeout = null;

// Get cached settings or fetch from storage
function getCachedSettings(callback) {
    if (settingsCache) {
        callback(settingsCache);
        return;
    }
    
    contentBrowserAPI.storage.local.get(['cssSettings', 'customCSS', 'cssEnabled', 'darkTheme', 'timerEnabled'], function(result) {
        settingsCache = result;
        // Cache expires after 5 seconds
        clearTimeout(cacheTimeout);
        cacheTimeout = setTimeout(() => {
            settingsCache = null;
        }, 5000);
        callback(result);
    });
}

// Apply saved CSS on page load with re-sanitization
getCachedSettings(function(result) {
    if (result.cssSettings?.enabled && result.cssSettings?.styles) {
        // ALWAYS re-sanitize CSS from storage before applying
        const sanitizedCSS = window.BetterLooksmaxSanitizer ? 
            window.BetterLooksmaxSanitizer.sanitizeCSS(result.cssSettings.styles) : '';
        if (sanitizedCSS) {
            applyCustomCSS(sanitizedCSS);
        }
    }
});

// Remove custom CSS function
function removeCustomCSS() {
    if (cachedStyleElement) {
        cachedStyleElement.remove();
        cachedStyleElement = null;
        console.log('CSS removed');
    }
}

// Re-apply CSS after dynamic content changes with optimized throttling
let cssObserver = null;

function initializeCSSObserver() {
    if (cssObserver) return;

    // Use performance utils if available
    if (contentPerformanceUtils) {
        const throttledApply = contentPerformanceUtils.throttle(() => {
            getCachedSettings(function(result) {
                if (result.cssSettings?.enabled && result.cssSettings?.styles) {
                    // Re-sanitize CSS from storage
                    const sanitizedCSS = window.BetterLooksmaxSanitizer ? 
                        window.BetterLooksmaxSanitizer.sanitizeCSS(result.cssSettings.styles) : '';
                    if (sanitizedCSS) {
                        applyCustomCSS(sanitizedCSS);
                    }
                }
            });
        }, 250); // Throttle to max 4 times per second for better performance

        cssObserver = new contentPerformanceUtils.FilteredMutationObserver(throttledApply);
        
        // Add filter for relevant mutations only
        cssObserver.addFilter(mutation => {
            return mutation.type === 'childList' && 
                   mutation.addedNodes.length > 0 &&
                   Array.from(mutation.addedNodes).some(node => 
                       node.nodeType === Node.ELEMENT_NODE &&
                       (node.matches && node.matches('.structItem, .message, .content')) ||
                       node.querySelector && node.querySelector('.structItem, .message, .content')
                   );
        });
        
        cssObserver.observe(document.documentElement);
    } else {
        // Fallback to old method with improved throttling
        let applyThrottled = false;
        cssObserver = new MutationObserver(() => {
            if (!applyThrottled) {
                applyThrottled = true;
                requestAnimationFrame(() => {
                    getCachedSettings(function(result) {
                        if (result.cssSettings?.enabled && result.cssSettings?.styles) {
                            // Re-sanitize CSS from storage
                            const sanitizedCSS = window.BetterLooksmaxSanitizer ? 
                                window.BetterLooksmaxSanitizer.sanitizeCSS(result.cssSettings.styles) : '';
                            if (sanitizedCSS) {
                                applyCustomCSS(sanitizedCSS);
                            }
                        }
                    });
                    setTimeout(() => { applyThrottled = false; }, 250);
                });
            }
        });
        
        cssObserver.observe(document.documentElement, { 
            childList: true,
            subtree: true 
        });
    }
}

// Initialize CSS observer
initializeCSSObserver();

// Cleanup when extension is updated/reloaded or page unloads
function cleanup() {
    if (cssObserver) {
        if (cssObserver.disconnect) {
            cssObserver.disconnect();
        }
        cssObserver = null;
    }
    
    if (contentEventManager) {
        contentEventManager.cleanup();
    }
    
    if (contentStyleManager) {
        contentStyleManager.clear();
    }
    
    removeCustomCSS();
    clearTimeout(cacheTimeout);
    settingsCache = null;
    cachedStyleElement = null;
    cachedThemeElement = null;
    
    console.log('[Content] Cleanup completed');
}

if (contentBrowserAPI.runtime && contentBrowserAPI.runtime.connect) {
    try {
        const port = contentBrowserAPI.runtime.connect();
        port.onDisconnect.addListener(cleanup);
    } catch (e) {
        // Extension context might be invalidated
        console.log('Extension context unavailable');
    }
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Initialize CSS from storage once
async function initializeCSS() {
    // Note: CSS operations will be automatically queued if sanitizer not ready
    // No need to wait here - the CSS Security Manager handles it
    
    getCachedSettings(function(result) {
        if (result.cssSettings?.enabled && result.cssSettings?.styles) {
            // Re-sanitize CSS from storage
            const sanitizedCSS = window.BetterLooksmaxSanitizer ? 
                window.BetterLooksmaxSanitizer.sanitizeCSS(result.cssSettings.styles) : '';
            if (sanitizedCSS) {
                applyCustomCSS(sanitizedCSS);
                console.log('Loaded and sanitized saved CSS settings');
            }
        }
        if (result.darkTheme) {
            applyDarkTheme();
        }
    });
}

// Initialize everything when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeCSS();
    });
} else {
    initializeCSS();
}

// Settings loading is now handled by initializeCSS() function above
// No need for separate loadAndApplySettings function

// Apply CSS immediately when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, checking for stored CSS...');
    getCachedSettings(function(result) {
        console.log('Loaded CSS settings:', result);
        if (result.cssEnabled && result.customCSS) {
            // Re-sanitize CSS from storage
            const sanitizedCSS = window.BetterLooksmaxSanitizer ? 
                window.BetterLooksmaxSanitizer.sanitizeCSS(result.customCSS) : '';
            if (sanitizedCSS) {
                applyCustomCSS(sanitizedCSS);
            }
        }
    });
});

// Clean up function for when CSS is disabled
function cleanupCSS() {
    removeCustomCSS();
    contentBrowserAPI.storage.local.set({ cssEnabled: false });
}

// Handle cleanup when tab is closed or refreshed
window.addEventListener('unload', cleanupCSS);

// Dark theme is now handled in initializeCSS()

function applyDarkTheme() {
    // Security check: Block theme if sanitizer is not available
    if (!window.BetterLooksmaxSanitizer) {
        console.error('Security: CSS sanitizer not loaded, blocking theme application');
        return;
    }
    
    const css = `
        body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
            color: #e0e0e0 !important;
        }
        .wrapper, .content {
            background: rgba(26, 26, 46, 0.7) !important;
        }
    `;

    if (!cachedThemeElement) {
        cachedThemeElement = document.getElementById('custom-theme');
        if (!cachedThemeElement && document.head) {
            cachedThemeElement = document.createElement('style');
            cachedThemeElement.id = 'custom-theme';
            document.head.appendChild(cachedThemeElement);
        }
    }
    // Sanitize theme CSS before applying
    const sanitizedThemeCSS = window.BetterLooksmaxSanitizer.sanitizeCSS(css);
    if (cachedThemeElement) {
        cachedThemeElement.textContent = sanitizedThemeCSS;
    }
}

// CSS loading is now handled by initializeCSS()

// Notify that content script is ready
console.log('Content script loaded and initialized');

// Timer visibility is now handled by the unified message router above

// Check initial timer state
getCachedSettings(function(result) {
    const timerElement = document.getElementById('siteTimer');
    if (timerElement && result.timerEnabled) {
        timerElement.style.display = 'block';
    }
});

// Expose functions for testing
if (typeof global !== 'undefined') {
    global.applyCustomCSS = applyCustomCSS;
    global.removeCustomCSS = removeCustomCSS;
    global.applyDarkTheme = applyDarkTheme;
    global.initializeCSS = initializeCSS;
    global.cleanupCSS = cleanupCSS;
    // loadAndApplySettings was removed in refactoring
    global.loadAndApplySettings = async function() {
        try {
            const response = await fetch(contentBrowserAPI.runtime.getURL('settings.json'));
            const settings = await response.json();
            
            if (settings.cssSettings.enabled && settings.cssSettings.styles) {
                // Re-sanitize CSS from storage
                const sanitizedCSS = window.BetterLooksmaxSanitizer ? 
                    window.BetterLooksmaxSanitizer.sanitizeCSS(settings.cssSettings.styles) : '';
                if (sanitizedCSS) {
                    applyCustomCSS(sanitizedCSS);
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };
}