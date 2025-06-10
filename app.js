// Todo List State
let todos = {
    normal: [],
    daily: [],
    weekly: []
};
let currentFilter = 'all';
let currentCategory = 'all'; // 기본 카테고리를 'all'로 설정
let isDeadlineEnabled = false;

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const filterAll = document.getElementById('filter-all');
const filterActive = document.getElementById('filter-active');
const filterCompleted = document.getElementById('filter-completed');
const themeToggle = document.getElementById('theme-toggle');
const categoryNormal = document.getElementById('category-normal');
const categoryDaily = document.getElementById('category-daily');
const categoryWeekly = document.getElementById('category-weekly');
const categoryAll = document.getElementById('category-all');
const resetInfo = document.getElementById('reset-info');
const resetTime = document.getElementById('reset-time');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const deadlineSection = document.getElementById('deadline-section');
const deadlineToggle = document.getElementById('deadline-toggle');
const deadlineInputContainer = document.getElementById('deadline-input-container');
const deadlineInput = document.getElementById('deadline-input');
const manualReset = document.getElementById('manual-reset');

// Circular Menu
const mainOption = document.getElementById('main-option');
const circularMenuItems = document.getElementById('circular-menu-items');
const resetProgressButton = document.getElementById('reset-progress'); // 진행 상황 초기화 버튼
const deleteAllButton = document.getElementById('delete-all'); // 모든 항목 삭제 버튼
const loginBtn = document.getElementById('login-btn'); // 로그인 버튼

let isMenuOpen = false;

// Dark mode initialization
function initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('darkMode', isDark.toString());
}

// Theme toggle event listener
themeToggle.addEventListener('click', toggleDarkMode);

// Filter buttons event listeners
filterAll.addEventListener('click', () => setFilter('all'));
filterActive.addEventListener('click', () => setFilter('active'));
filterCompleted.addEventListener('click', () => setFilter('completed'));

// Category button event listeners
categoryNormal.addEventListener('click', () => setCategory('normal'));
categoryDaily.addEventListener('click', () => setCategory('daily'));
categoryWeekly.addEventListener('click', () => setCategory('weekly'));
categoryAll.addEventListener('click', () => setCategory('all'));

// Set active filter
function setFilter(filter) {
    currentFilter = filter;
    updateFilterButtons();
    renderTodos();
}

// Set active category
function setCategory(category) {
    currentCategory = category;
    updateCategoryButtons();
    updateResetInfo();
    updateResetButtonVisibility();
    updateDeadlineVisibility();
    renderTodos();
}

// Update filter buttons UI
function updateFilterButtons() {
    let todosToCheck = currentCategory === 'all'
        ? Object.values(todos).flat()
        : todos.hasOwnProperty(currentCategory) ? todos[currentCategory] : [];

    const hasActive = todosToCheck.some(todo => !todo.completed);
    const hasCompleted = todosToCheck.some(todo => todo.completed);
    const hasTodos = todosToCheck.length > 0;

    // Reset all button styles
    [filterAll, filterActive, filterCompleted].forEach(btn => {
        btn.classList.remove('text-blue-500', 'text-purple-400');
        btn.classList.add(document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-600');
    });

    // Highlight the current filter
    const activeButton = {
        'all': filterAll,
        'active': filterActive,
        'completed': filterCompleted
    }[currentFilter];

    if (activeButton) {
        if (document.documentElement.classList.contains('dark')) {
            activeButton.classList.add('text-purple-400');
        } else {
            activeButton.classList.add('text-blue-500');
        }
    }

    // Update filter buttons' opacity based on available todos
    filterActive.style.opacity = hasActive ? '1' : '0.5';
    filterCompleted.style.opacity = hasCompleted ? '1' : '0.5';
    filterAll.style.opacity = hasTodos ? '1' : '0.5';
}

// Update category buttons UI
function updateCategoryButtons() {
    [categoryAll, categoryNormal, categoryDaily, categoryWeekly].forEach(btn => {
        btn.classList.add('opacity-50');
        btn.classList.remove('active');
    });

    const activeButton = {
        'all': categoryAll,
        'normal': categoryNormal,
        'daily': categoryDaily,
        'weekly': categoryWeekly
    }[currentCategory];

    if (activeButton) {
        activeButton.classList.remove('opacity-50');
        activeButton.classList.add('active');
    }
    updateDeadlineVisibility();
}

// Update reset info
function updateResetInfo() {
    if (currentCategory === 'all' || currentCategory === 'normal') {
        resetInfo.classList.add('hidden');
        manualReset.classList.add('hidden');
        return;
    }

    resetInfo.classList.remove('hidden');
    const now = new Date();
    let nextReset;

    if (currentCategory === 'daily') {
        nextReset = new Date(now);
        if (now.getHours() >= 6) {
            nextReset.setDate(nextReset.getDate() + 1);
        }
        nextReset.setHours(6, 0, 0, 0);
        resetTime.textContent = `Resets daily at 6 AM`;
    } else if (currentCategory === 'weekly') {
        nextReset = new Date(now);
        const daysUntilMonday = (8 - nextReset.getDay()) % 7 || 7;
        nextReset.setDate(nextReset.getDate() + daysUntilMonday);
        nextReset.setHours(6, 0, 0, 0);
        if (now.getDay() === 1 && now.getHours() >= 6) {
            nextReset.setDate(nextReset.getDate() + 7);
        }
        resetTime.textContent = `Resets Monday at 6 AM`;
    }
}

// Format time
function formatTime(date) {
    return new Intl.DateTimeFormat('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}

// Check and perform resets
function checkResets() {
    const now = new Date();
    const lastReset = localStorage.getItem('lastReset') ? new Date(localStorage.getItem('lastReset')) : null;

    if (!lastReset) {
        localStorage.setItem('lastReset', now.toISOString());
        return;
    }

    // Daily reset check
    if ((now.getHours() >= 6 && lastReset.getHours() < 6) ||
        (now.getDate() !== lastReset.getDate() && now.getHours() >= 6)) {
        todos.daily.forEach(todo => {
            todo.completed = false;
        });
    }

    // Weekly reset check
    if (now.getHours() >= 6 && now.getDay() === 1 &&
        (lastReset.getDay() !== 1 || (lastReset.getDay() === 1 && lastReset.getHours() < 6))) {
        todos.weekly.forEach(todo => {
            todo.completed = false;
        });
    }

    localStorage.setItem('lastReset', now.toISOString());
    saveTodos();
    renderTodos();
}

// Save todos to localStorage
function saveTodos() {
    const username = localStorage.getItem('username');
    const key = username ? `todos_${username}` : 'todos';
    localStorage.setItem(key, JSON.stringify(todos));
}

// Load todos from localStorage
function loadTodos() {
    const username = localStorage.getItem('username');
    const key = username ? `todos_${username}` : 'todos';
    const savedTodos = localStorage.getItem(key);
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
}

// Generate unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Update todo count and progress bar
function updateTodoCount() {
    let total = 0;
    let completed = 0;

    if (currentCategory === 'all') {
        Object.values(todos).forEach(categoryTodos => {
            total += categoryTodos.length;
            completed += categoryTodos.filter(t => t.completed).length;
        });
    } else if (todos.hasOwnProperty(currentCategory)) {
        const currentTodos = todos[currentCategory];
        total = currentTodos.length;
        completed = currentTodos.filter(t => t.completed).length;
    }

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const progressBarElement = document.getElementById('progress-bar');
    const progressPercentElement = document.getElementById('progress-percent');

    if (progressBarElement && progressPercentElement) {
        progressBarElement.style.width = `${percent}%`;
        progressPercentElement.textContent = `${percent}%`;

        if (percent === 100) {
            progressBarElement.classList.add('animate-pulse');
        } else {
            progressBarElement.classList.remove('animate-pulse');
        }
    }

    updateFilterButtons();
}

// Format remaining time
function formatTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    if (isNaN(diff)) {
        return '';
    }

    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let timeString = '';
    if (days > 0) {
        timeString += `${days}일 `;
    }
    timeString += `${hours}시간`;

    return diff < 0 ? `${timeString} 지남` : `${timeString} 남음`;
}

// Update deadline visibility and form visibility
function updateDeadlineVisibility() {
    const todoForm = document.getElementById('todo-form');

    if (currentCategory === 'all') {
        todoForm.classList.add('hidden');
        deadlineSection.classList.add('hidden');
        resetInfo.classList.add('hidden');
    } else {
        todoForm.classList.remove('hidden');

        if (currentCategory === 'normal') {
            deadlineSection.classList.remove('hidden');
            if (deadlineToggle.classList.contains('bg-blue-500')) {
                deadlineInputContainer.classList.remove('hidden');
            }
        } else {
            deadlineSection.classList.add('hidden');
            deadlineInputContainer.classList.add('hidden');
            deadlineToggle.classList.remove('bg-blue-500');
            deadlineToggle.querySelector('div').classList.remove('translate-x-6');
            isDeadlineEnabled = false;
        }

        if (currentCategory !== 'normal' && currentCategory !== 'all') {
            resetInfo.classList.remove('hidden');
        } else {
            resetInfo.classList.add('hidden');
        }
    }
}

// Toggle deadline functionality
deadlineToggle.addEventListener('click', () => {
    isDeadlineEnabled = !isDeadlineEnabled;
    deadlineToggle.classList.toggle('bg-blue-500', isDeadlineEnabled);
    deadlineToggle.querySelector('div').classList.toggle('translate-x-6', isDeadlineEnabled);
    deadlineInputContainer.classList.toggle('hidden', !isDeadlineEnabled);
});

// Add todo with deadline support
document.getElementById('todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('todo-input');
    const text = input.value.trim();

    if (text) {
        const deadline = currentCategory === 'normal' && isDeadlineEnabled ? deadlineInput.value : '';

        todos[currentCategory].push({
            id: generateUniqueId(), // Add unique ID
            text,
            completed: false,
            deadline
        });

        input.value = '';
        if (isDeadlineEnabled) deadlineInput.value = '';

        saveTodos();
        renderTodos();
    }
});

// Update deadlines every second
setInterval(() => {
    document.querySelectorAll('.deadline-time').forEach(span => {
        const deadline = span.getAttribute('data-deadline');
        if (deadline) {
            span.textContent = formatTimeRemaining(deadline);
        }
    });
}, 1000);

// Render Todos
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    let todosToRender = [];
    if (currentCategory === 'all') {
        Object.entries(todos).forEach(([category, categoryTodos]) => {
            todosToRender = todosToRender.concat(
                categoryTodos.map(todo => ({
                    ...todo,
                    category // Add category to todo object
                }))
            );
        });
    } else {
        todosToRender = todos[currentCategory].map(todo => ({
            ...todo,
            category: currentCategory
        }));
    }

    // Apply filter
    if (currentFilter === 'active') {
        todosToRender = todosToRender.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        todosToRender = todosToRender.filter(todo => todo.completed);
    }

    // Sort todos (grouped by category for 'all' view)
    todosToRender.sort((a, b) => {
        const now = new Date();

        const getTimeValue = (todo) => {
            if (todo.deadline) {
                const deadlineDate = new Date(todo.deadline);
                return isNaN(deadlineDate) ? Infinity : deadlineDate.getTime();
            } else if (todo.category === 'daily') {
                const nextReset = new Date(now);
                if (now.getHours() >= 6) {
                    nextReset.setDate(nextReset.getDate() + 1);
                }
                nextReset.setHours(6, 0, 0, 0);
                return nextReset.getTime();
            } else if (todo.category === 'weekly') {
                const nextReset = new Date(now);
                const daysUntilMonday = (8 - nextReset.getDay()) % 7 || 7;
                nextReset.setDate(nextReset.getDate() + daysUntilMonday);
                nextReset.setHours(6, 0, 0, 0);
                return nextReset.getTime();
            }
            return Infinity;
        };

        // Sort by category first in 'all' view, then by deadline/reset
        if (currentCategory === 'all') {
            const categoryOrder = { daily: 0, weekly: 1, normal: 2 }; // Define order
            const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
            if (categoryDiff !== 0) return categoryDiff;
        }

        return getTimeValue(a) - getTimeValue(b);
    });


    // Remove any existing reset info container for 'all' category before re-rendering
    const existingResetContainer = document.querySelector('.reset-info-container-all');
    if (existingResetContainer) {
        existingResetContainer.remove();
    }

    // Display reset information for All category (only if there are daily/weekly tasks)
    const filterContainer = document.querySelector('.filter-container');
    if (currentCategory === 'all') {
        const hasDaily = todos.daily.length > 0;
        const hasWeekly = todos.weekly.length > 0;

        if (hasDaily || hasWeekly) {
            const resetContainer = document.createElement('div');
            resetContainer.className = 'mb-4 text-center text-sm text-gray-500 dark:text-gray-400 reset-info-container-all';

            let resetText = '';
            if (hasDaily && hasWeekly) {
                resetText = 'Daily tasks reset at 6 AM / Weekly tasks reset Monday 6 AM';
            } else if (hasDaily) {
                resetText = 'Daily tasks reset at 6 AM';
            } else if (hasWeekly) {
                resetText = 'Weekly tasks reset Monday 6 AM';
            }
            resetContainer.textContent = resetText;

            // Insert before the filter container
            const parent = filterContainer.parentNode;
            parent.insertBefore(resetContainer, filterContainer);
        }
    }


    // Render filtered todos
    let currentDisplayedCategory = ''; // 카테고리 헤더 중복 방지를 위한 변수
    todosToRender.forEach((todo, idx) => {
        // Add category header for categories in All view
        if (currentCategory === 'all' && currentDisplayedCategory !== todo.category) {
            currentDisplayedCategory = todo.category;
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'text-lg font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-2';
            categoryHeader.textContent = todo.category.charAt(0).toUpperCase() + todo.category.slice(1) + ' Tasks';
            todoList.appendChild(categoryHeader);
        }

        const li = document.createElement('li');
        const isDark = document.documentElement.classList.contains('dark');

        li.className = `group flex items-center justify-between ${
            isDark ? 'bg-gray-800/50' : 'bg-white'
        } px-6 py-4 rounded-xl border ${
            isDark ? 'border-gray-700/50 hover:border-purple-500/50' : 'border-gray-200 hover:border-blue-500/50'
        } transition-all shadow-sm`;

        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-center gap-4 flex-1';

        const checkbox = document.createElement('button');
        checkbox.className = `w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completed
                ? (isDark ? 'border-purple-500 bg-purple-500' : 'border-blue-500 bg-blue-500')
                : (isDark ? 'border-gray-600' : 'border-gray-300')
        }`;
        if (todo.completed) {
            checkbox.innerHTML = '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        }
        // Pass the actual todo object for deletion/toggling to correctly find its index in the original array
        checkbox.onclick = () => toggleTodo(todo.category, todo.id);

        const textContent = document.createElement('div');
        textContent.className = 'flex items-center';

        const text = document.createElement('span');
        text.className = todo.completed
            ? 'line-through text-gray-400'
            : (isDark ? 'text-white' : 'text-gray-800');
        text.textContent = todo.text;

        textContent.appendChild(text);

        if (currentCategory === 'all') {
            const categoryTag = document.createElement('span');
            categoryTag.className = 'text-xs font-medium px-2 py-1 rounded-full ml-2';

            const categoryColors = {
                normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                daily: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                weekly: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
            };

            categoryTag.className += ' ' + categoryColors[todo.category];
            categoryTag.textContent = todo.category.charAt(0).toUpperCase() + todo.category.slice(1);
            textContent.appendChild(categoryTag);
        }

        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center gap-3';

        const now = new Date();
        const getTimeLeft = (todoItem) => {
            if (todoItem.deadline) {
                const deadlineDate = new Date(todoItem.deadline);
                return isNaN(deadlineDate) ? Infinity : deadlineDate.getTime() - now.getTime();
            } else if (todoItem.category === 'daily') {
                const nextReset = new Date();
                if (now.getHours() >= 6) {
                    nextReset.setDate(nextReset.getDate() + 1);
                }
                nextReset.setHours(6, 0, 0, 0);
                return nextReset.getTime() - now.getTime();
            } else if (todoItem.category === 'weekly') {
                const nextReset = new Date();
                const daysUntilMonday = (8 - nextReset.getDay()) % 7 || 7;
                nextReset.setDate(nextReset.getDate() + daysUntilMonday);
                nextReset.setHours(6, 0, 0, 0);
                return nextReset.getTime() - now.getTime();
            }
            return Infinity;
        };

        const timeLeft = getTimeLeft(todo);
        const priorityColors = {
            high: 'bg-red-500',
            medium: 'bg-yellow-500',
            low: 'bg-green-500'
        };

        let priority = 'low';
        const hoursLeft = timeLeft / (1000 * 60 * 60);

        if (todo.deadline || todo.category === 'daily' || todo.category === 'weekly') {
             if (hoursLeft <= 12 && timeLeft > 0) { // 마감 기한이 12시간 이내이고 아직 지나지 않았을 때
                priority = 'high';
            } else if (hoursLeft <= 24 && timeLeft > 0) { // 마감 기한이 24시간 이내이고 아직 지나지 않았을 때
                priority = 'medium';
            } else if (timeLeft <= 0) { // 마감 기한이 지났을 때
                priority = 'high'; // 지난 항목도 중요하게 표시할 수 있도록
            } else {
                priority = 'low';
            }
        }

        const priorityIndicator = document.createElement('div');
        priorityIndicator.className = `w-2 h-2 rounded-full ${priorityColors[priority]} transition-colors duration-200`;
        if (todo.deadline || todo.category === 'daily' || todo.category === 'weekly') {
            rightSection.appendChild(priorityIndicator);
        }

        if (todo.deadline) {
            const deadlineEl = document.createElement('span');
            deadlineEl.className = 'text-sm text-gray-500 dark:text-gray-400 deadline-time'; // 클래스 추가
            deadlineEl.setAttribute('data-deadline', todo.deadline); // 데이터 속성 추가
            deadlineEl.textContent = formatTimeRemaining(todo.deadline);
            rightSection.appendChild(deadlineEl);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity';
        deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        // Pass the actual todo object for deletion/toggling to correctly find its index in the original array
        deleteBtn.onclick = () => deleteTodo(todo.category, todo.id);

        rightSection.appendChild(deleteBtn);

        leftSection.appendChild(checkbox);
        leftSection.appendChild(textContent);
        li.appendChild(leftSection);
        li.appendChild(rightSection);
        todoList.appendChild(li);
    });

    updateTodoCount();
    updateResetInfo();
}

// Toggle Complete
function toggleTodo(category, id) {
    const todoIndex = todos[category].findIndex(todo => todo.id === id);
    
    if (todoIndex !== -1) {
        todos[category][todoIndex].completed = !todos[category][todoIndex].completed;
        saveTodos();
        renderTodos();
    }
}

// Delete Todo
function deleteTodo(category, id) {
    const todoIndex = todos[category].findIndex(todo => todo.id === id);

    if (todoIndex !== -1) {
        todos[category].splice(todoIndex, 1);
        saveTodos();
        renderTodos();
    }
}

// Manual reset button functionality
manualReset.addEventListener('click', () => {
    const category = currentCategory;
    if (category !== 'daily' && category !== 'weekly') return;

    if (confirm(`${category === 'daily' ? '일간' : '주간'} 항목들의 달성률을 초기화하시겠습니까?`)) {
        todos[category].forEach(todo => {
            todo.completed = false;
        });
        saveTodos();
        renderTodos();
        updateTodoCount();
    }
});

// Delete all tasks functionality (circular menu)
deleteAllButton.addEventListener('click', () => {
  if (confirm('모든 카테고리의 모든 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    ['normal', 'daily', 'weekly'].forEach(category => {
      todos[category] = [];
    });
    saveTodos();
    renderTodos();
    updateTodoCount();
  }
});

// Reset progress (circular menu) - renamed from reset-all to be more descriptive
resetProgressButton.addEventListener('click', () => {
  if (confirm('모든 카테고리의 진행도를 초기화하시겠습니까?')) {
    Object.keys(todos).forEach(category => {
      todos[category].forEach(todo => {
        todo.completed = false;
      });
    });
    saveTodos();
    renderTodos();
    updateTodoCount();
  }
});


// Update reset button visibility
function updateResetButtonVisibility() {
    if (currentCategory === 'normal' || currentCategory === 'all') {
        manualReset.classList.add('hidden');
    } else {
        const hasTasks = todos[currentCategory].length > 0;
        if (hasTasks) {
            manualReset.classList.remove('hidden');
        } else {
            manualReset.classList.add('hidden');
        }
    }
}

// Circular Menu Toggle
mainOption.addEventListener('click', (e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        circularMenuItems.classList.add('open');
        mainOption.parentElement.classList.add('active');
    } else {
        circularMenuItems.classList.remove('open');
        mainOption.parentElement.classList.remove('active');
    }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    // 메뉴를 클릭했을 때만 닫히지 않도록
    if (isMenuOpen && !e.target.closest('#circular-menu')) {
        isMenuOpen = false;
        circularMenuItems.classList.remove('open');
    }
});

// Login Functionality
const loginModal = document.getElementById('login-modal');
const loginSubmit = document.getElementById('login-submit');
const loginCancel = document.getElementById('login-cancel');
const usernameInput = document.getElementById('username-input');

loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
});

loginCancel.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    usernameInput.value = '';
});

loginSubmit.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        localStorage.setItem('username', username);
        loginModal.classList.add('hidden');
        loadUserTodos(username);
    }
});

// Load user's todos
function loadUserTodos(username) {
    const userTodos = localStorage.getItem(`todos_${username}`);
    if (userTodos) {
        todos = JSON.parse(userTodos);
        renderTodos();
    } else {
        todos = { normal: [], daily: [], weekly: [] };
        renderTodos();
    }
}

// Initializations
initializeTheme();
loadTodos();
setCategory('all'); // 시작 시 'all' 카테고리가 선택되도록 변경
updateResetButtonVisibility();
setInterval(checkResets, 60000);
checkResets();
renderTodos();