// Public Mode with Performance Optimizations
// Use the cross-browser API wrapper
const publicModeAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
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
        window.BetterLooksmaxRouter.registerFeature('publicMode', handleMessage);
        console.log('[PublicMode] Registered with message router');
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
        
        if (setting === SETTINGS_KEYS.PUBLIC_MODE || setting === SETTINGS_KEYS.IS_PUBLIC_MODE) {
            console.log(`[PublicMode] Received setting change: ${setting} = ${enabled}`);
            
            // Update our internal state without triggering another popup notification
            isPublicMode = enabled;
            
            // Update button appearance and apply/remove public mode
            updatePublicButtonState(enabled);
            
            if (enabled) {
                applyPublicModeStyles();
            } else {
                removePublicModeStyles();
            }
        }
    }
}

// Update button state without triggering events
function updatePublicButtonState(enabled) {
    const button = document.querySelector('.public-mode-button');
    if (button) {
        button.classList.toggle('is-active', enabled);
        const icon = button.querySelector('i');
        if (enabled) {
            icon.className = 'fas fa-eye';
            button.setAttribute('title', 'Exit Public Mode');
            button.setAttribute('aria-label', 'Exit Public Mode');
        } else {
            icon.className = 'fas fa-eye-slash';
            button.setAttribute('title', 'Public Mode');
            button.setAttribute('aria-label', 'Public Mode');
        }
    }
}

// Performance utilities (scoped to avoid conflicts)
var publicPerformanceUtils = null;
var publicElementCache = null;
var publicEventManager = null;
var publicThrottledOperations = null;

// Initialize performance utilities
function initPerformanceUtils() {
    if (window.BetterLooksmaxPerformance && !publicPerformanceUtils) {
        publicPerformanceUtils = window.BetterLooksmaxPerformance;
        publicElementCache = publicPerformanceUtils.cache;
        publicEventManager = new publicPerformanceUtils.EventManager();
        
        // Create throttled operations
        publicThrottledOperations = {
            replaceText: publicPerformanceUtils.throttle(replaceTextContentOptimized, 300),
            restoreText: publicPerformanceUtils.throttle(restoreTextContentOptimized, 200)
        };
        
        console.log('[PublicMode] Performance utilities initialized');
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

let isPublicMode = false;

// Cache for text replacement operations
const textReplacementCache = new Map();
let processedTextNodes = new WeakSet();

function togglePublicMode() {
    isPublicMode = !isPublicMode;

    // Save state
    publicModeAPI.storage.local.set({ isPublicMode });

    // Update button state
    updatePublicButtonState(isPublicMode);

    // Apply or remove public mode
    if (isPublicMode) {
        applyPublicModeStyles();
    } else {
        removePublicModeStyles();
    }

    // Notify popup of state change for bidirectional sync
    if (window.BetterLooksmaxRouter) {
        window.BetterLooksmaxRouter.notifyPopup('publicMode', isPublicMode);
        window.BetterLooksmaxRouter.notifyPopup('isPublicMode', isPublicMode);
    }
}

function applyPublicModeStyles() {
    // Add public mode styles with blur effects
    if (!document.querySelector('#public-mode-styles')) {
        const style = document.createElement('style');
        style.id = 'public-mode-styles';
        style.textContent = `
            /* Replace all avatars with default avatar */
            .avatar img, .avatarWrapper img, .memberAvatar img,
            .structItem-iconContainer img, .message-avatar img, 
            .message-avatar-wrapper img, .listAvatar img {
            content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") !important;
            filter: none !important;
            width: auto !important;
            height: auto !important;
            object-fit: cover !important;
            background-color: #00000090 !important;
            }
            
            /* Hide logos completely */
            .p-header-logo, .logo, .site-logo, .forum-logo,
            .navbar-brand, .header-logo, .banner, .top-banner {
            visibility: hidden !important;
            opacity: 0 !important;
            }
            
            /* Blur media content with proper dimensions - excluding emojis, icons, UI elements, specific badges, and reactions */
            img:not(.avatar img):not(.avatarWrapper img):not(.memberAvatar img):not(.structItem-iconContainer img):not(.message-avatar img):not(.message-avatar-wrapper img):not(.listAvatar img):not(.emoji):not(.reaction-emoji):not([alt*="emoji"]):not([src*="emoji"]):not([class*="emoji"]):not([class*="icon"]):not([width="16"]):not([width="20"]):not([width="24"]):not([height="16"]):not([height="20"]):not([height="24"]):not([src*="icons8-tiktok-verified-account-64-blue.svg"]):not([src*="check4.svg"]):not([src*="icons8-tiktok-verified-account-64-black.svg"]):not([src*="icons8-tiktok-verified-account-64-lightblue.svg"]):not([src*="dollar-symbol.svg"]):not([src*="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"]):not([class*="reaction"]):not([class*="react"]), 
            video, canvas,
            .signature img:not(.emoji):not([class*="emoji"]):not([class*="icon"]):not([src*="icons8-tiktok-verified-account-64-blue.svg"]):not([src*="check4.svg"]):not([src*="icons8-tiktok-verified-account-64-black.svg"]):not([src*="icons8-tiktok-verified-account-64-lightblue.svg"]):not([src*="dollar-symbol.svg"]):not([src*="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"]):not([class*="reaction"]):not([class*="react"]), 
            .message-signature img:not(.emoji):not([class*="emoji"]):not([class*="icon"]):not([src*="icons8-tiktok-verified-account-64-blue.svg"]):not([src*="check4.svg"]):not([src*="icons8-tiktok-verified-account-64-black.svg"]):not([src*="icons8-tiktok-verified-account-64-lightblue.svg"]):not([src*="dollar-symbol.svg"]):not([src*="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"]):not([class*="reaction"]):not([class*="react"]),
            .bbCodeBlock--signature img:not(.emoji):not([class*="emoji"]):not([class*="icon"]):not([src*="icons8-tiktok-verified-account-64-blue.svg"]):not([src*="check4.svg"]):not([src*="icons8-tiktok-verified-account-64-black.svg"]):not([src*="icons8-tiktok-verified-account-64-lightblue.svg"]):not([src*="dollar-symbol.svg"]):not([src*="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"]):not([class*="reaction"]):not([class*="react"]) {
            filter: blur(12px) !important;
            transition: filter 0.3s ease !important;
            object-fit: cover !important;
            overflow: hidden !important;
            }
            
            /* Blur signatures */
            .message-signature, .signature {
            filter: blur(3px) !important;
            transition: filter 0.3s ease !important;
            }
            
            /* Hover effects to reveal content */
            img:hover, video:hover, canvas:hover, iframe:hover, embed:hover, object:hover,
            .message-signature:hover, .signature:hover {
            filter: none !important;
            }
            
            /* Blur embedded media content */
            iframe, embed, object {
            filter: blur(8px) !important;
            transition: filter 0.3s ease !important;
            }
            
            
            @keyframes pulseOpacity {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Replace "looksmax" text with "finance" (visual only)
    if (publicThrottledOperations) {
        publicThrottledOperations.replaceText();
    } else {
        replaceTextContent();
    };
    
    // Don't show notification to avoid constant popups
}

function removePublicModeStyles() {
    // Remove public mode styles
    const style = document.querySelector('#public-mode-styles');
    if (style) {
        style.remove();
    }
    
    // Restore original text content
    if (publicThrottledOperations) {
        publicThrottledOperations.restoreText();
    } else {
        restoreTextContent();
    };
    
    // Remove any notifications
    const notification = document.querySelector('.public-mode-notification');
    if (notification) {
        notification.remove();
    }
}

// Optimized text replacement using performance utilities
function replaceTextContentOptimized() {
    if (!publicPerformanceUtils) {
        replaceTextContent(); // Fallback
        return;
    }

    console.log('[PublicMode] Replacing text content (optimized)...');
    
    // Store original text content for restoration
    if (!window.originalTextContent) {
        window.originalTextContent = new Map();
    }

    const textReplacements = [
        { from: /Looksmaxing/gi, to: 'Finance' },
        { from: /Looksmaxxing/gi, to: 'Finance' },
        { from: /Looksmax/gi, to: 'Finance' },
        { from: /nigger/gi, to: 'Black' }
    ];

    // Use document fragment for batched operations
    const operationsToProcess = [];
    
    // Create optimized walker that avoids reprocessing
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip already processed nodes
                if (processedTextNodes.has(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                
                // Skip input fields, textareas, and editable content
                const parent = node.parentElement;
                if (parent && (
                    parent.tagName === 'INPUT' ||
                    parent.tagName === 'TEXTAREA' ||
                    parent.isContentEditable ||
                    parent.closest('[contenteditable="true"]') ||
                    parent.closest('input') ||
                    parent.closest('textarea')
                )) {
                    return NodeFilter.FILTER_REJECT;
                }

                return /(looksmaxxing|looksmax|nigger)/i.test(node.textContent) ?
                    NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    // Batch text replacement operations
    textNodes.forEach(textNode => {
        if (!processedTextNodes.has(textNode)) {
            operationsToProcess.push(() => {
                if (!window.originalTextContent.has(textNode)) {
                    window.originalTextContent.set(textNode, textNode.textContent);
                }
                
                let content = textNode.textContent;
                textReplacements.forEach(({ from, to }) => {
                    content = content.replace(from, to);
                });
                
                textNode.textContent = content;
                processedTextNodes.add(textNode);
            });
        }
    });

    // Process operations in batches
    if (operationsToProcess.length > 0) {
        publicPerformanceUtils.batchDOMOperations(operationsToProcess).then(() => {
            console.log(`[PublicMode] Processed ${operationsToProcess.length} text nodes`);
        });
    }
}

// Original function as fallback
function replaceTextContent() {
    console.log('[PublicMode] Replacing text content (fallback)...');
    // Store original text content for restoration
    if (!window.originalTextContent) {
        window.originalTextContent = new Map();
    }

    // Find all text nodes containing "looksmax", "looksmaxxing", or "nig" (case insensitive)
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip input fields, textareas, and editable content
                const parent = node.parentElement;
                if (parent && (
                    parent.tagName === 'INPUT' ||
                    parent.tagName === 'TEXTAREA' ||
                    parent.isContentEditable ||
                    parent.closest('[contenteditable="true"]') ||
                    parent.closest('input') ||
                    parent.closest('textarea')
                )) {
                    return NodeFilter.FILTER_REJECT;
                }

                return /(looksmaxxing|looksmax|nigger)/i.test(node.textContent) ?
                    NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    textNodes.forEach(textNode => {
        if (!window.originalTextContent.has(textNode)) {
            window.originalTextContent.set(textNode, textNode.textContent);
        }
        textNode.textContent = textNode.textContent
            .replace(/Looksmaxing/gi, 'Finance')
            .replace(/Looksmaxxing/gi, 'Finance')
            .replace(/Looksmax/gi, 'Finance')
            .replace(/nigger/gi, 'Black');
    });
}

// Optimized text restoration using performance utilities
function restoreTextContentOptimized() {
    if (!publicPerformanceUtils || !window.originalTextContent || window.originalTextContent.size === 0) {
        restoreTextContent(); // Fallback
        return;
    }

    console.log('[PublicMode] Restoring text content (optimized)...');
    const operationsToProcess = [];
    
    window.originalTextContent.forEach((originalText, textNode) => {
        if (textNode.parentNode) {
            operationsToProcess.push(() => {
                textNode.textContent = originalText;
            });
        }
    });

    // Batch text restoration operations
    if (operationsToProcess.length > 0) {
        publicPerformanceUtils.batchDOMOperations(operationsToProcess).then(() => {
            window.originalTextContent.clear();
            processedTextNodes = new WeakSet(); // Reset processed nodes
            console.log(`[PublicMode] Restored ${operationsToProcess.length} text nodes`);
        });
    }
}

// Original function as fallback
function restoreTextContent() {
    console.log('[PublicMode] Restoring text content (fallback)...');
    if (window.originalTextContent) {
        window.originalTextContent.forEach((originalText, textNode) => {
            if (textNode.parentNode) {
                textNode.textContent = originalText;
            }
        });
        window.originalTextContent.clear();
    }
}

function showPublicModeNotification() {
    // Show a temporary notification about the mode
    const notification = document.createElement('div');
    notification.className = 'public-mode-notification';
    notification.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: rgba(0, 100, 0, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10001;
        transition: opacity 0.5s ease;
    `;
    // Create notification content safely
    const mainText = document.createTextNode('Public Mode Activated');
    const br = document.createElement('br');
    const small = document.createElement('small');
    small.textContent = 'Hover over blurred content to reveal temporarily';
    
    notification.appendChild(mainText);
    notification.appendChild(br);
    notification.appendChild(small);
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }
    }, 3000);
}

function createPublicModeButton() {
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'p-navgroup-link p-navgroup-link--iconic';
    button.setAttribute('title', 'Public Mode - Hide identifying content');
    button.setAttribute('aria-label', 'Public Mode - Hide identifying content');

    const icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.className = 'fas fa-eye-slash';

    button.appendChild(icon);

    // Add click handler with proper event management
    const clickHandler = (e) => {
        e.preventDefault();
        togglePublicMode();
    };
    
    if (publicEventManager) {
        publicEventManager.addListener(button, 'click', clickHandler);
    } else {
        button.addEventListener('click', clickHandler);
    };

    return button;
}

function addPublicModeButton() {
    // Find the navigation group with caching if available
    const navGroup = publicElementCache ? 
        publicElementCache.getSingle('.p-navgroup.p-discovery') : 
        document.querySelector('.p-navgroup.p-discovery');
    
    if (!navGroup) {
        console.warn('[PublicMode] Navigation group not found');
        return;
    }

    // Check if button already exists anywhere in the document
    const existingButton = publicElementCache ? 
        publicElementCache.getSingle('.public-mode-button') : 
        document.querySelector('.public-mode-button');
    
    if (existingButton) {
        console.log('[PublicMode] Button already exists');
        return;
    }

    const publicModeButton = createPublicModeButton();
    publicModeButton.classList.add('public-mode-button');

    // Insert before the search button
    const searchButton = navGroup.querySelector('.p-navgroup-link--search');
    if (searchButton) {
        navGroup.insertBefore(publicModeButton, searchButton);
    } else {
        navGroup.appendChild(publicModeButton);
    }

    // Load saved state and apply it
    publicModeAPI.storage.local.get(['isPublicMode'], (result) => {
        isPublicMode = result.isPublicMode || false;
        if (isPublicMode) {
            publicModeButton.classList.add('is-active');
            publicModeButton.querySelector('i').className = 'fas fa-eye';
            applyPublicModeStyles();
        }
    });
}

// Add keyboard shortcut (Ctrl+Shift+P) with proper event management
const keydownHandler = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePublicMode();
    }
};

if (publicEventManager) {
    publicEventManager.addListener(document, 'keydown', keydownHandler);
} else {
    document.addEventListener('keydown', keydownHandler);
}

// Cleanup function for memory leak prevention
function cleanup() {
    if (publicEventManager) {
        publicEventManager.cleanup();
    }
    
    // Clear text replacement cache
    if (window.originalTextContent) {
        window.originalTextContent.clear();
    }
    textReplacementCache.clear();
    
    console.log('[PublicMode] Cleanup completed');
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        registerWithMessageRouter();
        addPublicModeButton();
    });
} else {
    registerWithMessageRouter();
    addPublicModeButton();
}

// Expose functions for testing
if (typeof global !== 'undefined') {
    global.togglePublicMode = togglePublicMode;
    global.replaceTextContent = replaceTextContent;
    global.restoreTextContent = restoreTextContent;
    global.addPublicModeButton = addPublicModeButton;
    global.isPublicMode = isPublicMode;
}