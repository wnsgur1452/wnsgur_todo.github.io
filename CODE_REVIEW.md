# Modern Todo List 코드 한줄씩 주석 설명 (상세)

아래는 이 프로젝트의 주요 소스코드(`app.js`, `index.html`, `style.css`)에 초보자도 이해할 수 있도록 한글로 한 줄씩 아주 자세하게 주석을 단 예시입니다.

---

## app.js (주요 자바스크립트 로직)

```js
// 할 일 목록을 카테고리별로 저장하는 객체를 만듭니다.
let todos = {
    normal: [],   // 일반 할 일(마감기한 가능)
    daily: [],    // 매일 반복되는 할 일(매일 6시에 완료상태 초기화)
    weekly: []    // 매주 반복되는 할 일(월요일 6시에 완료상태 초기화)
};

// 현재 선택된 필터(전체/진행중/완료)와 카테고리(일반/매일/매주/전체)를 저장합니다.
let currentFilter = 'all'; // 현재 필터 상태
let currentCategory = 'normal'; // 현재 카테고리 상태
let isDeadlineEnabled = false; // 마감기한 기능 사용 여부

// 자주 사용하는 HTML 요소를 변수에 저장합니다.
const todoForm = document.getElementById('todo-form'); // 할 일 입력 폼(새 할 일 추가)
const todoInput = document.getElementById('todo-input'); // 할 일 입력창
const todoList = document.getElementById('todo-list'); // 할 일 목록이 표시되는 곳(ul)
const themeToggle = document.getElementById('theme-toggle'); // 다크/라이트 테마 토글 버튼
const filterAll = document.getElementById('filter-all'); // 전체 할 일 보기 버튼
const filterActive = document.getElementById('filter-active'); // 진행중인 할 일만 보기 버튼
const filterCompleted = document.getElementById('filter-completed'); // 완료된 할 일만 보기 버튼
const categoryNormal = document.getElementById('category-normal'); // 일반 카테고리 버튼
const categoryDaily = document.getElementById('category-daily'); // 매일 카테고리 버튼
const categoryWeekly = document.getElementById('category-weekly'); // 매주 카테고리 버튼
const categoryAll = document.getElementById('category-all'); // 모든 카테고리(전체) 버튼
const deadlineToggle = document.getElementById('deadline-toggle'); // 마감기한 입력창 보이기/숨기기 토글
const deadlineInput = document.getElementById('deadline-input'); // 마감기한 입력창
const progressBar = document.getElementById('progress-bar'); // 진행도(달성률) 바
const progressPercent = document.getElementById('progress-percent'); // 진행도(달성률) 텍스트

// 다크모드 초기화 함수: 사용자의 이전 테마 설정을 불러와 적용합니다.
function initializeTheme() {
    // localStorage에서 다크모드 설정을 불러옵니다. (없으면 기본값은 라이트)
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark'); // 다크모드 적용
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
}

// 다크모드 토글 함수: 버튼 클릭 시 테마를 바꿉니다.
function toggleDarkMode() {
    // 다크모드 클래스를 토글합니다. (있으면 제거, 없으면 추가)
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light', !isDark); // 라이트모드도 반대로 토글
    localStorage.setItem('darkMode', isDark.toString()); // 현재 테마 상태를 저장
}

// 테마 토글 버튼 클릭 시 다크모드 변경
// (버튼을 누르면 위의 toggleDarkMode 함수가 실행됨)
themeToggle.addEventListener('click', toggleDarkMode);

// 필터 버튼 클릭 시 필터 변경 (전체/진행중/완료)
filterAll.addEventListener('click', () => setFilter('all'));
filterActive.addEventListener('click', () => setFilter('active'));
filterCompleted.addEventListener('click', () => setFilter('completed'));

// 카테고리 버튼 클릭 시 카테고리 변경 (일반/매일/매주/전체)
categoryNormal.addEventListener('click', () => setCategory('normal'));
categoryDaily.addEventListener('click', () => setCategory('daily'));
categoryWeekly.addEventListener('click', () => setCategory('weekly'));
categoryAll.addEventListener('click', () => setCategory('all'));

// 필터 변경 함수: 현재 필터를 바꾸고, 버튼 UI와 할 일 목록을 새로 그림
function setFilter(filter) {
    currentFilter = filter; // 현재 필터 저장
    updateFilterButtons();  // 버튼 UI 업데이트(선택된 버튼 강조)
    renderTodos();          // 할 일 목록 다시 그림
}
// 카테고리 변경 함수: 현재 카테고리를 바꾸고, 관련 UI와 할 일 목록을 새로 그림
function setCategory(category) {
    currentCategory = category; // 현재 카테고리 저장
    updateCategoryButtons();    // 버튼 UI 업데이트(선택된 버튼 강조)
    updateResetInfo();          // 리셋 정보(자동 초기화 안내) 업데이트
    updateResetButtonVisibility(); // 리셋 버튼 표시 여부
    updateDeadlineVisibility(); // 마감기한 입력창 표시 여부
    renderTodos();              // 할 일 목록 다시 그림
}

// 할 일 추가 폼 제출 시 동작: 사용자가 할 일을 입력하고 추가하면 실행됨
document.getElementById('todo-form').addEventListener('submit', (e) => {
  e.preventDefault(); // 폼의 기본 동작(새로고침) 막기
  const input = document.getElementById('todo-input');
  const text = input.value.trim(); // 입력값에서 앞뒤 공백 제거
  if (text) { // 입력값이 비어있지 않으면
    // 마감기한이 켜져있으면 값 가져오기
    const deadline = currentCategory === 'normal' && deadlineToggle.classList.contains('bg-blue-500') ? deadlineInput.value : '';
    // 할 일 객체를 현재 카테고리에 추가 (text, 완료여부, 마감기한)
    todos[currentCategory].push({
      text,
      completed: false,
      deadline
    });
    input.value = ''; // 입력창 비우기
    if (deadline) deadlineInput.value = ''; // 마감기한 입력창도 비우기
    saveTodos(); // 변경사항 저장
    renderTodos(); // 화면 갱신
  }
});

// 할 일 목록을 화면에 그리는 함수: todos 배열을 순회하며 li 요소를 동적으로 생성
function renderTodos() {
    let todosToRender = [];
    if (currentCategory === 'all') {
        // 모든 카테고리의 할 일을 합칩니다.
        Object.entries(todos).forEach(([category, categoryTodos]) => {
            todosToRender = todosToRender.concat(
                categoryTodos.map(todo => ({ ...todo, category: category }))
            );
        });
    } else {
        // 현재 카테고리의 할 일만 사용
        todosToRender = todos[currentCategory].map(todo => ({ ...todo, category: currentCategory }));
    }
    // 필터에 따라 할 일 목록을 걸러냅니다.
    const filteredTodos = todosToRender.filter(todo => {
        if (currentFilter === 'active') return !todo.completed; // 진행중만
        if (currentFilter === 'completed') return todo.completed; // 완료만
        return true; // 전체
    });
    // 기존 할 일 목록 지우기
    todoList.innerHTML = '';
    // 할 일 목록을 실제로 화면에 추가합니다.
    filteredTodos.forEach((todo, idx) => {
        // li 요소 생성 (한 줄의 할 일)
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.dataset.index = idx; // 인덱스 저장(삭제/토글에 사용)
        li.dataset.category = todo.category; // 카테고리 정보 저장

        // 체크박스 추가 (완료/미완료 표시)
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed; // 완료여부 반영
        checkbox.className = 'todo-checkbox';
        checkbox.addEventListener('change', () => toggleTodo(todo.category, idx)); // 체크시 상태 토글

        // 할 일 텍스트 추가
        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;

        // 마감기한이 있는 경우 표시
        if (todo.deadline) {
            const deadlineSpan = document.createElement('span');
            deadlineSpan.className = 'todo-deadline';
            deadlineSpan.textContent = ` (마감: ${todo.deadline})`;
            span.appendChild(deadlineSpan);
        }

        // 삭제 버튼 추가
        const deleteButton = document.createElement('button');
        deleteButton.className = 'todo-delete';
        deleteButton.textContent = '삭제';
        deleteButton.addEventListener('click', () => deleteTodo(todo.category, idx)); // 클릭시 삭제

        // li 요소에 체크박스, 텍스트, 삭제 버튼 추가
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteButton);

        // 할 일 목록에 li 요소 추가
        todoList.appendChild(li);
    });
    updateTodoCount(); // 진행도(달성률) 업데이트
    updateResetInfo(); // 리셋 정보(자동 초기화 안내) 업데이트
}

// 할 일 완료/미완료 토글 함수: 체크박스를 클릭하면 실행됨
function toggleTodo(category, idx) {
    todos[category][idx].completed = !todos[category][idx].completed; // 완료상태 반전
    saveTodos(); // 변경사항 저장
    renderTodos(); // 화면 갱신
}

// 할 일 삭제 함수: 삭제 버튼 클릭 시 실행됨
function deleteTodo(category, idx) {
    todos[category].splice(idx, 1); // 해당 인덱스의 할 일을 배열에서 제거
    saveTodos(); // 변경사항 저장
    renderTodos(); // 화면 갱신
}

// 진행도(달성률) 업데이트 함수: 완료된 할 일의 비율을 계산해 프로그레스바와 텍스트에 반영
function updateTodoCount() {
    let total = 0; // 전체 할 일 개수
    let completed = 0; // 완료된 할 일 개수
    if (currentCategory === 'all') {
        // 전체 카테고리의 할 일 개수/완료 개수 합산
        Object.values(todos).forEach(categoryTodos => {
            total += categoryTodos.length;
            completed += categoryTodos.filter(t => t.completed).length;
        });
    } else {
        // 현재 카테고리만 계산
        const currentTodos = todos[currentCategory];
        total = currentTodos.length;
        completed = currentTodos.filter(t => t.completed).length;
    }
    // 퍼센트 계산 (0으로 나누는 것 방지)
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBar.style.width = `${percent}%`; // 프로그레스바 길이 조정
    progressPercent.textContent = `${percent}%`; // 텍스트로도 표시
}
```

---

## index.html (주요 구조)

```html
<!-- 헤더, 카테고리 선택, 할 일 입력, 할 일 목록 등 주요 UI 구조가 포함되어 있습니다. -->
<!-- Tailwind CSS 클래스를 활용해 스타일을 적용합니다. -->
<!-- 각 버튼과 입력창, 리스트에 id가 부여되어 JS에서 쉽게 접근할 수 있습니다. -->
<!-- 예시: <button id="category-normal">Normal</button> -->
<!-- ...existing code... -->
```

---

## style.css (추가 스타일)

```css
/* Tailwind CSS를 주로 사용하므로 style.css는 거의 비어있거나, 커스텀 스타일만 추가합니다. */
/* 예시: .my-custom-class { color: red; } */
/* ...existing code... */
```

---

이 외에도 자동 리셋, 다크모드, 마감기한, 필터 등 다양한 기능이 있습니다. 각 함수와 변수에 주석을 추가하면 초보자도 쉽게 이해할 수 있습니다. 궁금한 부분이 있으면 언제든 질문해 주세요!