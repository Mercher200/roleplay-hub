// server.js
const dns = require('dns');
// Принудительно используем публичные DNS-серверы Google для обхода блокировок провайдера
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { connectMongo } = require('./src/mongo');
const authRouter = require('./src/routes/auth');
const roomsRouter = require('./src/routes/rooms');
const charactersRouter = require('./src/routes/characters');
const messagesRouter = require('./src/routes/messages');
const { notFoundHandler, errorHandler } = require('./src/middleware/errors');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS для клиента Vite
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Логгер запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Health-check с проверкой обеих БД
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    const { isMongoReady } = require('./src/mongo');
    res.json({ 
      status: 'ok', 
      db: 'connected', 
      mongo: isMongoReady() ? 'connected' : 'disconnected' 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: e.message });
  }
});

// Подключение роутов
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/rooms/:id', messagesRouter);
app.use('/api/characters', charactersRouter);

// Обработка ошибок
app.use(notFoundHandler);
app.use(errorHandler);

// Запуск сервера
(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`RolePlay Hub server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Не удалось запустить сервер:', e.message);
    process.exit(1);
  }
})();