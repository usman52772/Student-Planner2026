document.addEventListener('DOMContentLoaded', () => {
    
    // --- Responsive Sidebar Logic ---
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    }

    if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch view
            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if(view.id === targetId) {
                    view.classList.add('active');
                }
            });

            // Close sidebar on mobile after clicking a link
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    });

    // --- Planner Tabs Logic (Weekly vs Daily) ---
    const plannerTabs = document.querySelectorAll('.tab-btn');
    const planningViews = document.querySelectorAll('.planning-tab');
    
    plannerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            plannerTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetTab = tab.getAttribute('data-tab') + '-tab';
            planningViews.forEach(view => {
                view.classList.remove('active');
                if(view.id === targetTab) {
                    view.classList.add('active');
                }
            });
        });
    });

    // --- Generate 2026 Calendar ---
    const calendarGrid = document.getElementById('yearly-calendar');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysInMonth2026 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // In 2026, Jan 1 is a Thursday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    let firstDayOffset = 4; 

    months.forEach((month, index) => {
        const monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        
        let html = `<div class="month-title"><span>${month}</span></div>`;
        html += `<div class="month-days">`;
        
        // Day headers
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(day => {
            html += `<div class="day-header">${day}</div>`;
        });

        // Blank days for offset
        for(let i=0; i < firstDayOffset; i++){
            html += `<div class="day-cell empty"></div>`;
        }

        // Output days
        const days = daysInMonth2026[index];
        for(let day=1; day <= days; day++) {
             html += `<div class="day-cell" onclick="jumpToDate('${month} ${day}, 2026')">${day}</div>`;
        }
        
        // Calculate offset for next month
        firstDayOffset = (firstDayOffset + days) % 7; 

        html += `</div>`;
        monthCard.innerHTML = html;
        calendarGrid.appendChild(monthCard);
    });

    // --- Local Storage / Persistence System ---
    
    window.currentWeekStr = "Jan 5 - Jan 11";
    window.currentDayStr = "Monday, Jan 5, 2026";

    function getScope(el) {
        if (el.closest('#weekly-tab')) return `week_${window.currentWeekStr}`;
        if (el.closest('#daily-tab')) return `day_${window.currentDayStr}`;
        return 'global';
    }

    // Auto-save function for contenteditable elements
    function setupAutoSave() {
        const editables = document.querySelectorAll('[contenteditable="true"]');
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        
        let editCounter = 0;
        editables.forEach((el) => {
            let savedId = el.getAttribute('data-save-id');
            if (!savedId) {
                savedId = `edit_${editCounter}`;
                editCounter++;
                el.setAttribute('data-save-id', savedId);
            }
            
            el.addEventListener('input', () => {
                setTimeout(() => {
                    let scope = getScope(el);
                    localStorage.setItem(`planner_${scope}_${savedId}`, el.innerHTML);
                }, 500); 
            });
        });

        let inputCounter = 0;
        inputs.forEach((el) => {
            if (el.closest('.tracker-table') || el.closest('.habit-row')) return;
            
            let savedId = el.getAttribute('data-save-id');
            if (!savedId) {
                savedId = `input_${inputCounter}`;
                inputCounter++;
                el.setAttribute('data-save-id', savedId);
            }
            
            el.addEventListener('input', () => {
                setTimeout(() => {
                    let scope = getScope(el);
                    localStorage.setItem(`planner_${scope}_${savedId}`, el.value);
                }, 500);
            });
        });
        
        window.loadPlannerData();
    }

    window.loadPlannerData = function() {
        const editables = document.querySelectorAll('[contenteditable="true"]');
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        
        editables.forEach((el) => {
            let savedId = el.getAttribute('data-save-id');
            let scope = getScope(el);
            const saved = localStorage.getItem(`planner_${scope}_${savedId}`);
            if (saved !== null) {
                el.innerHTML = saved;
            } else if (scope !== 'global') {
                el.innerHTML = '';
            }
        });
        
        inputs.forEach((el) => {
            if (el.closest('.tracker-table') || el.closest('.habit-row')) return;
            
            let savedId = el.getAttribute('data-save-id');
            let scope = getScope(el);
            const saved = localStorage.getItem(`planner_${scope}_${savedId}`);
            if (saved !== null) {
                el.value = saved;
            } else if (scope !== 'global') {
                el.value = '';
            }
        });
    }

    setupAutoSave();

    // --- Weekly Navigation Logic ---
    let currentWeeklyDate = new Date(2026, 0, 5); // Monday Jan 5
    const weekDisplay = document.querySelector('.current-week');
    const weekBtns = document.querySelectorAll('.weekly-header .icon-btn');
    
    function updateWeeklyDisplay() {
        const start = new Date(currentWeeklyDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        
        const options = { month: 'short', day: 'numeric' };
        window.currentWeekStr = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
        weekDisplay.innerText = window.currentWeekStr;
        
        window.loadPlannerData();
    }

    if (weekBtns.length >= 2) {
        weekBtns[0].addEventListener('click', () => {
            currentWeeklyDate.setDate(currentWeeklyDate.getDate() - 7);
            updateWeeklyDisplay();
        });
        weekBtns[1].addEventListener('click', () => {
            currentWeeklyDate.setDate(currentWeeklyDate.getDate() + 7);
            updateWeeklyDisplay();
        });
    }

    // Load dynamic tracker tables from LocalStorage
    loadDynamicTable('exam-list', 'tracker_exams');
    loadDynamicTable('assignment-list', 'tracker_assignments');
    loadHabits();

});

// --- Dynamic Table Functions (Exams & Assignments) ---

function addExamRow(data = ['', '', '', '', '']) {
    const list = document.getElementById('exam-list');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Course" value="${data[0]}" oninput="saveDynamicTable('exam-list', 'tracker_exams')"></td>
        <td><input type="text" placeholder="Midterm/Final" value="${data[1]}" oninput="saveDynamicTable('exam-list', 'tracker_exams')"></td>
        <td><input type="text" placeholder="Date & Time" value="${data[2]}" oninput="saveDynamicTable('exam-list', 'tracker_exams')"></td>
        <td><input type="text" placeholder="Goal" value="${data[3]}" oninput="saveDynamicTable('exam-list', 'tracker_exams')"></td>
        <td><input type="text" placeholder="Status" value="${data[4]}" oninput="saveDynamicTable('exam-list', 'tracker_exams')"></td>
    `;
    list.appendChild(tr);
    saveDynamicTable('exam-list', 'tracker_exams');
}

function addAssignmentRow(data = ['', '', '', '', '']) {
    const list = document.getElementById('assignment-list');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Course" value="${data[0]}" oninput="saveDynamicTable('assignment-list', 'tracker_assignments')"></td>
        <td><input type="text" placeholder="Task Name" value="${data[1]}" oninput="saveDynamicTable('assignment-list', 'tracker_assignments')"></td>
        <td><input type="text" placeholder="Due Date" value="${data[2]}" oninput="saveDynamicTable('assignment-list', 'tracker_assignments')"></td>
        <td><input type="text" placeholder="0%" value="${data[3]}" oninput="saveDynamicTable('assignment-list', 'tracker_assignments')"></td>
        <td><input type="text" placeholder="Not Started" value="${data[4]}" oninput="saveDynamicTable('assignment-list', 'tracker_assignments')"></td>
    `;
    list.appendChild(tr);
    saveDynamicTable('assignment-list', 'tracker_assignments');
}

function saveDynamicTable(listId, storageKey) {
    const tbody = document.getElementById(listId);
    const rows = tbody.querySelectorAll('tr');
    const tableData = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const rowData = Array.from(inputs).map(inp => inp.value);
        tableData.push(rowData);
    });
    
    localStorage.setItem(storageKey, JSON.stringify(tableData));
}

function loadDynamicTable(listId, storageKey) {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if(data.length === 0) {
        // Add 3 default rows if empty
        if(listId === 'exam-list') { addExamRow(); addExamRow(); addExamRow(); }
        if(listId === 'assignment-list') { addAssignmentRow(); addAssignmentRow(); addAssignmentRow(); }
        return;
    }
    
    data.forEach(rowData => {
        if(listId === 'exam-list') addExamRow(rowData);
        if(listId === 'assignment-list') addAssignmentRow(rowData);
    });
}

// --- Habit Tracker Specific ---
let habitsData = JSON.parse(localStorage.getItem('tracker_habits') || '[]');

function addHabit(name = "New Habit", days = Array(31).fill(false)) {
    const container = document.getElementById('habit-container');
    const habitIndex = container.children.length; // acts as ID
    
    const div = document.createElement('div');
    div.className = 'habit-row';
    
    let daysHtml = '';
    for(let i=0; i<31; i++) {
        const isDone = days[i] ? 'done' : '';
        daysHtml += `<div class="habit-day ${isDone}" onclick="toggleHabitDay(${habitIndex}, ${i}, this)"></div>`;
    }

    div.innerHTML = `
        <div class="habit-name">
            <input type="text" value="${name}" oninput="updateHabitName(${habitIndex}, this.value)">
        </div>
        <div class="habit-days">
            ${daysHtml}
        </div>
    `;
    container.appendChild(div);
    
    // Save to array if new
    if(habitsData.length <= habitIndex) {
        habitsData.push({name: name, days: days});
        saveHabits();
    }
}

function toggleHabitDay(habitIndex, dayIndex, el) {
    el.classList.toggle('done');
    habitsData[habitIndex].days[dayIndex] = el.classList.contains('done');
    saveHabits();
}

function updateHabitName(habitIndex, name) {
    habitsData[habitIndex].name = name;
    saveHabits();
}

function saveHabits() {
    localStorage.setItem('tracker_habits', JSON.stringify(habitsData));
}

function loadHabits() {
    if(habitsData.length === 0) {
        // Defaults
        addHabit("Drink Water (8 cups)");
        addHabit("Read 20 pages");
        addHabit("Study 2 Hours");
    } else {
        // Create rows avoiding duplication pushes from addHabit by clearing DOM
        document.getElementById('habit-container').innerHTML = '';
        const dataCopy = [...habitsData]; 
        dataCopy.forEach(h => {
             addHabit(h.name, h.days);
        });
    }
}

// --- Helper Functions ---
function jumpToDate(dateStr) {
    // Switch to planner view daily tab, update header
    const navPlanner = document.querySelector('.nav-item[data-target="planner"]');
    if (navPlanner) navPlanner.click();
    
    const tabDaily = document.querySelector('.tab-btn[data-tab="daily"]');
    if (tabDaily) tabDaily.click();
    
    const dayElement = document.querySelector('.current-day');
    if (dayElement) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
            const fullDateStr = d.toLocaleDateString('en-US', options);
            dayElement.innerText = fullDateStr;
            window.currentDayStr = fullDateStr;
            
            if (window.loadPlannerData) {
                window.loadPlannerData();
            }
        } else {
            dayElement.innerText = dateStr;
            window.currentDayStr = dateStr;
        }
    }
}
