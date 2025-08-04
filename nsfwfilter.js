// NSFW Filter Script
(function() {
    let lastCheckTime = 0;
    const CHECK_INTERVAL = 1000; // Only check every second
    const BUTTON_ID = 'nsfw-filter-button';

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
        return document.querySelector('.block-outer-opposite .buttonGroup') || 
               document.querySelector('.block-outer .buttonGroup') ||
               document.querySelector('.block-outer-opposite')?.querySelector('.buttonGroup') ||
               document.querySelector('.block-outer')?.querySelector('.buttonGroup') ||
               document.querySelector('.buttonGroup');
    }

    function checkAndAddButton() {
        const now = Date.now();
        if (now - lastCheckTime < CHECK_INTERVAL) {
            return;
        }
        lastCheckTime = now;

        // Check if button already exists
        if (document.getElementById(BUTTON_ID)) {
            return;
        }

        // Check if we're in a thread or forum page
        const isThread = window.location.pathname.includes('/threads/');
        const isForum = window.location.pathname.includes('/forums/');
        if (!isThread && !isForum) {
            return;
        }

        // Find the button group
        const buttonGroup = findButtonGroup();
        if (!buttonGroup) {
            return;
        }

        // Create the button
        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
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

        // Add click handler
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const isActive = this.classList.toggle('is-active');
            // Store the state
            chrome.storage.local.set({ nsfwFilterActive: isActive });
            // Apply the filter
            applyNSFWFilter(isActive);
            
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
        });

        // Add the button to the group
        buttonGroup.appendChild(button);

        // Check stored state and apply
        chrome.storage.local.get(['nsfwFilterActive'], (result) => {
            if (result.nsfwFilterActive) {
                button.classList.add('is-active');
                const icon = button.querySelector('i');
                const text = button.querySelector('.button-text');
                icon.className = 'fas fa-eye';
                text.textContent = 'NSFW';
                button.style.color = '#4f46e5';
                applyNSFWFilter(true);
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

    function applyNSFWFilter(active) {
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

    // Debounced version of checkAndAddButton
    const debouncedCheck = debounce(checkAndAddButton, 250);

    // Initial check
    checkAndAddButton();

    // Set up mutation observer for dynamic content with throttling
    let observerThrottled = false;
    const observer = new MutationObserver((mutations) => {
        if (!observerThrottled) {
            observerThrottled = true;
            requestAnimationFrame(() => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        debouncedCheck();
                        // Re-apply filter if active
                        chrome.storage.local.get(['nsfwFilterActive'], (result) => {
                            if (result.nsfwFilterActive) {
                                applyNSFWFilter(true);
                            }
                        });
                        break;
                    }
                }
                setTimeout(() => { observerThrottled = false; }, 100);
            });
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})(); 