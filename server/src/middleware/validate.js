// src/middleware/validate.js
const HttpError = require('../utils/HttpError');

const INT_FIELDS = ['level', 'hp', 'maxHp', 'strength', 'dexterity', 'intelligence'];

function validateRoomBody(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('Поле "name" обязательно и должно быть непустой строкой');
  }
  if (!body.scenario || typeof body.scenario !== 'string') {
    errors.push('Поле "scenario" обязательно и должно быть строкой');
  }
  if (body.isPrivate !== undefined && typeof body.isPrivate !== 'boolean') {
    errors.push('Поле "isPrivate" должно быть boolean');
  }
  if (body.maxPlayers !== undefined) {
    if (!Number.isInteger(body.maxPlayers) || body.maxPlayers < 1 || body.maxPlayers > 5) {
      errors.push('Поле "maxPlayers" должно быть целым числом от 1 до 5');
    }
  }
  if (errors.length) throw new HttpError(400, 'Некорректные данные комнаты', errors);
}

function validateCharacterBody(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('Поле "name" обязательно');
  }
  if (!body.race || typeof body.race !== 'string') errors.push('Поле "race" обязательно');
  if (!body.class || typeof body.class !== 'string') errors.push('Поле "class" обязательно');
  if (!Number.isInteger(body.hp) || body.hp < 0) errors.push('Поле "hp" должно быть целым неотрицательным');
  if (!Number.isInteger(body.maxHp) || body.maxHp < 1) errors.push('Поле "maxHp" должно быть целым положительным');
  if (body.hp > body.maxHp) errors.push('Поле "hp" не может превышать "maxHp"');
  for (const f of INT_FIELDS) {
    if (body[f] !== undefined && (!Number.isInteger(body[f]) || body[f] < 0)) {
      errors.push(`Поле "${f}" должно быть целым неотрицательным`);
    }
  }
  if (errors.length) throw new HttpError(400, 'Некорректные данные персонажа', errors);
}

module.exports = { validateRoomBody, validateCharacterBody };