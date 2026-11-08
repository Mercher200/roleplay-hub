'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    static associate(models) {
      Room.belongsTo(models.User, { foreignKey: 'gameMasterId', as: 'gameMaster' });
      Room.hasMany(models.Character, { foreignKey: 'roomId', as: 'characters', onDelete: 'CASCADE' });
      Room.hasMany(models.RoomParticipant, { foreignKey: 'roomId', as: 'participants', onDelete: 'CASCADE' });
    }
  }
  Room.init({
    gameMasterId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    scenario: { type: DataTypes.TEXT, allowNull: false },
    isPrivate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    passwordHash: { type: DataTypes.STRING, allowNull: true },
    maxPlayers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { sequelize, modelName: 'Room' });
  return Room;
};