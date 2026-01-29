// Theme Management
const themeKey = 'theme-preference';
let currentTheme = localStorage.getItem(themeKey) || 'auto';

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem(themeKey, theme);
    
    if (theme === 'auto') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (currentTheme === 'light') {
        icon.textContent = '☀️';
    } else if (currentTheme === 'dark') {
        icon.textContent = '🌙';
    } else {
        icon.textContent = '🔄';
    }
}

function cycleTheme() {
    if (currentTheme === 'auto') {
        setTheme('light');
    } else if (currentTheme === 'light') {
        setTheme('dark');
    } else {
        setTheme('auto');
    }
}

setTheme(currentTheme);

document.getElementById('theme-toggle-btn').addEventListener('click', cycleTheme);

const modal = document.getElementById('add-task-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let achievements = JSON.parse(localStorage.getItem('achievements')) || initAchievements();
let stats = JSON.parse(localStorage.getItem('stats')) || {
    totalCompleted: 0,
    completedOnTime: 0,
    completedLate: 0
};

function initAchievements() {
    return [
        { id: 'first-task', title: 'Getting Started', description: 'Add your first task', icon: '🎯', unlocked: false, progress: 0, goal: 1 },
        { id: 'task-master', title: 'Task Master', description: 'Add 10 tasks', icon: '📝', unlocked: false, progress: 0, goal: 10 },
        { id: 'first-completion', title: 'First Victory', description: 'Complete your first task', icon: '✅', unlocked: false, progress: 0, goal: 1 },
        { id: 'on-time-warrior', title: 'On-Time Warrior', description: 'Complete 5 tasks on time', icon: '⏰', unlocked: false, progress: 0, goal: 5 },
        { id: 'speedrunner', title: 'Speedrunner', description: 'Complete 10 tasks total', icon: '🚀', unlocked: false, progress: 0, goal: 10 },
        { id: 'perfectionist', title: 'Perfectionist', description: 'Complete 20 tasks on time', icon: '💎', unlocked: false, progress: 0, goal: 20 },
        { id: 'dedicated', title: 'Dedicated', description: 'Complete 50 tasks total', icon: '🏆', unlocked: false, progress: 0, goal: 50 },
        { id: 'comeback-kid', title: 'Comeback Kid', description: 'Complete a task after deadline', icon: '💪', unlocked: false, progress: 0, goal: 1 }
    ];
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        document.getElementById(`${page}-page`).classList.add('active');
        e.target.classList.add('active');
        
        if (page === 'statistics') updateStatistics();
        if (page === 'achievements') renderAchievements();
    });
});

document.getElementById('add-subtask-btn').addEventListener('click', () => {
    const container = document.getElementById('subtask-inputs');
    const count = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'subtask-input-group';
    div.innerHTML = `
        <input type="text" placeholder="Subtask ${count}" class="subtask-input" required>
        <input type="number" placeholder="Est. time (min)" class="subtask-time" min="0">
    `;
    container.appendChild(div);
});

document.getElementById('add-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskName = document.getElementById('task-name').value;
    const deadline = document.getElementById('task-deadline').value;
    const subtaskGroups = document.querySelectorAll('.subtask-input-group');
    
    const subtasks = Array.from(subtaskGroups)
        .map(group => {
            const text = group.querySelector('.subtask-input').value.trim();
            const timeEstimate = group.querySelector('.subtask-time').value;
            return { 
                text, 
                timeEstimate: timeEstimate ? parseInt(timeEstimate) : null,
                completed: false 
            };
        })
        .filter(subtask => subtask.text !== '');
    
    const task = {
        id: Date.now(),
        name: taskName,
        deadline: deadline,
        subtasks: subtasks,
        completed: false,
        completedDate: null
    };
    
    tasks.push(task);
    saveTasks();
    
    updateAchievement('first-task', 1);
    updateAchievement('task-master', 1);
    
    // Reset form
    document.getElementById('add-task-form').reset();
    document.getElementById('subtask-inputs').innerHTML = `
        <div class="subtask-input-group">
            <input type="text" placeholder="Subtask 1" class="subtask-input" required>
            <input type="number" placeholder="Est. time (min)" class="subtask-time" min="0">
        </div>
    `;
    
    closeModal();
    
    renderTasks();
});

function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: var(--text-600); padding: 2rem;">No tasks yet. Add your first task above!</p>';
        renderUrgentReminders();
        return;
    }
    
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    sortedTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
        const progress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length * 100) : 0;
        
        const deadline = new Date(task.deadline);
        const now = new Date();
        const isOverdue = deadline < now && !task.completed;
        const deadlineClass = task.completed ? 'completed' : (isOverdue ? 'overdue' : '');
        
        const canDelete = task.completed || completedSubtasks === 0;
        const deleteButton = canDelete ? `<button class="task-delete-btn" onclick="deleteTask(${task.id}); event.stopPropagation();">🗑️ Delete</button>` : '';
        
        card.innerHTML = `
            <div class="task-header" onclick="toggleSubtasks(${task.id})">
                <div class="task-title-row">
                    <div class="task-title">
                        ${task.name}
                        <span class="expand-icon" id="icon-${task.id}">▼</span>
                    </div>
                    ${deleteButton}
                </div>
                <div class="task-deadline ${deadlineClass}">
                    ${formatDeadline(task.deadline)}
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${completedSubtasks} / ${task.subtasks.length} subtasks</span>
                </div>
                <div class="progress-bar-container" data-progress="${Math.round(progress)}%">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="subtasks" id="subtasks-${task.id}">
                ${task.subtasks.map((subtask, idx) => `
                    <div class="subtask-item ${subtask.completed ? 'completed' : ''}">
                        <input type="checkbox" 
                               class="subtask-checkbox" 
                               ${subtask.completed ? 'checked' : ''}
                               onchange="toggleSubtask(${task.id}, ${idx}); event.stopPropagation();"
                               onclick="event.stopPropagation();">
                        <span class="subtask-text">${subtask.text}</span>
                        ${subtask.timeEstimate ? `<span class="subtask-time-badge">${subtask.timeEstimate} min</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        taskList.appendChild(card);
    });
    
    renderUrgentReminders();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            const completedSubtasks = task.subtasks.filter(st => st.completed).length;
            const isNotStarted = completedSubtasks === 0;
            
            if (isNotStarted) {
                const firstTaskAchievement = achievements.find(a => a.id === 'first-task');
                const taskMasterAchievement = achievements.find(a => a.id === 'task-master');
                
                if (firstTaskAchievement && firstTaskAchievement.progress > 0) {
                    firstTaskAchievement.progress--;
                    if (firstTaskAchievement.progress < firstTaskAchievement.goal) {
                        firstTaskAchievement.unlocked = false;
                    }
                }
                
                if (taskMasterAchievement && taskMasterAchievement.progress > 0) {
                    taskMasterAchievement.progress--;
                    if (taskMasterAchievement.progress < taskMasterAchievement.goal) {
                        taskMasterAchievement.unlocked = false;
                    }
                }
                
                saveAchievements();
            }
            
            tasks.splice(taskIndex, 1);
            saveTasks();
            renderTasks();
        }
    }
}

function toggleSubtasks(taskId) {
    const subtasks = document.getElementById(`subtasks-${taskId}`);
    const icon = document.getElementById(`icon-${taskId}`);
    subtasks.classList.toggle('expanded');
    icon.classList.toggle('expanded');
}

function toggleSubtask(taskId, subtaskIdx) {
    const task = tasks.find(t => t.id === taskId);
    task.subtasks[subtaskIdx].completed = !task.subtasks[subtaskIdx].completed;
    
    const subtaskItem = event.target.closest('.subtask-item');
    if (task.subtasks[subtaskIdx].completed) {
        subtaskItem.classList.add('completed');
    } else {
        subtaskItem.classList.remove('completed');
    }
    
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    const progress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length * 100) : 0;
    
    const taskCard = document.getElementById(`subtasks-${taskId}`).closest('.task-card');
    const progressBar = taskCard.querySelector('.progress-bar');
    const progressContainer = taskCard.querySelector('.progress-bar-container');
    const progressLabel = taskCard.querySelector('.progress-label span:last-child');
    
    progressBar.style.width = `${progress}%`;
    progressContainer.setAttribute('data-progress', `${Math.round(progress)}%`);
    progressLabel.textContent = `${completedSubtasks} / ${task.subtasks.length} subtasks`;
    
    const allCompleted = task.subtasks.every(st => st.completed);
    if (allCompleted && !task.completed) {
        task.completed = true;
        task.completedDate = new Date().toISOString();
        
        const deadline = new Date(task.deadline);
        const completedDate = new Date(task.completedDate);
        const onTime = completedDate <= deadline;
        
        stats.totalCompleted++;
        if (onTime) {
            stats.completedOnTime++;
        } else {
            stats.completedLate++;
        }
        saveStats();
        
        updateAchievement('first-completion', 1);
        updateAchievement('speedrunner', 1);
        updateAchievement('dedicated', 1);
        
        if (onTime) {
            updateAchievement('on-time-warrior', 1);
            updateAchievement('perfectionist', 1);
        } else {
            updateAchievement('comeback-kid', 1);
        }
        
        const deadlineBadge = taskCard.querySelector('.task-deadline');
        deadlineBadge.classList.remove('overdue');
        deadlineBadge.classList.add('completed');
        
        saveTasks();
        renderTasks();
        renderUrgentReminders();
        return;
    }
    
    saveTasks();
}

function formatDeadline(deadline) {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    return `${dateStr} ${timeStr}`;
}

function renderUrgentReminders() {
    const urgentList = document.getElementById('urgent-list');
    const now = new Date();
    
    const urgentTasks = tasks
        .filter(t => !t.completed)
        .map(t => ({
            ...t,
            timeRemaining: new Date(t.deadline) - now
        }))
        .filter(t => t.timeRemaining > 0 && t.timeRemaining < 48 * 60 * 60 * 1000)
        .sort((a, b) => a.timeRemaining - b.timeRemaining)
        .slice(0, 3);
    
    if (urgentTasks.length === 0) {
        document.getElementById('urgent-reminders').style.display = 'none';
        return;
    }
    
    document.getElementById('urgent-reminders').style.display = 'block';
    urgentList.innerHTML = urgentTasks.map(task => {
        const hours = Math.floor(task.timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((task.timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return `
            <div class="urgent-item">
                <span class="urgent-task-name">${task.name}</span> - 
                <span class="urgent-time">${hours}h ${minutes}m remaining</span>
            </div>
        `;
    }).join('');
}

function updateStatistics() {
    const inProgress = tasks.filter(t => !t.completed).length;
    
    document.getElementById('stat-completed').textContent = stats.totalCompleted;
    document.getElementById('stat-in-progress').textContent = inProgress;
    document.getElementById('stat-on-time').textContent = stats.completedOnTime;
    document.getElementById('stat-late').textContent = stats.completedLate;
}

function updateAchievement(achievementId, increment) {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    achievement.progress += increment;
    if (achievement.progress >= achievement.goal) {
        achievement.unlocked = true;
        achievement.progress = achievement.goal;
        showAchievementNotification(achievement);
    }
    
    saveAchievements();
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
        color: var(--text-50);
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="font-size: 2rem; text-align: center;">${achievement.icon}</div>
        <div style="font-weight: 700; margin-top: 0.5rem;">Achievement Unlocked!</div>
        <div>${achievement.title}</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = achievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-progress">
                ${achievement.progress} / ${achievement.goal}
            </div>
        </div>
    `).join('');
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveAchievements() {
    localStorage.setItem('achievements', JSON.stringify(achievements));
}

function saveStats() {
    localStorage.setItem('stats', JSON.stringify(stats));
}

renderTasks();
renderAchievements();
