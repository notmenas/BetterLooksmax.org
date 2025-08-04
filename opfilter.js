// OP Posts Filter with Performance Optimizations
// Use the cross-browser API wrapper
const opFilterAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
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
        window.BetterLooksmaxRouter.registerFeature('opFilter', handleMessage);
        console.log('[OPFilter] Registered with message router');
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
        
        if (setting === SETTINGS_KEYS.OP_FILTER) {
            console.log(`[OPFilter] Received setting change: ${setting} = ${enabled}`);
            
            // Update OP filter state
            isOPOnly = enabled;
            updateFilterState(enabled);
        }
    }
}

// Update filter state
function updateFilterState(enabled) {
    console.log(`[OPFilter] Filter state updated: ${enabled}`);
    // This will need to call the existing toggle function when I can see it
}

// Performance utilities (scoped to avoid conflicts)
var opPerformanceUtils = null;
var opElementCache = null;
var opEventManager = null;
var opThrottledOperations = null;

// Initialize performance utilities
function initPerformanceUtils() {
    if (window.BetterLooksmaxPerformance && !opPerformanceUtils) {
        opPerformanceUtils = window.BetterLooksmaxPerformance;
        opElementCache = opPerformanceUtils.cache;
        opEventManager = new opPerformanceUtils.EventManager();
        
        // Create throttled operations
        // NOTE: Don't throttle getOPUsername as it needs to return a value synchronously
        opThrottledOperations = {
            togglePosts: opPerformanceUtils.throttle(toggleOPPostsOptimized, 250),
            ensureButton: opPerformanceUtils.throttle(ensureButtonAddedOptimized, 300)
        };
        
        console.log('[OPFilter] Performance utilities initialized');
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

let isOPOnly = false;
let cachedOPUsername = null;
let cachedButton = null;

// Cache for processed elements
const processedPosts = new WeakSet();
const hiddenPosts = new Set();

// Optimized OP username detection using element caching
function getOPUsernameOptimized() {
    if (cachedOPUsername) {
        return cachedOPUsername;
    }
    
    if (!opElementCache) {
        return getOPUsername(); // Fallback
    }
    
    console.log('[OPFilter] Getting OP username (optimized)...');
    
    // Method 1: Look for OP indicator (original method from first commit)
    const opIcons = opElementCache.get('i[title="OP"]');
    for (const opIcon of opIcons) {
        // IMPORTANT: Original code looked for 'li' parent, not message/post container
        const listItem = opIcon.closest('li');
        if (listItem) {
            const usernameElement = listItem.querySelector('.username');
            if (usernameElement) {
                cachedOPUsername = usernameElement.textContent.trim();
                console.log('[OPFilter] Found OP username from OP indicator in li (optimized):', cachedOPUsername);
                return cachedOPUsername;
            }
        }
    }

    // Method 2: Fallback to first post if OP indicator not found (original fallback)
    const firstPost = opElementCache.getSingle('.message--post');
    if (firstPost) {
        const usernameElement = firstPost.querySelector('.username');
        if (usernameElement) {
            cachedOPUsername = usernameElement.textContent.trim();
            console.log('[OPFilter] Found OP username from first post (optimized):', cachedOPUsername);
            return cachedOPUsername;
        }
    }

    console.warn('[OPFilter] Could not find OP username with optimized methods, trying fallback');
    return getOPUsername(); // Use fallback method as last resort
}

// Original function as fallback
function getOPUsername() {
    if (cachedOPUsername) {
        return cachedOPUsername;
    }
    
    console.log('[OPFilter] Getting OP username (fallback)...');
    
    // Method 1: Look for OP indicator badge (original method from first commit)
    const opIcons = document.querySelectorAll('i[title="OP"]');
    console.log('[OPFilter] Found OP indicators:', opIcons.length);
    for (let i = 0; i < opIcons.length; i++) {
        const opIcon = opIcons[i];
        // IMPORTANT: Original code looked for 'li' parent, not message/post container
        const listItem = opIcon.closest('li');
        if (listItem) {
            const usernameElement = listItem.querySelector('.username');
            if (usernameElement) {
                cachedOPUsername = usernameElement.textContent.trim();
                console.log('[OPFilter] Found OP username from OP indicator in li:', cachedOPUsername);
                return cachedOPUsername;
            }
        }
    }

    // Method 2: Fallback to first post if OP indicator not found (original fallback)
    const firstPost = document.querySelector('.message--post');
    if (firstPost) {
        const usernameElement = firstPost.querySelector('.username');
        if (usernameElement) {
            cachedOPUsername = usernameElement.textContent.trim();
            console.log('[OPFilter] Found OP username from first post:', cachedOPUsername);
            return cachedOPUsername;
        }
    }

    // Method 3: Try additional selectors for different forum layouts
    const alternativeFirstPost = document.querySelector('article.message:first-of-type, .block-container .message:first-of-type');
    if (alternativeFirstPost) {
        // Try multiple selectors for username element
        const usernameSelectors = [
            '.username',
            '.message-name a',
            '[itemprop="name"]',
            '.message-userDetails a[href*="/members/"]',
            '.message-user a.username',
            'h4.message-name a'
        ];
        
        for (const selector of usernameSelectors) {
            const usernameElement = alternativeFirstPost.querySelector(selector);
            if (usernameElement) {
                cachedOPUsername = usernameElement.textContent.trim();
                console.log('[OPFilter] Found OP username from first post using selector:', selector, '=', cachedOPUsername);
                return cachedOPUsername;
            }
        }
    }

    // Method 4: Look for thread starter info in breadcrumb or header
    const threadStarter = document.querySelector('.p-description a.username, .p-breadcrumbs a.username');
    if (threadStarter) {
        cachedOPUsername = threadStarter.textContent.trim();
        console.log('[OPFilter] Found OP username from thread info:', cachedOPUsername);
        return cachedOPUsername;
    }

    console.warn('[OPFilter] Could not find OP username with any method');
    return null;
}

// Optimized toggle function using performance utilities
function toggleOPPostsOptimized() {
    // Don't use throttled operation for getting username as it needs to return immediately
    const opUsername = opElementCache ? getOPUsernameOptimized() : getOPUsername();
    
    if (!opUsername) {
        console.warn('[OPFilter] No OP username found');
        // Show user-friendly alert
        const button = document.querySelector('#op-filter-button');
        if (button) {
            // Flash the button to indicate error
            const originalColor = button.style.backgroundColor;
            button.style.backgroundColor = '#ff4444';
            button.style.transition = 'background-color 0.3s';
            setTimeout(() => {
                button.style.backgroundColor = originalColor;
            }, 500);
        }
        return;
    }

    isOPOnly = !isOPOnly;
    console.log(`[OPFilter] Toggling OP filter (optimized): ${isOPOnly}`);
    
    // Update button state
    updateButtonState();

    if (!opElementCache) {
        toggleOPPosts(); // Fallback
        return;
    }

    const posts = opElementCache.get('.message--post');
    const operationsToProcess = [];
    let visibleCount = 0;
    let hiddenCount = 0;

    posts.forEach(post => {
        const usernameElement = post.querySelector('.username');
        if (usernameElement) {
            const isOP = usernameElement.textContent.trim() === opUsername;
            
            operationsToProcess.push(() => {
                if (isOPOnly) {
                    post.style.display = isOP ? '' : 'none';
                    if (isOP) {
                        visibleCount++;
                        hiddenPosts.delete(post);
                    } else {
                        hiddenCount++;
                        hiddenPosts.add(post);
                    }
                } else {
                    post.style.display = '';
                    hiddenPosts.delete(post);
                }
                processedPosts.add(post);
            });
        }
    });

    // Batch DOM operations
    if (operationsToProcess.length > 0 && opPerformanceUtils) {
        opPerformanceUtils.batchDOMOperations(operationsToProcess).then(() => {
            console.log(`[OPFilter] Processed ${posts.length} posts: ${visibleCount} visible, ${hiddenCount} hidden`);
        });
    }

    // Save state
    opFilterAPI.storage.local.set({ isOPOnly });
}

// Helper function to update button state
function updateButtonState() {
    if (!cachedButton) {
        cachedButton = opElementCache ? 
            opElementCache.getSingle('#op-filter-button') : 
            document.querySelector('#op-filter-button');
    }
    
    if (cachedButton) {
        cachedButton.setAttribute('aria-pressed', isOPOnly);
        cachedButton.classList.toggle('is-active', isOPOnly);
        cachedButton.title = isOPOnly ? 'Show All Posts' : 'Show Only OP Posts';
        
        // Update icon and text
        const icon = cachedButton.querySelector('i');
        const text = cachedButton.querySelector('.button-text');
        
        if (isOPOnly) {
            icon.className = 'fas fa-user-check';
            icon.style.color = '#007bff';
            text.style.color = '#007bff';
        } else {
            icon.className = 'fas fa-user';
            icon.style.color = '';
            text.style.color = '';
        }
    }
}

// Original function as fallback
function toggleOPPosts() {
    const opUsername = getOPUsername();
    if (!opUsername) {
        console.warn('[OPFilter] Cannot toggle - no OP username found');
        // Show user-friendly alert
        const button = document.querySelector('#op-filter-button');
        if (button) {
            // Flash the button to indicate error
            const originalColor = button.style.backgroundColor;
            button.style.backgroundColor = '#ff4444';
            button.style.transition = 'background-color 0.3s';
            setTimeout(() => {
                button.style.backgroundColor = originalColor;
            }, 500);
        }
        return;
    }

    isOPOnly = !isOPOnly;
    console.log(`[OPFilter] Toggling OP filter (fallback): ${isOPOnly}`);
    
    updateButtonState();

    // Try multiple selectors for posts
    const postSelectors = ['.message--post', 'article.message', '.block-container .message'];
    let posts = [];
    for (const selector of postSelectors) {
        posts = document.querySelectorAll(selector);
        if (posts.length > 0) {
            console.log(`[OPFilter] Found posts using selector: ${selector}`);
            break;
        }
    }

    if (posts.length === 0) {
        console.warn('[OPFilter] No posts found to filter');
        return;
    }

    let visibleCount = 0;
    let hiddenCount = 0;

    // Use for loop for better performance with early exit
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        // Try multiple username selectors
        const usernameSelectors = [
            '.username',
            '.message-name',
            '[itemprop="name"]',
            '.message-userDetails a[href*="/members/"]',
            '.message-user a.username',
            'h4.message-name a'
        ];
        
        let usernameElement = null;
        for (const selector of usernameSelectors) {
            usernameElement = post.querySelector(selector);
            if (usernameElement) break;
        }
        
        if (usernameElement) {
            const isOP = usernameElement.textContent.trim() === opUsername;
            if (isOPOnly) {
                post.style.display = isOP ? '' : 'none';
                if (isOP) visibleCount++;
                else hiddenCount++;
            } else {
                post.style.display = '';
            }
        }
    }

    console.log(`[OPFilter] Processed ${posts.length} posts: ${visibleCount} visible, ${hiddenCount} hidden`);
    // Save state
    opFilterAPI.storage.local.set({ isOPOnly });
}

// Function to create and add the OP filter button
function createOPFilterButton() {
    // Check if button already exists
    if (document.querySelector('#op-filter-button')) return;

    const button = document.createElement('a');
    button.id = 'op-filter-button';
    button.href = '#';
    button.className = 'button--link button';
    button.setAttribute('aria-pressed', 'false');
    button.title = 'Show Only OP Posts';
    button.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
    `;

    // Create icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-user';
    icon.style.cssText = `
        font-size: 16px;
        transition: all 0.2s;
    `;

    // Create text
    const text = document.createElement('span');
    text.className = 'button-text';
    text.textContent = 'OP';
    text.style.cssText = `
        transition: color 0.2s;
    `;

    button.appendChild(icon);
    button.appendChild(text);

    // Add click handler with proper event management
    const clickHandler = (e) => {
        e.preventDefault();
        if (opThrottledOperations) {
            opThrottledOperations.togglePosts();
        } else {
            toggleOPPosts();
        }
    };
    
    if (opEventManager) {
        opEventManager.addListener(button, 'click', clickHandler);
    } else {
        button.addEventListener('click', clickHandler);
    }

    // Find the button group
    const buttonGroup = document.querySelector('.block-outer-opposite .buttonGroup');
    
    if (buttonGroup) {
        // Insert before the NSFW button
        const nsfwButton = buttonGroup.querySelector('.nsfw-button');
        if (nsfwButton) {
            buttonGroup.insertBefore(button, nsfwButton);
        } else {
            buttonGroup.appendChild(button);
        }
    } else {
        // Retry after a short delay
        setTimeout(createOPFilterButton, 1000);
    }
}

// Optimized button creation check
function ensureButtonAddedOptimized() {
    if (!opElementCache) {
        ensureButtonAdded(); // Fallback
        return;
    }
    
    const existingButton = opElementCache.getSingle('#op-filter-button');
    if (!existingButton) {
        createOPFilterButtonOptimized();
    }
}

// Optimized button creation
function createOPFilterButtonOptimized() {
    if (!opElementCache) {
        createOPFilterButton(); // Fallback
        return;
    }
    
    // Check if button already exists
    const existingButton = opElementCache.getSingle('#op-filter-button');
    if (existingButton) return;
    
    // Find the button group with caching
    const buttonGroup = opElementCache.getSingle('.block-outer-opposite .buttonGroup') ||
                      opElementCache.getSingle('.block-outer .buttonGroup') ||
                      opElementCache.getSingle('.buttonGroup');
    
    if (buttonGroup) {
        const button = createButtonElement();
        
        // Insert before the NSFW button
        const nsfwButton = buttonGroup.querySelector('.nsfw-button');
        if (nsfwButton) {
            buttonGroup.insertBefore(button, nsfwButton);
        } else {
            buttonGroup.appendChild(button);
        }
        
        console.log('[OPFilter] Button created and added (optimized)');
    } else {
        // Use waitForElement utility if available
        if (opPerformanceUtils) {
            opPerformanceUtils.waitForElement('.buttonGroup', 5000)
                .then(buttonGroup => {
                    const button = createButtonElement();
                    buttonGroup.appendChild(button);
                    console.log('[OPFilter] Button created after waiting for element');
                })
                .catch(() => {
                    console.warn('[OPFilter] Button group not found after waiting');
                });
        } else {
            // Fallback retry
            setTimeout(() => createOPFilterButtonOptimized(), 1000);
        }
    }
}

// Helper function to create button element
function createButtonElement() {
    const button = document.createElement('a');
    button.id = 'op-filter-button';
    button.href = '#';
    button.className = 'button--link button';
    button.setAttribute('aria-pressed', 'false');
    button.title = 'Show Only OP Posts';
    button.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
    `;

    // Create icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-user';
    icon.style.cssText = `
        font-size: 16px;
        transition: all 0.2s;
    `;

    // Create text
    const text = document.createElement('span');
    text.className = 'button-text';
    text.textContent = 'OP';
    text.style.cssText = `
        transition: color 0.2s;
    `;

    button.appendChild(icon);
    button.appendChild(text);

    // Add click handler with proper event management
    const clickHandler = (e) => {
        e.preventDefault();
        if (opThrottledOperations) {
            opThrottledOperations.togglePosts();
        } else {
            toggleOPPosts();
        }
    };
    
    if (opEventManager) {
        opEventManager.addListener(button, 'click', clickHandler);
    } else {
        button.addEventListener('click', clickHandler);
    }
    
    return button;
}

// Original function as fallback
function ensureButtonAdded() {
    if (!document.querySelector('#op-filter-button')) {
        createOPFilterButton();
    }
}

// Load saved state with optimization
opFilterAPI.storage.local.get(['isOPOnly'], (result) => {
    // Validate storage data before using
    const validated = window.StorageValidator ? 
        window.StorageValidator.validateStorageData(result) : result;
    isOPOnly = validated.isOPOnly === true;
    if (isOPOnly) {
        console.log('[OPFilter] Restoring OP-only state');
        
        if (opPerformanceUtils) {
            // Use waitForElement utility
            opPerformanceUtils.waitForElement('.message--post', 5000)
                .then(() => {
                    if (opThrottledOperations) {
                        opThrottledOperations.togglePosts();
                    } else {
                        toggleOPPosts();
                    }
                })
                .catch(() => {
                    console.warn('[OPFilter] Posts not found when restoring state');
                });
        } else {
            // Fallback to mutation observer
            let stateThrottled = false;
            const stateObserver = new MutationObserver((mutations, obs) => {
                if (!stateThrottled && document.querySelector('.message--post')) {
                    stateThrottled = true;
                    requestAnimationFrame(() => {
                        toggleOPPosts();
                        obs.disconnect();
                    });
                }
            });

            stateObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
});

// Create optimized observer for dynamic content
let opContentObserver = null;

function initializeOPObserver() {
    if (opContentObserver) return;

    if (opPerformanceUtils) {
        // Use optimized FilteredMutationObserver
        const throttledProcess = opPerformanceUtils.throttle(() => {
            if (opThrottledOperations) {
                opThrottledOperations.ensureButton();
            } else {
                ensureButtonAdded();
            }
        }, 300);

        opContentObserver = new opPerformanceUtils.FilteredMutationObserver(throttledProcess);
        
        // Add intelligent filters for relevant mutations only
        opContentObserver.addFilter(mutation => {
            return mutation.type === 'childList' && 
                   mutation.addedNodes.length > 0 &&
                   Array.from(mutation.addedNodes).some(node => 
                       node.nodeType === Node.ELEMENT_NODE &&
                       (node.matches && (
                           node.matches('.buttonGroup') || 
                           node.matches('.message--post') ||
                           node.matches('.block-outer')
                       )) ||
                       (node.querySelector && (
                           node.querySelector('.buttonGroup') ||
                           node.querySelector('.message--post') ||
                           node.querySelector('.block-outer')
                       ))
                   );
        });
        
        opContentObserver.observe(document.body);
    } else {
        // Fallback to improved basic observer
        let contentThrottled = false;
        opContentObserver = new MutationObserver((mutations) => {
            if (!contentThrottled) {
                contentThrottled = true;
                requestAnimationFrame(() => {
                    let hasRelevantNodes = false;
                    for (const mutation of mutations) {
                        if (mutation.addedNodes.length) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE && 
                                    (node.classList?.contains('buttonGroup') || 
                                     node.classList?.contains('message--post') ||
                                     node.classList?.contains('block-outer') ||
                                     node.querySelector?.('.buttonGroup, .message--post, .block-outer'))) {
                                    hasRelevantNodes = true;
                                    break;
                                }
                            }
                        }
                        if (hasRelevantNodes) break;
                    }
                    
                    if (hasRelevantNodes) {
                        ensureButtonAdded();
                    }
                    setTimeout(() => { contentThrottled = false; }, 300);
                });
            }
        });
        
        opContentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize when the page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (opThrottledOperations) {
            opThrottledOperations.ensureButton();
        } else {
            ensureButtonAdded();
        }
        initializeOPObserver();
    });
} else {
    if (opThrottledOperations) {
        opThrottledOperations.ensureButton();
    } else {
        ensureButtonAdded();
    }
    initializeOPObserver();
}

// Cleanup function for memory leak prevention
function cleanup() {
    if (opContentObserver) {
        opContentObserver.disconnect();
        opContentObserver = null;
    }
    if (opEventManager) {
        opEventManager.cleanup();
    }
    cachedOPUsername = null;
    cachedButton = null;
    hiddenPosts.clear();
    console.log('[OPFilter] Cleanup completed');
}

// Add cleanup on page unload
// Initialize message router registration
registerWithMessageRouter();

window.addEventListener('beforeunload', cleanup);

// Expose functions for testing
if (typeof global !== 'undefined') {
    global.getOPUsername = getOPUsername;
    global.toggleOPPosts = toggleOPPosts;
    global.createOPFilterButton = createOPFilterButton;
    global.ensureButtonAdded = ensureButtonAdded;
    global.isOPOnly = isOPOnly;
} 