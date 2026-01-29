// Tasks Manager
class TasksListManager {
    constructor() {
        this.storageKey = 'tasksList';
        this.categoriesKey = 'tasksCategories';
        this.defaultCategories = [
            { name: 'Werkstatt', emoji: '🔧' },
            { name: 'Auto', emoji: '🚗' },
            { name: 'Haus', emoji: '🏠' },
            { name: 'Garten', emoji: '🌿' }
        ];
        this.items = [];
        this.categories = [];
        this.init();
    }

    init() {
        this.loadCategories();
        this.loadData();
        this.renderAllCategories();
        this.startClock();
    }

    loadCategories() {
        const saved = localStorage.getItem(this.categoriesKey);
        if (saved) {
            this.categories = JSON.parse(saved);
        } else {
            this.categories = [...this.defaultCategories];
            this.saveCategories();
        }
    }

    saveCategories() {
        localStorage.setItem(this.categoriesKey, JSON.stringify(this.categories));
    }

    loadData() {
        const data = localStorage.getItem(this.storageKey);
        this.items = data ? JSON.parse(data) : [];
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        if (window.updateTasksBadges) {
            window.updateTasksBadges();
        }
    }

    addItem(category) {
        const input = document.querySelector(`input[data-category="${category}"]`);
        const text = input.value.trim();

        if (!text) return;

        const item = {
            id: Date.now(),
            category: category,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.items.push(item);
        this.saveData();
        input.value = '';
        this.renderCategory(category);
    }

    deleteItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            this.items = this.items.filter(i => i.id !== itemId);
            this.saveData();
            this.renderCategory(item.category);
        }
    }

    completeItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            this.items = this.items.filter(i => i.id !== itemId);
            this.saveData();
            this.renderCategory(item.category);
        }
    }

    renderCategory(category) {
        const listDiv = document.getElementById(`items-${category}`);
        if (!listDiv) return;

        const categoryItems = this.items.filter(item => item.category === category);

        if (categoryItems.length === 0) {
            listDiv.innerHTML = '<p class="empty-message">No tasks yet</p>';
            return;
        }

        listDiv.innerHTML = categoryItems.map(item => `
            <div class="item-row">
                <input type="checkbox" class="item-checkbox" onchange="taskManager.completeItem(${item.id})" />
                <span class="item-text">${escapeHtml(item.text)}</span>
                <button class="delete-btn" onclick="taskManager.deleteItem(${item.id})">✕</button>
            </div>
        `).join('');
    }

    renderAllCategories() {
        const content = document.getElementById('tasksContent');
        if (!content) return;

        let html = '';
        this.categories.forEach(cat => {
            const categoryItems = this.items.filter(i => i.category === cat.name);
            const itemsHtml = categoryItems.length === 0 
                ? '<p class="empty-message">No tasks yet</p>'
                : categoryItems.map(item => `
                    <div class="item-row">
                        <input type="checkbox" class="item-checkbox" onchange="taskManager.completeItem(${item.id})" />
                        <span class="item-text">${escapeHtml(item.text)}</span>
                        <button class="delete-btn" onclick="taskManager.deleteItem(${item.id})">✕</button>
                    </div>
                `).join('');

            html += `
                <section class="tasks-category">
                    <h2 class="category-title">${cat.emoji} ${cat.name}</h2>
                    
                    <div class="add-item-form">
                        <input type="text" class="item-input" placeholder="Add task..." data-category="${cat.name}">
                        <button class="add-btn" onclick="taskManager.addItem('${cat.name}')">Add</button>
                    </div>

                    <div class="items-list" id="items-${cat.name}">
                        ${itemsHtml}
                    </div>
                </section>
            `;
        });

        content.innerHTML = html;
    }

    openCategoryModal() {
        document.getElementById('categoryModal').style.display = 'block';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryEmoji').value = '';
        document.getElementById('categoryName').focus();
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').style.display = 'none';
    }

    addCategory() {
        const name = document.getElementById('categoryName').value.trim();
        let emoji = document.getElementById('categoryEmoji').value.trim();

        if (!name) {
            alert('Please enter a category name');
            return;
        }

        if (this.categories.some(c => c.name === name)) {
            alert('This category already exists');
            return;
        }

        if (!emoji) {
            emoji = '📋';
        }

        this.categories.push({ name, emoji });
        this.saveCategories();
        this.closeCategoryModal();
        this.renderAllCategories();
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

    getTasksCount() {
        return this.items.length;
    }
}

// Helper function to escape HTML
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

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('categoryModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Allow Enter key to add category
document.addEventListener('DOMContentLoaded', () => {
    const categoryName = document.getElementById('categoryName');
    if (categoryName) {
        categoryName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('categoryEmoji').focus();
            }
        });
    }
    const categoryEmoji = document.getElementById('categoryEmoji');
    if (categoryEmoji) {
        categoryEmoji.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && taskManager) {
                taskManager.addCategory();
            }
        });
    }
});

let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TasksListManager();
});
