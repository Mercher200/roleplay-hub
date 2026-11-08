'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const hash = bcrypt.hashSync('password123', 10);
    await queryInterface.bulkInsert('Users', [
      {
        id: 1, username: 'gandalf', email: 'gandalf@example.com', passwordHash: hash,
        avatarUrl: null, bio: 'Серый маг, пришёл из-за моря', isVerified: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 2, username: 'aragorn', email: 'aragorn@example.com', passwordHash: hash,
        avatarUrl: null, bio: 'Следопыт Севера', isVerified: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]);
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), (SELECT MAX(id) FROM "Users"));`
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', null, {});
  },
};