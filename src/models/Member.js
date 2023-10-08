'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      this.hasMany(models.Ratings, {
        foreignKey: 'member_id',
        as: 'ratings',
        onDelete: 'CASCADE'
      })
    }
  }
  Member.init({
    memberId: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      field: 'member_id'
    },
    handle: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Member',
    timestamps: true
  })

  Member.removeAttribute('id')

  return Member
}
