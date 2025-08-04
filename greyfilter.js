// State variable
let isGreyUsersHidden = false;

// Initialize state from storage
chrome.storage.local.get(['isGreyUsersHidden'], (result) => {
    isGreyUsersHidden = result.isGreyUsersHidden || false;
    if (isGreyUsersHidden) {
        hideGreyThreads();
        hideGreyPosts();
        hideGreyMembers();
    }
});

function hideGreyThreads() {
    console.log('Hiding grey threads...');
    const threadContainers = document.querySelectorAll('.structItem:not(.hidden-grey-user)');
    console.log('Found thread containers:', threadContainers.length);

    threadContainers.forEach(thread => {
        try {
            const structItemParts = thread.querySelector('.structItem-parts');
            if (structItemParts) {
                const greyUser = structItemParts.querySelector('.username--style2, .username--style7, .username--style19');
                if (greyUser) {
                    console.log('Hiding thread started by grey user:', greyUser.textContent);
                    thread.style.display = 'none';
                    thread.classList.add('hidden-grey-user');
                }
            }
        } catch (error) {
            console.error('Error processing thread:', error);
        }
    });
}

function hideGreyPosts() {
    console.log('Hiding grey posts...');
    const messageContainers = document.querySelectorAll('.message:not(.hidden-grey-user)');
    console.log('Found message containers:', messageContainers.length);

    messageContainers.forEach(message => {
        try {
            const greyUser = message.querySelector('.username--style2, .username--style7, .username--style19');
            if (greyUser) {
                console.log('Hiding post by grey user:', greyUser.textContent);
                message.style.display = 'none';
                message.classList.add('hidden-grey-user');
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
}

function hideGreyMembers() {
    console.log('Hiding grey members...');
    const memberListItems = document.querySelectorAll('.listInline--comma li:not(.hidden-grey-user)');
    console.log('Found member list items:', memberListItems.length);

    memberListItems.forEach(item => {
        try {
            const greyUser = item.querySelector('.username--style2, .username--style7, .username--style19');
            if (greyUser) {
                console.log('Hiding grey member:', greyUser.textContent);
                item.style.display = 'none';
                item.classList.add('hidden-grey-user');
            }
        } catch (error) {
            console.error('Error processing member list item:', error);
        }
    });
}

function applyGreyUserStyles() {
    if (!document.querySelector('#grey-users-style')) {
        const style = document.createElement('style');
        style.id = 'grey-users-style';
        style.textContent = `
            .structItem:has(.structItem-parts .username--style2),
            .structItem:has(.structItem-parts .username--style7),
            .structItem:has(.structItem-parts .username--style19) {
                display: none !important;
            }
            .message:has(.username--style2),
            .message:has(.username--style7),
            .message:has(.username--style19) {
                display: none !important;
            }
            .listInline--comma li:has(.username--style2),
            .listInline--comma li:has(.username--style7),
            .listInline--comma li:has(.username--style19) {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

function removeGreyUserStyles() {
    const style = document.querySelector('#grey-users-style');
    if (style) {
        style.remove();
    }
}

function toggleGreyUsers() {
    isGreyUsersHidden = !isGreyUsersHidden;
    console.log('Toggling grey users:', isGreyUsersHidden);
    chrome.storage.local.set({ isGreyUsersHidden });

    const button = document.querySelector('.grey-users-button');
    if (button) {
        button.classList.toggle('is-active', isGreyUsersHidden);
        const icon = button.querySelector('i');
        if (isGreyUsersHidden) {
            icon.className = 'fas fa-user-check';
            button.setAttribute('title', 'Show Grey Users');
            button.setAttribute('aria-label', 'Show Grey Users');
            applyGreyUserStyles();
            hideGreyThreads();
            hideGreyPosts();
            hideGreyMembers();
        } else {
            icon.className = 'fas fa-user-slash';
            button.setAttribute('title', 'Hide Grey Users');
            button.setAttribute('aria-label', 'Hide Grey Users');
            removeGreyUserStyles();
            document.querySelectorAll('.structItem.hidden-grey-user, .message.hidden-grey-user, .listInline--comma li.hidden-grey-user').forEach(item => {
                item.style.display = '';
                item.classList.remove('hidden-grey-user');
            });
        }
    }
}

function createGreyUsersButton() {
    const button = document.createElement('a');
    button.href = 'javascript:void(0)';
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
    
    if (searchButton) {
        navGroup.insertBefore(greyUsersButton, searchButton);
        console.log('Grey users button inserted before search button');
    } else {
        navGroup.appendChild(greyUsersButton);
        console.log('Grey users button appended to navigation group');
    }

    chrome.storage.local.get(['isGreyUsersHidden'], (result) => {
        isGreyUsersHidden = result.isGreyUsersHidden || false;
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

// Create observer to handle dynamically added content with throttling
let greyThrottled = false;
let isProcessingMutation = false;
const greyContentObserver = new MutationObserver((mutations) => {
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
                             node.querySelector?.('.structItem, .message'))) {
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
            setTimeout(() => { greyThrottled = false; }, 100);
        });
    }
});

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

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addGreyUsersButton();
        greyContentObserver.observe(document.body, { childList: true, subtree: true });
        navObserver.observe(document.body, { childList: true, subtree: true });
    });
} else {
    addGreyUsersButton();
    greyContentObserver.observe(document.body, { childList: true, subtree: true });
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