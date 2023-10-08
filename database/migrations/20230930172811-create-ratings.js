'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Ratings', {
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
        type: Sequelize.STRING
      },
      challenge_id: {
        type: Sequelize.UUID
      },
      win_position: {
        type: Sequelize.INTEGER
      },
      total_wins: {
        type: Sequelize.INTEGER
      },
      rating: {
        type: Sequelize.INTEGER
      },
      volatility: {
        type: Sequelize.INTEGER
      },
      ratings_count: {
        type: Sequelize.INTEGER
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

    queryInterface.addConstraint('Ratings', {
      type: 'primary key',
      name: 'Ratings_pkey',
      fields: ['member_id', 'rating_type_id']
    })
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Ratings')
  }
}
