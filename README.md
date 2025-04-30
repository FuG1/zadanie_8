# PWA Push Demo

Демонстрация Progressive Web App с push-уведомлениями и задачами.

## Запуск

1. **Установите зависимости:**

```sh
npm install
```

2. **Настройте переменные окружения:**

Файл [`process.env`](process.env) уже содержит VAPID-ключи и порт. При необходимости измените значения.

3. **Запустите сервер:**

```sh
node server/index.js
```

4. **Откройте приложение:**

Перейдите в браузере по адресу [http://localhost:3000](http://localhost:3000)

## Структура проекта

- [`client/`](client/) — фронтенд (HTML, CSS, JS, сервис-воркер)
- [`server/`](server/) — сервер на Express для обработки push-уведомлений

## Требования

- Node.js 16+
- npm

## Примечания

- Для работы push-уведомлений сайт должен быть открыт по HTTPS или на `localhost`.
- VAPID-ключи можно сгенерировать с помощью пакета `web-push`:
  ```sh
  npx web-push generate-vapid-keys
  ```
  и прописать их в [`process.env`](process.env).
