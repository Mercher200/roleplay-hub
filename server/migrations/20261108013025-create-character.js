'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Characters', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Rooms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      race: { type: Sequelize.STRING, allowNull: false },
      class: { type: Sequelize.STRING, allowNull: false },
      // level добавим отдельной миграцией — требование ЛР2
      hp: { type: Sequelize.INTEGER, allowNull: false },
      maxHp: { type: Sequelize.INTEGER, allowNull: false },
      strength: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      dexterity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      intelligence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      description: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Characters');
  },
};