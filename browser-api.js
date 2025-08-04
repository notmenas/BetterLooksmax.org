/**
 * Cross-browser API wrapper for Chrome and Firefox extension compatibility
 * Provides a unified interface for extension APIs across different browsers
 */

(function(global) {
    'use strict';

    // Detect browser environment
    const isFirefox = typeof browser !== 'undefined' && browser.runtime;
    const isChrome = typeof chrome !== 'undefined' && chrome.runtime;
    
    if (!isFirefox && !isChrome) {
        console.error('BrowserAPI: No supported browser extension API detected');
        return;
    }

    // Base API reference
    const baseAPI = isFirefox ? browser : chrome;
    
    /**
     * Promisify Chrome callbacks for Firefox compatibility
     * Firefox uses promises natively, Chrome uses callbacks
     */
    function promisify(fn, context) {
        return function(...args) {
            if (isFirefox) {
                // Firefox returns promises natively
                return fn.apply(context, args);
            } else {
                // Chrome uses callbacks, convert to promises
                return new Promise((resolve, reject) => {
                    args.push((result) => {
                        if (baseAPI.runtime.lastError) {
                            reject(new Error(baseAPI.runtime.lastError.message));
                        } else {
                            resolve(result);
                        }
                    });
                    fn.apply(context, [...args, callback]);
                });
            }
        };
    }

    /**
     * Handle Chrome callback-style APIs for both browsers
     */
    function callbackWrapper(fn, context) {
        return function(...args) {
            if (isFirefox && typeof args[args.length - 1] === 'function') {
                // Firefox: convert promise to callback
                const callback = args.pop();
                fn.apply(context, args).then(callback).catch((error) => {
                    console.error('BrowserAPI callback error:', error);
                    callback(undefined);
                });
            } else {
                // Chrome: use directly
                return fn.apply(context, args);
            }
        };
    }

    /**
     * Check if extension context is still valid
     */
    function isContextValid() {
        try {
            // Try to access a basic runtime property
            return !!(baseAPI && baseAPI.runtime && baseAPI.runtime.id);
        } catch (error) {
            console.debug('Extension context invalidated:', error.message);
            return false;
        }
    }

    /**
     * Safe wrapper for extension API calls
     */
    function safeAPICall(fn, fallback = null) {
        try {
            if (!isContextValid()) {
                console.debug('Extension context invalid, using fallback');
                return fallback;
            }
            return fn();
        } catch (error) {
            if (error.message.includes('Extension context invalidated')) {
                console.debug('Extension context invalidated during API call, using fallback');
                return fallback;
            }
            throw error;
        }
    }

    /**
     * Unified Browser API
     */
    const BrowserAPI = {
        // Runtime API
        runtime: {
            onInstalled: {
                addListener: (callback) => baseAPI.runtime.onInstalled.addListener(callback)
            },
            onMessage: {
                addListener: (callback) => baseAPI.runtime.onMessage.addListener(callback)
            },
            sendMessage: isFirefox 
                ? (message) => baseAPI.runtime.sendMessage(message)
                : (message, callback) => baseAPI.runtime.sendMessage(message, callback),
            getURL: (path) => baseAPI.runtime.getURL(path),
            connect: () => baseAPI.runtime.connect(),
            lastError: baseAPI.runtime.lastError
        },

        // Storage API - Simplified for Manifest V3 compatibility
        storage: {
            local: {
                get: (keys, callback) => {
                    const safeCallback = callback || (() => {});
                    
                    const result = safeAPICall(() => {
                        if (isFirefox) {
                            // Firefox uses promises natively
                            baseAPI.storage.local.get(keys).then(safeCallback).catch(error => {
                                console.error('Storage get error:', error);
                                safeCallback({});
                            });
                        } else {
                            // Chrome uses callbacks
                            baseAPI.storage.local.get(keys, (result) => {
                                if (baseAPI.runtime.lastError) {
                                    console.error('Storage get error:', baseAPI.runtime.lastError.message);
                                    safeCallback({});
                                } else {
                                    safeCallback(result);
                                }
                            });
                        }
                    });
                    
                    // If context is invalid, call callback with empty object
                    if (result === null) {
                        safeCallback({});
                    }
                },
                set: (items, callback) => {
                    const safeCallback = callback || (() => {});
                    
                    const result = safeAPICall(() => {
                        if (isFirefox) {
                            // Firefox uses promises natively
                            baseAPI.storage.local.set(items).then(safeCallback).catch(error => {
                                console.error('Storage set error:', error);
                                safeCallback();
                            });
                        } else {
                            // Chrome uses callbacks
                            baseAPI.storage.local.set(items, (result) => {
                                if (baseAPI.runtime.lastError) {
                                    console.error('Storage set error:', baseAPI.runtime.lastError.message);
                                }
                                safeCallback(result);
                            });
                        }
                    });
                    
                    // If context is invalid, call callback
                    if (result === null) {
                        safeCallback();
                    }
                },
                remove: (keys, callback) => {
                    const safeCallback = callback || (() => {});
                    
                    const result = safeAPICall(() => {
                        if (isFirefox) {
                            baseAPI.storage.local.remove(keys).then(safeCallback).catch(error => {
                                console.error('Storage remove error:', error);
                                safeCallback();
                            });
                        } else {
                            baseAPI.storage.local.remove(keys, (result) => {
                                if (baseAPI.runtime.lastError) {
                                    console.error('Storage remove error:', baseAPI.runtime.lastError.message);
                                }
                                safeCallback(result);
                            });
                        }
                    });
                    
                    // If context is invalid, call callback
                    if (result === null) {
                        safeCallback();
                    }
                },
                clear: (callback) => {
                    const safeCallback = callback || (() => {});
                    
                    const result = safeAPICall(() => {
                        if (isFirefox) {
                            baseAPI.storage.local.clear().then(safeCallback).catch(error => {
                                console.error('Storage clear error:', error);
                                safeCallback();
                            });
                        } else {
                            baseAPI.storage.local.clear((result) => {
                                if (baseAPI.runtime.lastError) {
                                    console.error('Storage clear error:', baseAPI.runtime.lastError.message);
                                }
                                safeCallback(result);
                            });
                        }
                    });
                    
                    // If context is invalid, call callback
                    if (result === null) {
                        safeCallback();
                    }
                }
            },
            onChanged: {
                addListener: (callback) => baseAPI.storage.onChanged.addListener(callback)
            }
        },

        // Tabs API
        tabs: {
            onUpdated: {
                addListener: (callback) => baseAPI.tabs.onUpdated.addListener(callback)
            },
            onActivated: {
                addListener: (callback) => baseAPI.tabs.onActivated.addListener(callback)
            },
            sendMessage: (tabId, message, callback) => {
                if (isFirefox) {
                    baseAPI.tabs.sendMessage(tabId, message).catch((error) => {
                        // Ignore errors for tabs that can't receive messages
                        if (callback) callback();
                    });
                } else {
                    baseAPI.tabs.sendMessage(tabId, message, callback || (() => {}));
                }
            },
            query: baseAPI.tabs && baseAPI.tabs.query ? callbackWrapper(promisify(baseAPI.tabs.query, baseAPI.tabs), baseAPI.tabs) : undefined
        },

        // Windows API
        windows: {
            onFocusChanged: {
                addListener: (callback) => baseAPI.windows && baseAPI.windows.onFocusChanged ? 
                    baseAPI.windows.onFocusChanged.addListener(callback) : null
            },
            WINDOW_ID_NONE: baseAPI.windows && baseAPI.windows.WINDOW_ID_NONE !== undefined ? 
                baseAPI.windows.WINDOW_ID_NONE : -1
        }
    };

    /**
     * Legacy Chrome API compatibility
     * Maintains backward compatibility with existing chrome.* calls
     */
    const ChromeCompatLayer = {
        runtime: BrowserAPI.runtime,
        storage: BrowserAPI.storage,
        tabs: BrowserAPI.tabs,
        windows: BrowserAPI.windows
    };

    // Export for different environments
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment (for testing)
        module.exports = { BrowserAPI, ChromeCompatLayer };
    } else if (typeof define === 'function' && define.amd) {
        // AMD environment
        define(() => ({ BrowserAPI, ChromeCompatLayer }));
    } else {
        // Browser global environment
        // Only set if not already defined to avoid conflicts
        if (!global.BrowserAPI) {
            global.BrowserAPI = BrowserAPI;
        }
        if (!global.ChromeCompatLayer) {
            global.ChromeCompatLayer = ChromeCompatLayer;
        }
        
        // Maintain chrome object for legacy compatibility
        if (!global.chrome && isFirefox) {
            global.chrome = ChromeCompatLayer;
        }
    }

    // Utility functions
    BrowserAPI.utils = {
        isFirefox: () => isFirefox,
        isChrome: () => isChrome,
        getBrowserName: () => isFirefox ? 'firefox' : 'chrome',
        
        /**
         * Safe message sending with error handling
         */
        safeTabMessage: (tabId, message) => {
            return new Promise((resolve) => {
                BrowserAPI.tabs.sendMessage(tabId, message, () => {
                    // Always resolve, ignore errors
                    resolve();
                });
            });
        },

        /**
         * Safe storage operations with error handling
         */
        safeStorageGet: (keys) => {
            return new Promise((resolve) => {
                BrowserAPI.storage.local.get(keys, (result) => {
                    resolve(result || {});
                });
            });
        },

        safeStorageSet: (items) => {
            return new Promise((resolve) => {
                BrowserAPI.storage.local.set(items, () => {
                    resolve();
                });
            });
        }
    };

    console.log(`BrowserAPI initialized for ${BrowserAPI.utils.getBrowserName()}`);

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);