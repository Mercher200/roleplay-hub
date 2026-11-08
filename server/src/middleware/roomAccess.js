// src/middleware/roomAccess.js
const { Room } = require('../../models');
const HttpError = require('../utils/HttpError');

// Проверяет, что req.user.id === room.gameMasterId
// roomId берётся из req.params.id (роуты комнат) или req.body.roomId (создание персонажа)
async function requireRoomGM(req, res, next) {
  try {
    const raw = req.params.id ?? req.body.roomId;
    const roomId = Number(raw);
    if (!Number.isInteger(roomId)) {
      return next(new HttpError(400, 'Не указан roomId'));
    }
    const room = await Room.findByPk(roomId);
    if (!room) return next(new HttpError(404, 'Комната не найдена'));
    if (room.gameMasterId !== req.user.id) {
      return next(new HttpError(403, 'Только гейм-мастер этой комнаты может выполнить действие'));
    }
    req.room = room;
    next();
  } catch (e) { next(e); }
}

module.exports = { requireRoomGM };