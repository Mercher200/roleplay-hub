'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Room, { foreignKey: 'gameMasterId', as: 'masteredRooms' });
      User.hasMany(models.RoomParticipant, { foreignKey: 'userId', as: 'participations' });
    }
  }
  User.init({
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    avatarUrl: DataTypes.STRING,
    bio: DataTypes.TEXT,
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { sequelize, modelName: 'User' });
  return User;
};