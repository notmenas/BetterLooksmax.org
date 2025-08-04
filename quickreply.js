// Quick Reply System for looksmax.org - Redesigned
(function() {
    'use strict';

    // Default quick reply templates
    const defaultTemplates = {
        'dnrd': "Didn't Read Fucking Dalit",
        'mogsme': "Mogs me",
        'brutal': "Brutal",
        'cope': "Cope",
        'over': "It's over",
        'mirin': "Mirin'",
        'bump': "BUMP",
    };

    let quickReplies = {};

    // Initialize quick replies
    function initQuickReplies() {
        chrome.storage.local.get(['quickReplies'], function(result) {
            quickReplies = result.quickReplies || { ...defaultTemplates };
            if (!result.quickReplies) {
                chrome.storage.local.set({ quickReplies: quickReplies });
            }
            addReplyButtonsToActionBars();
            observeNewPosts();
        });
    }

    // Add quick reply buttons to each post's action bar
    function addReplyButtonsToActionBars() {
        const actionBars = document.querySelectorAll('.actionBar');
        actionBars.forEach(actionBar => {
            if (actionBar.querySelector('.quick-reply-action')) return;
            
            const replyBtn = actionBar.querySelector('.actionBar-action--reply');
            if (replyBtn) {
                const quickReplyBtn = document.createElement('a');
                quickReplyBtn.className = 'actionBar-action quick-reply-action';
                quickReplyBtn.href = 'javascript:void(0)';
                quickReplyBtn.title = 'Quick Reply';
                // Create button content safely
                const boltIcon = document.createElement('i');
                boltIcon.className = 'fa fa-bolt';
                boltIcon.style.marginRight = '4px';
                quickReplyBtn.appendChild(boltIcon);
                quickReplyBtn.appendChild(document.createTextNode('Quick'));
                
                // Enhanced button styling
                quickReplyBtn.style.cssText = `
                    transition: all 0.2s ease;
                    border-radius: 4px;
                    padding: 4px 8px;
                `;
                
                replyBtn.insertAdjacentElement('afterend', quickReplyBtn);
                
                quickReplyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showQuickReplyMenu(e.target, actionBar);
                });
                
                // Add hover effect
                quickReplyBtn.addEventListener('mouseenter', () => {
                    quickReplyBtn.style.backgroundColor = '#00000032';
                });
                
                quickReplyBtn.addEventListener('mouseleave', () => {
                    quickReplyBtn.style.backgroundColor = '';
                });
            }
        });
    }

    // Show redesigned quick reply menu
    function showQuickReplyMenu(targetElement, actionBar) {
        document.querySelectorAll('.quick-reply-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'quick-reply-menu';
        menu.style.cssText = `
            position: absolute;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 8px;
            z-index: 10000;
            min-width: 200px;
            max-width: 280px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            color: #6b7280;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            padding: 0 4px;
        `;
        header.textContent = 'Quick Replies';
        menu.appendChild(header);

        // Create menu items with new design
        Object.entries(quickReplies).forEach(([key, value]) => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                color: #374151;
                font-size: 13px;
                font-weight: 500;
                border-radius: 6px;
                cursor: pointer;
                margin: 2px 0;
                transition: all 0.15s ease;
                background: transparent;
            `;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = key;
            textSpan.title = value;
            textSpan.style.cssText = `
                flex: 1;
                margin-right: 8px;
            `;
            item.appendChild(textSpan);
            
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '×';
            deleteBtn.style.cssText = `
                opacity: 0;
                color: #9ca3af;
                font-size: 16px;
                font-weight: 400;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.15s ease;
                cursor: pointer;
            `;
            
            deleteBtn.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                deleteBtn.style.backgroundColor = '#fee2e2';
                deleteBtn.style.color = '#dc2626';
            });
            
            deleteBtn.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                deleteBtn.style.backgroundColor = '';
                deleteBtn.style.color = '#9ca3af';
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${key}" quick reply?`)) {
                    delete quickReplies[key];
                    chrome.storage.local.set({ quickReplies: quickReplies });
                    menu.remove();
                    showQuickReplyMenu(targetElement, actionBar);
                }
            });
            
            item.appendChild(deleteBtn);
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f9fafb';
                item.style.transform = 'translateX(2px)';
                deleteBtn.style.opacity = '1';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
                item.style.transform = 'translateX(0)';
                deleteBtn.style.opacity = '0';
            });
            
            item.addEventListener('click', () => {
                insertAndSendReply(value, actionBar);
                menu.remove();
            });
            
            menu.appendChild(item);
        });

        // Add separator
        const separator = document.createElement('div');
        separator.style.cssText = `
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 8px 0;
        `;
        menu.appendChild(separator);

        // Add custom button with new design
        const addCustomBtn = document.createElement('div');
        addCustomBtn.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 10px;
            color: #6b7280;
            font-size: 13px;
            font-weight: 500;
            border-radius: 6px;
            cursor: pointer;
            margin: 2px 0;
            transition: all 0.15s ease;
            background: transparent;
        `;
        
        // Create add button content safely
        const plusDiv = document.createElement('div');
        plusDiv.style.cssText = 'width: 16px; height: 16px; border: 1.5px solid #9ca3af; border-radius: 3px; display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px; font-weight: 600;';
        plusDiv.textContent = '+';
        addCustomBtn.appendChild(plusDiv);
        addCustomBtn.appendChild(document.createTextNode('Add Custom Reply'));
        
        addCustomBtn.addEventListener('mouseenter', () => {
            addCustomBtn.style.backgroundColor = '#f3f4f6';
            addCustomBtn.style.color = '#374151';
        });
        
        addCustomBtn.addEventListener('mouseleave', () => {
            addCustomBtn.style.backgroundColor = 'transparent';
            addCustomBtn.style.color = '#6b7280';
        });
        
        addCustomBtn.addEventListener('click', () => showAddCustomDialog(actionBar));
        menu.appendChild(addCustomBtn);

        // Position menu
        const rect = targetElement.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        document.body.appendChild(menu);

        // Close menu handler
        const hideOnClick = (e) => {
            if (!menu.contains(e.target) && e.target !== targetElement) {
                menu.remove();
                document.removeEventListener('click', hideOnClick);
            }
        };
        document.addEventListener('click', hideOnClick);
    }

    // Show redesigned add custom dialog
    function showAddCustomDialog(actionBar) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Add Quick Reply';
        title.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: #111827;
        `;
        dialog.appendChild(title);

        // Shortcut input
        const shortcutLabel = document.createElement('label');
        shortcutLabel.textContent = 'Shortcut';
        shortcutLabel.style.cssText = `
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        `;
        dialog.appendChild(shortcutLabel);

        const shortcutInput = document.createElement('input');
        shortcutInput.placeholder = 'e.g., "dnrd"';
        shortcutInput.style.cssText = `
            width: 100%;
            padding: 12px 14px;
            margin-bottom: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 14px;
            transition: all 0.2s ease;
            background: #fafafa;
        `;
        
        shortcutInput.addEventListener('focus', () => {
            shortcutInput.style.borderColor = '#6b7280';
            shortcutInput.style.backgroundColor = '#ffffff';
        });
        
        shortcutInput.addEventListener('blur', () => {
            shortcutInput.style.borderColor = '#e5e7eb';
            shortcutInput.style.backgroundColor = '#fafafa';
        });
        
        dialog.appendChild(shortcutInput);

        // Reply text input
        const replyLabel = document.createElement('label');
        replyLabel.textContent = 'Reply Text';
        replyLabel.style.cssText = `
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        `;
        dialog.appendChild(replyLabel);

        const replyInput = document.createElement('textarea');
        replyInput.placeholder = 'Enter your reply text...';
        replyInput.style.cssText = `
            width: 100%;
            padding: 12px 14px;
            margin-bottom: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            box-sizing: border-box;
            min-height: 80px;
            resize: vertical;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s ease;
            background: #fafafa;
        `;
        
        replyInput.addEventListener('focus', () => {
            replyInput.style.borderColor = '#6b7280';
            replyInput.style.backgroundColor = '#ffffff';
        });
        
        replyInput.addEventListener('blur', () => {
            replyInput.style.borderColor = '#e5e7eb';
            replyInput.style.backgroundColor = '#fafafa';
        });
        
        dialog.appendChild(replyInput);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: #ffffff;
            color: #6b7280;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        `;
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.backgroundColor = '#f9fafb';
            cancelBtn.style.borderColor = '#d1d5db';
        });
        
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.backgroundColor = '#ffffff';
            cancelBtn.style.borderColor = '#e5e7eb';
        });
        
        cancelBtn.onclick = () => overlay.remove();

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Reply';
        addBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            background: #374151;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        `;
        
        addBtn.addEventListener('mouseenter', () => {
            addBtn.style.backgroundColor = '#4b5563';
        });
        
        addBtn.addEventListener('mouseleave', () => {
            addBtn.style.backgroundColor = '#374151';
        });
        
        addBtn.onclick = () => {
            const shortcut = shortcutInput.value.trim();
            const reply = replyInput.value.trim();
            if (shortcut && reply) {
                quickReplies[shortcut] = reply;
                chrome.storage.local.set({ quickReplies: quickReplies });
                insertAndSendReply(reply, actionBar);
                overlay.remove();
                document.querySelector('.quick-reply-menu')?.remove();
            }
        };

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(addBtn);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Focus first input
        setTimeout(() => shortcutInput.focus(), 100);
    }

    // Insert and send reply (unchanged functionality)
    function insertAndSendReply(text, targetActionBar = null) {
        if (targetActionBar) {
            const replyLink = targetActionBar.querySelector('.actionBar-action--reply');
            if (replyLink) {
                const quoteUrl = replyLink.getAttribute('data-quote-href');
                if (quoteUrl) {
                    fetch(quoteUrl)
                        .then(response => response.text())
                        .then(() => {
                            replyLink.click();
                            const checkEditor = setInterval(() => {
                                const editor = document.querySelector('.fr-element');
                                if (editor) {
                                    clearInterval(checkEditor);
                                    // Safely insert text to prevent XSS
                                    if (window.BetterLooksmaxSanitizer) {
                                        // For plain text replies, use textContent
                                        editor.textContent = text;
                                    } else {
                                        // Fallback if sanitizer not loaded
                                        editor.textContent = text;
                                    }
                                }
                            }, 100);
                        });
                } else {
                    replyLink.click();
                    const checkEditor = setInterval(() => {
                        const editor = document.querySelector('.fr-element');
                        if (editor) {
                            clearInterval(checkEditor);
                            // Safely insert text to prevent XSS
                            if (window.BetterLooksmaxSanitizer) {
                                // For plain text replies, use textContent
                                editor.textContent = text;
                            } else {
                                // Fallback if sanitizer not loaded
                                editor.textContent = text;
                            }
                        }
                    }, 100);
                }
            }
        } else {
            const editor = document.querySelector('.fr-element');
            if (editor) {
                // Safely insert text to prevent XSS
                if (window.BetterLooksmaxSanitizer) {
                    // For plain text replies, use textContent
                    editor.textContent = text;
                } else {
                    // Fallback if sanitizer not loaded
                    editor.textContent = text;
                }
            }
        }
    }

    // Watch for new posts with throttling
    function observeNewPosts() {
        let throttled = false;
        const observer = new MutationObserver((mutations) => {
            if (!throttled) {
                throttled = true;
                requestAnimationFrame(() => {
                    for (const mutation of mutations) {
                        if (mutation.addedNodes.length) {
                            addReplyButtonsToActionBars();
                            break;
                        }
                    }
                    setTimeout(() => { throttled = false; }, 100);
                });
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuickReplies);
    } else {
        initQuickReplies();
    }
    
    // Expose functions for testing
    if (typeof global !== 'undefined') {
        global.quickReplies = quickReplies;
        global.defaultTemplates = defaultTemplates;
        global.initQuickReplies = initQuickReplies;
        global.addReplyButtonsToActionBars = addReplyButtonsToActionBars;
        global.showQuickReplyMenu = showQuickReplyMenu;
        global.showAddCustomDialog = showAddCustomDialog;
        global.insertAndSendReply = insertAndSendReply;
        global.observeNewPosts = observeNewPosts;
        global.showTemplateEditor = function() {
            // Stub for tests - not implemented in actual code
            console.log('Template editor not implemented');
        };
        global.sendQuickReply = insertAndSendReply;
    }
})();