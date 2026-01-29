// Home Page Functions
function selectMember(memberName) {
    localStorage.setItem('selectedFamilyMember', memberName);
    // Navigate to member page
    window.location.href = 'member.html?member=' + encodeURIComponent(memberName);
}

function selectAction(action) {
    localStorage.setItem('selectedAction', action);
    // Navigate to action page
    if (action === 'shopping') {
        window.location.href = 'shopping.html';
    } else if (action === 'tasks') {
        window.location.href = 'tasks.html';
    }
}

// Update shopping list badges
function updateShoppingBadges() {
    const shoppingList = localStorage.getItem('shoppingList');
    const items = shoppingList ? JSON.parse(shoppingList) : [];
    
    const urgentCount = items.filter(i => i.urgency === 'urgent').length;
    const normalCount = items.filter(i => i.urgency === 'normal').length;
    
    const urgentBadge = document.getElementById('badge-shopping-urgent');
    const normalBadge = document.getElementById('badge-shopping-normal');
    
    if (urgentBadge) {
        urgentBadge.textContent = urgentCount;
        urgentBadge.style.display = urgentCount > 0 ? 'flex' : 'none';
    }
    
    if (normalBadge) {
        normalBadge.textContent = normalCount;
        normalBadge.style.display = normalCount > 0 ? 'flex' : 'none';
    }
}

// Update tasks badge
function updateTasksBadges() {
    const tasksList = localStorage.getItem('tasksList');
    const items = tasksList ? JSON.parse(tasksList) : [];
    
    const tasksCount = items.length;
    
    const tasksBadge = document.getElementById('badge-tasks-count');
    
    if (tasksBadge) {
        tasksBadge.textContent = tasksCount;
        tasksBadge.style.display = tasksCount > 0 ? 'flex' : 'none';
    }
}

// Update task badges for all family members
function updateTaskBadges() {
    console.log('Updating badges...');
    const familyMembers = ['Toby', 'Sharmila', 'Aiden', 'Liah', 'Llewyn', 'Elaine'];
    
    familyMembers.forEach(member => {
        // Get tasks
        const tasksKey = `tasks_${member}`;
        const recurringKey = `recurring_${member}`;
        
        const savedTasks = localStorage.getItem(tasksKey);
        const tasks = savedTasks ? JSON.parse(savedTasks) : [];
        
        const savedRecurring = localStorage.getItem(recurringKey);
        console.log(`${member} raw localStorage:`, savedRecurring);
        const recurringTasks = savedRecurring ? JSON.parse(savedRecurring) : [];
        console.log(`${member} parsed recurringTasks:`, recurringTasks);
        
        console.log(`${member} - Regular tasks: ${tasks.length}, Recurring tasks: ${recurringTasks.length}`);
        
        // Count regular tasks
        const regularTaskCount = tasks.length;
        
        // Count recurring tasks due today
        const today = new Date();
        const todayDayOfWeek = today.getDay();
        const todayDateOfMonth = today.getDate();
        
        console.log(`${member} - Today: Day ${todayDayOfWeek}, Date ${todayDateOfMonth}`);
        
        let recurringTaskCount = 0;
        recurringTasks.forEach(task => {
            console.log(`${member} - Processing task:`, task);
            
            // Skip paused tasks
            if (task.paused) {
                console.log(`${member} - Skipping paused task`);
                return;
            }
            
            let isDueToday = false;
            
            if (task.frequency === 'daily') {
                // Convert to array if it's a string
                const days = Array.isArray(task.scheduleDays) ? task.scheduleDays : (task.scheduleDays ? task.scheduleDays.split(',').map(Number) : []);
                isDueToday = days.includes(todayDayOfWeek);
                console.log(`${member} - Daily task "${task.text}": days=${JSON.stringify(days)}, todayDayOfWeek=${todayDayOfWeek}, includes=${days.includes ? 'YES' : 'NO'}, isDueToday=${isDueToday}`);
            } else if (task.frequency === 'weekly') {
                isDueToday = task.scheduleDay === todayDayOfWeek;
                console.log(`${member} - Weekly task "${task.text}": scheduleDay=${task.scheduleDay}, todayDayOfWeek=${todayDayOfWeek}, isDueToday=${isDueToday}`);
            } else if (task.frequency === 'monthly') {
                // Convert to array if it's a string
                const dates = Array.isArray(task.scheduleDates) ? task.scheduleDates : (task.scheduleDates ? task.scheduleDates.split(',').map(Number) : []);
                isDueToday = dates.includes(todayDateOfMonth);
                console.log(`${member} - Monthly task "${task.text}": dates=${JSON.stringify(dates)}, todayDateOfMonth=${todayDateOfMonth}, isDueToday=${isDueToday}`);
            }
            
            console.log(`${member} - isDueToday=${isDueToday}, incrementing? ${isDueToday ? 'YES' : 'NO'}`);
            if (isDueToday) {
                recurringTaskCount++;
                console.log(`${member} - Incremented! Count is now: ${recurringTaskCount}`);
            }
        });
        
        console.log(`${member} - Final counts: Recurring=${recurringTaskCount}, Regular=${regularTaskCount}`);
        
        // Update badges
        const recurringBadge = document.getElementById(`badge-${member}-recurring`);
        const regularBadge = document.getElementById(`badge-${member}-regular`);
        
        console.log(`${member} - Recurring badge element:`, recurringBadge);
        console.log(`${member} - Regular badge element:`, regularBadge);
        
        if (recurringBadge) {
            recurringBadge.textContent = recurringTaskCount;
            recurringBadge.style.display = recurringTaskCount > 0 ? 'flex' : 'none';
            console.log(`${member} - Set recurring badge display to: ${recurringBadge.style.display}, text: ${recurringBadge.textContent}`);
        }
        
        if (regularBadge) {
            regularBadge.textContent = regularTaskCount;
            regularBadge.style.display = regularTaskCount > 0 ? 'flex' : 'none';
            console.log(`${member} - Set regular badge display to: ${regularBadge.style.display}, text: ${regularBadge.textContent}`);
        }
    });
}

// Clock Function
function updateClock() {
    const now = new Date();
    
    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    
    // Format time with leading zeros
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;
    
    // Update HTML
    const dateDisplay = document.getElementById('dateDisplay');
    const timeDisplay = document.getElementById('timeDisplay');
    
    if (dateDisplay) dateDisplay.textContent = dateStr;
    if (timeDisplay) timeDisplay.textContent = timeStr;
}

// Initialize clock on page load
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    updateTaskBadges();
    updateShoppingBadges();
    updateTasksBadges();
    // Update clock every second
    setInterval(updateClock, 1000);
    // Update badges every minute
    setInterval(updateTaskBadges, 60000);
    // Update shopping badges every 30 seconds
    setInterval(updateShoppingBadges, 30000);
    // Update tasks badge every 30 seconds
    setInterval(updateTasksBadges, 30000);
});
class FamilyCalendar {
    constructor() {
        this.currentDate = new Date();
        this.viewMode = 'month';
        this.events = [];
        this.familyMembers = [
            { id: 1, name: 'Toby' },
            { id: 2, name: 'Sharmila' },
            { id: 3, name: 'Aiden' },
            { id: 4, name: 'Liah' },
            { id: 5, name: 'Llewyn' },
            { id: 6, name: 'Elaine' }
        ];
        this.selectedEvent = null;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.populateFamilySelect();
        this.populateAttendees();
        this.loadEvents();
        this.render();
    }

    attachEventListeners() {
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousPeriod());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPeriod());
        document.getElementById('viewMode').addEventListener('change', (e) => this.changeViewMode(e.target.value));
        document.getElementById('addEventBtn').addEventListener('click', () => this.openEventModal());
        document.getElementById('eventForm').addEventListener('submit', (e) => this.saveEvent(e));
        document.getElementById('deleteEventBtn').addEventListener('click', () => this.deleteEvent());
        document.querySelector('.close').addEventListener('click', () => closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('eventModal')) {
                closeModal();
            }
        });
    }

    populateFamilySelect() {
        const select = document.getElementById('familySelect');
        this.familyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            select.appendChild(option);
        });
    }

    populateAttendees() {
        const select = document.getElementById('eventAttendees');
        this.familyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            select.appendChild(option);
        });
    }

    loadEvents() {
        // Load from localStorage
        const saved = localStorage.getItem('familyCalendarEvents');
        if (saved) {
            this.events = JSON.parse(saved).map(e => ({
                ...e,
                date: new Date(e.date)
            }));
        }
    }

    saveEventsToStorage() {
        localStorage.setItem('familyCalendarEvents', JSON.stringify(this.events));
    }

    render() {
        if (this.viewMode === 'month') {
            this.renderMonth();
        } else if (this.viewMode === 'week') {
            this.renderWeek();
        } else {
            this.renderDay();
        }
        this.renderEventList();
    }

    renderMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        // Empty cells before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            grid.appendChild(document.createElement('div'));
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const date = new Date(year, month, day);
            if (this.isToday(date)) {
                dayCell.classList.add('today');
            }

            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            dayCell.appendChild(dayHeader);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            const dayEvents = this.getEventsForDate(date);
            dayEvents.slice(0, 3).forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event event-${event.color}`;
                eventEl.textContent = event.title;
                eventEl.addEventListener('click', () => this.openEventModal(event));
                eventsContainer.appendChild(eventEl);
            });

            if (dayEvents.length > 3) {
                const moreEl = document.createElement('div');
                moreEl.className = 'event-more';
                moreEl.textContent = `+${dayEvents.length - 3} more`;
                eventsContainer.appendChild(moreEl);
            }

            dayCell.appendChild(eventsContainer);
            dayCell.addEventListener('click', () => this.createEventForDate(date));
            grid.appendChild(dayCell);
        }
    }

    renderWeek() {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        document.getElementById('currentMonth').textContent = 
            `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        grid.className = 'calendar-grid week-view';

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day week-day';
            
            if (this.isToday(date)) {
                dayCell.classList.add('today');
            }

            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dayCell.appendChild(dayHeader);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            this.getEventsForDate(date).forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event event-${event.color}`;
                eventEl.textContent = event.title;
                eventEl.addEventListener('click', () => this.openEventModal(event));
                eventsContainer.appendChild(eventEl);
            });

            dayCell.appendChild(eventsContainer);
            grid.appendChild(dayCell);
        }
    }

    renderDay() {
        document.getElementById('currentMonth').textContent = 
            this.currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        grid.className = 'calendar-grid day-view';

        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day full-day';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        dayCell.appendChild(dayHeader);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        
        const dayEvents = this.getEventsForDate(this.currentDate);
        if (dayEvents.length === 0) {
            const noEvents = document.createElement('p');
            noEvents.textContent = 'No events scheduled';
            eventsContainer.appendChild(noEvents);
        } else {
            dayEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event event-${event.color} event-detailed`;
                eventEl.innerHTML = `<strong>${event.title}</strong><br>${event.time || 'All day'}<br>${event.description || ''}`;
                eventEl.addEventListener('click', () => this.openEventModal(event));
                eventsContainer.appendChild(eventEl);
            });
        }

        dayCell.appendChild(eventsContainer);
        grid.appendChild(dayCell);
    }

    renderEventList() {
        const eventList = document.getElementById('eventList');
        eventList.innerHTML = '';

        const upcomingEvents = this.events
            .filter(e => e.date >= new Date())
            .sort((a, b) => a.date - b.date)
            .slice(0, 10);

        if (upcomingEvents.length === 0) {
            const noEvents = document.createElement('p');
            noEvents.textContent = 'No upcoming events';
            eventList.appendChild(noEvents);
        } else {
            upcomingEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `event-item event-item-${event.color}`;
                eventEl.innerHTML = `
                    <strong>${event.title}</strong>
                    <div class="event-date">${event.date.toLocaleDateString()} ${event.time || ''}</div>
                    <div class="event-attendees">${this.getAttendeeNames(event.attendees).join(', ')}</div>
                `;
                eventEl.addEventListener('click', () => this.openEventModal(event));
                eventList.appendChild(eventEl);
            });
        }
    }

    getEventsForDate(date) {
        return this.events.filter(e => 
            e.date.toDateString() === date.toDateString()
        );
    }

    getAttendeeNames(attendeeIds) {
        return attendeeIds.map(id => 
            this.familyMembers.find(m => m.id === id)?.name || 'Unknown'
        );
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    previousPeriod() {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else if (this.viewMode === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
        }
        this.render();
    }

    nextPeriod() {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else if (this.viewMode === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
        }
        this.render();
    }

    changeViewMode(mode) {
        this.viewMode = mode;
        this.render();
    }

    openEventModal(event = null) {
        this.selectedEvent = event;
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteEventBtn');

        if (event) {
            modalTitle.textContent = 'Edit Event';
            deleteBtn.style.display = 'inline-block';
            form.reset();
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date.toISOString().split('T')[0];
            document.getElementById('eventTime').value = event.time || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventColor').value = event.color;
            
            const attendeeSelect = document.getElementById('eventAttendees');
            Array.from(attendeeSelect.options).forEach(option => {
                option.selected = event.attendees.includes(parseInt(option.value));
            });
        } else {
            modalTitle.textContent = 'Add Event';
            deleteBtn.style.display = 'none';
            form.reset();
        }

        modal.style.display = 'block';
    }

    saveEvent(e) {
        e.preventDefault();

        const title = document.getElementById('eventTitle').value;
        const dateStr = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value;
        const color = document.getElementById('eventColor').value;
        const attendeeSelect = document.getElementById('eventAttendees');
        const attendees = Array.from(attendeeSelect.selectedOptions).map(opt => parseInt(opt.value));

        const date = new Date(dateStr);

        if (this.selectedEvent) {
            // Update existing event
            const index = this.events.indexOf(this.selectedEvent);
            this.events[index] = { ...this.selectedEvent, title, date, time, description, color, attendees };
        } else {
            // Create new event
            this.events.push({ title, date, time, description, color, attendees });
        }

        this.saveEventsToStorage();
        closeModal();
        this.render();
    }

    deleteEvent() {
        if (this.selectedEvent && confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(e => e !== this.selectedEvent);
            this.saveEventsToStorage();
            closeModal();
            this.render();
        }
    }

    createEventForDate(date) {
        document.getElementById('eventDate').value = date.toISOString().split('T')[0];
        this.openEventModal();
    }
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}
