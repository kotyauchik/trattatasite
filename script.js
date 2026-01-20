// Конфигурация - ЗАМЕНИ ЭТИ ДАННЫЕ!
const CONFIG = {
    GITHUB_TOKEN: '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', // Твой GitHub токен
    REPO_OWNER: 'kotyauchik', // Твой GitHub username
    REPO_NAME: 'trattatasite', // Название репозитория
    ISSUE_LABEL: 'counter-clicks' // Метка для issue
};

// DOM элементы
const counterEl = document.getElementById('counter');
const clickBtn = document.getElementById('clickBtn');
const lastClickEl = document.getElementById('lastClick');
const todayEl = document.getElementById('today');
const repoLinkEl = document.getElementById('repoLink');

// Состояние
let clickCount = 0;
let todayCount = 0;
let lastClickTime = null;

// API URL
const API_URL = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}`;

// Заголовки для запросов
const headers = {
    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
};

// Инициализация
async function init() {
    // Ссылка на issues
    repoLinkEl.href = `https://github.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues?q=label:${CONFIG.ISSUE_LABEL}`;
    
    // Загружаем текущий счет
    await loadCounter();
    updateDisplay();
}

// Загружаем счетчик из GitHub Issues
async function loadCounter() {
    try {
        // Ищем issue с меткой
        const response = await fetch(
            `${API_URL}/issues?labels=${CONFIG.ISSUE_LABEL}&state=all`,
            { headers }
        );
        
        if (!response.ok) throw new Error('GitHub API error');
        
        const issues = await response.json();
        
        if (issues.length > 0) {
            // Берем последнее issue
            const latestIssue = issues[0];
            clickCount = issues.length;
            
            // Парсим дату последнего клика
            lastClickTime = new Date(latestIssue.created_at);
            
            // Считаем клики за сегодня
            const today = new Date().toDateString();
            todayCount = issues.filter(issue => 
                new Date(issue.created_at).toDateString() === today
            ).length;
        }
    } catch (error) {
        console.error('Error loading counter:', error);
        // Локальное хранение на случай ошибки
        const saved = localStorage.getItem('clickCounter');
        if (saved) {
            const data = JSON.parse(saved);
            clickCount = data.count || 0;
            lastClickTime = data.lastClick ? new Date(data.lastClick) : null;
            todayCount = data.todayCount || 0;
        }
    }
}

// Создаем новое issue при клике
async function registerClick() {
    // Анимация кнопки
    clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickBtn.style.transform = '';
    }, 150);
    
    // Увеличиваем счетчики
    clickCount++;
    todayCount++;
    lastClickTime = new Date();
    
    // Сохраняем локально на случай ошибки
    localStorage.setItem('clickCounter', JSON.stringify({
        count: clickCount,
        lastClick: lastClickTime.toISOString(),
        todayCount: todayCount
    }));
    
    // Обновляем отображение
    updateDisplay();
    
    try {
        // Создаем новое issue в GitHub
        const issueData = {
            title: `Клик #${clickCount} - ${new Date().toLocaleString('ru-RU')}`,
            body: `Пользователь пожертвовал кучу в ${new Date().toLocaleString('ru-RU')}`,
            labels: [CONFIG.ISSUE_LABEL]
        };
        
        const response = await fetch(`${API_URL}/issues`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(issueData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create issue');
        }
        
        console.log('Issue created successfully');
        
    } catch (error) {
        console.error('Error creating issue:', error);
        // Показываем сообщение об ошибке
        alert('Не удалось сохранить клик в GitHub. Попробуй позже!');
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
    
    // Анимация счетчика
    counterEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
        counterEl.style.transform = 'scale(1)';
    }, 300);
}

// Обработчик клика
clickBtn.addEventListener('click', registerClick);

// Инициализируем при загрузке
document.addEventListener('DOMContentLoaded', init);

// Обновляем счетчик каждые 30 секунд
setInterval(async () => {
    await loadCounter();
    updateDisplay();
}, 30000);
