// Use the cross-browser API wrapper
const greyFilterAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
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
        window.BetterLooksmaxRouter.registerFeature('greyFilter', handleMessage);
        console.log('[GreyFilter] Registered with message router');
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
        
        if (setting === SETTINGS_KEYS.GREY_FILTER || setting === SETTINGS_KEYS.IS_GREY_USERS_HIDDEN) {
            console.log(`[GreyFilter] Received setting change: ${setting} = ${enabled}`);
            
            // Update our internal state without triggering another popup notification
            isGreyUsersHidden = enabled;
            
            // Update button appearance
            updateGreyButtonState(enabled);
            
            // Apply or remove filter
            if (enabled) {
                applyGreyUserStyles();
                if (greyThrottledHideOperations) {
                    greyThrottledHideOperations.hideThreads();
                    greyThrottledHideOperations.hidePosts();
                    greyThrottledHideOperations.hideMembers();
                } else {
                    hideGreyThreads();
                    hideGreyPosts();
                    hideGreyMembers();
                }
            } else {
                removeGreyUserStyles();
                restoreHiddenElements();
            }
        }
    }
}

// Update button state without triggering events
function updateGreyButtonState(enabled) {
    const button = document.querySelector('.grey-users-button');
    if (button) {
        button.classList.toggle('is-active', enabled);
        const icon = button.querySelector('i');
        if (enabled) {
            icon.className = 'fas fa-user-check';
            button.setAttribute('title', 'Show Grey Users');
            button.setAttribute('aria-label', 'Show Grey Users');
        } else {
            icon.className = 'fas fa-user-slash';
            button.setAttribute('title', 'Hide Grey Users');
            button.setAttribute('aria-label', 'Hide Grey Users');
        }
    }
}

// Restore hidden elements efficiently
function restoreHiddenElements() {
    // Always restore all hidden elements, not just tracked ones
    const allHiddenElements = document.querySelectorAll('.structItem.hidden-grey-user, .message.hidden-grey-user, .listInline--comma li.hidden-grey-user, [data-grey-hidden="true"]');
    
    if (allHiddenElements.length > 0) {
        const restoreOperations = [];
        allHiddenElements.forEach(item => {
            restoreOperations.push(() => {
                item.style.display = '';
                item.classList.remove('hidden-grey-user');
                item.removeAttribute('data-grey-hidden');
            });
        });
        
        if (greyPerformanceUtils && restoreOperations.length > 0) {
            greyPerformanceUtils.batchDOMOperations(restoreOperations);
        } else {
            // Direct restoration if performance utils not available
            allHiddenElements.forEach(item => {
                item.style.display = '';
                item.classList.remove('hidden-grey-user');
                item.removeAttribute('data-grey-hidden');
            });
        }
    }
    
    // Clear the tracking sets
    hiddenElements.clear();
    processedElements.clear();
}

// Performance utilities and caches (scoped to avoid conflicts)
var greyPerformanceUtils = null;
var greyElementCache = null;
var greyEventManager = null;
var greyThrottledHideOperations = null;

// Initialize performance utilities
function initPerformanceUtils() {
    if (window.BetterLooksmaxPerformance && !greyPerformanceUtils) {
        greyPerformanceUtils = window.BetterLooksmaxPerformance;
        greyElementCache = greyPerformanceUtils.cache;
        greyEventManager = new greyPerformanceUtils.EventManager();
        
        // Create throttled versions of hide operations
        greyThrottledHideOperations = {
            hideThreads: greyPerformanceUtils.throttle(hideGreyThreadsOptimized, 300),
            hidePosts: greyPerformanceUtils.throttle(hideGreyPostsOptimized, 300),
            hideMembers: greyPerformanceUtils.throttle(hideGreyMembersOptimized, 300)
        };
        
        console.log('[GreyFilter] Performance utilities initialized');
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

// State variable and caches
let isGreyUsersHidden = false;
let greyCachedStyleElement = null;
const greyUserSelectors = '.username--style2, .username--style7, .username--style19';

// Cache for processed elements to avoid reprocessing
const processedElements = new Set();
const hiddenElements = new Set();

// Initialize state from storage with performance optimization
greyFilterAPI.storage.local.get(['isGreyUsersHidden'], (result) => {
    // Validate storage data before using
    const validated = window.StorageValidator ? 
        window.StorageValidator.validateStorageData(result) : result;
    isGreyUsersHidden = validated.isGreyUsersHidden === true;
    if (isGreyUsersHidden) {
        // Use optimized versions if available, otherwise fallback
        if (greyThrottledHideOperations) {
            greyThrottledHideOperations.hideThreads();
            greyThrottledHideOperations.hidePosts();
            greyThrottledHideOperations.hideMembers();
        } else {
            hideGreyThreads();
            hideGreyPosts();
            hideGreyMembers();
        }
        applyGreyUserStyles();
    }
});

// Optimized version using performance utilities
function hideGreyThreadsOptimized() {
    if (!greyElementCache) {
        hideGreyThreads(); // Fallback
        return;
    }

    console.log('Hiding grey threads (optimized)...');
    const threadContainers = greyElementCache.get('.structItem:not(.hidden-grey-user)');
    console.log('Found thread containers:', threadContainers.length);

    const operationsToHide = [];
    
    threadContainers.forEach(thread => {
        if (processedElements.has(thread)) return;
        
        try {
            const structItemParts = thread.querySelector('.structItem-parts');
            if (structItemParts) {
                const greyUser = structItemParts.querySelector(greyUserSelectors);
                if (greyUser) {
                    operationsToHide.push(() => {
                        thread.style.display = 'none';
                        thread.classList.add('hidden-grey-user');
                        hiddenElements.add(thread);
                        processedElements.add(thread);
                        const sanitizedUsername = window.SecurityUtils ? 
                            window.SecurityUtils.escapeText(greyUser.textContent) : greyUser.textContent;
                        console.log('Hiding thread started by grey user:', sanitizedUsername);
                    });
                } else {
                    processedElements.add(thread);
                }
            }
        } catch (error) {
            console.error('Error processing thread:', error);
        }
    });

    // Batch DOM operations
    if (operationsToHide.length > 0 && greyPerformanceUtils) {
        greyPerformanceUtils.batchDOMOperations(operationsToHide);
    }
}

// Original function as fallback
function hideGreyThreads() {
    console.log('Hiding grey threads...');
    const threadContainers = document.querySelectorAll('.structItem:not(.hidden-grey-user)');
    console.log('Found thread containers:', threadContainers.length);

    for (let i = 0; i < threadContainers.length; i++) {
        const thread = threadContainers[i];
        try {
            const structItemParts = thread.querySelector('.structItem-parts');
            if (structItemParts) {
                const greyUser = structItemParts.querySelector(greyUserSelectors);
                if (greyUser) {
                    const sanitizedUsername = window.SecurityUtils ? 
                        window.SecurityUtils.escapeText(greyUser.textContent) : greyUser.textContent;
                    console.log('Hiding thread started by grey user:', sanitizedUsername);
                    thread.style.display = 'none';
                    thread.classList.add('hidden-grey-user');
                }
            }
        } catch (error) {
            console.error('Error processing thread:', error);
        }
    }
}

// Optimized version using performance utilities
function hideGreyPostsOptimized() {
    if (!greyElementCache) {
        hideGreyPosts(); // Fallback
        return;
    }

    console.log('Hiding grey posts (optimized)...');
    const messageContainers = greyElementCache.get('.message:not(.hidden-grey-user)');
    console.log('Found message containers:', messageContainers.length);

    const operationsToHide = [];
    
    messageContainers.forEach(message => {
        if (processedElements.has(message)) return;
        
        try {
            const greyUser = message.querySelector(greyUserSelectors);
            if (greyUser) {
                operationsToHide.push(() => {
                    message.style.display = 'none';
                    message.classList.add('hidden-grey-user');
                    hiddenElements.add(message);
                    processedElements.add(message);
                    const sanitizedUsername = window.SecurityUtils ? 
                        window.SecurityUtils.escapeText(greyUser.textContent) : greyUser.textContent;
                    console.log('Hiding post by grey user:', sanitizedUsername);
                });
            } else {
                processedElements.add(message);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Batch DOM operations
    if (operationsToHide.length > 0 && greyPerformanceUtils) {
        greyPerformanceUtils.batchDOMOperations(operationsToHide);
    }
}

// Original function as fallback
function hideGreyPosts() {
    console.log('Hiding grey posts...');
    const messageContainers = document.querySelectorAll('.message:not(.hidden-grey-user)');
    console.log('Found message containers:', messageContainers.length);

    for (let i = 0; i < messageContainers.length; i++) {
        const message = messageContainers[i];
        try {
            const greyUser = message.querySelector(greyUserSelectors);
            if (greyUser) {
                const sanitizedUsername = window.SecurityUtils ? 
                    window.SecurityUtils.escapeText(greyUser.textContent) : greyUser.textContent;
                console.log('Hiding post by grey user:', sanitizedUsername);
                message.style.display = 'none';
                message.classList.add('hidden-grey-user');
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }
}

// Optimized version using performance utilities
function hideGreyMembersOptimized() {
    if (!greyElementCache) {
        hideGreyMembers(); // Fallback
        return;
    }

    console.log('Hiding grey members (optimized)...');
    const memberListItems = greyElementCache.get('.listInline--comma li:not(.hidden-grey-user)');
    console.log('Found member list items:', memberListItems.length);

    const operationsToHide = [];
    
    memberListItems.forEach(item => {
        if (processedElements.has(item)) return;
        
        try {
            const greyUser = item.querySelector(greyUserSelectors);
            if (greyUser) {
                operationsToHide.push(() => {
                    item.style.display = 'none';
                    item.classList.add('hidden-grey-user');
                    item.setAttribute('data-grey-hidden', 'true');
                    hiddenElements.add(item);
                    processedElements.add(item);
                    const sanitizedUsername = window.SecurityUtils ? 
                        window.SecurityUtils.escapeText(greyUser.textContent) : greyUser.textContent;
                    console.log('Hiding grey member:', sanitizedUsername);
                });
            } else {
                processedElements.add(item);
            }
        } catch (error) {
            console.error('Error processing member list item:', error);
        }
    });

    // Batch DOM operations
    if (operationsToHide.length > 0 && greyPerformanceUtils) {
        greyPerformanceUtils.batchDOMOperations(operationsToHide);
    }
}

// Original function as fallback
function hideGreyMembers() {
    console.log('Hiding grey members...');
    const memberListItems = document.querySelectorAll('.listInline--comma li:not(.hidden-grey-user)');
    console.log('Found member list items:', memberListItems.length);

    for (let i = 0; i < memberListItems.length; i++) {
        const item = memberListItems[i];
        try {
            const greyUser = item.querySelector(greyUserSelectors);
            if (greyUser) {
                const sanitizedUsername = window.SecurityUtils ? 
                    window.SecurityUtils.escapeText(greyUser.textContent) : greyUser.textContent;
                console.log('Hiding grey member:', sanitizedUsername);
                item.style.display = 'none';
                item.classList.add('hidden-grey-user');
                item.setAttribute('data-grey-hidden', 'true');
            }
        } catch (error) {
            console.error('Error processing member list item:', error);
        }
    }
}

function applyGreyUserStyles() {
    if (!greyCachedStyleElement) {
        greyCachedStyleElement = document.querySelector('#grey-users-style');
        if (!greyCachedStyleElement) {
            greyCachedStyleElement = document.createElement('style');
            greyCachedStyleElement.id = 'grey-users-style';
            // Use simpler class-based selectors instead of :has() for better performance
            greyCachedStyleElement.textContent = `
                .hidden-grey-user {
                    display: none !important;
                }
            `;
            document.head.appendChild(greyCachedStyleElement);
        }
    }
}

function removeGreyUserStyles() {
    if (greyCachedStyleElement) {
        greyCachedStyleElement.remove();
        greyCachedStyleElement = null;
    }
}

function toggleGreyUsers() {
    isGreyUsersHidden = !isGreyUsersHidden;
    greyFilterAPI.storage.local.set({ isGreyUsersHidden });

    // Update button state
    updateGreyButtonState(isGreyUsersHidden);

    // Apply or remove filter
    if (isGreyUsersHidden) {
        applyGreyUserStyles();
        // Use optimized versions if available
        if (greyThrottledHideOperations) {
            greyThrottledHideOperations.hideThreads();
            greyThrottledHideOperations.hidePosts();
            greyThrottledHideOperations.hideMembers();
        } else {
            hideGreyThreads();
            hideGreyPosts();
            hideGreyMembers();
        }
    } else {
        removeGreyUserStyles();
        restoreHiddenElements();
    }

    // Notify popup of state change for bidirectional sync
    if (window.BetterLooksmaxRouter) {
        window.BetterLooksmaxRouter.notifyPopup('greyFilter', isGreyUsersHidden);
        window.BetterLooksmaxRouter.notifyPopup('isGreyUsersHidden', isGreyUsersHidden);
    }
}

function createGreyUsersButton() {
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'p-navgroup-link p-navgroup-link--iconic grey-users-button';
    button.setAttribute('title', 'Hide Grey Users');
    button.setAttribute('aria-label', 'Hide Grey Users');
    const icon = document.createElement('i');
    icon.className = 'fas fa-user-slash';
    icon.style.fontSize = '16px';
    button.appendChild(icon);
    button.addEventListener('click', (e) => {
        e.preventDefault();
        toggleGreyUsers();
    });
    return button;
}

let addGreyUsersButtonRetries = 0;
const MAX_RETRIES = 10;

function addGreyUsersButton() {
    // Try different possible selectors for the navigation group
    const navGroup = document.querySelector('.p-navgroup.p-discovery') || 
                    document.querySelector('.p-navgroup') ||
                    document.querySelector('.p-navgroup-link--search')?.closest('.p-navgroup') ||
                    document.querySelector('.p-navgroup-link--iconic')?.closest('.p-navgroup') ||
                    document.querySelector('.p-navgroup-link')?.closest('.p-navgroup');
    
    console.log('Navigation group found:', navGroup);
    console.log('Current URL:', window.location.href);
    
    if (!navGroup) {
        if (addGreyUsersButtonRetries < MAX_RETRIES) {
            addGreyUsersButtonRetries++;
            console.log(`Navigation group not found, retry ${addGreyUsersButtonRetries}/${MAX_RETRIES}...`);
            setTimeout(addGreyUsersButton, 1000);
        } else {
            console.log('Max retries reached, stopping attempts to add grey users button');
        }
        return;
    }
    
    if (document.querySelector('.grey-users-button')) {
        console.log('Grey users button already exists');
        return;
    }

    const greyUsersButton = createGreyUsersButton();
    
    const searchButton = navGroup.querySelector('.p-navgroup-link--search') || 
                        navGroup.querySelector('.p-navgroup-link--iconic');
    console.log('Search button found:', searchButton);
    
    // Create privacy buttons with retry mechanism
    let filenameScramblingButton = null;
    let metadataRemovalButton = null;
    
    // Try to create buttons immediately
    if (typeof window.createFilenameScramblingButton === 'function') {
        filenameScramblingButton = window.createFilenameScramblingButton();
        console.log('Filename scrambling button created');
    } else {
        console.log('createFilenameScramblingButton function not available, will retry');
        // Retry after a short delay
        setTimeout(() => {
            if (typeof window.createFilenameScramblingButton === 'function') {
                const btn = window.createFilenameScramblingButton();
                const searchBtn = navGroup.querySelector('.p-navgroup-link--search') || 
                                 navGroup.querySelector('.p-navgroup-link--iconic');
                if (btn && searchBtn) {
                    navGroup.insertBefore(btn, searchBtn);
                    console.log('Filename scrambling button created and inserted on retry');
                } else if (btn) {
                    navGroup.appendChild(btn);
                    console.log('Filename scrambling button created and appended on retry');
                }
            }
        }, 500);
    }
    
    if (typeof window.createMetadataRemovalButton === 'function') {
        metadataRemovalButton = window.createMetadataRemovalButton();
        console.log('Metadata removal button created');
    } else {
        console.log('createMetadataRemovalButton function not available, will retry');
        // Retry after a short delay
        setTimeout(() => {
            if (typeof window.createMetadataRemovalButton === 'function') {
                const btn = window.createMetadataRemovalButton();
                const searchBtn = navGroup.querySelector('.p-navgroup-link--search') || 
                                 navGroup.querySelector('.p-navgroup-link--iconic');
                if (btn && searchBtn) {
                    navGroup.insertBefore(btn, searchBtn);
                    console.log('Metadata removal button created and inserted on retry');
                } else if (btn) {
                    navGroup.appendChild(btn);
                    console.log('Metadata removal button created and appended on retry');
                }
            }
        }, 500);
    }
    
    // Insert privacy buttons first, then grey users button
    if (searchButton) {
        if (filenameScramblingButton) {
            navGroup.insertBefore(filenameScramblingButton, searchButton);
            console.log('Filename scrambling button inserted before search button');
        }
        if (metadataRemovalButton) {
            navGroup.insertBefore(metadataRemovalButton, searchButton);
            console.log('Metadata removal button inserted before search button');
        }
        navGroup.insertBefore(greyUsersButton, searchButton);
        console.log('Grey users button inserted before search button');
    } else {
        if (filenameScramblingButton) {
            navGroup.appendChild(filenameScramblingButton);
            console.log('Filename scrambling button appended to navigation group');
        }
        if (metadataRemovalButton) {
            navGroup.appendChild(metadataRemovalButton);
            console.log('Metadata removal button appended to navigation group');
        }
        navGroup.appendChild(greyUsersButton);
        console.log('Grey users button appended to navigation group');
    }

    greyFilterAPI.storage.local.get(['isGreyUsersHidden'], (result) => {
        // Validate storage data before using
        const validated = window.StorageValidator ? 
            window.StorageValidator.validateStorageData(result) : result;
        isGreyUsersHidden = validated.isGreyUsersHidden === true;
        if (isGreyUsersHidden) {
            greyUsersButton.classList.add('is-active');
            greyUsersButton.querySelector('i').className = 'fas fa-user-check';
            greyUsersButton.setAttribute('title', 'Show Grey Users');
            greyUsersButton.setAttribute('aria-label', 'Show Grey Users');
            applyGreyUserStyles();
            hideGreyThreads();
            hideGreyPosts();
            hideGreyMembers();
        }
    });
}

// Create optimized observer to handle dynamically added content
let greyContentObserver = null;

function initializeGreyObserver() {
    if (greyContentObserver) return;

    if (greyPerformanceUtils) {
        // Use optimized FilteredMutationObserver
        const throttledProcess = greyPerformanceUtils.throttle(() => {
            if (isGreyUsersHidden) {
                if (greyThrottledHideOperations) {
                    greyThrottledHideOperations.hideThreads();
                    greyThrottledHideOperations.hidePosts();
                    greyThrottledHideOperations.hideMembers();
                } else {
                    hideGreyThreads();
                    hideGreyPosts();
                    hideGreyMembers();
                }
            }
        }, 300);

        greyContentObserver = new greyPerformanceUtils.FilteredMutationObserver(throttledProcess);
        
        // Add intelligent filters for relevant mutations only
        greyContentObserver.addFilter(mutation => {
            return mutation.type === 'childList' && 
                   mutation.addedNodes.length > 0 &&
                   Array.from(mutation.addedNodes).some(node => 
                       node.nodeType === Node.ELEMENT_NODE &&
                       (node.matches && (
                           node.matches('.structItem') || 
                           node.matches('.message') ||
                           node.matches('.listInline--comma li')
                       )) ||
                       (node.querySelector && (
                           node.querySelector('.structItem') ||
                           node.querySelector('.message') ||
                           node.querySelector('.listInline--comma li')
                       ))
                   );
        });
        
        greyContentObserver.observe(document.body);
    } else {
        // Fallback to improved but basic observer
        let greyThrottled = false;
        let isProcessingMutation = false;
        
        greyContentObserver = new MutationObserver((mutations) => {
            if (isGreyUsersHidden && !greyThrottled && !isProcessingMutation) {
                greyThrottled = true;
                requestAnimationFrame(() => {
                    // Check if any relevant nodes were actually added
                    let hasRelevantNodes = false;
                    for (const mutation of mutations) {
                        if (mutation.addedNodes.length) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE && 
                                    (node.classList?.contains('structItem') || 
                                     node.classList?.contains('message') ||
                                     node.classList?.contains('listInline--comma') ||
                                     node.querySelector?.('.structItem, .message, .listInline--comma li'))) {
                                    hasRelevantNodes = true;
                                    break;
                                }
                            }
                        }
                        if (hasRelevantNodes) break;
                    }
                    
                    if (hasRelevantNodes) {
                        isProcessingMutation = true;
                        hideGreyThreads();
                        hideGreyPosts();
                        hideGreyMembers();
                        setTimeout(() => { isProcessingMutation = false; }, 50);
                    }
                    setTimeout(() => { greyThrottled = false; }, 300); // Increased throttle time
                });
            }
        });
        
        greyContentObserver.observe(document.body, { childList: true, subtree: true });
    }
}

// Also add a mutation observer specifically for the navigation group with throttling
let navThrottled = false;
const navObserver = new MutationObserver((mutations) => {
    if (!document.querySelector('.grey-users-button') && !navThrottled) {
        navThrottled = true;
        requestAnimationFrame(() => {
            console.log('Navigation changed, attempting to add grey users button');
            addGreyUsersButton();
            setTimeout(() => { navThrottled = false; }, 100);
        });
    }
});

// Cleanup function for memory leak prevention
function cleanup() {
    if (greyContentObserver) {
        greyContentObserver.disconnect();
        greyContentObserver = null;
    }
    if (navObserver) {
        navObserver.disconnect();
    }
    if (greyEventManager) {
        greyEventManager.cleanup();
    }
    removeGreyUserStyles();
    greyCachedStyleElement = null;
    // Clear the tracking sets
    hiddenElements.clear();
    processedElements.clear();
    console.log('[GreyFilter] Cleanup completed');
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        registerWithMessageRouter();
        addGreyUsersButton();
        initializeGreyObserver();
        navObserver.observe(document.body, { childList: true, subtree: true });
    });
} else {
    registerWithMessageRouter();
    addGreyUsersButton();
    initializeGreyObserver();
    navObserver.observe(document.body, { childList: true, subtree: true });
}

// Expose functions for testing
if (typeof global !== 'undefined') {
    global.hideGreyThreads = hideGreyThreads;
    global.hideGreyPosts = hideGreyPosts;
    global.hideGreyMembers = hideGreyMembers;
    global.applyGreyUserStyles = applyGreyUserStyles;
    global.removeGreyUserStyles = removeGreyUserStyles;
    global.toggleGreyUsers = toggleGreyUsers;
    global.createGreyUsersButton = createGreyUsersButton;
    global.addGreyUsersButton = addGreyUsersButton;
    global.isGreyUsersHidden = isGreyUsersHidden;
}