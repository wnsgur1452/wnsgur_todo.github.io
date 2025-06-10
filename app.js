// Todo List State
let todos = {
    normal: [],
    daily: [],
    weekly: []
};
let currentFilter = 'all';
let currentCategory = 'normal';
let isDeadlineEnabled = false;

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
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

// Dark mode initialization
function initializeTheme() {
    // Check local storage first
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    // Set initial dark mode state
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
    const currentTodos = todos[currentCategory];
    const hasActive = currentTodos.some(todo => !todo.completed);
    const hasCompleted = currentTodos.some(todo => todo.completed);

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
    
    if (document.documentElement.classList.contains('dark')) {
        activeButton.classList.add('text-purple-400');
    } else {
        activeButton.classList.add('text-blue-500');
    }

    // Update filter buttons' opacity based on available todos
    filterActive.style.opacity = hasActive ? '1' : '0.5';
    filterCompleted.style.opacity = hasCompleted ? '1' : '0.5';
    filterAll.style.opacity = currentTodos.length > 0 ? '1' : '0.5';
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
    
    activeButton.classList.remove('opacity-50');
    activeButton.classList.add('active');
    updateDeadlineVisibility();
}

// Update reset info
function updateResetInfo() {
    if (currentCategory === 'normal') {
        resetInfo.classList.add('hidden');
        return;
    }

    resetInfo.classList.remove('hidden');
    const now = new Date();
    let nextReset;    if (currentCategory === 'daily') {
        nextReset = new Date(now);
        if (now.getHours() >= 6) {        nextReset.setDate(nextReset.getDate() + 1);
        }        nextReset.setHours(6, 0, 0, 0);
        resetTime.textContent = `Resets at 6 AM`;} else if (currentCategory === 'weekly') {
        nextReset = new Date(now);
        // Calculate days until next Monday (1 represents Monday in getDay())
        const daysUntilMonday = (8 - nextReset.getDay()) % 7 || 7;
        nextReset.setDate(nextReset.getDate() + daysUntilMonday);
        nextReset.setHours(6, 0, 0, 0);        if (now.getDay() === 1 && now.getHours() >= 6) {
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
    }    // Daily reset at 6:00 AM
    if (now.getHours() >= 6 && lastReset.getHours() < 6 || 
        now.getDate() !== lastReset.getDate()) {
        // Reset completion status for daily tasks
        todos.daily.forEach(todo => {
            todo.completed = false;
        });
    }

    // Weekly reset (on Monday at 6:00 AM)
    if (now.getHours() >= 6 && now.getDay() === 1 && 
        (lastReset.getDay() !== 1 || lastReset.getHours() < 6)) {
        // Reset completion status for weekly tasks
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
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Load todos from localStorage
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
}

// Update todo count and progress bar
function updateTodoCount() {
    let total = 0;
    let completed = 0;

    if (currentCategory === 'all') {
        // Calculate progress for all categories combined
        Object.values(todos).forEach(categoryTodos => {
            total += categoryTodos.length;
            completed += categoryTodos.filter(t => t.completed).length;
        });
    } else {
        const currentTodos = todos[currentCategory];
        total = currentTodos.length;
        completed = currentTodos.filter(t => t.completed).length;
    }

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    
    if (percent === 100) {
        progressBar.classList.add('animate-pulse');
    } else {
        progressBar.classList.remove('animate-pulse');
    }

    // Update filter buttons UI based on available todos
    updateFilterButtons();
}

// Progress Bar and Todo count update
function updateProgress() {
  const todos = document.querySelectorAll('.todo-item');
  const completedTodos = document.querySelectorAll('.todo-item input[type="checkbox"]:checked');
  const progressPercent = document.getElementById('progress-percent');
  const progressBar = document.getElementById('progress-bar');
  
  if (todos.length === 0) {
    progressPercent.textContent = '0%';
    progressBar.style.width = '0%';
    return;
  }

  const percent = Math.round((completedTodos.length / todos.length) * 100);
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

// Format remaining time
function formatTimeRemaining(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  if (diff < 0) {
    // Overdue
    const overdueDiff = Math.abs(diff);
    const days = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}일 ${hours}시간 지남`;
    return `${hours}시간 지남`;
  } else {
    // Remaining
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}일 ${hours}시간 남음`;
    return `${hours}시간 남음`;
  }
}

// Update deadline visibility and form visibility
function updateDeadlineVisibility() {
  const todoForm = document.getElementById('todo-form');
  
  if (currentCategory === 'all') {
    // Hide form and deadline section in All view
    todoForm.classList.add('hidden');
    deadlineSection.classList.add('hidden');
    resetInfo.classList.add('hidden');
  } else {
    // Show form in other categories
    todoForm.classList.remove('hidden');
    
    // Show deadline only in normal category
    if (currentCategory === 'normal') {
      deadlineSection.classList.remove('hidden');
    } else {
      deadlineSection.classList.add('hidden');
      deadlineInputContainer.classList.add('hidden');
      deadlineToggle.classList.remove('bg-blue-500');
      deadlineToggle.querySelector('div').classList.remove('translate-x-6');
    }
    
    // Show reset info for daily/weekly
    if (currentCategory !== 'normal') {
      resetInfo.classList.remove('hidden');
    } else {
      resetInfo.classList.add('hidden');
    }
  }
}

// Toggle deadline functionality
deadlineToggle.addEventListener('click', () => {
  deadlineToggle.classList.toggle('bg-blue-500');
  deadlineToggle.querySelector('div').classList.toggle('translate-x-6');
  deadlineInputContainer.classList.toggle('hidden');
});

// Category button event listeners
categoryNormal.addEventListener('click', () => {
    setCategory('normal');
    updateDeadlineVisibility();
});
categoryDaily.addEventListener('click', () => {
    setCategory('daily');
    updateDeadlineVisibility();
});
categoryWeekly.addEventListener('click', () => {
    setCategory('weekly');
    updateDeadlineVisibility();
});
categoryAll.addEventListener('click', () => {
    setCategory('all');
    updateDeadlineVisibility();
});

// Initialize with Normal category active
document.getElementById('category-normal').classList.add('active');
document.getElementById('category-normal').classList.remove('opacity-50');
updateDeadlineVisibility();

// Create todo item with deadline support
function createTodoItem(text, category, deadline = '') {
  const todo = document.createElement('div');
  todo.classList.add('todo-item', 'flex', 'items-center', 'gap-3', 'p-4', 'bg-white/50', 'dark:bg-gray-800/50', 'rounded-xl', 'border', 'border-gray-200', 'dark:border-gray-700/50');
  
  const html = `
    <input type="checkbox" class="w-5 h-5 rounded-lg accent-purple-500">
    <div class="flex-1">
      <span class="todo-text">${text}</span>
      ${deadline ? `
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span class="deadline-time" data-deadline="${deadline}">${formatTimeRemaining(deadline)}</span>
        </div>
      ` : ''}
    </div>
    <button class="delete-btn text-red-500 hover:text-red-600">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
    </button>
  `;
  
  todo.innerHTML = html;
  return todo;
}

// Add todo with deadline support
document.getElementById('todo-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  
  if (text) {
    const deadline = currentCategory === 'normal' && deadlineToggle.classList.contains('bg-blue-500') ? deadlineInput.value : '';
    
    // Add new todo to the state
    todos[currentCategory].push({
      text,
      completed: false,
      deadline
    });
    
    // Clear inputs
    input.value = '';
    if (deadline) deadlineInput.value = '';
    
    // Update UI
    saveTodos();
    renderTodos();
  }
});

// Update deadlines every minute
setInterval(() => {
  document.querySelectorAll('.deadline-time').forEach(span => {
    const deadline = span.getAttribute('data-deadline');
    if (deadline) {
      span.textContent = formatTimeRemaining(deadline);
    }
  });
}, 60000);

// Render Todos
function renderTodos() {
    let todosToRender = [];
    if (currentCategory === 'all') {
        Object.entries(todos).forEach(([category, categoryTodos]) => {
            todosToRender = todosToRender.concat(
                categoryTodos.map(todo => ({
                    ...todo,
                    category: category
                }))
            );
        });
    } else {
        todosToRender = todos[currentCategory].map(todo => ({
            ...todo,
            category: currentCategory
        }));
    }

    const filteredTodos = todosToRender.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    todoList.innerHTML = '';
    filteredTodos.forEach((todo, idx) => {
        const li = document.createElement('li');
        const isDark = document.documentElement.classList.contains('dark');
        
        li.className = `group flex items-center justify-between ${
            isDark ? 'bg-gray-800/50' : 'bg-white'
        } px-6 py-4 rounded-xl border ${
            isDark ? 'border-gray-700/50 hover:border-purple-500/50' : 'border-gray-200 hover:border-blue-500/50'
        } transition-all shadow-sm`;
        
        // Left section with checkbox and text
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
        checkbox.onclick = () => toggleTodo(todo.category, idx);

        const textContent = document.createElement('div');
        textContent.className = 'flex items-center';

        const text = document.createElement('span');
        text.className = todo.completed 
            ? 'line-through text-gray-400'
            : (isDark ? 'text-white' : 'text-gray-800');
        text.textContent = todo.text;
        
        textContent.appendChild(text);

        // Add category tag if in All Categories view
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

        // Right section with deadline and delete button
        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center gap-3';

        // Add deadline if exists
        if (todo.deadline) {
            const deadlineEl = document.createElement('span');
            deadlineEl.className = 'text-sm text-gray-500 dark:text-gray-400';
            deadlineEl.textContent = formatTimeRemaining(todo.deadline);
            rightSection.appendChild(deadlineEl);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity';
        deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        deleteBtn.onclick = () => deleteTodo(todo.category, idx);

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

// Add Todo
function addTodo(text) {
    if (!text.trim()) return;
    todos[currentCategory].push({ text, completed: false });
    saveTodos();
    renderTodos();
}

// Toggle Complete
function toggleTodo(category, idx) {
    todos[category][idx].completed = !todos[category][idx].completed;
    saveTodos();
    renderTodos();
}

// Delete Todo
function deleteTodo(category, idx) {
    todos[category].splice(idx, 1);
    saveTodos();
    renderTodos();
}

// Form Submit
todoForm.onsubmit = function (e) {
    e.preventDefault();
    addTodo(todoInput.value);
    todoInput.value = '';
};

// Manual reset button functionality
manualReset.addEventListener('click', () => {
    if (confirm(`Reset progress for ${currentCategory} tasks?`)) {
        // Only reset completion status, keep the tasks
        todos[currentCategory].forEach(todo => {
            todo.completed = false;
        });
        saveTodos();
        renderTodos();
        updateTodoCount();
    }
});

// Delete all tasks functionality
document.getElementById('reset-all').addEventListener('click', () => {
  if (confirm('모든 카테고리의 항목을 삭제하시겠습니까?')) {
    ['normal', 'daily', 'weekly'].forEach(category => {
      todos[category] = [];
    });
    saveTodos();
    renderTodos();
    updateTodoCount();
  }
});

// Smart reset functionality (Normal: clear all, Daily/Weekly: reset progress only)
document.getElementById('reset-progress').addEventListener('click', () => {
  if (currentCategory === 'all') {
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
  } else {
    const message = currentCategory === 'normal' 
      ? '일반 카테고리의 모든 항목을 삭제하시겠습니까?' 
      : `${currentCategory === 'daily' ? '일간' : '주간'} 항목들의 진행도를 초기화하시겠습니까?`;

    if (confirm(message)) {
      if (currentCategory === 'normal') {
        // Clear all tasks for normal category
        todos.normal = [];
      } else {
        // Reset only progress for daily/weekly categories
        todos[currentCategory].forEach(todo => {
          todo.completed = false;
        });
      }
      saveTodos();
      renderTodos();
      updateTodoCount();
    }
  }
});

// Update reset button visibility
function updateResetButtonVisibility() {
    if (currentCategory === 'normal') {
        manualReset.classList.add('hidden');
    } else {
        manualReset.classList.remove('hidden');
    }
}

// Initialize
initializeTheme();
loadTodos();
setCategory('normal');
updateResetButtonVisibility();
// Check for resets every minute
setInterval(checkResets, 60000);
// Initial reset check
checkResets();