// Основные переменные таймера
let timerDisplay = document.getElementById('timer');
let startBtn = document.getElementById('startBtn');
let pauseBtn = document.getElementById('pauseBtn');
let timerStatus = document.getElementById('timerStatus');
let todayBreakTimeElement = document.getElementById('todayBreakTime');
let sessionsCompletedElement = document.getElementById('sessionsCompleted');

let workTime = 25 * 60; // в секундах
let breakTime = 5 * 60;
let timeLeft = workTime;
let timerInterval = null;
let isRunning = false;
let isWorkPhase = true;
let totalBreakTime = 0;
let sessionsCompleted = 0;

// Загрузка данных из localStorage
function loadFromStorage() {
    const savedBreakTime = localStorage.getItem('restManager_breakTime');
    const savedSessions = localStorage.getItem('restManager_sessions');
    const savedDate = localStorage.getItem('restManager_date');
    
    const today = new Date().toDateString();
    
    if (savedDate === today) {
        totalBreakTime = parseInt(savedBreakTime) || 0;
        sessionsCompleted = parseInt(savedSessions) || 0;
    } else {
        totalBreakTime = 0;
        sessionsCompleted = 0;
    }
    
    updateStatsDisplay();
}

// Сохранение данных в localStorage
function saveToStorage() {
    const today = new Date().toDateString();
    localStorage.setItem('restManager_breakTime', totalBreakTime.toString());
    localStorage.setItem('restManager_sessions', sessionsCompleted.toString());
    localStorage.setItem('restManager_date', today);
}

// Обновление отображения статистики
function updateStatsDisplay() {
    todayBreakTimeElement.textContent = `${totalBreakTime} минут`;
    sessionsCompletedElement.textContent = sessionsCompleted.toString();
}

// Обновление отображения таймера
function updateDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Обновляем заголовок вкладки
    const phase = isWorkPhase ? "Работа" : "Отдых";
    document.title = `${timerDisplay.textContent} (${phase}) - Менеджер отдыха`;
}

// Запуск таймера
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        const status = isWorkPhase ? 
            "⏳ Работайте! Сосредоточьтесь на задаче." : 
            "🎉 Перерыв! Расслабьтесь и восстановите силы.";
        timerStatus.textContent = status;
        
        // Воспроизведение звука начала (опционально)
        playSound('start');

        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft < 0) {
                clearInterval(timerInterval);
                
                // Переключаем фазу
                isWorkPhase = !isWorkPhase;
                
                if (isWorkPhase) {
                    // Только что закончился отдых, начинается работа
                    timeLeft = workTime;
                    sessionsCompleted++;
                    timerStatus.textContent = "🔔 Отдых окончен! Возвращайтесь к работе.";
                } else {
                    // Только что закончилась работа, начинается отдых
                    timeLeft = breakTime;
                    totalBreakTime += breakTime / 60; // Добавляем минуты отдыха
                    saveToStorage();
                    updateStatsDisplay();
                    timerStatus.textContent = "🌟 Отличная работа! Время отдохнуть.";
                }
                
                updateDisplay();
                
                // Уведомление
                showNotification();
                
                // Воспроизведение звука
                playSound('alert');
                
                // Автозапуск следующей фазы
                startTimer();
            }
        }, 1000);
    }
}

// Пауза таймера
function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    timerStatus.textContent = "⏸️ Таймер на паузе";
}

// Сброс таймера
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isWorkPhase = true;
    timeLeft = workTime;
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    timerStatus.textContent = "✅ Готово к работе. Нажмите 'Старт'.";
}

// Применение настроек таймера
function applySettings() {
    const newWorkTime = parseInt(document.getElementById('workTime').value);
    const newBreakTime = parseInt(document.getElementById('breakTime').value);
    
    if (newWorkTime > 0 && newBreakTime > 0) {
        workTime = newWorkTime * 60;
        breakTime = newBreakTime * 60;
        
        if (!isRunning) {
            timeLeft = workTime;
            updateDisplay();
        }
        
        timerStatus.textContent = `✅ Настройки сохранены: работа ${newWorkTime} мин, отдых ${newBreakTime} мин.`;
    }
}

// Воспроизведение звука (используем стандартные звуки браузера)
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'start') {
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        } else if (type === 'alert') {
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        }
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log("Аудио не поддерживается или заблокировано");
    }
}

// Показать уведомление
function showNotification() {
    const message = isWorkPhase ? 
        "Время работать! Перерыв окончен." : 
        "Пора отдохнуть! Рабочая сессия завершена.";
    
    // Проверяем поддержку уведомлений
    if (!("Notification" in window)) {
        console.log("Браузер не поддерживает уведомления");
        return;
    }
    
    // Проверяем разрешение на уведомления
    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}

// Переключение напоминаний
function toggleReminders() {
    const button = document.getElementById('reminderToggle');
    const intervalInput = document.getElementById('reminderInterval');
    
    if (button.innerHTML.includes('Включить')) {
        button.innerHTML = '<i class="fas fa-bell"></i> Выключить напоминания';
        const interval = parseInt(intervalInput.value) * 60 * 1000; // в миллисекундах
        
        // Запускаем периодические напоминания
        window.restReminderInterval = setInterval(() => {
            timerStatus.textContent = "🔔 Напоминание: пора сделать небольшой перерыв!";
            playSound('alert');
        }, interval);
        
        timerStatus.textContent = `🔔 Напоминания включены каждые ${intervalInput.value} минут`;
    } else {
        button.innerHTML = '<i class="fas fa-bell-slash"></i> Включить напоминания';
        clearInterval(window.restReminderInterval);
        timerStatus.textContent = "🔕 Напоминания выключены";
    }
}

// Добавление идеи для отдыха
function addRestIdea() {
    const input = document.getElementById('restIdeaInput');
    const ideaText = input.value.trim();
    
    if (ideaText === "") {
        alert("Введите идею для отдыха!");
        return;
    }
    
    const list = document.getElementById('restIdeasList');
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${ideaText}</span> 
        <button class="delete-btn" onclick="this.parentElement.remove(); saveIdeas();">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    list.appendChild(li);
    input.value = "";
    input.focus();
    
    saveIdeas();
}

// Сохранение идей в localStorage
function saveIdeas() {
    const ideas = [];
    const listItems = document.querySelectorAll('#restIdeasList li span');
    
    listItems.forEach(item => {
        ideas.push(item.textContent);
    });
    
    localStorage.setItem('restManager_ideas', JSON.stringify(ideas));
}

// Загрузка идей из localStorage
function loadIdeas() {
    const savedIdeas = localStorage.getItem('restManager_ideas');
    if (savedIdeas) {
        const ideas = JSON.parse(savedIdeas);
        const list = document.getElementById('restIdeasList');
        
        ideas.forEach(idea => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${idea}</span> 
                <button class="delete-btn" onclick="this.parentElement.remove(); saveIdeas();">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            list.appendChild(li);
        });
    }
}

// Сброс статистики
function resetStats() {
    if (confirm("Вы уверены, что хотите сбросить статистику за сегодня?")) {
        totalBreakTime = 0;
        sessionsCompleted = 0;
        saveToStorage();
        updateStatsDisplay();
        timerStatus.textContent = "📊 Статистика сброшена!";
    }
}

// Инициализация при загрузке страницы
function init() {
    loadFromStorage();
    loadIdeas();
    updateDisplay();
    
    // Запрашиваем разрешение на уведомления
    if ("Notification" in window && Notification.permission === "default") {
        setTimeout(() => {
            Notification.requestPermission();
        }, 1000);
    }
    
    // Добавляем обработчик нажатия Enter для поля ввода
    document.getElementById('restIdeaInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addRestIdea();
        }
    });
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', init);
