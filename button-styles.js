// Button Styles - Add active state styling for on-site buttons
(function() {
    'use strict';
    
    // Create and inject CSS for active button states
    function injectButtonStyles() {
        // Check if styles already exist
        if (document.getElementById('better-looksmax-button-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'better-looksmax-button-styles';
        style.textContent = `
            /* Active state for BetterLooksmax buttons */
            .p-navgroup-link.is-active {
                background-color: rgba(99, 102, 241, 0.15) !important;
                color: #6366f1 !important;
                box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3) !important;
                border-radius: 4px !important;
            }
            
            .p-navgroup-link.is-active:hover {
                background-color: rgba(99, 102, 241, 0.25) !important;
                color: #4f46e5 !important;
            }
            
            /* Ensure icons in active buttons are visible */
            .p-navgroup-link.is-active i {
                color: inherit !important;
                opacity: 1 !important;
            }
            
            /* Privacy dropdown active state */
            .privacy-dropdown-button.is-active {
                background-color: rgba(16, 185, 129, 0.15) !important;
                color: #10b981 !important;
                box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3) !important;
            }
            
            .privacy-dropdown-button.is-active:hover {
                background-color: rgba(16, 185, 129, 0.25) !important;
                color: #059669 !important;
            }
            
            /* Transition effects for smooth state changes */
            .p-navgroup-link, .privacy-dropdown-button {
                transition: all 0.2s ease !important;
            }
            
            /* Additional styling for better visual feedback */
            .grey-users-button.is-active {
                border-left: 3px solid #6366f1 !important;
            }
            
            .public-mode-button.is-active {
                border-left: 3px solid #f59e0b !important;
                background-color: rgba(245, 158, 11, 0.15) !important;
                color: #f59e0b !important;
            }
            
            .public-mode-button.is-active:hover {
                background-color: rgba(245, 158, 11, 0.25) !important;
            }
        `;
        
        // Add to head
        if (document.head) {
            document.head.appendChild(style);
            console.log('[ButtonStyles] Active button styles injected');
        } else {
            // Wait for head to be available
            const observer = new MutationObserver(() => {
                if (document.head) {
                    document.head.appendChild(style);
                    observer.disconnect();
                    console.log('[ButtonStyles] Active button styles injected (delayed)');
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }
    
    // Inject styles immediately or when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectButtonStyles);
    } else {
        injectButtonStyles();
    }
    
    // Also inject when the document changes (for dynamic content)
    if (document.body) {
        const observer = new MutationObserver(() => {
            if (!document.getElementById('better-looksmax-button-styles')) {
                injectButtonStyles();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
})();