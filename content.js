// Wait for sanitizer to be ready
async function waitForSanitizer() {
    let attempts = 0;
    while (!window.BetterLooksmaxSanitizer && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    if (!window.BetterLooksmaxSanitizer) {
        console.error('Critical: Sanitizer failed to load after 5 seconds');
        throw new Error('Sanitizer initialization failed');
    }
    return true;
}

// Apply CSS function
function applyCustomCSS(css) {
    // Security check: Block CSS if sanitizer is not available
    if (!window.BetterLooksmaxSanitizer) {
        console.error('Security: CSS sanitizer not loaded, blocking CSS application');
        return;
    }
    
    let styleElement = document.getElementById('custom-css');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-css';
        document.head.appendChild(styleElement);
    }
    // Sanitize CSS before applying to prevent injection attacks
    const sanitizedCSS = window.BetterLooksmaxSanitizer.sanitizeCSS(css || '');
    styleElement.textContent = sanitizedCSS;
}

// Wrapper for safe CSS application with sanitizer check
async function safeApplyCustomCSS(css) {
    await waitForSanitizer();
    applyCustomCSS(css);
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'applyCSS') {
        applyCustomCSS(request.css);
    }
});

// Apply saved CSS on page load
chrome.storage.local.get(['cssSettings'], function(result) {
    if (result.cssSettings?.enabled) {
        applyCustomCSS(result.cssSettings.styles);
    }
});

// Remove custom CSS function
function removeCustomCSS() {
    const styleElement = document.getElementById('custom-css');
    if (styleElement) {
        styleElement.remove();
        console.log('CSS removed');
    }
}

// Re-apply CSS after dynamic content changes with throttling
let applyThrottled = false;
const observer = new MutationObserver(() => {
    if (!applyThrottled) {
        applyThrottled = true;
        requestAnimationFrame(() => {
            chrome.storage.local.get(['cssSettings'], function(result) {
                if (result.cssSettings?.enabled && result.cssSettings?.styles) {
                    applyCustomCSS(result.cssSettings.styles);
                }
            });
            setTimeout(() => { applyThrottled = false; }, 100); // Throttle to max 10 times per second
        });
    }
});

// Start observing document changes
observer.observe(document.documentElement, { 
    childList: true,
    subtree: true 
});

// Cleanup when extension is updated/reloaded
if (chrome.runtime && chrome.runtime.connect) {
    try {
        const port = chrome.runtime.connect();
        port.onDisconnect.addListener(() => {
            observer.disconnect();
            removeCustomCSS();
        });
    } catch (e) {
        // Extension context might be invalidated
        console.log('Extension context unavailable');
    }
}

// Initialize CSS from storage once
async function initializeCSS() {
    try {
        await waitForSanitizer();
        chrome.storage.local.get(['cssSettings'], function(result) {
            if (result.cssSettings?.enabled && result.cssSettings?.styles) {
                applyCustomCSS(result.cssSettings.styles);
                console.log('Loaded saved CSS settings');
            }
        });
    } catch (error) {
        console.error('Failed to initialize CSS:', error);
    }
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
    chrome.storage.local.get(['customCSS', 'cssEnabled'], function(result) {
        console.log('Loaded CSS settings:', result);
        if (result.cssEnabled && result.customCSS) {
            applyCustomCSS(result.customCSS);
        }
    });
});

// Also check before DOMContentLoaded in case we're too late
chrome.storage.local.get(['customCSS', 'cssEnabled'], function(result) {
    if (result.cssEnabled && result.customCSS) {
        applyCustomCSS(result.customCSS);
    }
});

// Clean up function for when CSS is disabled
function cleanupCSS() {
    removeCustomCSS();
    chrome.storage.local.set({ cssEnabled: false });
}

// Handle cleanup when tab is closed or refreshed
window.addEventListener('unload', cleanupCSS);

// Add this at the start of your content script
chrome.storage.local.get(['darkTheme'], function(result) {
    if (result.darkTheme) {
        applyDarkTheme();
    }
});

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

    let style = document.getElementById('custom-theme');
    if (!style) {
        style = document.createElement('style');
        style.id = 'custom-theme';
        document.head.appendChild(style);
    }
    // Sanitize theme CSS before applying
    const sanitizedThemeCSS = window.BetterLooksmaxSanitizer.sanitizeCSS(css);
    style.textContent = sanitizedThemeCSS;
}

// Check for saved CSS on page load
chrome.storage.local.get(['cssSettings'], function(result) {
    if (result.cssSettings && result.cssSettings.enabled && result.cssSettings.styles) {
        applyCustomCSS(result.cssSettings.styles);
        console.log('Loaded saved CSS settings');
    }
});

// Notify that content script is ready
console.log('Content script loaded and initialized');

// Handle timer visibility
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'toggleTimer') {
        const timerElement = document.getElementById('siteTimer');
        if (timerElement) {
            timerElement.style.display = request.enabled ? 'block' : 'none';
        }
    }
});

// Check initial timer state
chrome.storage.local.get(['timerEnabled'], function(result) {
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
            const response = await fetch(chrome.runtime.getURL('settings.json'));
            const settings = await response.json();
            
            if (settings.cssSettings.enabled && settings.cssSettings.styles) {
                applyCustomCSS(settings.cssSettings.styles);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };
}