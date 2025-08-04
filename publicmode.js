let isPublicMode = false;

function togglePublicMode() {
    isPublicMode = !isPublicMode;

    // Save state
    chrome.storage.local.set({ isPublicMode });

    // Update button appearance
    const button = document.querySelector('.public-mode-button');
    if (button) {
        button.classList.toggle('is-active', isPublicMode);
        const icon = button.querySelector('i');

        if (isPublicMode) {
            icon.className = 'fas fa-eye';
            button.setAttribute('title', 'Exit Public Mode');
            button.setAttribute('aria-label', 'Exit Public Mode');
            applyPublicModeStyles();
        } else {
            icon.className = 'fas fa-eye-slash';
            button.setAttribute('title', 'Public Mode');
            button.setAttribute('aria-label', 'Public Mode');
            removePublicModeStyles();
        }
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
    replaceTextContent();
    
    // Don't show notification to avoid constant popups
}

function removePublicModeStyles() {
    // Remove public mode styles
    const style = document.querySelector('#public-mode-styles');
    if (style) {
        style.remove();
    }
    
    // Restore original text content
    restoreTextContent();
    
    // Remove any notifications
    const notification = document.querySelector('.public-mode-notification');
    if (notification) {
        notification.remove();
    }
}

function replaceTextContent() {
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

                return /(looksmaxxing|looksmax|nigger|looksmaxxing)/i.test(node.textContent) ?
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

function restoreTextContent() {
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
    button.href = 'javascript:void(0)';
    button.className = 'p-navgroup-link p-navgroup-link--iconic';
    button.setAttribute('title', 'Public Mode - Hide identifying content');
    button.setAttribute('aria-label', 'Public Mode - Hide identifying content');

    const icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.className = 'fas fa-eye-slash';

    button.appendChild(icon);

    // Add click handler
    button.addEventListener('click', (e) => {
        e.preventDefault();
        togglePublicMode();
    });

    return button;
}

function addPublicModeButton() {
    // Find the navigation group
    const navGroup = document.querySelector('.p-navgroup.p-discovery');
    if (!navGroup) return;

    // Check if button already exists anywhere in the document
    if (document.querySelector('.public-mode-button')) {
        console.log('Public mode button already exists');
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
    chrome.storage.local.get(['isPublicMode'], (result) => {
        isPublicMode = result.isPublicMode || false;
        if (isPublicMode) {
            publicModeButton.classList.add('is-active');
            publicModeButton.querySelector('i').className = 'fas fa-eye';
            applyPublicModeStyles();
        }
    });
}

// Add keyboard shortcut (Ctrl+Shift+P)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePublicMode();
    }
});

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPublicModeButton);
} else {
    addPublicModeButton();
}