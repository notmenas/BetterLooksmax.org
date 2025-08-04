(function() {
    'use strict';
    
    // Default settings
    const DEFAULT_SETTINGS = {
        dailyLimit: 3600, // 1 hour in seconds
        warningTime: 1200, // 20 minutes before limit (in seconds)
        enabled: true
    };
    
    // Get or create settings
    function getSettings() {
        const saved = localStorage.getItem('forumTimerSettings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    }
    
    function saveSettings(settings) {
        localStorage.setItem('forumTimerSettings', JSON.stringify(settings));
    }
    
    // Get today's date string for daily tracking
    function getTodayKey() {
        return new Date().toDateString();
    }
    
    // Get daily usage data
    function getDailyData() {
        const today = getTodayKey();
        const saved = localStorage.getItem('forumDailyData');
        const data = saved ? JSON.parse(saved) : {};
        
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
        
        return { data, today };
    }
    
    function saveDailyData(data) {
        localStorage.setItem('forumDailyData', JSON.stringify(data));
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
        
        overlay.innerHTML = `
            <div style="max-width: 500px; padding: 40px;">
                <h1 style="color: #ff4444; margin-bottom: 20px; font-size: 48px;">🔒</h1>
                <h2 style="margin-bottom: 20px;">Daily Time Limit Reached</h2>
                <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                    You've reached your daily forum time limit. The site will be accessible again in:
                </p>
                <div id="lockout-countdown" style="font-size: 36px; font-weight: bold; color: #ff8800; margin-bottom: 30px;">
                    ${formatTimeRemaining(timeRemaining)}
                </div>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 20px;">
                    This lockout helps you maintain healthy browsing habits.
                </p>
                <button id="disable-limiter-btn" style="
                    background: #666;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">Disable Time Limiter</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Update countdown every second
        const countdownEl = document.getElementById('lockout-countdown');
        const countdownInterval = setInterval(() => {
            const remaining = getLockoutTimeRemaining();
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
    
    function getLockoutTimeRemaining() {
        const { data, today } = getDailyData();
        const todayData = data[today];
        
        if (!todayData.isLocked || !todayData.lockTime) return 0;
        
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
    
    function createSettingsPanel() {
        const settings = getSettings();
        
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
        
       panel.innerHTML = `
    <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: #8d8d8dff;
        border: 1px solid #5f5f5fff;
        border-radius: 6px;
        padding: 0;
        margin: 0;
        min-width: 380px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
        <!-- Header -->
        <div style="
            background: #8d8d8dff;
            padding: 16px 20px;
            border-bottom: 1px solid #5f5f5fff;
            border-radius: 6px 6px 0 0;
        ">
            <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #ffffffff;
            ">Forum Time Limiter Settings</h3>
        </div>

        <!-- Content -->
        <div style="padding: 20px;">
            <!-- Daily Limit Section -->
            <div style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    font-size: 13px;
                    color: #ffffffff;
                ">Daily Time Limit (hours):</label>
                <input type="number" id="daily-limit-input" 
                       value="${settings.dailyLimit / 3600}" 
                       min="0.1" max="12" step="0.1" 
                       style="
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #8d8d8dff;
                    border-radius: 4px;
                    background: #5f5f5fff;
                    color: #ffffffff;
                    font-size: 14px;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease;
                ">
                <div style="
                    margin-top: 4px;
                    font-size: 11px;
                    color: #ffffffff;
                ">Range: 0.1 - 12 hours</div>
            </div>

            <!-- Warning Time Section -->
            <div style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    font-size: 13px;
                    color: #ffffffff;
                ">Warning Time (minutes before limit):</label>
                <input type="number" id="warning-time-input" 
                       value="${settings.warningTime / 60}" 
                       min="1" max="120" step="1"
                       style="
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #ffffffff;
                    border-radius: 4px;
                    background: #5f5f5fff;
                    color: #ffffffff;
                    font-size: 14px;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease;
                ">
                <div style="
                    margin-top: 4px;
                    font-size: 11px;
                    color: #ffffffff;
                ">Range: 1 - 120 minutes</div>
            </div>

            <!-- Enable Toggle -->
            <div style="margin-bottom: 20px;">
                <label style="
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    padding: 10px;
                    background: #8d8d8dff;
                    border: 1px solid #5f5f5fff;
                    border-radius: 4px;
                    transition: background-color 0.2s ease;
                " onmouseover="this.style.background='#8d8d8dff'" 
                  onmouseout="this.style.background='#5f5f5fff'">
                    <input type="checkbox" id="enabled-checkbox" ${settings.enabled ? 'checked' : ''}
                           style="
                        margin-right: 10px;
                        width: 16px;
                        height: 16px;
                        cursor: pointer;
                    ">
                    <span style="
                        font-weight: 500;
                        font-size: 14px;
                        color: #ffffffff;
                    ">Enable Time Limiter</span>
                </label>
            </div>

            <!-- Current Stats -->
            <div style="
                background: #8d8d8dff;
                border: 1px solid #5f5f5fff;
                border-left: 3px solid #6c757d;
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 20px;
            ">
                <div style="
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #ffffffff;
                    margin-bottom: 6px;
                ">Today's Usage</div>
                <div style="font-size: 12px; color: #ffffffff; margin-bottom: 2px;">
                    Time spent: <strong>${Math.floor((settings.timeToday || 0) / 3600)}h ${Math.floor(((settings.timeToday || 0) % 3600) / 60)}m</strong>
                </div>
                <div style="font-size: 12px; color: #ffffffff;">
                    Remaining: <strong>${Math.max(0, Math.floor((settings.dailyLimit - (settings.timeToday || 0)) / 3600))}h ${Math.max(0, Math.floor(((settings.dailyLimit - (settings.timeToday || 0)) % 3600) / 60))}m</strong>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            ">
                <button id="reset-today" style="
                    padding: 8px 14px;
                    background: #dc3545;
                    color: white;
                    border: 1px solid #dc3545;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#c82333'; this.style.borderColor='#bd2130'"
                  onmouseout="this.style.background='#dc3545'; this.style.borderColor='#dc3545'">
                    Reset Today
                </button>
                
                <button id="cancel-settings" style="
                    padding: 8px 14px;
                    background: #6c757d;
                    color: white;
                    border: 1px solid #6c757d;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#5a6268'; this.style.borderColor='#545b62'"
                  onmouseout="this.style.background='#6c757d'; this.style.borderColor='#6c757d'">
                    Cancel
                </button>
                
                <button id="save-settings" style="
                    padding: 8px 16px;
                    background: #007bff;
                    color: white;
                    border: 1px solid #007bff;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#0069d9'; this.style.borderColor='#0062cc'"
                  onmouseout="this.style.background='#007bff'; this.style.borderColor='#007bff'">
                    Save Settings
                </button>
            </div>
        </div>
    </div>

    <style>
        /* Input focus styles */
        #daily-limit-input:focus, #warning-time-input:focus {
            outline: none !important;
            border-color: #80bdff !important;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
        }
        
        /* Button active states */
        #save-settings:active {
            background: #0056b3 !important;
            border-color: #004085 !important;
        }
        
        #cancel-settings:active {
            background: #495057 !important;
            border-color: #32373a !important;
        }
        
        #reset-today:active {
            background: #bd2130 !important;
            border-color: #a71e2a !important;
        }
    </style>
`;
        
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
        
        document.getElementById('reset-today').addEventListener('click', () => {
            if (confirm("Reset today's time tracking? This will unlock the site if it's currently locked.")) {
                const { data, today } = getDailyData();
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
    function init() {
        const settings = getSettings();
        
        // Check if currently locked (only if limiter is enabled)
        if (settings.enabled) {
            const lockoutRemaining = getLockoutTimeRemaining();
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
                
                function updateDisplay() {
                    const { data, today } = getDailyData();
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
                
                function tick() {
                    const { data, today } = getDailyData();
                    const todayData = data[today];
                    
                    // Always track time, but only enforce limits if enabled
                    if (!settings.enabled || !todayData.isLocked) {
                        todayData.timeSpent++;
                        saveDailyData(data);
                        updateDisplay();
                    }
                }
                
                // Initial setup
                const { data, today } = getDailyData();
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
})();