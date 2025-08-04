// OP Posts Filter
let isOPOnly = false;

// Function to get the OP's username
function getOPUsername() {
    // Look for the OP indicator under the thread title
    const opIndicator = document.querySelector('li:has(i[title="OP"])');
    if (opIndicator) {
        const usernameElement = opIndicator.querySelector('.username');
        if (usernameElement) {
            return usernameElement.textContent.trim();
        }
    }

    // Fallback to first post if OP indicator not found
    const firstPost = document.querySelector('.message--post');
    if (firstPost) {
        const usernameElement = firstPost.querySelector('.username');
        return usernameElement ? usernameElement.textContent.trim() : null;
    }

    return null;
}

// Function to toggle OP posts visibility
function toggleOPPosts() {
    const opUsername = getOPUsername();
    if (!opUsername) return;

    isOPOnly = !isOPOnly;
    const button = document.querySelector('#op-filter-button');
    if (button) {
        button.setAttribute('aria-pressed', isOPOnly);
        button.classList.toggle('is-active', isOPOnly);
        button.title = isOPOnly ? 'Show All Posts' : 'Show Only OP Posts';
        
        // Update icon and text
        const icon = button.querySelector('i');
        const text = button.querySelector('.button-text');
        
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

    const posts = document.querySelectorAll('.message--post');
    let visibleCount = 0;
    let hiddenCount = 0;

    posts.forEach(post => {
        const usernameElement = post.querySelector('.username');
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
    });

    // Save state
    chrome.storage.local.set({ isOPOnly });
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

    // Add click handler
    button.addEventListener('click', (e) => {
        e.preventDefault();
        toggleOPPosts();
    });

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

// Function to ensure the button is added
function ensureButtonAdded() {
    if (!document.querySelector('#op-filter-button')) {
        createOPFilterButton();
    }
}

// Load saved state
chrome.storage.local.get(['isOPOnly'], (result) => {
    isOPOnly = result.isOPOnly || false;
    if (isOPOnly) {
        // Wait for posts to load before applying filter
        const stateObserver = new MutationObserver((mutations, obs) => {
            if (document.querySelector('.message--post')) {
                toggleOPPosts();
                obs.disconnect();
            }
        });

        stateObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});

// Initialize when the page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButtonAdded);
} else {
    ensureButtonAdded();
}

// Also try to initialize when new content is loaded
const contentObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            ensureButtonAdded();
        }
    }
});

contentObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Additional retry mechanism
let retryCount = 0;
const maxRetries = 3;
const retryInterval = 2000;

function retryButtonCreation() {
    if (retryCount < maxRetries) {
        ensureButtonAdded();
        retryCount++;
        setTimeout(retryButtonCreation, retryInterval);
    }
}

// Start retry mechanism
retryButtonCreation(); 