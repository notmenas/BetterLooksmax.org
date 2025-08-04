// Background script for the extension - Compatible with Chrome and Firefox
// Use browser API wrapper for cross-browser compatibility
const browserAPI = (typeof browser !== "undefined") ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    // Initialize settings if they don't exist
    browserAPI.storage.local.get(['settings'], function(result) {
        if (!result.settings) {
            browserAPI.storage.local.set({
                settings: {
                    darkMode: true,
                    autoSave: true,
                    defaultSize: '14'
                }
            });
        }
    });
});

// Listen for tab updates (URL changes)
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Check if CSS is enabled
        browserAPI.storage.local.get(['cssSettings'], function(result) {
            if (result.cssSettings && result.cssSettings.enabled) {
                // Apply CSS to the new page
                browserAPI.tabs.sendMessage(tabId, {
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
browserAPI.tabs.onActivated.addListener((activeInfo) => {
    browserAPI.storage.local.get(['cssSettings'], function(result) {
        if (result.cssSettings && result.cssSettings.enabled) {
            // Apply CSS to the newly activated tab
            browserAPI.tabs.sendMessage(activeInfo.tabId, {
                type: 'applyCSS',
                css: result.cssSettings.styles
            }).catch(() => {
                // Ignore errors for tabs that can't receive messages
            });
        }
    });
});

// Listen for window focus changes
browserAPI.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== browserAPI.windows.WINDOW_ID_NONE) {
        browserAPI.tabs.query({ active: true, windowId: windowId }, function(tabs) {
            if (tabs[0]) {
                browserAPI.storage.local.get(['cssSettings'], function(result) {
                    if (result.cssSettings && result.cssSettings.enabled) {
                        // Apply CSS to the active tab in the focused window
                        browserAPI.tabs.sendMessage(tabs[0].id, {
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

// Persist settings when changed
browserAPI.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.settings) {
        browserAPI.storage.local.get(['settings'], function(result) {
            const currentSettings = result.settings || {};
            Object.assign(currentSettings, changes.settings.newValue);
            browserAPI.storage.local.set({ settings: currentSettings });
        });
    }
});



