// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Требуется авторизация (заголовок Authorization: Bearer <token>)'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'Токен истёк, войдите заново'));
    }
    next(new HttpError(401, 'Недействительный токен'));
  }
}

module.exports = { requireAuth };