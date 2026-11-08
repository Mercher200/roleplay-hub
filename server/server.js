// server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRouter = require('./src/routes/auth');
const roomsRouter = require('./src/routes/rooms');
const charactersRouter = require('./src/routes/characters');
const { notFoundHandler, errorHandler } = require('./src/middleware/errors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — разрешаем запросы с Vite dev-сервера
app.use(cors({ origin: 'http://localhost:5173' }));

// Парсинг JSON
app.use(express.json());

// Логгер запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Health-check с проверкой БД
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: e.message });
  }
});

// Роуты
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/characters', charactersRouter);

// 404 и глобальный error handler — строго после всех роутов
app.use(notFoundHandler);
app.use(errorHandler);

// Запуск: сначала проверяем подключение к БД, потом слушаем порт
(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
    app.listen(PORT, () => {
      console.log(`RolePlay Hub server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Не удалось подключиться к PostgreSQL:', e.message);
    process.exit(1);
  }
})();