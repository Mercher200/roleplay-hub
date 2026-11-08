'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Character extends Model {
    static associate(models) {
      Character.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
    }
  }
  Character.init({
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    race: { type: DataTypes.STRING, allowNull: false },
    class: { type: DataTypes.STRING, allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    hp: { type: DataTypes.INTEGER, allowNull: false },
    maxHp: { type: DataTypes.INTEGER, allowNull: false },
    strength: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    dexterity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    intelligence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    description: DataTypes.TEXT,
  }, { sequelize, modelName: 'Character' });
  return Character;
};