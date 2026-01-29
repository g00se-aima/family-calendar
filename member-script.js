// Get member name from URL
const urlParams = new URLSearchParams(window.location.search);
const memberName = urlParams.get('member') || 'Member';

// Member Tasks Manager
class MemberTaskManager {
    constructor(memberName) {
        this.memberName = memberName;
        this.storageKey = `tasks_${memberName}`;
        this.recurringKey = `recurring_${memberName}`;
        this.datesKey = `dates_${memberName}`;
        this.completedTodayKey = `completedToday_${memberName}`;
        this.choreKey = `chore_${memberName}`;
        this.mediaTimeUsageKey = `mediaTimeUsage_${memberName}`;
        this.tasks = [];
        this.recurringTasks = [];
        this.importantDates = [];
        this.completedToday = [];
        this.currentChore = null;
        this.mediaTimeUsage = { weekStart: null, count: 0 };
        this.init();
    }

    init() {
        this.loadData();
        this.updateMemberTitle();
        this.showChoresSection();
        this.renderTasks();
        this.renderRecurringTasks();
        this.renderImportantDates();
        this.startClock();
    }

    loadData() {
        const savedTasks = localStorage.getItem(this.storageKey);
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];

        const savedRecurring = localStorage.getItem(this.recurringKey);
        this.recurringTasks = savedRecurring ? JSON.parse(savedRecurring) : [];

        const savedDates = localStorage.getItem(this.datesKey);
        this.importantDates = savedDates ? JSON.parse(savedDates) : [];

        // Load completed today tasks
        const savedCompletedToday = localStorage.getItem(this.completedTodayKey);
        const completedTodayData = savedCompletedToday ? JSON.parse(savedCompletedToday) : {};
        
        // Check if the stored date is today, if not reset it
        const today = new Date().toDateString();
        if (completedTodayData.date === today) {
            this.completedToday = completedTodayData.taskIds || [];
        } else {
            this.completedToday = [];
        }

        // Load current chore
        const savedChore = localStorage.getItem(this.choreKey);
        this.currentChore = savedChore ? JSON.parse(savedChore) : null;

        // Load media time usage
        const savedMediaTimeUsage = localStorage.getItem(this.mediaTimeUsageKey);
        const mediaTimeData = savedMediaTimeUsage ? JSON.parse(savedMediaTimeUsage) : { weekStart: null, count: 0 };
        
        // Check if we're still in the same week
        const weekStart = this.getWeekStart();
        if (mediaTimeData.weekStart === weekStart) {
            this.mediaTimeUsage = mediaTimeData;
        } else {
            // New week, reset counter
            this.mediaTimeUsage = { weekStart: weekStart, count: 0 };
        }
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
        localStorage.setItem(this.recurringKey, JSON.stringify(this.recurringTasks));
        localStorage.setItem(this.datesKey, JSON.stringify(this.importantDates));
        
        // Save completed today with date
        const today = new Date().toDateString();
        localStorage.setItem(this.completedTodayKey, JSON.stringify({
            date: today,
            taskIds: this.completedToday
        }));

        // Save current chore
        if (this.currentChore) {
            localStorage.setItem(this.choreKey, JSON.stringify(this.currentChore));
        }

        // Save media time usage
        localStorage.setItem(this.mediaTimeUsageKey, JSON.stringify(this.mediaTimeUsage));
    }

    updateMemberTitle() {
        const titleEl = document.getElementById('memberTitle');
        if (titleEl) {
            titleEl.textContent = this.memberName + "'s Tasks";
        }

        // Add special buttons for specific members
        const specialActionsDiv = document.getElementById('specialActions');
        if (specialActionsDiv) {
            if (this.memberName === 'Aiden') {
                specialActionsDiv.innerHTML = `<a href="https://reichenbach-gym.webuntis.com/WebUntis/?school=reichenbach-gym#/basic/login" target="_blank" class="special-member-btn untis-btn">📚 UNTIS</a>`;
            } else {
                specialActionsDiv.innerHTML = '';
            }
        }
    }

    addTask(taskText) {
        if (!taskText.trim()) return;

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveData();
        this.renderTasks();
    }

    completeTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderTasks();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        if (this.tasks.length === 0) {
            tasksList.innerHTML = '<p class="empty-message">No tasks yet. Add one to get started!</p>';
            return;
        }

        tasksList.innerHTML = this.tasks.map(task => `
            <div class="task-item">
                <input type="checkbox" class="task-checkbox" onchange="taskManager.completeTask(${task.id})">
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
        `).join('');
    }

    addRecurringTask(taskText, frequency) {
        if (!taskText.trim()) return;

        let scheduleDays = [];
        let scheduleDay = null;
        let scheduleDates = [];

        if (frequency === 'daily') {
            const checkboxes = document.querySelectorAll('input[name="day"]:checked');
            if (checkboxes.length === 0) {
                alert('Please select at least one day of the week for daily tasks');
                return;
            }
            scheduleDays = Array.from(checkboxes).map(cb => parseInt(cb.value));
        } else if (frequency === 'weekly') {
            scheduleDay = parseInt(document.getElementById('weeklyDay').value);
        } else if (frequency === 'monthly') {
            const datesInput = document.getElementById('monthlyDates').value.trim();
            if (!datesInput) {
                alert('Please enter at least one date for monthly tasks');
                return;
            }
            scheduleDates = datesInput.split(',').map(d => {
                const num = parseInt(d.trim());
                return num >= 1 && num <= 31 ? num : null;
            }).filter(d => d !== null);
            
            if (scheduleDates.length === 0) {
                alert('Please enter valid dates (1-31)');
                return;
            }
        }

        const recurringTask = {
            id: Date.now(),
            text: taskText,
            frequency: frequency,
            scheduleDays: scheduleDays,      // for daily
            scheduleDay: scheduleDay,         // for weekly
            scheduleDates: scheduleDates,     // for monthly
            paused: false,                    // NEW: pause/resume feature
            createdAt: new Date().toISOString(),
            nextDueDate: new Date().toISOString()
        };

        this.recurringTasks.push(recurringTask);
        this.saveData();
        this.renderRecurringTasks();
        
        // Clear inputs
        document.getElementById('recurringInput').value = '';
        document.getElementById('monthlyDates').value = '';
        document.getElementById('weeklyDay').value = '0';
        document.querySelectorAll('input[name="day"]').forEach(cb => cb.checked = false);
    }

    deleteRecurringTask(taskId) {
        this.recurringTasks = this.recurringTasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderRecurringTasks();
    }

    pauseRecurringTask(taskId) {
        const task = this.recurringTasks.find(t => t.id === taskId);
        if (task) {
            task.paused = true;
            this.saveData();
            this.renderRecurringTasks();
        }
    }

    resumeRecurringTask(taskId) {
        const task = this.recurringTasks.find(t => t.id === taskId);
        if (task) {
            task.paused = false;
            this.saveData();
            this.renderRecurringTasks();
        }
    }

    completeRecurringTaskToday(taskId) {
        // Mark this recurring task as completed today (not permanently deleted)
        if (!this.completedToday.includes(taskId)) {
            this.completedToday.push(taskId);
            this.saveData();
            this.renderTodaysTasks();
        }
    }

    showChoresSection() {
        // Only show chores for these members
        const choreMembers = ['Aiden', 'Liah', 'Elaine', 'Llewyn'];
        const choresSection = document.getElementById('choresSection');
        if (choresSection) {
            if (choreMembers.includes(this.memberName)) {
                choresSection.style.display = 'block';
                this.displayCurrentChore();
            } else {
                choresSection.style.display = 'none';
            }
        }

        // Show media time button for Aiden, Liah, and Llewyn
        const mediaTimeSection = document.getElementById('mediaTimeSection');
        if (mediaTimeSection) {
            if (['Aiden', 'Liah', 'Llewyn'].includes(this.memberName)) {
                mediaTimeSection.style.display = 'block';
            } else {
                mediaTimeSection.style.display = 'none';
            }
        }
    }

    displayCurrentChore() {
        const infoDiv = document.getElementById('currentChoreInfo');
        if (!infoDiv) return;

        if (this.currentChore) {
            const choreIcons = { 'Dishes': '🍽️', 'Trash': '🗑️', 'Bathroom': '🚿' };
            infoDiv.innerHTML = `<p>Current chore: ${choreIcons[this.currentChore]} <strong>${this.currentChore}</strong></p>`;
        } else {
            infoDiv.innerHTML = '<p>No chore assigned yet. Select one to get started!</p>';
        }
    }

    getNextChore(currentChore) {
        const choreOrder = ['Dishes', 'Trash', 'Bathroom'];
        if (!currentChore || !choreOrder.includes(currentChore)) {
            return choreOrder[0]; // Default to Dishes
        }
        const currentIndex = choreOrder.indexOf(currentChore);
        return choreOrder[(currentIndex + 1) % choreOrder.length];
    }

    assignChore(choreName) {
        // Remove existing chore task if any
        if (this.currentChore) {
            const choreTaskIndex = this.recurringTasks.findIndex(t => t.text === this.currentChore);
            if (choreTaskIndex !== -1) {
                this.recurringTasks.splice(choreTaskIndex, 1);
            }
        }

        // Create recurring task for all days of the week
        const choreTask = {
            id: Date.now(),
            text: choreName,
            frequency: 'daily',
            scheduleDays: [0, 1, 2, 3, 4, 5, 6], // All days
            scheduleDay: null,
            scheduleDates: [],
            paused: false,
            createdAt: new Date().toISOString(),
            nextDueDate: new Date().toISOString(),
            isChore: true
        };

        this.recurringTasks.push(choreTask);
        this.currentChore = choreName;

        // If this is Elaine or Llewyn, also update the other's chore
        if (this.memberName === 'Elaine') {
            const llevynChoreKey = 'chore_Llewyn';
            localStorage.setItem(llevynChoreKey, JSON.stringify(choreName));
        } else if (this.memberName === 'Llewyn') {
            const elaineChoreKey = 'chore_Elaine';
            localStorage.setItem(elaineChoreKey, JSON.stringify(choreName));
        }

        this.saveData();
        this.renderRecurringTasks();
        this.renderTodaysTasks();
        this.displayCurrentChore();
        
        alert(`✅ ${choreName} chore assigned for all days!`);
    }

    checkMediaTime() {
        const today = new Date();
        const todayDayOfWeek = today.getDay();
        const todayDateOfMonth = today.getDate();

        // Check if media time is used up for the week
        if (this.mediaTimeUsage.count >= 3) {
            alert(`⚠️ Media time used up this week!`);
            return;
        }

        // Get all tasks due today (excluding paused and completed)
        const tasksDueToday = this.recurringTasks.filter(task => {
            // Skip paused tasks
            if (task.paused) return false;
            
            // Skip already completed tasks
            if (this.completedToday.includes(task.id)) return false;

            let isDueToday = false;
            
            if (task.frequency === 'daily') {
                const days = Array.isArray(task.scheduleDays) ? task.scheduleDays : (task.scheduleDays ? task.scheduleDays.split(',').map(Number) : []);
                isDueToday = days.includes(todayDayOfWeek);
            } else if (task.frequency === 'weekly') {
                isDueToday = task.scheduleDay === todayDayOfWeek;
            } else if (task.frequency === 'monthly') {
                const dates = Array.isArray(task.scheduleDates) ? task.scheduleDates : (task.scheduleDates ? task.scheduleDates.split(',').map(Number) : []);
                isDueToday = dates.includes(todayDateOfMonth);
            }

            return isDueToday;
        });

        // Check if all tasks are completed
        if (tasksDueToday.length === 0) {
            // No tasks due today or all completed
            const mediaMinutes = this.memberName === 'Llewyn' ? 15 : 30;
            this.mediaTimeUsage.count += 1;
            this.saveData();
            alert(`🎉 You can now do "${mediaMinutes} minutes" time of media!\n\n(${this.mediaTimeUsage.count}/3 times used this week)`);
        } else {
            // There are incomplete tasks
            alert(`❌ DO YOUR CHORES FIRST!!!`);
        }
    }

    getWeekStart() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek;
        const weekStart = new Date(today.setDate(diff));
        return weekStart.toDateString();
    }

    renderRecurringTasks() {
        const recurringList = document.getElementById('recurringList');
        if (!recurringList) return;

        if (this.recurringTasks.length === 0) {
            recurringList.innerHTML = '<p class="empty-message">No recurring tasks. Add one to get started!</p>';
            return;
        }

        recurringList.innerHTML = this.recurringTasks.map(task => {
            const frequency = task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1);
            let scheduleText = '';
            
            if (task.frequency === 'daily') {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                scheduleText = task.scheduleDays.map(d => dayNames[d]).join(', ');
            } else if (task.frequency === 'weekly') {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                scheduleText = dayNames[task.scheduleDay];
            } else if (task.frequency === 'monthly') {
                scheduleText = task.scheduleDates.join(', ');
            }

            const pauseButton = task.paused 
                ? `<button class="resume-btn" onclick="taskManager.resumeRecurringTask(${task.id})">▶ Resume</button>`
                : `<button class="pause-btn" onclick="taskManager.pauseRecurringTask(${task.id})">⏸ Pause</button>`;

            return `
                <div class="recurring-item ${task.frequency}${task.paused ? ' paused' : ''}">
                    <div class="recurring-content">
                        <span class="recurring-text">${escapeHtml(task.text)}</span>
                        <span class="recurring-schedule">${scheduleText}</span>
                        <span class="recurring-badge">${frequency}${task.paused ? ' (Paused)' : ''}</span>
                    </div>
                    <div class="recurring-actions">
                        ${pauseButton}
                        <button class="delete-btn" onclick="taskManager.deleteRecurringTask(${task.id})">×</button>
                    </div>
                </div>
            `;
        }).join('');

        // Also render today's tasks
        this.renderTodaysTasks();
    }

    renderTodaysTasks() {
        const todaysList = document.getElementById('todaysList');
        if (!todaysList) return;

        const today = new Date();
        const todayDayOfWeek = today.getDay();
        const todayDateOfMonth = today.getDate();

        const todaysTasks = this.recurringTasks.filter(task => {
            // Skip paused tasks
            if (task.paused) return false;
            
            // Skip tasks already completed today
            if (this.completedToday.includes(task.id)) return false;

            let isDueToday = false;
            
            if (task.frequency === 'daily') {
                const days = Array.isArray(task.scheduleDays) ? task.scheduleDays : (task.scheduleDays ? task.scheduleDays.split(',').map(Number) : []);
                isDueToday = days.includes(todayDayOfWeek);
            } else if (task.frequency === 'weekly') {
                isDueToday = task.scheduleDay === todayDayOfWeek;
            } else if (task.frequency === 'monthly') {
                const dates = Array.isArray(task.scheduleDates) ? task.scheduleDates : (task.scheduleDates ? task.scheduleDates.split(',').map(Number) : []);
                isDueToday = dates.includes(todayDateOfMonth);
            }

            return isDueToday;
        });

        if (todaysTasks.length === 0) {
            todaysList.innerHTML = '<p class="empty-message">No tasks due today</p>';
            return;
        }

        todaysList.innerHTML = todaysTasks.map(task => {
            const frequency = task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1);
            let scheduleText = '';
            
            if (task.frequency === 'daily') {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                scheduleText = task.scheduleDays.map(d => dayNames[d]).join(', ');
            } else if (task.frequency === 'weekly') {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                scheduleText = dayNames[task.scheduleDay];
            } else if (task.frequency === 'monthly') {
                scheduleText = task.scheduleDates.join(', ');
            }

            return `
                <div class="todays-task-item">
                    <input type="checkbox" class="todays-checkbox" onchange="taskManager.completeRecurringTaskToday(${task.id})">
                    <div class="todays-task-content">
                        <span class="todays-task-text">${escapeHtml(task.text)}</span>
                        <span class="todays-task-schedule">${scheduleText}</span>
                    </div>
                    <span class="recurring-badge">${frequency}</span>
                </div>
            `;
        }).join('');
    }

    addImportantDate(eventName, dateValue) {
        if (!eventName.trim() || !dateValue) return;

        const date = {
            id: Date.now(),
            name: eventName,
            date: dateValue,
            daysUntil: this.calculateDaysUntil(dateValue)
        };

        this.importantDates.push(date);
        this.importantDates.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.renderImportantDates();
    }

    deleteImportantDate(dateId) {
        this.importantDates = this.importantDates.filter(d => d.id !== dateId);
        this.saveData();
        this.renderImportantDates();
    }

    calculateDaysUntil(dateStr) {
        const targetDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        const timeDiff = targetDate - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff;
    }

    renderImportantDates() {
        const datesList = document.getElementById('datesList');
        if (!datesList) return;

        if (this.importantDates.length === 0) {
            datesList.innerHTML = '<p class="empty-message">No important dates yet.</p>';
            return;
        }

        datesList.innerHTML = this.importantDates.map(date => {
            const days = this.calculateDaysUntil(date.date);
            let daysText = '';
            
            if (days === 0) daysText = '🎉 Today!';
            else if (days === 1) daysText = '⏰ Tomorrow';
            else if (days > 0) daysText = `📅 In ${days} days`;
            else daysText = `⏳ ${Math.abs(days)} days ago`;

            return `
                <div class="date-item">
                    <div class="date-content">
                        <span class="date-name">${escapeHtml(date.name)}</span>
                        <span class="date-info">${new Date(date.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div class="date-status">${daysText}</div>
                    <button class="delete-btn" onclick="taskManager.deleteImportantDate(${date.id})">×</button>
                </div>
            `;
        }).join('');
    }

    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('en-US', options);
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:${seconds}`;
        
        const dateDisplay = document.getElementById('dateDisplay');
        const timeDisplay = document.getElementById('timeDisplay');
        
        if (dateDisplay) dateDisplay.textContent = dateStr;
        if (timeDisplay) timeDisplay.textContent = timeStr;
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Global task manager instance
let taskManager;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new MemberTaskManager(memberName);
    
    // Initialize recurring options display
    updateRecurringOptions();
    
    // Handle Enter key in input fields
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    document.getElementById('recurringInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addRecurringTask();
    });
    
    document.getElementById('dateInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addImportantDate();
    });
});

// Global functions for button clicks
function addTask() {
    const input = document.getElementById('taskInput');
    if (input.value.trim()) {
        taskManager.addTask(input.value);
        input.value = '';
        input.focus();
    }
}

function addImportantDate() {
    const nameInput = document.getElementById('dateInput');
    const dateInput = document.getElementById('dateValue');
    if (nameInput.value.trim() && dateInput.value) {
        taskManager.addImportantDate(nameInput.value, dateInput.value);
        nameInput.value = '';
        dateInput.value = '';
        nameInput.focus();
    }
}

function addRecurringTask() {
    const input = document.getElementById('recurringInput');
    const type = document.getElementById('recurringType').value;
    console.log('addRecurringTask called - Input:', input.value, 'Type:', type);
    if (input.value.trim()) {
        taskManager.addRecurringTask(input.value, type);
        input.focus();
    } else {
        console.log('Empty input');
    }
}

function updateRecurringOptions() {
    const type = document.getElementById('recurringType').value;
    document.getElementById('dailyOptions').style.display = type === 'daily' ? 'block' : 'none';
    document.getElementById('weeklyOptions').style.display = type === 'weekly' ? 'block' : 'none';
    document.getElementById('monthlyOptions').style.display = type === 'monthly' ? 'block' : 'none';
}
