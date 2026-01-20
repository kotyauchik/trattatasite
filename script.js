// Конфигурация
const CONFIG = {
    GITHUB_TOKEN: 'ghp_твой_токен', // ЗАМЕНИ!
    REPO_OWNER: 'kotyouchik',
    REPO_NAME: 'trattata',
    COUNTER_FILE: 'counter.json' // Будем хранить в файле, а не в Issues
};

// DOM элементы
const counterEl = document.getElementById('counter');
const clickBtn = document.getElementById('clickBtn');
const lastClickEl = document.getElementById('lastClick');
const todayEl = document.getElementById('today');

// Состояние
let clickCount = 0;
let todayCount = 0;
let lastClickTime = null;

// Инициализация
async function init() {
    await loadCounter();
    updateDisplay();
}

// Загружаем счетчик
async function loadCounter() {
    try {
        // Пробуем загрузить из файла в репозитории
        const response = await fetch(
            `https://raw.githubusercontent.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.COUNTER_FILE}`,
            { cache: 'no-store' }
        );
        
        if (response.ok) {
            const data = await response.json();
            clickCount = data.total || 0;
            todayCount = data.today || 0;
            lastClickTime = data.lastClick ? new Date(data.lastClick) : null;
        }
    } catch (error) {
        console.log('Файл счетчика не найден, начинаем с нуля');
    }
    
    // Пробуем локальное сохранение
    const localData = localStorage.getItem('clickCounter');
    if (localData) {
        const data = JSON.parse(localData);
        clickCount = Math.max(clickCount, data.count || 0);
    }
}

// Сохраняем клик
async function registerClick() {
    // Анимация
    clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => clickBtn.style.transform = '', 150);
    
    // Обновляем счетчики
    clickCount++;
    const now = new Date();
    lastClickTime = now;
    
    // Обновляем сегодняшний счет
    const today = now.toDateString();
    const lastDate = localStorage.getItem('lastClickDate');
    
    if (lastDate === today) {
        todayCount++;
    } else {
        todayCount = 1;
        localStorage.setItem('lastClickDate', today);
    }
    
    // Сохраняем локально
    localStorage.setItem('clickCounter', JSON.stringify({
        count: clickCount,
        lastClick: now.toISOString(),
        todayCount: todayCount
    }));
    
    // Обновляем отображение
    updateDisplay();
    
    // Пробуем сохранить в GitHub
    await saveToGitHub();
}

// Сохраняем в GitHub
async function saveToGitHub() {
    try {
        // 1. Получаем SHA текущего файла (если есть)
        let sha = null;
        try {
            const fileInfo = await fetch(
                `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.COUNTER_FILE}`,
                {
                    headers: {
                        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (fileInfo.ok) {
                const data = await fileInfo.json();
                sha = data.sha;
            }
        } catch (e) {
            // Файла еще нет
        }
        
        // 2. Подготавливаем данные
        const counterData = {
            total: clickCount,
            today: todayCount,
            lastClick: lastClickTime.toISOString(),
            updated: new Date().toISOString()
        };
        
        const content = btoa(JSON.stringify(counterData, null, 2));
        
        // 3. Обновляем файл
        const response = await fetch(
            `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.COUNTER_FILE}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Обновлен счетчик: ${clickCount} кликов`,
                    content: content,
                    sha: sha // Если файл существует
                })
            }
        );
        
        if (response.ok) {
            console.log('✅ Счетчик сохранен в GitHub');
        } else {
            const error = await response.json();
            console.warn('⚠️ Не удалось сохранить в GitHub:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Ошибка при сохранении в GitHub:', error);
    }
}

// Обновляем отображение
function updateDisplay() {
    counterEl.textContent = clickCount.toLocaleString('ru-RU');
    
    if (lastClickTime) {
        const now = new Date();
        const diff = Math.floor((now - lastClickTime) / 1000);
        
        if (diff < 60) {
            lastClickEl.textContent = `${diff} секунд назад`;
        } else if (diff < 3600) {
            lastClickEl.textContent = `${Math.floor(diff / 60)} минут назад`;
        } else if (diff < 86400) {
            lastClickEl.textContent = `${Math.floor(diff / 3600)} часов назад`;
        } else {
            lastClickEl.textContent = lastClickTime.toLocaleDateString('ru-RU');
        }
    }
    
    todayEl.textContent = `${todayCount} сегодня`;
    
    // Анимация
    counterEl.style.transform = 'scale(1.2)';
    setTimeout(() => counterEl.style.transform = 'scale(1)', 300);
}

// События
clickBtn.addEventListener('click', registerClick);
document.addEventListener('DOMContentLoaded', init);

// Автосохранение каждые 10 кликов
let pendingSaves = 0;
clickBtn.addEventListener('click', () => {
    pendingSaves++;
    if (pendingSaves >= 10) {
        saveToGitHub();
        pendingSaves = 0;
    }
});

// Периодическая синхронизация
setInterval(async () => {
    await loadCounter();
    updateDisplay();
}, 30000);
