// src/routes/messages.js
const express = require('express');
const { Room, RoomParticipant, User } = require('../../models');
const Message = require('../models/mongo/Message');
const { isMongoReady } = require('../mongo');
const { requireAuth } = require('../middleware/auth');
const { rollDice } = require('../utils/dice');
const HttpError = require('../utils/HttpError');

const router = express.Router({ mergeParams: true });

async function requireParticipant(req) {
  const roomId = Number(req.params.id);
  if (!Number.isInteger(roomId)) throw new HttpError(400, 'ID комнаты должен быть числом');

  const room = await Room.findByPk(roomId);
  if (!room) throw new HttpError(404, 'Комната не найдена');

  const participant = await RoomParticipant.findOne({
    where: { roomId, userId: req.user.id },
  });
  if (!participant) throw new HttpError(403, 'Вы не участник этой комнаты');

  return { room, participant };
}

function requireMongo(_req, _res, next) {
  if (!isMongoReady()) {
    return next(new HttpError(503, 'Чат временно недоступен (MongoDB не подключена)'));
  }
  next();
}

router.get('/messages', requireAuth, requireMongo, async (req, res, next) => {
  try {
    const { room } = await requireParticipant(req);
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    const messages = await Message.find({ roomId: room.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(messages.reverse());
  } catch (e) { next(e); }
});

router.post('/messages', requireAuth, requireMongo, async (req, res, next) => {
  try {
    const { room } = await requireParticipant(req);

    if (!room.isActive) throw new HttpError(409, 'Комната в архиве, чат закрыт');

    const text = (req.body.text || '').trim();
    if (!text) throw new HttpError(400, 'Текст сообщения обязателен');
    if (text.length > 1000) throw new HttpError(400, 'Максимум 1000 символов');

    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username'] });

    const message = await Message.create({
      roomId: room.id,
      userId: user.id,
      username: user.username,
      type: 'chat',
      text,
    });

    res.status(201).json(message);
  } catch (e) { next(e); }
});

router.post('/roll', requireAuth, requireMongo, async (req, res, next) => {
  try {
    const { room } = await requireParticipant(req);

    if (!room.isActive) throw new HttpError(409, 'Комната в архиве, броски недоступны');

    const result = rollDice(req.body.dice);
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username'] });

    const message = await Message.create({
      roomId: room.id,
      userId: user.id,
      username: user.username,
      type: 'roll',
      text: '',
      rollResult: result,
    });

    res.status(201).json(message);
  } catch (e) { next(e); }
});

router.put('/messages/:messageId', requireAuth, requireMongo, async (req, res, next) => {
  try {
    const { room } = await requireParticipant(req);
    const { messageId } = req.params;

    if (!room.isActive) throw new HttpError(409, 'Комната в архиве, чат закрыт');

    const text = (req.body.text || '').trim();
    if (!text) throw new HttpError(400, 'Текст сообщения обязателен');

    const message = await Message.findOne({ _id: messageId, roomId: room.id });
    if (!message) throw new HttpError(404, 'Сообщение не найдено');

    if (message.userId !== req.user.id) {
      throw new HttpError(403, 'Вы можете редактировать только свои сообщения');
    }

    if (message.type !== 'chat') {
      throw new HttpError(400, 'Редактировать можно только текстовые сообщения');
    }

    message.text = text;
    await message.save();

    res.json(message);
  } catch (e) { next(e); }
});

router.delete('/messages/:messageId', requireAuth, requireMongo, async (req, res, next) => {
  try {
    const { room } = await requireParticipant(req);
    const { messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, roomId: room.id });
    if (!message) throw new HttpError(404, 'Сообщение не найдено');

    const isAuthor = message.userId === req.user.id;
    const isGM = room.gameMasterId === req.user.id;

    if (!isAuthor && !isGM) {
      throw new HttpError(403, 'Вы можете удалять только свои сообщения (или вы не GM)');
    }

    await message.deleteOne();

    res.status(204).send(); 
  } catch (e) { next(e); }
});

module.exports = router;