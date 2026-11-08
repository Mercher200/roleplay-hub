'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RoomParticipants', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Rooms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      characterId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Characters', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      role: { type: Sequelize.ENUM('gm', 'player'), allowNull: false },
      joinedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    // один пользователь — одна запись в комнате
    await queryInterface.addConstraint('RoomParticipants', {
      fields: ['roomId', 'userId'],
      type: 'unique',
      name: 'room_participants_room_user_unique',
    });

    // один персонаж занят одним игроком
    await queryInterface.addConstraint('RoomParticipants', {
      fields: ['roomId', 'characterId'],
      type: 'unique',
      name: 'room_participants_room_character_unique',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RoomParticipants');
  },
};