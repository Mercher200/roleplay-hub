// src/utils/dice.js
const HttpError = require('./HttpError');

// Парсит строку вида "2d6+3", "d20", "1d8-1"
// Возвращает { dice, count, sides, rolls, modifier, total }
function rollDice(notation) {
  if (typeof notation !== 'string' || !notation.trim()) {
    throw new HttpError(400, 'Укажите нотацию кубика, например "2d6+3"');
  }

  const match = notation.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    throw new HttpError(400, 'Неверная нотация. Пример: 2d6+3, d20, 1d8-1');
  }

  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;

  if (count < 1 || count > 10) throw new HttpError(400, 'Кубиков должно быть от 1 до 10');
  if (sides < 2 || sides > 100) throw new HttpError(400, 'Граней должно быть от 2 до 100');
  if (modifier < -100 || modifier > 100) throw new HttpError(400, 'Модификатор от -100 до +100');

  const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
  const total = rolls.reduce((s, v) => s + v, 0) + modifier;

  return {
    dice: notation.trim(),
    count,
    sides,
    rolls,
    modifier,
    total,
  };
}

module.exports = { rollDice };