'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Ratings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      this.belongsTo(models.Member, {
        foreignKey: 'member_id'
      })
    }
  }
  Ratings.init({
    // memberId: {
    //   type: DataTypes.INTEGER,
    //   field: 'member_id'
    // },
    rating_type_id: DataTypes.INTEGER,
    challenge_id: DataTypes.UUID,
    win_position: DataTypes.INTEGER,
    total_wins: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    volatility: DataTypes.INTEGER,
    ratings_count: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Ratings',
    timestamps: true
  })

  // Ratings.removeAttribute('id')

  return Ratings
}
