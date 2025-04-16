const VAPID_PUBLIC_KEY = 'BE1QBGBQzhhkJ0tv18l8qf1bF6uJ47JQSPywlV_UPVP35KGIIDYW0pMIThDoZMhradUFZ4d44rL48cSkkTjr_vQ'
const VAPID_PRIVATE_KEY='xLPNkc75hlV8cWoz5q2VO_xmTveVnLN6NZO-gg9IMHY'
const VAPID_EMAIL='your@email.com'
const PORT='3000'

// В начале app.js
console.log('VAPID Key:', VAPID_PUBLIC_KEY);
console.log('Key length:', VAPID_PUBLIC_KEY.length);
if (VAPID_PUBLIC_KEY.length !== 87 || !VAPID_PUBLIC_KEY.startsWith('B')) {
 alert('ОШИБКА: Неверный формат VAPID ключа! Проверьте консоль.');
 console.error('Ключ должен быть 87 символов и начинаться с "B"');
}
// Проверка поддержки
if (!('serviceWorker' in navigator)) {
 updateStatus('Service Worker не поддерживается', 'red');
 document.getElementById('subscribeBtn').disabled = true;
}
// Инициализация
document.addEventListener('DOMContentLoaded', init);
async function init() {
 try {
 const reg = await navigator.serviceWorker.register('/sw.js');
 console.log('Service Worker зарегистрирован');

 const subscription = await reg.pushManager.getSubscription();
 updateUI(subscription);

 setupEventHandlers(reg, subscription);
 } catch (error) {
 console.error('Ошибка инициализации:', error);
 updateStatus(`Ошибка: ${error.message}`, 'red');
 }
}
function setupEventHandlers(reg, subscription) {
 document.getElementById('subscribeBtn').addEventListener('click', async () => {
 try {
 if (subscription) {
 await unsubscribe(subscription);
 updateUI(null);
 } else {
 const newSub = await subscribe(reg);
 updateUI(newSub);
 }
 } catch (error) {
 console.error('Ошибка:', error);
 updateStatus(`Ошибка: ${error.message}`, 'red');
 }
 });
 document.getElementById('sendBtn').addEventListener('click', sendTestNotification);
}
async function subscribe(reg) {
 const subscription = await reg.pushManager.subscribe({
 userVisibleOnly: true,
 applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
 });

 await fetch('/subscribe', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(subscription)
 });

 return subscription;
}
async function unsubscribe(subscription) {
 await subscription.unsubscribe();
 await fetch('/unsubscribe', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ endpoint: subscription.endpoint })
 });
}
async function sendTestNotification() {
 const title = document.getElementById('titleInput').value;
 const body = document.getElementById('bodyInput').value;

 try {
 const response = await fetch('/send-notification', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ title, body })
 });

 if (!response.ok) throw new Error('Ошибка сервера');
 updateStatus('Уведомление отправлено!', 'green');
 } catch (error) {
 console.error('Ошибка отправки:', error);
 updateStatus(`Ошибка: ${error.message}`, 'red');
 }
}
function updateUI(subscription) {
 const btn = document.getElementById('subscribeBtn');
 if (subscription) {
 btn.textContent = 'Отписаться';
 updateStatus('Подписка активна', 'green');
 } else {
 btn.textContent = 'Включить уведомления';
 updateStatus('Уведомления отключены', 'gray');
 }
}
function updateStatus(text, color) {
 const el = document.getElementById('status');
 el.textContent = `Статус: ${text}`;
 el.style.color = color;
}
function urlBase64ToUint8Array(base64String) {
 // Удаляем возможные пробелы и лишние символы
 base64String = base64String.trim();

 // Проверка длины ключа
 if (base64String.length !== 87) {
 throw new Error(`Неверная длина ключа: ${base64String.length} (должно быть
87)`);
 }

 // Стандартное преобразование
 const padding = '='.repeat((4 - base64String.length % 4) % 4);
 const base64 = (base64String + padding)
 .replace(/-/g, '+')
 .replace(/_/g, '/');

 try {
 const rawData = atob(base64);
 const outputArray = new Uint8Array(rawData.length);

 for (let i = 0; i < rawData.length; ++i) {
 outputArray[i] = rawData.charCodeAt(i);
 }
 return outputArray;
 } catch (e) {
 throw new Error(`Ошибка декодирования: ${e.message}`);
 }
}

// ========= Код для управления задачами =========

// Хранилище задач
let tasks = [];
let currentFilter = 'all';

function loadTasks() {
  const stored = localStorage.getItem('tasks');
  tasks = stored ? JSON.parse(stored) : [];
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  const listEl = document.getElementById('taskList');
  listEl.innerHTML = '';
  const filtered = tasks.filter(task => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
  });
  filtered.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task.text;
    li.style.textDecoration = task.completed ? 'line-through' : 'none';
    li.addEventListener('click', () => toggleTask(task.id));
    listEl.appendChild(li);
  });
}

function addTask(text) {
  const newTask = { id: Date.now(), text, completed: false };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  // Если разрешены уведомления, показать уведомление о новой задаче
  if (Notification.permission === 'granted') {
    new Notification('Новая задача', {
      body: text,
      icon: '/icons/icon-192.png'
    });
  }
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
}

// События интерфейса
document.getElementById('addTaskBtn').addEventListener('click', () => {
  const input = document.getElementById('newTaskInput');
  const text = input.value.trim();
  if (text) {
    addTask(text);
    input.value = '';
  }
});

document.getElementById('filterAll').addEventListener('click', () => {
  currentFilter = 'all';
  renderTasks();
});
document.getElementById('filterActive').addEventListener('click', () => {
  currentFilter = 'active';
  renderTasks();
});
document.getElementById('filterCompleted').addEventListener('click', () => {
  currentFilter = 'completed';
  renderTasks();
});

// Новый обработчик для кнопки "Включить уведомления" (теперь переключается между подпиской и отпиской)
document.getElementById('subscribeBtn').addEventListener('click', async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    updateStatus('Service Worker не зарегистрирован', 'red');
    return;
  }
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    // Если подписки нет, запрашиваем разрешение и подписываемся
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        updateStatus('Уведомления не разрешены', 'red');
        return;
      }
    } else if (Notification.permission === 'denied') {
      updateStatus('Уведомления заблокированы', 'red');
      return;
    }
    try {
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      await fetch('/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
      // Изменяем текст кнопки и отображение статуса
      updateUI(newSub);
    } catch (error) {
      updateStatus(`Ошибка подписки: ${error.message}`, 'red');
      console.error(error);
    }
  } else {
    // Если подписка уже существует, выполняем отписку
    try {
      await subscription.unsubscribe();
      await fetch('/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      // Изменяем текст кнопки и отображение статуса
      updateUI(null);
    } catch (error) {
      updateStatus(`Ошибка отписки: ${error.message}`, 'red');
      console.error(error);
    }
  }
});

// Напоминание о невыполненных задачах каждые 2 часа
setInterval(() => {
  const activeTasks = tasks.filter(task => !task.completed);
  if (activeTasks.length > 0 && Notification.permission === 'granted') {
    new Notification('Напоминание', {
      body: 'У вас есть невыполненные задачи!',
      icon: '/icons/icon-192.png'
    });
  }
}, 2 * 60 * 60 * 1000); // 2 часа

// Инициализация задач при загрузке
loadTasks();
renderTasks();