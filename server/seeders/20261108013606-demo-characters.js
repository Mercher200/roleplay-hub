'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Characters', [
      { id: 1, roomId: 1, name: 'Гимли', race: 'Гном', class: 'Воин', level: 3, hp: 30, maxHp: 30, strength: 16, dexterity: 12, intelligence: 10, description: 'Сын Глоина', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, roomId: 1, name: 'Леголас', race: 'Эльф', class: 'Лучник', level: 3, hp: 24, maxHp: 24, strength: 12, dexterity: 18, intelligence: 14, description: 'Принц Лихолесья', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, roomId: 1, name: 'Боромир', race: 'Человек', class: 'Воин', level: 3, hp: 32, maxHp: 32, strength: 17, dexterity: 11, intelligence: 10, description: 'Сын Денетора', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, roomId: 2, name: 'Теоден', race: 'Человек', class: 'Всадник', level: 4, hp: 36, maxHp: 40, strength: 15, dexterity: 12, intelligence: 12, description: 'Король Рохана', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, roomId: 2, name: 'Эовин', race: 'Человек', class: 'Воительница', level: 4, hp: 28, maxHp: 28, strength: 13, dexterity: 15, intelligence: 13, description: 'Щитоносная Рохана', createdAt: new Date(), updatedAt: new Date() },
    ]);
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Characters"', 'id'), (SELECT MAX(id) FROM "Characters"));`
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Characters', null, {});
  },
};