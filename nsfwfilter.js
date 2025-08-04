// NSFW Filter Script with Performance Optimizations
(function() {
    // Use the cross-browser API wrapper
    const nsfwAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
                    (typeof browser !== 'undefined') ? browser : chrome;

    // Message constants - wait for them to be available
    function waitForMessageConstants() {
        return new Promise((resolve) => {
            if (window.BetterLooksmaxMessages) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.BetterLooksmaxMessages) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 10);
            }
        });
    }

    // Register with message router for bidirectional sync
    async function registerWithMessageRouter() {
        await waitForMessageConstants();
        
        if (window.BetterLooksmaxRouter) {
            window.BetterLooksmaxRouter.registerFeature('nsfwFilter', handleMessage);
            console.log('[NSFWFilter] Registered with message router');
        } else {
            // Wait for router to be available
            setTimeout(registerWithMessageRouter, 100);
        }
    }

    // Handle messages from popup/other components
    function handleMessage(message) {
        const { MESSAGE_TYPES, SETTINGS_KEYS } = window.BetterLooksmaxMessages;
        
        if (message.type === MESSAGE_TYPES.SETTING_CHANGED) {
            const { setting, enabled } = message;
            
            if (setting === SETTINGS_KEYS.NSFW_FILTER) {
                console.log(`[NSFWFilter] Received setting change: ${setting} = ${enabled}`);
                
                // Update button state and apply/remove filter
                updateFilterState(enabled);
            }
        }
    }

    // Update filter state
    function updateFilterState(enabled) {
        // This will be implemented when I can see the existing filter logic
        console.log(`[NSFWFilter] Filter state updated: ${enabled}`);
    }
    
    // Performance utilities (scoped to avoid conflicts)
    var nsfwPerformanceUtils = null;
    var nsfwElementCache = null;
    var nsfwEventManager = null;
    var nsfwThrottledFilterOperations = null;
    
    // Initialize performance utilities
    function initPerformanceUtils() {
        if (window.BetterLooksmaxPerformance && !nsfwPerformanceUtils) {
            nsfwPerformanceUtils = window.BetterLooksmaxPerformance;
            nsfwElementCache = nsfwPerformanceUtils.cache;
            nsfwEventManager = new nsfwPerformanceUtils.EventManager();
            
            // Create throttled filter operations
            nsfwThrottledFilterOperations = {
                applyFilter: nsfwPerformanceUtils.throttle(applyNSFWFilterOptimized, 250),
                checkButton: nsfwPerformanceUtils.throttle(checkAndAddButtonOptimized, 300)
            };
            
            console.log('[NSFWFilter] Performance utilities initialized');
        }
    }
    
    // Try to initialize immediately or wait for performance utils
    if (window.BetterLooksmaxPerformance) {
        initPerformanceUtils();
    } else {
        const checkForUtils = () => {
            if (window.BetterLooksmaxPerformance) {
                initPerformanceUtils();
            } else {
                setTimeout(checkForUtils, 100);
            }
        };
        checkForUtils();
    }
    
    let lastCheckTime = 0;
    const CHECK_INTERVAL = 1000; // Only check every second
    const BUTTON_ID = 'nsfw-filter-button';
    
    // Cache for processed elements
    const processedElements = new WeakSet();
    const hiddenElements = new Set();

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function findButtonGroup() {
        // Try different possible selectors for the button group
        const selectors = [
            '.block-outer-opposite .buttonGroup',
            '.block-outer .buttonGroup',
            '.p-body-header .buttonGroup',
            '.p-title .buttonGroup',
            '.p-description .buttonGroup',
            '.block-container .buttonGroup',
            '.block-header .buttonGroup',
            '.buttonGroup'
        ];
        
        for (const selector of selectors) {
            const group = document.querySelector(selector);
            if (group) {
                console.log('[NSFWFilter] Found button group with selector:', selector);
                return group;
            }
        }
        
        // Try finding any element with buttonGroup class that's visible
        const allGroups = document.querySelectorAll('.buttonGroup');
        for (const group of allGroups) {
            const rect = group.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                console.log('[NSFWFilter] Found visible button group');
                return group;
            }
        }
        
        return null;
    }

    // Optimized button check using caching (for dynamic updates only)
    function checkAndAddButtonOptimized(skipThrottle = false) {
        if (!nsfwElementCache) {
            checkAndAddButton(skipThrottle); // Fallback
            return;
        }
        
        // Skip throttle for initial creation
        if (!skipThrottle) {
            const now = Date.now();
            if (now - lastCheckTime < CHECK_INTERVAL) {
                return;
            }
            lastCheckTime = now;
        }

        // Check if button already exists
        const existingButton = document.getElementById(BUTTON_ID);
        if (existingButton) {
            console.log('[NSFWFilter] Button already exists');
            return;
        }

        // Check if we're in a thread or forum page
        const isThread = window.location.pathname.includes('/threads/');
        const isForum = window.location.pathname.includes('/forums/');
        if (!isThread && !isForum) {
            console.log('[NSFWFilter] Not on a thread or forum page');
            return;
        }

        // Find the button group - don't cache negative results
        const buttonGroup = document.querySelector('.block-outer-opposite .buttonGroup') ||
                          document.querySelector('.block-outer .buttonGroup') ||
                          document.querySelector('.buttonGroup');
        if (!buttonGroup) {
            console.log('[NSFWFilter] Button group not found, will retry');
            return;
        }
        
        console.log('[NSFWFilter] Creating button in group:', buttonGroup);
        createAndAddButton(buttonGroup);
    }
    
    // Original function as fallback
    function checkAndAddButton(skipThrottle = false) {
        // Skip throttle for initial creation
        if (!skipThrottle) {
            const now = Date.now();
            if (now - lastCheckTime < CHECK_INTERVAL) {
                return;
            }
            lastCheckTime = now;
        }

        // Check if button already exists
        if (document.getElementById(BUTTON_ID)) {
            console.log('[NSFWFilter] Button already exists');
            return;
        }

        // Check if we're in a thread or forum page
        const isThread = window.location.pathname.includes('/threads/');
        const isForum = window.location.pathname.includes('/forums/');
        if (!isThread && !isForum) {
            console.log('[NSFWFilter] Not on a thread or forum page');
            return;
        }

        // Find the button group
        const buttonGroup = findButtonGroup();
        if (!buttonGroup) {
            console.log('[NSFWFilter] Button group not found, will retry');
            return;
        }
        
        console.log('[NSFWFilter] Creating button in group:', buttonGroup);
        createAndAddButton(buttonGroup);
    }
    
    function createAndAddButton(buttonGroup) {
        console.log('[NSFWFilter] Creating NSFW filter button');
        
        // Create the button
        const button = document.createElement('a');
        button.href = '#';
        button.className = 'button--link button';
        button.id = BUTTON_ID;
        const icon = document.createElement('i');
        icon.className = 'fas fa-eye-slash';
        const span = document.createElement('span');
        span.className = 'button-text';
        span.textContent = 'NSFW Filter';
        button.appendChild(icon);
        button.appendChild(document.createTextNode(' '));
        button.appendChild(span);
        button.title = 'Toggle NSFW Filter';

        // Add click handler with proper event management
        const clickHandler = function(e) {
            e.preventDefault();
            const isActive = this.classList.toggle('is-active');
            // Store the state
            nsfwAPI.storage.local.set({ nsfwFilterActive: isActive });
            
            // Apply the filter using optimized version if available
            if (nsfwThrottledFilterOperations) {
                nsfwThrottledFilterOperations.applyFilter(isActive);
            } else {
                applyNSFWFilter(isActive);
            }
            
            // Update icon and text
            const icon = this.querySelector('i');
            const text = this.querySelector('.button-text');
            if (isActive) {
                icon.className = 'fas fa-eye';
                text.textContent = 'NSFW';
                this.style.color = '#4f46e5';
            } else {
                icon.className = 'fas fa-eye-slash';
                text.textContent = 'NSFW';
                this.style.color = '';
            }
        };
        
        if (nsfwEventManager) {
            nsfwEventManager.addListener(button, 'click', clickHandler);
        } else {
            button.addEventListener('click', clickHandler);
        }

        // Add the button to the group
        buttonGroup.appendChild(button);

        // Check stored state and apply
        nsfwAPI.storage.local.get(['nsfwFilterActive'], (result) => {
            // Validate storage data before using
            const validated = window.StorageValidator ? 
                window.StorageValidator.validateStorageData(result) : result;
            if (validated.nsfwFilterActive === true) {
                button.classList.add('is-active');
                const icon = button.querySelector('i');
                const text = button.querySelector('.button-text');
                icon.className = 'fas fa-eye';
                text.textContent = 'NSFW';
                button.style.color = '#4f46e5';
                
                // Use optimized filter if available
                if (nsfwThrottledFilterOperations) {
                    nsfwThrottledFilterOperations.applyFilter(true);
                } else {
                    applyNSFWFilter(true);
                }
            }
        });
    }

    function isNSFWContent(content) {
        if (!content) return false;
        
        const lowerContent = content.toLowerCase();
        const nsfwTerms = [
            'nsfw',
            'nsfl',
            'not safe for work',
            'not safe for life',
            '[nsfw]',
            '(nsfw)',
            'nsfw:',
            'nsfw -',
            'nsfw.',
            'nsfw!',
            'nsfw?'
        ];
        
        return nsfwTerms.some(term => lowerContent.includes(term));
    }

    // Optimized NSFW filter using performance utilities
    function applyNSFWFilterOptimized(active) {
        if (!nsfwElementCache) {
            applyNSFWFilter(active); // Fallback
            return;
        }

        console.log(`Applying NSFW filter (optimized): ${active}`);
        const operationsToProcess = [];
        
        // Handle thread items with caching
        const threadItems = nsfwElementCache.get('.structItem');
        threadItems.forEach(item => {
            const title = item.querySelector('.structItem-title')?.textContent;
            const content = item.querySelector('.structItem-excerpt')?.textContent;
            
            if (isNSFWContent(title) || isNSFWContent(content)) {
                operationsToProcess.push(() => {
                    item.style.display = active ? 'none' : '';
                    if (active) {
                        hiddenElements.add(item);
                        processedElements.add(item);
                    } else {
                        hiddenElements.delete(item);
                        processedElements.delete(item);
                    }
                });
            }
        });

        // Handle messages with caching
        const messages = nsfwElementCache.get('.message');
        messages.forEach(message => {
            const content = message.querySelector('.message-userContent')?.textContent;
            if (isNSFWContent(content)) {
                operationsToProcess.push(() => {
                    message.style.display = active ? 'none' : '';
                    if (active) {
                        hiddenElements.add(message);
                        processedElements.add(message);
                    } else {
                        hiddenElements.delete(message);
                        processedElements.delete(message);
                    }
                });
            }
        });

        // Handle posts with caching
        const posts = nsfwElementCache.get('.message--post');
        posts.forEach(post => {
            const content = post.querySelector('.message-content')?.textContent;
            if (isNSFWContent(content)) {
                operationsToProcess.push(() => {
                    post.style.display = active ? 'none' : '';
                    if (active) {
                        hiddenElements.add(post);
                        processedElements.add(post);
                    } else {
                        hiddenElements.delete(post);
                        processedElements.delete(post);
                    }
                });
            }
        });

        // Batch DOM operations
        if (operationsToProcess.length > 0) {
            console.log(`[NSFWFilter] Processing ${operationsToProcess.length} NSFW elements`);
            if (nsfwPerformanceUtils) {
                nsfwPerformanceUtils.batchDOMOperations(operationsToProcess);
            } else {
                // Fallback: execute operations directly
                operationsToProcess.forEach(op => op());
            }
        } else {
            console.log('[NSFWFilter] No NSFW content found to filter');
        }
    }
    
    // Original function as fallback
    function applyNSFWFilter(active) {
        console.log(`Applying NSFW filter (fallback): ${active}`);
        // Handle thread items
        document.querySelectorAll('.structItem').forEach(item => {
            const title = item.querySelector('.structItem-title')?.textContent;
            const content = item.querySelector('.structItem-excerpt')?.textContent;
            if (isNSFWContent(title) || isNSFWContent(content)) {
                item.style.display = active ? 'none' : '';
            }
        });

        // Handle messages
        document.querySelectorAll('.message').forEach(message => {
            const content = message.querySelector('.message-userContent')?.textContent;
            if (isNSFWContent(content)) {
                message.style.display = active ? 'none' : '';
            }
        });

        // Handle posts
        document.querySelectorAll('.message--post').forEach(post => {
            const content = post.querySelector('.message-content')?.textContent;
            if (isNSFWContent(content)) {
                post.style.display = active ? 'none' : '';
            }
        });
    }

    // Create optimized observer for dynamic content
    let nsfwObserver = null;
    
    function initializeNSFWObserver() {
        if (nsfwObserver) return;

        if (nsfwPerformanceUtils) {
            // Use optimized FilteredMutationObserver
            const throttledProcess = nsfwPerformanceUtils.throttle(() => {
                if (nsfwThrottledFilterOperations) {
                    nsfwThrottledFilterOperations.checkButton();
                } else {
                    checkAndAddButton();
                }
                
                // Re-apply filter if active
                nsfwAPI.storage.local.get(['nsfwFilterActive'], (result) => {
                    // Validate storage data before using
                    const validated = window.StorageValidator ? 
                        window.StorageValidator.validateStorageData(result) : result;
                    if (validated.nsfwFilterActive === true) {
                        if (nsfwThrottledFilterOperations) {
                            nsfwThrottledFilterOperations.applyFilter(true);
                        } else {
                            applyNSFWFilter(true);
                        }
                    }
                });
            }, 300);

            nsfwObserver = new nsfwPerformanceUtils.FilteredMutationObserver(throttledProcess);
            
            // Add intelligent filters for relevant mutations only
            nsfwObserver.addFilter(mutation => {
                return mutation.type === 'childList' && 
                       mutation.addedNodes.length > 0 &&
                       Array.from(mutation.addedNodes).some(node => 
                           node.nodeType === Node.ELEMENT_NODE &&
                           (node.matches && (
                               node.matches('.structItem') || 
                               node.matches('.message') ||
                               node.matches('.buttonGroup') ||
                               node.matches('.message--post')
                           )) ||
                           (node.querySelector && (
                               node.querySelector('.structItem') ||
                               node.querySelector('.message') ||
                               node.querySelector('.buttonGroup') ||
                               node.querySelector('.message--post')
                           ))
                       );
            });
            
            // Wait for document.body to be available before observing
            if (document.body) {
                nsfwObserver.observe(document.body);
            } else {
                // Wait for body to be available
                const bodyObserver = new MutationObserver(() => {
                    if (document.body) {
                        bodyObserver.disconnect();
                        nsfwObserver.observe(document.body);
                    }
                });
                bodyObserver.observe(document.documentElement, { childList: true });
            }
        } else {
            // Fallback to improved basic observer
            const debouncedCheck = debounce(() => {
                checkAndAddButton();
                // Re-apply filter if active
                nsfwAPI.storage.local.get(['nsfwFilterActive'], (result) => {
                    // Validate storage data before using
                    const validated = window.StorageValidator ? 
                        window.StorageValidator.validateStorageData(result) : result;
                    if (validated.nsfwFilterActive === true) {
                        applyNSFWFilter(true);
                    }
                });
            }, 300);
            
            let observerThrottled = false;
            nsfwObserver = new MutationObserver((mutations) => {
                if (!observerThrottled) {
                    observerThrottled = true;
                    requestAnimationFrame(() => {
                        let hasRelevantNodes = false;
                        for (const mutation of mutations) {
                            if (mutation.addedNodes.length) {
                                for (const node of mutation.addedNodes) {
                                    if (node.nodeType === Node.ELEMENT_NODE && 
                                        (node.classList?.contains('structItem') || 
                                         node.classList?.contains('message') ||
                                         node.classList?.contains('buttonGroup') ||
                                         node.querySelector?.('.structItem, .message, .buttonGroup, .message--post'))) {
                                        hasRelevantNodes = true;
                                        break;
                                    }
                                }
                            }
                            if (hasRelevantNodes) break;
                        }
                        
                        if (hasRelevantNodes) {
                            debouncedCheck();
                        }
                        setTimeout(() => { observerThrottled = false; }, 300);
                    });
                }
            });
            
            // Wait for document.body to be available before observing
            if (document.body) {
                nsfwObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            } else {
                // Wait for body to be available
                const bodyObserver = new MutationObserver(() => {
                    if (document.body) {
                        bodyObserver.disconnect();
                        nsfwObserver.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                });
                bodyObserver.observe(document.documentElement, { childList: true });
            }
        }
    }
    
    // Initial check - add multiple attempts to ensure button is created
    function performInitialCheck() {
        console.log('[NSFWFilter] Performing initial button check');
        // Always skip throttle for initial checks
        checkAndAddButton(true);
    }
    
    // Function to retry button creation with backoff
    function retryButtonCreation(attempts = 0, maxAttempts = 10) {
        if (attempts >= maxAttempts) {
            console.log('[NSFWFilter] Max retry attempts reached');
            return;
        }
        
        if (document.getElementById(BUTTON_ID)) {
            console.log('[NSFWFilter] Button found after retry');
            return;
        }
        
        performInitialCheck();
        
        // Exponential backoff: 100ms, 200ms, 400ms, etc.
        const delay = Math.min(100 * Math.pow(2, attempts), 3000);
        setTimeout(() => retryButtonCreation(attempts + 1, maxAttempts), delay);
    }
    
    // Start retry mechanism
    retryButtonCreation();
    
    // Also check after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', performInitialCheck);
    } else {
        // DOM is already loaded, check again after a short delay
        setTimeout(performInitialCheck, 100);
    }
    
    // Additional check after page fully loads
    window.addEventListener('load', () => {
        console.log('[NSFWFilter] Page loaded, final button check');
        performInitialCheck();
    });

    // Initialize observer
    initializeNSFWObserver();
    
    // Cleanup function
    function cleanup() {
        if (nsfwObserver) {
            nsfwObserver.disconnect();
            nsfwObserver = null;
        }
        if (nsfwEventManager) {
            nsfwEventManager.cleanup();
        }
        hiddenElements.clear();
        console.log('[NSFWFilter] Cleanup completed');
    }
    
    // Initialize message router registration
    registerWithMessageRouter();
    
    // Add cleanup on page unload - removed to prevent button disappearing
    // The cleanup will happen when the page actually unloads/navigates away
    // window.addEventListener('beforeunload', cleanup);
    
    // Expose functions for testing
    if (typeof global !== 'undefined') {
        global.applyNSFWFilter = applyNSFWFilter;
        global.checkAndAddButton = checkAndAddButton;
        global.isNSFWContent = isNSFWContent;
        global.findButtonGroup = findButtonGroup;
    }
})(); 