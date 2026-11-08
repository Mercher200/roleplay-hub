// src/routes/rooms.js
const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { Room, User, Character, RoomParticipant } = require('../../models');
const HttpError = require('../utils/HttpError');
const { validateRoomBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { requireRoomGM } = require('../middleware/roomAccess');

const router = express.Router();
const SALT_ROUNDS = 10;

const safeRoom = (room) => {
  const plain = room.toJSON ? room.toJSON() : { ...room };
  delete plain.passwordHash;
  return plain;
};

// GET /api/rooms — публичный список активных комнат
router.get('/', async (req, res, next) => {
  try {
    const where = req.query.includeArchived === 'true' ? {} : { isActive: true };
    const rooms = await Room.findAll({
      where,
      order: [['id', 'ASC']],
      include: [{ model: User, as: 'gameMaster', attributes: ['id', 'username'] }],
    });
    res.json(rooms.map(safeRoom));
  } catch (e) { next(e); }
});

// GET /api/rooms/:id — публичная карточка комнаты
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'ID должен быть числом');
    const room = await Room.findByPk(id, {
      include: [
        { model: User, as: 'gameMaster', attributes: ['id', 'username'] },
        { model: Character, as: 'characters' },
      ],
    });
    if (!room) throw new HttpError(404, 'Комната не найдена');
    res.json(safeRoom(room));
  } catch (e) { next(e); }
});

// POST /api/rooms — создание комнаты (только авторизованные)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    validateRoomBody(req.body);
    const { name, scenario, isPrivate = false, maxPlayers = 5, password } = req.body;

    if (isPrivate && (!password || typeof password !== 'string' || password.length < 3)) {
      throw new HttpError(400, 'Для закрытой комнаты нужен пароль (минимум 3 символа)');
    }

    const passwordHash = isPrivate ? await bcrypt.hash(password, SALT_ROUNDS) : null;

    const room = await Room.create({
      gameMasterId: req.user.id,        // ← из JWT, не из body
      name: name.trim(),
      scenario,
      isPrivate: Boolean(isPrivate),
      passwordHash,
      maxPlayers,
    });
    res.status(201).json(safeRoom(room));
  } catch (e) { next(e); }
});

// PUT /api/rooms/:id — только GM комнаты
router.put('/:id', requireAuth, requireRoomGM, async (req, res, next) => {
  try {
    const room = req.room;
    validateRoomBody({ ...room.toJSON(), ...req.body });
    await room.update({
      name: req.body.name.trim(),
      scenario: req.body.scenario,
      isPrivate: req.body.isPrivate !== undefined ? Boolean(req.body.isPrivate) : room.isPrivate,
      maxPlayers: req.body.maxPlayers ?? room.maxPlayers,
    });
    res.json(safeRoom(room));
  } catch (e) { next(e); }
});

// PATCH /api/rooms/:id/archive — только GM
router.patch('/:id/archive', requireAuth, requireRoomGM, async (req, res, next) => {
  try {
    await req.room.update({ isActive: false });
    res.json({ message: 'Комната архивирована', id: req.room.id });
  } catch (e) { next(e); }
});

// PATCH /api/rooms/:id/reopen — только GM
router.patch('/:id/reopen', requireAuth, requireRoomGM, async (req, res, next) => {
  try {
    await req.room.update({ isActive: true });
    res.json({ message: 'Комната снова активна', id: req.room.id });
  } catch (e) { next(e); }
});

// DELETE /api/rooms/:id — только GM, только если нет персонажей
router.delete('/:id', requireAuth, requireRoomGM, async (req, res, next) => {
  try {
    const count = await Character.count({ where: { roomId: req.room.id } });
    if (count > 0) throw new HttpError(409, 'Нельзя удалить комнату с персонажами');
    await req.room.destroy();
    res.status(204).send();
  } catch (e) { next(e); }
});

// POST /api/rooms/:id/join — вступление в комнату
router.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const room = await Room.findByPk(id);
    if (!room) throw new HttpError(404, 'Комната не найдена');
    if (!room.isActive) throw new HttpError(409, 'Комната в архиве, вступление невозможно');

    // Проверка «одна активная комната на пользователя»
    const existing = await RoomParticipant.findOne({
      where: { userId: req.user.id },
      include: [{ model: Room, as: 'room', where: { isActive: true }, required: true }],
    });
    if (existing) {
      if (existing.roomId === id) {
        throw new HttpError(409, 'Вы уже в этой комнате');
      }
      throw new HttpError(409, 'Вы уже в другой активной комнате. Сначала покиньте её.');
    }

    // Пароль для закрытой комнаты
    if (room.isPrivate) {
      const { password } = req.body;
      if (!password || typeof password !== 'string') {
        throw new HttpError(400, 'Для закрытой комнаты требуется пароль');
      }
      const ok = await bcrypt.compare(password, room.passwordHash || '');
      if (!ok) throw new HttpError(403, 'Неверный пароль комнаты');
    }

    const role = room.gameMasterId === req.user.id ? 'gm' : 'player';

    // Проверка лимита игроков (GM не считается)
    if (role === 'player') {
      const playersCount = await RoomParticipant.count({ where: { roomId: id, role: 'player' } });
      if (playersCount >= room.maxPlayers) {
        throw new HttpError(409, `Комната заполнена (максимум ${room.maxPlayers} игроков)`);
      }
    }

    // Если игрок выбрал персонажа — проверяем, что он из этой комнаты и не занят
    let characterId = null;
    if (role === 'player' && req.body.characterId !== undefined && req.body.characterId !== null) {
      const cid = Number(req.body.characterId);
      if (!Number.isInteger(cid)) throw new HttpError(400, 'characterId должен быть числом');
      const character = await Character.findByPk(cid);
      if (!character || character.roomId !== id) {
        throw new HttpError(400, 'Персонаж не из этой комнаты');
      }
      const taken = await RoomParticipant.findOne({ where: { roomId: id, characterId: cid } });
      if (taken) throw new HttpError(409, 'Этот персонаж уже занят');
      characterId = cid;
    }

    const participant = await RoomParticipant.create({
      roomId: id,
      userId: req.user.id,
      characterId,
      role,
    });

    res.status(201).json(participant);
  } catch (e) { next(e); }
});

// POST /api/rooms/:id/leave — покинуть комнату (GM не может, ему нужно архивировать)
router.post('/:id/leave', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const participant = await RoomParticipant.findOne({
      where: { roomId: id, userId: req.user.id },
    });
    if (!participant) throw new HttpError(404, 'Вы не участник этой комнаты');
    if (participant.role === 'gm') {
      throw new HttpError(409, 'GM не может покинуть свою комнату. Архивируйте её.');
    }
    await participant.destroy();
    res.status(204).send();
  } catch (e) { next(e); }
});

// DELETE /api/rooms/:id/participants/:userId — кик игрока (только GM)
router.delete('/:id/participants/:userId', requireAuth, requireRoomGM, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) throw new HttpError(400, 'userId должен быть числом');
    if (userId === req.user.id) {
      throw new HttpError(400, 'Нельзя кикнуть самого себя');
    }
    const participant = await RoomParticipant.findOne({
      where: { roomId: req.room.id, userId },
    });
    if (!participant) throw new HttpError(404, 'Участник не найден');
    await participant.destroy();
    res.json({ message: 'Игрок исключён из комнаты', userId });
  } catch (e) { next(e); }
});

module.exports = router;