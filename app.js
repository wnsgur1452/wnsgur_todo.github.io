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
const resetProgressBtn = document.getElementById('reset-progress'); // 진행 상황 초기화 버튼
const deleteAllBtn = document.getElementById('delete-all'); // 모든 항목 삭제 버튼
const loginBtn = document.getElementById('login-btn'); // 로그인 버튼

let isMenuOpen = false;
let menuToggleTimeout = null;

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
    // Get all category buttons
    const categoryButtons = [categoryAll, categoryNormal, categoryDaily, categoryWeekly];
    
    // Remove active class from all buttons
    categoryButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Map for category display names
    const categoryNames = {
        'all': 'All Tasks',
        'normal': 'Normal Tasks',
        'daily': 'Daily Tasks',
        'weekly': 'Weekly Tasks'
    };

    // Add active class to current category button
    const activeButton = {
        'all': categoryAll,
        'normal': categoryNormal,
        'daily': categoryDaily,
        'weekly': categoryWeekly
    }[currentCategory];

    if (activeButton) {
        activeButton.classList.add('active');
        // Update page title to show current category
        document.title = `${categoryNames[currentCategory]} - Modern Todo List`;
    }

    updateDeadlineVisibility();
}

// Update reset info and visibility
function updateResetInfo() {
    // 모든 리셋 관련 UI 요소들을 먼저 숨김
    resetTime.textContent = '';
    manualReset.classList.add('hidden');
    resetInfo.classList.add('hidden');
    document.querySelectorAll('.reset-info-container-all').forEach(container => container.remove());

    // daily나 weekly 카테고리이면서 할 일이 있는 경우에만 리셋 정보를 표시
    if ((currentCategory === 'daily' || currentCategory === 'weekly') && todos[currentCategory].length > 0) {
        manualReset.classList.remove('hidden');
        resetInfo.classList.remove('hidden');
        resetTime.textContent = currentCategory === 'daily' ? 
            'Resets daily at 6 AM' : 
            'Resets Monday at 6 AM';
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

// Save todos to localStorage with proper handling
function saveTodos() {
    try {
        const username = localStorage.getItem('username');
        const key = username ? `todos_${username}` : 'todos';
        localStorage.setItem(key, JSON.stringify(todos));
    } catch (error) {
        console.error('Failed to save todos:', error);
    }
}

// Load todos from localStorage with proper handling
function loadTodos() {
    try {
        const username = localStorage.getItem('username');
        const key = username ? `todos_${username}` : 'todos';
        const savedTodos = localStorage.getItem(key);
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
        }
    } catch (error) {
        console.error('Failed to load todos:', error);
        todos = { normal: [], daily: [], weekly: [] };
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
    if (currentCategory === 'all') {
        todoForm.classList.add('hidden');
        deadlineSection.classList.add('hidden');
        return;
    }

    // Show todo form for all non-all categories
    todoForm.classList.remove('hidden');

    // Show deadline section only for normal category
    if (currentCategory === 'normal') {
        deadlineSection.classList.remove('hidden');
        deadlineInputContainer.classList.toggle('hidden', !isDeadlineEnabled);
    } else {
        deadlineSection.classList.add('hidden');
        deadlineInputContainer.classList.add('hidden');
        deadlineToggle.classList.remove('bg-blue-500');
        deadlineToggle.querySelector('div').classList.remove('translate-x-6');
        isDeadlineEnabled = false;
    }
}

// Toggle deadline functionality
deadlineToggle.addEventListener('click', () => {
    isDeadlineEnabled = !isDeadlineEnabled;
    deadlineToggle.classList.toggle('bg-blue-500', isDeadlineEnabled);
    deadlineToggle.querySelector('div').classList.toggle('translate-x-6', isDeadlineEnabled);
    deadlineInputContainer.classList.toggle('hidden', !isDeadlineEnabled);
});

// Task type priority order
const taskTypePriority = {
    boss: 1,
    external: 2,
    friend: 3,
    personal: 4
};

// Render todos
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    let todosToRender = [];
    if (currentCategory === 'all') {
        Object.entries(todos).forEach(([category, categoryTodos]) => {
            todosToRender = todosToRender.concat(
                categoryTodos.map(todo => ({ ...todo, category }))
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

    // Render each todo
    todosToRender.forEach(todo => {
        const li = document.createElement('li');
        const isDark = document.documentElement.classList.contains('dark');

        li.className = `group flex items-center justify-between ${
            isDark ? 'bg-gray-800/50' : 'bg-white'
        } px-6 py-4 rounded-xl border ${
            isDark ? 'border-gray-700/50 hover:border-purple-500/50' : 'border-gray-200 hover:border-blue-500/50'
        } transition-all shadow-sm`;

        // Left section with checkbox and text
        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-center gap-4 flex-1 min-w-0';
        
        const checkbox = document.createElement('button');
        checkbox.className = `min-w-[20px] min-h-[20px] w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completed
                ? (isDark ? 'border-purple-500 bg-purple-500' : 'border-blue-500 bg-blue-500')
                : (isDark ? 'border-gray-600' : 'border-gray-300')
        }`;

        if (todo.completed) {
            checkbox.innerHTML = '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        }

        checkbox.onclick = () => toggleTodo(todo.category, todo.id);

        // Text content with category tag
        const textContent = document.createElement('div');
        textContent.className = 'flex items-center min-w-0 flex-1';

        // Create wrapper for text and tags
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'flex flex-col gap-1 min-w-0';

        // Add main text with smaller size
        const mainText = document.createElement('span');
        mainText.textContent = todo.text;
        mainText.className = 'text-sm truncate';

        // Right section for deadline, edit and delete buttons
        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center gap-3 ml-4';

        // Add deadline if exists
        if (todo.deadline) {
            const deadlineEl = document.createElement('span');
            deadlineEl.className = 'text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
            deadlineEl.setAttribute('data-deadline', todo.deadline);
            deadlineEl.textContent = formatTimeRemaining(todo.deadline);
            rightSection.appendChild(deadlineEl);
        }

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'text-gray-600 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity';
        editBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
        editBtn.onclick = () => showEditModal(todo);
        rightSection.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity';
        deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        deleteBtn.onclick = () => deleteTodo(todo.category, todo.id);
        rightSection.appendChild(deleteBtn);

        // Create container for tags and task type
        const tagContainer = document.createElement('div');
        tagContainer.className = 'flex flex-wrap gap-1';
        
        // Add task type indicator if exists and is not empty
        if (todo.taskType && todo.taskType !== '') {
            const typeIndicator = document.createElement('span');
            typeIndicator.className = `text-xs px-2 py-0.5 rounded-full ${
                {
                    personal: 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
                    friend: 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300',
                    boss: 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300',
                    external: 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300'
                }[todo.taskType]
            }`;
            typeIndicator.textContent = translations[currentLanguage].taskTypes[todo.taskType];
            tagContainer.appendChild(typeIndicator);
        }
        
        // Add tags if exist
        if (todo.tags && todo.tags.length > 0) {
            todo.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
                tagEl.textContent = tag;
                tagContainer.appendChild(tagEl);
            });
        }
        
        // Add category tag in all view
        if (currentCategory === 'all') {
            const categoryTag = document.createElement('span');
            categoryTag.className = `text-xs px-2 py-0.5 rounded-full ${
                {
                    normal: 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
                    daily: 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300',
                    weekly: 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300'
                }[todo.category]
            }`;
            categoryTag.textContent = translations[currentLanguage].categories[todo.category];
            tagContainer.appendChild(categoryTag);
        }

        // Add tag container if it has any content
        if (tagContainer.children.length > 0) {
            contentWrapper.appendChild(mainText);
            contentWrapper.appendChild(tagContainer);
        } else {
            contentWrapper.appendChild(mainText);
        }

        textContent.appendChild(contentWrapper);
        leftSection.appendChild(checkbox);
        leftSection.appendChild(textContent);
        
        li.appendChild(leftSection);
        li.appendChild(rightSection);
        todoList.appendChild(li);
    });

    updateTodoCount();
    updateResetInfo();
}

// Toggle todo completion
function toggleTodo(category, id) {
    const todoIndex = todos[category].findIndex(todo => todo.id === id);
    if (todoIndex !== -1) {
        todos[category][todoIndex].completed = !todos[category][todoIndex].completed;
        saveTodos();
        renderTodos();
    }
}

// Delete todo
function deleteTodo(category, id) {
    const todoIndex = todos[category].findIndex(todo => todo.id === id);
    if (todoIndex !== -1) {
        todos[category].splice(todoIndex, 1);
        saveTodos();
        renderTodos();
    }
}

// Toggle extended form
function toggleExtendedForm(show) {
    const extendedForm = document.getElementById('todo-form-extended');
    if (show) {
        extendedForm.classList.remove('hidden');
        setTimeout(() => {
            extendedForm.classList.add('show');
            extendedForm.style.maxHeight = extendedForm.scrollHeight + 'px';
            extendedForm.style.opacity = '1';
            extendedForm.style.marginTop = '0.5rem';
        }, 0);
    } else {
        extendedForm.classList.remove('show');
        extendedForm.style.maxHeight = '0';
        extendedForm.style.opacity = '0';
        extendedForm.style.marginTop = '0';
        setTimeout(() => {
            extendedForm.classList.add('hidden');
        }, 300);
    }
}

// Add focus event listener to todo input
document.getElementById('todo-input').addEventListener('focus', () => {
    toggleExtendedForm(true);
});

// Add blur event listener to todo input
document.getElementById('todo-input').addEventListener('blur', (e) => {
    // Check if the related target is within the extended form
    const extendedForm = document.getElementById('todo-form-extended');
    if (!e.relatedTarget || !extendedForm.contains(e.relatedTarget)) {
        const tagsInput = document.getElementById('tags-input');
        const taskType = document.getElementById('task-type');
        // Only hide if both fields are empty
        if ((!tagsInput || !tagsInput.value.trim()) && (!taskType || taskType.value === '')) {
            toggleExtendedForm(false);
        }
    }
});

// Tag translation and correction system
const tagMappings = {
    // Food & Meals (음식/식사)
    '식사': 'Meal',
    '밥': 'Meal',
    '점심': 'Lunch',
    '저녁': 'Dinner',
    '아침': 'Breakfast',
    '간식': 'Snack',
    '햄버거': 'Hamburger',
    '피자': 'Pizza',
    '치킨': 'Chicken',
    '커피': 'Coffee',
    '디저트': 'Dessert',
    '한식': 'Korean Food',
    '중식': 'Chinese Food',
    '일식': 'Japanese Food',
    '양식': 'Western Food',
    
    // Sports (팀/구기 스포츠)
    '축구': 'Soccer',
    '농구': 'Basketball',
    '야구': 'Baseball',
    '배구': 'Volleyball',
    '테니스': 'Tennis',
    
    // Fitness (피트니스)
    '헬스': 'Gym',
    '웨이트': 'Weight Training',
    '요가': 'Yoga',
    '필라테스': 'Pilates',
    '스트레칭': 'Stretching',
    
    // Cardio (유산소)
    '달리기': 'Running',
    '조깅': 'Jogging',
    '수영': 'Swimming',
    '자전거': 'Cycling',
    '등산': 'Hiking',
    
    // Light Exercise (가벼운 운동)
    '산책': 'Walking',
    '스트레칭': 'Stretching',
    
    // Study
    '공부': 'Study',
    '학습': 'Learning',
    '독서': 'Reading',
    '책': 'Book',
    '과제': 'Assignment',
    '시험': 'Exam',
    
    // Work
    '업무': 'Work',
    '회의': 'Meeting',
    '미팅': 'Meeting',
    '프로젝트': 'Project',
    '보고': 'Report',
    '발표': 'Presentation',
    
    // Life
    '장보기': 'Shopping',
    '쇼핑': 'Shopping',
    '청소': 'Cleaning',
    '빨래': 'Laundry',
    
    // Health
    '병원': 'Hospital',
    '약': 'Medicine',
    '건강': 'Health',
    '검진': 'Check-up',
    
    // Entertainment
    '영화': 'Movie',
    '게임': 'Game',
    '음악': 'Music',
    '공연': 'Performance',
    '전시': 'Exhibition',
    
    // Personal
    '약속': 'Appointment',
    '모임': 'Meeting',
    '여행': 'Travel',
    '휴가': 'Vacation',
    '데이트': 'Date'
};

// Common misspellings and variations
const spellingSuggestions = {
    // Food & Meals
    '식사': ['식사', '식싸', '식살'],
    '밥': ['밥', '밪', '밧'],
    '점심': ['점심', '점씸', '접심'],
    '저녁': ['저녁', '저넉', '저녘'],
    '아침': ['아침', '아칢', '아침'],
    '간식': ['간식', '간씩', '간식'],
    '햄버거': ['햄버거', '햄버그', '햄버어'],
    '피자': ['피자', '피짜', '피쟈'],
    '치킨': ['치킨', '치큰', '취킨'],
    '커피': ['커피', '케피', '커피'],
    '디저트': ['디저트', '디쩌트', '디저트'],
    '한식': ['한식', '한씩', '한식'],
    '중식': ['중식', '중씩', '중식'],
    '일식': ['일식', '일씩', '일식'],
    '양식': ['양식', '양씩', '양식'],
    
    // Sports
    '축구': ['축구', '축그', '촉구'],
    '농구': ['농구', '농그', '눙구'],
    '야구': ['야구', '야그', '약구'],
    '배구': ['배구', '배그', '백구'],
    '테니스': ['테니스', '테니수', '태니스'],
    
    // Fitness
    '헬스': ['헬스', '핼스', '헬쓰'],
    '요가': ['요가', '요과', '요까'],
    '필라테스': ['필라테스', '필라테쓰', '필라태스'],
    
    // Cardio
    '달리기': ['달리기', '달르기', '달기'],
    '조깅': ['조깅', '죠깅', '조낑'],
    '수영': ['수영', '수형', '수영'],
    '자전거': ['자전거', '자저거', '자전게'],
    '등산': ['등산', '등싼', '등상'],
    
    // Study
    '공부': ['공부', '공브', '공뿌'],
    '학습': ['학습', '학슴', '학습'],
    '독서': ['독서', '독써', '독소'],
    
    // Work
    '업무': ['업무', '엄무', '업므'],
    '회의': ['회의', '회이', '회희'],
    '미팅': ['미팅', '미딩', '밋팅'],
    
    // Life
    '식사': ['식사', '식싸', '식살'],
    '장보기': ['장보기', '장보끼', '잠보기'],
    '청소': ['청소', '청쏘', '청소'],
    
    // Health
    '병원': ['병원', '병웜', '병원'],
    '건강': ['건강', '건깡', '건강'],
    
    // Entertainment
    '영화': ['영화', '영홰', '영화'],
    '게임': ['게임', '게임', '게입'],
    
    // Personal
    '약속': ['약속', '약쏙', '약속'],
    '모임': ['모임', '모잉', '모임'],
    '여행': ['여행', '여앵', '여행']
};


// 한글 자모 분석을 위한 헬퍼 함수들
function decomposeHangul(char) {
    const offset = char.charCodeAt(0) - 0xAC00;
    if (offset < 0 || offset > 11171) return char; // 한글이 아닌 경우

    const jamo = {
        cho: Math.floor(offset / 28 / 21),
        jung: Math.floor((offset / 28) % 21),
        jong: offset % 28
    };

    const chosung = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const jungsung = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
    const jongsung = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

    return {
        cho: chosung[jamo.cho],
        jung: jungsung[jamo.jung],
        jong: jongsung[jamo.jong]
    };
}

function normalizeHangul(str) {
    let result = '';
    let prevJamo = null;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        // 한글 자모인 경우
        if (/[ㄱ-ㅎㅏ-ㅣ]/.test(char)) {
            if (prevJamo && char === prevJamo) continue; // 중복된 자모 제거
            prevJamo = char;
            result += char;
        }
        // 완성형 한글인 경우
        else if (/[가-힣]/.test(char)) {
            const decomposed = decomposeHangul(char);
            result += char;
            prevJamo = null;
        }
        // 그 외의 문자
        else {
            result += char;
            prevJamo = null;
        }
    }
    return result;
}

// Levenshtein Distance 함수 (오타 교정용)
function levenshteinDistance(a, b) {
    const matrix = [];
    const alen = a.length;
    const blen = b.length;

    for (let i = 0; i <= blen; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= alen; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= blen; i++) {
        for (let j = 1; j <= alen; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[blen][alen];
}

// Function to find the closest match using improved Levenshtein distance with Hangul support
function findClosestMatch(input, dictionary) {
    let minDistance = Infinity;
    let closestMatch = input;
    const normalizedInput = normalizeHangul(input);

    for (const word of Object.keys(dictionary)) {
        // First try exact match with normalized input
        if (normalizedInput === word) {
            return word;
        }

        // Calculate distance with normalized strings
        const distance = levenshteinDistance(normalizedInput, word);
        
        // 자모 분석을 통한 추가 유사도 체크
        let jamoBonus = 0;
        if (/[가-힣]/.test(input)) {
            const inputJamo = Array.from(input).map(decomposeHangul);
            const wordJamo = Array.from(word).map(decomposeHangul);
            
            // 초성이 같으면 유사도 증가
            if (inputJamo[0]?.cho === wordJamo[0]?.cho) jamoBonus += 0.5;
            // 중성이 같으면 유사도 증가
            if (inputJamo[0]?.jung === wordJamo[0]?.jung) jamoBonus += 0.3;
        }

        const adjustedDistance = distance - jamoBonus;
        
        if (adjustedDistance < minDistance) {
            minDistance = adjustedDistance;
            closestMatch = word;
        }
    }

    // 임계값을 2.5로 올려서, 자모 보너스를 고려
    return minDistance <= 2.5 ? closestMatch : input;
}

// Language toggle functionality
const languageToggle = document.getElementById('language-toggle');
let currentLanguage = localStorage.getItem('language') || 'en';

const translations = {
    en: {
        title: 'My Tasks',  // Keep title in English
        addTask: 'Add Task',
        enterTask: 'Enter your task...',
        enterTags: 'Add tags (use commas)',
        deadline: 'Deadline',
        selectTaskType: 'Select type',
        editTask: 'Edit Task',
        editTaskContent: 'Task Content',
        saveEdit: 'Save',
        cancel: 'Cancel',
        confirm: {
            yes: 'Yes',
            no: 'No',
            resetAll: 'Reset all progress?',
            resetCategory: 'Reset %s progress?',
            deleteAll: 'Delete all tasks? (Cannot be undone)',
            deleteCategory: 'Delete all tasks in %s? (Cannot be undone)'
        },
        categories: {
            all: 'All',
            normal: 'Normal',
            daily: 'Daily',
            weekly: 'Weekly'
        },
        filters: {
            all: 'All',
            active: 'Active',
            completed: 'Completed'
        },        taskTypes: {
            personal: 'Personal',
            friend: 'Friend',
            boss: 'Boss',
            external: 'Work'
        },
        resetInfo: {
            daily: 'Resets daily at 6 AM',
            weekly: 'Resets Monday at 6 AM'
        },
        tooltips: {
            resetProgress: 'Reset All Progress',
            deleteAll: 'Delete All Tasks',
            themeToggle: 'Toggle Theme',
            login: 'Login',
            language: '한국어로 전환'
        }
    },
    ko: {
        title: 'My Tasks',  // Keep consistent in Korean
        addTask: '할 일 추가',
        enterTask: '할 일을 입력하세요...',
        enterTags: '태그 입력 (쉼표로 구분)',
        deadline: '마감기한',
        selectTaskType: '작업 유형 선택',
        editTask: '할 일 수정',
        editTaskContent: '할 일 내용',
        saveEdit: '수정하기',
        cancel: '취소',
        confirm: {
            yes: '예',
            no: '아니오',
            resetAll: '전체 진행 상태를 초기화할까요?',
            resetCategory: '%s 진행 상태를 초기화할까요?',
            deleteAll: '전체 할 일을 삭제할까요? (되돌릴 수 없음)',
            deleteCategory: '%s의 할 일을 삭제할까요? (되돌릴 수 없음)'
        },
        categories: {
            all: '전체',
            normal: '일반',
            daily: '매일',
            weekly: '주간'
        },
        filters: {
            all: '전체',
            active: '진행 중',
            completed: '완료'
        },        taskTypes: {
            personal: '개인',
            friend: '지인',
            boss: '상사',
            external: '업무'
        },
        resetInfo: {
            daily: '매일 오전 6시 초기화',
            weekly: '월요일 오전 6시 초기화'
        },
        tooltips: {
            resetProgress: '전체 진행 상태 초기화',
            deleteAll: '모든 할 일 삭제',
            themeToggle: '테마 전환',
            login: '로그인',
            language: 'Switch to English'
        }
    }
};

function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update UI texts
    document.querySelector('h1').textContent = translations[lang].title;
    document.querySelector('#todo-input').placeholder = translations[lang].enterTask;
    document.querySelector('#tags-input').placeholder = translations[lang].enterTags;
    document.querySelector('label[for="deadline-toggle"]').textContent = translations[lang].deadline;
    document.querySelector('button[type="submit"]').textContent = translations[lang].addTask;

    // Update category buttons
    Object.entries(translations[lang].categories).forEach(([key, value]) => {
        document.querySelector(`#category-${key}`).textContent = value;
    });

    // Update filter buttons
    Object.entries(translations[lang].filters).forEach(([key, value]) => {
        document.querySelector(`#filter-${key}`).textContent = value;
    });

    // Update task type select placeholder
    const taskTypeSelect = document.querySelector('#task-type');
    const defaultOption = taskTypeSelect.querySelector('option[value=""]');
    defaultOption.textContent = translations[lang].selectTaskType;

    // Update task type options
    Object.entries(translations[lang].taskTypes).forEach(([key, value]) => {
        const option = taskTypeSelect.querySelector(`option[value="${key}"]`);
        if (option) option.textContent = value;
    });

    updateTooltips(lang); // Update tooltips to new language

    // Update reset info text
    if (currentCategory === 'daily') {
        resetTime.textContent = translations[lang].resetInfo.daily;
    } else if (currentCategory === 'weekly') {
        resetTime.textContent = translations[lang].resetInfo.weekly;
    }

    renderTodos(); // Refresh todo list to update any translated content
}

// Update tooltips for menu buttons
function updateTooltips(lang) {
    const tooltips = translations[lang].tooltips;
    // Update tooltips for menu buttons
    document.getElementById('reset-progress').setAttribute('data-tooltip', tooltips.resetProgress);
    document.getElementById('delete-all').setAttribute('data-tooltip', tooltips.deleteAll);
    document.getElementById('theme-toggle').setAttribute('data-tooltip', tooltips.themeToggle);
    document.getElementById('login-btn').setAttribute('data-tooltip', tooltips.login);
    document.getElementById('language-toggle').setAttribute('data-tooltip', tooltips.language);
}

// Language toggle event listener
languageToggle.addEventListener('click', () => {
    const newLang = currentLanguage === 'en' ? 'ko' : 'en';
    updateLanguage(newLang);
});

// Cleanup function for event listeners
function cleanupEventListeners() {
    // Remove all existing event listeners
    mainOption?.removeEventListener('click', toggleMenu);
    document.removeEventListener('click', handleOutsideClick);
    resetProgressBtn?.removeEventListener('click', handleResetProgress);
    deleteAllBtn?.removeEventListener('click', handleDeleteAll);
    loginBtn?.removeEventListener('click', handleLogin);
}

// Event handler functions
function handleOutsideClick(e) {
    if (isMenuOpen && circularMenuItems && !circularMenuItems.contains(e.target) && !mainOption.contains(e.target)) {
        toggleMenu();
    }
}

function handleResetProgress(e) {
    e.stopPropagation();
    resetProgress();
    toggleMenu();
}

function handleDeleteAll(e) {
    e.stopPropagation();
    if (currentCategory === 'all') {  // 전체 카테고리일 때만 동작
        deleteAllTodos();
    }
    toggleMenu();
}

function handleLogin(e) {
    e.stopPropagation();
    openLoginModal();
    toggleMenu();
}

// Toggle menu state with animation support
function toggleMenu(e) {
    if (e) {
        e.stopPropagation();
    }
    
    if (menuToggleTimeout) {
        clearTimeout(menuToggleTimeout);
    }

    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
        mainOption.classList.add('active');
        circularMenuItems.classList.remove('scale-0', 'opacity-0');
        circularMenuItems.classList.add('open');
    } else {
        mainOption.classList.remove('active');
        circularMenuItems.classList.remove('open');
        circularMenuItems.classList.add('scale-0', 'opacity-0');
    }
}

// Initialize circular menu
function initializeCircularMenu() {
    // Clean up existing event listeners
    cleanupEventListeners();
    
    // Add event listeners for menu functionality
    mainOption?.addEventListener('click', toggleMenu);
    document.addEventListener('click', handleOutsideClick);
    resetProgressBtn?.addEventListener('click', handleResetProgress);
    deleteAllBtn?.addEventListener('click', handleDeleteAll);
    loginBtn?.addEventListener('click', handleLogin);

    // Set initial menu state
    isMenuOpen = false;
    if (circularMenuItems) {
        circularMenuItems.classList.remove('open');
        circularMenuItems.classList.add('scale-0', 'opacity-0');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Clean up any existing event listeners
    cleanupEventListeners();
    
    // Initialize components
    loadTodos();
    initializeTheme();
    initializeCircularMenu();
    renderTodos();
    updateLanguage(currentLanguage);
    checkResets();

    // Set up reset check interval
    setInterval(checkResets, 60000);
});


// Form submission handler for new todos
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: generateUniqueId(),
        text,
        completed: false
    };

    // Add deadline if enabled and in normal category
    if (currentCategory === 'normal' && isDeadlineEnabled) {
        const deadlineValue = deadlineInput.value;
        if (deadlineValue) {
            newTodo.deadline = deadlineValue;
        }
    }

    // Add task type and tags if present
    const taskType = document.getElementById('task-type');
    const tagsInput = document.getElementById('tags-input');
    
    if (taskType && taskType.value) {
        newTodo.taskType = taskType.value;
    }

    if (tagsInput && tagsInput.value.trim()) {
        newTodo.tags = tagsInput.value.trim().split(',').map(tag => tag.trim());
    }

    // Add to the current category
    todos[currentCategory].push(newTodo);
    
    // Reset form
    todoInput.value = '';
    if (taskType) taskType.value = '';
    if (tagsInput) tagsInput.value = '';
    if (isDeadlineEnabled) {
        deadlineInput.value = '';
        deadlineToggle.click(); // Turn off deadline toggle
    }
    toggleExtendedForm(false);

    saveTodos();
    renderTodos();
});

// Reset progress for current category
function resetProgress() {
  if (currentCategory === 'all') {
    const message = translations[currentLanguage].confirm.resetAll;
    showConfirm(message).then(confirmed => {
      if (confirmed) {
        Object.keys(todos).forEach(category => {
          todos[category].forEach(todo => todo.completed = false);
        });
        saveTodos();
        renderTodos();
      }
    });
  } else {
    const message = translations[currentLanguage].confirm.resetCategory.replace('%s', translations[currentLanguage].categories[currentCategory]);
    showConfirm(message).then(confirmed => {
      if (confirmed) {
        todos[currentCategory].forEach(todo => todo.completed = false);
        saveTodos();
        renderTodos();
      }
    });
  }
}

// Delete all todos from every category
function deleteAllTodos() {
    const message = translations[currentLanguage].confirm.deleteAll;
    showConfirm(message).then(confirmed => {
        if (confirmed) {
            Object.keys(todos).forEach(category => {
                todos[category] = [];
            });
            saveTodos();
            renderTodos();
        }
    });
}

// Show confirm modal
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        // Update button text based on language
        yesBtn.textContent = translations[currentLanguage].confirm.yes;
        noBtn.textContent = translations[currentLanguage].confirm.no;
        
        function cleanup() {
            modal.classList.add('hidden');
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
        }
        
        function handleYes() {
            cleanup();
            resolve(true);
        }
        
        function handleNo() {
            cleanup();
            resolve(false);
        }
        
        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
    });
}

// Todo item edit functionality
let editingTodo = null; // 현재 수정 중인 할 일
let isEditDeadlineEnabled = false;

// Edit button in renderTodos
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    let todosToRender = [];
    if (currentCategory === 'all') {
        Object.entries(todos).forEach(([category, categoryTodos]) => {
            todosToRender = todosToRender.concat(
                categoryTodos.map(todo => ({ ...todo, category }))
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

    // Render each todo
    todosToRender.forEach(todo => {
        const li = document.createElement('li');
        const isDark = document.documentElement.classList.contains('dark');

        li.className = `group flex items-center justify-between ${
            isDark ? 'bg-gray-800/50' : 'bg-white'
        } px-6 py-4 rounded-xl border ${
            isDark ? 'border-gray-700/50 hover:border-purple-500/50' : 'border-gray-200 hover:border-blue-500/50'
        } transition-all shadow-sm`;

        // Left section with checkbox and text
        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-center gap-4 flex-1 min-w-0';
        
        const checkbox = document.createElement('button');
        checkbox.className = `min-w-[20px] min-h-[20px] w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completed
                ? (isDark ? 'border-purple-500 bg-purple-500' : 'border-blue-500 bg-blue-500')
                : (isDark ? 'border-gray-600' : 'border-gray-300')
        }`;

        if (todo.completed) {
            checkbox.innerHTML = '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        }

        checkbox.onclick = () => toggleTodo(todo.category, todo.id);

        // Text content with category tag
        const textContent = document.createElement('div');
        textContent.className = 'flex items-center min-w-0 flex-1';

        // Create wrapper for text and tags
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'flex flex-col gap-1 min-w-0';

        // Add main text with smaller size
        const mainText = document.createElement('span');
        mainText.textContent = todo.text;
        mainText.className = 'text-sm truncate';

        // Right section for deadline, edit and delete buttons
        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center gap-3 ml-4';

        // Add deadline if exists
        if (todo.deadline) {
            const deadlineEl = document.createElement('span');
            deadlineEl.className = 'text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
            deadlineEl.setAttribute('data-deadline', todo.deadline);
            deadlineEl.textContent = formatTimeRemaining(todo.deadline);
            rightSection.appendChild(deadlineEl);
        }

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'text-gray-600 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity';
        editBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
        editBtn.onclick = () => showEditModal(todo);
        rightSection.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity';
        deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        deleteBtn.onclick = () => deleteTodo(todo.category, todo.id);
        rightSection.appendChild(deleteBtn);

        // Create container for tags and task type
        const tagContainer = document.createElement('div');
        tagContainer.className = 'flex flex-wrap gap-1';
        
        // Add task type indicator if exists and is not empty
        if (todo.taskType && todo.taskType !== '') {
            const typeIndicator = document.createElement('span');
            typeIndicator.className = `text-xs px-2 py-0.5 rounded-full ${
                {
                    personal: 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
                    friend: 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300',
                    boss: 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300',
                    external: 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300'
                }[todo.taskType]
            }`;
            typeIndicator.textContent = translations[currentLanguage].taskTypes[todo.taskType];
            tagContainer.appendChild(typeIndicator);
        }
        
        // Add tags if exist
        if (todo.tags && todo.tags.length > 0) {
            todo.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
                tagEl.textContent = tag;
                tagContainer.appendChild(tagEl);
            });
        }
        
        // Add category tag in all view
        if (currentCategory === 'all') {
            const categoryTag = document.createElement('span');
            categoryTag.className = `text-xs px-2 py-0.5 rounded-full ${
                {
                    normal: 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-300',
                    daily: 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300',
                    weekly: 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-300'
                }[todo.category]
            }`;
            categoryTag.textContent = translations[currentLanguage].categories[todo.category];
            tagContainer.appendChild(categoryTag);
        }

        // Add tag container if it has any content
        if (tagContainer.children.length > 0) {
            contentWrapper.appendChild(mainText);
            contentWrapper.appendChild(tagContainer);
        } else {
            contentWrapper.appendChild(mainText);
        }

        textContent.appendChild(contentWrapper);
        leftSection.appendChild(checkbox);
        leftSection.appendChild(textContent);
        
        li.appendChild(leftSection);
        li.appendChild(rightSection);
        todoList.appendChild(li);
    });

    updateTodoCount();
    updateResetInfo();
}

// Show edit modal
function showEditModal(todo) {
    if (!todo) {
        console.error('Todo item is required');
        return;
    }editingTodo = todo;
    const editModal = document.getElementById('edit-modal');
    if (!editModal) {
        console.error('Edit modal element not found');
        return;
    }
    const editForm = document.getElementById('edit-form');
    const editText = document.getElementById('edit-text');
    const editTags = document.getElementById('edit-tags');
    const editTaskType = document.getElementById('edit-task-type');
    const editDeadlineSection = document.getElementById('edit-deadline-section');
    const editDeadlineToggle = document.getElementById('edit-deadline-toggle');
    const editDeadlineInput = document.getElementById('edit-deadline-input');
    const editDeadlineInputContainer = document.getElementById('edit-deadline-input-container');

    // 수정할 할 일의 현재 값들을 입력창에 설정
    editText.value = todo.text;
    editTags.value = todo.tags ? todo.tags.join(', ') : '';
    editTaskType.value = todo.taskType || '';
    handleEditTagsInput();

    // 마감기한 섹션은 일반 카테고리에서만 보이도록
    if (todo.category === 'normal') {
        editDeadlineSection.classList.remove('hidden');
        if (todo.deadline) {
            isEditDeadlineEnabled = true;
            editDeadlineToggle.classList.add('bg-blue-500');
            editDeadlineToggle.querySelector('div').classList.add('translate-x-6');
            editDeadlineInputContainer.classList.remove('hidden');
            editDeadlineInput.value = todo.deadline;
        } else {
            isEditDeadlineEnabled = false;
            editDeadlineToggle.classList.remove('bg-blue-500');
            editDeadlineToggle.querySelector('div').classList.remove('translate-x-6');
            editDeadlineInputContainer.classList.add('hidden');
            editDeadlineInput.value = '';
        }
    } else {
        editDeadlineSection.classList.add('hidden');
    }

    // 모달 표시
    editModal.classList.remove('hidden');

    // 첫 번째 입력창에 포커스
    editText.focus();
}

// Close edit modal
function closeEditModal() {
    const editModal = document.getElementById('edit-modal');
    editModal.classList.add('hidden');
    editingTodo = null;
    isEditDeadlineEnabled = false;
}

// Handle edit tags input
function handleEditTagsInput() {
    const editTags = document.getElementById('edit-tags');
    const editTagsPreview = document.getElementById('edit-tags-preview');

    const tags = editTags.value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    const processedTags = tags.map(tag => {
        // 입력된 태그 정규화 및 자동 수정
        const normalizedTag = normalizeHangul(tag);
        const correctedTag = findClosestMatch(normalizedTag, spellingSuggestions);
        
        // 번역 매핑 확인
        const translatedTag = tagMappings[correctedTag] || correctedTag;
        
        return {
            original: tag,
            corrected: correctedTag,
            processed: translatedTag,
            translated: translatedTag !== correctedTag,
            wasFixed: correctedTag !== normalizedTag
        };
    });

    // Update preview
    editTagsPreview.innerHTML = processedTags.map(tag => {
        const classes = [
            'tag',
            tag.translated ? 'translated' : '',
            tag.wasFixed ? 'corrected' : ''
        ].filter(Boolean).join(' ');
        
        let tooltip = '';
        if (tag.wasFixed && tag.translated) {
            tooltip = `${tag.original} → ${tag.corrected} → ${tag.processed}`;
        } else if (tag.wasFixed) {
            tooltip = `${tag.original} → ${tag.corrected}`;
        } else if (tag.translated) {
            tooltip = `${tag.original} → ${tag.processed}`;
        }
        
        return `<span class="${classes}" title="${tooltip}">${
            currentLanguage === 'ko' ? (tag.wasFixed ? tag.corrected : tag.original) : tag.processed
        }</span>`;
    }).join('');
    
    return processedTags.map(tag => tag.processed);
}

// Edit deadline toggle functionality
document.getElementById('edit-deadline-toggle').addEventListener('click', () => {
    isEditDeadlineEnabled = !isEditDeadlineEnabled;
    const toggle = document.getElementById('edit-deadline-toggle');
    const container = document.getElementById('edit-deadline-input-container');
    
    toggle.classList.toggle('bg-blue-500', isEditDeadlineEnabled);
    toggle.querySelector('div').classList.toggle('translate-x-6', isEditDeadlineEnabled);
    container.classList.toggle('hidden', !isEditDeadlineEnabled);
});

// Edit tags input event listener
document.getElementById('edit-tags').addEventListener('input', handleEditTagsInput);

// Edit form submit
document.getElementById('edit-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!editingTodo) return;

    const editText = document.getElementById('edit-text').value.trim();
    if (!editText) {
        alert(translations[currentLanguage].editTaskContent);
        return;
    }

    // 현재 수정중인 할 일의 인덱스 찾기
    const todoIndex = todos[editingTodo.category].findIndex(todo => todo.id === editingTodo.id);
    if (todoIndex === -1) return;

    // 수정된 할 일 객체 생성
    const updatedTodo = {
        ...editingTodo,
        text: editText,
        tags: handleEditTagsInput(),
        taskType: document.getElementById('edit-task-type').value
    };

    // 마감기한 처리 (일반 카테고리일 때만)
    if (editingTodo.category === 'normal') {
        if (isEditDeadlineEnabled) {
            const deadline = document.getElementById('edit-deadline-input').value;
            if (!deadline) {
                alert('마감기한을 입력하거나 마감기한 옵션을 비활성화해주세요.');
                return;
            }
            updatedTodo.deadline = deadline;
        } else {
            delete updatedTodo.deadline;
        }
    }

    // 할 일 업데이트
    todos[editingTodo.category][todoIndex] = updatedTodo;
    saveTodos();
    renderTodos();

    // 모달 닫기
    closeEditModal();
});

// Cancel edit
document.getElementById('edit-cancel').addEventListener('click', closeEditModal);

// Initialize CSS styles for tags
const style = document.createElement('style');
style.textContent = `
    .tag.translated {
        border-bottom: 2px solid rgba(59, 130, 246, 0.5);
        cursor: help;
    }
    .tag.corrected {
        border-top: 2px solid rgba(34, 197, 94, 0.5);
        cursor: help;
    }
    .tag.corrected.translated {
        border: 2px solid rgba(168, 85, 247, 0.5);
        cursor: help;
    }
`;
document.head.appendChild(style);

// Initialize language
updateLanguage(currentLanguage);

// Initialize the app
function initializeApp() {
    loadTodos();
    initializeTheme();
    setCategory('all');
    updateLanguage(currentLanguage);
    renderTodos();
    updateTodoCount();
    checkResets();
}

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    // Wait for a moment to ensure all elements are properly loaded
    setTimeout(initializeCircularMenu, 100);
});

// Login related functions
function openLoginModal() {
  const loginModal = document.getElementById('login-modal');
  const usernameInput = document.getElementById('username-input');
  loginModal.classList.remove('hidden');
  usernameInput.value = '';
  usernameInput.focus();
}

function closeLoginModal() {
  const loginModal = document.getElementById('login-modal');
  loginModal.classList.add('hidden');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('username-input').value.trim();
  if (username) {
    localStorage.setItem('username', username);
    loadTodos(); // Load todos for the new user
    renderTodos();
    closeLoginModal();
  }
}

// Login modal event listeners
document.getElementById('login-submit')?.addEventListener('click', handleLoginSubmit);
document.getElementById('login-cancel')?.addEventListener('click', closeLoginModal);
document.addEventListener('click', (e) => {
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.querySelector('#login-modal > div > div');
  if (e.target === loginModal) {
    closeLoginModal();
  }
});