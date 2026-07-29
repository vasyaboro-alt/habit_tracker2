// Глобальное состояние приложения
let appData = {
    currentUserId: "user_1",
    selectedCountry: "BY", // По умолчанию Беларусь
    users: {
        "user_1": { id: "user_1", name: "Василий" }
    },
    habits: [],
    logs: {}
};

// База праздников в формате "MM-DD"
const holidays = {
    BY: {
        "01-01": "Новый год",
        "01-02": "Новый год",
        "01-07": "Рождество (правосл.)",
        "03-08": "День женщин",
        "05-01": "Праздник труда",
        "05-09": "День Победы",
        "07-03": "День Независимости",
        "11-07": "Октябрьская революция",
        "12-25": "Рождество (катол.)"
    },
    RU: {
        "01-01": "Новый год",
        "01-02": "Новогодние каникулы",
        "01-03": "Новогодние каникулы",
        "01-04": "Новогодние каникулы",
        "01-05": "Новогодние каникулы",
        "01-06": "Новогодние каникулы",
        "01-07": "Рождество",
        "01-08": "Новогодние каникулы",
        "02-23": "День защитника Отечества",
        "03-08": "Международный женский день",
        "05-01": "Праздник Весны и Труда",
        "05-09": "День Победы",
        "06-12": "День России",
        "11-04": "День народного единства"
    }
};

let currentCalendarDate = new Date();
let selectedCalendarDateKey = null;

document.addEventListener("DOMContentLoaded", () => {
    loadAppData();
    initTabs();
    initUserSelector();
    initHabitForm();
    initCalendarNav();
    initSettingsAndBackup();
    renderApp();
});

function loadAppData() {
    const saved = localStorage.getItem("habit_tracker_v4");
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            console.error("Ошибка загрузки данных из LocalStorage", e);
        }
    }
}

function saveAppData() {
    localStorage.setItem("habit_tracker_v4", JSON.stringify(appData));
}

function getTodayDateKey() {
    return new Date().toISOString().split("T")[0];
}

function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add("active");
            
            renderApp();
        });
    });
}

function initUserSelector() {
    const select = document.getElementById("user-select");
    select.innerHTML = "";

    Object.values(appData.users).forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        if (user.id === appData.currentUserId) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
        appData.currentUserId = e.target.value;
        saveAppData();
        renderApp();
    });

    const modal = document.getElementById("user-modal");
    const nameInput = document.getElementById("modal-user-name");
    const deleteBtn = document.getElementById("btn-modal-user-delete");

    document.getElementById("btn-add-user").addEventListener("click", () => {
        modal.dataset.mode = "add";
        document.getElementById("modal-user-title").textContent = "Добавить профиль";
        nameInput.value = "";
        deleteBtn.style.display = "none";
        modal.style.display = "flex";
    });

    document.getElementById("btn-edit-user").addEventListener("click", () => {
        modal.dataset.mode = "edit";
        document.getElementById("modal-user-title").textContent = "Редактировать профиль";
        nameInput.value = appData.users[appData.currentUserId].name;
        
        const userCount = Object.keys(appData.users).length;
        deleteBtn.style.display = userCount > 1 ? "inline-block" : "none";
        modal.style.display = "flex";
    });

    document.getElementById("btn-modal-user-close").addEventListener("click", () => {
        modal.style.display = "none";
    });

    document.getElementById("btn-modal-user-save").addEventListener("click", () => {
        const name = nameInput.value.trim();
        if (!name) return;

        if (modal.dataset.mode === "add") {
            const newId = "user_" + Date.now();
            appData.users[newId] = { id: newId, name: name };
            appData.currentUserId = newId;
        } else {
            appData.users[appData.currentUserId].name = name;
        }

        saveAppData();
        initUserSelector();
        renderApp();
        modal.style.display = "none";
    });

    deleteBtn.addEventListener("click", () => {
        if (confirm("Удалить выбранный профиль вместе с его привычками?")) {
            delete appData.users[appData.currentUserId];
            appData.habits = appData.habits.filter(h => h.userId !== appData.currentUserId);
            appData.currentUserId = Object.keys(appData.users)[0];
            
            saveAppData();
            initUserSelector();
            renderApp();
            modal.style.display = "none";
        }
    });
}

function initHabitForm() {
    const periodSelect = document.getElementById("habit-period");
    const intervalGroup = document.getElementById("group-interval-days");
    const form = document.getElementById("habit-form");
    const cancelBtn = document.getElementById("btn-cancel-habit");

    periodSelect.addEventListener("change", (e) => {
        intervalGroup.style.display = e.target.value === "interval" ? "block" : "none";
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const habitId = document.getElementById("habit-id").value;
        const habitData = {
            id: habitId || "habit_" + Date.now(),
            userId: appData.currentUserId,
            title: document.getElementById("habit-title").value,
            category: document.getElementById("habit-category").value,
            period: periodSelect.value,
            intervalDays: parseInt(document.getElementById("habit-interval-days").value) || 2,
            target: parseInt(document.getElementById("habit-target").value) || 1,
            unit: document.getElementById("habit-unit").value || "раз",
            reminder: document.getElementById("habit-reminder").value || ""
        };

        if (habitId) {
            const index = appData.habits.findIndex(h => h.id === habitId);
            if (index !== -1) appData.habits[index] = habitData;
        } else {
            appData.habits.push(habitData);
        }

        saveAppData();
        resetHabitForm();
        renderApp();
    });

    cancelBtn.addEventListener("click", resetHabitForm);
}

function resetHabitForm() {
    document.getElementById("habit-form").reset();
    document.getElementById("habit-id").value = "";
    document.getElementById("group-interval-days").style.display = "none";
    document.getElementById("btn-save-habit").textContent = "Сохранить привычку";
    document.getElementById("btn-cancel-habit").style.display = "none";
}

function editHabit(habit) {
    document.getElementById("habit-id").value = habit.id;
    document.getElementById("habit-title").value = habit.title;
    document.getElementById("habit-category").value = habit.category;
    document.getElementById("habit-period").value = habit.period;
    document.getElementById("habit-interval-days").value = habit.intervalDays || 2;
    document.getElementById("habit-target").value = habit.target;
    document.getElementById("habit-unit").value = habit.unit;
    document.getElementById("habit-reminder").value = habit.reminder || "";

    document.getElementById("group-interval-days").style.display = habit.period === "interval" ? "block" : "none";
    document.getElementById("btn-save-habit").textContent = "Обновить привычку";
    document.getElementById("btn-cancel-habit").style.display = "inline-block";

    document.querySelector('[data-tab="tab-habits"]').click();
}

function deleteHabit(id) {
    if (confirm("Вы уверены, что хотите удалить эту привычку?")) {
        appData.habits = appData.habits.filter(h => h.id !== id);
        saveAppData();
        renderApp();
    }
}

function updateHabitProgress(habitId, delta, dateKey = getTodayDateKey()) {
    if (!appData.logs[dateKey]) appData.logs[dateKey] = {};
    
    const currentVal = appData.logs[dateKey][habitId] || 0;
    const newVal = Math.max(0, currentVal + delta);
    
    appData.logs[dateKey][habitId] = newVal;
    saveAppData();
    
    renderTodayTab();
    renderCalendarTab();
    if (selectedCalendarDateKey === dateKey) {
        renderSelectedDayHabits(dateKey);
    }
}

// Переключение месяцев и стран в Календаре
function initCalendarNav() {
    document.getElementById("btn-prev-month").addEventListener("click", () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendarTab();
    });

    document.getElementById("btn-next-month").addEventListener("click", () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendarTab();
    });

    const countrySelect = document.getElementById("country-select");
    if (countrySelect) {
        countrySelect.value = appData.selectedCountry || "BY";
        countrySelect.addEventListener("change", (e) => {
            appData.selectedCountry = e.target.value;
            saveAppData();
            renderCalendarTab();
        });
    }
}

function renderCalendarTab() {
    const grid = document.getElementById("calendar-grid");
    const monthYearTitle = document.getElementById("calendar-month-year");
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    monthYearTitle.textContent = `${monthNames[month]} ${year}`;

    grid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = (firstDayIndex === 0 ? 6 : firstDayIndex - 1); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < shift; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        grid.appendChild(emptyCell);
    }

    const todayKey = getTodayDateKey();
    const userHabits = appData.habits.filter(h => h.userId === appData.currentUserId);
    const country = appData.selectedCountry || "BY";

    for (let day = 1; day <= daysInMonth; day++) {
        const dayString = day < 10 ? '0' + day : day;
        const monthString = (month + 1) < 10 ? '0' + (month + 1) : (month + 1);
        const dateKey = `${year}-${monthString}-${dayString}`;
        const monthDayKey = `${monthString}-${dayString}`;

        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Воскресенье, 6 = Суббота
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        const cell = document.createElement("div");
        cell.className = "calendar-day";
        if (isWeekend) cell.classList.add("weekend");
        if (dateKey === todayKey) cell.classList.add("today");
        if (dateKey === selectedCalendarDateKey) cell.classList.add("selected");

        let completedCount = 0;
        let totalProgress = 0;

        if (userHabits.length > 0 && appData.logs[dateKey]) {
            userHabits.forEach(h => {
                const prog = appData.logs[dateKey][h.id] || 0;
                if (prog >= h.target) completedCount++;
                if (prog > 0) totalProgress++;
            });
        }

        let badgesHtml = "";
        
        // Добавляем плашку праздника, если он есть
        if (holidays[country] && holidays[country][monthDayKey]) {
            badgesHtml += `<span class="day-badge badge-holiday" title="${holidays[country][monthDayKey]}">${holidays[country][monthDayKey]}</span>`;
        }

        // Добавляем прогресс по привычкам
        if (userHabits.length > 0) {
            if (completedCount === userHabits.length) {
                badgesHtml += `<span class="day-badge badge-full">✓ ${completedCount}</span>`;
            } else if (totalProgress > 0) {
                badgesHtml += `<span class="day-badge badge-partial">${completedCount}/${userHabits.length}</span>`;
            }
        }

        cell.innerHTML = `
            <span class="day-number">${day}</span>
            <div style="display:flex; flex-direction:column; gap:2px;">${badgesHtml}</div>
        `;

        cell.addEventListener("click", () => {
            selectedCalendarDateKey = dateKey;
            renderCalendarTab();
            renderSelectedDayHabits(dateKey);
        });

        grid.appendChild(cell);
    }
}

function renderSelectedDayHabits(dateKey) {
    const card = document.getElementById("selected-day-card");
    const title = document.getElementById("selected-day-title");
    const list = document.getElementById("selected-day-habits-list");

    card.style.display = "block";
    title.textContent = `Прогресс за ${dateKey}`;
    list.innerHTML = "";

    const userHabits = appData.habits.filter(h => h.userId === appData.currentUserId);

    if (userHabits.length === 0) {
        list.innerHTML = "<p style='color: var(--text-secondary);'>Нет привычек для отображения.</p>";
        return;
    }

    userHabits.forEach(habit => {
        const currentProgress = (appData.logs[dateKey] && appData.logs[dateKey][habit.id]) || 0;
        const isCompleted = currentProgress >= habit.target;

        const item = document.createElement("div");
        item.className = "habit-item";
        item.style.borderColor = isCompleted ? "var(--accent-green)" : "var(--border-color)";

        item.innerHTML = `
            <div class="habit-info">
                <h3>${habit.title} ${isCompleted ? '✅' : ''}</h3>
                <p>Цель: ${habit.target} ${habit.unit}</p>
            </div>
            <div class="habit-controls">
                <button class="counter-btn" onclick="updateHabitProgress('${habit.id}', -1, '${dateKey}')">-</button>
                <span><strong>${currentProgress}</strong> / ${habit.target}</span>
                <button class="counter-btn" onclick="updateHabitProgress('${habit.id}', 1, '${dateKey}')">+</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Настройки и Бэкап
function initSettingsAndBackup() {
    const themeSelect = document.getElementById("theme-select");
    const savedTheme = localStorage.getItem("app_theme") || "dark";
    
    if (savedTheme !== "dark") {
        document.documentElement.setAttribute("data-theme", savedTheme);
    }

    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener("change", (e) => {
            const selectedTheme = e.target.value;
            if (selectedTheme === "dark") {
                document.documentElement.removeAttribute("data-theme");
            } else {
                document.documentElement.setAttribute("data-theme", selectedTheme);
            }
            localStorage.setItem("app_theme", selectedTheme);
        });
    }

    document.getElementById("btn-request-notifications")?.addEventListener("click", () => {
        if (!("Notification" in window)) {
            alert("Ваш браузер не поддерживает уведомления.");
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Habit Tracker v4.0", { body: "Уведомления успешно включены!" });
            } else {
                alert("Разрешение на уведомления не получено.");
            }
        });
    });

    document.getElementById("btn-export-data")?.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `habit_v4_backup_${getTodayDateKey()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    document.getElementById("input-import-data")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.users) {
                    appData = imported;
                    saveAppData();
                    initUserSelector();
                    renderApp();
                    alert("Все данные успешно восстановлены!");
                } else {
                    alert("Неверный формат файла бэкапа.");
                }
            } catch (err) {
                alert("Ошибка чтения файла JSON.");
            }
        };
        reader.readAsText(file);
    });
}

function renderApp() {
    renderTodayTab();
    renderCalendarTab();
    renderHabitsTab();
    renderStatsTab();
}

function renderTodayTab() {
    const listContainer = document.getElementById("today-habits-list");
    const today = getTodayDateKey();
    
    document.getElementById("current-date-title").textContent = `Задачи на сегодня (${today})`;
    
    const userHabits = appData.habits.filter(h => h.userId === appData.currentUserId);
    listContainer.innerHTML = "";

    if (userHabits.length === 0) {
        listContainer.innerHTML = "<p style='color: var(--text-secondary);'>У вас пока нет привычек. Добавьте их во вкладке «Управление привычками»!</p>";
        return;
    }

    userHabits.forEach(habit => {
        const currentProgress = (appData.logs[today] && appData.logs[today][habit.id]) || 0;
        const isCompleted = currentProgress >= habit.target;

        const item = document.createElement("div");
        item.className = "habit-item";
        item.style.borderColor = isCompleted ? "var(--accent-green)" : "var(--border-color)";

        item.innerHTML = `
            <div class="habit-info">
                <h3>${habit.title} ${isCompleted ? '✅' : ''}</h3>
                <p>Категория: ${habit.category} | Цель: ${habit.target} ${habit.unit}</p>
            </div>
            <div class="habit-controls">
                <button class="counter-btn" onclick="updateHabitProgress('${habit.id}', -1)">-</button>
                <span><strong>${currentProgress}</strong> / ${habit.target}</span>
                <button class="counter-btn" onclick="updateHabitProgress('${habit.id}', 1)">+</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function renderHabitsTab() {
    const listContainer = document.getElementById("all-habits-list");
    const userHabits = appData.habits.filter(h => h.userId === appData.currentUserId);
    listContainer.innerHTML = "";

    if (userHabits.length === 0) {
        listContainer.innerHTML = "<p style='color: var(--text-secondary);'>Список пуст.</p>";
        return;
    }

    userHabits.forEach(habit => {
        const item = document.createElement("div");
        item.className = "habit-item";
        item.innerHTML = `
            <div class="habit-info">
                <h3>${habit.title}</h3>
                <p>Категория: ${habit.category} | Цель: ${habit.target} ${habit.unit} ${habit.reminder ? '| ⏰ ' + habit.reminder : ''}</p>
            </div>
            <div class="habit-controls">
                <button class="btn btn-secondary" onclick='editHabit(${JSON.stringify(habit)})'>✏️</button>
                <button class="btn btn-danger" onclick="deleteHabit('${habit.id}')">🗑️</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function renderStatsTab() {
    const container = document.getElementById("stats-summary");
    const userHabits = appData.habits.filter(h => h.userId === appData.currentUserId);
    const today = getTodayDateKey();

    let completedToday = 0;
    userHabits.forEach(h => {
        const progress = (appData.logs[today] && appData.logs[today][h.id]) || 0;
        if (progress >= h.target) completedToday++;
    });

    container.innerHTML = `
        <div class="stat-box">
            <div class="stat-value">${userHabits.length}</div>
            <div class="stat-label">Всего привычек</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${completedToday}</div>
            <div class="stat-label">Выполнено сегодня</div>
        </div>
    `;
}