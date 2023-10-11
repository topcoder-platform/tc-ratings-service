/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('RatingsHistory', {
      id: {
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER,
        unique: true
      },
      member_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Members', key: 'member_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating_type_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      challenge_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      submission_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      score: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0.00
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      volatility: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    queryInterface.addConstraint('RatingsHistory', {
      type: 'primary key',
      name: 'RatingsHistory_pkey',
      fields: ['member_id', 'rating_type_id', 'challenge_id']
    })
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('RatingsHistory')
  }
}
