'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomParticipant extends Model {
    static associate(models) {
      RoomParticipant.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
      RoomParticipant.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      RoomParticipant.belongsTo(models.Character, { foreignKey: 'characterId', as: 'character' });
    }
  }
  RoomParticipant.init({
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    characterId: { type: DataTypes.INTEGER, allowNull: true },
    role: { type: DataTypes.ENUM('gm', 'player'), allowNull: false },
    joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { sequelize, modelName: 'RoomParticipant' });
  return RoomParticipant;
};