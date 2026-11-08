'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rooms', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      gameMasterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      scenario: { type: Sequelize.TEXT, allowNull: false },
      isPrivate: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      passwordHash: { type: Sequelize.STRING, allowNull: true },
      maxPlayers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Rooms');
  },
};