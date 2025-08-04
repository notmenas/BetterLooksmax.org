// Background script for the extension - Compatible with Chrome and Firefox
// Handle different loading methods for Chrome vs Firefox
let backgroundAPI;

if (typeof importScripts === 'function') {
    // Chrome service worker environment
    try {
        importScripts('./browser-api.js');
        backgroundAPI = BrowserAPI;
    } catch (e) {
        console.error('Failed to load browser-api.js:', e);
        backgroundAPI = (typeof browser !== "undefined") ? browser : chrome;
    }
} else {
    // Firefox background script environment or content script
    backgroundAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
                    (typeof browser !== "undefined") ? browser : chrome;
}

// Storage cache to avoid repeated reads
let settingsCache = null;
let cacheTimeout = null;

function getCachedSettings(callback) {
    if (settingsCache) {
        callback(settingsCache);
        return;
    }
    
    backgroundAPI.storage.local.get(['settings', 'cssSettings'], function(result) {
        settingsCache = result;
        // Cache expires after 10 seconds
        clearTimeout(cacheTimeout);
        cacheTimeout = setTimeout(() => {
            settingsCache = null;
        }, 10000);
        callback(result);
    });
}

backgroundAPI.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    // Initialize settings if they don't exist
    getCachedSettings(function(result) {
        if (!result.settings) {
            backgroundAPI.storage.local.set({
                settings: {
                    darkMode: true,
                    autoSave: true,
                    defaultSize: '14'
                },
                filenameScrambling: true,
                metadataRemoval: true
            });
        }
    });
});

// Listen for tab updates (URL changes)
backgroundAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Validate tab URL is from allowed origins
        const allowedOrigins = [
            'https://looksmax.org',
            'https://forum.looksmaxxing.com',
            'https://lookism.cc'
        ];
        
        if (!tab.url || !allowedOrigins.some(origin => tab.url.startsWith(origin))) {
            return; // Don't send messages to non-allowed tabs
        }
        
        // Check if CSS is enabled using cache
        getCachedSettings(function(result) {
            if (result.cssSettings && result.cssSettings.enabled) {
                // Apply CSS to the new page
                backgroundAPI.tabs.sendMessage(tabId, {
                    type: 'applyCSS',
                    css: result.cssSettings.styles
                }).catch(() => {
                    // Ignore errors for tabs that can't receive messages
                });
            }
        });
    }
});

// Listen for tab switching
backgroundAPI.tabs.onActivated.addListener((activeInfo) => {
    getCachedSettings(function(result) {
        if (result.cssSettings && result.cssSettings.enabled) {
            // Apply CSS to the newly activated tab
            backgroundAPI.tabs.sendMessage(activeInfo.tabId, {
                type: 'applyCSS',
                css: result.cssSettings.styles
            }).catch(() => {
                // Ignore errors for tabs that can't receive messages
            });
        }
    });
});

// Listen for window focus changes
backgroundAPI.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== backgroundAPI.windows.WINDOW_ID_NONE) {
        backgroundAPI.tabs.query({ active: true, windowId: windowId }, function(tabs) {
            if (tabs[0]) {
                getCachedSettings(function(result) {
                    if (result.cssSettings && result.cssSettings.enabled) {
                        // Apply CSS to the active tab in the focused window
                        backgroundAPI.tabs.sendMessage(tabs[0].id, {
                            type: 'applyCSS',
                            css: result.cssSettings.styles
                        }).catch(() => {
                            // Ignore errors for tabs that can't receive messages
                        });
                    }
                });
            }
        });
    }
});

// Persist settings when changed and invalidate cache
backgroundAPI.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        // Invalidate cache when settings change
        settingsCache = null;
        clearTimeout(cacheTimeout);
        
        if (changes.settings) {
            getCachedSettings(function(result) {
                const currentSettings = result.settings || {};
                Object.assign(currentSettings, changes.settings.newValue);
                backgroundAPI.storage.local.set({ settings: currentSettings });
            });
        }
    }
});

// Message relay system - forwards messages between content scripts and popup
backgroundAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle popup state update messages from content scripts
    if (message.type === 'updatePopupState') {
        console.log('[Background] Relaying popup state update:', message);
        
        // Forward message to popup if it's open
        // Note: This will fail silently if popup is not open, which is expected
        backgroundAPI.runtime.sendMessage(message).catch(() => {
            // Popup is not open, ignore error
        });
    }
    
    // Handle other message types that need relaying
    if (message.type === 'settingChanged') {
        console.log('[Background] Relaying setting change to content scripts');
        
        // Get all tabs that match our allowed origins
        const allowedOrigins = [
            'https://looksmax.org',
            'https://forum.looksmaxxing.com',
            'https://lookism.cc'
        ];
        
        backgroundAPI.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && allowedOrigins.some(origin => tab.url.startsWith(origin))) {
                    backgroundAPI.tabs.sendMessage(tab.id, message).catch(() => {
                        // Tab might not be ready to receive messages, ignore error
                    });
                }
            });
        });
    }
});



