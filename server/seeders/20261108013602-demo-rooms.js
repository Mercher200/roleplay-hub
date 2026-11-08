// seeders/XXXX-demo-rooms.js
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const roomPass = bcrypt.hashSync('roompass', 10);
    await queryInterface.bulkInsert('Rooms', [
      { id: 1, gameMasterId: 1, name: 'Тень над Морией', scenario: 'Отряд пытается пройти через древние шахты...', isPrivate: false, passwordHash: null, maxPlayers: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, gameMasterId: 2, name: 'Битва при Хельмовой Пади', scenario: 'Защита крепости от орды орков...', isPrivate: true, passwordHash: roomPass, maxPlayers: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Rooms"', 'id'), (SELECT MAX(id) FROM "Rooms"));`
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Rooms', null, {});
  },
};