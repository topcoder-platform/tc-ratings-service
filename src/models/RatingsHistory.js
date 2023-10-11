const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class RatingsHistory extends Model {
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

  RatingsHistory.init({
    rating_type_id: DataTypes.INTEGER,
    challenge_id: DataTypes.UUID,
    submission_id: DataTypes.UUID,
    score: DataTypes.DOUBLE,
    rank: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    volatility: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'RatingsHistory',
    timestamps: true,
    freezeTableName: true
  })
  return RatingsHistory
}
