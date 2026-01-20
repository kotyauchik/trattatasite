// УЛЬТРА-ПРОСТОЙ ВАРИАНТ
const counterEl = document.getElementById('counter');
const clickBtn = document.getElementById('clickBtn');
const lastClickEl = document.getElementById('lastClick');
const todayEl = document.getElementById('today');

// Загружаем счетчик
function loadCounter() {
    const data = localStorage.getItem('clickCounter');
    if (data) {
        return JSON.parse(data);
    }
    return {
        total: 0,
        today: 0,
        lastClick: null,
        todayDate: new Date().toDateString()
    };
}

// Сохраняем счетчик
function saveCounter(data) {
    localStorage.setItem('clickCounter', JSON.stringify(data));
}

// Инициализация
let counterData = loadCounter();

// Обновляем отображение
function updateDisplay() {
    counterEl.textContent = counterData.total;
    
    if (counterData.lastClick) {
        const lastClick = new Date(counterData.lastClick);
        const now = new Date();
        const diff = Math.floor((now - lastClick) / 1000);
        
        if (diff < 60) lastClickEl.textContent = `${diff} сек назад`;
        else if (diff < 3600) lastClickEl.textContent = `${Math.floor(diff/60)} мин назад`;
        else if (diff < 86400) lastClickEl.textContent = `${Math.floor(diff/3600)} час назад`;
        else lastClickEl.textContent = lastClick.toLocaleDateString('ru-RU');
    }
    
    todayEl.textContent = `${counterData.today} сегодня`;
}

// Обработчик клика
clickBtn.addEventListener('click', () => {
    // Анимация
    clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => clickBtn.style.transform = '', 150);
    
    // Обновляем счетчики
    const now = new Date();
    const today = now.toDateString();
    
    if (counterData.todayDate !== today) {
        counterData.today = 0;
        counterData.todayDate = today;
    }
    
    counterData.total++;
    counterData.today++;
    counterData.lastClick = now.toISOString();
    
    // Сохраняем
    saveCounter(counterData);
    
    // Обновляем отображение
    updateDisplay();
    
    // Анимация счетчика
    counterEl.style.transform = 'scale(1.3)';
    setTimeout(() => counterEl.style.transform = 'scale(1)', 300);
    
    // Пытаемся сохранить в GitHub (не блокируем интерфейс)
    trySaveToGitHub();
});

// Пытаемся сохранить в GitHub (не обязательно)
async function trySaveToGitHub() {
    // Можно добавить позже
    console.log(`Клик #${counterData.total} - локально сохранено`);
}

// Инициализация
updateDisplay();

// Показываем что все работает
console.log('Счетчик инициализирован. Локальное хранилище работает.');
