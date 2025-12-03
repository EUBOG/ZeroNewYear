// Конфигурация
const API_BASE = '/api';

// DOM элементы
let currentWishes = [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loadWishes();
    loadStats();
    setupEventListeners();
    startSnowAnimation();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Добавление пожелания
    document.getElementById('add-wish-btn').addEventListener('click', addWish);
    document.getElementById('wish-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            addWish();
        }
    });

    // Счётчик символов
    document.getElementById('wish-text').addEventListener('input', function() {
        document.getElementById('char-count').textContent = this.value.length;
    });

    // Хлопушка
    document.getElementById('pull-cracker-btn').addEventListener('click', getPrediction);
    document.getElementById('close-prediction').addEventListener('click', function() {
        document.getElementById('prediction-box').classList.add('hidden');
    });

    // Обновление списка
    document.getElementById('refresh-wishes').addEventListener('click', loadWishes);
}

// Загрузить пожелания
async function loadWishes() {
    try {
        const response = await fetch(`${API_BASE}/wishes/recent?limit=20`);
        const data = await response.json();

        if (data.success) {
            currentWishes = data.wishes;
            updateWishesList(data.wishes);
            updateTreeBalls(data.wishes);
        }
    } catch (error) {
        console.error('Ошибка загрузки пожеланий:', error);
        showMessage('Не удалось загрузить пожелания', 'error');
    }
}

// Загрузить статистику
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('wish-count').textContent = data.total_wishes;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Добавить пожелание
async function addWish() {
    const wishText = document.getElementById('wish-text').value.trim();
    const messageEl = document.getElementById('message');

    if (!wishText) {
        showMessage('Введите текст пожелания', 'error');
        return;
    }

    if (wishText.length > 200) {
        showMessage('Пожелание слишком длинное (макс. 200 символов)', 'error');
        return;
    }

    // Показываем индикатор загрузки
    const btn = document.getElementById('add-wish-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Добавляем...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/wish/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: wishText })
        });

        const data = await response.json();

        if (data.success) {
            // Очищаем форму
            document.getElementById('wish-text').value = '';
            document.getElementById('char-count').textContent = '0';

            // Добавляем новый шарик
            addNewBallToTree(data.wish);

            // Обновляем список
            loadWishes();
            loadStats();

            // Показываем сообщение
            showMessage(data.message || 'Шарик добавлен на ёлку!', 'success');

            // Воспроизводим звук (если есть)
            playSound('add');
        } else {
            showMessage(data.error || 'Ошибка при добавлении', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка соединения с сервером', 'error');
    } finally {
        // Восстанавливаем кнопку
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Получить предсказание
async function getPrediction() {
    const btn = document.getElementById('pull-cracker-btn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Тяну...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/prediction/random`);
        const data = await response.json();

        if (data.success) {
            const prediction = data.prediction;
            const box = document.getElementById('prediction-box');
            const textEl = document.getElementById('prediction-text');
            const colorEl = document.getElementById('prediction-color');

            textEl.textContent = prediction.text;
            colorEl.className = 'color-badge';
            colorEl.style.backgroundColor = getColorCode(prediction.color);

            box.classList.remove('hidden');

            // Воспроизводим звук хлопушки
            playSound('cracker');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Не удалось получить предсказание', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Обновить список пожеланий
function updateWishesList(wishes) {
    const container = document.getElementById('wishes-list');
    container.innerHTML = '';

    wishes.forEach(wish => {
        const wishEl = document.createElement('div');
        wishEl.className = 'wish-item';
        wishEl.innerHTML = `
            <div class="wish-text">${escapeHtml(wish.text)}</div>
            <div class="wish-meta">
                <span class="wish-color">
                    <i class="fas fa-circle" style="color: ${getColorCode(wish.color)}"></i>
                    ${wish.color}
                </span>
                <span class="wish-time">${formatTime(wish.created_at)}</span>
            </div>
        `;
        container.appendChild(wishEl);
    });
}

// Добавить шарики на ёлку
function updateTreeBalls(wishes) {
    const container = document.getElementById('balls-container');
    container.innerHTML = '';

    // Позиции для шариков на ёлке (в процентах)
    const positions = [
        {top: '15%', left: '50%'},
        {top: '25%', left: '40%'},
        {top: '25%', left: '60%'},
        {top: '35%', left: '35%'},
        {top: '35%', left: '65%'},
        {top: '45%', left: '45%'},
        {top: '45%', left: '55%'},
        {top: '55%', left: '30%'},
        {top: '55%', left: '70%'},
        {top: '65%', left: '50%'},
        {top: '75%', left: '40%'},
        {top: '75%', left: '60%'},
        {top: '85%', left: '35%'},
        {top: '85%', left: '65%'},
    ];

    wishes.slice(0, positions.length).forEach((wish, index) => {
        if (positions[index]) {
            addBallToPosition(wish, positions[index], index);
        }
    });
}

// Добавить шарик в конкретную позицию
function addBallToPosition(wish, position, index) {
    const container = document.getElementById('balls-container');
    const ball = document.createElement('div');

    ball.className = `ball ball-${wish.color} new-ball`;
    ball.style.top = position.top;
    ball.style.left = position.left;
    ball.style.transform = `translate(-50%, -50%) rotate(${index * 25}deg)`;
    ball.innerHTML = `<i class="fas fa-star"></i>`;

    // Подсказка при наведении
    ball.title = wish.text.length > 50 ? wish.text.substring(0, 47) + '...' : wish.text;

    // Анимация появления с задержкой
    ball.style.animationDelay = `${index * 0.1}s`;

    container.appendChild(ball);

    // Удаляем класс анимации после её завершения
    setTimeout(() => {
        ball.classList.remove('new-ball');
    }, 500);
}

// Добавить новый шарик (специальная анимация)
function addNewBallToTree(wish) {
    const container = document.getElementById('balls-container');

    // Случайная позиция в нижней части ёлки
    const top = 85 + Math.random() * 10;
    const left = 35 + Math.random() * 30;

    const ball = document.createElement('div');
    ball.className = `ball ball-${wish.color}`;
    ball.style.top = `${top}%`;
    ball.style.left = `${left}%`;
    ball.style.transform = 'translate(-50%, -50%) scale(0)';
    ball.innerHTML = `<i class="fas fa-heart"></i>`;
    ball.title = wish.text;

    container.appendChild(ball);

    // Анимация появления
    setTimeout(() => {
        ball.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        ball.style.transform = 'translate(-50%, -50%) scale(1) rotate(360deg)';
    }, 10);

    // Показываем сообщение в шарике на 2 секунды
    const message = document.createElement('div');
    message.className = 'ball-message';
    message.textContent = 'Новое!';
    message.style.position = 'absolute';
    message.style.top = '-25px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.background = 'rgba(255, 255, 255, 0.9)';
    message.style.color = '#333';
    message.style.padding = '2px 8px';
    message.style.borderRadius = '10px';
    message.style.fontSize = '10px';
    message.style.whiteSpace = 'nowrap';

    ball.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 2000);
}

// Показать сообщение
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;

    // Автоскрытие через 5 секунд
    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'message';
    }, 5000);
}

// Воспроизвести звук
function playSound(type) {
    // В реальном проекте добавьте звуковые файлы
    try {
        const audio = new Audio();

        if (type === 'add') {
            audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-magic-sparkles-300.mp3';
        } else if (type === 'cracker') {
            audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-party-horn-sound-2927.mp3';
        }

        audio.volume = 0.3;
        audio.play().catch(e => console.log('Автовоспроизведение звука заблокировано'));
    } catch (e) {
        console.log('Ошибка воспроизведения звука:', e);
    }
}

// Анимация снега
function startSnowAnimation() {
    const container = document.querySelector('.snowflakes');
    const snowflakeCount = 50;

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';

        // Случайный размер
        const size = Math.random() * 5 + 2;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;

        // Случайная позиция
        snowflake.style.left = `${Math.random() * 100}vw`;
        snowflake.style.top = `${-Math.random() * 100}px`;

        // Случайная скорость
        const duration = Math.random() * 5 + 5;
        const delay = Math.random() * 5;
        snowflake.style.animation = `fall ${duration}s linear ${delay}s infinite`;

        // Случайная прозрачность
        snowflake.style.opacity = Math.random() * 0.5 + 0.3;

        container.appendChild(snowflake);
    }
}

// Вспомогательные функции
function getColorCode(colorName) {
    const colors = {
        'red': '#ff3333',
        'blue': '#3399ff',
        'gold': '#ffcc00',
        'silver': '#cccccc',
        'green': '#33cc33',
        'purple': '#cc33ff'
    };
    return colors[colorName] || '#ffffff';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Периодическое обновление статистики
setInterval(loadStats, 30000); // Каждые 30 секунд