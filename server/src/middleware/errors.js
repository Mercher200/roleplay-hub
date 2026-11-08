// src/middleware/errors.js
const HttpError = require('../utils/HttpError');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Маршрут не найден', path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Наши явные ошибки
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Ошибки body-parser (невалидный JSON и т.п.) и прочие с status/statusCode
  const status = err.status || err.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({
      error: err.message || 'Некорректный запрос',
      ...(err.type ? { type: err.type } : {}),
    });
  }

  // Всё остальное — 500
  console.error('[UNHANDLED]', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}

module.exports = { notFoundHandler, errorHandler };