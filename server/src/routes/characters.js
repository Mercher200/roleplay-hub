// src/routes/characters.js
const express = require('express');
const { Op } = require('sequelize');
const { Character, Room } = require('../../models');
const HttpError = require('../utils/HttpError');
const { validateCharacterBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const MAX_CHARACTERS_PER_ROOM = 5;

// helper: загружает персонажа и проверяет, что req.user — GM его комнаты
async function loadCharacterForGM(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'ID должен быть числом');
  const ch = await Character.findByPk(id);
  if (!ch) throw new HttpError(404, 'Персонаж не найден');
  const room = await Room.findByPk(ch.roomId);
  if (!room) throw new HttpError(404, 'Комната персонажа не найдена');
  if (room.gameMasterId !== req.user.id) {
    throw new HttpError(403, 'Только GM комнаты может изменять персонажей');
  }
  return { ch, room };
}

// GET /api/characters?roomId=1&search=гн — публичный
router.get('/', async (req, res, next) => {
  try {
    const where = {};

    // Фильтр по комнате
    if (req.query.roomId !== undefined) {
      const roomId = Number(req.query.roomId);
      if (!Number.isInteger(roomId)) throw new HttpError(400, 'roomId должен быть числом');
      where.roomId = roomId;
    }

    // Поиск по имени / расе / классу (регистронезависимо)
    if (req.query.search && typeof req.query.search === 'string') {
      const q = req.query.search.trim();
      if (q) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${q}%` } },
          { race: { [Op.iLike]: `%${q}%` } },
          { class: { [Op.iLike]: `%${q}%` } },
        ];
      }
    }

    const list = await Character.findAll({ where, order: [['id', 'ASC']] });
    res.json(list);
  } catch (e) { next(e); }
});

// GET /api/characters/:id — публичный
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'ID должен быть числом');
    const ch = await Character.findByPk(id);
    if (!ch) throw new HttpError(404, 'Персонаж не найден');
    res.json(ch);
  } catch (e) { next(e); }
});

// POST /api/characters — только GM комнаты
router.post('/', requireAuth, async (req, res, next) => {
  try {
    validateCharacterBody(req.body);
    const { roomId } = req.body;
    if (!Number.isInteger(roomId)) throw new HttpError(400, 'Поле "roomId" обязательно');

    const room = await Room.findByPk(roomId);
    if (!room) throw new HttpError(404, 'Комната не найдена');
    if (!room.isActive) throw new HttpError(409, 'Комната в архиве');
    if (room.gameMasterId !== req.user.id) {
      throw new HttpError(403, 'Только GM комнаты может создавать персонажей');
    }

    const count = await Character.count({ where: { roomId } });
    if (count >= MAX_CHARACTERS_PER_ROOM) {
      throw new HttpError(409, `Максимум ${MAX_CHARACTERS_PER_ROOM} персонажей на комнату`);
    }

    const ch = await Character.create({
      roomId,
      name: req.body.name.trim(),
      race: req.body.race,
      class: req.body.class,
      level: req.body.level ?? 1,
      hp: req.body.hp,
      maxHp: req.body.maxHp,
      strength: req.body.strength ?? 10,
      dexterity: req.body.dexterity ?? 10,
      intelligence: req.body.intelligence ?? 10,
      description: req.body.description ?? '',
    });
    res.status(201).json(ch);
  } catch (e) { next(e); }
});

// PUT /api/characters/:id — только GM комнаты
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { ch } = await loadCharacterForGM(req);
    validateCharacterBody({ ...ch.toJSON(), ...req.body });

    await ch.update({
      name: (req.body.name ?? ch.name).trim(),
      race: req.body.race ?? ch.race,
      class: req.body.class ?? ch.class,
      level: req.body.level ?? ch.level,
      hp: req.body.hp ?? ch.hp,
      maxHp: req.body.maxHp ?? ch.maxHp,
      strength: req.body.strength ?? ch.strength,
      dexterity: req.body.dexterity ?? ch.dexterity,
      intelligence: req.body.intelligence ?? ch.intelligence,
      description: req.body.description ?? ch.description,
    });
    res.json(ch);
  } catch (e) { next(e); }
});

// PATCH /api/characters/:id/stats — только GM комнаты (level, hp)
router.patch('/:id/stats', requireAuth, async (req, res, next) => {
  try {
    const { ch } = await loadCharacterForGM(req);

    const allowed = ['level', 'hp'];
    const errors = [];
    for (const key of Object.keys(req.body)) {
      if (!allowed.includes(key)) errors.push(`Поле "${key}" нельзя менять`);
      else if (!Number.isInteger(req.body[key]) || req.body[key] < 0) {
        errors.push(`Поле "${key}" должно быть целым неотрицательным`);
      }
    }
    if (errors.length) throw new HttpError(400, 'Некорректные данные', errors);
    if (req.body.hp !== undefined && req.body.hp > ch.maxHp) {
      throw new HttpError(400, 'hp не может превышать maxHp');
    }

    await ch.update({
      level: req.body.level ?? ch.level,
      hp: req.body.hp ?? ch.hp,
    });
    res.json(ch);
  } catch (e) { next(e); }
});

// DELETE /api/characters/:id — только GM комнаты
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { ch } = await loadCharacterForGM(req);
    await ch.destroy();
    res.status(204).send();
  } catch (e) { next(e); }
});

module.exports = router;