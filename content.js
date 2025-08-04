// Apply CSS function
function applyCustomCSS(css) {
    let styleElement = document.getElementById('custom-css');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-css';
        document.head.appendChild(styleElement);
    }
    styleElement.textContent = css || '';
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

// Re-apply CSS after dynamic content changes
const observer = new MutationObserver(() => {
    chrome.storage.local.get(['cssSettings'], function(result) {
        if (result.cssSettings?.enabled && result.cssSettings?.styles) {
            applyCustomCSS(result.cssSettings.styles);
        }
    });
});

// Start observing document changes
observer.observe(document.documentElement, { 
    childList: true,
    subtree: true 
});

// Cleanup when extension is updated/reloaded
chrome.runtime.connect().onDisconnect.addListener(() => {
    observer.disconnect();
    removeCustomCSS();
});

// Initialize CSS from storage once
function initializeCSS() {
    chrome.storage.local.get(['cssSettings'], function(result) {
        if (result.cssSettings?.enabled && result.cssSettings?.styles) {
            applyCustomCSS(result.cssSettings.styles);
            console.log('Loaded saved CSS settings');
        }
    });
}

// Initialize everything when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeCSS();
        observer.observe(document.documentElement, { 
            childList: true,
            subtree: true 
        });
    });
} else {
    initializeCSS();
    observer.observe(document.documentElement, { 
        childList: true,
        subtree: true 
    });
}

// Cleanup when extension is updated/reloaded
chrome.runtime.connect().onDisconnect.addListener(() => {
    observer.disconnect();
});

// Load settings on page load
async function loadAndApplySettings() {
    try {
        const response = await fetch(chrome.runtime.getURL('settings.json'));
        const settings = await response.json();
        
        if (settings.cssSettings.enabled && settings.cssSettings.styles) {
            applyCustomCSS(settings.cssSettings.styles);
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadAndApplySettings);

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
    style.textContent = css;
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
chrome.runtime.sendMessage({ type: 'contentScriptReady' });

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