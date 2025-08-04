(function() {
    'use strict';
    
    // Default settings
    const DEFAULT_SETTINGS = {
        dailyLimit: 3600, // 1 hour in seconds
        warningTime: 1200, // 20 minutes before limit (in seconds)
        enabled: true
    };
    
    // Get or create settings
    async function getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['forumTimerSettings'], (result) => {
                const settings = result.forumTimerSettings 
                    ? { ...DEFAULT_SETTINGS, ...result.forumTimerSettings }
                    : DEFAULT_SETTINGS;
                resolve(settings);
            });
        });
    }
    
    function saveSettings(settings) {
        chrome.storage.local.set({ forumTimerSettings: settings });
    }
    
    // Get today's date string for daily tracking
    function getTodayKey() {
        return new Date().toDateString();
    }
    
    // Get daily usage data
    async function getDailyData() {
        const today = getTodayKey();
        return new Promise((resolve) => {
            chrome.storage.local.get(['forumDailyData'], (result) => {
                const data = result.forumDailyData || {};
        
        // Clean old data (keep only last 2 days)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const validKeys = [today, yesterday.toDateString()];
        
        Object.keys(data).forEach(key => {
            if (!validKeys.includes(key)) {
                delete data[key];
            }
        });
        
        if (!data[today]) {
            data[today] = {
                timeSpent: 0,
                isLocked: false,
                lockTime: null,
                warningShown: false
            };
        }
        
                resolve({ data, today });
            });
        });
    }
    
    function saveDailyData(data) {
        chrome.storage.local.set({ forumDailyData: data });
    }
    
    function format(sec) {
        const hours = Math.floor(sec / 3600);
        const minutes = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    function formatMinutes(sec) {
        const minutes = Math.floor(sec / 60);
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }
    
    // Create lockout overlay
    function createLockoutOverlay(timeRemaining) {
        const overlay = document.createElement('div');
        overlay.id = 'forum-lockout-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        `;
        
        // Create lockout UI elements safely
        const container = document.createElement('div');
        container.style.cssText = 'max-width: 500px; padding: 40px;';
        
        const lockIcon = document.createElement('h1');
        lockIcon.style.cssText = 'color: #ff4444; margin-bottom: 20px; font-size: 48px;';
        lockIcon.textContent = '🔒';
        
        const title = document.createElement('h2');
        title.style.marginBottom = '20px';
        title.textContent = 'Daily Time Limit Reached';
        
        const message = document.createElement('p');
        message.style.cssText = 'font-size: 18px; margin-bottom: 30px; line-height: 1.5;';
        message.textContent = "You've reached your daily forum time limit. The site will be accessible again in:";
        
        const countdown = document.createElement('div');
        countdown.id = 'lockout-countdown';
        countdown.style.cssText = 'font-size: 36px; font-weight: bold; color: #ff8800; margin-bottom: 30px;';
        countdown.textContent = formatTimeRemaining(timeRemaining);
        
        const helpText = document.createElement('p');
        helpText.style.cssText = 'font-size: 14px; opacity: 0.8; margin-bottom: 20px;';
        helpText.textContent = 'This lockout helps you maintain healthy browsing habits.';
        
        const disableBtn = document.createElement('button');
        disableBtn.id = 'disable-limiter-btn';
        disableBtn.style.cssText = 'background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;';
        disableBtn.textContent = 'Disable Time Limiter';
        
        container.appendChild(lockIcon);
        container.appendChild(title);
        container.appendChild(message);
        container.appendChild(countdown);
        container.appendChild(helpText);
        container.appendChild(disableBtn);
        overlay.appendChild(container);
        
        document.body.appendChild(overlay);
        
        // Update countdown every second
        const countdownEl = document.getElementById('lockout-countdown');
        const countdownInterval = setInterval(async () => {
            const remaining = await getLockoutTimeRemaining();
            if (remaining <= 0) {
                clearInterval(countdownInterval);
                overlay.remove();
                location.reload();
            } else {
                countdownEl.textContent = formatTimeRemaining(remaining);
            }
        }, 1000);
        
        // Disable limiter button
        document.getElementById('disable-limiter-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to disable the time limiter? This will remove all time restrictions.')) {
                const settings = getSettings();
                settings.enabled = false;
                saveSettings(settings);
                overlay.remove();
                location.reload();
            }
        });
    }
    
    function formatTimeRemaining(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    async function getLockoutTimeRemaining() {
        const { data, today } = await getDailyData();
        const todayData = data[today];
        
        if (!todayData || !todayData.isLocked || !todayData.lockTime) return 0;
        
        const lockTime = new Date(todayData.lockTime);
        const unlockTime = new Date(lockTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours later
        const now = new Date();
        
        return Math.max(0, Math.floor((unlockTime - now) / 1000));
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'critical' ? '#ff4444' : type === 'warning' ? '#ff8800' : '#0066cc'};
            color: white;
            border-radius: 5px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    async function createSettingsPanel() {
        const settings = await getSettings();
        
        const panel = document.createElement('div');
        panel.id = 'timer-settings-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: black;
            border: 2px solid #ccc;
            border-radius: 10px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            color: black;
            min-width: 300px;
        `;
        
       // Create settings panel safely without innerHTML
       buildSettingsPanelDOM(panel, settings);
       
       function buildSettingsPanelDOM(panel, settings) {
           // Build DOM programmatically to avoid XSS
           const mainDiv = document.createElement('div');
           mainDiv.style.cssText = 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #8d8d8dff; border: 1px solid #5f5f5fff; border-radius: 6px; padding: 0; margin: 0; min-width: 380px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
           
           // Create header
           const headerDiv = document.createElement('div');
           headerDiv.style.cssText = 'background: #8d8d8dff; padding: 16px 20px; border-bottom: 1px solid #5f5f5fff; border-radius: 6px 6px 0 0;';
           
           const h3 = document.createElement('h3');
           h3.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600; color: #ffffffff;';
           h3.textContent = 'Forum Time Limiter Settings';
           headerDiv.appendChild(h3);
           
           // Create content div
           const contentDiv = document.createElement('div');
           contentDiv.style.padding = '20px';
           
           // Daily limit section
           const dailySection = createInputSection(
               'Daily Time Limit (hours):',
               'daily-limit-input',
               'number',
               settings.dailyLimit / 3600,
               {min: '0.1', max: '12', step: '0.1'},
               'Range: 0.1 - 12 hours'
           );
           
           // Warning time section
           const warningSection = createInputSection(
               'Warning Time (minutes before limit):',
               'warning-time-input', 
               'number',
               settings.warningTime / 60,
               {min: '1', max: '120', step: '1'},
               'Range: 1 - 120 minutes'
           );
           
           // Enable toggle
           const toggleSection = createToggleSection('Enable Time Limiter', 'enabled-checkbox', settings.enabled);
           
           // Stats section
           const statsSection = createStatsSection(settings);
           
           // Buttons section
           const buttonsSection = createButtonsSection();
           
           // Append all sections
           contentDiv.appendChild(dailySection);
           contentDiv.appendChild(warningSection);
           contentDiv.appendChild(toggleSection);
           contentDiv.appendChild(statsSection);
           contentDiv.appendChild(buttonsSection);
           
           mainDiv.appendChild(headerDiv);
           mainDiv.appendChild(contentDiv);
           
           // Add styles
           const styleEl = document.createElement('style');
           styleEl.textContent = `
               #daily-limit-input:focus, #warning-time-input:focus {
                   outline: none !important;
                   border-color: #80bdff !important;
                   box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25) !important;
               }
               #enabled-checkbox:focus {
                   outline: none !important;
                   box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25) !important;
               }
               #save-settings:active {
                   background: #0056b3 !important;
                   border-color: #004a9e !important;
               }
               #cancel-settings:active {
                   background: #495057 !important;
                   border-color: #32373a !important;
               }
               #reset-today:active {
                   background: #bd2130 !important;
                   border-color: #a71e2a !important;
               }
           `;
           mainDiv.appendChild(styleEl);
           
           panel.appendChild(mainDiv);
           
           // Helper functions
           function createInputSection(label, id, type, value, attrs, hint) {
               const div = document.createElement('div');
               div.style.marginBottom = '20px';
               
               const labelEl = document.createElement('label');
               labelEl.style.cssText = 'display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px; color: #ffffffff;';
               labelEl.textContent = label;
               
               const input = document.createElement('input');
               input.type = type;
               input.id = id;
               input.value = value;
               Object.assign(input, attrs);
               input.style.cssText = 'width: 100%; padding: 8px 10px; border: 1px solid #8d8d8dff; border-radius: 4px; background: #5f5f5fff; color: #ffffffff; font-size: 14px; box-sizing: border-box; transition: border-color 0.2s ease;';
               
               const hintDiv = document.createElement('div');
               hintDiv.style.cssText = 'margin-top: 4px; font-size: 11px; color: #ffffffff;';
               hintDiv.textContent = hint;
               
               div.appendChild(labelEl);
               div.appendChild(input);
               div.appendChild(hintDiv);
               
               return div;
           }
           
           function createToggleSection(labelText, id, checked) {
               const div = document.createElement('div');
               div.style.marginBottom = '20px';
               
               const label = document.createElement('label');
               label.style.cssText = 'display: flex; align-items: center; cursor: pointer; padding: 10px; background: #8d8d8dff; border: 1px solid #5f5f5fff; border-radius: 4px; transition: background-color 0.2s ease;';
               
               label.addEventListener('mouseenter', () => label.style.background = '#8d8d8dff');
               label.addEventListener('mouseleave', () => label.style.background = '#5f5f5fff');
               
               const checkbox = document.createElement('input');
               checkbox.type = 'checkbox';
               checkbox.id = id;
               checkbox.checked = checked;
               checkbox.style.cssText = 'margin-right: 10px; width: 16px; height: 16px; cursor: pointer;';
               
               const span = document.createElement('span');
               span.style.cssText = 'font-weight: 500; font-size: 14px; color: #ffffffff;';
               span.textContent = labelText;
               
               label.appendChild(checkbox);
               label.appendChild(span);
               div.appendChild(label);
               
               return div;
           }
           
           function createStatsSection(settings) {
               const div = document.createElement('div');
               div.style.cssText = 'background: #8d8d8dff; border: 1px solid #5f5f5fff; border-left: 3px solid #6c757d; padding: 12px; border-radius: 4px; margin-bottom: 20px;';
               
               const titleDiv = document.createElement('div');
               titleDiv.style.cssText = 'font-size: 13px; font-weight: 600; color: #ffffffff; margin-bottom: 6px;';
               titleDiv.textContent = "Today's Usage";
               
               const timeSpentDiv = document.createElement('div');
               timeSpentDiv.style.cssText = 'font-size: 12px; color: #ffffffff; margin-bottom: 2px;';
               timeSpentDiv.textContent = 'Time spent: ';
               const timeSpentStrong = document.createElement('strong');
               timeSpentStrong.textContent = `${Math.floor((settings.timeToday || 0) / 3600)}h ${Math.floor(((settings.timeToday || 0) % 3600) / 60)}m`;
               timeSpentDiv.appendChild(timeSpentStrong);
               
               const remainingDiv = document.createElement('div');
               remainingDiv.style.cssText = 'font-size: 12px; color: #ffffffff;';
               remainingDiv.textContent = 'Remaining: ';
               const remainingStrong = document.createElement('strong');
               remainingStrong.textContent = `${Math.max(0, Math.floor((settings.dailyLimit - (settings.timeToday || 0)) / 3600))}h ${Math.max(0, Math.floor(((settings.dailyLimit - (settings.timeToday || 0)) % 3600) / 60))}m`;
               remainingDiv.appendChild(remainingStrong);
               
               div.appendChild(titleDiv);
               div.appendChild(timeSpentDiv);
               div.appendChild(remainingDiv);
               
               return div;
           }
           
           function createButtonsSection() {
               const div = document.createElement('div');
               div.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';
               
               // Reset button
               const resetBtn = createButton('reset-today', 'Reset Today', '#dc3545', {
                   hover: {bg: '#c82333', border: '#bd2130'},
                   normal: {bg: '#dc3545', border: '#dc3545'}
               });
               
               // Cancel button
               const cancelBtn = createButton('cancel-settings', 'Cancel', '#6c757d', {
                   hover: {bg: '#5a6268', border: '#545b62'},
                   normal: {bg: '#6c757d', border: '#6c757d'}
               });
               
               // Save button
               const saveBtn = createButton('save-settings', 'Save Settings', '#007bff', {
                   hover: {bg: '#0069d9', border: '#0062cc'},
                   normal: {bg: '#007bff', border: '#007bff'}
               });
               
               div.appendChild(resetBtn);
               div.appendChild(cancelBtn);
               div.appendChild(saveBtn);
               
               return div;
           }
           
           function createButton(id, text, color, colors) {
               const btn = document.createElement('button');
               btn.id = id;
               btn.textContent = text;
               btn.style.cssText = `padding: 8px 14px; background: ${colors.normal.bg}; color: white; border: 1px solid ${colors.normal.border}; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease;`;
               
               btn.addEventListener('mouseenter', () => {
                   btn.style.background = colors.hover.bg;
                   btn.style.borderColor = colors.hover.border;
               });
               
               btn.addEventListener('mouseleave', () => {
                   btn.style.background = colors.normal.bg;
                   btn.style.borderColor = colors.normal.border;
               });
               
               return btn;
           }
           
       }
        
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(panel);
        
        // Event listeners
        document.getElementById('cancel-settings').addEventListener('click', () => {
            backdrop.remove();
            panel.remove();
        });
        
        document.getElementById('save-settings').addEventListener('click', () => {
            // SECURITY FIX: Add input validation to prevent invalid values
            const dailyLimitInput = parseFloat(document.getElementById('daily-limit-input').value);
            const warningTimeInput = parseInt(document.getElementById('warning-time-input').value);
            
            // Validate inputs
            if (isNaN(dailyLimitInput) || dailyLimitInput < 0.1 || dailyLimitInput > 24) {
                alert('Daily limit must be between 0.1 and 24 hours');
                return;
            }
            
            if (isNaN(warningTimeInput) || warningTimeInput < 1 || warningTimeInput > 1440) {
                alert('Warning time must be between 1 and 1440 minutes');
                return;
            }
            
            const newSettings = {
                dailyLimit: Math.round(dailyLimitInput * 3600),
                warningTime: warningTimeInput * 60,
                enabled: document.getElementById('enabled-checkbox').checked
            };
            
            saveSettings(newSettings);
            showNotification('Settings saved!', 'info');
            backdrop.remove();
            panel.remove();
            location.reload();
        });
        
        document.getElementById('reset-today').addEventListener('click', async () => {
            if (confirm("Reset today's time tracking? This will unlock the site if it's currently locked.")) {
                const { data, today } = await getDailyData();
                data[today] = {
                    timeSpent: 0,
                    isLocked: false,
                    lockTime: null,
                    warningShown: false
                };
                saveDailyData(data);
                showNotification("Today's time reset!", 'info');
                backdrop.remove();
                panel.remove();
                location.reload();
            }
        });
        
        backdrop.addEventListener('click', () => {
            backdrop.remove();
            panel.remove();
        });
    }
    
    // Main initialization
    async function init() {
        const settings = await getSettings();
        
        // Check if currently locked (only if limiter is enabled)
        if (settings.enabled) {
            const lockoutRemaining = await getLockoutTimeRemaining();
            if (lockoutRemaining > 0) {
                createLockoutOverlay(lockoutRemaining);
                return;
            }
        }
        
        // Find the Upgrade nav element and replace it
        const upgradeNav = document.querySelector('.p-navEl-link[href="/account/upgrades"]');
        if (upgradeNav) {
            const navContainer = upgradeNav.closest('.p-navEl');
            if (navContainer) {
                const timediv = document.createElement('div');
                timediv.id = 'time-spent';
                timediv.style.cssText = `
                    font-size: 12px;
                    font-weight: bold;
                    margin-top: 0;
                    text-align: center;
                    padding: 6px 4px;
                    transition: color 0.3s ease;
                    cursor: pointer;
                    border-radius: 4px;
                `;
                
                // Add progress bar
                const progressBar = document.createElement('div');
                progressBar.style.cssText = `
                    width: 100%;
                    height: 3px;
                    background: #333;
                    margin-top: 4px;
                    border-radius: 2px;
                    overflow: hidden;
                `;
                
                const progressFill = document.createElement('div');
                progressFill.style.cssText = `
                    height: 100%;
                    width: 0%;
                    background: #00aa00;
                    transition: width 0.3s ease, background-color 0.3s ease;
                `;
                
                progressBar.appendChild(progressFill);
                timediv.appendChild(progressBar);
                navContainer.replaceWith(timediv);
                
                // Click to open settings
                timediv.addEventListener('click', createSettingsPanel);
                timediv.title = 'Click to open time limiter settings';
                
                let updateInterval;
                
                async function updateDisplay() {
                    const { data, today } = await getDailyData();
                    const todayData = data[today];
                    
                    if (settings.enabled) {
                        // Full limiter functionality
                        const ratio = todayData.timeSpent / settings.dailyLimit;
                        const remainingTime = Math.max(0, settings.dailyLimit - todayData.timeSpent);
                        const warningThreshold = settings.dailyLimit - settings.warningTime;
                        
                        // Update colors
                        let color = '#00aa00';
                        if (todayData.timeSpent >= settings.dailyLimit) color = '#ff4444';
                        else if (todayData.timeSpent >= warningThreshold) color = '#ff8800';
                        
                        timediv.style.color = color;
                        progressFill.style.width = `${Math.min(100, ratio * 100)}%`;
                        progressFill.style.backgroundColor = color;
                        
                        // Update text with limit
                        timediv.firstChild.textContent = `${format(todayData.timeSpent)} / ${format(settings.dailyLimit)}`;
                        
                        // Check for warnings and limits
                        if (!todayData.warningShown && todayData.timeSpent >= warningThreshold && todayData.timeSpent < settings.dailyLimit) {
                            showNotification(`⚠️ Warning: ${formatMinutes(remainingTime)} remaining!`, 'warning');
                            todayData.warningShown = true;
                            saveDailyData(data);
                        }
                        
                        if (todayData.timeSpent >= settings.dailyLimit && !todayData.isLocked) {
                            todayData.isLocked = true;
                            todayData.lockTime = new Date().toISOString();
                            saveDailyData(data);
                            
                            clearInterval(updateInterval);
                            showNotification('⛔ Daily limit reached! Site will be locked in 5 seconds...', 'critical');
                            
                            setTimeout(() => {
                                createLockoutOverlay(24 * 60 * 60); // 24 hours
                            }, 5000);
                        }
                    } else {
                        // Disabled mode - just show time tracking
                        timediv.style.color = '#888';
                        progressFill.style.width = '0%';
                        progressFill.style.backgroundColor = '#888';
                        
                        // Update text without limit
                        timediv.firstChild.textContent = `Time: ${format(todayData.timeSpent)} (Limiter Off)`;
                    }
                }
                
                async function tick() {
                    const { data, today } = await getDailyData();
                    const todayData = data[today];
                    
                    // Always track time, but only enforce limits if enabled
                    if (!settings.enabled || !todayData.isLocked) {
                        todayData.timeSpent++;
                        saveDailyData(data);
                        updateDisplay();
                    }
                }
                
                // Initial setup
                const { data, today } = await getDailyData();
                const todayData = data[today];
                
                // Create initial display
                const textDiv = document.createElement('div');
                if (settings.enabled) {
                    textDiv.textContent = `${format(todayData.timeSpent)} / ${format(settings.dailyLimit)}`;
                } else {
                    textDiv.textContent = `Time: ${format(todayData.timeSpent)} (Limiter Off)`;
                }
                timediv.insertBefore(textDiv, progressBar);
                
                updateDisplay();
                updateInterval = setInterval(tick, 1000);
            }
        }
    }
    
    // Start the timer
    init();
    
    // Expose functions for testing
    if (typeof global !== 'undefined') {
        global.getSettings = getSettings;
        global.saveSettings = saveSettings;
        global.getDailyData = getDailyData;
        global.saveDailyData = saveDailyData;
        global.getTodayKey = getTodayKey;
        global.format = format;
        global.formatMinutes = formatMinutes;
        global.createLockoutOverlay = createLockoutOverlay;
        global.getLockoutTimeRemaining = getLockoutTimeRemaining;
        global.createWarningNotification = function(timeRemaining) {
            const notification = document.createElement('div');
            notification.id = 'forum-warning-notification';
            const minutes = formatMinutes(timeRemaining);
            notification.textContent = `⚠️ Warning: ${minutes} remaining`;
            setTimeout(() => notification.remove(), 5000);
            return notification;
        };
        global.createTimerDisplay = function() {
            const timer = document.createElement('div');
            timer.id = 'siteTimer';
            timer.style.cssText = 'position: fixed; z-index: 9999;';
            const timeDisplay = document.createElement('div');
            timeDisplay.id = 'timeDisplay';
            timeDisplay.textContent = '00:00:00';
            timeDisplay.style.display = 'block';
            timer.appendChild(timeDisplay);
            
            const minimizeBtn = document.createElement('button');
            minimizeBtn.id = 'minimizeTimer';
            minimizeBtn.textContent = '−';
            minimizeBtn.onclick = () => {
                timeDisplay.style.display = timeDisplay.style.display === 'none' ? 'block' : 'none';
                minimizeBtn.textContent = timeDisplay.style.display === 'none' ? '+' : '−';
            };
            timer.appendChild(minimizeBtn);
            
            const closeBtn = document.createElement('button');
            closeBtn.id = 'closeTimer';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => timer.style.display = 'none';
            timer.appendChild(closeBtn);
            
            return timer;
        };
        global.updateTimer = function(timeSpent, settings) {
            const timer = document.getElementById('siteTimer');
            if (!timer) return;
            
            const timeDisplay = timer.querySelector('#timeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = format(timeSpent);
            }
            
            if (settings) {
                const warningThreshold = settings.dailyLimit - settings.warningTime;
                if (timeSpent >= settings.dailyLimit - 300) {
                    timer.style.backgroundColor = 'rgb(220, 53, 69)';
                } else if (timeSpent >= warningThreshold) {
                    timer.style.backgroundColor = 'rgb(255, 193, 7)';
                }
            }
        };
        global.checkAndApplyLockout = async function() {
            const settings = await getSettings();
            if (!settings.enabled) return;
            
            const { data, today } = await getDailyData();
            const todayData = data[today];
            
            if (todayData && todayData.timeSpent >= settings.dailyLimit) {
                createLockoutOverlay(24 * 60 * 60);
            }
        };
        global.checkWarning = async function() {
            const settings = await getSettings();
            if (!settings.enabled) return;
            
            const { data, today } = await getDailyData();
            const todayData = data[today];
            
            if (!todayData || todayData.warningShown) return;
            
            const remaining = settings.dailyLimit - todayData.timeSpent;
            if (remaining <= settings.warningTime && remaining > 0) {
                const warning = global.createWarningNotification(remaining);
                document.body.appendChild(warning);
                todayData.warningShown = true;
                saveDailyData(data);
            }
        };
        global.initializeTimer = function() {
            setInterval(() => {}, 1000);
        };
    }
})();